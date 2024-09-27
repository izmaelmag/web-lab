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
        <JumpText text="I" offset={0.5} delay={0.5} />
      </span>
      <div>
        <JumpText text="zmael" delay={1.15} />
      </div>
      <span>
        <JumpText text="M" offset={0.5} delay={0.5} />
      </span>
      <div>
        <JumpText text="ag" delay={1.4} />
      </div>
    </div>

    <div class="subtitle">
      <JumpText text="crafting" offset={1} duration={0.5} stagger={0.05} direction="down" />
      <WigglyText text="moving pixels" delay={0.25} />
      <JumpText
        text="with code"
        offset={1}
        duration={0.35}
        stagger={0.05}
        delay={1}
        direction="down"
      />
    </div>
  </div>
</div>

<style>
  .intro {
    display: flex;
    position: absolute;
    top: 16px;
    left: 16px;
    align-items: flex-end;

    @media (max-width: 640px) {
      top: 0;
      transform: scale(0.6);
      transform-origin: left top;
      /* align-items: center; */
    }
  }

  .photo {
    width: 180px;
    height: 180px;
    border-radius: 50%;
    border: 4px solid var(--brand-orange);
    overflow: hidden;
    animation: zoomIn 0.5s cubic-bezier(1, 0.55, 0.3, 1) both;

    @media (max-width: 640px) {
      width: 120px;
      height: 120px;
      border-width: 2px;
    }
  }

  .photo img {
    width: 100%;
    height: 100%;
    flex: 1 1;
    animation: photoJump 0.8s 0.2s cubic-bezier(1, 0.55, 0.3, 1) both;
    transform-origin: left bottom;
  }

  .text {
    position: relative;
    flex: 1 1;
    font-weight: 900;
    left: -32px;
    line-height: 1;
    padding-bottom: 16px;

    @media (max-width: 640px) {
      left: 12px;
      top: 26px;
    }
  }

  .greeting {
    font-size: 20px;
    opacity: 0.8;
    font-weight: 500;
    letter-spacing: 0.02em;
    color: var(--brand-orange);
    transform: translate(59px, 31px);

    @media (max-width: 640px) {
      font-size: 22px;
    }
  }

  .name {
    font-size: 72px;
    color: var(--brand-orange);
    display: flex;
    align-items: baseline;
    margin-left: -8px;
  }

  .name span {
    font-size: 96px;
    color: #fff;
    text-shadow: -2px 0 0 2px #000;

    &:nth-child(1) {
      position: relative;
      right: -6px;

      text-shadow:
        0 8px 0 #000,
        0 -8px 0 #000;
    }
  }

  .subtitle {
    font-size: 16px;
    margin-top: -6px;
    margin-left: 18px;
    font-weight: 300;
    letter-spacing: 0.03em;

    @media (max-width: 640px) {
      font-size: 20px;
      margin-left: 0px;
      margin-top: 0px;
      width: 140vw;
      font-weight: 450;
      transform: translate(0px, 6px);
    }
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

  @keyframes zoomIn {
    0% {
      opacity: 0;
      transform: scale(0.2);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
</style>
