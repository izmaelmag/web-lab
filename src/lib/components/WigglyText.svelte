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

  /**
   * Generates a random factor based on the provided randomness degree.
   * Ensures that randomness does not exceed specified bounds for smoothness.
   * @returns {number} - A random multiplier between (1 - randomness) and (1 + randomness).
   */
  const getRandomFactor = () => {
    return 1 + (Math.random() * 2 - 1) * randomness;
  };

  /**
   * Generates inline styles for the X-axis animation with controlled randomness.
   * @param {number} index - The index of the character.
   * @returns {string} - The inline CSS styles.
   */
  $: styleX = (index: number) => {
    const duration = baseDurationX * getRandomFactor();
    const amplitude = baseAmplitudeX * getRandomFactor();
    const animationDelay = delay + index * stagger;
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
  $: styleY = (index: number) => {
    const duration = baseDurationY * getRandomFactor();
    const amplitude = baseAmplitudeY * getRandomFactor();
    const animationDelay = delay + index * stagger + durationYPhaseShift(duration);
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
    <span class="wiggle-x" style={styleX(index)}>
      <span class="wiggle-y" style={styleY(index)}>
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
