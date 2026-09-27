// Dice Corners — deterministic presentation maths.
//
// Pure ES module shared by game.js and the Vitest suite: board ↔ world
// mapping, the rolling-cube arc, keyboard directions relative to the camera,
// pixel scale, camera framing and the adaptive-quality governor. No DOM,
// no WebGL.
import {
  BOARD_SIZE,
  DIRECTIONS,
  DIRECTION_NAMES,
  multiplyQuat,
  normalizeQuat,
  quatFromAxisAngle,
  rollAxis,
  rotateVector
} from './game-logic.js';

/** @typedef {import('./game-logic.js').Direction} Direction */
/** @typedef {import('./game-logic.js').Quat} Quat */

export const CELL_SIZE = 1;
export const DIE_SIZE = 0.85;

/**
 * Centre of a cell on the board plane. x = col, z = (SIZE - 1 - row): row 0
 * (Moon's near edge) is at high z, toward Moon's camera.
 * @param {number} col
 * @param {number} row
 */
export function cellToWorld(col, row) {
  return { x: col, z: BOARD_SIZE - 1 - row };
}

/**
 * Cell under a point on the board plane, or null off the board.
 * @param {number} x
 * @param {number} z
 * @returns {{ col: number, row: number } | null}
 */
export function worldToCell(x, z) {
  const col = Math.round(x);
  const row = BOARD_SIZE - 1 - Math.round(z);
  if (col < 0 || col >= BOARD_SIZE || row < 0 || row >= BOARD_SIZE) return null;
  return { col, row };
}

/**
 * Pose of a die part-way through one roll (the classic animateRoll): it pivots
 * about its own leading bottom edge — a real cube tipping over, no hop — while
 * the small gap between die size and cell pitch is glided in linearly so it
 * lands dead-centre on the next cell.
 * @param {{ x: number, y: number, z: number }} start die centre at rest
 * @param {Quat} startQuat orientation at rest
 * @param {Direction} direction
 * @param {number} t progress, 0..1
 * @param {{ dieSize?: number, cellSize?: number }} [dims]
 * @returns {{ position: [number, number, number], quat: Quat }}
 */
export function rollPose(start, startQuat, direction, t, dims = {}) {
  const dieSize = dims.dieSize ?? DIE_SIZE;
  const cellSize = dims.cellSize ?? CELL_SIZE;
  const [dx, , dz] = DIRECTIONS[direction].world;
  const half = dieSize / 2;
  const pivotX = start.x + dx * half;
  const pivotZ = start.z + dz * half;
  const partial = quatFromAxisAngle(rollAxis(direction), (Math.PI / 2) * t);
  const [ox, oy, oz] = rotateVector([start.x - pivotX, start.y, start.z - pivotZ], partial);
  const glide = (cellSize - dieSize) * t;
  return {
    position: [ox + pivotX + dx * glide, oy, oz + pivotZ + dz * glide],
    quat: normalizeQuat(multiplyQuat(partial, startQuat))
  };
}

/**
 * Screen-space (right, up) unit vector per arrow key.
 * @type {Readonly<Record<string, readonly [number, number]>>}
 */
const ARROWS = Object.freeze({
  ArrowUp: [0, 1],
  ArrowDown: [0, -1],
  ArrowRight: [1, 0],
  ArrowLeft: [-1, 0]
});

/**
 * Board direction an arrow key means from the current camera: "up" pushes
 * away from the viewer. `azimuth` is the camera's orbit angle around the board
 * centre, atan2(offset.x, offset.z) — 0 behind Moon's edge, π behind Ember's.
 * @param {string} key KeyboardEvent.key
 * @param {number} azimuth radians
 * @returns {Direction | null}
 */
export function arrowToDirection(key, azimuth) {
  const screen = ARROWS[key];
  if (!screen) return null;
  const sin = Math.sin(azimuth);
  const cos = Math.cos(azimuth);
  // camera right = (cos, -sin) and forward = (-sin, -cos) on the x/z plane
  const x = cos * screen[0] - sin * screen[1];
  const z = -sin * screen[0] - cos * screen[1];
  /** @type {Direction} */
  let best = DIRECTION_NAMES[0];
  let bestDot = -Infinity;
  for (const name of DIRECTION_NAMES) {
    const [wx, , wz] = DIRECTIONS[name].world;
    const dot = wx * x + wz * z;
    if (dot > bestDot) {
      bestDot = dot;
      best = name;
    }
  }
  return best;
}

/**
 * Device pixels per art pixel for the low-resolution, nearest-upscaled render.
 * Aims for about `target` art pixels across one board cell, which keeps the
 * pixel look while pips stay readable on phones and desktops alike.
 * @param {{ cellCssPx: number, dpr: number, target?: number, max?: number }} options
 */
export function choosePixelScale({ cellCssPx, dpr, target = 30, max = 6 }) {
  const devicePx = Math.max(0, cellCssPx * dpr);
  return Math.min(max, Math.max(1, Math.round(devicePx / target)));
}

