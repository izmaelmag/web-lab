<script lang="ts">
  import { onMount } from 'svelte';
  import { createDrawable, createScope, createTimeline, stagger, type Timeline } from 'animejs';
  import { arcPath } from './geometry';
  import { aperture, capital, compass, jump, prefersReducedMotion } from './score';

  // Circles centred on (±40, 0) with r = 80 meet on the y-axis at (0, ±√4800).
  // The construction draws those arcs first, then lets the y-axis pass through.
  const BISECT = Math.sqrt(80 * 80 - 40 * 40);

  const bisectors = [
    arcPath(-40, 0, 80, -75, -45),
    arcPath(40, 0, 80, -135, -105),
    arcPath(-40, 0, 80, 45, 75),
    arcPath(40, 0, 80, 105, 135)
  ];
  const guides = [arcPath(0, 0, 52, -168, 34), arcPath(0, 0, 57, 96, 208)];
  const ring = arcPath(0, 0, 40, -90, 269.99);
  const ticks = Array.from({ length: 11 }, (_, i) => -50 + i * 10);

  // Bounding box of the glasses in portrait units (image spans −40…40).
  const lens = { x0: -10.6, x1: 20.6, y0: -4, y1: 5, arm: 3 };

  const words = [
    { head: 'I', tail: 'zmael' },
    { head: 'M', tail: 'ag' }
  ];

  let root: HTMLElement;
  let armed = $state(false);
  let timeline: Timeline | undefined;

  export function replay() {
    timeline?.restart();
  }

  export function setPlaying(playing: boolean) {
    if (!timeline || timeline.completed) return;
    if (playing) timeline.play();
    else timeline.pause();
  }

  onMount(() => {
    const scope = createScope({ root }).add(() => {
      timeline = createTimeline({ autoplay: false, defaults: { ease: 'outExpo' } })
        .label('ruler', 0)
        .add(
          createDrawable('.axis-x'),
          { draw: ['0.5 0.5', '0 1'], duration: 760, ease: 'inOutExpo' },
          'ruler'
        )
        .add(
          '.tick',
          {
            scaleY: [0, 1],
            opacity: [0, 1],
            duration: 260,
            delay: stagger(22, { from: 'center' })
          },
          'ruler+=260'
        )
        .add(
          createDrawable('.bisector'),
          { draw: ['0 0', '0 1'], duration: 520, ease: compass, delay: stagger(90) },
          'ruler+=380'
        )
        .add(
          '.meet',
          { scale: [0, 1], opacity: [0, 1], duration: 380, ease: jump, delay: stagger(60) },
          '-=160'
        )
        .add(
          createDrawable('.axis-y'),
          { draw: ['0 0', '0 1'], duration: 620, ease: 'inOutExpo' },
          '-=240'
        )
        .label('compass', '-=380')
        .add('.hand', { opacity: [0, 1], duration: 120, ease: 'linear' }, 'compass')
        .add('.hand', { rotate: [-90, 270], duration: 1080, ease: compass }, 'compass')
        .add(
          createDrawable('.ring'),
          { draw: ['0 0', '0 1'], duration: 1080, ease: compass },
          'compass'
        )
        .add('.hand', { opacity: 0, duration: 200, ease: 'linear' }, 'compass+=1080')
        .add(
          createDrawable('.guide'),
          { draw: ['0 0', '0 1'], duration: 900, ease: compass, delay: stagger(140) },
          'compass+=180'
        )
        .label('reveal', 'compass+=960')
        .add('.aperture', { '--ap': [0, 1], ease: aperture() }, 'reveal')
        .add(
          '.portrait',
          { y: ['38%', '0%'], rotate: [18, 0], duration: 820, ease: jump },
          'reveal'
        )
        .add(
          '.lens path',
          { opacity: [0, 1], scale: [1.6, 1], duration: 420, ease: jump, delay: stagger(40) },
          'reveal+=520'
        )
        .label('name', 'compass+=240')
        .add(
          '.cap',
          {
            y: ['-72%', '0%'],
            rotate: [-60, 0],
            scale: [0.8, 1],
            opacity: [0, 1],
            ease: capital(),
            delay: stagger(120)
          },
          'name'
        )
        .add(
          '.ch',
          {
            y: (_, i) => [(i ?? 0) % 2 ? '64%' : '-64%', '0%'],
            rotate: [-60, 0],
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 520,
            ease: jump,
            delay: stagger(42)
          },
          'name+=380'
        )
        .add(
          '.lede-line',
          { y: ['110%', '0%'], opacity: [0, 1], duration: 560, ease: jump, delay: stagger(70) },
          'name+=900'
        )
        .add(
          '.coord',
          { x: [-10, 0], opacity: [0, 1], duration: 420, delay: stagger(60) },
          'reveal+=640'
        )
        .add('.cue', { y: [12, 0], opacity: [0, 1], duration: 500, ease: jump }, '-=200');

      timeline.init();
      if (prefersReducedMotion()) {
        timeline.seek(timeline.duration);
      } else {
        timeline.seek(0);
        timeline.play();
      }
      armed = true;
    });

    return () => scope.revert();
  });
