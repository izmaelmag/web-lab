<script lang="ts">
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
</script>

<div class="layout">
  {@render children()}
</div>

<style>
  .layout {
    padding: 8px;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
  }
</style>
