import { fitCanvas, type Sketch } from '../runner';

// Port of "🌈 Rainy background" — https://codepen.io/izmaelmag/pen/ggYzGO
// The original OPT block, kept verbatim where it still means something:
const OPT = {
  amount: 5000, // hard cap on live sparks
  speed: 0.05, // pixels per frame
  lifetime: 200, // frames
  direction: { x: -0.5, y: 1 },
  size: 2,
  maxopacity: 1,
  acceleration: [5, 40] as const
};

// The pen topped sparks up with setInterval(addSpark, 1000 / OPT.amount). A
// 0.2 ms interval gets clamped by browsers to ~4 ms, so it really added about
// four sparks per 60 Hz frame into a (W + 400) × (H + 400) field — about 800
// live sparks, one per ~3 000 px² on a laptop screen. Spawning is per frame here, scaled by
// the field area so small stages keep that density instead of piling up.
const SPAWN_PER_FRAME = 4;
const REFERENCE_FIELD = (1440 + 400) * (900 + 400);

// Original trail wash: ctx.fillStyle = 'rgba(0,0,0, 0.1)' over the whole canvas.
const WASH = 'rgba(0, 0, 0, 0.1)';

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  color: string;
}

// Integer rand from the pen, bounds inclusive.
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export function createRain(canvas: HTMLCanvasElement, { preview = false } = {}): Sketch {
  let ctx: CanvasRenderingContext2D | null = null;
  let width = 0;
  let height = 0;
  let margin = 200;
  let rate = SPAWN_PER_FRAME;
  let cap = OPT.amount;
  let debt = 0;
  let sparks: Spark[] = [];

  function addSpark() {
    const acceleration = rand(OPT.acceleration[0], OPT.acceleration[1]);
    sparks.push({
      x: rand(-margin, width + margin),
      y: rand(-margin, height + margin),
      // this.x += OPT.speed * OPT.direction.x * this.acceleration / 2
      vx: (OPT.speed * OPT.direction.x * acceleration) / 2,
      vy: (OPT.speed * OPT.direction.y * acceleration) / 2,
      age: 0,
      // randColor: rand(0, 255) per channel — the whole RGB cube, not a hue wheel
      color: `rgb(${rand(0, 255)},${rand(0, 255)},${rand(0, 255)})`
    });
  }

  function spawn() {
    debt += rate;
    while (debt >= 1) {
      debt -= 1;
      if (sparks.length < cap) addSpark();
    }
  }

  /** Ages and moves every spark; `paint` draws it at its pre-move position like drawSpark(). */
  function advance(paint: boolean) {
    const c = ctx;
    let alive = 0;
    for (let i = 0; i < sparks.length; i++) {
      const spark = sparks[i];
      // this.opacity = OPT.maxopacity - ++this.age / OPT.lifetime
      const opacity = OPT.maxopacity - ++spark.age / OPT.lifetime;
      if (opacity <= 0) continue;
      if (paint && c) {
        c.globalAlpha = opacity;
        c.fillStyle = spark.color;
        c.fillRect(spark.x, spark.y, OPT.size, OPT.size);
      }
      spark.x += spark.vx;
      spark.y += spark.vy;
      sparks[alive++] = spark;
    }
    sparks.length = alive;
    if (c) c.globalAlpha = 1;
  }

  function clear() {
    if (!ctx) return;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
  }

  return {
    resize(w, h, dpr) {
      width = w;
      height = h;
      margin = Math.min(200, Math.round(Math.min(w, h) * 0.3));
      const field = (w + margin * 2) * (h + margin * 2);
      const density = preview ? 0.7 : 1;
      rate = Math.max(0.75, (SPAWN_PER_FRAME * field * density) / REFERENCE_FIELD);
      cap = Math.min(OPT.amount, Math.ceil(rate * OPT.lifetime * 1.1));
      ctx = fitCanvas(canvas, w, h, dpr);
      clear();
    },

    tick() {
      if (!ctx) return;
      ctx.fillStyle = WASH;
      ctx.fillRect(0, 0, width, height);
      spawn();
      advance(true);
    },

    render() {
      if (!ctx) return;
      clear();
      const c = ctx;
      for (const spark of sparks) {
        c.globalAlpha = Math.max(0, OPT.maxopacity - spark.age / OPT.lifetime);
        c.fillStyle = spark.color;
        c.fillRect(spark.x, spark.y, OPT.size, OPT.size);
      }
      c.globalAlpha = 1;
    },

    reset() {
      sparks = [];
      debt = 0;
      clear();
    },

    // Settle the field for one lifetime without painting, then draw every spark
    // with the trail the 0.1 wash would have left behind it (0.9ⁿ per frame).
    still() {
      sparks = [];
      debt = 0;
      for (let i = 0; i < OPT.lifetime; i++) {
        spawn();
        advance(false);
      }
      if (!ctx) return;
      clear();
      const c = ctx;
      for (const spark of sparks) {
        const opacity = OPT.maxopacity - spark.age / OPT.lifetime;
        c.fillStyle = spark.color;
        for (let k = 24; k >= 0; k--) {
          c.globalAlpha = opacity * 0.9 ** k;
          c.fillRect(spark.x - spark.vx * k, spark.y - spark.vy * k, OPT.size, OPT.size);
        }
      }
      c.globalAlpha = 1;
    }
  };
}
