// Dice Corners — JavaScript ports of the game's GLSL shaders.
//
// The software renderer (soft-renderer.js) cannot run GLSL, so the sky and the
// route overlay carry these line-by-line ports in material.userData. They read
// the very same uniform objects the WebGL shaders use, so both paths stay in
// sync. Colours are produced in linear light, exactly like the shaders before
// <colorspace_fragment>. No DOM, no WebGL.

/** @param {number} x */
const fract = (x) => x - Math.floor(x);
/** @param {number} e0 @param {number} e1 @param {number} x */
export const smoothstep = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
/** GLSL step(): 0 below the edge, 1 at or above it. @param {number} e @param {number} x */
const step = (e, x) => (x < e ? 0 : 1);

/* ---------------------------------------------------------------------------
   Sky
   --------------------------------------------------------------------------- */

/** @param {number} x @param {number} y @param {number} z */
export function skyHash(x, y, z) {
  x = fract(x * 0.3183099 + 0.1) * 17;
  y = fract(y * 0.3183099 + 0.1) * 17;
  z = fract(z * 0.3183099 + 0.1) * 17;
  return fract(x * y * z * (x + y + z));
}

/** @param {number} x @param {number} y @param {number} z */
function skyNoise(x, y, z) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  let fx = x - ix;
  let fy = y - iy;
  let fz = z - iz;
  fx = fx * fx * (3 - 2 * fx);
  fy = fy * fy * (3 - 2 * fy);
  fz = fz * fz * (3 - 2 * fz);
  const mix = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ t) =>
    a + (b - a) * t;
  return mix(
    mix(
      mix(skyHash(ix, iy, iz), skyHash(ix + 1, iy, iz), fx),
      mix(skyHash(ix, iy + 1, iz), skyHash(ix + 1, iy + 1, iz), fx),
      fy
    ),
    mix(
      mix(skyHash(ix, iy, iz + 1), skyHash(ix + 1, iy, iz + 1), fx),
      mix(skyHash(ix, iy + 1, iz + 1), skyHash(ix + 1, iy + 1, iz + 1), fx),
      fy
    ),
    fz
  );
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** Nebula mask for a unit direction: smoothstep(0.55, 0.9, n). */
/** @param {number} x @param {number} y @param {number} z */
export function nebulaMask(x, y, z) {
  const n = skyNoise(x * 3.2, y * 3.2, z * 3.2) * 0.6 + skyNoise(x * 7.1, y * 7.1, z * 7.1) * 0.4;
  return smoothstep(0.55, 0.9, n);
}

/**
 * The midnight sky (SKY_FRAGMENT). The nebula is baked once into a small cube
 * map — it is smooth, so 48² texels a face is indistinguishable — and stars
 * are evaluated per pixel.
 * @param {Record<string, { value: any }>} uniforms skyUniforms from game.js
 * @param {{ faceSize?: number }} [options]
 */
