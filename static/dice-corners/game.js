// Dice Corners — rendering, input, audio and choreography.
//
// Rules live in game-logic.js and presentation maths in view-math.js (both
// unit-tested). This module only orchestrates: it commits one logical step,
// animates it, then commits the next, so the state is always consistent and
// every animation can be dropped on teardown.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as Logic from './game-logic.js';
import {
  DIE_SIZE,
  arrowToDirection,
  cellToWorld,
  choosePixelScale,
  createQualityGovernor,
  fitBoardView,
  rollPose,
  viewOffsetPixels,
  worldToCell
} from './view-math.js';
import { createAudio } from './audio.js';
import * as Art from './textures.js';
import { SoftRenderer } from './soft-renderer.js';
import { createOverlayShader, createSkyShader } from './soft-shaders.js';

const VERSION = '2.0.0';
const DIE_Y = DIE_SIZE / 2;
const CENTER = new THREE.Vector3(4, 0, 4);
const UP = new THREE.Vector3(0, 1, 0);
const POLAR = Math.atan2(8.6, 10.5); // the classic camera: 10.5 up, 8.6 back
const FOV = 42;
const BOARD_HALF = 5.35; // tiles ±4.5 plus the frame
const GUILDS = {
  1: { name: 'Moon', color: '#9fd4ff', deep: '#24508a' },
  2: { name: 'Ember', color: '#ff7a45', deep: '#a8322a' }
};
const QUALITY = [
  { name: 'high', shadow: 1024, pixelTarget: 30, particles: 1, relicLight: true },
  { name: 'balanced', shadow: 512, pixelTarget: 26, particles: 0.6, relicLight: true },
  { name: 'low', shadow: 0, pixelTarget: 22, particles: 0.35, relicLight: false }
];
// Without WebGL the CPU draws every art pixel, so the art pixels are a little
// chunkier (fewer of them per cell) and there are no shadow maps.
const SOFTWARE_QUALITY = [
  { name: 'software', shadow: 0, pixelTarget: 22, particles: 0.6, relicLight: true },
  { name: 'software-low', shadow: 0, pixelTarget: 17, particles: 0.35, relicLight: true }
];
const FLAG = { TRAIL: 1, ORIGIN: 2, HOVER: 4, PATH: 8, CURSOR: 16, MOVABLE: 32 };
const LINK = { NORTH: 1, SOUTH: 2, EAST: 4, WEST: 8 };
const SIDE_OF = { NORTH: 'SOUTH', SOUTH: 'NORTH', EAST: 'WEST', WEST: 'EAST' };

/* ---------------------------------------------------------------------------
   Tweens — a tiny promise-based engine driven by the render loop, so every
   animation pauses with the page and is dropped on teardown.
   --------------------------------------------------------------------------- */

const Ease = {
  linear: (/** @type {number} */ t) => t,
  outCubic: (/** @type {number} */ t) => 1 - Math.pow(1 - t, 3),
  inOutQuad: (/** @type {number} */ t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  inOutSine: (/** @type {number} */ t) => -(Math.cos(Math.PI * t) - 1) / 2,
  outBack: (/** @type {number} */ t) => 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2),
  outBounce: (/** @type {number} */ t) => {
    const n = 7.5625;
    const d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
    return n * (t -= 2.625 / d) * t + 0.984375;
  }
};

function createTweens() {
  const active = new Set();
  const keyed = new Map();
  const finish = (tween) => {
    active.delete(tween);
    if (tween.key && keyed.get(tween.key) === tween) keyed.delete(tween.key);
    tween.resolve();
  };
  return {
    /**
     * @param {number} duration seconds
     * @param {(value: number, t: number) => void} update
     * @param {{ ease?: (t: number) => number, key?: string }} [options]
     * @returns {Promise<void>}
     */
    run(duration, update, { ease = Ease.linear, key } = {}) {
      if (key && keyed.has(key)) finish(keyed.get(key));
      return new Promise((resolve) => {
        if (!(duration > 0)) {
          update(ease(1), 1);
          resolve();
          return;
        }
        const tween = { elapsed: 0, duration, update, ease, resolve, key };
        active.add(tween);
        if (key) keyed.set(key, tween);
        update(ease(0), 0);
      });
    },
    /** @param {number} seconds */
    wait(seconds) {
      return this.run(seconds, () => {});
    },
    /** @param {number} dt */
    tick(dt) {
      for (const tween of [...active]) {
        tween.elapsed += dt;
        const t = Math.min(1, tween.elapsed / tween.duration);
        tween.update(tween.ease(t), t);
        if (t >= 1) finish(tween);
      }
    },
    get count() {
      return active.size;
    },
    clear() {
      active.clear();
      keyed.clear();
    }
  };
}

/* ---------------------------------------------------------------------------
   Shaders
   --------------------------------------------------------------------------- */

const OVERLAY_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

