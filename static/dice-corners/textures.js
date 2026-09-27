// Dice Corners — procedural pixel art.
//
// Every surface is painted here at low resolution, one art pixel at a time,
// then upscaled with nearest-neighbour so it stays crisp on the GPU. Seeded
// randomness keeps the table, tiles and wear identical on every load.
import { PIP_LAYOUT } from './game-logic.js';

/** Shared palette: a restrained near-black / plum / ink world with ivory and ember guilds. */
export const PALETTE = Object.freeze({
  void: '#07050b',
  ink: '#0e0a14',
  plum900: '#150e1f',
  plum800: '#1d1429',
  plum700: '#2a1d3a',
  plum600: '#3a2850',
  plum500: '#54406e',
  mist: '#a898b8',
  bone: '#efe6d2',
  gold: '#ffc857',
  goldDeep: '#8a5a1c',
  moon: '#9fd4ff',
  ember: '#ff7a45'
});

/**
 * Per-guild die colours. Moon: ivory body, ink pips, a moon-blue ace.
 * Ember: garnet body, bone-gold pips.
 */
export const GUILD_ART = Object.freeze({
  1: {
    body: '#ece2cc',
    light: '#fffaef',
    dark: '#b9ab90',
    rim: '#6f6553',
    speck: '#dcd0b6',
    pip: '#1b1730',
    pipLight: '#4a4466',
    pipDark: '#07060d',
    ace: '#24508a',
    aceLight: '#5b8cc9'
  },
  2: {
    body: '#7a1c2b',
    light: '#a5343f',
    dark: '#4a0f1a',
    rim: '#27060d',
    speck: '#6a1624',
    pip: '#ffd98f',
    pipLight: '#fff3d3',
    pipDark: '#b57a2c',
    ace: '#ffc05a',
    aceLight: '#fff0c4'
  }
});

/**
 * @param {number} seed
 * @returns {() => number}
 */
export function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** Ordered-dither threshold in [0, 1) for an art pixel. */
export const bayer = (/** @type {number} */ x, /** @type {number} */ y) =>
  (BAYER4[(y & 3) * 4 + (x & 3)] + 0.5) / 16;

/**
 * @param {number} width
 * @param {number} height
 */
export function pixelCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
  ctx.imageSmoothingEnabled = false;
  /** @param {number} x @param {number} y @param {string} color */
  const dot = (x, y, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
  };
  return { canvas, ctx, dot };
}

/**
 * Nearest-neighbour enlargement so GPU mipmaps start from crisp pixels.
 * @param {HTMLCanvasElement} source
 * @param {number} factor
 */
export function upscale(source, factor) {
  const { canvas, ctx } = pixelCanvas(source.width * factor, source.height * factor);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/* ---------------------------------------------------------------------------
   Dice faces — 32×32 art pixels, pips on the classic 4×4 grid.
   --------------------------------------------------------------------------- */

/**
 * @param {number} value
 * @param {1 | 2} guild
 */
export function dieFace(value, guild) {
  const art = GUILD_ART[guild];
  const S = 32;
  const { canvas, ctx, dot } = pixelCanvas(S, S);
  const random = seeded(value * 97 + guild * 13);
  ctx.fillStyle = art.body;
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 26; i++)
    dot(3 + Math.floor(random() * 26), 3 + Math.floor(random() * 26), art.speck);
  // stepped bevel: light top/left, dark bottom/right, dark rim
  ctx.fillStyle = art.light;
  ctx.fillRect(1, 1, S - 2, 2);
  ctx.fillRect(1, 1, 2, S - 2);
  ctx.fillStyle = art.dark;
  ctx.fillRect(1, S - 3, S - 2, 2);
  ctx.fillRect(S - 3, 1, 2, S - 2);
  ctx.fillStyle = art.rim;
  ctx.fillRect(0, 0, S, 1);
  ctx.fillRect(0, S - 1, S, 1);
  ctx.fillRect(0, 0, 1, S);
  ctx.fillRect(S - 1, 0, 1, S);

  const ace = value === 1;
  const radius = ace ? 4.6 : 3.3;
  for (const [gx, gy] of PIP_LAYOUT[value]) {
    const cx = gx * 8;
    const cy = gy * 8;
    for (let y = Math.floor(cy - radius - 1); y <= cy + radius + 1; y++) {
      for (let x = Math.floor(cx - radius - 1); x <= cx + radius + 1; x++) {
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        const d = Math.hypot(dx, dy);
        if (d > radius) continue;
        let color = ace ? art.ace : art.pip;
        if (d > radius - 1.1 && dx + dy > 0.6) color = art.pipDark;
        else if (dx + dy < -radius * 0.7) color = ace ? art.aceLight : art.pipLight;
        dot(x, y, color);
      }
    }
  }
  return upscale(canvas, 4);
}

