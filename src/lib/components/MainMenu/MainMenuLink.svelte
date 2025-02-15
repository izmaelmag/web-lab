<script lang="ts">
  import { tweened } from 'svelte/motion';
  import { cubicInOut } from 'svelte/easing';
  import JumpText from '../JumpText.svelte';
  import WigglyText from '../WigglyText.svelte';

  let innerWidth: number;
  $: isPhone = innerWidth <= 640;

  export let index: number = 0;

  export let link: {
    title: string;
    description: string;
    href: string;
    ready: boolean;
  };

  let isHovered = false;
  let isWiggling = false;

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
      ampX.set(3);
      ampY.set(2);
      durationX.set(10);
      durationY.set(10);
    }
  }
</script>

<svelte:window bind:innerWidth />

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
      randomness={isPhone ? 0.05 : 0.1}
      baseAmplitudeX={isPhone ? 1 : $ampX}
      baseAmplitudeY={isPhone ? 1 : $ampY}
      baseDurationX={isPhone ? 5 : $durationX}
      baseDurationY={isPhone ? 5 : $durationY}
      text={link.description}
      delay={0.5 + index * 0.15}
    />
  </p>

  {#if !link.ready}
    <button
      type="button"
      class="wip-wrapper"
      class:wiggling={isWiggling}
      on:click={() => (isWiggling = true)}
      on:animationend={() => (isWiggling = false)}
      aria-label="Work in progress"
    >
      <div
        class="wip"
        style="
          animation-delay: {0.6 + index * 0.15}s; 
          --final-rotation: {Math.floor(Math.random() * 8) - 4}deg
        "
      >
        In&nbsp;construction
      </div>
    </button>
  {/if}
</a>

<style>
  a {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0px;
    text-decoration: none;
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
    transform-origin: left bottom;
    opacity: 0.2;
  }

  p {
    margin: 8px 0;
    font-size: 14px;
    font-weight: 300;
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
    left: 0;
    transform: translateY(-50%);
    animation: wipFall 0.4s var(--jump-animation) both;
    transform-origin: left center;
  }

  .ready {
    transition: opacity 0.2s ease-in-out;
    cursor: pointer;

    &:hover {
      opacity: 1;

      & h2 {
        transform: scale(1.1);
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

  .wip-wrapper {
    position: absolute;
    top: 50%;
    left: 0;
    transform: translateY(-50%);
    transform-origin: center center;
    padding: 0;
    background: none;
    border: none;
    cursor: pointer;
  }

  .wip-wrapper.wiggling {
    animation: wiggle 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }

  @keyframes wiggle {
    0% {
      transform: translate(-50%, -50%) rotate(0deg);
    }
    50% {
      transform: translate(-50%, -50%) rotate(6deg);
    }
    100% {
      transform: translate(-50%, -50%) rotate(0deg);
    }
  }
</style>
