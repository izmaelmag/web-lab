<script lang="ts">
  import type { Snippet } from 'svelte';
  import ArchiveNav from '$lib/experiments/ArchiveNav.svelte';

  let { children }: { children: Snippet } = $props();
</script>

<div class="archive">
  <ArchiveNav />
  <div class="content">
    {@render children()}
  </div>
</div>

<style>
  .archive {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    width: 100%;
    min-height: 100vh;
    min-height: 100dvh;
    background: #000;
    color: #fff;
  }

  .content {
    min-width: 0;
    padding: 24px 16px 96px;
  }

  @media (min-width: 640px) {
    .content {
      padding: 32px 32px 120px;
    }
  }

  @media (min-width: 960px) {
    .archive {
      grid-template-columns: 272px minmax(0, 1fr);
    }

    .content {
      padding: 40px clamp(32px, 4vw, 64px) 120px;
    }
  }
</style>
