<script lang="ts">
  export let text: string = '';
  export let delay: number = 0;
  export let duration: number = 0.5;
  export let stagger: number = 0.1;
  export let offset: number = 0.5;
  export let direction: 'up' | 'down' = 'down';

  const relativeOffset = direction === 'up' ? `${offset * 100}%` : `-${offset * 100}%`;

  // Fix whitespaces
  text = text.replace(/\s/g, '\u00A0');
  const styleString = (index: number) => {
    return `animation-delay: ${delay + index * stagger}s; animation-duration: ${duration}s; animation-iteration-count: 1;`;
  };
</script>

<div class="jump-text" style="--offset: {relativeOffset}">
  {#each text as letter, index}
    <div class="letter" style={styleString(index)}>
      {letter}
    </div>
  {/each}
</div>

<style>
  .jump-text {
    display: inline-flex;
  }

  .letter {
    animation-name: jumpDown;
    animation-timing-function: cubic-bezier(0.35, 1.7, 0.4, 0.7);
    animation-fill-mode: both;
  }

  @keyframes jumpDown {
    0% {
      opacity: 0;
      transform: translateY(var(--offset)) rotate(-20deg);
    }
    100% {
      opacity: 1;
      transform: translateY(0) rotate(0deg);
    }
  }
</style>