/* ---------------------------------------------------------------------------
   Carved tiles — a 2×2 atlas of worn stone variants (32 px each).
   --------------------------------------------------------------------------- */

export function tileAtlas() {
  const S = 32;
  const { canvas, ctx, dot } = pixelCanvas(S * 2, S * 2);
  const stone = ['#2b2138', '#271d33', '#2e2340', '#261c31'];
  for (let v = 0; v < 4; v++) {
    const ox = (v % 2) * S;
    const oy = Math.floor(v / 2) * S;
    const random = seeded(401 + v * 31);
    ctx.fillStyle = stone[v];
    ctx.fillRect(ox, oy, S, S);
    // dithered speckle and faint mottling
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const n = random();
        if (n < 0.05) dot(ox + x, oy + y, '#352a45');
        else if (n > 0.965) dot(ox + x, oy + y, '#1c1426');
      }
    }
    // carved inner groove
    ctx.fillStyle = '#1a1223';
    ctx.fillRect(ox + 5, oy + 5, S - 10, 1);
    ctx.fillRect(ox + 5, oy + 5, 1, S - 10);
    ctx.fillStyle = '#3b2e4d';
    ctx.fillRect(ox + 6, oy + S - 5, S - 11, 1);
    ctx.fillRect(ox + S - 5, oy + 6, 1, S - 11);
    // bevel
    ctx.fillStyle = '#463757';
    ctx.fillRect(ox, oy, S, 1);
    ctx.fillRect(ox, oy, 1, S);
    ctx.fillStyle = '#3a2d4a';
    ctx.fillRect(ox + 1, oy + 1, S - 2, 1);
    ctx.fillRect(ox + 1, oy + 1, 1, S - 2);
    ctx.fillStyle = '#120c19';
    ctx.fillRect(ox, oy + S - 1, S, 1);
    ctx.fillRect(ox + S - 1, oy, 1, S);
    // wear: a hairline crack and a chipped corner
    let cx = ox + 8 + Math.floor(random() * 14);
    let cy = oy + 8 + Math.floor(random() * 14);
    for (let i = 0; i < 6 + v; i++) {
      dot(cx, cy, '#170f20');
      cx += random() < 0.5 ? 1 : 0;
      cy += random() < 0.6 ? 1 : -1;
    }
    const corner = Math.floor(random() * 4);
    const chipX = ox + (corner % 2 ? S - 3 : 1);
    const chipY = oy + (corner > 1 ? S - 3 : 1);
    ctx.fillStyle = '#150e1c';
    ctx.fillRect(chipX, chipY, 2, 2);
  }
  return upscale(canvas, 4);
}

/* ---------------------------------------------------------------------------
   Tiny bitmap font (5×7) for engraved coordinates.
   --------------------------------------------------------------------------- */

/** @type {Record<string, string[]>} */
const GLYPHS = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01111', '10000', '10000', '10011', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  2: ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  3: ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  4: ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  5: ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  6: ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  7: ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  8: ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  9: ['01110', '10001', '10001', '01111', '00001', '00010', '01100']
};

