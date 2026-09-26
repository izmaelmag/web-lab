<script lang="ts">
  import { tick } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import { PROFILE_URL, experiments } from './catalog';

  const INDEX = '/experiments';

  let open = $state(false);
  let toggleButton: HTMLButtonElement;
  let panel: HTMLElement;

  const path = $derived(page.url.pathname.replace(/\/+$/, '') || '/');
  const current = $derived(experiments.find((e) => path === `${INDEX}/${e.slug}`));

  async function toggle() {
    open = !open;
    if (!open) return;
    await tick();
    (
      panel.querySelector<HTMLAnchorElement>('[aria-current="page"]') ??
      panel.querySelector<HTMLAnchorElement>('a')
    )?.focus();
  }

  function onkeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape' || !open) return;
    open = false;
    toggleButton.focus();
  }

  afterNavigate(() => {
    open = false;
  });
</script>

<svelte:window {onkeydown} />

<nav class="archive-nav" aria-label="CodePen archive">
  <div class="bar">
    <a class="home" href="/" aria-label="Home — Izmael Mag">←</a>
    <a class="brand" href={INDEX}>
      <span class="brand-kicker">izmaelmag /</span>
      <span class="brand-title">CodePen archive</span>
    </a>
    <button
      type="button"
      class="toggle"
      aria-expanded={open}
      aria-controls="archive-menu"
      bind:this={toggleButton}
      onclick={toggle}
    >
      <span class="toggle-current">{current ? current.index : '00'}/05</span>
      <span>{open ? 'close' : 'menu'}</span>
      <span class="toggle-icon" class:open aria-hidden="true">+</span>
    </button>
  </div>

  <div class="panel" class:open id="archive-menu" bind:this={panel}>
    <ol class="items">
      <li>
        <a href={INDEX} aria-current={path === INDEX ? 'page' : undefined}>
          <span class="n">00</span>
          <span class="t">Index</span>
          <span class="id">all five</span>
        </a>
      </li>
      {#each experiments as experiment (experiment.slug)}
        <li>
          <a
            href="{INDEX}/{experiment.slug}"
            aria-current={current?.slug === experiment.slug ? 'page' : undefined}
          >
            <span class="n">{experiment.index}</span>
            <span class="t">{experiment.title}</span>
            <span class="id">{experiment.penId}</span>
          </a>
        </li>
      {/each}
    </ol>

    <p class="source">
      <span class="label">source</span>
      <a href={PROFILE_URL} target="_blank" rel="noopener noreferrer">codepen.io/izmaelmag ↗</a>
    </p>
  </div>
</nav>

<style>
  .archive-nav {
    position: sticky;
    top: 0;
    z-index: 30;
    width: 100%;
    background: #000;
    border-bottom: 1px solid rgba(255, 255, 255, 0.14);
    font-size: 12px;
  }

  .bar {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 52px;
    padding: 0 12px;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  a:focus-visible,
  button:focus-visible {
    outline: 2px solid var(--brand-orange);
    outline-offset: 2px;
  }

  .home {
    display: grid;
    place-items: center;
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    font-size: 16px;
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 50%;
    transition:
      color 0.2s ease,
      border-color 0.2s ease;

    &:hover {
      color: var(--brand-orange);
      border-color: var(--brand-orange);
    }
  }

  .brand {
    display: flex;
    flex-direction: column;
    min-width: 0;
    line-height: 1.2;
  }

  .brand-kicker {
    font-size: 10px;
    letter-spacing: 0.08em;
    color: rgba(255, 255, 255, 0.45);
  }

  .brand-title {
    font-weight: 700;
    color: var(--brand-orange);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
    flex-shrink: 0;
    font: inherit;
    font-size: 11px;
    letter-spacing: 0.06em;
    color: #fff;
    background: none;
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 999px;
    padding: 7px 12px;
    cursor: pointer;
  }

  .toggle-current {
    color: rgba(255, 255, 255, 0.45);
  }

  .toggle-icon {
    display: inline-block;
    color: var(--brand-orange);
    font-size: 14px;
    line-height: 1;
    transition: transform 0.3s var(--jump-animation);

    &.open {
      transform: rotate(45deg);
    }
  }

  .panel {
    display: none;
    padding: 4px 12px 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);

    &.open {
      display: block;
    }
  }

  .items {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .items a {
    position: relative;
    display: grid;
    grid-template-columns: 2.5em minmax(0, 1fr) auto;
    align-items: baseline;
    gap: 8px;
    padding: 11px 0 11px 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.72);
    transition: color 0.2s ease;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      width: 5px;
      height: 1px;
      background: rgba(255, 255, 255, 0.3);
      transition:
        width 0.2s ease,
        background 0.2s ease;
    }

    &:hover {
      color: #fff;
    }

    &[aria-current='page'] {
      color: var(--brand-orange);

      &::before {
        width: 9px;
        background: var(--brand-orange);
      }

      & .n,
      & .id {
        color: var(--brand-orange);
      }
    }
  }

  .n {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.4);
  }

  .t {
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  .id {
    font-size: 10px;
    letter-spacing: 0.04em;
    color: rgba(255, 255, 255, 0.35);
  }

  .source {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 8px;
    margin: 16px 0 0;
    font-size: 11px;

    & a {
      color: #fff;
      border-bottom: 1px solid rgba(255, 153, 19, 0.5);

      &:hover {
        color: var(--brand-orange);
      }
    }
  }

  .label {
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.4);
  }

  @media (min-width: 960px) {
    .archive-nav {
      align-self: start;
      height: 100vh;
      height: 100dvh;
      overflow-y: auto;
      border-bottom: none;
      border-right: 1px solid rgba(255, 255, 255, 0.14);
    }

    .bar {
      align-items: flex-start;
      padding: 24px 20px 20px;
    }

    .brand-title {
      font-size: 16px;
      white-space: normal;
    }

    .toggle {
      display: none;
    }

    .panel,
    .panel.open {
      display: block;
      padding: 0 20px 24px;
      border-top: none;
    }

    .items {
      border-top: 1px solid rgba(255, 255, 255, 0.14);
    }
  }
</style>
