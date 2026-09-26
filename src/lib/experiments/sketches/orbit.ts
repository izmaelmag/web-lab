import { fitCanvas, type Sketch } from '../runner';

// The orbit machine shared by two pens:
//   "HTML5 canvas geometry animation"        — https://codepen.io/izmaelmag/pen/MbyXXL
//   "HTML5 canvas: trippy geometry animation" — https://codepen.io/izmaelmag/pen/yVOqGe
// Both draw on two stacked canvases: #canvas is cleared every frame and holds
// the construction; #trails is only ever washed with a translucent fill, so the
// satellites' 1px dots pile up into a fading trace.

const PI = Math.PI;
const COLOR = '#fff';

export interface OrbitParams {
  count: number; // COUNT — first-level points
  r1: number; // R1 — radius of the big circle
  r2: number; // R2 — radius of each satellite circle
  speed: number; // SPEED
  centerSize: number; // drawCirclePoint size at the centre
  innerSize: number; // … at the first-level points
  outerSize: number; // … at the satellites
  ringWidth: number; // outer ring of drawCirclePoint
  lineWidth: number; // drawLine
  trailWidth: number; // drawPoint on the trails canvas
  dashedCenter: boolean; // drawCircle(…, isDashed) only dashed in the trippy pen
  overlay: string; // trail wash, one fill per frame
  background: string; // CSS background under #trails
  /** Short side of the stage, in px, at which the pen's numbers are drawn 1:1. */
  reference: number;
}

interface Point {
  x: number;
  y: number;
}

const CENTER: Point = { x: 0, y: 0 };

// getPointCoordinates(center, angle, radius)
const pointAt = (center: Point, angle: number, radius: number): Point => ({
  x: center.x + radius * Math.cos(angle),
  y: center.y + radius * Math.sin(angle)
});

/** getCoordinates(): first-level points on R1, satellites on R2 around them. */
export function orbitCoordinates(angle: number, count: number, r1: number, r2: number) {
  const angleDiff = ((360 / count) * PI) / 180; // ANGLEDIFF
  const mainPoints: Point[] = [];
  const secondaryPoints: Point[] = [];

  for (let i = 0; i < count; i++) {
    const a = angle + angleDiff * i;
    const point = pointAt(CENTER, a, r1);
    mainPoints.push(point);
    // let localAngle = angles[index] + angles[index] * COUNT * 2;
    // Satellites turn (1 + 2·COUNT)× faster than the ring they ride.
    const localAngle = a + a * count * 2;
    secondaryPoints.push(pointAt(point, localAngle, r2));
  }

  return { mainPoints, secondaryPoints };
}