/**
 * Engraves a glyph centred on (cx, cy); `flip` turns it 180° for the far side.
 * @param {(x: number, y: number, c: string) => void} dot
 * @param {string} char
 * @param {number} cx
 * @param {number} cy
 * @param {boolean} flip
 */
function engrave(dot, char, cx, cy, flip) {
  const rows = GLYPHS[char];
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 5; c++) {
      if (rows[r][c] !== '1') continue;
      const x = flip ? cx + 2 - c : cx - 2 + c;
      const y = flip ? cy + 3 - r : cy - 3 + r;
      dot(x + 1, y + 1, '#0b0710');
      dot(x, y, '#b08a4a');
    }
  }
}

/* ---------------------------------------------------------------------------
   Frame rails — dark lacquer, a worn gold inlay, engraved coordinates.
   32 art px per world unit. `labels` are centred at the given unit offsets.
   --------------------------------------------------------------------------- */

/**
 * @param {{ length: number, width: number, seed: number, labels: { at: number, char: string }[], flip: boolean, vertical: boolean }} spec
 */
export function railTexture({ length, width, seed, labels, flip, vertical }) {
  const L = Math.round(length * 32);
  const W = Math.round(width * 32);
  const w = vertical ? W : L;
  const h = vertical ? L : W;
  const { canvas, ctx, dot } = pixelCanvas(w, h);
  const random = seeded(seed);
  ctx.fillStyle = '#1b1224';
  ctx.fillRect(0, 0, w, h);
  // lacquer grain along the rail
  for (let i = 0; i < L * 1.4; i++) {
    const a = Math.floor(random() * L);
    const b = Math.floor(random() * W);
    const len = 2 + Math.floor(random() * 6);
    for (let k = 0; k < len; k++) {
      const along = a + k;
      if (along >= L) break;
      if (vertical) dot(b, along, random() < 0.5 ? '#231830' : '#150d1d');
      else dot(along, b, random() < 0.5 ? '#231830' : '#150d1d');
    }
  }
  // inlay lines (with worn gaps) near both long edges
  for (let along = 0; along < L; along++) {
    const worn = random() < 0.07;
    for (const [off, color] of /** @type {[number, string][]} */ ([
      [3, worn ? '#3b2a20' : '#9a7338'],
      [4, '#2a1a12'],
      [W - 5, worn ? '#3b2a20' : '#7c5a2a'],
      [W - 4, '#2a1a12']
    ])) {
      if (vertical) dot(off, along, color);
      else dot(along, off, color);
    }
  }
  // outer bevel
  ctx.fillStyle = '#3a2a48';
  if (vertical) ctx.fillRect(0, 0, 1, h);
  else ctx.fillRect(0, 0, w, 1);
  for (const { at, char } of labels) {
    const along = Math.round(at * 32);
    const across = Math.round(W / 2);
    if (vertical) engrave(dot, char, across, along, flip);
    else engrave(dot, char, along, across, flip);
  }
  return upscale(canvas, 2);
}

/* ---------------------------------------------------------------------------
   Engraved sigils — Moon (crescent) and Ember (flame). Used on the board goal
   corners (96 px) and, at small sizes, in the HUD.
   --------------------------------------------------------------------------- */

/**
 * Inside-test per sigil in a -1..1 square.
 * @param {'moon' | 'ember'} kind
 * @param {number} u
 * @param {number} v
 */
