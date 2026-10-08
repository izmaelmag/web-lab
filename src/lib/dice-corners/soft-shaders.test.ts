import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  createOverlayShader,
  createSkyShader,
  nebulaMask,
  skyHash,
  smoothstep
} from '../../../static/dice-corners/soft-shaders.js';

const skyUniforms = () => ({
  uTime: { value: 0 },
  uMotion: { value: 1 },
  uTop: { value: new THREE.Color('#0c0818') },
  uHorizon: { value: new THREE.Color('#1c1030') },
  uBottom: { value: new THREE.Color('#050309') },
  uNebula: { value: new THREE.Color('#3a1f4a') }
});

const overlayUniforms = () => ({
  uTime: { value: 0 },
  uMotion: { value: 0 },
  uReveal: { value: -10 },
  uAccent: { value: new THREE.Color('#9fd4ff') },
  uBone: { value: new THREE.Color('#efe6d2') },
  uGold: { value: new THREE.Color('#ffc857') },
  uGoalA: { value: new THREE.Vector4(6, 6, 9, 9) },
  uGoalAColor: { value: new THREE.Color('#9fd4ff') },
  uGoalB: { value: new THREE.Vector4(0, 0, 3, 3) },
  uGoalBColor: { value: new THREE.Color('#ff7a45') },
  uGoalStrength: { value: 1 },
  uRelic: { value: 1 }
});

describe('GLSL helpers', () => {
  it('ports smoothstep and the sky hash', () => {
    expect(smoothstep(0, 1, -1)).toBe(0);
    expect(smoothstep(0, 1, 0.5)).toBe(0.5);
    expect(smoothstep(0, 1, 2)).toBe(1);
    expect(smoothstep(0.42, 0, 0)).toBe(1); // reversed edges, as the star shader uses
    for (let i = 0; i < 50; i++) {
      const h = skyHash(i * 1.7, i * -2.3, i * 0.9);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(1);
    }
    expect(nebulaMask(0, 1, 0)).toBeGreaterThanOrEqual(0);
    expect(nebulaMask(0, 1, 0)).toBeLessThanOrEqual(1);
  });
});

describe('sky shader port', () => {
  it('grades from the bottom colour below the horizon to the top colour overhead', () => {
    const uniforms = skyUniforms();
    const sky = createSkyShader(uniforms);
    sky.begin();
    const out = new Float32Array(4);
    // straight down: fully the bottom colour (no nebula / stars can brighten it much)
    sky.shade(0, -1, 0, 0, 0, out);
    expect(out[0]).toBeLessThan(uniforms.uHorizon.value.r);
    // the dithered gradient never strays more than one 1/20 level from the colour
    const top = uniforms.uTop.value;
    let darkest = Infinity;
    for (let i = 0; i < 16; i++) {
      sky.shade(0, 1, 0, i % 4, i >> 2, out);
      darkest = Math.min(darkest, out[2]);
    }
    expect(darkest).toBeLessThanOrEqual(top.b + 0.05 + 1e-6);
  });

  it('reports twinkling stars as animated pixels only while motion is on', () => {
    const uniforms = skyUniforms();
    const sky = createSkyShader(uniforms, { faceSize: 8 });
    const out = new Float32Array(4);
    const scan = () => {
      sky.begin();
      let live = 0;
      for (let i = 0; i < 4000; i++) {
        const a = (i / 4000) * Math.PI * 2;
        const b = ((i * 7) % 4000) / 4000 - 0.5;
        const d = [Math.cos(a), b, Math.sin(a)];
        const l = Math.hypot(d[0], d[1], d[2]);
        if (sky.shade(d[0] / l, d[1] / l, d[2] / l, i, i, out)) live++;
      }
      return live;
    };
    expect(scan()).toBeGreaterThan(0);
    uniforms.uMotion.value = 0;
    expect(scan()).toBe(0);
    expect(sky.version).toBe(0);
  });
});

describe('route overlay shader port', () => {
  const sample = (
    shader: ReturnType<typeof createOverlayShader>,
    col: number,
    row: number,
    fx = 0.5,
    fy = 0.5
  ) => {
    const out = new Float32Array(4);
    const px = 1 / 9 / 30; // ~30 screen pixels per cell
    const lit = shader.shade((col + fx) / 9, (row + fy) / 9, px, px, out);
    return { lit, out: [...out] };
  };

  it('adds nothing on an empty cell away from the goals and the relic', () => {
    const cells = new Uint8Array(81 * 4);
    const shader = createOverlayShader(overlayUniforms(), cells);
    shader.begin();
    expect(sample(shader, 4, 1).lit).toBe(false);
  });

  it('lights reachable cells in the accent colour and the hovered cell brighter', () => {
    const cells = new Uint8Array(81 * 4);
    const uniforms = overlayUniforms();
    const shader = createOverlayShader(uniforms, cells);
    const at = (col: number, row: number) => (row * 9 + col) * 4;
    cells[at(4, 1)] = 2; // reachable in two steps
    shader.begin();
    const reach = sample(shader, 4, 1);
    expect(reach.lit).toBe(true);
    // a uniform 0.17 · accent glow (times the pulse, which is 0.8 without motion)
    expect(reach.out[2]).toBeCloseTo(uniforms.uAccent.value.b * 0.17 * 0.8, 5);
    cells[at(4, 1) + 1] = 4; // HOVER
    const hover = sample(shader, 4, 1);
    expect(hover.out[2]).toBeGreaterThan(reach.out[2]);
  });

  it('draws the relic ring on the centre cell and the dashed goal frame', () => {
    const cells = new Uint8Array(81 * 4);
    const shader = createOverlayShader(overlayUniforms(), cells);
    shader.begin();
    const ring = sample(shader, 4, 4, 0.5 + 0.44, 0.5);
    expect(ring.lit).toBe(true);
    expect(ring.out[0]).toBeGreaterThan(ring.out[2]); // gold
    const centre = sample(shader, 4, 4, 0.5, 0.5);
    expect(centre.lit).toBe(false);
    // inside goal A: at least the faint wash
    const inGoal = sample(shader, 7, 7);
    expect(inGoal.lit).toBe(true);
  });
});
