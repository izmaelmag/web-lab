import { fitCanvas, type Sketch } from '../runner';

// Port of "Triangled" — https://codepen.io/izmaelmag/pen/YWdjXr
const PI = Math.PI;
const COLOR = '#bbb';
const SPEED = 0.2;

// The pen drew at window scale: r1 swings 400…600 px, so on a laptop the outer
// vertices ran off the screen. The stage keeps that crop: 1 100 px of pen space
// maps onto its short side, and only the peaks of r1 poke past the edge.
const REFERENCE = 1100;

// Frozen frame for reduced motion: counter-rotated, not the symmetric star at 0.
const STILL_ANGLE = -PI / 8;

type Triangle = [[number, number], [number, number], [number, number]];

export function createTriangled(canvas: HTMLCanvasElement): Sketch {
  let ctx: CanvasRenderingContext2D | null = null;
  let width = 0;
  let height = 0;
  let scale = 1;
  let angle = 0;

  // getTrianglePoints(angle, radius): vertices at angle, angle − 2π/3, angle − 4π/3
  function trianglePoints(a: number, radius: number): Triangle {
    const cx = width / 2;
    const cy = height / 2;
    const r = radius * scale;
    return [
      [cx + r * Math.cos(a), cy + r * Math.sin(a)],
      [cx + r * Math.cos(a - (2 * PI) / 3), cy + r * Math.sin(a - (2 * PI) / 3)],
      [cx + r * Math.cos(a - (4 * PI) / 3), cy + r * Math.sin(a - (4 * PI) / 3)]
    ];
  }

  function drawTriangle(c: CanvasRenderingContext2D, a: number, radius: number) {
    const [pa, pb, pc] = trianglePoints(a, radius);
    c.globalAlpha = 1;
    c.beginPath();
    c.moveTo(pa[0], pa[1]);
    c.lineTo(pb[0], pb[1]);
    c.lineTo(pc[0], pc[1]);
    c.lineTo(pa[0], pa[1]);
    c.stroke();
  }

  // Every vertex of one triangle to every vertex of the other: 3 × 3 lines.
  // Like the original there is no beginPath() here, so the inner triangle's
  // path is stroked a second time along with the connectors — it reads a
  // touch brighter than the outer one.
  function drawConnectors(c: CanvasRenderingContext2D, a: number, r1: number, r2: number) {
    const p1 = trianglePoints(a, r1);
    const p2 = trianglePoints(a * -1, r2);
    for (const from of p1) {
      for (const to of p2) {
        c.moveTo(from[0], from[1]);
        c.lineTo(to[0], to[1]);
      }
    }
    c.stroke();
  }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    // The breathing radii. `angle + 90` is 90 radians, not degrees: 90 mod 2π
    // ≈ 2.04 rad, so the inner triangle breathes ~117° out of phase with the
    // outer one. Kept as written — it is the reason the pair never syncs up.
    const r1 = 100 * Math.sin(angle) + 500;
    const r2 = 100 * Math.sin(angle + 90) + 200;

    // Set every frame: resizing a canvas resets its state, and the original
    // lost its #bbb (falling back to black) after the first window resize.
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 1;
    drawTriangle(ctx, angle, r1);
    drawTriangle(ctx, angle * -1, r2);
    drawConnectors(ctx, angle, r1, r2);
  }

  return {
    resize(w, h, dpr) {
      width = w;
      height = h;
      scale = Math.min(w, h) / REFERENCE;
      ctx = fitCanvas(canvas, w, h, dpr);
    },

    tick() {
      angle -= (PI / 360) * SPEED;
      draw();
    },

    render: draw,

    reset() {
      angle = 0;
      draw();
    },

    still() {
      angle = STILL_ANGLE;
      draw();
    }
  };
}