/**
 * @typedef {{ left: number, right: number, bottom: number, top: number }} NdcRect
 * @typedef {{ distance: number, shiftX: number, shiftY: number }} BoardView
 */

/**
 * Frames the board for any screen: the smallest orbit distance at which the
 * board box (dice height included) fits inside `safe` — the part of the screen,
 * in NDC, left clear by the HUD — plus the image shift that centres it there.
 * Uses the same camera model as three.js (setFromSphericalCoords + lookAt).
 * @param {{
 *   aspect: number,
 *   fovY: number,
 *   polar: number,
 *   azimuth: number,
 *   halfExtent: number,
 *   yRange: [number, number],
 *   safe: NdcRect
 * }} options fovY in degrees; polar/azimuth in radians
 * @returns {BoardView}
 */
export function fitBoardView({ aspect, fovY, polar, azimuth, halfExtent, yRange, safe }) {
  const tanHalf = Math.tan((fovY * Math.PI) / 360);
  // Camera axes for a camera on the orbit sphere looking at the board centre.
  const back = [
    Math.sin(polar) * Math.sin(azimuth),
    Math.cos(polar),
    Math.sin(polar) * Math.cos(azimuth)
  ];
  const rightLength = Math.hypot(back[2], back[0]) || 1;
  const right = [back[2] / rightLength, 0, -back[0] / rightLength];
  const up = [
    back[1] * right[2] - back[2] * right[1],
    back[2] * right[0] - back[0] * right[2],
    back[0] * right[1] - back[1] * right[0]
  ];
  /** @type {[number, number, number][]} */
  const corners = [];
  for (const x of [-halfExtent, halfExtent]) {
    for (const z of [-halfExtent, halfExtent]) {
      for (const y of yRange) corners.push([x, y, z]);
    }
  }

  /** @param {number} distance */
  const project = (distance) => {
    const bounds = {
      left: Infinity,
      right: -Infinity,
      bottom: Infinity,
      top: -Infinity,
      behind: false
    };
    for (const [x, y, z] of corners) {
      const vx = x - back[0] * distance;
      const vy = y - back[1] * distance;
      const vz = z - back[2] * distance;
      const depth = -(vx * back[0] + vy * back[1] + vz * back[2]);
      if (depth <= 0.01) bounds.behind = true;
      const px = (vx * right[0] + vy * right[1] + vz * right[2]) / (depth * tanHalf * aspect);
      const py = (vx * up[0] + vy * up[1] + vz * up[2]) / (depth * tanHalf);
      bounds.left = Math.min(bounds.left, px);
      bounds.right = Math.max(bounds.right, px);
      bounds.bottom = Math.min(bounds.bottom, py);
      bounds.top = Math.max(bounds.top, py);
    }
    return bounds;
  };

  let near = 0.5;
  let far = 1000;
  for (let i = 0; i < 64; i++) {
    const mid = (near + far) / 2;
    const b = project(mid);
    const fits =
      !b.behind &&
      b.right - b.left <= safe.right - safe.left &&
      b.top - b.bottom <= safe.top - safe.bottom;
    if (fits) far = mid;
    else near = mid;
  }
  const b = project(far);
  return {
    distance: far,
    shiftX: (safe.left + safe.right) / 2 - (b.left + b.right) / 2,
    shiftY: (safe.bottom + safe.top) / 2 - (b.bottom + b.top) / 2
  };
}

/**
 * PerspectiveCamera.setViewOffset x/y (in pixels of a width×height view) that
 * moves the rendered image by the view's NDC shift.
 * @param {BoardView} view
 * @param {number} width
 * @param {number} height
 */
export function viewOffsetPixels(view, width, height) {
  return { x: (-view.shiftX * width) / 2, y: (view.shiftY * height) / 2 };
}

/**
 * Adaptive quality: follows a smoothed frame time and steps quality down —
 * never back up, so it cannot oscillate — once a whole window of frames stays
 * slow. Hitches such as tab switches are ignored.
 * @param {{ levels?: number, start?: number, slowMs?: number, window?: number, ignoreAboveMs?: number }} [options]
 */
export function createQualityGovernor({
  levels = 3,
  start = 0,
  slowMs = 26,
  window = 90,
  ignoreAboveMs = 250
} = {}) {
  let level = Math.min(Math.max(0, start), levels - 1);
  let average = 0;
  let count = 0;
  return {
    get level() {
      return level;
    },
    /**
     * @param {number} frameMs
     * @returns {number | null} the new level when it changes
     */
    sample(frameMs) {
      if (!(frameMs > 0) || frameMs > ignoreAboveMs) return null;
      count += 1;
      average = count === 1 ? frameMs : average + (frameMs - average) * 0.05;
      if (count < window || average <= slowMs || level >= levels - 1) return null;
      level += 1;
      count = 0;
      return level;
    }
  };
}
