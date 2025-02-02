<script lang="ts">
  import { tweened } from 'svelte/motion';
  import { cubicOut, cubicInOut } from 'svelte/easing';
  import JumpText from '../JumpText.svelte';
  import WigglyText from '../WigglyText.svelte';

  export let index: number = 0;

  export let link: {
    title: string;
    description: string;
    href: string;
    ready: boolean;
  };

  let isHovered = false;

  const ampX = tweened(4, {
    duration: 200,
    easing: cubicInOut
  });

  const ampY = tweened(4, {
    duration: 200,
    easing: cubicInOut
  });

  const durationX = tweened(1, {
    duration: 200,
    easing: cubicInOut
  });

  const durationY = tweened(1, {
    duration: 200,
    easing: cubicInOut
  });

  $: {
    if (isHovered && link.ready) {
      ampX.set(0);
      ampY.set(0);
      durationX.set(5);
      durationY.set(5);
    } else {
      ampX.set(8);
      ampY.set(4);
      durationX.set(10);
      durationY.set(10);
    }
  }
</script>

<a
  href={link.ready ? link.href : ''}
  on:mouseenter={() => (isHovered = true)}
  on:mouseleave={() => (isHovered = false)}
  class:ready={link.ready}
>
  <h2>
    {#if link.ready}
      <JumpText text={link.title} stagger={0.01} delay={0.5 + index * 0.15} />
    {/if}

    {#if !link.ready}
      <WigglyText
        randomness={0.4}
        baseAmplitudeX={$ampX}
        baseAmplitudeY={$ampY}
        baseDurationX={$durationX}
        baseDurationY={$durationY}
        text={link.title}
        delay={0.5 + index * 0.15}
      />
    {/if}
  </h2>
  <p>
    <WigglyText
      randomness={0.4}
      baseAmplitudeX={$ampX}
      baseAmplitudeY={$ampY}
      baseDurationX={$durationX}
      baseDurationY={$durationY}
      text={link.description}
      delay={0.5 + index * 0.15}
    />
  </p>

  {#if !link.ready}
    <div
      class="wip"
      style="
        animation-delay: {0.6 + index * 0.15}s; 
        --final-rotation: {Math.floor(Math.random() * 20) - 10}deg
      "
    >
      In&nbsp;construction
    </div>
  {/if}
</a>

<style>
  a {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0px;
    text-decoration: none;
    cursor: not-allowed;
    position: relative;
  }

  h2 {
    font-size: 32px;
    font-weight: 800;
    color: #fff;
    margin: 0;
    line-height: 1;
    transform: scale(1, 1);
    transition: transform 0.5s var(--jump-animation);
    transform-origin: center bottom;
    opacity: 0.2;
  }

  p {
    margin: 8px auto;
    font-size: 14px;
    font-weight: 500;
    color: #fff;
    opacity: 0.2;
  }

  .wip {
    font-size: 16px;
    font-weight: 900;
    letter-spacing: 4px;
    color: #fff;
    outline: 1px solid var(--brand-orange);
    padding: 4px 8px;
    border-radius: 4px;
    opacity: 1;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation: wipFall 0.4s var(--jump-animation) both;
    transform-origin: left center;
  }

  .ready {
    opacity: 0.9;
    transition: opacity 0.2s ease-in-out;
    cursor: pointer;

    &:hover {
      opacity: 1;

      & h2 {
        transform: scale(1, 1.1);
        opacity: 1;
      }
    }

    & h2 {
      opacity: 1;
      color: var(--brand-orange);
    }

    & p {
      opacity: 1;
    }
  }

  @keyframes wipFall {
    0% {
      opacity: 0;
      scale: 2;
      rotate: -30deg;
    }
    100% {
      opacity: 1;
      scale: 1;
      rotate: var(--final-rotation);
    }
  }
</style>
