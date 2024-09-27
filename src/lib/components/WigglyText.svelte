<script lang="ts">
  export let text: string = '';
  export let delay: number = 0;
  export let stagger: number = 0.07;
  export let duration: number = 0.5;
  export let amplitude: number = 1;

  const styleString = (index: number) => {
    return `
      animation-delay: ${delay + index * stagger}s;
      animation-duration: ${duration}s;
    `;
  };
</script>

<span class="wiggly-text" style="--amplitude: {amplitude}px">
  {#each text.split('') as char, index}
    <span class="wiggly-char" style={styleString(index)}>
      {char === ' ' ? '\u00A0' : char}
    </span>
  {/each}
</span>

<style>
  .wiggly-text {
    display: inline-block;
  }

  .wiggly-char {
    display: inline-block;
    animation-name: wiggle, fadeIn;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite, 1;
    animation-fill-mode: forwards, both;
  }

  @keyframes wiggle {
    0%,
    100% {
      transform: translateY(var(--amplitude));
    }
    50% {
      transform: translateY(calc(var(--amplitude) * -1));
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
