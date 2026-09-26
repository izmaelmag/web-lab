<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import { prefersReducedMotion, runSketch, type Runner, type Sketch } from './runner';

  interface Props {
    /** Describes the animation for assistive tech; the stage is one image. */
    label: string;
    /** Canvases stacked bottom to top. */
    layers?: number;
    create: (host: HTMLElement, canvases: HTMLCanvasElement[]) => Sketch;
    /** Catalog miniature: no transport, playback owned by the parent. */
    preview?: boolean;
    playing?: boolean;
    background?: string;
    /** Markup inside the stage, above the canvases. */
    overlay?: Snippet;
    /** Extra buttons in the transport bar. */
    controls?: Snippet;
  }

  let {
    label,
    layers = 1,
    create,
    preview = false,
    playing = $bindable(true),
    background = '#000',
    overlay,
    controls
  }: Props = $props();

  let host: HTMLElement;
  let runner: Runner | undefined;
  let reduced = $state(false);

  const stateLabel = $derived.by(() => {
    if (playing) return '● running';
    return reduced ? '○ still · reduced motion' : '○ paused';
  });

  export function restart() {
    if (!reduced) playing = true;
    runner?.setPlaying(playing);
    runner?.restart();
  }

  export function refresh() {
    runner?.refresh();
  }

  function toggle() {
    playing = !playing;
  }

  onMount(() => {
    reduced = prefersReducedMotion();
    if (reduced) playing = false;
    runner = runSketch(host, create(host, Array.from(host.querySelectorAll('canvas'))), playing);
    return () => {
      runner?.destroy();
      runner = undefined;
    };
  });

  $effect(() => {
    runner?.setPlaying(playing);
  });
</script>

<div class="stage" class:preview>
  <div class="host" role="img" aria-label={label} bind:this={host} style:background>
    {#each Array.from({ length: layers }, (_, i) => i) as layer (layer)}
      <canvas aria-hidden="true">{label}</canvas>
    {/each}
    {@render overlay?.()}
  </div>

  {#if !preview}
    <div class="transport">
      <span class="state">{stateLabel}</span>
      <span class="buttons" role="group" aria-label="Animation controls">
        <button type="button" onclick={toggle}>{playing ? '❚❚ pause' : '▶ play'}</button>
        <button type="button" onclick={restart}>↺ restart</button>
        {@render controls?.()}
      </span>
    </div>
  {/if}
</div>

<style>
  .stage {
    position: relative;
    width: 100%;
    min-width: 0;
  }

  .host {
    position: relative;
    width: 100%;
    height: var(--stage-height, clamp(340px, 68vh, 820px));
    overflow: hidden;
    isolation: isolate;
    touch-action: pan-y;
  }

  .preview .host {
    height: auto;
    aspect-ratio: 16 / 10;
  }

  canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
  }

  .transport {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px 16px;
    padding: 10px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.14);
    font-size: 11px;
    letter-spacing: 0.04em;
    color: rgba(255, 255, 255, 0.64);
  }

  .state {
    white-space: nowrap;
  }

  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .transport :global(button) {
    font: inherit;
    font-size: 11px;
    letter-spacing: 0.04em;
    color: #fff;
    background: none;
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 999px;
    padding: 7px 12px;
    cursor: pointer;
    white-space: nowrap;
    transition:
      border-color 0.2s ease,
      color 0.2s ease;
  }

  .transport :global(button:hover) {
    color: var(--brand-orange);
    border-color: rgba(255, 153, 19, 0.6);
  }

  .transport :global(button:focus-visible) {
    outline: 2px solid var(--brand-orange);
    outline-offset: 2px;
  }
</style>