export function createOrbit(
  canvas: HTMLCanvasElement,
  trails: HTMLCanvasElement,
  initial: OrbitParams
): Sketch & { configure(params: OrbitParams): void } {
  let p = initial;
  let ctx: CanvasRenderingContext2D | null = null;
  let tctx: CanvasRenderingContext2D | null = null;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let angle = 0; // ANGLE

  // One transform replaces CENTER = innerWidth / 2 and scales the pen's pixel
  // constants (radii, point sizes, stroke widths) to the stage together.
  function penSpace(c: CanvasRenderingContext2D) {
    const s = (Math.min(width, height) / p.reference) * dpr;
    c.setTransform(s, 0, 0, s, (width / 2) * dpr, (height / 2) * dpr);
  }

  function drawCirclePoint(x: number, y: number, rad: number) {
    if (!ctx) return;
    ctx.beginPath();
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = rad;
    ctx.arc(x, y, rad / 2, 0, PI * 2, false);
    ctx.stroke();

    ctx.beginPath();
    ctx.lineWidth = p.ringWidth;
    ctx.arc(x, y, rad + 4, 0, PI * 2, false);
    ctx.stroke();
  }

  function drawCircle(x: number, y: number, rad: number, isDashed = false) {
    if (!ctx) return;
    if (isDashed && p.dashedCenter) ctx.setLineDash([2, 4]);
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 2;
    ctx.arc(x, y, rad + 4, 0, PI * 2, false);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);
  }

  function drawLine(from: Point, to: Point) {
    if (!ctx) return;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = p.lineWidth;
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function drawPoint(x: number, y: number) {
    if (!tctx) return;
    tctx.beginPath();
    tctx.strokeStyle = COLOR;
    tctx.lineWidth = p.trailWidth;
    tctx.arc(x, y, 0.5, 0, PI * 2, false);
    tctx.stroke();
  }

  // drawConnectors() redraws the satellite polygon once per first-level point.
  // The repeats stack the 0.5 alpha into a brighter polygon, so they stay; the
  // cost is bounded by COUNT ≤ 11: at most 11 × (2 + 2 × 10) = 242 strokes.
  function drawConnectors(inner: Point[], outer: Point[]) {
    inner.forEach((point, index) => {
      drawLine(point, CENTER);
      drawLine(point, outer[index]);
      const n = outer.length;
      for (let i = 1; i < n; i++) {
        drawLine(outer[0], outer[n - 1]);
        drawLine(outer[i], outer[i - 1]);
      }
    });
  }

  function drawFrame(leaveTrail: boolean) {
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    penSpace(ctx);

    // drawCenter()
    drawCirclePoint(CENTER.x, CENTER.y, p.centerSize);
    drawCircle(CENTER.x, CENTER.y, p.r1 - 4, true);

    const { mainPoints, secondaryPoints } = orbitCoordinates(angle, p.count, p.r1, p.r2);

    for (const point of mainPoints) {
      drawCirclePoint(point.x, point.y, p.innerSize);
      drawCircle(point.x, point.y, p.r2 - 4);
    }
    for (const point of secondaryPoints) {
      drawCirclePoint(point.x, point.y, p.outerSize);
      if (leaveTrail) drawPoint(point.x, point.y);
    }
    drawConnectors(mainPoints, secondaryPoints);
  }

  function wash() {
    if (!tctx) return;
    tctx.setTransform(1, 0, 0, 1, 0, 0);
    tctx.fillStyle = p.overlay;
    tctx.fillRect(0, 0, tctx.canvas.width, tctx.canvas.height);
    penSpace(tctx);
  }

  function clearTrails() {
    if (!tctx) return;
    tctx.setTransform(1, 0, 0, 1, 0, 0);
    tctx.clearRect(0, 0, tctx.canvas.width, tctx.canvas.height);
    penSpace(tctx);
  }

  function applyBackground() {
    trails.style.background = p.background;
  }

  applyBackground();

  return {
    configure(params) {
      p = params;
      applyBackground();
    },

    resize(w, h, ratio) {
      width = w;
      height = h;
      dpr = ratio;
      ctx = fitCanvas(canvas, w, h, dpr);
      tctx = fitCanvas(trails, w, h, dpr);
      penSpace(tctx);
    },

    tick() {
      wash();
      angle -= (PI / 360) * p.speed; // ANGLE -= PI / 360 * SPEED
      drawFrame(true);
    },

    render() {
      drawFrame(false);
    },

    reset() {
      angle = 0;
      clearTrails();
      drawFrame(false);
    },

    // The whole closed trace instead of its fading tail: after one turn of the
    // ring every satellite has made 1 + 2·COUNT turns and is back at its start.
    still() {
      angle = 0;
      clearTrails();
      if (tctx) {
        const samples = 160 * (1 + 2 * p.count);
        tctx.globalAlpha = 0.55;
        tctx.strokeStyle = COLOR;
        tctx.lineWidth = p.trailWidth;
        tctx.beginPath();
        for (let i = 0; i <= samples; i++) {
          const a = -(i / samples) * PI * 2;
          const { secondaryPoints } = orbitCoordinates(a, p.count, p.r1, p.r2);
          const s = secondaryPoints[0];
          if (i === 0) tctx.moveTo(s.x, s.y);
          else tctx.lineTo(s.x, s.y);
        }
        tctx.stroke();
        tctx.globalAlpha = 1;
      }
      angle = -PI / 9;
      drawFrame(false);
    }
  };
}
