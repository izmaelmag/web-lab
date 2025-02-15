<script lang="ts">
  import Intro from '$lib/components/Intro/Intro.svelte';
  import MainMenu from '$lib/components/MainMenu/MainMenu.svelte';
</script>

<div class="home-page">
  <div class="wrapper">
    <Intro />
    <MainMenu />
  </div>
</div>

<style>
  .home-page {
    background: #000;
    padding-top: 16px;
  }

  .wrapper {
    width: 100%;
    max-width: 100%;
    height: 100%;
    min-height: 100vh;
    margin: 0 auto;
    padding: 0 24px 64px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
</style>
