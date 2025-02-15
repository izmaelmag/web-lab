<script lang="ts">
  import Intro from '$lib/components/Intro/Intro.svelte';
  import JumpText from '$lib/components/JumpText.svelte';
  import WigglyText from '$lib/components/WigglyText.svelte';

  export let title: string;
  export let description: string;
</script>

<div class="inner-page">
  <div class="compact-intro">
    <Intro isCompact={true} isHomeLink={true} />
  </div>

  <div class="wrapper">
    <h1>
      <JumpText
        text={title}
        offset={0.5}
        direction="up"
        delay={0.1}
        stagger={0.05}
        duration={0.5}
        rotationScale={0.5}
      />
    </h1>

    <p>
      <WigglyText text={description} delay={0} stagger={0.025} randomness={0.02} />
    </p>

    <nav>
      <slot />
    </nav>
  </div>
</div>

<style>
  .inner-page {
    background: #000;
    padding-top: 8px;
  }

  .compact-intro {
    position: fixed;
    top: 12px;
    left: 12px;
  }

  h1 {
    margin-bottom: 8px;
    font-size: 48px;
    font-weight: 800;
    color: var(--brand-orange);
  }

  p {
    margin-bottom: 16px;
    font-size: 16px;
    color: #fff;
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
</style>
