<script lang="ts">
  import { onMount } from 'svelte';
  import { animate, createDrawable, createScope, createTimeline, stagger } from 'animejs';
  import { TAU, arcPath, epicyclePoint, type Epicycle } from '$lib/showreel/geometry';
  import { compass, jump, prefersReducedMotion } from '$lib/showreel/score';

  // A pocket version of the showreel machine: one closed epicycle trace inside
  // the signature ring, drawn after the portrait and name have landed.
  const cycles: Epicycle[] = [
    { r: 0.55, w: 1, p: -Math.PI / 2 },
    { r: 0.3, w: -4, p: -Math.PI / 2 },
    { r: 0.15, w: 6, p: -Math.PI / 2 }
  ];

  const point: [number, number] = [0, 0];
  const trace = Array.from({ length: 241 }, (_, i) => {
    epicyclePoint(cycles, (i / 240) * TAU, point);
    return `${i === 0 ? 'M' : 'L'} ${(point[0] * 36).toFixed(2)} ${(point[1] * 36).toFixed(2)}`;
  }).join(' ');

  const ring = arcPath(0, 0, 44, -90, 269.99);
  const guide = arcPath(0, 0, 48, 150, 300);
  const title = 'Showreel';

  let root: HTMLElement;
  let hover: (() => void) | undefined;

  onMount(() => {
    const reduced = prefersReducedMotion();

    const scope = createScope({ root }).add(() => {
      const entrance = createTimeline({ autoplay: false, defaults: { ease: jump } })
        .add(root, { opacity: [0, 1], y: [24, 0], duration: 600 }, 0)
        .add(createDrawable('.f-ring'), { draw: ['0 0', '0 1'], duration: 900, ease: compass }, 120)
        .add(
          createDrawable('.f-guide'),
          { draw: ['0 0', '0 1'], duration: 700, ease: compass },
          360
        )
        .add(
          createDrawable('.f-trace'),
          { draw: ['0 0', '0 1'], duration: 1400, ease: 'inOutSine' },
          420
        )
        .add(
          '.f-letter',
          {
            y: ['-60%', '0%'],
            rotate: [-60, 0],
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 500,
            delay: stagger(45)
          },
          300
        )
        .add(
          '.f-line',
          { opacity: [0, 1], y: ['100%', '0%'], duration: 480, delay: stagger(70) },
          700
        );

      if (reduced) {
        entrance.seek(entrance.duration);
        return;
      }

      // Lands after the Intro's name and subtitle, before the menu settles.
      entrance.seek(0);
      const start = setTimeout(() => entrance.play(), 1100);
      return () => clearTimeout(start);
    });

    // Hover turns the dial one fifth (the trace is 5-fold) and redraws the pen.
    scope.add('hover', () => {
      animate('.f-dial', { rotate: '+=72', ease: 'out(4)', duration: 900 });
      animate(createDrawable('.f-trace'), {
        draw: ['0 0', '0 1'],
        duration: 900,
        ease: 'inOutSine'
      });
    });
    if (!reduced) hover = () => scope.methods.hover();

    return () => scope.revert();
  });
</script>

<a
  class="feature"
  href="/showreel"
  aria-label="Showreel — a kinetic geometry notebook: construct, modulate, trace"
  bind:this={root}
  onpointerenter={() => hover?.()}
  onfocus={() => hover?.()}
>
  <svg class="dial-wrap" viewBox="-50 -50 100 100" aria-hidden="true">
    <g class="f-dial">
      <path class="f-guide" d={guide} />
      <path class="f-ring" d={ring} />
      <circle class="f-pin" cx="0" cy="-44" r="2.4" />
    </g>
    <path class="f-trace" d={trace} />
  </svg>

  <span class="text">
    <span class="kicker"><span class="f-line">new · /showreel</span></span>
    <span class="title">
      {#each title.split('') as letter, i (i)}<span class="f-letter">{letter}</span>{/each}<span
        class="arrow"
        aria-hidden="true">→</span
      >
    </span>
    <span class="desc"><span class="f-line">a kinetic geometry notebook</span></span>
    <span class="desc"><span class="f-line">construct · modulate · trace</span></span>
  </span>
</a>

<style>
  .feature {
    display: flex;
    align-items: center;
    gap: 20px;
    width: min(100%, 520px);
    margin: 40px auto 8px;
    padding: 16px 24px 16px 16px;
    color: #fff;
    text-decoration: none;
    border: 1px solid rgba(255, 153, 19, 0.35);
    border-radius: 16px;
    transition: border-color 0.3s ease;

    &:hover,
    &:focus-visible {
      border-color: var(--brand-orange);
    }

    &:focus-visible {
      outline: 2px solid var(--brand-orange);
      outline-offset: 4px;
    }
  }

  .dial-wrap {
    flex-shrink: 0;
    width: 104px;
    height: 104px;
    overflow: visible;
    fill: none;
  }

  .f-dial {
    transform-box: view-box;
    transform-origin: 50% 50%;
  }

  .f-ring {
    stroke: var(--brand-orange);
    stroke-width: 2;
    stroke-linecap: round;
  }

  .f-guide {
    stroke: rgba(255, 255, 255, 0.45);
    stroke-width: 0.8;
    stroke-dasharray: 2 4;
  }

  .f-pin {
    fill: #fff;
  }

  .f-trace {
    stroke: #fff;
    stroke-width: 1;
    stroke-linejoin: round;
  }

  .text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .kicker,
  .desc {
    display: block;
    overflow: hidden;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.72);
  }

  .kicker {
    color: var(--brand-orange);
    letter-spacing: 0.06em;
  }

  .f-line {
    display: inline-block;
  }

  .title {
    display: flex;
    align-items: baseline;
    font-size: 40px;
    font-weight: 900;
    letter-spacing: -0.03em;
    line-height: 1.05;
    color: var(--brand-orange);
  }

  .f-letter {
    display: inline-block;
  }

  .arrow {
    margin-left: 12px;
    font-size: 28px;
    color: #fff;
    transition: transform 0.5s var(--jump-animation);
  }

  .feature:hover .arrow {
    transform: translateX(6px);
  }

  @media (max-width: 640px) {
    .feature {
      margin-top: 8px;
      gap: 14px;
      padding: 12px 16px 12px 12px;
    }

    .dial-wrap {
      width: 80px;
      height: 80px;
    }

    .title {
      font-size: 30px;
    }
  }
</style>