// Luminous route markings: one plane over the board draws reachable cells,
// the hovered route, trail, origin, keyboard cursor, goal frames and relic ring
// from a 9×9 data texture. Lines use screen derivatives so they stay one art
// pixel wide at any zoom.
const OVERLAY_FRAGMENT = /* glsl */ `
uniform sampler2D uCells;
uniform float uTime;
uniform float uMotion;
uniform float uReveal;
uniform vec3 uAccent;
uniform vec3 uBone;
uniform vec3 uGold;
uniform vec4 uGoalA;
uniform vec3 uGoalAColor;
uniform vec4 uGoalB;
uniform vec3 uGoalBColor;
uniform float uGoalStrength;
uniform float uRelic;
varying vec2 vUv;

float bit(float flags, float b) { return mod(floor(flags / b + 0.001), 2.0); }

float goalBand(vec2 g, vec4 r, float px, float march) {
  float dx = min(g.x - r.x, r.z - g.x);
  float dy = min(g.y - r.y, r.w - g.y);
  if (dx < 0.0 || dy < 0.0) return 0.0;
  float d = min(dx, dy);
  float band = step(0.035, d) * step(d, 0.035 + 2.0 * px);
  float along = dx < dy ? g.y : g.x;
  float dash = step(0.35, fract(along * 2.0 - march));
  return band * dash;
}

void main() {
  vec2 g = vUv * 9.0;
  vec2 cell = floor(g);
  vec2 f = g - cell;
  float px = max(fwidth(g.x), fwidth(g.y));
  vec4 d = texture2D(uCells, (cell + 0.5) / 9.0);
  float dist = floor(d.r * 255.0 + 0.5);
  float flags = floor(d.g * 255.0 + 0.5);
  float links = floor(d.b * 255.0 + 0.5);
  float order = floor(d.a * 255.0 + 0.5);
  vec2 c = f - 0.5;
  vec2 ac = abs(c);
  float edge = 0.5 - max(ac.x, ac.y);
  float wave = uMotion * sin(uTime * 3.4);
  vec3 col = vec3(0.0);

  float march = uTime * 0.45 * uMotion;
  col += uGoalAColor * goalBand(g, uGoalA, px, march) * 0.95 * uGoalStrength;
  vec2 inA = step(uGoalA.xy, g) * step(g, uGoalA.zw);
  col += uGoalAColor * inA.x * inA.y * 0.035 * uGoalStrength;
  col += uGoalBColor * goalBand(g, uGoalB, px, 0.0) * 0.3 * uGoalStrength;

  if (cell.x == 4.0 && cell.y == 4.0) {
    float r = length(c);
    float ring = step(abs(r - 0.44), 0.9 * px) + 0.5 * step(abs(r - 0.39), 0.6 * px);
    col += uGold * ring * uRelic * (0.65 + 0.35 * sin(uTime * 2.0) * uMotion);
  }

  if (bit(flags, 32.0) > 0.5) {
    float tick = step(edge, 2.2 * px) * step(0.3, min(ac.x, ac.y));
    col += uAccent * tick * (1.1 + 0.3 * wave);
  }

  if (dist > 0.5) {
    float t = (uTime - uReveal) * 8.0 - dist;
    float appear = mix(1.0, clamp(t + 1.0, 0.0, 1.0), uMotion);
    float pulse = 0.8 + 0.2 * uMotion * sin(uTime * 3.4 - dist * 1.2);
    float frame = step(0.075, edge) * step(edge, 0.075 + 1.4 * px);
    float corner = step(0.25, min(ac.x, ac.y));
    col += uAccent * (frame * mix(0.55, 1.35, corner) + 0.17) * appear * pulse;
  }

  if (bit(flags, 1.0) > 0.5 && dist < 0.5) {
    col += uAccent * step(max(ac.x, ac.y), 0.07) * 0.45;
  }

  if (bit(flags, 2.0) > 0.5) {
    col += uAccent * step(abs(length(c) - 0.36), 0.9 * px) * 0.85;
  }

  if (bit(flags, 8.0) > 0.5) {
    float w = 1.1 * px;
    float line = 0.0;
    if (bit(links, 1.0) > 0.5) line = max(line, step(ac.x, w) * step(0.0, c.y));
    if (bit(links, 2.0) > 0.5) line = max(line, step(ac.x, w) * step(c.y, 0.0));
    if (bit(links, 4.0) > 0.5) line = max(line, step(ac.y, w) * step(0.0, c.x));
    if (bit(links, 8.0) > 0.5) line = max(line, step(ac.y, w) * step(c.x, 0.0));
    float node = step(max(ac.x, ac.y), 0.075);
    float chase = uMotion > 0.5 ? 0.35 + 0.65 * pow(0.5 + 0.5 * cos(uTime * 7.0 - order * 1.4), 3.0) : 0.85;
    col += mix(uBone, uAccent, 0.4) * max(line, node) * chase;
  }

  if (bit(flags, 4.0) > 0.5) {
    float frame = step(0.035, edge) * step(edge, 0.035 + 2.0 * px);
    col += uAccent * (0.32 + frame * 1.3);
  }

  if (bit(flags, 16.0) > 0.5) {
    float inset = 0.015 + 0.035 * (0.5 + 0.5 * sin(uTime * 5.0)) * uMotion;
    float bracket = step(inset, edge) * step(edge, inset + 2.0 * px) * step(0.28, min(ac.x, ac.y));
    col += uBone * bracket * 1.2;
  }

  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

const SKY_VERTEX = /* glsl */ `
varying vec3 vDir;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vDir = world.xyz - vec3(4.0, 0.0, 4.0);
  gl_Position = projectionMatrix * viewMatrix * world;
}`;

// Midnight void: a dithered plum gradient, a faint nebula and twinkling stars
// in every direction, so the table seems to float among them.
const SKY_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform float uMotion;
uniform vec3 uTop;
uniform vec3 uHorizon;
uniform vec3 uBottom;
uniform vec3 uNebula;
varying vec3 vDir;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float noise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float bayer(vec2 p) {
  vec2 q = mod(floor(p), 4.0);
  float m[16];
  m[0]=0.0; m[1]=8.0; m[2]=2.0; m[3]=10.0; m[4]=12.0; m[5]=4.0; m[6]=14.0; m[7]=6.0;
  m[8]=3.0; m[9]=11.0; m[10]=1.0; m[11]=9.0; m[12]=15.0; m[13]=7.0; m[14]=13.0; m[15]=5.0;
  return (m[int(q.y * 4.0 + q.x)] + 0.5) / 16.0;
}
void main() {
  vec3 dir = normalize(vDir);
  float h = dir.y;
  vec3 col = mix(uHorizon, uTop, smoothstep(0.0, 0.7, h));
  col = mix(col, uBottom, smoothstep(0.05, -0.7, h));
  float n = noise(dir * 3.2) * 0.6 + noise(dir * 7.1) * 0.4;
  col += uNebula * smoothstep(0.55, 0.9, n) * 0.55;
  vec3 p = dir * 95.0;
  vec3 cell = floor(p);
  float r = hash(cell);
  if (r > 0.93) {
    vec3 centre = cell + 0.5 + (vec3(hash(cell + 3.1), hash(cell + 7.7), hash(cell + 1.3)) - 0.5) * 0.5;
    float s = smoothstep(0.42, 0.0, length(p - centre));
    float tw = 0.65 + 0.35 * sin(uTime * (0.8 + r * 3.0) + r * 60.0) * uMotion;
    col += vec3(0.8, 0.76, 1.0) * s * tw * (r > 0.985 ? 1.0 : 0.45);
  }
  float levels = 20.0;
  col = floor(col * levels + bayer(gl_FragCoord.xy)) / levels;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

const SPARK_VERTEX = /* glsl */ `
attribute float aAlpha;
attribute float aSize;
attribute vec3 aColor;
uniform float uScale;
varying float vAlpha;
varying vec3 vColor;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = max(1.0, floor(aSize * uScale / -mv.z + 0.5));
  vAlpha = aAlpha;
  vColor = aColor;
}`;

const SPARK_FRAGMENT = /* glsl */ `
varying float vAlpha;
varying vec3 vColor;
void main() {
  if (vAlpha < 0.02) discard;
  gl_FragColor = vec4(vColor * vAlpha, 1.0);
  #include <colorspace_fragment>
}`;

/* ---------------------------------------------------------------------------
   Boot
   --------------------------------------------------------------------------- */

// three.js (r163+) only speaks WebGL 2. When the browser cannot create a
// WebGL 2 context — hardware acceleration off, GPU or driver blocklisted, a VM
// or remote desktop; Chromium stopped falling back to software GL in Chrome
// 137 — the game draws the same scene with the Canvas 2D software renderer.
// `?renderer=software` forces that path (handy for testing).
function webgl2Available() {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function wantsSoftware() {
  try {
    return new URLSearchParams(window.location.search).get('renderer') === 'software';
  } catch {
    return false;
  }
}

/**
 * The WebGL renderer, or the software renderer when `software` is set. If
 * WebGL fails, the canvas (which may already hold a dead context) is replaced
 * by a fresh one; then it falls back to software when `fallback` is set, or
 * rethrows so boot() can restart the whole game in software mode.
 * @param {HTMLCanvasElement} canvas
 * @param {{ software: boolean, fallback?: boolean, alpha?: boolean, powerPreference?: WebGLPowerPreference }} options
 * @returns {{ renderer: any, canvas: HTMLCanvasElement }}
 */
function createRenderer(
  canvas,
  { software, fallback = false, alpha = false, powerPreference = 'default' }
) {
  if (!software) {
    try {
      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false,
        alpha,
        powerPreference
      });
      return { renderer, canvas };
    } catch (error) {
      const fresh = /** @type {HTMLCanvasElement} */ (canvas.cloneNode(false));
      canvas.replaceWith(fresh);
      canvas = fresh;
      if (!fallback) throw error;
    }
  }
  try {
    return { renderer: new SoftRenderer({ canvas, alpha }), canvas };
  } catch {
    // the canvas is still bound to a WebGL context from a failed attempt
    const fresh = /** @type {HTMLCanvasElement} */ (canvas.cloneNode(false));
    canvas.replaceWith(fresh);
    return { renderer: new SoftRenderer({ canvas: fresh, alpha }), canvas: fresh };
  }
}

function readPref(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writePref(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode: preferences simply don't persist */
  }
}

/** Shows the failure card with the reason and logs the actual error. */
function failBoot(/** @type {unknown} */ error) {
  console.error('Dice Corners failed to start:', error);
  const detail = document.getElementById('fallback-detail');
  if (detail) detail.textContent = error instanceof Error ? error.message : String(error);
  document.documentElement.dataset.boot = 'failed';
}

function boot() {
  const root = document.documentElement;
  const software = wantsSoftware() || !webgl2Available();
  let game;
  try {
    game = createGame(software);
  } catch (error) {
    if (software) {
      failBoot(error);
      return;
    }
    // WebGL started but the game could not: retry on the software renderer
    console.warn('Dice Corners: WebGL start failed, using the software renderer.', error);
    try {
      game = createGame(true);
    } catch (retryError) {
      failBoot(retryError);
      return;
    }
  }
  root.dataset.boot = 'ready';
  Object.defineProperty(window, '__DICE_CORNERS__', {
    value: game.api,
    configurable: true,
    enumerable: false,
    writable: false
  });
  window.addEventListener(
    'pagehide',
    (event) => {
      if (!event.persisted) game.destroy();
    }
  );
}

/* ---------------------------------------------------------------------------
   The game
   --------------------------------------------------------------------------- */

/** @param {boolean} software draw with the Canvas 2D renderer instead of WebGL */
function createGame(software) {
  const $ = (/** @type {string} */ id) => /** @type {HTMLElement} */ (document.getElementById(id));
  const root = document.documentElement;
  const dom = {
    stage: /** @type {HTMLCanvasElement} */ ($('stage')),
    hudTop: $('hud-top'),
    hudTools: $('hud-tools'),
    dock: $('dock'),
    steps: $('steps'),
    budget: $('budget'),
    topChip: $('top-chip'),
    hint: $('hint'),
    preview: /** @type {HTMLCanvasElement} */ ($('die-preview')),
    undo: /** @type {HTMLButtonElement} */ ($('btn-undo')),
    redo: /** @type {HTMLButtonElement} */ ($('btn-redo')),
    sound: $('btn-sound'),
    motion: $('btn-motion'),
    help: $('btn-help'),
    turn: $('turn-num'),
    plates: { 1: $('plate-1'), 2: $('plate-2') },
    toast: $('toast'),
    banner: $('banner'),
    bannerTitle: $('banner-title'),
    bannerSub: $('banner-sub'),
    bannerSigil: /** @type {HTMLCanvasElement} */ ($('banner-sigil')),
    caption: $('caption'),
    announcer: $('announcer'),
    menu: $('menu'),
    start: /** @type {HTMLButtonElement} */ ($('btn-start')),
    rollResult: $('roll-result'),
    rollDice: { 1: $('roll-1'), 2: $('roll-2') },
    rulesButton: $('btn-rules'),
    rules: /** @type {HTMLDialogElement} */ ($('rules')),
    rulesClose: $('btn-rules-close'),
    win: $('win'),
    winTitle: $('win-title'),
    winSub: $('win-sub'),
    winSigil: /** @type {HTMLCanvasElement} */ ($('win-sigil')),
    again: /** @type {HTMLButtonElement} */ ($('btn-again')),
    grain: $('grain')
  };

  // First, so a WebGL failure throws before anything else is set up.
  const { renderer, canvas: stage } = createRenderer(dom.stage, {
    software,
    powerPreference: 'high-performance'
  });
  dom.stage = stage;
  root.dataset.renderer = software ? 'software' : 'webgl2';

  const lifetime = new AbortController();
  const { signal } = lifetime;
  const listen = (target, type, handler, options = {}) =>
    target.addEventListener(type, handler, { ...options, signal });

  const tweens = createTweens();
  const audio = createAudio({ muted: readPref('dice-corners:muted') === '1' });
  let reducedMotion = root.dataset.motion === 'reduced';
  const motion = () => (reducedMotion ? 0 : 1);
  const state = Logic.createInitialState();
  let busy = false;
  let destroyed = false;
  let entranceDone = false;
  let menuOpen = true;
  let winOpen = false;
  let cameraBusy = false;
  let time = 0;
  let revealAt = 0;
  let frameCount = 0;
  let fps = 60;
  let renderMs = 0;
  const errors = [];
  listen(window, 'error', (event) => errors.push(String(event.message || event)));
  listen(window, 'unhandledrejection', (event) => errors.push(String(event.reason)));

  const coarse = matchMedia('(pointer: coarse)').matches;
  const tiers = software ? SOFTWARE_QUALITY : QUALITY;
  const governor = createQualityGovernor({
    levels: tiers.length,
    start: coarse && !software ? 1 : 0
  });
  let quality = tiers[governor.level];
  let pixelScale = 1;

  /* ---------------- renderer, scene, camera ---------------- */

  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = quality.shadow > 0;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const maxAnisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(Art.PALETTE.void);
  scene.fog = new THREE.Fog(Art.PALETTE.void, 24, 64);

  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 500);
  camera.position.setFromSphericalCoords(15, POLAR, 0).add(CENTER);
  camera.lookAt(CENTER);

  const controls = new OrbitControls(camera, dom.stage);
  controls.target.copy(CENTER);
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.zoomSpeed = 0.9;
  controls.rotateSpeed = 0.8;
  controls.minPolarAngle = THREE.MathUtils.degToRad(20);
  controls.maxPolarAngle = THREE.MathUtils.degToRad(70);
  controls.update();

  const disposables = [];
  const keep = (/** @type {any} */ thing) => (disposables.push(thing), thing);

  const gradientMap = keep(
    new THREE.DataTexture(new Uint8Array([88, 150, 206, 255]), 4, 1, THREE.RedFormat)
  );
  gradientMap.minFilter = THREE.NearestFilter;
  gradientMap.magFilter = THREE.NearestFilter;
  gradientMap.needsUpdate = true;

  const texture = (/** @type {HTMLCanvasElement} */ canvas, nearestMin = false) => {
    const t = keep(new THREE.CanvasTexture(canvas));
    t.colorSpace = THREE.SRGBColorSpace;
    t.magFilter = THREE.NearestFilter;
    t.minFilter = nearestMin ? THREE.NearestFilter : THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = !nearestMin;
    t.anisotropy = maxAnisotropy;
    return t;
  };
  const toon = (params) => keep(new THREE.MeshToonMaterial({ gradientMap, ...params }));
  const geometry = (/** @type {THREE.BufferGeometry} */ g) => keep(g);

  /* ---------------- lights ---------------- */

  scene.add(new THREE.HemisphereLight(0x9a8ad0, 0x160c18, 1.35));
  const key = new THREE.DirectionalLight(0xe8e6ff, 2.5);
  key.position.set(CENTER.x - 5, 14, CENTER.z + 8);
  key.target.position.copy(CENTER);
  key.shadow.camera.left = -7.5;
  key.shadow.camera.right = 7.5;
  key.shadow.camera.top = 7.5;
  key.shadow.camera.bottom = -7.5;
  key.shadow.camera.near = 2;
  key.shadow.camera.far = 40;
  key.shadow.bias = -0.0008;
  key.shadow.normalBias = 0.02;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0xff9a6a, 0.7);
  rim.position.set(CENTER.x + 9, 5, CENTER.z - 9);
  scene.add(rim);
  const relicLight = new THREE.PointLight(0xffc857, 3.2, 4.2, 2);
  relicLight.position.set(4, 0.9, 4);
  scene.add(relicLight);

  /* ---------------- sky and table ---------------- */

  const skyUniforms = {
    uTime: { value: 0 },
    uMotion: { value: motion() },
    uTop: { value: new THREE.Color('#0c0818') },
    uHorizon: { value: new THREE.Color('#1c1030') },
    uBottom: { value: new THREE.Color('#050309') },
    uNebula: { value: new THREE.Color('#3a1f4a') }
  };
  const sky = new THREE.Mesh(
    geometry(new THREE.SphereGeometry(160, 32, 16)),
    keep(
      new THREE.ShaderMaterial({
        uniforms: skyUniforms,
        vertexShader: SKY_VERTEX,
        fragmentShader: SKY_FRAGMENT,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false
      })
    )
  );
  sky.material.userData.softSky = createSkyShader(skyUniforms);
  sky.position.copy(CENTER);
  sky.renderOrder = -10;
  scene.add(sky);

  const table = new THREE.Mesh(
    geometry(new THREE.CircleGeometry(15, 72)),
    toon({ map: texture(Art.tableTexture(), true) })
  );
  table.rotation.x = -Math.PI / 2;
  table.position.set(CENTER.x, -0.62, CENTER.z);
  table.receiveShadow = true;
  scene.add(table);

  /* ---------------- board ---------------- */

  const well = new THREE.Mesh(
    geometry(new THREE.BoxGeometry(9, 0.5, 9)),
    toon({ color: 0x0a060e })
  );
  well.position.set(4, -0.37, 4);
  well.receiveShadow = true;
  scene.add(well);

  // 81 carved tiles in one draw call: per-instance tone and atlas variant.
  const tileMaterial = toon({ map: texture(Art.tileAtlas()) });
  tileMaterial.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec2 atlas;')
      .replace(
        '#include <uv_vertex>',
        '#include <uv_vertex>\n#ifdef USE_MAP\nvMapUv = vMapUv * 0.5 + atlas;\n#endif'
      );
  };
  tileMaterial.customProgramCacheKey = () => 'dice-corners-tile-atlas';
  const tileGeometry = geometry(new THREE.BoxGeometry(0.94, 0.12, 0.94));
  const atlas = new Float32Array(81 * 2);
  // the same atlas offset for the software renderer: uv * 0.5 + atlas
  tileMaterial.userData.softUv = (/** @type {number} */ i) => [
    0.5,
    0.5,
    atlas[i * 2],
    atlas[i * 2 + 1]
  ];
  const tileRandom = Art.seeded(2718);
  const tiles = new THREE.InstancedMesh(tileGeometry, tileMaterial, 81);
  const tileTone = new THREE.Color();
  for (let i = 0; i < 81; i++) {
    const col = i % 9;
    const row = Math.floor(i / 9);
    const variant = Math.floor(tileRandom() * 4);
    atlas[i * 2] = (variant % 2) * 0.5;
    atlas[i * 2 + 1] = variant < 2 ? 0.5 : 0;
    const light = (col + row) % 2 === 0 ? 1 : 0.8;
    const jitter = 0.94 + tileRandom() * 0.1;
    tileTone.setRGB(light * jitter, light * jitter * 0.97, light * jitter);
    tiles.setColorAt(i, tileTone);
  }
  tileGeometry.setAttribute('atlas', new THREE.InstancedBufferAttribute(atlas, 2));
  tiles.receiveShadow = true;
  scene.add(tiles);
  const tileMatrix = new THREE.Matrix4();
  const setTileY = (/** @type {number} */ i, /** @type {number} */ y) => {
    const w = cellToWorld(i % 9, Math.floor(i / 9));
    tileMatrix.makeTranslation(w.x, y, w.z);
    tiles.setMatrixAt(i, tileMatrix);
  };
  for (let i = 0; i < 81; i++) setTileY(i, -0.06);
  tiles.instanceMatrix.needsUpdate = true;

  // frame rails with engraved coordinates, readable from each guild's side
  const railSide = toon({ color: 0x160e1d });
  const letters = 'ABCDEFGHI';
  const rail = (
    /** @type {number[]} */ size,
    /** @type {number[]} */ at,
    /** @type {HTMLCanvasElement} */ top
  ) => {
    const mesh = new THREE.Mesh(geometry(new THREE.BoxGeometry(size[0], 0.7, size[1])), [
      railSide,
      railSide,
      toon({ map: texture(top) }),
      railSide,
      railSide,
      railSide
    ]);
    mesh.position.set(at[0], -0.25, at[1]);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    scene.add(mesh);
  };
  const letterLabels = [...letters].map((char, c) => ({ at: c + 1.35, char }));
  rail(
    [10.7, 0.85],
    [4, 8.925],
    Art.railTexture({
      length: 10.7,
      width: 0.85,
      seed: 11,
      labels: letterLabels,
      flip: false,
      vertical: false
    })
  );
  rail(
    [10.7, 0.85],
    [4, -0.925],
    Art.railTexture({
      length: 10.7,
      width: 0.85,
      seed: 12,
      labels: letterLabels,
      flip: true,
      vertical: false
    })
  );
  const numberLabels = Array.from({ length: 9 }, (_, r) => ({ at: 8.5 - r, char: String(r + 1) }));
  rail(
    [0.85, 9],
    [-0.925, 4],
    Art.railTexture({
      length: 9,
      width: 0.85,
      seed: 13,
      labels: numberLabels,
      flip: false,
      vertical: true
    })
  );
  rail(
    [0.85, 9],
    [8.925, 4],
    Art.railTexture({
      length: 9,
      width: 0.85,
      seed: 14,
      labels: numberLabels,
      flip: true,
      vertical: true
    })
  );

  // corner gems: each guild's colour marks the corner of the zone it must fill
  const gemGeometry = geometry(new THREE.OctahedronGeometry(0.19, 0));
  for (const [x, z, color, emissive] of [
    [-0.925, -0.925, 0x9fd4ff, 0x1d4a7a],
    [8.925, 8.925, 0xff7a45, 0x6a1d0c],
    [-0.925, 8.925, 0x3a2850, 0x0],
    [8.925, -0.925, 0x3a2850, 0x0]
  ]) {
    const gem = new THREE.Mesh(gemGeometry, toon({ color, emissive }));
    gem.position.set(x, 0.24, z);
    gem.scale.y = 1.35;
    gem.castShadow = true;
    scene.add(gem);
  }

  const decal = (
    /** @type {HTMLCanvasElement} */ canvas,
    /** @type {number} */ size,
    /** @type {number} */ x,
    /** @type {number} */ z
  ) => {
    const mesh = new THREE.Mesh(
      geometry(new THREE.PlaneGeometry(size, size)),
      toon({
        map: texture(canvas),
        transparent: true,
        alphaTest: 0.5,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2
      })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.004, z);
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  };
  decal(
    Art.upscale(Art.sigilCanvas('moon', { size: 96, line: '#5d77b4', shade: '#0b0712' }), 2),
    3,
    1,
    1
  );
  decal(
    Art.upscale(Art.sigilCanvas('ember', { size: 96, line: '#b8573a', shade: '#0b0712' }), 2),
    3,
    7,
    7
  );
  decal(Art.relicSeal(), 0.94, 4, 4);

  const relic = new THREE.Mesh(
    geometry(new THREE.OctahedronGeometry(0.17, 0)),
    toon({ color: 0xffc857, emissive: 0x7a4a10 })
  );
  relic.scale.y = 1.7;
  relic.position.set(4, 0.64, 4);
  relic.castShadow = true;
  scene.add(relic);
  let relicHeight = 0.64;

  const pillar = new THREE.Mesh(
    geometry(new THREE.CylinderGeometry(0.44, 0.44, 5, 20, 1, true)),
    keep(
      new THREE.MeshBasicMaterial({
        color: 0xffc857,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      })
    )
  );
  pillar.position.set(4, 2.5, 4);
  pillar.visible = false;
  scene.add(pillar);

  const shockwave = new THREE.Mesh(
    geometry(new THREE.RingGeometry(0.42, 0.5, 48)),
    keep(
      new THREE.MeshBasicMaterial({
        color: 0xffc857,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    )
  );
  shockwave.rotation.x = -Math.PI / 2;
  shockwave.position.set(4, 0.02, 4);
  scene.add(shockwave);

  /* ---------------- route overlay ---------------- */

  const cells = new Uint8Array(81 * 4);
  const cellTexture = keep(new THREE.DataTexture(cells, 9, 9, THREE.RGBAFormat));
  cellTexture.minFilter = THREE.NearestFilter;
  cellTexture.magFilter = THREE.NearestFilter;
  cellTexture.needsUpdate = true;
  const goalRect = (/** @type {1 | 2} */ player) => {
    const z = Logic.HOME_ZONES[Logic.opponent(player)];
    return new THREE.Vector4(z.minCol, z.minRow, z.maxCol + 1, z.maxRow + 1);
  };
  const overlayUniforms = {
    uCells: { value: cellTexture },
    uTime: { value: 0 },
    uMotion: { value: motion() },
    uReveal: { value: 0 },
    uAccent: { value: new THREE.Color(GUILDS[1].color) },
    uBone: { value: new THREE.Color(Art.PALETTE.bone) },
    uGold: { value: new THREE.Color(Art.PALETTE.gold) },
    uGoalA: { value: goalRect(1) },
    uGoalAColor: { value: new THREE.Color(GUILDS[1].color) },
    uGoalB: { value: goalRect(2) },
    uGoalBColor: { value: new THREE.Color(GUILDS[2].color) },
    uGoalStrength: { value: 0.6 },
    uRelic: { value: 1 }
  };
  const overlay = new THREE.Mesh(
    geometry(new THREE.PlaneGeometry(9, 9)),
    keep(
      new THREE.ShaderMaterial({
        uniforms: overlayUniforms,
        vertexShader: OVERLAY_VERTEX,
        fragmentShader: OVERLAY_FRAGMENT,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    )
  );
  overlay.material.userData.softFragment = createOverlayShader(overlayUniforms, cells);
  overlay.rotation.x = -Math.PI / 2;
  overlay.position.set(4, 0.008, 4);
  overlay.renderOrder = 2;
  scene.add(overlay);

  /* ---------------- sparks ---------------- */

  const sparks = (() => {
    const max = 420;
    const g = geometry(new THREE.BufferGeometry());
    const position = new Float32Array(max * 3);
    const color = new Float32Array(max * 3);
    const alpha = new Float32Array(max);
    const size = new Float32Array(max);
    g.setAttribute(
      'position',
      new THREE.BufferAttribute(position, 3).setUsage(THREE.DynamicDrawUsage)
    );
    g.setAttribute('aColor', new THREE.BufferAttribute(color, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1).setUsage(THREE.DynamicDrawUsage));
    const material = keep(
      new THREE.ShaderMaterial({
        uniforms: { uScale: { value: 300 } },
        vertexShader: SPARK_VERTEX,
        fragmentShader: SPARK_FRAGMENT,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    );
    material.userData.softPoints = {
      color: 'aColor',
      alpha: 'aAlpha',
      size: 'aSize',
      scale: () => material.uniforms.uScale.value
    };
    const points = new THREE.Points(g, material);
    points.frustumCulled = false;
    points.renderOrder = 5;
    scene.add(points);
    const pool = Array.from({ length: max }, () => ({
      life: 0,
      max: 1,
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      size: 0.1,
      gravity: 4,
      color: new THREE.Color()
    }));
    let live = 0;
    const tint = new THREE.Color();
    return {
      material,
      /** @param {{ x: number, y: number, z: number, count: number, colors: string[], speed?: number, up?: number, life?: number, size?: number, gravity?: number, spread?: number }} o */
      burst({
        x,
        y,
        z,
        count,
        colors,
        speed = 1.6,
        up = 1.4,
        life = 0.8,
        size = 0.09,
        gravity = 4,
        spread = 0.15
      }) {
        const n = Math.max(1, Math.round(count * quality.particles * (reducedMotion ? 0.35 : 1)));
        let made = 0;
        for (const p of pool) {
          if (made >= n) break;
          if (p.life > 0) continue;
          const a = Math.random() * Math.PI * 2;
          const s = speed * (0.35 + Math.random() * 0.65);
          p.x = x + (Math.random() - 0.5) * spread;
          p.y = y;
          p.z = z + (Math.random() - 0.5) * spread;
          p.vx = Math.cos(a) * s;
          p.vz = Math.sin(a) * s;
          p.vy = up * (0.5 + Math.random() * 0.8);
          p.max = p.life = life * (0.6 + Math.random() * 0.6);
          p.size = size * (0.7 + Math.random() * 0.6);
          p.gravity = gravity;
          p.color.set(colors[made % colors.length]);
          made++;
        }
      },
      /** @param {number} dt */
      update(dt) {
        live = 0;
        for (let i = 0; i < max; i++) {
          const p = pool[i];
          if (p.life > 0) {
            p.life -= dt;
            p.vy -= p.gravity * dt;
            p.vx *= 1 - 1.8 * dt;
            p.vz *= 1 - 1.8 * dt;
            p.x += p.vx * dt;
            p.y = Math.max(0.02, p.y + p.vy * dt);
            p.z += p.vz * dt;
            live++;
          }
          const k = Math.max(0, p.life / p.max);
          position[i * 3] = p.x;
          position[i * 3 + 1] = p.y;
          position[i * 3 + 2] = p.z;
          tint.copy(p.color);
          color[i * 3] = tint.r;
          color[i * 3 + 1] = tint.g;
          color[i * 3 + 2] = tint.b;
          alpha[i] = p.life > 0 ? Math.min(1, k * 1.6) : 0;
          size[i] = p.size * (0.5 + 0.5 * k);
        }
        for (const name of ['position', 'aColor', 'aAlpha', 'aSize'])
          g.attributes[name].needsUpdate = true;
      },
      get live() {
        return live;
      }
    };
  })();

  /* ---------------- dice ---------------- */

  // One material per guild: the six faces share an atlas (3×2 slots in box
  // material order [+X,-X,+Y,-Y,+Z,-Z]), so each die is a single draw call.
  const dieGeometry = geometry(new THREE.BoxGeometry(DIE_SIZE, DIE_SIZE, DIE_SIZE));
  {
    const uv = dieGeometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      const slot = Math.floor(i / 4);
      const col = slot % 3;
      const row = Math.floor(slot / 3);
      uv.setXY(i, (col + uv.getX(i)) / 3, 1 - (row + 1) / 2 + uv.getY(i) / 2);
    }
    dieGeometry.clearGroups();
  }
  const faceAtlas = (/** @type {1 | 2} */ player) => {
    const { canvas, ctx } = Art.pixelCanvas(384, 256);
    Logic.FACE_ORDER.forEach((value, slot) => {
      ctx.drawImage(Art.dieFace(value, player), (slot % 3) * 128, Math.floor(slot / 3) * 128);
    });
    return canvas;
  };
  const faceMaterials = {
    1: toon({ map: texture(faceAtlas(1)) }),
    2: toon({ map: texture(faceAtlas(2)) })
  };
  const hull = (/** @type {number | string} */ color) =>
    keep(new THREE.MeshBasicMaterial({ color, side: THREE.BackSide }));
  const outline = {
    ink: hull(0x07050b),
    hover: hull(0xefe6d2),
    1: hull(0x9fd4ff),
    2: hull(0xff7a45)
  };

  const visuals = state.dice.map((die) => {
    const mesh = new THREE.Mesh(dieGeometry, faceMaterials[die.player]);
    mesh.castShadow = true;
    const shell = new THREE.Mesh(dieGeometry, outline.ink);
    shell.scale.setScalar(1.09);
    mesh.add(shell);
    mesh.userData.id = die.id;
    scene.add(mesh);
    return {
      id: die.id,
      mesh,
      shell,
      base: new THREE.Vector3(),
      lift: 0,
      drop: 0,
      shakeX: 0,
      squash: 1
    };
  });
  const diceMeshes = visuals.map((v) => v.mesh);
  const quat = new THREE.Quaternion();
  const toThree = (/** @type {Logic.Quat} */ q, target = new THREE.Quaternion()) =>
    target.set(q.x, q.y, q.z, q.w);

  const applyDie = (v) => {
    v.mesh.position.set(
      v.base.x + v.shakeX,
      v.base.y + v.lift + v.drop - (1 - v.squash) * DIE_Y,
      v.base.z
    );
    v.mesh.scale.set(1 + (1 - v.squash) * 0.5, v.squash, 1 + (1 - v.squash) * 0.5);
  };
  const restDie = (id) => {
    const die = state.dice[id];
    const v = visuals[id];
    const w = cellToWorld(die.col, die.row);
    v.base.set(w.x, DIE_Y, w.z);
    toThree(die.quat, v.mesh.quaternion);
    applyDie(v);
  };
  state.dice.forEach((d) => restDie(d.id));

  /* ---------------- die preview (second renderer) ---------------- */

  const preview = (() => {
    try {
      const made = createRenderer(dom.preview, { software, fallback: true, alpha: true });
      const r = made.renderer;
      dom.preview = made.canvas;
      r.outputColorSpace = THREE.SRGBColorSpace;
      const s = new THREE.Scene();
      s.add(new THREE.HemisphereLight(0xb9aee0, 0x1a0f14, 1.6));
      const light = new THREE.DirectionalLight(0xffffff, 2.2);
      light.position.set(1.5, 4, 2.5);
      s.add(light);
      const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
      cam.position.set(1.75, 1.55, 2.2);
      cam.lookAt(0, 0, 0);
      const c = new OrbitControls(cam, dom.preview);
      c.enableZoom = false;
      c.enablePan = false;
      c.enableDamping = true;
      c.rotateSpeed = 0.9;
      const holder = new THREE.Group();
      s.add(holder);
      const dice = {
        1: new THREE.Mesh(dieGeometry, faceMaterials[1]),
        2: new THREE.Mesh(dieGeometry, faceMaterials[2])
      };
      for (const d of Object.values(dice)) {
        const shell = new THREE.Mesh(dieGeometry, outline.ink);
        shell.scale.setScalar(1.07);
        d.add(shell);
      }
      let shown = null;
      const yaw = new THREE.Quaternion();
      return {
        resize() {
          const size = Math.max(32, dom.preview.clientWidth || 72);
          const ratio = Math.min(window.devicePixelRatio || 1, 2);
          r.setPixelRatio(1);
          r.setSize(Math.round((size * ratio) / 2), Math.round((size * ratio) / 2), false);
        },
        /** @param {number | null} id */
        show(id) {
          if (shown) holder.remove(shown);
          shown = id === null ? null : dice[state.dice[id].player];
          if (shown) holder.add(shown);
          else r.clear();
        },
        /** @param {number | null} id @param {number} azimuth */
        render(id, azimuth) {
          if (!shown || id === null) return;
          yaw.setFromAxisAngle(UP, -azimuth);
          shown.quaternion.copy(yaw).multiply(visuals[id].mesh.quaternion);
          c.update();
          r.render(s, cam);
        },
        dispose() {
          c.dispose();
          r.dispose();
        }
      };
    } catch {
      return null;
    }
  })();

  /* ---------------- overlay data ---------------- */

  let hoverDieId = /** @type {number | null} */ (null);
  let hoverCell = /** @type {{ col: number, row: number } | null} */ (null);
  let cursor = /** @type {{ col: number, row: number } | null} */ (null);
  let keyboardMode = false;
  const picking = () => state.phase === 'PLAYER_TURN' || state.phase === 'DIE_SELECTED';

  function previewTarget() {
    if (busy || state.phase !== 'DIE_SELECTED') return null;
    const target = hoverCell ?? (keyboardMode ? cursor : null);
    if (!target) return null;
    const rolls = Logic.planMove(state, target.col, target.row);
    return rolls.length ? { target, rolls } : null;
  }

  function updateOverlay() {
    cells.fill(0);
    const at = (/** @type {number} */ col, /** @type {number} */ row) => (row * 9 + col) * 4;
    const flag = (col, row, bit) => (cells[at(col, row) + 1] |= bit);
    const die = Logic.selectedDie(state);
    if (die) {
      if (state.phase === 'DIE_SELECTED' && !busy) {
        for (const node of Logic.selectionReach(state).values())
          cells[at(node.col, node.row)] = node.dist;
      }
      for (const cell of Logic.trailCells(state)) flag(cell.col, cell.row, FLAG.TRAIL);
      if (state.origin) flag(state.origin.col, state.origin.row, FLAG.ORIGIN);
      const plan = previewTarget();
      if (plan) {
        let col = die.col;
        let row = die.row;
        plan.rolls.forEach((direction, i) => {
          cells[at(col, row) + 2] |= LINK[direction];
          flag(col, row, FLAG.PATH);
          col += Logic.DIRECTIONS[direction].dc;
          row += Logic.DIRECTIONS[direction].dr;
          cells[at(col, row) + 2] |= LINK[SIDE_OF[direction]];
          cells[at(col, row) + 3] = i + 1;
          flag(col, row, FLAG.PATH);
        });
        flag(plan.target.col, plan.target.row, FLAG.HOVER);
      }
    } else if (state.phase === 'PLAYER_TURN' && !busy) {
      for (const d of state.dice) {
        if (Logic.canSelectDie(state, d.id)) flag(d.col, d.row, FLAG.MOVABLE);
      }
    }
    if (keyboardMode && cursor && picking()) flag(cursor.col, cursor.row, FLAG.CURSOR);
    cellTexture.needsUpdate = true;

    const player = state.currentPlayer;
    overlayUniforms.uAccent.value.set(GUILDS[player].color);
    overlayUniforms.uGoalA.value.copy(goalRect(player));
    overlayUniforms.uGoalAColor.value.set(GUILDS[player].color);
    overlayUniforms.uGoalB.value.copy(goalRect(Logic.opponent(player)));
    overlayUniforms.uGoalBColor.value.set(GUILDS[Logic.opponent(player)].color);
    overlayUniforms.uGoalStrength.value = state.phase === 'PREGAME' ? 0.55 : 1;
  }

  function updateOutlines() {
    for (const v of visuals) {
      const die = state.dice[v.id];
      const selected = state.selectedId === v.id;
      const hovered = hoverDieId === v.id && !selected;
      v.shell.material = selected ? outline[die.player] : hovered ? outline.hover : outline.ink;
      v.shell.scale.setScalar(selected ? 1.15 : hovered ? 1.12 : 1.09);
    }
  }

  /* ---------------- HUD ---------------- */

  const paintSigil = (
    /** @type {HTMLCanvasElement} */ canvas,
    /** @type {'moon' | 'ember'} */ kind
  ) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const line = kind === 'moon' ? GUILDS[1].color : GUILDS[2].color;
    ctx.drawImage(
      Art.sigilCanvas(kind, { size: canvas.width, line, shade: '#07050b', fill: '#1d1429' }),
      0,
      0
    );
  };
  document
    .querySelectorAll('canvas[data-sigil]')
    .forEach((c) =>
      paintSigil(/** @type {HTMLCanvasElement} */ (c), /** @type {any} */ (c).dataset.sigil)
    );
  paintSigil(dom.bannerSigil, 'moon');
  for (const player of [1, 2]) {
    const pips = dom.plates[player].querySelector('.pips');
    for (let i = 0; i < 9; i++) pips?.appendChild(document.createElement('i'));
    const rollDie = dom.rollDice[player];
    for (let i = 0; i < 9; i++) rollDie.appendChild(document.createElement('i'));
  }
  const setRollFace = (/** @type {1 | 2} */ player, /** @type {number} */ value) => {
    const on = new Set(Logic.PIP_LAYOUT[value].map(([gx, gy]) => (gy - 1) * 3 + (gx - 1)));
    [...dom.rollDice[player].children].forEach((pip, i) => pip.classList.toggle('on', on.has(i)));
  };
  setRollFace(1, 1);
  setRollFace(2, 1);

  const grainCanvas = Art.grainCanvas();
  let grainUrl = '';
  grainCanvas.toBlob((blob) => {
    if (!blob || destroyed) return;
    grainUrl = URL.createObjectURL(blob);
    dom.grain.style.backgroundImage = `url(${grainUrl})`;
  });

  let lastSteps = '';
  let shownPreview = /** @type {number | null} */ (null);
  function renderHud() {
    const player = state.currentPlayer;
    root.dataset.turn = String(player);
    dom.turn.textContent = String(state.turnNumber);
    for (const p of /** @type {const} */ ([1, 2])) {
      const plate = dom.plates[p];
      const active = state.phase !== 'PREGAME' && state.phase !== 'WIN' && p === player;
      plate.classList.toggle('active', active);
      const home = Logic.countInGoal(state, p);
      [...(plate.querySelector('.pips')?.children ?? [])].forEach((pip, i) =>
        pip.classList.toggle('on', i < home)
      );
      plate.setAttribute(
        'aria-label',
        `${GUILDS[p].name} guild, ${home} of 9 dice in the goal corner${active ? ', to move' : ''}`
      );
    }
    const die = Logic.selectedDie(state);
    if (die) dom.dock.removeAttribute('data-idle');
    else dom.dock.setAttribute('data-idle', '');
    const steps = die ? String(state.stepsRemaining) : '–';
    if (steps !== lastSteps) dom.steps.textContent = steps;
    lastSteps = steps;
    dom.budget.textContent = die
      ? `of ${state.stepBudget}`
      : state.phase === 'PREGAME'
        ? 'waiting'
        : 'pick a die';
    dom.topChip.textContent = die ? `TOP ${Logic.topFaceValue(die.quat)}` : 'TOP —';
    dom.undo.disabled = busy || !Logic.canUndo(state);
    dom.redo.disabled = busy || !Logic.canRedo(state);
    const name = `<b>${GUILDS[player].name}</b>`;
    let hint = '';
    const plan = previewTarget();
    if (state.phase === 'PREGAME') hint = 'Roll for the first move to begin.';
    else if (state.phase === 'WIN') hint = '';
    else if (busy && state.phase !== 'DIE_SELECTED')
      hint = state.phase === 'DIE_MOVING' ? 'Rolling…' : '';
    else if (state.phase === 'PLAYER_TURN')
      hint = `Pick a glowing ${name} die — its top face is your step count.`;
    else if (Logic.isSelectionBlocked(state))
      hint = 'Path blocked — undo to backtrack, then continue.';
    else if (plan) {
      const cell = Logic.cellLabel(plan.target.col, plan.target.row);
      hint = `Roll to <b>${cell}</b> · ${plan.rolls.length} step${plan.rolls.length === 1 ? '' : 's'}`;
    } else if (state.path.length === 0)
      hint = 'Roll to any lit cell, or pick the die again to drop it.';
    else {
      const n = state.stepsRemaining;
      hint = `${n} step${n === 1 ? '' : 's'} left — keep rolling, or undo to backtrack.`;
    }
    dom.hint.innerHTML = hint;
    const previewId = die ? die.id : null;
    if (previewId !== shownPreview) {
      shownPreview = previewId;
      preview?.show(previewId);
    }
  }

  function refresh() {
    renderHud();
    updateOverlay();
    updateOutlines();
  }

  function announce(/** @type {string} */ text) {
    dom.announcer.textContent = '';
    requestAnimationFrame(() => {
      if (!destroyed) dom.announcer.textContent = text;
    });
  }

  let toastAnimation = /** @type {Animation | null} */ (null);
  function toast(/** @type {string} */ text, ms = 1900) {
    dom.toast.textContent = text;
    toastAnimation?.cancel();
    toastAnimation = dom.toast.animate(
      [
        { opacity: 0, transform: 'translate(-50%, -6px)' },
        { opacity: 1, transform: 'translate(-50%, 0)', offset: 0.1 },
        { opacity: 1, transform: 'translate(-50%, 0)', offset: 0.85 },
        { opacity: 0, transform: 'translate(-50%, -4px)' }
      ],
      { duration: ms, easing: 'steps(12, end)' }
    );
  }

  function punchSteps(final = false) {
    const frames = reducedMotion
      ? [{ filter: 'brightness(2.2)' }, { filter: 'brightness(1)' }]
      : [
          {
            transform: `scale(${final ? 1.7 : 1.45}) rotate(${final ? -6 : -3}deg)`,
            filter: 'brightness(2.2)'
          },
          { transform: 'scale(0.9) rotate(1deg)', filter: 'brightness(1.3)', offset: 0.45 },
          { transform: 'scale(1)', filter: 'brightness(1)' }
        ];
    dom.steps.animate(frames, { duration: final ? 420 : 280, easing: 'ease-out' });
  }

  function shake(strength = 3) {
    if (reducedMotion) return;
    const s = strength;
    dom.stage.animate(
      [
        { translate: '0 0' },
        { translate: `${s}px ${-s}px` },
        { translate: `${-s}px ${s * 0.5}px` },
        { translate: `${s * 0.5}px 0` },
        { translate: '0 0' }
      ],
      { duration: 220, easing: 'steps(4, end)' }
    );
  }

  /** Turn banner: sweeps in, holds, sweeps out. Resolves when gone. */
  async function banner(
    /** @type {1 | 2} */ player,
    /** @type {string} */ title,
    /** @type {string} */ sub
  ) {
    paintSigil(dom.bannerSigil, player === 1 ? 'moon' : 'ember');
    dom.bannerTitle.textContent = title;
    dom.bannerSub.textContent = sub;
    const frames = reducedMotion
      ? [{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.82 }, { opacity: 0 }]
      : [
          { opacity: 0, transform: 'translate(-30%, -50%) skewX(-12deg)' },
          { opacity: 1, transform: 'translate(0, -50%) skewX(0)', offset: 0.22 },
          { opacity: 1, transform: 'translate(2%, -50%)', offset: 0.78 },
          { opacity: 0, transform: 'translate(30%, -50%) skewX(12deg)' }
        ];
    const animation = dom.banner.animate(frames, {
      duration: reducedMotion ? 1000 : 1450,
      easing: 'cubic-bezier(.2,.8,.2,1)'
    });
    await animation.finished.catch(() => {});
  }

  /* ---------------- layout: pixel scale + framing ---------------- */

  let view = { distance: 15, shiftX: 0, shiftY: 0 };
  let fittedDistance = 0;
  let bufferHeight = 1;
  function layout() {
    if (destroyed) return;
    const width = Math.max(1, document.documentElement.clientWidth);
    const height = Math.max(1, document.documentElement.clientHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const hudBottom = Math.max(
      dom.hudTop.getBoundingClientRect().bottom,
      dom.hudTools.getBoundingClientRect().bottom
    );
    const top = Math.min(height * 0.4, hudBottom + 10);
    const dockTop = dom.dock.getBoundingClientRect().top;
    const bottom = Math.max(height * 0.6, (dockTop > 0 ? dockTop : height) - 12);
    const side = Math.min(16, width * 0.03);
    const safe = {
      left: -1 + (2 * side) / width,
      right: 1 - (2 * side) / width,
      top: 1 - (2 * top) / height,
      bottom: 1 - (2 * bottom) / height
    };
    view = fitBoardView({
      aspect: width / height,
      fovY: FOV,
      polar: POLAR,
      azimuth: 0,
      halfExtent: BOARD_HALF,
      yRange: [-0.62, 0.9],
      safe
    });
    const cellCssPx = height / (2 * view.distance * Math.tan((FOV * Math.PI) / 360));
    pixelScale = choosePixelScale({
      cellCssPx,
      dpr,
      target: quality.pixelTarget,
      // the software renderer's cost grows with art pixels, so on huge or
      // dense screens let them grow instead of the buffer
      max: software ? 12 : 6
    });
    const bufferWidth = Math.max(1, Math.round((width * dpr) / pixelScale));
    bufferHeight = Math.max(1, Math.round((height * dpr) / pixelScale));
    renderer.setSize(bufferWidth, bufferHeight, false);
    dom.stage.style.width = `${(bufferWidth * pixelScale) / dpr}px`;
    dom.stage.style.height = `${(bufferHeight * pixelScale) / dpr}px`;
    camera.aspect = bufferWidth / bufferHeight;
    const offset = viewOffsetPixels(view, bufferWidth, bufferHeight);
    camera.setViewOffset(bufferWidth, bufferHeight, offset.x, offset.y, bufferWidth, bufferHeight);
    camera.updateProjectionMatrix();
    controls.minDistance = view.distance * 0.55;
    controls.maxDistance = view.distance * 1.5;
    const fitChanged = Math.abs(view.distance - fittedDistance) / view.distance > 0.02;
    fittedDistance = view.distance;
    if (!cameraBusy && fitChanged) {
      const offsetNow = camera.position.clone().sub(CENTER);
      const spherical = new THREE.Spherical().setFromVector3(offsetNow);
      camera.position
        .setFromSphericalCoords(view.distance, spherical.phi, spherical.theta)
        .add(CENTER);
      camera.lookAt(CENTER);
      controls.update();
    }
    scene.fog.near = view.distance + 3;
    scene.fog.far = view.distance + 42;
    sparks.material.uniforms.uScale.value = bufferHeight / (2 * Math.tan((FOV * Math.PI) / 360));
    preview?.resize();
  }
  let layoutQueued = false;
  const queueLayout = () => {
    if (layoutQueued) return;
    layoutQueued = true;
    requestAnimationFrame(() => {
      layoutQueued = false;
      layout();
    });
  };

  function applyQuality(level) {
    quality = tiers[level];
    const shadows = quality.shadow > 0;
    if (renderer.shadowMap.enabled !== shadows) {
      renderer.shadowMap.enabled = shadows;
      scene.traverse((o) => {
        const m = /** @type {any} */ (o).material;
        if (Array.isArray(m)) m.forEach((x) => (x.needsUpdate = true));
        else if (m) m.needsUpdate = true;
      });
    }
    key.castShadow = shadows;
    if (shadows) {
      key.shadow.mapSize.set(quality.shadow, quality.shadow);
      key.shadow.map?.dispose();
      key.shadow.map = null;
    }
    relicLight.visible = quality.relicLight;
    layout();
  }
  key.castShadow = quality.shadow > 0;
  key.shadow.mapSize.set(Math.max(quality.shadow, 256), Math.max(quality.shadow, 256));

  /* ---------------- animations ---------------- */

  const rollTime = () => (reducedMotion ? 0.12 : 0.26);

  /** One roll (or reverse roll) from a committed StepResult. */
  async function animateStep(step) {
    const v = visuals[step.dieId];
    const from = cellToWorld(step.from.col, step.from.row);
    const start = { x: from.x, y: DIE_Y, z: from.z };
    v.lift = 0;
    await tweens.run(rollTime(), (t) => {
      const pose = rollPose(start, step.fromQuat, step.direction, t);
      v.base.set(pose.position[0], pose.position[1], pose.position[2]);
      toThree(pose.quat, v.mesh.quaternion);
      applyDie(v);
    });
    restDie(step.dieId);
    const to = cellToWorld(step.to.col, step.to.row);
    sparks.burst({
      x: to.x,
      y: 0.04,
      z: to.z,
      count: 6,
      colors: ['#8a7aa6', '#efe6d2'],
      speed: 1.1,
      up: 0.7,
      life: 0.45,
      size: 0.07,
      spread: 0.6
    });
    tweens.run(
      reducedMotion ? 0 : 0.14,
      (t) => {
        v.squash = 1 - Math.sin(Math.PI * t) * 0.07;
        applyDie(v);
      },
      { key: `squash-${v.id}` }
    );
  }

  function squashSelect(/** @type {number} */ id) {
    const v = visuals[id];
    if (reducedMotion) return;
    tweens.run(
      0.34,
      (_, t) => {
        v.squash = 1 - Math.sin(t * Math.PI * 2) * Math.exp(-4 * t) * 0.16;
        applyDie(v);
      },
      { key: `squash-${id}` }
    );
    const w = v.base;
    sparks.burst({
      x: w.x,
      y: 0.05,
      z: w.z,
      count: 12,
      colors: [GUILDS[state.dice[id].player].color, '#efe6d2'],
      speed: 1.8,
      up: 1.1,
      life: 0.55,
      size: 0.08,
      spread: 0.7
    });
  }

  function deniedShake(/** @type {number} */ id) {
    const v = visuals[id];
    tweens.run(
      reducedMotion ? 0 : 0.28,
      (_, t) => {
        v.shakeX = Math.sin(t * Math.PI * 6) * (1 - t) * 0.06;
        applyDie(v);
      },
      { key: `shake-${id}` }
    );
  }

  function setLift(/** @type {number} */ id, /** @type {number} */ to) {
    const v = visuals[id];
    const from = v.lift;
    tweens.run(
      reducedMotion ? 0 : 0.12,
      (e) => {
        v.lift = from + (to - from) * e;
        applyDie(v);
      },
      { ease: Ease.outCubic, key: `lift-${id}` }
    );
  }

  async function settle(/** @type {number} */ id) {
    const v = visuals[id];
    await tweens.run(
      reducedMotion ? 0 : 0.2,
      (_, t) => {
        v.lift = Math.sin(Math.PI * t) * 0.06;
        applyDie(v);
      },
      { key: `lift-${id}` }
    );
    v.lift = 0;
    applyDie(v);
  }

  /** Centre relic: the die floats up, spins twice and settles showing 6 (classic playCenterBonus). */
  async function playBonus(bonus) {
    const v = visuals[bonus.dieId];
    const qStart = toThree(bonus.fromQuat);
    const qEnd = toThree(bonus.toQuat);
    const tmp = new THREE.Quaternion();
    const spin = new THREE.Quaternion();
    audio.bonus();
    announce('Relic! The die turns to six.');
    pillar.visible = true;
    const caption = dom.caption.animate(
      reducedMotion
        ? [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }]
        : [
            { opacity: 0, transform: 'translate(-50%, 20px) scale(0.6)' },
            { opacity: 1, transform: 'translate(-50%, 0) scale(1.08)', offset: 0.2 },
            { opacity: 1, transform: 'translate(-50%, -6px) scale(1)', offset: 0.8 },
            { opacity: 0, transform: 'translate(-50%, -24px) scale(1)' }
          ],
      { duration: 1500, easing: 'ease-out' }
    );
    let burst = false;
    const lift = reducedMotion ? 0.5 : 1.25;
    await tweens.run(
      reducedMotion ? 0.5 : 0.95,
      (t) => {
        v.lift = Math.sin(Math.PI * t) * lift;
        tmp.slerpQuaternions(qStart, qEnd, t);
        spin.setFromAxisAngle(UP, reducedMotion ? 0 : (1 - t) * 4 * Math.PI);
        v.mesh.quaternion.copy(spin).multiply(tmp).normalize();
        applyDie(v);
        pillar.material.opacity = Math.sin(Math.PI * t) * 0.35;
        pillar.scale.set(1, 0.3 + t * 0.7, 1);
        if (!burst && t > 0.5) {
          burst = true;
          sparks.burst({
            x: 4,
            y: DIE_Y + lift,
            z: 4,
            count: 60,
            colors: ['#ffc857', '#fff0c2', '#ff9a3c'],
            speed: 3,
            up: 2.4,
            life: 1.1,
            size: 0.1,
            gravity: 3
          });
        }
      },
      { ease: Ease.inOutSine }
    );
    pillar.visible = false;
    v.lift = 0;
    restDie(bonus.dieId);
    audio.step(0, true);
    shake(4);
    await tweens.run(
      reducedMotion ? 0 : 0.5,
      (e) => {
        shockwave.scale.setScalar(1 + e * 3.2);
        shockwave.material.opacity = (1 - e) * 0.8;
      },
      { ease: Ease.outCubic }
    );
    shockwave.material.opacity = 0;
    await caption.finished.catch(() => {});
  }

  /** The classic 180° turn camera: rotates the current offset half a turn about the board. */
  async function flipCamera(instant = false) {
    cameraBusy = true;
    controls.enabled = false;
    const offset = camera.position.clone().sub(CENTER);
    const startA = Math.atan2(offset.z, offset.x);
    const radius = Math.hypot(offset.x, offset.z);
    const h = offset.y;
    await tweens.run(
      instant || reducedMotion ? 0 : 0.9,
      (e) => {
        const a = startA + Math.PI * e;
        camera.position.set(
          CENTER.x + Math.cos(a) * radius,
          CENTER.y + h,
          CENTER.z + Math.sin(a) * radius
        );
        camera.lookAt(CENTER);
      },
      { ease: Ease.inOutQuad }
    );
    controls.update();
    controls.enabled = true;
    cameraBusy = false;
  }

  function cameraSide() {
    const azimuth = controls.getAzimuthalAngle();
    return Math.cos(azimuth) >= 0 ? 1 : 2;
  }

  async function transitionTo(/** @type {{ player: 1 | 2, turnNumber: number }} */ next) {
    reseatCursor();
    refresh();
    audio.turn(next.player);
    announce(`${GUILDS[next.player].name}'s move. Turn ${next.turnNumber}.`);
    await Promise.all([
      flipCamera(),
      banner(next.player, `${GUILDS[next.player].name}’s move`, `Turn ${next.turnNumber}`)
    ]);
  }

  async function celebrate(/** @type {1 | 2} */ winner) {
    audio.win(winner);
    announce(`${GUILDS[winner].name} wins on turn ${state.turnNumber}!`);
    const corner = winner === 1 ? { x: -0.5, z: -0.5 } : { x: 8.5, z: 8.5 };
    const mine = visuals.filter((v) => state.dice[v.id].player === winner);
    const colors = [GUILDS[winner].color, '#efe6d2', '#ffc857'];
    if (!reducedMotion) {
      await tweens.run(1.4, (_, t) => {
        for (const v of mine) {
          const d = Math.hypot(v.base.x - corner.x, v.base.z - corner.z) * 0.07;
          const local = Math.min(1, Math.max(0, (t - d) / 0.55));
          v.lift =
            Math.sin(local * Math.PI * 2) > 0 ? Math.abs(Math.sin(local * Math.PI * 2)) * 0.35 : 0;
          applyDie(v);
        }
        if (Math.random() < 0.35) {
          sparks.burst({
            x: corner.x + (winner === 1 ? 1.5 : -1.5),
            y: 2.5,
            z: corner.z + (winner === 1 ? 1.5 : -1.5),
            count: 14,
            colors,
            speed: 3.2,
            up: 2,
            life: 1.4,
            size: 0.1,
            gravity: 2.5,
            spread: 3
          });
        }
      });
      for (const v of mine) {
        v.lift = 0;
        applyDie(v);
      }
    } else {
      sparks.burst({ x: 4, y: 1, z: 4, count: 40, colors, speed: 2, up: 1, life: 1.2 });
    }
    paintSigil(dom.winSigil, winner === 1 ? 'moon' : 'ember');
    dom.winTitle.textContent = `${GUILDS[winner].name} wins`;
    dom.winSub.textContent = `All nine dice reached the far corner on turn ${state.turnNumber}.`;
    winOpen = true;
    dom.win.hidden = false;
    dom.win.animate([{ opacity: 0 }, { opacity: 1 }], { duration: reducedMotion ? 1 : 500 });
    dom.again.focus({ preventScroll: true });
  }

  /* ---------------- flows ---------------- */

  async function exclusive(/** @type {() => Promise<void>} */ fn) {
    if (busy || destroyed) return;
    busy = true;
    refresh();
    try {
      await fn();
    } finally {
      busy = false;
      if (!destroyed) refresh();
    }
  }

  async function afterRolls() {
    const outcome = Logic.finishMove(state);
    if (outcome === 'continue') {
      revealAt = time;
      overlayUniforms.uReveal.value = revealAt;
      return;
    }
    const die = Logic.selectedDie(state);
    if (!die) return;
    const onCenter = Logic.isCenterCell(die.col, die.row);
    if (!onCenter) settle(die.id);
    const result = Logic.completeTurn(state);
    if (!result) return;
    refresh();
    if (result.bonus) await playBonus(result.bonus);
    else shake(2);
    const moved = state.dice[result.dieId];
    if (Logic.isGoalCell(moved.player, moved.col, moved.row)) {
      const w = cellToWorld(moved.col, moved.row);
      audio.arrive();
      sparks.burst({
        x: w.x,
        y: 0.2,
        z: w.z,
        count: 18,
        colors: [GUILDS[moved.player].color, '#efe6d2'],
        speed: 1.6,
        up: 2,
        life: 0.8
      });
    }
    if (result.winner) {
      refresh();
      await celebrate(result.winner);
      return;
    }
    await tweens.wait(reducedMotion ? 0.05 : 0.15);
    let next = Logic.advanceTurn(state);
    while (next) {
      await transitionTo(next);
      if (!next.mustForfeit) break;
      const name = GUILDS[next.player].name;
      audio.forfeit();
      toast(`${name} has no die free to move — the turn passes.`, 2200);
      announce(`${name} has no die free to move. The turn passes.`);
      await tweens.wait(0.4 + (reducedMotion ? 0.4 : 0.8));
      next = Logic.advanceTurn(state);
    }
  }

  function moveTo(/** @type {number} */ col, /** @type {number} */ row) {
    return exclusive(async () => {
      const rolls = Logic.beginMove(state, col, row);
      if (!rolls) return;
      hoverCell = null;
      for (const direction of rolls) {
        const step = Logic.applyStep(state, direction);
        if (!step) break;
        refresh();
        await animateStep(step);
        const last = state.stepsRemaining === 0;
        audio.step(state.path.length - 1, last);
        punchSteps(last);
        renderHud();
        await tweens.wait(0.02);
      }
      const die = Logic.selectedDie(state);
      if (die) {
        announce(
          `Rolled to ${Logic.cellLabel(die.col, die.row)}, top face ${Logic.topFaceValue(die.quat)}. ${state.stepsRemaining} step${state.stepsRemaining === 1 ? '' : 's'} left.`
        );
      }
      await afterRolls();
    });
  }

  function undo() {
    audio.unlock();
    if (busy || !Logic.canUndo(state)) {
      if (!busy && Logic.selectedDie(state)) audio.denied();
      return;
    }
    return exclusive(async () => {
      const step = Logic.undoStep(state);
      if (!step) return;
      refresh();
      await animateStep(step);
      audio.undo();
      punchSteps();
      revealAt = time;
      overlayUniforms.uReveal.value = revealAt;
      announce(`Undone. ${state.stepsRemaining} steps left.`);
    });
  }

  function redo() {
    audio.unlock();
    if (busy || !Logic.canRedo(state)) {
      if (!busy && Logic.selectedDie(state)) audio.denied();
      return;
    }
    return exclusive(async () => {
      const step = Logic.redoStep(state);
      if (!step) return;
      refresh();
      await animateStep(step);
      audio.step(state.path.length - 1, state.stepsRemaining === 0);
      punchSteps(state.stepsRemaining === 0);
      await afterRolls();
    });
  }

  function pickDie(/** @type {number} */ id) {
    const die = state.dice[id];
    const result = Logic.clickDie(state, id);
    const name = GUILDS[die.player].name;
    if (result === 'selected') {
      audio.select(die.player);
      squashSelect(id);
      setLift(id, 0);
      revealAt = time;
      overlayUniforms.uReveal.value = revealAt;
      announce(
        `${name} die at ${Logic.cellLabel(die.col, die.row)} picked: ${state.stepBudget} step${state.stepBudget === 1 ? '' : 's'}.`
      );
    } else if (result === 'deselected') {
      audio.deselect();
      announce('Pick dropped.');
    } else if (result === 'stuck') {
      audio.denied();
      deniedShake(id);
      toast('Boxed in — pick a die with a free side.');
    } else if (result === 'locked') {
      audio.denied();
      toast('This die has already rolled — undo back to switch dice.');
    } else if (picking() && die.player !== state.currentPlayer) {
      toast(`That is an ${name} die — it is ${GUILDS[state.currentPlayer].name}’s turn.`, 1500);
    }
    refresh();
  }

  /* ---------------- pregame and play again ---------------- */

  async function tumbleRollDice(
    /** @type {number} */ moon,
    /** @type {number} */ ember,
    /** @type {number} */ seconds
  ) {
    let lastFace = -1;
    const animations = [1, 2].map((p) =>
      reducedMotion
        ? null
        : dom.rollDice[p].animate(
            [
              { transform: 'rotate(0deg) translateY(0)' },
              { transform: 'rotate(-14deg) translateY(-10px)' },
              { transform: 'rotate(10deg) translateY(-4px)' },
              { transform: 'rotate(-6deg) translateY(-8px)' },
              { transform: 'rotate(0deg) translateY(0)' }
            ],
            { duration: seconds * 1000, easing: 'steps(10, end)' }
          )
    );
    await tweens.run(seconds, (_, t) => {
      const face = Math.floor(t * 12);
      if (face !== lastFace && t < 1) {
        lastFace = face;
        setRollFace(1, 1 + Math.floor(Math.random() * 6));
        setRollFace(2, 1 + Math.floor(Math.random() * 6));
      }
    });
    animations.forEach((a) => a?.cancel());
    setRollFace(1, moon);
    setRollFace(2, ember);
  }

  let menuFade = /** @type {Animation | null} */ (null);
  async function hideMenu() {
    menuOpen = false;
    menuFade?.cancel();
    menuFade = dom.menu.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: reducedMotion ? 1 : 380,
      fill: 'forwards'
    });
    await menuFade.finished.catch(() => {});
    if (!menuOpen) dom.menu.hidden = true;
  }

  async function beginPlay(/** @type {1 | 2} */ first, instant = false) {
    Logic.startGame(state, first);
    reseatCursor();
    const fading = hideMenu();
    refresh();
    if (cameraSide() !== first) await flipCamera(instant);
    await fading;
    if (!instant) {
      audio.turn(first);
      await banner(first, `${GUILDS[first].name}’s move`, 'Turn 1');
    }
    announce(`${GUILDS[first].name} moves first. Turn 1.`);
    if (!destroyed && document.activeElement === document.body)
      dom.stage.focus({ preventScroll: true });
  }

  function startGame() {
    audio.unlock();
    audio.ui();
    if (state.phase !== 'PREGAME' || !entranceDone) return;
    dom.start.disabled = true;
    exclusive(async () => {
      const { rolls, firstPlayer } = Logic.rollForFirstPlayer();
      for (let i = 0; i < rolls.length; i++) {
        const [moon, ember] = rolls[i];
        dom.rollResult.textContent = 'Rolling…';
        audio.rattle();
        await tumbleRollDice(moon, ember, i === 0 ? 1 : 0.8);
        audio.step(Math.max(moon, ember) - 1, false);
        const tie = moon === ember;
        const winner = moon > ember ? 1 : 2;
        dom.rollResult.innerHTML =
          `Moon rolled <b class="p1">${moon}</b> · Ember rolled <b class="p2">${ember}</b> — ` +
          (tie
            ? 'a tie, rolling again…'
            : `<b class="p${winner}">${GUILDS[winner].name}</b> moves first`);
        await tweens.wait(tie ? 0.7 : 1.1);
      }
      await beginPlay(firstPlayer);
    });
  }

  async function playAgain() {
    audio.unlock();
    audio.ui();
    if (!winOpen) return;
    winOpen = false;
    dom.win.hidden = true;
    await exclusive(async () => {
      const from = visuals.map((v) => ({ pos: v.base.clone(), quat: v.mesh.quaternion.clone() }));
      Logic.resetGame(state);
      refresh();
      const target = new THREE.Quaternion();
      await tweens.run(reducedMotion ? 0 : 1.1, (_, t) => {
        visuals.forEach((v, i) => {
          const die = state.dice[i];
          const local = Math.min(1, Math.max(0, (t - (i % 9) * 0.03) / 0.7));
          const e = Ease.inOutQuad(local);
          const w = cellToWorld(die.col, die.row);
          v.base.set(
            from[i].pos.x + (w.x - from[i].pos.x) * e,
            DIE_Y + Math.sin(Math.PI * local) * 1.4,
            from[i].pos.z + (w.z - from[i].pos.z) * e
          );
          v.mesh.quaternion.slerpQuaternions(from[i].quat, toThree(die.quat, target), e);
          applyDie(v);
        });
      });
      state.dice.forEach((d) => restDie(d.id));
      if (cameraSide() !== 1) await flipCamera();
      setRollFace(1, 1);
      setRollFace(2, 1);
      dom.rollResult.textContent = '';
      menuOpen = true;
      menuFade?.cancel();
      dom.menu.hidden = false;
      menuFade = dom.menu.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: reducedMotion ? 1 : 380
      });
      dom.start.disabled = false;
      dom.start.focus({ preventScroll: true });
    });
  }

  async function entrance() {
    if (reducedMotion) {
      entranceDone = true;
      return;
    }
    const order = visuals.map((v, i) => i);
    visuals.forEach((v) => {
      v.drop = 4;
      applyDie(v);
    });
    relic.visible = false;
    await tweens.run(2.0, (_, t) => {
      for (let i = 0; i < 81; i++) {
        const col = i % 9;
        const row = Math.floor(i / 9);
        const delay = Math.hypot(col - 4, row - 4) * 0.045;
        const local = Math.min(1, Math.max(0, (t * 2.0 - delay) / 0.5));
        setTileY(i, -0.06 - (1 - Ease.outBack(local)) * 0.9);
      }
      tiles.instanceMatrix.needsUpdate = true;
      for (const i of order) {
        const v = visuals[i];
        const delay = 0.55 + (i % 9) * 0.05 + (i >= 9 ? 0.18 : 0);
        const local = Math.min(1, Math.max(0, (t * 2.0 - delay) / 0.6));
        const was = v.drop;
        v.drop = (1 - Ease.outBounce(local)) * 4;
        applyDie(v);
        if (was > 0.2 && v.drop <= 0.001 && local >= 1) {
          sparks.burst({
            x: v.base.x,
            y: 0.04,
            z: v.base.z,
            count: 4,
            colors: ['#6f5a8c'],
            speed: 0.8,
            up: 0.5,
            life: 0.4,
            size: 0.06
          });
        }
      }
      relic.visible = t > 0.6;
    });
    for (let i = 0; i < 81; i++) setTileY(i, -0.06);
    tiles.instanceMatrix.needsUpdate = true;
    visuals.forEach((v) => {
      v.drop = 0;
      applyDie(v);
    });
    relic.visible = true;
    entranceDone = true;
  }

  /* ---------------- input ---------------- */

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const boardPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hitPoint = new THREE.Vector3();
  let pointer = /** @type {{ x: number, y: number } | null} */ (null);
  let pointerDirty = false;
  let down = /** @type {{ x: number, y: number } | null} */ (null);

  function pick(/** @type {number} */ clientX, /** @type {number} */ clientY) {
    const rect = dom.stage.getBoundingClientRect();
    ndc.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(diceMeshes, false)[0];
    if (hit) return { dieId: /** @type {number} */ (hit.object.userData.id), cell: null };
    if (!raycaster.ray.intersectPlane(boardPlane, hitPoint)) return { dieId: null, cell: null };
    return { dieId: null, cell: worldToCell(hitPoint.x, hitPoint.z) };
  }

  function setHover(/** @type {number | null} */ dieId, cell) {
    const sameCell =
      (hoverCell && cell && hoverCell.col === cell.col && hoverCell.row === cell.row) ||
      (!hoverCell && !cell);
    if (dieId === hoverDieId && sameCell) return;
    if (hoverDieId !== null && hoverDieId !== dieId && hoverDieId !== state.selectedId)
      setLift(hoverDieId, 0);
    if (dieId !== null && dieId !== hoverDieId && dieId !== state.selectedId) setLift(dieId, 0.07);
    if (cell && !sameCell) audio.hover();
    hoverDieId = dieId;
    hoverCell = cell;
    dom.stage.style.cursor = dieId !== null || cell ? 'pointer' : '';
    refresh();
  }

  function updateHover() {
    if (!pointer || busy || !picking() || menuOpen || winOpen) {
      setHover(null, null);
      return;
    }
    const hit = pick(pointer.x, pointer.y);
    let dieId = null;
    let cell = null;
    if (hit.dieId !== null) {
      const die = state.dice[hit.dieId];
      if (hit.dieId === state.selectedId || Logic.canSelectDie(state, hit.dieId)) dieId = die.id;
    } else if (hit.cell && state.phase === 'DIE_SELECTED') {
      const reach = Logic.selectionReach(state);
      if (reach.has(Logic.cellKey(hit.cell.col, hit.cell.row))) cell = hit.cell;
    }
    setHover(dieId, cell);
  }

  function click(/** @type {number} */ clientX, /** @type {number} */ clientY) {
    audio.unlock();
    if (busy || !picking() || menuOpen || winOpen) return;
    const hit = pick(clientX, clientY);
    keyboardMode = false;
    if (hit.dieId !== null) pickDie(hit.dieId);
    else if (hit.cell && state.selectedId !== null) {
      const reach = Logic.selectionReach(state);
      if (reach.has(Logic.cellKey(hit.cell.col, hit.cell.row))) moveTo(hit.cell.col, hit.cell.row);
    }
  }

  listen(dom.stage, 'pointerdown', (e) => {
    audio.unlock();
    down = { x: e.clientX, y: e.clientY };
  });
  listen(dom.stage, 'pointerup', (e) => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    down = null;
    if (moved > 6) return; // a drag orbits the camera; only a still press is a click
    click(e.clientX, e.clientY);
  });
  listen(dom.stage, 'pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    pointer = { x: e.clientX, y: e.clientY };
    pointerDirty = true;
  });
  listen(dom.stage, 'pointerleave', () => {
    pointer = null;
    pointerDirty = true;
  });

  function describeCell(/** @type {number} */ col, /** @type {number} */ row) {
    const label = Logic.cellLabel(col, row);
    const die = Logic.dieAt(state, col, row);
    if (die)
      return `${label}: ${GUILDS[die.player].name} die showing ${Logic.topFaceValue(die.quat)}${state.selectedId === die.id ? ', picked' : ''}`;
    const node = Logic.selectionReach(state).get(Logic.cellKey(col, row));
    if (node) return `${label}: reachable in ${node.dist} step${node.dist === 1 ? '' : 's'}`;
    return `${label}: empty`;
  }

  function placeCursor() {
    if (cursor) return;
    const die = Logic.selectedDie(state) ?? state.dice.find((d) => Logic.canSelectDie(state, d.id));
    cursor = die ? { col: die.col, row: die.row } : { col: 4, row: 4 };
  }

  /** A new turn: put the keyboard cursor on one of the new player's dice. */
  function reseatCursor() {
    cursor = null;
    if (document.activeElement === dom.stage) placeCursor();
  }

  listen(dom.stage, 'focus', () => {
    keyboardMode = true;
    placeCursor();
    refresh();
  });
  listen(dom.stage, 'blur', () => {
    keyboardMode = false;
    refresh();
  });
  listen(dom.stage, 'keydown', (e) => {
    audio.unlock();
    if (menuOpen || winOpen) return;
    const direction = arrowToDirection(e.key, controls.getAzimuthalAngle());
    if (direction) {
      e.preventDefault();
      keyboardMode = true;
      placeCursor();
      if (!cursor) return;
      const col = cursor.col + Logic.DIRECTIONS[direction].dc;
      const row = cursor.row + Logic.DIRECTIONS[direction].dr;
      if (Logic.inBounds(col, row)) {
        cursor = { col, row };
        audio.hover();
        announce(describeCell(col, row));
      }
      refresh();
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      keyboardMode = true;
      placeCursor();
      if (busy || !picking() || !cursor) return;
      const die = Logic.dieAt(state, cursor.col, cursor.row);
      if (die) pickDie(die.id);
      else if (
        state.selectedId !== null &&
        Logic.selectionReach(state).has(Logic.cellKey(cursor.col, cursor.row))
      ) {
        moveTo(cursor.col, cursor.row);
      } else audio.denied();
      return;
    }
    if (e.key === 'Escape' && state.selectedId !== null && !busy) {
      e.preventDefault();
      pickDie(state.selectedId);
    }
  });
  listen(window, 'keydown', (e) => {
    if (dom.rules.open || menuOpen || winOpen || e.altKey) return;
    const mod = e.metaKey || e.ctrlKey;
    const k = e.key.toLowerCase();
    if ((k === 'z' && mod && !e.shiftKey) || (!mod && (k === 'u' || e.key === 'Backspace'))) {
      e.preventDefault();
      undo();
    } else if ((mod && (k === 'y' || (k === 'z' && e.shiftKey))) || (!mod && k === 'r')) {
      e.preventDefault();
      redo();
    } else if (!mod && e.key === '?') {
      openRules();
    }
  });

  listen(dom.undo, 'click', () => undo());
  listen(dom.redo, 'click', () => redo());
  listen(dom.start, 'click', startGame);
  listen(dom.again, 'click', playAgain);

  function openRules() {
    audio.unlock();
    audio.ui();
    if (!dom.rules.open) dom.rules.showModal();
  }
  listen(dom.help, 'click', openRules);
  listen(dom.rulesButton, 'click', openRules);
  listen(dom.rulesClose, 'click', () => {
    audio.ui();
    dom.rules.close();
  });
  listen(dom.rules, 'click', (e) => {
    if (e.target === dom.rules) dom.rules.close();
  });

  const syncToggles = () => {
    dom.sound.setAttribute('aria-pressed', String(!audio.muted));
    dom.sound.setAttribute(
      'aria-label',
      audio.muted ? 'Sound off — turn sound on' : 'Sound on — mute'
    );
    dom.motion.setAttribute('aria-pressed', String(reducedMotion));
  };
  syncToggles();
  listen(dom.sound, 'click', () => {
    audio.unlock();
    audio.setMuted(!audio.muted);
    writePref('dice-corners:muted', audio.muted ? '1' : '0');
    syncToggles();
    audio.ui();
    toast(audio.muted ? 'Sound off' : 'Sound on', 1100);
  });
  listen(dom.motion, 'click', () => {
    audio.unlock();
    reducedMotion = !reducedMotion;
    root.dataset.motion = reducedMotion ? 'reduced' : 'full';
    writePref('dice-corners:motion', reducedMotion ? 'reduced' : 'full');
    overlayUniforms.uMotion.value = motion();
    skyUniforms.uMotion.value = motion();
    syncToggles();
    audio.ui();
    toast(reducedMotion ? 'Reduced motion on' : 'Full motion on', 1100);
  });

  listen(window, 'resize', queueLayout);
  if (document.fonts?.ready) document.fonts.ready.then(queueLayout, () => {});
  if (window.ResizeObserver) {
    const observer = new ResizeObserver(queueLayout);
    observer.observe(dom.hudTop);
    observer.observe(dom.dock);
    observer.observe(dom.hudTools);
    signal.addEventListener('abort', () => observer.disconnect());
  }
  listen(dom.stage, 'webglcontextlost', (e) => {
    e.preventDefault();
    toast('The graphics context was lost — reload the page to keep playing.', 6000);
  });

  /* ---------------- loop ---------------- */

  let raf = 0;
  let last = performance.now();
  function frame(now) {
    if (destroyed) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
    last = now;
    time += dt;
    frameCount++;
    if (dt > 0) fps += (1 / dt - fps) * 0.05;
    tweens.tick(dt);
    if (pointerDirty) {
      pointerDirty = false;
      updateHover();
    }
    if (!cameraBusy) controls.update();
    const occupied = Logic.dieAt(state, 4, 4) !== null;
    relicHeight += ((occupied ? 1.45 : 0.64) - relicHeight) * Math.min(1, dt * 3);
    relic.position.y = relicHeight + (reducedMotion ? 0 : Math.sin(time * 1.6) * 0.05);
    if (!reducedMotion) relic.rotation.y += dt * 0.9;
    overlayUniforms.uRelic.value +=
      ((occupied ? 0.25 : 1) - overlayUniforms.uRelic.value) * Math.min(1, dt * 3);
    relicLight.intensity = (occupied ? 1.2 : 3.2) + (reducedMotion ? 0 : Math.sin(time * 2) * 0.4);
    overlayUniforms.uTime.value = time;
    skyUniforms.uTime.value = time;
    sparks.update(dt);
    const renderStart = performance.now();
    renderer.render(scene, camera);
    preview?.render(state.selectedId, controls.getAzimuthalAngle());
    renderMs += (performance.now() - renderStart - renderMs) * 0.05;
    if (entranceDone) {
      const next = governor.sample(dt * 1000);
      if (next !== null) applyQuality(next);
    }
  }

  /* ---------------- start ---------------- */

  layout();
  refresh();
  raf = requestAnimationFrame(frame);
  entrance().then(() => {
    if (destroyed) return;
    dom.start.disabled = false;
    dom.hint.textContent = 'Roll for the first move to begin.';
    if (menuOpen && (document.activeElement === document.body || !document.activeElement)) {
      dom.start.focus({ preventScroll: true });
    }
  });

  /* ---------------- debug / test API ---------------- */

  const idle = () => !busy && tweens.count === 0 && entranceDone;
  const project = (/** @type {THREE.Vector3} */ p) => {
    p.project(camera);
    const rect = dom.stage.getBoundingClientRect();
    return {
      x: rect.left + ((p.x + 1) / 2) * rect.width,
      y: rect.top + ((1 - p.y) / 2) * rect.height
    };
  };
  async function skipPregame(/** @type {1 | 2} */ player) {
    if (player !== 1 && player !== 2) throw new Error('skipPregame expects 1 (Moon) or 2 (Ember)');
    while (!entranceDone || busy) await new Promise((r) => setTimeout(r, 30));
    if (state.phase !== 'PREGAME') return false;
    await exclusive(() => beginPlay(player, true));
    return true;
  }
  const testMode = new URLSearchParams(window.location.search).get('test') === '1';
  const api = Object.freeze({
    version: VERSION,
    getState: () => ({
      ...Logic.snapshotState(state),
      busy,
      screen: winOpen ? 'win' : menuOpen ? 'menu' : 'board',
      cameraSide: cameraSide(),
      cursor: keyboardMode && cursor ? { ...cursor } : null
    }),
    getDiagnostics: () => ({
      version: VERSION,
      renderer: software ? 'software' : 'webgl2',
      webgl: software ? 'none' : 'webgl2',
      quality: quality.name,
      pixelScale,
      buffer: { width: dom.stage.width, height: dom.stage.height },
      cameraDistance: Number(camera.position.distanceTo(CENTER).toFixed(3)),
      fps: Math.round(fps),
      renderMs: Number(renderMs.toFixed(2)),
      frames: frameCount,
      drawCalls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      activeTweens: tweens.count,
      sparks: sparks.live,
      reducedMotion,
      muted: audio.muted,
      audio: audio.state,
      preview: preview !== null,
      errors: [...errors]
    }),
    ...(testMode ? { skipPregame, startWithPlayer: skipPregame } : {}),
    /** Screen position (CSS px) of a cell's centre on the board surface. */
    cellToScreen: (/** @type {number} */ col, /** @type {number} */ row) => {
      const w = cellToWorld(col, row);
      return project(new THREE.Vector3(w.x, 0.01, w.z));
    },
    /** Screen position (CSS px) of the top face of a die. */
    dieToScreen: (/** @type {number} */ id) => {
      const die = state.dice[id];
      if (!die) return null;
      const w = cellToWorld(die.col, die.row);
      return project(new THREE.Vector3(w.x, DIE_SIZE * 0.98, w.z));
    },
    whenIdle: async (timeoutMs = 20000) => {
      const start = performance.now();
      while (!idle()) {
        if (performance.now() - start > timeoutMs) return false;
        await new Promise((r) => setTimeout(r, 30));
      }
      return true;
    }
  });

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    cancelAnimationFrame(raf);
    lifetime.abort();
    tweens.clear();
    toastAnimation?.cancel();
    controls.dispose();
    preview?.dispose();
    for (const thing of disposables) thing.dispose?.();
    tiles.dispose();
    renderer.dispose();
    audio.close();
    if (grainUrl) URL.revokeObjectURL(grainUrl);
    delete (/** @type {any} */ (window).__DICE_CORNERS__);
  }

  return { api, destroy };
}

boot();
