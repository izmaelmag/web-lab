// Reproducible export of Dice Corners' procedural textures and cues.
//
// Textures are painted by textures.js inside headless Chrome (nearest-neighbour,
// no smoothing) and written as PNG. Cues are rendered by audio.js through an
// OfflineAudioContext with a fixed mulberry32 seed and written as 48 kHz
// 16-bit PCM WAV. Re-running this script regenerates assets/dice-corners/textures,
// audio/ and manifest.json. Fonts in fonts/ are vendored separately and kept.
//
// Requires Google Chrome (CHROME_PATH overrides the default location).

import { createServer } from 'node:http';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const diceRoot = join(root, 'static/dice-corners');
const outRoot = join(root, 'assets/dice-corners');
const textureDir = join(outRoot, 'textures');
const audioDir = join(outRoot, 'audio');

const SAMPLE_RATE = 48000;
const BASE_SEED = 0xd1ce;
const CHROME_PATH = process.env.CHROME_PATH || '/usr/local/bin/google-chrome';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png'
};

const HARNESS = `<!doctype html>
<meta charset="utf-8" />
<title>Dice Corners asset export</title>
<script type="module">
import * as Art from './textures.js';
import * as Logic from './game-logic.js';

const SAMPLE_RATE = ${SAMPLE_RATE};

const GUILD_LINE = { moon: '#9fd4ff', ember: '#ff7a45' };

function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pngOf(canvas) {
  return { png: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height };
}

function faceAtlas(guild) {
  const { canvas, ctx } = Art.pixelCanvas(384, 256);
  Logic.FACE_ORDER.forEach((value, slot) => {
    ctx.drawImage(Art.dieFace(value, guild), (slot % 3) * 128, Math.floor(slot / 3) * 128);
  });
  return canvas;
}

function toonRamp() {
  const { canvas, ctx } = Art.pixelCanvas(4, 1);
  const image = ctx.createImageData(4, 1);
  const stops = [88, 150, 206, 255];
  for (let i = 0; i < stops.length; i++) {
    image.data[i * 4] = stops[i];
    image.data[i * 4 + 1] = stops[i];
    image.data[i * 4 + 2] = stops[i];
    image.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

function encodeWav(buffer) {
  const channels = buffer.numberOfChannels;
  const rate = buffer.sampleRate;
  const src = [];
  for (let c = 0; c < channels; c++) src.push(buffer.getChannelData(c));
  const thresh = 1 / 32768;
  let last = 0;
  let peak = 0;
  for (let i = 0; i < src[0].length; i++) {
    for (let c = 0; c < channels; c++) {
      const a = Math.abs(src[c][i]);
      if (a > peak) peak = a;
      if (a > thresh) last = i;
    }
  }
  const pad = Math.round(rate * 0.05);
  const minFrames = Math.round(rate * 0.05);
  const frames = Math.max(minFrames, Math.min(src[0].length, last + 1 + pad));
  const dataBytes = frames * channels * 2;
  const bytes = new Uint8Array(44 + dataBytes);
  const view = new DataView(bytes.buffer);
  const writeStr = (offset, text) => {
    for (let i = 0; i < text.length; i++) bytes[offset + i] = text.charCodeAt(i);
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataBytes, true);
  let offset = 44;
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < channels; c++) {
      const clamped = Math.max(-1, Math.min(1, src[c][i]));
      view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
      offset += 2;
    }
  }
  let binary = '';
  const chunk = 0x1000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return {
    wav: btoa(binary),
    duration: frames / rate,
    peak,
    sampleRate: rate,
    channels,
    bitDepth: 16
  };
}

window.__paint = (job) => {
  if (job.type === 'dieFace') return pngOf(Art.dieFace(job.value, job.guild));
  if (job.type === 'dieAtlas') return pngOf(faceAtlas(job.guild));
  if (job.type === 'tileAtlas') return pngOf(Art.tileAtlas());
  if (job.type === 'rail') return pngOf(Art.railTexture(job.spec));
  if (job.type === 'boardSigil') {
    return pngOf(
      Art.upscale(Art.sigilCanvas(job.kind, { size: 96, line: job.line, shade: '#0b0712' }), 2)
    );
  }
  if (job.type === 'hudSigil') {
    return pngOf(
      Art.sigilCanvas(job.kind, {
        size: job.size,
        line: GUILD_LINE[job.kind],
        shade: '#07050b',
        fill: '#1d1429'
      })
    );
  }
  if (job.type === 'relic') return pngOf(Art.relicSeal());
  if (job.type === 'table') return pngOf(Art.tableTexture());
  if (job.type === 'grain') return pngOf(Art.grainCanvas());
  if (job.type === 'toon') return pngOf(toonRamp());
  throw new Error('unknown texture job ' + job.type);
};

window.__cue = async (job) => {
  const { createAudio } = await import('./audio.js');
  const ctx = new OfflineAudioContext(2, Math.ceil(SAMPLE_RATE * job.seconds), SAMPLE_RATE);
  const audio = createAudio({ muted: false, context: ctx, random: seeded(job.seed) });
  audio.unlock();
  audio[job.method](...job.args);
  const rendered = await ctx.startRendering();
  const wav = encodeWav(rendered);
  if (!(wav.peak > 0)) throw new Error('silent cue ' + job.method);
  return wav;
};

window.__booted = true;
</script>
`;

