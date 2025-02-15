<script lang="ts">
  import Layout from '$lib/components/Layout.svelte';
  import InnerPage from '$lib/layouts/InnerPage/InnerPage.svelte';

  import { links } from '$lib/data/mainMenu.json';
  import { contents } from '$lib/data/contents.json';
  import JumpText from '$lib/components/JumpText.svelte';

  const menuItem = links.find((item) => item.id === 'shaders');
  const contentsItems = contents.filter((item) => item.id === 'shaders');
</script>

<Layout>
  {#if menuItem}
    <InnerPage title={menuItem.title} description={menuItem.description}>
      {#if contentsItems}
        {#each contentsItems as content}
          <a class="contentItem" href={content.href}>
            <div class="preview">
              <img src={`/previews/${content.slug}.png`} alt={content.title} />
              <div class="contentItem-title">{content.title}</div>
            </div>
            <div class="contentItem-description">
              <JumpText
                text={content.description}
                direction="up"
                rotationScale={2}
                offset={1}
                stagger={0.01}
              />
            </div>
          </a>
        {/each}
      {/if}
    </InnerPage>
  {/if}
</Layout>

<style>
  .contentItem {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    text-decoration: none;
  }

  .preview {
    width: 320px;
    height: 128px;
    background: #000;
    border-radius: 12px;
    position: relative;
    animation: fadeIn 0.5s ease-in-out both;
    transform-origin: center bottom;
    transition: transform 0.6s var(--jump-animation);

    &:hover {
      transform: scale(1.1);
    }

    &::after {
      content: '';
      position: absolute;
      bottom: -10%;
      left: -10%;
      width: 120%;
      height: 70%;
      background: linear-gradient(
        to bottom,
        rgba(0, 0, 0, 0) 0%,
        rgba(0, 0, 0, 0.5) 50%,
        rgba(0, 0, 0, 1) 100%
      );
      filter: blur(6px);
    }

    & img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 12px;
    }
  }

  .contentItem-title {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
    width: 100%;
    font-size: 32px;
    font-weight: 800;
    color: var(--brand-orange);
    text-decoration: none;
    z-index: 10;
  }

  .contentItem-description {
    position: relative;
    z-index: 10;
    font-size: 16px;
    color: #fff;
    text-decoration: none;
    z-index: 10;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
