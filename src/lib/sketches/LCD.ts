import type { Sketch } from 'p5-svelte';
import { createNoise3D } from 'simplex-noise';

const PX = 4;
const GAP = 2;
const NX = 16;
const NY = 16;
const W = NX * (PX + GAP) - GAP;
const H = NY * (PX + GAP) - GAP;
const BG = [248, 250, 252, 255];

const LCD: () => Sketch = () => (p5) => {
  const renderPixel = (xi: number, yi: number, rgb = [0, 0, 0]) => {
    // Scale indexed coordinates to the canvas
    const x = xi * (PX + GAP);
    const y = yi * (PX + GAP);

    // Draw pixel as rect
    p5.fill(rgb);
    p5.rect(x, y, PX);
  };

  const noise3D = createNoise3D();

  p5.setup = () => {
    p5.createCanvas(W, H);
    p5.noStroke();
    p5.background(BG);
  };

  p5.draw = () => {
    const TIME = p5.millis() * 0.002;

    for (let xi = 0; xi < NX; xi++) {
      for (let yi = 0; yi < NY; yi++) {
        const noiseValR = noise3D(xi * 0.05, yi * 0.05 + TIME * 0.2, TIME * 0.2);

        if (!isCorner(xi, yi, NX, NY))
          renderPixel(xi, yi, noiseValR >= 0 ? [255, 120, 0, 255] : [51, 65, 85, 255]);
      }
    }
  };
};

const isCorner = (x: number, y: number, w: number, h: number): boolean => {
  return (x === 0 || x === w - 1) && (y === 0 || y === h - 1);
};

export default LCD;
