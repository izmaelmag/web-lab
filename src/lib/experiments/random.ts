// Seeded randomness for the pens that rolled their constants with Math.random.

/** FNV-1a: turns a short seed string into a 32-bit state. */
export function hashSeed(seed: string) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** mulberry32: small, fast, good enough for geometry. Returns [0, 1). */
export function mulberry32(state: number) {
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const SEED_PATTERN = /^[a-z0-9]{1,12}$/;

export const isSeed = (value: string | null | undefined): value is string =>
  !!value && SEED_PATTERN.test(value);

export const randomSeed = () => {
  const n = Math.floor(Math.random() * 36 ** 6);
  return n.toString(36).padStart(6, '0');
};
