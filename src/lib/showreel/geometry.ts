// Pure geometry for the showreel. No DOM, no time source: every function takes
// its phase explicitly, so the same rules draw the animated and the static page.

export const TAU = Math.PI * 2;

export const wrap01 = (value: number): number => ((value % 1) + 1) % 1;

// ---------------------------------------------------------------------------
// MODULATE — ordered segments on a lane (after dynamicstripesdemo-2/motion.ts)
// ---------------------------------------------------------------------------

export interface LaneInput {
  segmentCount: number;
  phase: number; // base time phase, radians
  phaseDelta: number; // phase shift between neighbouring points, radians
  laneOrder: number; // ordered index of the lane, drives the diagonal wave
  laneStep: number; // phase shift between neighbouring lanes, radians
  origin: number; // drift of the first point along the lane, 0..1
  amplitude: number; // requested oscillation, fraction of a base step
}

const MIN_INTERVAL = 1e-4;

/**
 * Parent points sit on an even grid; every child point swings around its parent
 * by at most half a step, so order is preserved and segments never swap.
 * Returns segmentCount + 1 points, the last being the seam duplicate (+1 turn).
 */
export const lanePoints = ({
  segmentCount,
  phase,
  phaseDelta,
  laneOrder,
  laneStep,
  origin,
  amplitude
}: LaneInput): number[] => {
  const count = Math.max(1, segmentCount);
  const step = 1 / count;
  const swing = Math.min(Math.max(0, amplitude), 0.49) * step;
  const points: number[] = [];

  for (let i = 0; i < count; i += 1) {
    const parent = origin + i * step;
    const child = parent + Math.sin(phase + i * phaseDelta + laneOrder * laneStep) * swing;
    points.push(i === 0 ? child : Math.max(child, points[i - 1] + MIN_INTERVAL));
  }

  points.push(points[0] + 1);
  return points;
};

export interface LanePiece {
  start: number; // 0..1 along the lane
  end: number;
  owner: number; // logical segment index
  length: number; // length of the whole logical segment, 0..1
}

/**
 * Turns ordered points into gapped pieces wrapped onto [0, 1]. A logical segment
 * crossing the seam is split in two pieces that share the same owner.
 */
export const lanePieces = (points: number[], gap: number): LanePiece[] => {
  const pieces: LanePiece[] = [];

  for (let owner = 0; owner < points.length - 1; owner += 1) {
    const start = points[owner] + gap / 2;
    const end = points[owner + 1] - gap / 2;
    const length = end - start;
    if (length <= 0) continue;

    const a = wrap01(start);
    const b = a + length;

    if (b <= 1) {
      pieces.push({ start: a, end: b, owner, length });
    } else {
      pieces.push({ start: a, end: 1, owner, length });
      pieces.push({ start: 0, end: b - 1, owner, length });
    }
  }

  return pieces;
};

// ---------------------------------------------------------------------------
// TRACE — epicycles: z(t) = Σ r·e^{i(ωt + φ)}
// ---------------------------------------------------------------------------

export interface Epicycle {
  r: number; // radius, fraction of the stage radius
  w: number; // angular frequency, turns per period
  p: number; // phase offset, radians
}

export const epicyclePoint = (cycles: Epicycle[], t: number, out: [number, number]) => {
  let x = 0;
  let y = 0;
  for (const { r, w, p } of cycles) {
    const a = w * t + p;
    x += r * Math.cos(a);
    y += r * Math.sin(a);
  }
  out[0] = x;
  out[1] = y;
  return out;
};

export const epicycleReach = (cycles: Epicycle[]) =>
  cycles.reduce((sum, { r }) => sum + Math.abs(r), 0);

/** Pretty-prints the sum as a quiet annotation, e.g. z(t) = 1.00e^{i·t} + … */
export const epicycleFormula = (cycles: Epicycle[]) =>
  'z(t) = ' +
  cycles
    .map(({ r, w }, i) => {
      const freq = Math.round(w);
      const sign = i === 0 ? '' : ' + ';
      const omega = freq === 1 ? '' : freq === -1 ? '−' : String(freq).replace('-', '−');
      return `${sign}${r.toFixed(2)}·e^(i·${omega}t)`;
    })
    .join('');

// ---------------------------------------------------------------------------
// CONSTRUCT — compass arcs
// ---------------------------------------------------------------------------

/** SVG arc path around (cx, cy) from angle a0 to a1 (degrees, clockwise from +x). */
export const arcPath = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const x0 = cx + r * Math.cos(rad(a0));
  const y0 = cy + r * Math.sin(rad(a0));
  const x1 = cx + r * Math.cos(rad(a1));
  const y1 = cy + r * Math.sin(rad(a1));
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  const sweep = a1 > a0 ? 1 : 0;
  return `M ${x0.toFixed(3)} ${y0.toFixed(3)} A ${r} ${r} 0 ${large} ${sweep} ${x1.toFixed(3)} ${y1.toFixed(3)}`;
};
