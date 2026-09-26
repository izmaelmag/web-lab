<script lang="ts">
  import { onMount } from 'svelte';
  import {
    animate,
    createAnimatable,
    createScope,
    createTimeline,
    stagger,
    type AnimatableObject,
    type JSAnimation
  } from 'animejs';
  import { TAU, lanePieces, lanePoints } from './geometry';
  import { jump, prefersReducedMotion, retune, watchVisibility } from './score';

  let { playing }: { playing: boolean } = $props();

  // Each lane is one focus area; its segments are things that actually live in
  // this repo (package.json, routes, components). Order matters: it is the phase order.
  const lanes = [
    { label: 'creative coding', words: ['p5', 'canvas', 'loops', 'tone'] },
    { label: 'procedural geometry', words: ['arcs', 'stripes', 'epicycles', 'grids'] },
    { label: 'shaders', words: ['GLSL', 'noise', 'interference', 'nebula'] },
    { label: 'motion systems', words: ['timelines', 'springs', 'phases', 'easing'] },
    { label: 'frontend', words: ['Svelte', 'SvelteKit', 'TypeScript', 'three'] },
    { label: 'interactive tools', words: ['controls', 'players', 'recorders', 'params'] }
  ];

  const SEGMENTS = 4;
  const LANE_STEP = 0.55; // λ, radians between neighbouring lanes
  const GAP = 0.018; // gap between segments, fraction of the lane
  const DELTA_DEFAULT = 0.9;
  const DELTA_MAX = Math.PI;
  const STROKE = 22;
  const FONT = 11;

  // Mutable rule state. anime.js owns every change to it.
  const rule = { phase: 0.6, origin: 0, amplitude: 0, delta: DELTA_DEFAULT };

  let root: HTMLElement;
  let field: HTMLElement;
  let svgs: SVGSVGElement[] = [];
  let width = $state(0);
  let delta = $state(DELTA_DEFAULT);
  let cursorX = $state<number | null>(null);

  let loop: JSAnimation | undefined;
  let tuner: AnimatableObject | undefined;
  let visible = false;
  let reduced = false;

  const slots = Array.from({ length: SEGMENTS + 1 }, (_, i) => i);
  const gridSlots = slots.slice(0, SEGMENTS);

  const pieceNodes: SVGLineElement[][] = [];
  const wordNodes: SVGTextElement[][] = [];

  // Characters of Azeret Mono are ~0.6em wide.
  const textWidth = (word: string) => word.length * FONT * 0.62 + 12;

  function render() {
    delta = rule.delta;
    if (!width) return;

    for (let lane = 0; lane < lanes.length; lane += 1) {
      const points = lanePoints({
        segmentCount: SEGMENTS,
        phase: rule.phase,
        phaseDelta: rule.delta,
        laneOrder: lane,
        laneStep: LANE_STEP,
        origin: rule.origin,
        amplitude: rule.amplitude
      });
      const pieces = lanePieces(points, GAP);
      const lines = pieceNodes[lane];
      const texts = wordNodes[lane];
      if (!lines || !texts) continue;

      for (let i = 0; i < lines.length; i += 1) {
        const piece = pieces[i];
        const line = lines[i];
        const text = texts[i];

        if (!piece) {
          line.setAttribute('visibility', 'hidden');
          text.setAttribute('visibility', 'hidden');
          continue;
        }

        const x1 = piece.start * width;
        const x2 = piece.end * width;
        line.setAttribute('visibility', 'visible');
        line.setAttribute('x1', x1.toFixed(1));
        line.setAttribute('x2', x2.toFixed(1));

        // A word rides the larger half of a split segment and fades out when
        // its segment gets too short to hold it.
        const word = lanes[lane].words[piece.owner % SEGMENTS];
        const span = x2 - x1;
        const isMainPiece = piece.end - piece.start >= piece.length / 2;
        const fit = Math.min(1, Math.max(0, (span - textWidth(word)) / 14));

        text.setAttribute('visibility', isMainPiece && fit > 0 ? 'visible' : 'hidden');
        text.setAttribute('x', ((x1 + x2) / 2).toFixed(1));
        text.setAttribute('opacity', fit.toFixed(2));
        if (text.textContent !== word) text.textContent = word;
      }
    }
  }

  function updateLoop(isPlaying = playing) {
    if (!loop) return;
    if (isPlaying && visible) loop.play();
    else loop.pause();
  }

  function setDelta(next: number) {
    const value = Math.min(DELTA_MAX, Math.max(0, next));
    delta = value;
    tuner?.delta(value);
  }

  function onPointerMove(event: PointerEvent) {
    const box = field.getBoundingClientRect();
    const x = event.clientX - box.left;
    cursorX = x;
    setDelta((x / box.width) * DELTA_MAX);
  }

  onMount(() => {
    reduced = prefersReducedMotion();

    svgs.forEach((svg, lane) => {
      pieceNodes[lane] = Array.from(svg.querySelectorAll<SVGLineElement>('.piece'));
      wordNodes[lane] = Array.from(svg.querySelectorAll<SVGTextElement>('.word'));
    });

    const resize = new ResizeObserver(() => {
      width = svgs[0]?.getBoundingClientRect().width ?? 0;
      render();
    });
    resize.observe(field);

    const scope = createScope({ root }).add(() => {
      tuner = createAnimatable(rule, {
        delta: { duration: 480, ease: 'out(3)' },
        onRender: render
      });

      // Two phase turns per origin turn: one seamless 12 s loop.
      loop = animate(rule, {
        phase: rule.phase + TAU * 2,
        origin: 1,
        duration: 12000,
        ease: 'linear',
        loop: true,
        autoplay: false,
        onRender: render
      });

      const entrance = createTimeline({ autoplay: false })
        .add(
          '.lane-label',
          { y: ['80%', '0%'], opacity: [0, 1], duration: 480, ease: jump, delay: stagger(60) },
          0
        )
        .add('.rail', { scaleX: [0, 1], duration: 700, ease: 'inOutExpo', delay: stagger(60) }, 0)
        .add(
          '.piece-group',
          { opacity: [0, 1], duration: 400, ease: 'linear', delay: stagger(60) },
          280
        )
        .add(rule, { amplitude: [0, 0.46], ease: retune(), onRender: render }, 360)
        .add(
          '.readout, .affordance',
          { opacity: [0, 1], y: [8, 0], duration: 420, ease: jump, delay: stagger(80) },
          500
        );

      entrance.init();
      if (reduced) {
        entrance.seek(entrance.duration);
        render();
      } else {
        entrance.seek(0);
      }

      return watchVisibility(field, (isVisible) => {
        visible = isVisible;
        if (isVisible && !entrance.began && !reduced) entrance.play();
        updateLoop();
      });
    });

    render();

    return () => {
      resize.disconnect();
      scope.revert();
    };
  });

  // Reduced-motion visitors start paused; pressing play is their opt-in.
  $effect(() => updateLoop(playing));