export function createSkyShader(uniforms, { faceSize = 48 } = {}) {
  const S = faceSize;
  const cube = new Float32Array(6 * S * S);
  // face f: major axis f>>1 (x, y, z), sign + for even f
  const dirOf = (/** @type {number} */ f, /** @type {number} */ a, /** @type {number} */ b) => {
    const s = f % 2 === 0 ? 1 : -1;
    const axis = f >> 1;
    const v = [0, 0, 0];
    v[axis] = s;
    v[(axis + 1) % 3] = a;
    v[(axis + 2) % 3] = b;
    const l = Math.hypot(v[0], v[1], v[2]);
    return [v[0] / l, v[1] / l, v[2] / l];
  };
  for (let f = 0; f < 6; f++) {
    for (let j = 0; j < S; j++) {
      for (let i = 0; i < S; i++) {
        const [x, y, z] = dirOf(f, ((i + 0.5) / S) * 2 - 1, ((j + 0.5) / S) * 2 - 1);
        cube[(f * S + j) * S + i] = nebulaMask(x, y, z);
      }
    }
  }
  /** Bilinear lookup of the baked nebula. @param {number} x @param {number} y @param {number} z */
  const nebula = (x, y, z) => {
    const ax = Math.abs(x);
    const ay = Math.abs(y);
    const az = Math.abs(z);
    let f;
    let m;
    let a;
    let b;
    if (ax >= ay && ax >= az) {
      f = x >= 0 ? 0 : 1;
      m = ax;
      a = y;
      b = z;
    } else if (ay >= az) {
      f = y >= 0 ? 2 : 3;
      m = ay;
      a = z;
      b = x;
    } else {
      f = z >= 0 ? 4 : 5;
      m = az;
      a = x;
      b = y;
    }
    const fu = Math.min(S - 1, Math.max(0, ((a / m + 1) / 2) * S - 0.5));
    const fv = Math.min(S - 1, Math.max(0, ((b / m + 1) / 2) * S - 0.5));
    const i0 = Math.floor(fu);
    const j0 = Math.floor(fv);
    const i1 = Math.min(S - 1, i0 + 1);
    const j1 = Math.min(S - 1, j0 + 1);
    const tu = fu - i0;
    const tv = fv - j0;
    const base = f * S * S;
    const c00 = cube[base + j0 * S + i0];
    const c10 = cube[base + j0 * S + i1];
    const c01 = cube[base + j1 * S + i0];
    const c11 = cube[base + j1 * S + i1];
    return (c00 + (c10 - c00) * tu) * (1 - tv) + (c01 + (c11 - c01) * tu) * tv;
  };

  let time = 0;
  let motion = 1;
  const top = [0, 0, 0];
  const horizon = [0, 0, 0];
  const bottom = [0, 0, 0];
  const neb = [0, 0, 0];
  const read = (/** @type {number[]} */ target, /** @type {any} */ c) => {
    target[0] = c.r;
    target[1] = c.g;
    target[2] = c.b;
  };
  return {
    /** Changes whenever the static part of the picture would change. */
    get version() {
      return motion;
    },
    begin() {
      time = uniforms.uTime.value;
      motion = uniforms.uMotion.value;
      read(top, uniforms.uTop.value);
      read(horizon, uniforms.uHorizon.value);
      read(bottom, uniforms.uBottom.value);
      read(neb, uniforms.uNebula.value);
    },
    /**
     * @param {number} x unit direction from the sky centre
     * @param {number} y
     * @param {number} z
     * @param {number} fx gl_FragCoord.x
     * @param {number} fy gl_FragCoord.y
     * @param {Float32Array | number[]} out linear rgb
     * @returns {boolean} true when the pixel animates (a twinkling star)
     */
    shade(x, y, z, fx, fy, out) {
      const h = y;
      const k1 = smoothstep(0, 0.7, h);
      const k2 = smoothstep(0.05, -0.7, h);
      const nk = nebula(x, y, z) * 0.55;
      let r = horizon[0] + (top[0] - horizon[0]) * k1;
      let g = horizon[1] + (top[1] - horizon[1]) * k1;
      let b = horizon[2] + (top[2] - horizon[2]) * k1;
      r += (bottom[0] - r) * k2 + neb[0] * nk;
      g += (bottom[1] - g) * k2 + neb[1] * nk;
      b += (bottom[2] - b) * k2 + neb[2] * nk;
      const px = x * 95;
      const py = y * 95;
      const pz = z * 95;
      const cx = Math.floor(px);
      const cy = Math.floor(py);
      const cz = Math.floor(pz);
      const rnd = skyHash(cx, cy, cz);
      let live = false;
      if (rnd > 0.93) {
        const sx = cx + 0.5 + (skyHash(cx + 3.1, cy + 3.1, cz + 3.1) - 0.5) * 0.5;
        const sy = cy + 0.5 + (skyHash(cx + 7.7, cy + 7.7, cz + 7.7) - 0.5) * 0.5;
        const sz = cz + 0.5 + (skyHash(cx + 1.3, cy + 1.3, cz + 1.3) - 0.5) * 0.5;
        const s = smoothstep(0.42, 0, Math.hypot(px - sx, py - sy, pz - sz));
        if (s > 0) {
          const tw = 0.65 + 0.35 * Math.sin(time * (0.8 + rnd * 3) + rnd * 60) * motion;
          const k = s * tw * (rnd > 0.985 ? 1 : 0.45);
          r += 0.8 * k;
          g += 0.76 * k;
          b += 1 * k;
          live = motion > 0;
        }
      }
      const levels = 20;
      const d = (BAYER[(fy & 3) * 4 + (fx & 3)] + 0.5) / 16;
      out[0] = Math.floor(r * levels + d) / levels;
      out[1] = Math.floor(g * levels + d) / levels;
      out[2] = Math.floor(b * levels + d) / levels;
      out[3] = 1;
      return live;
    }
  };
}

