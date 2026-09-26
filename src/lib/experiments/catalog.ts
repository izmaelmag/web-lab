// The CodePen archive: pens by @izmaelmag rebuilt from their original source.
// Order is editorial, not a ranking.

export const PROFILE_URL = 'https://codepen.io/izmaelmag';

export interface Formula {
  label: string;
  expr: string;
}

export interface Experiment {
  slug: string;
  index: string;
  title: string;
  /** Title of the pen on CodePen. */
  originalTitle: string;
  penId: string;
  url: string;
  /** One line for the index and meta description. */
  summary: string;
  /** The one line of maths that makes the pen, shown in the index. */
  signature: string;
  /** Accessible description of the animation itself. */
  label: string;
  about: string[];
  maths: Formula[];
  adaptation: string[];
}

const pen = (id: string) => `${PROFILE_URL}/pen/${id}`;

export const experiments: Experiment[] = [
  {
    slug: 'rainbow-rain',
    index: '01',
    title: 'Rainbow Rain',
    originalTitle: '🌈 Rainy background',
    penId: 'ggYzGO',
    url: pen('ggYzGO'),
    summary:
      'Two-pixel sparks in random colours drift down and to the left, fading over 200 frames behind a translucent black wash.',
    signature: 'Δ = 0.05 · (−0.5, 1) · a / 2,  opacity = 1 − age / 200',
    label:
      'Rainbow Rain: a black field of tiny multicoloured sparks drifting diagonally down-left, each leaving a short fading trail.',
    about: [
      'A background piece: one canvas, one array of sparks. Every spark is born somewhere in a field 200 px larger than the screen, picks a random acceleration between 5 and 40 and a random colour from the whole RGB cube, then slides along the same (−0.5, 1) direction until its opacity runs out.',
      'There is no clearing. Each frame lays a 10% black rectangle over the last one, so faster sparks smear into short streaks while slow ones just flicker in place — the rain comes from the wash, not from the particles.'
    ],
    maths: [
      { label: 'spawn', expr: 'x ∈ [−200, W + 200], y ∈ [−200, H + 200]' },
      { label: 'acceleration', expr: 'a = rand(5, 40)' },
      { label: 'drift / frame', expr: 'Δ = 0.05 · (−0.5, 1) · a / 2   → up to (−0.5, 1) px' },
      { label: 'decay', expr: 'opacity = 1 − age / 200' },
      { label: 'colour', expr: 'rgb(rand(0, 255), rand(0, 255), rand(0, 255))' },
      { label: 'trail', expr: 'fill rgba(0, 0, 0, 0.1) every frame   → 0.9ⁿ' }
    ],
    adaptation: [
      'Sparks spawn per frame from the stage area instead of a 0.2 ms setInterval (which browsers clamp to ~4 ms), keeping the original density on phones and in previews; the 5 000 cap still applies.',
      'The stylesheet’s .aim reticle — a 45° square with #77f crosshairs — follows the pointer here. The recovered pen markup never rendered it.',
      'Dead sparks are compacted in place; the original spliced inside forEach and skipped a neighbour on every removal.',
      'Reduced motion: the field is settled for one lifetime and drawn once, each spark with the 0.9ⁿ trail the wash would have left.'
    ]
  },
  {
    slug: 'orbit-geometry',
    index: '02',
    title: 'Orbit Geometry',
    originalTitle: 'HTML5 canvas geometry animation',
    penId: 'MbyXXL',
    url: pen('MbyXXL'),
    summary:
      'Three points ride a circle; each carries a satellite turning seven times faster, dotting its path onto a second canvas.',
    signature: 'R2 = R1 / 2π · COUNT,  φᵢ = θᵢ + θᵢ · COUNT · 2',
    label:
      'Orbit Geometry: three white points rotate on a circle, each with a fast satellite; lines join them and the satellites leave a looping dotted trace.',
    about: [
      'Two stacked canvases. The top one is cleared every frame and holds the construction: a centre point, three first-level points on R1, a satellite on R2 around each, spokes to the centre and a polygon through the satellites.',
      'The bottom one is never cleared. Each satellite stamps a 1 px dot on it and a 5% navy wash slowly eats the old ones, so the trace is a comet rather than a finished curve.'
    ],
    maths: [
      { label: 'satellite radius', expr: 'R2 = R1 / 2π · COUNT   (R1 = 150, COUNT = 3)' },
      { label: 'rotation', expr: 'θ −= π / 360 · SPEED   (SPEED = 0.5)' },
      { label: 'first level', expr: 'Pᵢ = C + R1 · (cos θᵢ, sin θᵢ),  θᵢ = θ + i · 2π / COUNT' },
      { label: 'satellites', expr: 'Sᵢ = Pᵢ + R2 · (cos φᵢ, sin φᵢ),  φᵢ = θᵢ + θᵢ · COUNT · 2' },
      { label: 'trail wash', expr: 'fill rgba(26, 29, 37, 0.05) every frame' }
    ],
    adaptation: [
      'One transform replaces CENTER = innerWidth / 2 and scales R1, R2, point sizes and strokes together, so the figure keeps its proportions from a phone to a wide screen.',
      'The layered canvases stay layered: construction on top, trails underneath on the original #202639.',
      'Reduced motion: the full closed trace is drawn — after one turn of the ring each satellite has made 1 + 2·COUNT turns and is back where it started.'
    ]
  },
  {
    slug: 'trippy-geometry',
    index: '03',
    title: 'Trippy Geometry',
    originalTitle: 'HTML5 canvas: trippy geometry animation',
    penId: 'yVOqGe',
    url: pen('yVOqGe'),
    summary:
      'The same orbit machine with every constant rolled at load: point count, radii, speed, stroke and trail wash.',
    signature: 'COUNT = ⌊rand(2, 12)⌋,  R2 = R1 / (π · rand(1, 4)) · COUNT',
    label:
      'Trippy Geometry: a randomly configured ring of rotating points and satellites joined by white lines over a tinted, fading trail.',
    about: [
      'A fork of Orbit Geometry where nothing is fixed. COUNT, R1, the R2 divisor, SPEED, the stroke width, three point sizes and the colour and strength of the trail wash are all rolled when the page loads.',
      'Most rolls send the satellites far outside the ring — R2 grows with COUNT — and the wash colour tints the trail canvas, so every load is a different figure from the same coordinate algorithm.'
    ],
    maths: [
      { label: 'count', expr: 'COUNT = ⌊rand(2, 12)⌋   → 2 … 11' },
      { label: 'ring radius', expr: 'R1 = rand(60, (H − 100) / 2)' },
      { label: 'satellite radius', expr: 'R2 = R1 / (π · rand(1, 4)) · COUNT' },
      { label: 'speed', expr: 'SPEED = rand(0.05, 2 / (COUNT · rand(0.5, 2)))' },
      { label: 'stroke', expr: 'lw = rand(0.5, 3)' },
      { label: 'wash', expr: 'rgba(rand(10, 100) ×3, rand(0.05, 0.3))' },
      { label: 'geometry', expr: 'Pᵢ, Sᵢ as in Orbit Geometry,  φᵢ = θᵢ + θᵢ · COUNT · 2' }
    ],
    adaptation: [
      'Math.random is replaced by a seeded generator (mulberry32) drawn in the pen’s order, so a seed in the URL reproduces the figure on refresh and can be shared.',
      'R1 is rolled against an 800 px reference height and the figure scaled to the stage. The original resize handler dropped the “/ 2” from CENTER; the port stays centred.',
      'Per-frame cost is bounded by COUNT ≤ 11: at most 242 connector strokes, drawn only while the stage is visible.'
    ]
  },
  {
    slug: 'triangled',
    index: '04',
    title: 'Triangled',
    originalTitle: 'Triangled',
    penId: 'YWdjXr',
    url: pen('YWdjXr'),
    summary:
      'Two counter-rotating equilateral triangles with breathing radii; every vertex of one is tied to every vertex of the other.',
    signature: 'r1 = 100 · sin θ + 500,  r2 = 100 · sin(θ + 90) + 200',
    label:
      'Triangled: two grey triangles rotate in opposite directions while growing and shrinking, with nine lines joining their corners.',
    about: [
      'A small pen with one odd constant. The outer triangle turns one way, the inner one the other, and both radii breathe on a sine of the same angle — but the inner one is offset by 90, read in radians.',
      'That typo-looking offset is what keeps the figure alive: the pair never reaches the same size at the same moment, so the nine connectors keep shearing into new stars.'
    ],
    maths: [
      { label: 'rotation', expr: 'θ −= π / 360 · 0.2' },
      { label: 'outer radius', expr: 'r1 = 100 · sin θ + 500' },
      { label: 'inner radius', expr: 'r2 = 100 · sin(θ + 90) + 200   (90 rad ≈ 117°)' },
      { label: 'outer vertices', expr: 'Vₖ = C + r1 · (cos(θ − 2πk/3), sin(θ − 2πk/3))' },
      { label: 'inner vertices', expr: 'the same with r2 and −θ' },
      { label: 'connectors', expr: '3 × 3 lines, outer Vᵢ → inner Vⱼ' }
    ],
    adaptation: [
      'Radii are scaled so 1 100 px of pen space fits the stage’s short side; only the peaks of r1 poke past the edge, as they did on a laptop window.',
      'Stroke stays #bbb at 1 px, on the archive’s dark stage rather than the default white page the pen sat on.',
      'The +90 radian phase and the missing beginPath() before the connectors (which strokes the inner triangle twice) are kept as written.'
    ]
  },
  {
    slug: 'waving-rainbow-text',
    index: '05',
    title: 'Waving Rainbow Text',
    originalTitle: 'Waving rainbow text',
    penId: 'oNNzGvv',
    url: pen('oNNzGvv'),
    summary:
      'Each letter’s font size rides a sine wave shifted −1.5 per letter while the hue sweeps across the word and glows.',
    signature: 'px = sin(φ + t / 360 + i / −1.5) · 40 + 120',
    label:
      'Waving Rainbow Text: heavy uppercase words whose letters swell and shrink in a travelling wave, cycling through rainbow colours.',
    about: [
      'No canvas at all: every letter is a span whose font-size is recomputed each frame. Because the letters sit on a flex baseline, changing sizes pushes their neighbours around, and the wave travels through the layout itself.',
      'The −1.5 frequency divides the letter index, so the phase steps back by 2/3 rad per letter and the crest rolls left to right along the word; the hue steps 20° per letter and drifts with time.'
    ],
    maths: [
      {
        label: 'size',
        expr: 'px = ⌊sin(φ + t / 360 + i / −1.5) · (120 − 80) + 120⌋   → 80 … 160'
      },
      { label: 'word phase', expr: 'φ = 180 + rand · 180' },
      { label: 'colour', expr: 'hsl(t / 3 + 20i, 50%, 50%),  glow 0 0 12px' }
    ],
    adaptation: [
      'Letters are rendered as text by Svelte, never through innerHTML; the phrase is editable and stays plain text.',
      'Every size is multiplied by k, fitted to the stage width and the longest word, so “CONQUERS” fits a 320 px screen.',
      'A fixed 60 Hz clock replaces the rAF timestamp, so pausing resumes the wave where it stopped.'
    ]
  }
];

export const findExperiment = (slug: string) => experiments.find((e) => e.slug === slug);