function sigilMask(kind, u, v) {
  const r = Math.hypot(u, v);
  const ring = r > 0.86 && r < 0.96;
  const ticks = r > 0.7 && r < 0.8 && (Math.abs(u) < 0.045 || Math.abs(v) < 0.045);
  if (kind === 'moon') {
    const crescent = Math.hypot(u + 0.05, v) < 0.52 && Math.hypot(u - 0.19, v + 0.1) > 0.44;
    const star =
      (Math.abs(u - 0.3) < 0.035 && Math.abs(v + 0.28) < 0.12) ||
      (Math.abs(v + 0.28) < 0.035 && Math.abs(u - 0.3) < 0.12);
    return ring || ticks || crescent || star;
  }
  // ember: a flame (teardrop with a notch) inside a diamond
  const diamond = Math.abs(Math.abs(u) + Math.abs(v) - 0.66) < 0.05;
  const body = Math.hypot(u, v - 0.12) < 0.3;
  const tipY = -0.72;
  const tip =
    v < 0.12 &&
    v > tipY &&
    Math.abs(u + 0.06 * Math.sin((v + 0.2) * 9)) < 0.3 * ((v - tipY) / (0.12 - tipY));
  const core = Math.hypot(u, v - 0.16) < 0.12;
  return ring || ticks || diamond || ((body || tip) && !core);
}

/**
 * @param {'moon' | 'ember'} kind
 * @param {{ size?: number, line?: string, shade?: string | null, fill?: string | null }} [style]
 */
export function sigilCanvas(
  kind,
  { size = 96, line = '#6f86b8', shade = '#0d0914', fill = null } = {}
) {
  const { canvas, dot } = pixelCanvas(size, size);
  const inside = (/** @type {number} */ x, /** @type {number} */ y) =>
    sigilMask(kind, ((x + 0.5) / size) * 2 - 1, ((y + 0.5) / size) * 2 - 1);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (inside(x, y)) dot(x, y, line);
      else if (shade && inside(x - 1, y - 1)) dot(x, y, shade);
      else if (fill && Math.hypot(x - size / 2 + 0.5, y - size / 2 + 0.5) < size * 0.43)
        dot(x, y, fill);
    }
  }
  return canvas;
}

/** The centre relic seal: a gold ring holding six pips. */
export function relicSeal() {
  const S = 32;
  const { canvas, dot } = pixelCanvas(S, S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const d = Math.hypot(x + 0.5 - 16, y + 0.5 - 16);
      if (d > 12.2 && d < 14.4) dot(x, y, d < 13.3 ? '#ffc857' : '#8a5a1c');
      else if (d <= 12.2 && d > 11.2) dot(x, y, '#2a1a0c');
    }
  }
  for (const [gx, gy] of PIP_LAYOUT[6]) {
    const cx = 16 + (gx - 2) * 5;
    const cy = 16 + (gy - 2) * 6;
    for (let y = cy - 2; y <= cy + 1; y++) {
      for (let x = cx - 2; x <= cx + 1; x++) {
        const corner = (x === cx - 2 || x === cx + 1) && (y === cy - 2 || y === cy + 1);
        if (!corner) dot(x, y, x + y > cx + cy - 1 ? '#b8862e' : '#ffd27a');
      }
    }
  }
  return upscale(canvas, 4);
}

/* ---------------------------------------------------------------------------
   The astral table — a worn star chart the board sits on.
   --------------------------------------------------------------------------- */

