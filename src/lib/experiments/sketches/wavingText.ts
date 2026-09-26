import { FRAME, type Sketch } from '../runner';

// Port of "Waving rainbow text" — https://codepen.io/izmaelmag/pen/oNNzGvv
// The original rainbowText({...}) options:
const OPT = {
  minSize: 80, // in pixels
  maxSize: 120, // in pixels
  speed: 1, // 1 is 2PI in rad., 0.5 is PI in rad. etc
  rainbowSpeed: 3, // speed of hue color change
  frequency: -1.5 // frequency of sine
};

// Rough advance of a 900-weight sans-serif capital at the mean size (120 px).
// The stage scales every size by k so the longest word fits its width.
const LETTER_ADVANCE = 100;
const MIN_SCALE = 0.2;

/**
 * Animates the letters already rendered inside `host`: every `.word` row and
 * its `span` children. The markup comes from the component as plain text; this
 * only writes inline styles.
 */
export function createWavingText(host: HTMLElement): Sketch {
  let width = 0;
  let ms = 0; // the rAF timestamp the pen read, now a fixed 60 Hz clock
  const phaseOffsets: number[] = [];

  // const phaseOffset = 180 + Math.random() * 180; — one per word container
  const phaseOffset = (row: number) => {
    while (phaseOffsets.length <= row) phaseOffsets.push(180 + Math.random() * 180);
    return phaseOffsets[row];
  };

  function apply() {
    const rows = Array.from(host.querySelectorAll<HTMLElement>('.word'));
    if (!rows.length || !width) return;

    const longest = Math.max(...rows.map((row) => row.children.length), 1);
    const k = Math.max(MIN_SCALE, Math.min(1, (width * 0.9) / (longest * LETTER_ADVANCE)));
    host.style.setProperty('--k', k.toFixed(4));

    rows.forEach((row, r) => {
      const offset = phaseOffset(r);
      Array.from(row.children as HTMLCollectionOf<HTMLElement>).forEach((letter, i) => {
        // parseInt(Math.sin(phaseOffset + ms / (360 * speed) + i / frequency)
        //   * (maxSize - minSize) + maxSize, 10)  → 80…160 px
        const wave = Math.sin(offset + ms / (360 * OPT.speed) + i / OPT.frequency);
        const fontSize = Math.trunc(wave * (OPT.maxSize - OPT.minSize) + OPT.maxSize);
        const color = `hsl(${ms / OPT.rainbowSpeed + i * 20}, 50%, 50%)`;
        const glow = (12 * Math.max(k, 0.5)).toFixed(1);
        letter.style.fontSize = `${(fontSize * k).toFixed(2)}px`;
        letter.style.color = color;
        letter.style.textShadow = `0 0 ${glow}px ${color}`;
      });
    });
  }

  return {
    resize(w) {
      width = w;
    },
    tick() {
      ms += FRAME;
      apply();
    },
    render: apply,
    reset() {
      ms = 0;
      apply();
    },
    // t = 0 is already a legible frame: the wave shape is in the sizes and the
    // hue steps 20° per letter.
    still() {
      ms = 0;
      apply();
    }
  };
}
