// Small deterministic helpers shared by the Dice Corners unit tests.

/** mulberry32: a tiny seeded PRNG so randomized property checks are reproducible. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)];
}

export interface QuatLike {
  x: number;
  y: number;
  z: number;
  w: number;
}

/** Largest absolute component difference between two quaternions. */
export function componentDelta(a: QuatLike, b: QuatLike): number {
  return Math.max(
    Math.abs(a.x - b.x),
    Math.abs(a.y - b.y),
    Math.abs(a.z - b.z),
    Math.abs(a.w - b.w)
  );
}
