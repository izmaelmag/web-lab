<script lang="ts">
  import { onMount } from 'svelte';
  export let text: string = '';
  export let delay: number = 0;
  export let duration: number = 0.5;
  export let stagger: number = 0.1;
  export let offset: number = 0.5;
  export let direction: 'up' | 'down' = 'down';

  let mounted = false;

  onMount(() => {
    // Trigger animations after component mounts
    mounted = true;
  });

  const relativeOffset = direction === 'up' ? `${offset * 100}%` : `-${offset * 100}%`;

  // Fix whitespaces
  text = text.replace(/\s/g, '\u00A0');

  const styleString = (index: number) => {
    return `
      animation-delay: ${delay + index * stagger}s;
      animation-duration: ${duration}s;
    `;
  };
</script>

<div class="jump-text" style="--offset: {relativeOffset}">
  {#each text as letter, index}
    <span class="letter {mounted ? 'animate' : ''}" style={styleString(index)}>
      {letter}
    </span>
  {/each}
</div>

<style>
  .jump-text {
    display: inline-flex;
  }

  .letter {
    opacity: 0;
    transform: translate3d(0, var(--offset), 0);
    transition:
      opacity 0.3s ease,
      transform 0.3s ease;
  }

  .letter.animate {
    animation-name: jump;
    animation-timing-function: cubic-bezier(0.37, 1.69, 0.17, 0.8);
    animation-fill-mode: both;
    will-change: transform, opacity;
    backface-visibility: hidden;
  }

  @keyframes jump {
    0% {
      opacity: 0;
      transform: translate3d(0, var(--offset), 0) scale(0.8) rotate(-20deg);
    }
    100% {
      opacity: 1;
      transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
    }
  }
</style>
