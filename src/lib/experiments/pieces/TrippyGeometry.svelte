<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Stage from '../Stage.svelte';
  import { findExperiment } from '../catalog';
  import { isSeed, randomSeed } from '../random';
  import { createOrbit } from '../sketches/orbit';
  import { previewSeed, trippyParams } from '../sketches/trippy';

  let { preview = false, playing = $bindable(true) }: { preview?: boolean; playing?: boolean } =
    $props();

  const { label } = findExperiment('trippy-geometry')!;

  let stage: ReturnType<typeof Stage> | undefined = $state();
  let sketch: ReturnType<typeof createOrbit> | undefined;
  let seed = $state('');
  let draft = $state('');
  let invalid = $state(false);

  const params = $derived(seed ? trippyParams(seed) : undefined);

  function seedFromUrl() {
    const value = new URL(window.location.href).searchParams.get('seed')?.toLowerCase();
    return isSeed(value) ? value : undefined;
  }

  function create(_: HTMLElement, [trails, canvas]: HTMLCanvasElement[]) {
    seed = preview ? previewSeed() : (seedFromUrl() ?? randomSeed());
    draft = seed;
    sketch = createOrbit(canvas, trails, trippyParams(seed));
    return sketch;
  }

  function writeUrl() {
    const url = new URL(window.location.href);
    if (url.searchParams.get('seed') === seed) return;
    url.searchParams.set('seed', seed);
    goto(url, { replaceState: true, noScroll: true, keepFocus: true });
  }

  function apply(next: string) {
    seed = next;
    draft = next;
    invalid = false;
    sketch?.configure(trippyParams(next));
    stage?.restart();
    writeUrl();
  }

  function submit(event: SubmitEvent) {
    event.preventDefault();
    const value = draft.trim().toLowerCase();
    if (!isSeed(value)) {
      invalid = true;
      return;
    }
    apply(value);
  }

  // Pin the seed in the URL so a refresh or a shared link shows the same figure.
  onMount(() => {
    if (!preview && seed) writeUrl();
  });
</script>

<Stage bind:this={stage} {label} {preview} bind:playing layers={2} background="#000" {create}>
  {#snippet controls()}
    <button type="button" onclick={() => apply(randomSeed())}>⟳ new seed</button>
  {/snippet}
</Stage>

{#if !preview}
  <div class="seed-bar">
    <form class="seed" onsubmit={submit}>
      <label for="trippy-seed">seed</label>
      <input
        id="trippy-seed"
        type="text"
        bind:value={draft}
        maxlength="12"
        autocomplete="off"
        spellcheck="false"
        aria-invalid={invalid}
        aria-describedby="trippy-seed-hint"
      />
      <button type="submit">apply</button>
      <span id="trippy-seed-hint" class="hint" class:invalid>1–12 of a–z, 0–9</span>
    </form>

    {#if params}
      <dl class="readout">
        <div>
          <dt>COUNT</dt>
          <dd>{params.count}</dd>
        </div>
        <div>
          <dt>R1</dt>
          <dd>{params.r1.toFixed(1)}</dd>
        </div>
        <div>
          <dt>R2</dt>
          <dd>{params.r2.toFixed(1)}</dd>
        </div>
        <div>
          <dt>SPEED</dt>
          <dd>{params.speed.toFixed(3)}</dd>
        </div>
        <div>
          <dt>lw</dt>
          <dd>{params.lineWidth.toFixed(2)}</dd>
        </div>
        <div>
          <dt>wash</dt>
          <dd>
            <span class="swatch" style:background={params.overlay} aria-hidden="true"></span>
            {params.overlay}
          </dd>
        </div>
      </dl>
    {/if}
  </div>
{/if}

<style>
  .seed-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px 24px;
    padding: 10px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.14);
    font-size: 11px;
    color: rgba(255, 255, 255, 0.64);
  }

  .seed {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 8px;
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
    width: 13ch;
    letter-spacing: 0.06em;
  }

  input[aria-invalid='true'] {
    border-color: #ff5a4a;
  }

  button {
    font-size: 11px;
    cursor: pointer;

    &:hover {
      color: var(--brand-orange);
      border-color: rgba(255, 153, 19, 0.6);
    }
  }

  input:focus-visible,
  button:focus-visible {
    outline: 2px solid var(--brand-orange);
    outline-offset: 2px;
  }

  .hint {
    color: rgba(255, 255, 255, 0.4);

    &.invalid {
      color: #ff5a4a;
    }
  }

  .readout {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    margin: 0;
    min-width: 0;

    & div {
      display: flex;
      gap: 6px;
      min-width: 0;
    }

    & dt {
      color: rgba(255, 255, 255, 0.4);
    }

    & dd {
      margin: 0;
      color: #fff;
      overflow-wrap: anywhere;
    }
  }

  .swatch {
    display: inline-block;
    width: 8px;
    height: 8px;
    margin-right: 2px;
    border: 1px solid rgba(255, 255, 255, 0.4);
    vertical-align: middle;
  }
</style>