export function tableTexture() {
  const S = 512;
  const { canvas, ctx, dot } = pixelCanvas(S, S);
  const random = seeded(7331);
  const image = ctx.createImageData(S, S);
  const c = S / 2;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const r = Math.hypot(x - c, y - c) / c;
      const mottling =
        Math.sin(x * 0.043 + Math.sin(y * 0.031) * 2.1) * 0.5 +
        Math.sin(y * 0.057 - x * 0.012) * 0.5;
      let level = 0.55 + 0.25 * mottling - r * 0.55;
      level = Math.floor(level * 3 + bayer(x, y)) / 3;
      const i = (y * S + x) * 4;
      const t = Math.max(0, Math.min(1, level));
      image.data[i] = 10 + t * 16;
      image.data[i + 1] = 7 + t * 10;
      image.data[i + 2] = 16 + t * 22;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  // concentric chart rings and ticks
  const ring = (
    /** @type {number} */ radius,
    /** @type {string} */ color,
    /** @type {number} */ dash
  ) => {
    const steps = Math.ceil(radius * 7);
    for (let i = 0; i < steps; i++) {
      if (dash && Math.floor(i / dash) % 2) continue;
      const a = (i / steps) * Math.PI * 2;
      dot(Math.round(c + Math.cos(a) * radius), Math.round(c + Math.sin(a) * radius), color);
    }
  };
  ring(118, '#3b2b50', 0);
  ring(124, '#261a35', 4);
  ring(168, '#3b2b50', 0);
  ring(206, '#2d2040', 6);
  ring(240, '#241932', 0);
  for (let k = 0; k < 72; k++) {
    const a = (k / 72) * Math.PI * 2;
    const len = k % 6 === 0 ? 9 : 4;
    for (let s = 0; s < len; s++) {
      dot(
        Math.round(c + Math.cos(a) * (168 + s)),
        Math.round(c + Math.sin(a) * (168 + s)),
        '#3d2d52'
      );
    }
  }
  // twelve original glyph marks between the outer rings
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2 + 0.26;
    const gx = Math.round(c + Math.cos(a) * 187);
    const gy = Math.round(c + Math.sin(a) * 187);
    const kind = k % 4;
    for (let y = -3; y <= 3; y++) {
      for (let x = -3; x <= 3; x++) {
        const d = Math.hypot(x, y);
        const on =
          (kind === 0 && d > 2.2 && d < 3.4) ||
          (kind === 1 && (x === 0 || y === 0) && d < 3.5) ||
          (kind === 2 && Math.abs(x) + Math.abs(y) === 3) ||
          (kind === 3 && ((d > 2.2 && d < 3.4 && y <= 0) || (x === 0 && y > 0)));
        if (on || (x === 0 && y === 0 && kind !== 1)) dot(gx + x, gy + y, '#6b5588');
      }
    }
  }
  // stars and a few constellations
  /** @type {[number, number][]} */
  const stars = [];
  for (let i = 0; i < 360; i++) {
    const a = random() * Math.PI * 2;
    const r = 122 + random() * 128;
    const x = Math.round(c + Math.cos(a) * r);
    const y = Math.round(c + Math.sin(a) * r);
    const bright = random() < 0.12;
    dot(x, y, bright ? '#cbb9ea' : '#56457a');
    if (bright && random() < 0.4) {
      dot(x + 1, y, '#56457a');
      dot(x - 1, y, '#56457a');
      dot(x, y + 1, '#56457a');
      dot(x, y - 1, '#56457a');
    }
    if (bright) stars.push([x, y]);
  }
  for (let i = 0; i + 1 < stars.length; i += 3) {
    const [ax, ay] = stars[i];
    const [bx, by] = stars[i + 1];
    if (Math.hypot(ax - bx, ay - by) > 70) continue;
    const n = Math.max(Math.abs(ax - bx), Math.abs(ay - by));
    for (let s = 1; s < n; s += 2)
      dot(Math.round(ax + ((bx - ax) * s) / n), Math.round(ay + ((by - ay) * s) / n), '#2f2344');
  }
  // scratches from centuries of play
  for (let i = 0; i < 40; i++) {
    let x = random() * S;
    let y = random() * S;
    const a = random() * Math.PI;
    for (let s = 0; s < 6 + random() * 14; s++) {
      dot(Math.round(x), Math.round(y), '#241a31');
      x += Math.cos(a);
      y += Math.sin(a);
    }
  }
  return canvas;
}

/** A tiny noise tile for the CSS film grain overlay. */
export function grainCanvas() {
  const S = 64;
  const { canvas, ctx } = pixelCanvas(S, S);
  const random = seeded(99);
  const image = ctx.createImageData(S, S);
  for (let i = 0; i < S * S; i++) {
    const v = random() * 255;
    image.data[i * 4] = v;
    image.data[i * 4 + 1] = v;
    image.data[i * 4 + 2] = v;
    image.data[i * 4 + 3] = random() < 0.5 ? 40 : 0;
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}
