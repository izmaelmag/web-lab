<script lang="ts">
  import { onMount } from 'svelte';
  export let text: string = '';
  export let delay: number = 0.5;
  export let stagger: number = 0.01;
  export let baseDurationX: number = 5; // Base duration for X-axis animation in seconds
  export let baseDurationY: number = 5; // Base duration for Y-axis animation in seconds
  export let baseAmplitudeX: number = 1; // Base amplitude for X-axis in pixels
  export let baseAmplitudeY: number = 3; // Base amplitude for Y-axis in pixels
  export let randomness: number = 0.1; // Degree of randomness (0 to 1), reduced for smoother movement

  let mounted = false;

  onMount(() => {
    mounted = true;
  });

  // Stable per-letter variation: changing the hover amplitude must not roll
  // new timings and make the letters twitch on every tweened store update.
  const getRandomFactor = (index: number, salt: number, variance: number) => {
    const hash = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43758.5453;
    return 1 + ((hash - Math.floor(hash)) * 2 - 1) * variance;
  };

  /**
   * Generates inline styles for the X-axis animation with controlled randomness.
   * @param {number} index - The index of the character.
   * @returns {string} - The inline CSS styles.
   */
  const styleX = (
    index: number,
    baseDuration: number,
    baseAmplitude: number,
    startDelay: number,
    letterStagger: number,
    variance: number
  ) => {
    const duration = baseDuration * getRandomFactor(index, 1, variance);
    const amplitude = baseAmplitude * getRandomFactor(index, 2, variance);
    const animationDelay = startDelay + index * letterStagger;
    return `
      animation-delay: ${animationDelay}s;
      animation-duration: ${duration}s;
      --amplitudeX: ${amplitude}px;
      transition: animation-duration 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    `;
  };

  /**
   * Generates inline styles for the Y-axis animation with controlled randomness and phase shift.
   * @param {number} index - The index of the character.
   * @returns {string} - The inline CSS styles.
   */
  const styleY = (
    index: number,
    baseDuration: number,
    baseAmplitude: number,
    startDelay: number,
    letterStagger: number,
    variance: number
  ) => {
    const duration = baseDuration * getRandomFactor(index, 3, variance);
    const amplitude = baseAmplitude * getRandomFactor(index, 4, variance);
    const animationDelay = startDelay + index * letterStagger + durationYPhaseShift(duration);
    return `
      animation-delay: ${animationDelay}s;
      animation-duration: ${duration}s;
      --amplitudeY: ${amplitude}px;
      transition: animation-duration 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    `;
  };

  /**
   * Calculates a phase shift for the Y-axis animation based on its duration.
   * @param {number} duration - The duration of the Y-axis animation.
   * @returns {number} - The phase shift in seconds.
   */
  const durationYPhaseShift = (duration: number) => {
    return duration / 4;
  };

  const getFadeInStyle = () => {
    return `animation-delay: ${delay}s;`;
  };
</script>

<span class="wiggly-text {mounted ? 'mounted' : ''}" style={getFadeInStyle()}>
  {#each text.split('') as char, index}
    <span
      class="wiggle-x"
      style={styleX(index, baseDurationX, baseAmplitudeX, delay, stagger, randomness)}
    >
      <span
        class="wiggle-y"
        style={styleY(index, baseDurationY, baseAmplitudeY, delay, stagger, randomness)}
      >
        {@html char === ' ' ? '\u00A0' : char}
      </span>
    </span>
  {/each}
</span>

<style>
  .wiggly-text {
    display: inline-block;
    animation: fadeIn 1s ease-in-out both;
  }

  .wiggle-x {
    display: inline-block;
    animation-name: wiggleX;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
    animation-fill-mode: forwards;
    will-change: transform;
    backface-visibility: hidden; /* Enhances performance */
    transform-style: preserve-3d;
  }

  .wiggle-y {
    display: inline-block;
    animation-name: wiggleY;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
    animation-fill-mode: forwards;
    will-change: transform;
    backface-visibility: hidden; /* Enhances performance */
    transform-style: preserve-3d;
  }

  /* X-axis Animation */
  @keyframes wiggleX {
    0% {
      transform: translate3d(0, 0, 0);
    }
    20% {
      transform: translate3d(calc(var(--amplitudeX) * 0.5), 0, 0);
    }
    40% {
      transform: translate3d(var(--amplitudeX), 0, 0);
    }
    60% {
      transform: translate3d(calc(var(--amplitudeX) * -0.5), 0, 0);
    }
    80% {
      transform: translate3d(calc(var(--amplitudeX) * -1), 0, 0);
    }
    100% {
      transform: translate3d(0, 0, 0);
    }
  }

  /* Y-axis Animation */
  @keyframes wiggleY {
    0% {
      transform: translate3d(0, 0, 0);
    }
    20% {
      transform: translate3d(0, calc(var(--amplitudeY) * 0.5), 0);
    }
    40% {
      transform: translate3d(0, var(--amplitudeY), 0);
    }
    60% {
      transform: translate3d(0, calc(var(--amplitudeY) * -0.5), 0);
    }
    80% {
      transform: translate3d(0, calc(var(--amplitudeY) * -1), 0);
    }
    100% {
      transform: translate3d(0, 0, 0);
    }
  }

  @keyframes fadeIn {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
</style>
