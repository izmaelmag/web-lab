<script lang="ts">
  import { links } from '$lib/data/mainMenu.json';
  import { contents } from '$lib/data/contents.json';
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
    width: 100%;
    margin: 24px 0;
  }

  .wrapper {
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
  }

  .links {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }
</style>
