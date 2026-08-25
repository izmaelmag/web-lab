<script lang="ts">
  import type { Snippet } from 'svelte';

  let { children }: { children?: Snippet } = $props();
</script>

<div class="container">
  {@render children?.()}
</div>

<style>
  .container {
    width: 100%;
    min-height: 100%;
    padding: 0 24px;
    display: flex;
    flex-direction: column;
  }
</style>
