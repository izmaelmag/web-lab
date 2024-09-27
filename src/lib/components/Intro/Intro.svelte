<script lang="ts">
  import JumpText from '$lib/components/JumpText.svelte';
  import Layout from '$lib/components/Layout.svelte';
  import WigglyText from '$lib/components/WigglyText.svelte';
</script>

<div class="intro">
  <div class="photo">
    <img src="/dark.webp" alt="logo" />
  </div>

  <div class="text">
    <div class="greeting">
      <JumpText text="Hello there!" offset={1.5} stagger={0.05} direction="up" />
    </div>

    <div class="name">
      <span>
        <JumpText text="I" offset={0.5} delay={0.8} />
      </span>
      <div>
        <JumpText text="zmael" delay={1.2} />
      </div>
      <span>
        <JumpText text="M" offset={0.5} delay={0.9} />
      </span>
      <div>
        <JumpText text="ag" delay={1.6} />
      </div>
    </div>

    <div class="subtitle">
      <JumpText text="crafting" offset={1} duration={0.35} stagger={0.05} direction="down" />
      <WigglyText text="moving pixels" delay={0.25} />
      <JumpText
        text="with code"
        offset={1}
        duration={0.35}
        stagger={0.05}
        delay={1.25}
        direction="down"
      />
    </div>
  </div>
</div>

<style>
  .intro {
    display: flex;
    position: absolute;
    bottom: 0;
    left: 0;
    align-items: flex-end;
  }

  .photo {
    width: 240px;
    height: 240px;
    animation: photoJump 1s cubic-bezier(1, 0.55, 0.3, 1) both;
    transform-origin: left bottom;
  }

  .photo img {
    width: 100%;
    height: 100%;
    flex: 1 1;
  }

  .text {
    position: relative;
    flex: 1 1;
    font-weight: 900;
    left: -32px;
    line-height: 1;
    padding-bottom: 16px;
  }

  .greeting {
    font-size: 20px;
    opacity: 0.8;
    font-weight: 650;
    letter-spacing: 0.02em;
    color: var(--brand-orange);
    transform: translate(67px, 34px);
  }

  .name {
    font-size: 72px;
    color: var(--brand-orange);
    display: flex;
    align-items: baseline;
  }

  .name span {
    font-size: 96px;
    color: #fff;
  }

  .subtitle {
    font-size: 18px;
    margin-top: -4px;
    margin-left: 6px;
    font-weight: 500;
    letter-spacing: 0.02em;
  }

  /* Photo jump up animation */
  @keyframes photoJump {
    0% {
      transform: translateY(100%) rotate(35deg);
    }
    100% {
      transform: translateY(0) rotate(0deg);
    }
  }
</style>