function textureHints({ mipmaps, anisotropy = 0, minFilter, magFilter = 'nearest' }) {
  return {
    filter: false,
    mipmaps,
    minFilter,
    magFilter,
    repeat: 'clamp',
    srgb: true,
    anisotropy
  };
}

const mipNearest = textureHints({
  mipmaps: true,
  anisotropy: 4,
  minFilter: 'linear-mipmap-linear',
  magFilter: 'nearest'
});
const nearest = textureHints({
  mipmaps: false,
  minFilter: 'nearest',
  magFilter: 'nearest'
});

function textureJobs() {
  const jobs = [];
  for (const [guild, name] of [
    [1, 'moon'],
    [2, 'ember']
  ]) {
    for (let value = 1; value <= 6; value++) {
      jobs.push({
        file: `die-face-${name}-${value}.png`,
        job: { type: 'dieFace', value, guild },
        source: `textures.js dieFace(${value}, ${guild})`,
        use: `${name === 'moon' ? 'Moon' : 'Ember'} die face ${value}. 32×32 art pixels, nearest-upscaled ×4. Pip layout is PIP_LAYOUT[${value}].`,
        godot: mipNearest
      });
    }
    jobs.push({
      file: `die-atlas-${name}.png`,
      job: { type: 'dieAtlas', guild },
      source: `game.js faceAtlas(${guild}) via textures.js dieFace and game-logic.js FACE_ORDER`,
      use: `${name === 'moon' ? 'Moon' : 'Ember'} 3×2 face atlas in three.js BoxGeometry slot order [+X, -X, +Y, -Y, +Z, -Z] = FACE_ORDER [3, 4, 1, 6, 2, 5]. Each slot is 128×128.`,
      godot: mipNearest
    });
  }
  jobs.push({
    file: 'tile-atlas.png',
    job: { type: 'tileAtlas' },
    source: 'textures.js tileAtlas()',
    use: '2×2 atlas of carved stone tile variants, 32 art pixels each, nearest-upscaled ×4. Per-tile variant index is chosen in game.js with seeded(2718), not inside this texture.',
    godot: mipNearest
  });
  const rails = [
    [
      'rail-moon-edge.png',
      'Moon-edge rail (world +Z, board row 1). Columns A–I, upright.',
      11,
      false,
      false,
      10.7,
      0.85,
      'letters'
    ],
    [
      'rail-ember-edge.png',
      'Ember-edge rail (world −Z, board row 9). Columns A–I, engraved upside down.',
      12,
      true,
      false,
      10.7,
      0.85,
      'letters'
    ],
    [
      'rail-west.png',
      'West rail (column A). Rows 1–9, upright.',
      13,
      false,
      true,
      9,
      0.85,
      'numbers'
    ],
    [
      'rail-east.png',
      'East rail (column I). Rows 1–9, engraved upside down.',
      14,
      true,
      true,
      9,
      0.85,
      'numbers'
    ]
  ];
  for (const [file, use, seed, flip, vertical, length, width, labels] of rails) {
    const spec =
      labels === 'letters'
        ? {
            length,
            width,
            seed,
            flip,
            vertical,
            labels: [...'ABCDEFGHI'].map((char, c) => ({ at: c + 1.35, char }))
          }
        : {
            length,
            width,
            seed,
            flip,
            vertical,
            labels: Array.from({ length: 9 }, (_, r) => ({ at: 8.5 - r, char: String(r + 1) }))
          };
    jobs.push({
      file,
      job: { type: 'rail', spec },
      source: `textures.js railTexture(seed ${seed}, flip ${flip}, vertical ${vertical})`,
      use: `${use} 32 art pixels per world unit, nearest-upscaled ×2.`,
      godot: mipNearest
    });
  }
  jobs.push(
    {
      file: 'sigil-moon-board.png',
      job: { type: 'boardSigil', kind: 'moon', line: '#5d77b4' },
      source:
        "textures.js upscale(sigilCanvas('moon', { size: 96, line: '#5d77b4', shade: '#0b0712' }), 2)",
      use: 'Moon crescent decal on Ember’s home corner (goal Moon must fill), 3×3 cells.',
      godot: mipNearest
    },
    {
      file: 'sigil-ember-board.png',
      job: { type: 'boardSigil', kind: 'ember', line: '#b8573a' },
      source:
        "textures.js upscale(sigilCanvas('ember', { size: 96, line: '#b8573a', shade: '#0b0712' }), 2)",
      use: 'Ember flame decal on Moon’s home corner (goal Ember must fill), 3×3 cells.',
      godot: mipNearest
    }
  );
  for (const size of [24, 32]) {
    for (const kind of ['moon', 'ember']) {
      jobs.push({
        file: `sigil-${kind}-hud-${size}.png`,
        job: { type: 'hudSigil', kind, size },
        source: `textures.js sigilCanvas('${kind}', { size: ${size}, line: guild colour, shade: '#07050b', fill: '#1d1429' })`,
        use:
          size === 24
            ? `${kind} sigil painted into the HUD guild plate (canvas is 24×24, displayed at 34 CSS px).`
            : `${kind} sigil used on the menu versus row, the turn banner and the win card (32×32).`,
        godot: nearest
      });
    }
  }
  jobs.push(
    {
      file: 'relic-seal.png',
      job: { type: 'relic' },
      source: 'textures.js relicSeal()',
      use: 'Gold six-pip seal decal on the centre cell. 32 art pixels, nearest-upscaled ×4.',
      godot: mipNearest
    },
    {
      file: 'table.png',
      job: { type: 'table' },
      source: 'textures.js tableTexture()',
      use: 'Astral table top, 512×512, seed 7331. Sampled with nearest filtering and no mipmaps.',
      godot: nearest
    },
    {
      file: 'grain.png',
      job: { type: 'grain' },
      source: 'textures.js grainCanvas()',
      use: '64×64 film-grain tile for the CSS overlay. Seed 99. Tiled at 128 CSS px, overlay blend, opacity 0.5.',
      godot: nearest
    },
    {
      file: 'toon-gradient.png',
      job: { type: 'toon' },
      source: 'game.js gradientMap bytes [88, 150, 206, 255]',
      use: 'Four-stop toon ramp. Sampled nearest at NdotL * 0.5 + 0.5. Red, green and blue hold the same stop so the ramp is usable as an RGB texture.',
      godot: nearest
    }
  );
  return jobs;
}