</script>

<section class="construct" class:armed bind:this={root} aria-labelledby="showreel-title">
  <div class="plate">
    <svg class="rig" viewBox="-60 -60 120 120" aria-hidden="true">
      <line class="axis axis-x" x1="-260" y1="0" x2="260" y2="0" />
      <line class="axis axis-y" x1="0" y1={-BISECT - 14} x2="0" y2={BISECT + 14} />
      {#each ticks as x (x)}
        <line class="tick" x1={x} y1="-1.6" x2={x} y2="1.6" />
      {/each}
      {#each bisectors as d, i (i)}
        <path class="bisector" {d} />
      {/each}
      <circle class="meet" cx="0" cy={-BISECT} r="1.2" />
      <circle class="meet" cx="0" cy={BISECT} r="1.2" />
      {#each guides as d, i (i)}
        <path class="guide" {d} />
      {/each}
      <path class="ring" d={ring} />
      <g class="hand">
        <line x1="0" y1="0" x2="40" y2="0" />
        <circle cx="0" cy="0" r="1" />
        <circle class="nib" cx="40" cy="0" r="1.6" />
      </g>
    </svg>

    <div class="aperture">
      <img
        class="portrait"
        src="/dark.webp"
        alt="Izmael in the dark: glowing glasses and a golden rim light"
        width="640"
        height="640"
      />
      <svg class="lens" viewBox="-40 -40 80 80" aria-hidden="true">
        <path d="M {lens.x0} {lens.y0 + lens.arm} V {lens.y0} H {lens.x0 + lens.arm}" />
        <path d="M {lens.x1 - lens.arm} {lens.y0} H {lens.x1} V {lens.y0 + lens.arm}" />
        <path d="M {lens.x1} {lens.y1 - lens.arm} V {lens.y1} H {lens.x1 - lens.arm}" />
        <path d="M {lens.x0 + lens.arm} {lens.y1} H {lens.x0} V {lens.y1 - lens.arm}" />
      </svg>
    </div>
  </div>

  <header class="bar">
    <a href="/" class="home">← web-lab</a>
    <span class="bar-title">showreel · a kinetic geometry notebook</span>
    <span class="bar-act">act I / construct</span>
  </header>

  <div class="lede">
    <p><span class="lede-line">I build moving pictures out of rules:</span></p>
    <p><span class="lede-line">compass arcs, phase-shifted stripes, epicycles.</span></p>
    <p><span class="lede-line">Then I ship them as shaders, motion systems</span></p>
    <p><span class="lede-line">and interactive tools for the web.</span></p>
  </div>

  <h1 id="showreel-title" class="name" aria-label="Izmael Mag">
    {#each words as word (word.head)}
      <span class="word" aria-hidden="true">
        <span class="cap">{word.head}</span>{#each word.tail.split('') as letter, i (i)}<span
            class="ch">{letter}</span
          >{/each}
      </span>
    {/each}
  </h1>

  <ul class="coords" aria-label="How the opening is constructed">
    <li class="coord"><b>O</b> (0, 0) — origin on the lens line</li>
    <li class="coord"><b>⟂</b> circles r = 80 at (±40, 0) meet on x = 0</li>
    <li class="coord"><b>θ</b> −90° → 270° — one compass turn, r = 40</li>
    <li class="coord"><b>◯</b> aperture opens on a spring</li>
  </ul>

  <a class="cue" href="#modulate">↓ act II · modulate</a>
</section>

<style>
  .construct {
    --orange: var(--brand-orange, #ff9913);
    position: relative;
    width: 100%;
    min-height: 100svh;
    padding: clamp(16px, 3vw, 40px);
    overflow: hidden;
    display: grid;
    grid-template-rows: auto auto 1fr auto auto;
    color: #fff;
  }

  .construct:not(.armed) :is(.rig, .aperture, .name, .lede, .coords, .cue) {
    visibility: hidden;
  }

  /* ------------------------------------------------------------------ */

  .plate {
    position: absolute;
    top: 50%;
    right: -3vw;
    width: min(86svh, 58vw);
    aspect-ratio: 1;
    transform: translateY(-50%);
    pointer-events: none;
  }

  .rig {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    fill: none;
  }

  .rig :is(line, path, circle) {
    vector-effect: non-scaling-stroke;
  }

  .axis {
    stroke: rgba(255, 255, 255, 0.38);
    stroke-width: 1;
  }

  .tick {
    stroke: rgba(255, 255, 255, 0.5);
    stroke-width: 1;
    transform-box: fill-box;
    transform-origin: center;
  }

  .bisector {
    stroke: rgba(255, 255, 255, 0.55);
    stroke-width: 1;
  }

  .meet {
    fill: var(--orange);
    transform-box: fill-box;
    transform-origin: center;
  }

  .guide {
    stroke: rgba(255, 153, 19, 0.45);
    stroke-width: 1;
    stroke-dasharray: 2 5;
  }

  .ring {
    stroke: var(--orange);
    stroke-width: 3;
    stroke-linecap: round;
  }

  .hand {
    opacity: 0;
    transform-box: view-box;
    transform-origin: 50% 50%;
  }

  .hand line {
    stroke: #fff;
    stroke-width: 1;
  }

  .hand circle {
    fill: #fff;
  }

  .hand .nib {
    fill: var(--orange);
  }

  .aperture {
    --ap: 1;
    position: absolute;
    inset: 16.667%;
    clip-path: circle(calc(var(--ap) * 50%) at 50% 50%);
  }

  .portrait {
    display: block;
    width: 100%;
    height: 100%;
    transform-origin: left bottom;
  }

  .lens {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    fill: none;
    stroke: var(--orange);
    stroke-width: 0.6;
  }

  .lens path {
    transform-box: fill-box;
    transform-origin: center;
  }

  /* ------------------------------------------------------------------ */

  .bar {
    position: relative;
    display: flex;
    gap: 16px;
    justify-content: space-between;
    align-items: baseline;
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.66);
  }

  .home {
    color: var(--orange);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  .lede {
    position: relative;
    margin-top: clamp(24px, 6vh, 72px);
    max-width: 34em;
    font-size: clamp(14px, 1.25vw, 18px);
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.86);
  }

  .lede p {
    margin: 0;
    overflow: hidden;
  }

  .lede-line {
    display: inline-block;
  }

  .name {
    position: relative;
    align-self: end;
    margin: 0;
    font-size: clamp(64px, 13vw, 232px);
    font-weight: 900;
    line-height: 0.86;
    letter-spacing: -0.04em;
    color: var(--orange);
  }

  .word {
    display: block;
    white-space: nowrap;
  }

  .word + .word {
    padding-left: 1.1em;
  }

  .cap,
  .ch {
    display: inline-block;
  }

  .cap {
    color: #fff;
  }

  .coords {
    position: relative;
    list-style: none;
    margin: 24px 0 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 6px 24px;
    font-size: 11px;
    letter-spacing: 0.04em;
    color: rgba(255, 255, 255, 0.66);
  }

  .coord b {
    color: var(--orange);
    font-weight: 600;
    margin-right: 4px;
  }

  .cue {
    position: relative;
    justify-self: start;
    margin-top: 20px;
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--orange);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  a:focus-visible {
    outline: 2px solid var(--orange);
    outline-offset: 4px;
  }

  @media (max-width: 760px) {
    .construct {
      grid-template-rows: auto auto auto auto auto auto;
    }

    .plate {
      position: relative;
      top: auto;
      right: auto;
      transform: none;
      width: 88vw;
      max-width: 520px;
      justify-self: center;
      margin: 28px 0 -8vw;
      grid-row: 2;
    }

    .bar-title {
      display: none;
    }

    .name {
      grid-row: 3;
      display: flex;
      align-items: baseline;
      flex-wrap: nowrap;
      font-size: 15vw;
    }

    .word + .word {
      padding-left: 0.08em;
    }

    .lede {
      grid-row: 4;
      margin-top: 24px;
    }

    .coords {
      grid-row: 5;
      flex-direction: column;
    }

    .cue {
      grid-row: 6;
    }
  }
</style>
