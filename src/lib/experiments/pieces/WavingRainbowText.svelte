<script lang="ts">
  import { tick } from 'svelte';
  import Stage from '../Stage.svelte';
  import { findExperiment } from '../catalog';
  import { createWavingText } from '../sketches/wavingText';

  let { preview = false, playing = $bindable(true) }: { preview?: boolean; playing?: boolean } =
    $props();

  const { label } = findExperiment('waving-rainbow-text')!;

  // The pen's own three rows.
  const ORIGINAL = 'Love Conquers Hate';
  const MAX_WORDS = 4;
  const MAX_LETTERS = 14;

  let stage: ReturnType<typeof Stage> | undefined = $state();
  let phrase = $state(ORIGINAL);

  // Plain text all the way down: every letter is rendered by Svelte as a text
  // node, where the pen spanified innerText into an innerHTML string.
  const words = $derived.by(() => {
    const list = phrase
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, MAX_WORDS)
      .map((word) => Array.from(word).slice(0, MAX_LETTERS));
    return list.length ? list : ORIGINAL.split(' ').map((word) => Array.from(word));
  });

  const spoken = $derived(words.map((word) => word.join('')).join(' '));

  $effect(() => {
    void words;
    tick().then(() => stage?.refresh());
  });
</script>

<Stage
  bind:this={stage}
  label="{label} Words: {spoken}."
  {preview}
  bind:playing
  layers={0}
  create={(host) => createWavingText(host)}
>
  {#snippet overlay()}
    <div class="col">
      {#each words as word, w (w)}
        <div class="word">
          {#each word as letter, i (i)}<span>{letter}</span>{/each}
        </div>
      {/each}
    </div>
  {/snippet}
</Stage>

{#if !preview}
  <form class="phrase" onsubmit={(event) => event.preventDefault()}>
    <label for="waving-phrase">words</label>
    <input
      id="waving-phrase"
      type="text"
      bind:value={phrase}
      maxlength="48"
      autocomplete="off"
      spellcheck="false"
    />
    <button type="button" onclick={() => (phrase = ORIGINAL)} disabled={phrase === ORIGINAL}>
      reset
    </button>
    <span class="hint">up to {MAX_WORDS} words, one per row</span>
  </form>
{/if}

<style>
  /* .col / .letters-wave from the pen, sized by --k (set by the sketch). */
  .col {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: calc(48px * var(--k, 1));
    padding-top: calc(96px * var(--k, 1));
  }

  .word {
    display: flex;
    align-items: flex-end;
    height: calc(48px * var(--k, 1));
    font-family: sans-serif;
    font-weight: 900;
    line-height: normal;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .word span {
    font-size: calc(120px * var(--k, 1));
    color: hsl(0, 50%, 50%);
  }

  .phrase {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 8px;
    padding: 10px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.14);
    font-size: 11px;
    color: rgba(255, 255, 255, 0.64);
  }

  label {
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--brand-orange);
  }

  input,
  button {
    font: inherit;
    font-size: 12px;
    color: #fff;
    background: none;
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 999px;
    padding: 6px 12px;
  }

  input {
    flex: 1 1 14ch;
    min-width: 0;
    max-width: 32ch;
  }

  button {
    font-size: 11px;
    cursor: pointer;

    &:hover:not(:disabled) {
      color: var(--brand-orange);
      border-color: rgba(255, 153, 19, 0.6);
    }

    &:disabled {
      opacity: 0.4;
      cursor: default;
    }
  }

  input:focus-visible,
  button:focus-visible {
    outline: 2px solid var(--brand-orange);
    outline-offset: 2px;
  }

  .hint {
    color: rgba(255, 255, 255, 0.4);
  }
</style>
