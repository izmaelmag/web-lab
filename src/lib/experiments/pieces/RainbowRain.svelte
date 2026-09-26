<script lang="ts">
  import Stage from '../Stage.svelte';
  import { findExperiment } from '../catalog';
  import { createRain } from '../sketches/rain';
  import type { Sketch } from '../runner';

  let { preview = false, playing = $bindable(true) }: { preview?: boolean; playing?: boolean } =
    $props();

  const { label } = findExperiment('rainbow-rain')!;

  // Pointer position for the .aim reticle, in stage px.
  let aim = $state({ x: 0, y: 0, visible: false });

  function create(host: HTMLElement, [canvas]: HTMLCanvasElement[]): Sketch {
    const sketch = createRain(canvas, { preview });
    if (preview) return sketch;

    const move = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      aim = { x: event.clientX - rect.left, y: event.clientY - rect.top, visible: true };
    };
    const leave = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') aim.visible = false;
    };

    host.addEventListener('pointermove', move);
    host.addEventListener('pointerdown', move);
    host.addEventListener('pointerleave', leave);

    return {
      ...sketch,
      destroy() {
        host.removeEventListener('pointermove', move);
        host.removeEventListener('pointerdown', move);
        host.removeEventListener('pointerleave', leave);
      }
    };
  }
</script>

<Stage {label} {create} {preview} bind:playing>
  {#snippet overlay()}
    {#if aim.visible}
      <div class="aim" style:transform="translate({aim.x}px, {aim.y}px)" aria-hidden="true">
        <span class="h"></span>
        <span class="v"></span>
        <span class="c"></span>
      </div>
    {/if}
  {/snippet}
</Stage>

<style>
  /* The pen's .aim reticle: 45° square and hairline crosshairs in #77f. */
  .aim {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    will-change: transform;
  }

  .c {
    position: absolute;
    top: 0;
    left: 0;
    width: 11px;
    height: 11px;
    background: #000;
    margin: -5px 0 0 -5px;
    transform: rotate(45deg);
    border: 1px solid #77f;
  }

  .h {
    position: absolute;
    top: 1px;
    left: -100%;
    width: 200%;
    height: 1px;
    background: #77f;
    opacity: 0.5;
  }

  .v {
    position: absolute;
    top: -100%;
    left: 1px;
    width: 1px;
    height: 200%;
    background: #77f;
    opacity: 0.5;
  }
</style>
