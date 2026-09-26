<script lang="ts">
  import { pieces } from '$lib/experiments/pieces';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  const experiment = $derived(data.experiment);
  const Piece = $derived(pieces[data.experiment.slug]);
</script>

<svelte:head>
  <title>{experiment.title} — CodePen archive — Izmael Mag</title>
  <meta name="description" content={experiment.summary} />
</svelte:head>

<article class="experiment">
  <header class="head">
    <p class="kicker">
      <span>fig. {experiment.index}</span>
      <span class="rule" aria-hidden="true"></span>
      <span>pen {experiment.penId}</span>
    </p>
    <h1>{experiment.title}</h1>
    <p class="summary">{experiment.summary}</p>
    <p class="origin">
      <span class="label">original</span>
      <span class="original-title">“{experiment.originalTitle}”</span>
      <a href={experiment.url} target="_blank" rel="noopener noreferrer">
        codepen.io/izmaelmag/pen/{experiment.penId} ↗
      </a>
    </p>
  </header>

  <div class="frame">
    <span class="tick tl" aria-hidden="true"></span>
    <span class="tick tr" aria-hidden="true"></span>
    <span class="tick bl" aria-hidden="true"></span>
    <span class="tick br" aria-hidden="true"></span>
    {#key experiment.slug}
      <Piece />
    {/key}
  </div>

  <div class="notes">
    <section class="about" aria-labelledby="about-heading">
      <h2 id="about-heading"><span>§1</span> About</h2>
      {#each experiment.about as paragraph, i (i)}
        <p>{paragraph}</p>
      {/each}
    </section>

    <section aria-labelledby="maths-heading">
      <h2 id="maths-heading"><span>§2</span> Maths</h2>
      <dl class="maths">
        {#each experiment.maths as formula (formula.label)}
          <div>
            <dt>{formula.label}</dt>
            <dd><code>{formula.expr}</code></dd>
          </div>
        {/each}
      </dl>
    </section>

    <section aria-labelledby="adaptation-heading">
      <h2 id="adaptation-heading"><span>§3</span> Adaptation</h2>
      <ul class="adaptation">
        {#each experiment.adaptation as note, i (i)}
          <li>{note}</li>
        {/each}
      </ul>
    </section>
  </div>

  <nav class="pager" aria-label="Previous and next pens">
    {#if data.previous}
      <a class="prev" href="/experiments/{data.previous.slug}">
        <span class="dir">← {data.previous.index}</span>
        <span class="name">{data.previous.title}</span>
      </a>
    {:else}
      <a class="prev" href="/experiments">
        <span class="dir">← 00</span>
        <span class="name">Index</span>
      </a>
    {/if}
    {#if data.next}
      <a class="next" href="/experiments/{data.next.slug}">
        <span class="dir">{data.next.index} →</span>
        <span class="name">{data.next.title}</span>
      </a>
    {:else}
      <a class="next" href="/experiments">
        <span class="dir">00 →</span>
        <span class="name">Index</span>
      </a>
    {/if}
  </nav>
</article>

<style>
  .experiment {
    max-width: 1280px;
  }

  .kicker {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 0 0 16px;
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--brand-orange);
  }

  .rule {
    flex: 0 1 64px;
    height: 1px;
    background: rgba(255, 153, 19, 0.5);
  }

  h1 {
    margin: 0;
    font-size: clamp(36px, 7vw, 88px);
    font-weight: 900;
    letter-spacing: -0.045em;
    line-height: 0.95;
    overflow-wrap: anywhere;
  }

  .summary {
    max-width: 60ch;
    margin: 20px 0 0;
    font-size: 14px;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.78);
  }

  .origin {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 10px;
    margin: 16px 0 0;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);

    & a {
      color: #fff;
      text-decoration: none;
      border-bottom: 1px solid var(--brand-orange);
      overflow-wrap: anywhere;

      &:hover {
        color: var(--brand-orange);
      }
    }
  }

  .label {
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.4);
  }

  a:focus-visible {
    outline: 2px solid var(--brand-orange);
    outline-offset: 3px;
  }

  /* Construction frame: hairline top rule and orange registration ticks. */
  .frame {
    position: relative;
    margin: 32px 0 0;
    border-top: 1px solid rgba(255, 255, 255, 0.14);
    padding-top: 12px;
  }

  .tick {
    position: absolute;
    z-index: 2;
    width: 12px;
    height: 12px;
    pointer-events: none;
    border-color: var(--brand-orange);
    border-style: solid;
    border-width: 0;
  }

  .tl {
    top: 6px;
    left: -6px;
    border-top-width: 1px;
    border-left-width: 1px;
  }

  .tr {
    top: 6px;
    right: -6px;
    border-top-width: 1px;
    border-right-width: 1px;
  }

  .bl,
  .br {
    top: calc(12px + var(--stage-height, clamp(340px, 68vh, 820px)) - 6px);
  }

  .bl {
    left: -6px;
    border-bottom-width: 1px;
    border-left-width: 1px;
  }

  .br {
    right: -6px;
    border-bottom-width: 1px;
    border-right-width: 1px;
  }

  .notes {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
    gap: 40px 48px;
    margin-top: 48px;
  }

  h2 {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin: 0 0 16px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.14);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;

    & span {
      font-weight: 400;
      color: var(--brand-orange);
    }
  }

  .about p {
    margin: 0 0 14px;
    font-size: 13px;
    line-height: 1.7;
    color: rgba(255, 255, 255, 0.8);
  }

  .maths {
    margin: 0;

    & div {
      padding: 8px 0;
      border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
    }

    & dt {
      font-size: 10px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.45);
    }

    & dd {
      margin: 4px 0 0;
    }

    & code {
      font-family: inherit;
      font-size: 12px;
      line-height: 1.6;
      color: #fff;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
  }

  .adaptation {
    margin: 0;
    padding: 0;
    list-style: none;

    & li {
      position: relative;
      margin: 0 0 12px;
      padding-left: 18px;
      font-size: 12px;
      line-height: 1.65;
      color: rgba(255, 255, 255, 0.78);

      &::before {
        content: '↳';
        position: absolute;
        left: 0;
        color: var(--brand-orange);
      }
    }
  }

  .pager {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-top: 56px;
    border-top: 1px solid rgba(255, 255, 255, 0.14);

    & a {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
      padding: 16px 0;
      color: #fff;
      text-decoration: none;

      &:hover .name {
        color: var(--brand-orange);
      }
    }
  }

  .next {
    text-align: right;
  }

  .dir {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.45);
  }

  .name {
    font-size: clamp(14px, 2.4vw, 20px);
    font-weight: 700;
    overflow-wrap: anywhere;
    transition: color 0.2s ease;
  }
</style>