/* ---------------------------------------------------------------------------
   Route overlay
   --------------------------------------------------------------------------- */

/**
 * The luminous route markings (OVERLAY_FRAGMENT), driven by the same 9×9 cell
 * bytes: r = reach distance, g = flags, b = path links, a = path order.
 * @param {Record<string, { value: any }>} uniforms overlayUniforms from game.js
 * @param {Uint8Array} cells
 */
export function createOverlayShader(uniforms, cells) {
  let time = 0;
  let motion = 1;
  let reveal = 0;
  let goalStrength = 1;
  let relic = 1;
  const accent = [0, 0, 0];
  const bone = [0, 0, 0];
  const gold = [0, 0, 0];
  const goalA = [0, 0, 0, 0];
  const goalAColor = [0, 0, 0];
  const goalB = [0, 0, 0, 0];
  const goalBColor = [0, 0, 0];
  const rgb = (/** @type {number[]} */ t, /** @type {any} */ c) => {
    t[0] = c.r;
    t[1] = c.g;
    t[2] = c.b;
  };
  const rect = (/** @type {number[]} */ t, /** @type {any} */ v) => {
    t[0] = v.x;
    t[1] = v.y;
    t[2] = v.z;
    t[3] = v.w;
  };
  /** @param {number} gx @param {number} gy @param {number[]} r @param {number} px @param {number} march */
  const goalBand = (gx, gy, r, px, march) => {
    const dx = Math.min(gx - r[0], r[2] - gx);
    const dy = Math.min(gy - r[1], r[3] - gy);
    if (dx < 0 || dy < 0) return 0;
    const d = Math.min(dx, dy);
    const band = step(0.035, d) * step(d, 0.035 + 2 * px);
    if (band === 0) return 0;
    const along = dx < dy ? gy : gx;
    return step(0.35, fract(along * 2 - march));
  };
  return {
    begin() {
      time = uniforms.uTime.value;
      motion = uniforms.uMotion.value;
      reveal = uniforms.uReveal.value;
      goalStrength = uniforms.uGoalStrength.value;
      relic = uniforms.uRelic.value;
      rgb(accent, uniforms.uAccent.value);
      rgb(bone, uniforms.uBone.value);
      rgb(gold, uniforms.uGold.value);
      rect(goalA, uniforms.uGoalA.value);
      rgb(goalAColor, uniforms.uGoalAColor.value);
      rect(goalB, uniforms.uGoalB.value);
      rgb(goalBColor, uniforms.uGoalBColor.value);
    },
    /**
     * @param {number} u
     * @param {number} v
     * @param {number} fwu fwidth(u)
     * @param {number} fwv fwidth(v)
     * @param {Float32Array | number[]} out linear rgb + alpha
     * @returns {boolean} false when the pixel adds nothing
     */
    shade(u, v, fwu, fwv, out) {
      const gx = u * 9;
      const gy = v * 9;
      const cellX = Math.min(8, Math.max(0, Math.floor(gx)));
      const cellY = Math.min(8, Math.max(0, Math.floor(gy)));
      const k = (cellY * 9 + cellX) * 4;
      const dist = cells[k];
      const flags = cells[k + 1];
      const links = cells[k + 2];
      const order = cells[k + 3];
      const inA = gx >= goalA[0] && gx <= goalA[2] && gy >= goalA[1] && gy <= goalA[3];
      const inB = gx >= goalB[0] && gx <= goalB[2] && gy >= goalB[1] && gy <= goalB[3];
      const centre = cellX === 4 && cellY === 4;
      if (!dist && !flags && !inA && !inB && !centre) return false;

      const px = Math.max(fwu, fwv) * 9;
      const fx = gx - Math.floor(gx);
      const fy = gy - Math.floor(gy);
      const cx = fx - 0.5;
      const cy = fy - 0.5;
      const ax = Math.abs(cx);
      const ay = Math.abs(cy);
      const edge = 0.5 - Math.max(ax, ay);
      const wave = motion * Math.sin(time * 3.4);
      let r = 0;
      let g = 0;
      let b = 0;
      const add = (/** @type {number[]} */ c, /** @type {number} */ s) => {
        r += c[0] * s;
        g += c[1] * s;
        b += c[2] * s;
      };

      const march = time * 0.45 * motion;
      if (inA) {
        add(goalAColor, goalBand(gx, gy, goalA, px, march) * 0.95 * goalStrength);
        add(goalAColor, 0.035 * goalStrength);
      }
      if (inB) add(goalBColor, goalBand(gx, gy, goalB, px, 0) * 0.3 * goalStrength);

      if (centre) {
        const rr = Math.hypot(cx, cy);
        const ring =
          step(Math.abs(rr - 0.44), 0.9 * px) + 0.5 * step(Math.abs(rr - 0.39), 0.6 * px);
        add(gold, ring * relic * (0.65 + 0.35 * Math.sin(time * 2) * motion));
      }

      if (flags & 32) {
        const tick = step(edge, 2.2 * px) * step(0.3, Math.min(ax, ay));
        add(accent, tick * (1.1 + 0.3 * wave));
      }

      if (dist > 0) {
        const t = (time - reveal) * 8 - dist;
        const appear = 1 + (Math.min(1, Math.max(0, t + 1)) - 1) * motion;
        const pulse = 0.8 + 0.2 * motion * Math.sin(time * 3.4 - dist * 1.2);
        const frame = step(0.075, edge) * step(edge, 0.075 + 1.4 * px);
        const corner = step(0.25, Math.min(ax, ay));
        add(accent, (frame * (0.55 + (1.35 - 0.55) * corner) + 0.17) * appear * pulse);
      }

      if (flags & 1 && dist === 0) add(accent, step(Math.max(ax, ay), 0.07) * 0.45);

      if (flags & 2) add(accent, step(Math.abs(Math.hypot(cx, cy) - 0.36), 0.9 * px) * 0.85);

      if (flags & 8) {
        const w = 1.1 * px;
        let line = 0;
        if (links & 1) line = Math.max(line, step(ax, w) * step(0, cy));
        if (links & 2) line = Math.max(line, step(ax, w) * step(cy, 0));
        if (links & 4) line = Math.max(line, step(ay, w) * step(0, cx));
        if (links & 8) line = Math.max(line, step(ay, w) * step(cx, 0));
        const node = step(Math.max(ax, ay), 0.075);
        const chase =
          motion > 0.5
            ? 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.cos(time * 7 - order * 1.4), 3)
            : 0.85;
        const s = Math.max(line, node) * chase;
        r += (bone[0] + (accent[0] - bone[0]) * 0.4) * s;
        g += (bone[1] + (accent[1] - bone[1]) * 0.4) * s;
        b += (bone[2] + (accent[2] - bone[2]) * 0.4) * s;
      }

      if (flags & 4) {
        const frame = step(0.035, edge) * step(edge, 0.035 + 2 * px);
        add(accent, 0.32 + frame * 1.3);
      }

      if (flags & 16) {
        const inset = 0.015 + 0.035 * (0.5 + 0.5 * Math.sin(time * 5)) * motion;
        const bracket =
          step(inset, edge) * step(edge, inset + 2 * px) * step(0.28, Math.min(ax, ay));
        add(bone, bracket * 1.2);
      }

      if (r <= 0 && g <= 0 && b <= 0) return false;
      out[0] = r;
      out[1] = g;
      out[2] = b;
      out[3] = 1;
      return true;
    }
  };
}
