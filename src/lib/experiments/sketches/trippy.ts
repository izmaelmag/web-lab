import { hashSeed, mulberry32 } from '../random';
import type { OrbitParams } from './orbit';

// "HTML5 canvas: trippy geometry animation" — https://codepen.io/izmaelmag/pen/yVOqGe
// Every constant the pen rolled with Math.random, rolled here from a seed in
// the same order, so one seed is one figure.

// The pen rolled R1 against window.innerHeight; the port rolls it against this
// height and scales the figure to the stage.
const REFERENCE_HEIGHT = 800;

export function trippyParams(seed: string): OrbitParams {
  const random = mulberry32(hashSeed(seed));
  const rand = (min: number, max: number) => random() * (max - min) + min;

  const count = Math.floor(rand(2, 12)); // 2 … 11
  const r1 = rand(60, (REFERENCE_HEIGHT - 100) / 2);
  const r2 = (r1 / (Math.PI * rand(1, 4))) * count;
  const divisor = count * rand(0.5, 2); // evaluated before the outer rand, as in JS
  const speed = rand(0.05, 2 / divisor);
  const lw = rand(0.5, 3);
  const opacity = rand(0.05, 0.3);
  const channel = () => Math.floor(rand(10, 100));
  const overlay = `rgba(${channel()},${channel()},${channel()},${opacity.toFixed(3)})`;

  return {
    count,
    r1,
    r2,
    speed,
    centerSize: rand(2, 20),
    innerSize: rand(2, 10),
    outerSize: rand(2, 8),
    ringWidth: lw,
    lineWidth: lw,
    trailWidth: lw,
    dashedCenter: true,
    overlay,
    background: '#000',
    reference: REFERENCE_HEIGHT
  };
}

/**
 * The catalog miniature needs a figure that reads at 300 px: the first seed in
 * a fixed sequence whose satellites stay inside the frame and move visibly.
 */
export function previewSeed() {
  for (let n = 0; n < 500; n++) {
    const seed = `p${n.toString(36)}`;
    const p = trippyParams(seed);
    if (p.count >= 4 && p.count <= 8 && p.r1 + p.r2 < 360 && p.speed > 0.2) return seed;
  }
  return 'p0';
}
