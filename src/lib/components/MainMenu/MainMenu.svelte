<script lang="ts">
  import { links } from '$lib/data/mainMenu.json';
  import MainMenuLink from './MainMenuLink.svelte';
</script>

<div class="main-menu">
  <div class="wrapper">
    <nav class="links">
      {#each links as link, index}
        <MainMenuLink {link} {index} />
      {/each}
    </nav>
  </div>
</div>

<style>
  .main-menu {
    background: #000;
  }

  .wrapper {
    width: 100%;
    max-width: 640px;
    margin: 0 auto;
  }

  .links {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
</style>