</script>

<section class="modulate" id="modulate" bind:this={root} aria-labelledby="modulate-title">
  <header class="head">
    <p class="kicker">act II / modulate</p>
    <h2 id="modulate-title">Skills, as a phase diagram</h2>
    <p class="note">
      Six lanes, one rule. Segments swing around an even grid without ever swapping order; each lane
      lags its neighbour by λ. Move across the field — or use the slider — to change Δφ, the phase
      between neighbouring points.
    </p>
  </header>

  <div
    class="field"
    bind:this={field}
    onpointermove={onPointerMove}
    onpointerdown={onPointerMove}
    onpointerleave={() => (cursorX = null)}
    role="presentation"
  >
    {#if cursorX !== null}
      <div class="cursor" style="transform: translateX({cursorX}px)" aria-hidden="true">
        <span>Δφ {delta.toFixed(2)}</span>
      </div>
    {/if}

    <ol class="lanes">
      {#each lanes as lane, laneIndex (lane.label)}
        <li class="lane">
          <span class="lane-label"
            ><i>{String(laneIndex + 1).padStart(2, '0')}</i> {lane.label}</span
          >
          <svg
            class="track"
            bind:this={svgs[laneIndex]}
            height={STROKE + 12}
            role="img"
            aria-label="{lane.label}: {lane.words.join(', ')}"
          >
            <line class="rail" x1="0" x2={width} y1={STROKE / 2 + 6} y2={STROKE / 2 + 6} />
            {#each gridSlots as i (i)}
              <line
                class="grid"
                x1={(width * i) / SEGMENTS}
                x2={(width * i) / SEGMENTS}
                y1="2"
                y2={STROKE + 10}
              />
            {/each}
            <g class="piece-group">
              {#each slots as i (i)}
                <line class="piece" y1={STROKE / 2 + 6} y2={STROKE / 2 + 6} stroke-width={STROKE} />
              {/each}
              {#each slots as i (i)}
                <text class="word" y={STROKE / 2 + 6} font-size={FONT}></text>
              {/each}
            </g>
          </svg>
        </li>
      {/each}
    </ol>
  </div>

  <div class="controls">
    <p class="readout" aria-live="off">
      xᵢ = o + i/N + a/N · sin(φ + i·Δφ + k·λ) &nbsp;·&nbsp; N = {SEGMENTS} &nbsp;·&nbsp; λ = {LANE_STEP}
      &nbsp;·&nbsp; Δφ = {delta.toFixed(2)}
    </p>
    <label class="affordance">
      <span>↔ Δφ</span>
      <input
        type="range"
        min="0"
        max={DELTA_MAX}
        step="0.01"
        value={delta}
        oninput={(event) => setDelta(+event.currentTarget.value)}
        aria-label="Phase between neighbouring points, radians"
      />
      <button type="button" onclick={() => setDelta(DELTA_DEFAULT)}>reset</button>
    </label>
  </div>
</section>

<style>
  .modulate {
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
    margin-bottom: 40px;
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

  .field {
    position: relative;
    touch-action: pan-y;
    cursor: ew-resize;
  }

  .cursor {
    position: absolute;
    top: -12px;
    bottom: -12px;
    left: 0;
    width: 1px;
    background: rgba(255, 255, 255, 0.5);
    pointer-events: none;
    z-index: 1;

    & span {
      position: absolute;
      top: -18px;
      left: 6px;
      font-size: 11px;
      white-space: nowrap;
      color: var(--orange);
    }
  }

  .lanes {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 6px;
  }

  .lane {
    display: grid;
    grid-template-columns: 11rem minmax(0, 1fr);
    gap: 32px;
    align-items: center;
  }

  .lane-label {
    display: inline-block;
    font-size: 12px;
    letter-spacing: 0.04em;
    color: rgba(255, 255, 255, 0.8);
    white-space: nowrap;

    & i {
      font-style: normal;
      color: var(--orange);
      margin-right: 6px;
    }
  }

  .track {
    display: block;
    width: 100%;
    overflow: visible;
  }

  .rail {
    stroke: rgba(255, 255, 255, 0.18);
    stroke-width: 1;
    transform-origin: left center;
    transform-box: fill-box;
  }

  .grid {
    stroke: rgba(255, 255, 255, 0.22);
    stroke-width: 1;
  }

  .piece {
    stroke: var(--orange);
    stroke-linecap: butt;
  }

  .word {
    fill: #000;
    font-family: var(--font-body, monospace);
    font-weight: 700;
    text-anchor: middle;
    dominant-baseline: central;
    pointer-events: none;
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 16px 32px;
    align-items: center;
    justify-content: space-between;
    margin-top: 28px;
    padding-left: calc(11rem + 32px);
  }

  .readout {
    margin: 0;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.66);
  }

  .affordance {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;
    color: var(--orange);

    & input {
      width: 160px;
      accent-color: var(--orange);
    }

    & button {
      font: inherit;
      font-size: 11px;
      color: #fff;
      background: none;
      border: 1px solid rgba(255, 255, 255, 0.4);
      border-radius: 4px;
      padding: 2px 8px;
      cursor: pointer;

      &:hover {
        border-color: var(--orange);
      }
    }
  }

  :is(input, button):focus-visible {
    outline: 2px solid var(--orange);
    outline-offset: 3px;
  }

  @media (max-width: 900px) {
    .head {
      grid-template-columns: minmax(0, 1fr);
    }

    .lane {
      grid-template-columns: minmax(0, 1fr);
      gap: 4px;
    }

    .lanes {
      gap: 14px;
    }

    .controls {
      padding-left: 0;
    }
  }
</style>
