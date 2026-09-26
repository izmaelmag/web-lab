<script lang="ts">
  import { onMount } from 'svelte';
  import { createScope, createTimeline, stagger } from 'animejs';
  import { jump, prefersReducedMotion, watchVisibility } from './score';

  // Same destinations as /links.
  const contacts = [
    { title: 'GitHub', handle: 'izmaelmag', url: 'https://github.com/izmaelmag' },
    { title: 'Telegram', handle: 't.me/izmaelmag', url: 'https://t.me/izmaelmag' },
    {
      title: 'LinkedIn',
      handle: 'ismail-magomedov',
      url: 'https://www.linkedin.com/in/ismail-magomedov/'
    },
    { title: 'Twitter', handle: '@izmaelmag', url: 'https://twitter.com/izmaelmag' }
  ];

  let root: HTMLElement;

  onMount(() => {
    const scope = createScope({ root }).add(() => {
      const entrance = createTimeline({ autoplay: false, defaults: { ease: jump } })
        .add('.rule', { scaleX: [0, 1], duration: 700, ease: 'inOutExpo', delay: stagger(70) }, 0)
        .add(
          '.contact',
          { y: ['60%', '0%'], opacity: [0, 1], duration: 520, delay: stagger(70) },
          160
        )
        .add('.outro', { opacity: [0, 1], duration: 400, ease: 'linear' }, 600);

      entrance.init();
      if (prefersReducedMotion()) {
        entrance.seek(entrance.duration);
        return;
      }

      entrance.seek(0);
      return watchVisibility(root, (visible) => {
        if (visible && !entrance.began) entrance.play();
      });
    });

    return () => scope.revert();
  });
</script>

<section class="contact-act" bind:this={root} aria-labelledby="contact-title">
  <header class="head">
    <p class="kicker">act IV / contact</p>
    <h2 id="contact-title">Say hello</h2>
  </header>

  <ul class="contacts">
    {#each contacts as contact (contact.title)}
      <li>
        <span class="rule" aria-hidden="true"></span>
        <a class="contact" href={contact.url} target="_blank" rel="noopener noreferrer">
          <span class="title">{contact.title}</span>
          <span class="handle">{contact.handle} ↗</span>
        </a>
      </li>
    {/each}
  </ul>

  <p class="outro">
    <a href="/">← back to web-lab</a>
    <a href="/links">all links</a>
  </p>
</section>

<style>
  .contact-act {
    --orange: var(--brand-orange, #ff9913);
    width: 100%;
    padding: clamp(64px, 12vh, 140px) clamp(16px, 3vw, 40px) 120px;
    color: #fff;
    border-top: 1px solid rgba(255, 255, 255, 0.14);
  }

  .head {
    display: grid;
    grid-template-columns: minmax(0, 11rem) minmax(0, 1fr);
    gap: 16px 32px;
    align-items: end;
    margin-bottom: 40px;
  }

  .kicker {
    margin: 0;
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--orange);
  }

  h2 {
    margin: 0;
    font-size: clamp(40px, 8vw, 128px);
    font-weight: 900;
    letter-spacing: -0.04em;
    line-height: 0.9;
    color: var(--orange);
  }

  .contacts {
    list-style: none;
    margin: 0;
    padding: 0 0 0 calc(11rem + 32px);
  }

  li {
    position: relative;
    overflow: hidden;
  }

  .rule {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 1px;
    background: rgba(255, 255, 255, 0.24);
    transform-origin: left center;
  }

  .contact {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 16px;
    padding: 18px 0;
    color: #fff;
    text-decoration: none;
  }

  .title {
    font-size: clamp(22px, 3vw, 40px);
    font-weight: 800;
    letter-spacing: -0.02em;
    transition:
      color 0.3s ease,
      transform 0.5s var(--jump-animation);
    transform-origin: left bottom;
  }

  .handle {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
  }

  .contact:hover .title {
    color: var(--orange);
    transform: translateX(8px);
  }

  .outro {
    display: flex;
    gap: 24px;
    margin: 40px 0 0;
    padding-left: calc(11rem + 32px);
    font-size: 12px;
    letter-spacing: 0.06em;
    text-transform: uppercase;

    & a {
      color: var(--orange);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  a:focus-visible {
    outline: 2px solid var(--orange);
    outline-offset: 4px;
  }

  @media (max-width: 900px) {
    .head {
      grid-template-columns: minmax(0, 1fr);
    }

    .contacts,
    .outro {
      padding-left: 0;
    }
  }
</style>