function cueJobs() {
  const jobs = [];
  const add = (id, method, args, seconds, variants, use) => {
    for (let variant = 0; variant < variants; variant++) {
      const file = variants === 1 || variant === 0 ? `${id}.wav` : `${id}-v${variant + 1}.wav`;
      jobs.push({
        file,
        method,
        args,
        seconds,
        seed: BASE_SEED + variant,
        source: `audio.js createAudio().${method}(${args.join(', ')})`,
        use:
          variants === 1
            ? use
            : `${use} Variant ${variant + 1} of ${variants}; seed ${BASE_SEED + variant} (0x${(BASE_SEED + variant).toString(16)}). The unsuffixed file is the canonical take.`,
        godot: { loop: false, loopBegin: null, loopEnd: null, normalize: false }
      });
    }
  };
  add('ui', 'ui', [], 1.2, 1, 'Button click: rules, sound, motion, start, play again.');
  add(
    'hover',
    'hover',
    [],
    1.0,
    1,
    'Pointer entered a new reachable cell, or the keyboard cursor moved.'
  );
  add('select-moon', 'select', [1], 2.8, 3, 'Moon die picked. Includes the wooden clack.');
  add('select-ember', 'select', [2], 2.8, 3, 'Ember die picked. Includes the wooden clack.');
  add('deselect', 'deselect', [], 2.2, 1, 'Pick dropped before any roll.');
  for (let index = 0; index < 6; index++) {
    add(
      `step-${index}`,
      'step',
      [index, false],
      2.6,
      index === 0 ? 3 : 1,
      `A roll that is not the last step of the turn. Pentatonic degree ${index} (0-based).`
    );
    add(
      `step-${index}-last`,
      'step',
      [index, true],
      3.2,
      index === 5 ? 3 : 1,
      `The roll that spends the final step. Pentatonic degree ${index}, with the extra fifth.`
    );
  }
  add('undo', 'undo', [], 2.4, 3, 'One roll undone. Includes the wooden clack.');
  add(
    'denied',
    'denied',
    [],
    1.4,
    1,
    'Illegal pick, stuck die, locked die, or a key that does nothing.'
  );
  add('turn-moon', 'turn', [1], 3.6, 1, 'Turn handed to Moon, including the opening banner.');
  add('turn-ember', 'turn', [2], 3.6, 1, 'Turn handed to Ember.');
  add('forfeit', 'forfeit', [], 3.8, 1, 'A guild has no die free to move and the turn passes.');
  add(
    'arrive',
    'arrive',
    [],
    2.6,
    1,
    'A turn ended with the moved die standing in its goal corner.'
  );
  add('bonus', 'bonus', [], 3.4, 1, 'Centre relic: the die is turned to 6.');
  add('rattle', 'rattle', [], 2.2, 3, 'Opening-roll tumble, once per tied or deciding pair.');
  add('win-moon', 'win', [1], 4.6, 1, 'Moon fills the far corner.');
  add('win-ember', 'win', [2], 4.6, 1, 'Ember fills the far corner.');
  return jobs;
}

