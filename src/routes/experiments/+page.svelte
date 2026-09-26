<script lang="ts">
  import { onMount } from 'svelte';
  import { PROFILE_URL, experiments } from '$lib/experiments/catalog';
  import { pieces } from '$lib/experiments/pieces';
  import { prefersReducedMotion } from '$lib/experiments/runner';

  // Miniatures start as stills (matching SSR and reduced motion) and go live on
  // mount; one switch parks all of them.
  let live = $state(false);

  onMount(() => {
    live = !prefersReducedMotion();
  });
</script>

<svelte:head>
  <title>CodePen archive — Izmael Mag</title>
  <meta
    name="description"
    content="Five CodePen pens by Izmael Mag — canvas rain, orbit geometry, counter-rotating triangles and waving rainbow text — rebuilt from their original source."
  />
</svelte:head>

<header class="head">
  <p class="kicker">
    <span>archive</span>
    <span class="rule" aria-hidden="true"></span>
    <a href={PROFILE_URL} target="_blank" rel="noopener noreferrer">codepen.io/izmaelmag ↗</a>
  </p>
  <h1>CodePen<br />archive</h1>
  <p class="lede">
    Five pens from before this site, rebuilt from their original JavaScript and CSS. Same geometry,
    same frame timing, same odd constants — now sized to the screen, pausable and quiet when out of
    view.
  </p>
  <div class="switch">
    <span class="state">{live ? '● previews live' : '○ previews still'}</span>
    <button type="button" aria-pressed={live} onclick={() => (live = !live)}>
      {live ? '❚❚ pause previews' : '▶ play previews'}
    </button>
  </div>
</header>

<ol class="entries">
  {#each experiments as experiment, i (experiment.slug)}
    {@const Piece = pieces[experiment.slug]}
    <li class="entry" class:flip={i % 2 === 1}>
      <a class="preview" href="/experiments/{experiment.slug}" tabindex="-1" aria-hidden="true">
        <span class="fig">fig. {experiment.index}</span>
        <Piece preview playing={live} />
      </a>

      <div class="meta">
        <p class="index">
          <span>{experiment.index}</span>
          <span class="rule" aria-hidden="true"></span>
          <span class="pen">{experiment.penId}</span>
        </p>
        <h2>
          <a href="/experiments/{experiment.slug}">{experiment.title}</a>
        </h2>
        <p class="original">“{experiment.originalTitle}”</p>
        <p class="summary">{experiment.summary}</p>
        <p class="formula"><code>{experiment.signature}</code></p>
        <p class="links">
          <a href="/experiments/{experiment.slug}">open →</a>
          <a href={experiment.url} target="_blank" rel="noopener noreferrer">
            codepen ↗<span class="visually-hidden"> ({experiment.title} original)</span>
          </a>
        </p>
      </div>
    </li>
  {/each}
</ol>

<style>
  .head {
    max-width: 1280px;
    padding-bottom: 32px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.14);
  }

  .kicker {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    margin: 0 0 16px;
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--brand-orange);

    & a {
      color: #fff;
      text-transform: none;
      letter-spacing: 0.02em;
      text-decoration: none;
      border-bottom: 1px solid var(--brand-orange);

      &:hover {
        color: var(--brand-orange);
      }
    }
  }

  .rule {
    flex: 0 1 64px;
    height: 1px;
    background: rgba(255, 153, 19, 0.5);
  }

  h1 {
    margin: 0;
    font-size: clamp(44px, 9vw, 120px);
    font-weight: 900;
    letter-spacing: -0.05em;
    line-height: 0.9;
  }

  .lede {
    max-width: 58ch;
    margin: 24px 0 0;
    font-size: 14px;
    line-height: 1.65;
    color: rgba(255, 255, 255, 0.78);
  }

  .switch {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 16px;
    margin-top: 24px;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.6);

    & button {
      font: inherit;
      font-size: 11px;
      color: #fff;
      background: none;
      border: 1px solid rgba(255, 255, 255, 0.22);
      border-radius: 999px;
      padding: 7px 12px;
      cursor: pointer;

      &:hover {
        color: var(--brand-orange);
        border-color: rgba(255, 153, 19, 0.6);
      }
    }
  }

  a:focus-visible,
  button:focus-visible {
    outline: 2px solid var(--brand-orange);
    outline-offset: 3px;
  }

  .entries {
    list-style: none;
    margin: 0;
    padding: 0;
    max-width: 1280px;
  }

  .entry {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 20px;
    padding: 32px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.14);
  }

  /* The miniature, framed like a plate: hairline box and orange corner ticks. */
  .preview {
    position: relative;
    display: block;
    outline: 1px solid rgba(255, 255, 255, 0.14);
    outline-offset: 6px;
    margin: 6px;

    &::before,
    &::after {
      content: '';
      position: absolute;
      z-index: 2;
      width: 10px;
      height: 10px;
      pointer-events: none;
      border: 0 solid var(--brand-orange);
    }

    &::before {
      top: -7px;
      left: -7px;
      border-top-width: 1px;
      border-left-width: 1px;
    }

    &::after {
      right: -7px;
      bottom: -7px;
      border-right-width: 1px;
      border-bottom-width: 1px;
    }

    &:hover {
      outline-color: rgba(255, 153, 19, 0.5);
    }
  }

  .fig {
    position: absolute;
    z-index: 2;
    top: 8px;
    left: 8px;
    font-size: 10px;
    letter-spacing: 0.08em;
    color: rgba(255, 255, 255, 0.7);
    mix-blend-mode: difference;
    pointer-events: none;
  }

  .meta {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .index {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 0 12px;
    font-size: 11px;
    letter-spacing: 0.08em;
    color: var(--brand-orange);
  }

  .pen {
    color: rgba(255, 255, 255, 0.5);
  }

  h2 {
    margin: 0;
    font-size: clamp(28px, 4vw, 48px);
    font-weight: 900;
    letter-spacing: -0.04em;
    line-height: 1;
    overflow-wrap: anywhere;

    & a {
      color: #fff;
      text-decoration: none;
      transition: color 0.2s ease;

      &:hover {
        color: var(--brand-orange);
      }
    }
  }

  .original {
    margin: 8px 0 0;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.45);
    overflow-wrap: anywhere;
  }

  .summary {
    margin: 16px 0 0;
    max-width: 52ch;
    font-size: 13px;
    line-height: 1.65;
    color: rgba(255, 255, 255, 0.8);
  }

  .formula {
    margin: 16px 0 0;
    padding: 10px 0;
    border-top: 1px dashed rgba(255, 255, 255, 0.14);
    border-bottom: 1px dashed rgba(255, 255, 255, 0.14);

    & code {
      font-family: inherit;
      font-size: 12px;
      line-height: 1.6;
      color: #fff;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
  }

  .links {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 20px;
    margin: 16px 0 0;
    font-size: 12px;

    & a {
      color: #fff;
      text-decoration: none;
      border-bottom: 1px solid rgba(255, 153, 19, 0.5);

      &:hover {
        color: var(--brand-orange);
        border-color: var(--brand-orange);
      }
    }
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
  }

  @media (min-width: 760px) {
    .entry {
      grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
      align-items: center;
      gap: 40px;
      padding: 48px 0;
    }

    .entry.flip {
      grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);

      & .preview {
        order: 2;
      }
    }
  }
</style>
