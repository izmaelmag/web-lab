<script lang="ts">
  import Intro from '$lib/components/Intro/Intro.svelte';
  import MainMenu from '$lib/components/MainMenu/MainMenu.svelte';
  import ShowreelFeature from '$lib/components/ShowreelFeature/ShowreelFeature.svelte';
</script>

<div class="home-page">
  <div class="wrapper">
    <Intro isCompact={false} />
    <ShowreelFeature />
    <p class="index-label" aria-hidden="true"><span>index</span></p>
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
    height: 100%;
    min-height: 100vh;
    margin: 0 auto;
    padding: 0 24px 64px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .index-label {
    display: flex;
    align-items: center;
    gap: 12px;
    width: min(100%, 520px);
    margin: 32px 0 0;
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.6);
    animation: indexIn 0.6s 1.6s ease both;

    &::before,
    &::after {
      content: '';
      flex: 1;
      height: 1px;
      background: rgba(255, 255, 255, 0.2);
    }
  }

  @keyframes indexIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .index-label {
      animation: none;
    }
  }
</style>