function listen() {
  const harness = HARNESS;
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1');
      if (url.pathname === '/export-harness.html') {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        res.end(harness);
        return;
      }
      const relative = normalize(decodeURIComponent(url.pathname))
        .replace(/^[/\\]+/, '')
        .replace(/^(\.\.[/\\])+/, '');
      const path = join(diceRoot, relative);
      if (relative.includes('..') || !path.startsWith(diceRoot)) {
        res.writeHead(403).end();
        return;
      }
      const body = await readFile(path);
      res.writeHead(200, {
        'content-type': MIME[extname(path)] ?? 'application/octet-stream'
      });
      res.end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('no port');
      resolve({ server, port: address.port });
    });
  });
}

async function main() {
  await rm(textureDir, { recursive: true, force: true });
  await rm(audioDir, { recursive: true, force: true });
  await mkdir(textureDir, { recursive: true });
  await mkdir(audioDir, { recursive: true });

  const { server, port } = await listen();
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(180000);
    await page.goto(`http://127.0.0.1:${port}/export-harness.html`);
    await page.waitForFunction(() => window.__booted === true);

    const textures = [];
    for (const spec of textureJobs()) {
      const painted = await page.evaluate((job) => window.__paint(job), spec.job);
      const png = Buffer.from(painted.png.split(',')[1], 'base64');
      await writeFile(join(textureDir, spec.file), png);
      textures.push({
        file: `textures/${spec.file}`,
        source: spec.source,
        width: painted.width,
        height: painted.height,
        use: spec.use,
        godot: spec.godot
      });
      console.log(`texture ${spec.file} ${painted.width}×${painted.height}`);
    }

    const audio = [];
    for (const spec of cueJobs()) {
      const rendered = await page.evaluate((job) => window.__cue(job), {
        method: spec.method,
        args: spec.args,
        seed: spec.seed,
        seconds: spec.seconds
      });
      if (
        rendered.sampleRate !== SAMPLE_RATE ||
        rendered.channels !== 2 ||
        rendered.bitDepth !== 16
      ) {
        throw new Error(`unexpected wav format for ${spec.file}`);
      }
      await writeFile(join(audioDir, spec.file), Buffer.from(rendered.wav, 'base64'));
      audio.push({
        file: `audio/${spec.file}`,
        source: spec.source,
        sampleRate: rendered.sampleRate,
        channels: rendered.channels,
        bitDepth: rendered.bitDepth,
        durationSeconds: Number(rendered.duration.toFixed(6)),
        peak: Number(rendered.peak.toFixed(6)),
        seed: spec.seed,
        renderSeconds: spec.seconds,
        use: spec.use,
        godot: spec.godot
      });
      console.log(
        `audio ${spec.file} ${rendered.duration.toFixed(3)}s peak ${rendered.peak.toFixed(3)}`
      );
    }

    const chrome = await browser.version();
    const manifest = {
      game: 'Dice Corners',
      version: '2.0.0',
      generator: 'scripts/export-dice-assets.mjs',
      chrome,
      seed: {
        algorithm:
          'mulberry32 as textures.js seeded() and src/lib/dice-corners/test-utils.ts seededRandom',
        canonical: BASE_SEED,
        note: 'Each cue builds its own AudioContext, so the seed rebuilds the reverb impulse and then the cue. Variant N uses canonical + (N - 1). Trailing silence below one 16-bit LSB is trimmed, then 50 ms is kept.'
      },
      notExported: [
        'Sky, route overlay and spark shaders are procedural GLSL. See docs/dice-corners/SHADERS.md.',
        'Spark particles are coloured points, not sprites.',
        'Opening-roll pips are CSS boxes driven by PIP_LAYOUT, not a texture.',
        'The 5×7 coordinate glyphs are baked into the rail PNGs and listed in PRESENTATION.md.'
      ],
      textures,
      audio
    };
    await writeFile(join(outRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`wrote ${textures.length} textures and ${audio.length} cues`);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
