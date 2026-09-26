<script lang="ts">
  import { onMount } from 'svelte';
  import { animate, createScope, createTimeline, stagger, utils, type JSAnimation } from 'animejs';
  import { TAU, epicycleFormula, epicyclePoint, type Epicycle } from './geometry';
  import { jump, prefersReducedMotion, retune, watchVisibility } from './score';

  let { playing }: { playing: boolean } = $props();

  // Every project gets its own frequency set. Differences between frequencies
  // set the symmetry: 1, −4, 6 → 5-fold; 1, 7, −5 → 6-fold; and so on.
  interface Project {
    title: string;
    kind: string;
    note: string;
    href: string;
    external?: boolean;
    cycles: Epicycle[];
  }

  const projects: Project[] = [
    {
      title: 'Nebula',
      kind: 'GLSL shader',
      note: 'Colorful pearlescent cloud',
      href: '/shaders/nebula',
      cycles: [
        { r: 0.55, w: 1, p: 0 },
        { r: 0.3, w: -4, p: 0 },
        { r: 0.15, w: 6, p: 0 }
      ]
    },
    {
      title: 'Interference',
      kind: 'GLSL shader',
      note: 'Tweakable interference patterns',
      href: '/shaders/interference',
      cycles: [
        { r: 0.5, w: 1, p: 0 },
        { r: 0.33, w: 7, p: 0 },
        { r: 0.17, w: -5, p: 0 }
      ]
    },
    {
      title: 'Spirograph',
      kind: 'p5 · draft',
      note: 'Nested rotating circles with a frame player',
      href: '/draft/spirograph',
      cycles: [
        { r: 0.6, w: 1, p: 0 },
        { r: 0.28, w: -3, p: 0 },
        { r: 0.12, w: 9, p: 0 }
      ]
    },
    {
      title: 'animate-loop-sculptor',
      kind: 'GitHub ↗',
      note: 'p5.js loops rendered frame-exact to video',
      href: 'https://github.com/izmaelmag/animate-loop-sculptor',
      external: true,
      cycles: [
        { r: 0.5, w: 1, p: 0 },
        { r: 0.3, w: -2, p: 0 },
        { r: 0.2, w: 4, p: 0 }
      ]
    }
  ];

  const PERIOD = 14; // seconds per full turn of the slowest arm
  const TAIL_CHUNKS = 48;
  const SAMPLES = 720; // samples per 2π

  // The machine the canvas draws. anime.js retunes it on a spring.
  const live: Epicycle[] = projects[0].cycles.map((cycle) => ({ ...cycle }));

  let root: HTMLElement;
  let stage: HTMLElement;
  let canvas: HTMLCanvasElement;
  let active = $state(0);
  let formula = $derived(epicycleFormula(projects[active].cycles));

  let context: CanvasRenderingContext2D | null = null;
  let size = 0;
  let dpr = 1;
  let t = 0; // pen angle
  let since = 0; // angle travelled since the last retune, drives the tail length
  let raf = 0;
  let last = 0;
  let visible = false;
  let reduced = false;
  let userPicked = false;
  let retuning: JSAnimation | undefined;

  const point: [number, number] = [0, 0];

  function tune(index: number, byUser: boolean) {
    if (byUser) userPicked = true;
    if (index === active && retuning) return;
    active = index;
    since = 0;

    const target = projects[index].cycles;
    retuning?.pause();

    if (reduced && !playing) {
      utils.set(live, { r: (_, i) => target[i ?? 0].r, w: (_, i) => target[i ?? 0].w });
      draw();
      return;
    }

    retuning = animate(live, {
      r: (_, i) => target[i ?? 0].r,
      w: (_, i) => target[i ?? 0].w,
      ease: retune(),
      onRender: () => {
        if (!raf) draw();
      }
    });
  }

  function draw() {
    if (!context || !size) return;
    const ctx = context;
    const half = size / 2;
    const scale = half * 0.86;
    // A still (reduced motion, not opted in) shows the whole closed trace;
    // a paused machine keeps its tail exactly where it stopped.
    const still = reduced && !playing;
    const span = still ? TAU : Math.min(since, TAU * 0.995);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    ctx.translate(half, half);

    // Rulers
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.moveTo(-half, 0);
    ctx.lineTo(half, 0);
    ctx.moveTo(0, -half);
    ctx.lineTo(0, half);
    ctx.stroke();
    ctx.setLineDash([2, 6]);
    for (let ring = 1; ring <= 4; ring += 1) {
      ctx.beginPath();
      ctx.arc(0, 0, (scale * ring) / 4, 0, TAU);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Ghost of the whole closed curve
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.beginPath();
    for (let i = 0; i <= SAMPLES; i += 1) {
      epicyclePoint(live, (i / SAMPLES) * TAU, point);
      if (i === 0) ctx.moveTo(point[0] * scale, point[1] * scale);
      else ctx.lineTo(point[0] * scale, point[1] * scale);
    }
    ctx.stroke();

    // Tail: the last `span` radians, brighter towards the pen
    ctx.strokeStyle = '#ff9913';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    const perChunk = Math.max(2, Math.ceil((span / TAU) * (SAMPLES / TAIL_CHUNKS)));
    for (let chunk = 0; chunk < TAIL_CHUNKS; chunk += 1) {
      const from = t - span * (1 - chunk / TAIL_CHUNKS);
      const to = t - span * (1 - (chunk + 1) / TAIL_CHUNKS);
      ctx.globalAlpha = still ? 1 : 0.08 + 0.92 * ((chunk + 1) / TAIL_CHUNKS) ** 1.6;
      ctx.beginPath();
      for (let s = 0; s <= perChunk; s += 1) {
        epicyclePoint(live, from + ((to - from) * s) / perChunk, point);
        if (s === 0) ctx.moveTo(point[0] * scale, point[1] * scale);
        else ctx.lineTo(point[0] * scale, point[1] * scale);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Arms: each circle is centred on the tip of the previous arm
    let x = 0;
    let y = 0;
    for (const { r, w, p } of live) {
      const angle = w * t + p;
      const nx = x + r * Math.cos(angle);
      const ny = y + r * Math.sin(angle);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.beginPath();
      ctx.arc(x * scale, y * scale, Math.abs(r) * scale, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.moveTo(x * scale, y * scale);
      ctx.lineTo(nx * scale, ny * scale);
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x * scale, y * scale, 2, 0, TAU);
      ctx.fill();
      x = nx;
      y = ny;
    }

    // Pen
    ctx.fillStyle = '#ff9913';
    ctx.shadowColor = '#ff9913';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(x * scale, y * scale, 4.5, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '11px "Azeret Mono", monospace';
    ctx.fillText(`t = ${(t % TAU).toFixed(2)} rad`, -half + 12, half - 14);
  }

  function frame(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const step = (dt * TAU) / PERIOD;
    t += step;
    since += step;

    // After a full lap the pen hands the story to the next project, until
    // the visitor picks one.
    if (since >= TAU * 1.15 && !userPicked) {
      tune((active + 1) % projects.length, false);
    }

    draw();
    raf = requestAnimationFrame(frame);
  }

  function sync(isPlaying = playing) {
    const shouldRun = isPlaying && visible;
    if (shouldRun && !raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    } else if (!shouldRun && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
      draw();
    }
  }

  export function replay() {
    userPicked = false;
    t = 0;
    since = 0;
    tune(0, false);
    draw();
  }

  onMount(() => {
    reduced = prefersReducedMotion();
    context = canvas.getContext('2d');

    const resize = new ResizeObserver(() => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      // Layout width, not the bounding box: the entrance scales the stage.
      size = stage.clientWidth;
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      draw();
    });
    resize.observe(stage);

    const scope = createScope({ root }).add(() => {
      const entrance = createTimeline({ autoplay: false, defaults: { ease: jump } })
        .add(stage, { scale: [0.9, 1], opacity: [0, 1], ease: retune() }, 0)
        .add('.project', { y: [24, 0], opacity: [0, 1], duration: 520, delay: stagger(80) }, 160)
        .add('.formula', { opacity: [0, 1], x: [-12, 0], duration: 480 }, 420);

      if (reduced) entrance.seek(entrance.duration);
      else entrance.seek(0);

      return watchVisibility(stage, (isVisible) => {
        visible = isVisible;
        if (isVisible && !entrance.began && !reduced) entrance.play();
        sync();
      });
    });

    return () => {
      cancelAnimationFrame(raf);
      raf = 0;
      retuning?.pause();
      resize.disconnect();
      scope.revert();
    };
  });

  $effect(() => sync(playing));
</script>

<section class="trace" id="trace" bind:this={root} aria-labelledby="trace-title">
  <header class="head">
    <p class="kicker">act III / trace</p>
    <h2 id="trace-title">Traces lead<br />to the work</h2>
    <p class="note">
      Three rotating arms, one pen. Each project is tuned to its own frequencies — pick one and the
      machine re-tunes itself on a spring. After a full lap it moves on by itself.
    </p>
  </header>

  <div class="body">
    <figure class="machine">
      <div class="stage" bind:this={stage}>
        <canvas
          bind:this={canvas}
          aria-label="Epicycle drawing machine tracing a closed curve for {projects[active].title}"
          >Three rotating arms trace a geometric curve for {projects[active].title}.</canvas
        >
      </div>
      <figcaption class="formula">{formula}</figcaption>
    </figure>

    <ol class="projects">
      {#each projects as project, index (project.title)}
        <li
          class="project"
          class:active={index === active}
          onpointerenter={(event) => event.pointerType === 'mouse' && tune(index, true)}
        >
          <button
            type="button"
            class="tune"
            aria-pressed={index === active}
            aria-label="Tune the trace to {project.title}"
            onclick={() => tune(index, true)}
          >
            <span class="index">{String(index + 1).padStart(2, '0')}</span>
            <span class="omega">ω {project.cycles.map((c) => c.w).join(' · ')}</span>
          </button>
          <a
            href={project.href}
            onfocus={() => tune(index, true)}
            target={project.external ? '_blank' : undefined}
            rel={project.external ? 'noopener noreferrer' : undefined}
          >
            <span class="title">{project.title}</span>
            <span class="meta"><b>{project.kind}</b> {project.note}</span>
          </a>
        </li>
      {/each}
    </ol>
  </div>
</section>

<style>
  .trace {
    --orange: var(--brand-orange, #ff9913);
    width: 100%;
    padding: clamp(64px, 12vh, 140px) clamp(16px, 3vw, 40px);
    color: #fff;
    border-top: 1px solid rgba(255, 255, 255, 0.14);
  }

  .head {
    display: grid;
    grid-template-columns: minmax(0, 11rem) minmax(0, 1fr) minmax(0, 26rem);
    gap: 16px 32px;
    align-items: end;
    margin-bottom: 48px;
  }

  .kicker {
    margin: 0;
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--orange);
  }

  h2 {
    margin: 0;
    font-size: clamp(32px, 5vw, 72px);
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 0.95;
  }

  .note {
    margin: 0;
    font-size: 13px;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.72);
  }

  .body {
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
    gap: clamp(24px, 5vw, 80px);
    align-items: center;
  }

  .machine {
    margin: 0;
  }

  .stage {
    width: min(100%, 78svh);
    aspect-ratio: 1;
  }

  canvas {
    display: block;
    width: 100%;
    height: 100%;
  }

  .formula {
    margin-top: 12px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.66);
    overflow-wrap: anywhere;
  }

  .projects {
    list-style: none;
    margin: 0;
    padding: 0;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
  }

  .project {
    display: grid;
    grid-template-columns: 7.5rem minmax(0, 1fr);
    gap: 16px;
    align-items: center;
    padding: 18px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }

  .tune {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    font: inherit;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.66);
    background: none;
    border: 0;
    padding: 4px 0;
    cursor: pointer;
    text-align: left;
  }

  .index {
    font-size: 12px;
    color: var(--orange);
  }

  a {
    display: flex;
    flex-direction: column;
    gap: 6px;
    color: #fff;
    text-decoration: none;
  }

  .title {
    font-size: clamp(22px, 2.6vw, 36px);
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1;
    overflow-wrap: anywhere;
    transition:
      color 0.3s ease,
      transform 0.5s var(--jump-animation);
    transform-origin: left bottom;
  }

  .meta {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);

    & b {
      font-weight: 600;
      color: #fff;
      margin-right: 6px;
    }
  }

  .project.active .title,
  a:hover .title {
    color: var(--orange);
  }

  a:hover .title {
    transform: scale(1.04);
  }

  .project.active .tune {
    color: #fff;
  }

  :is(a, button):focus-visible {
    outline: 2px solid var(--orange);
    outline-offset: 4px;
  }

  @media (max-width: 900px) {
    .head,
    .body {
      grid-template-columns: minmax(0, 1fr);
    }

    .stage {
      width: 100%;
    }

    .project {
      grid-template-columns: 5.5rem minmax(0, 1fr);
    }
  }
</style>
