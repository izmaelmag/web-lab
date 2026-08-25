<script lang="ts">
  import type { Snippet } from 'svelte';

  let { sidebar, content }: { sidebar?: Snippet; content?: Snippet } = $props();
</script>

<div class="playground">
  {#if sidebar}
    <div class="controls">
      {@render sidebar()}
    </div>
  {/if}

  <div class="preview">
    {@render content?.()}
  </div>
</div>

<style>
  .playground {
    display: flex;
    align-items: stretch;
    gap: 8px;
    height: 100%;

    @media screen and (max-width: 640px) {
      flex-direction: column-reverse;
    }
  }

  .controls {
    width: 300px;
    height: 100%;
    padding-right: 8px;
    overflow: auto;
    flex-shrink: 0;

    @media screen and (max-width: 640px) {
      height: 100%;
      width: 100%;
      min-height: 0;
      flex-shrink: 1;
      padding-bottom: 80px;
    }
  }

  .preview {
    border: 1px solid var(--cool-gray-300);
    width: 100%;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    @media screen and (max-width: 640px) {
      height: auto;
      flex-shrink: 0;
      border: none;
      padding-bottom: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: auto;
    }

    :global(& > div) {
      display: flex !important;
      align-items: center;
      justify-content: center;
    }
  }

  .preview :global(canvas) {
    border: 1px solid var(--cool-gray-300);
  }
</style>
