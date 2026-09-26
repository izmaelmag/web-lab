<script lang="ts">
  import Stage from '../Stage.svelte';
  import { findExperiment } from '../catalog';
  import { createOrbit, type OrbitParams } from '../sketches/orbit';

  let { preview = false, playing = $bindable(true) }: { preview?: boolean; playing?: boolean } =
    $props();

  const { label } = findExperiment('orbit-geometry')!;

  // The constants of MbyXXL, unchanged.
  const COUNT = 3;
  const R1 = 150;
  const params: OrbitParams = {
    count: COUNT,
    r1: R1,
    r2: (R1 / (Math.PI * 2)) * COUNT,
    speed: 0.5,
    centerSize: 20,
    innerSize: 10,
    outerSize: 2,
    ringWidth: 2,
    lineWidth: 2,
    trailWidth: 1,
    dashedCenter: false,
    overlay: 'rgba(26,29,37,0.05)',
    background: '#202639',
    reference: 760
  };
</script>

<Stage
  {label}
  {preview}
  bind:playing
  layers={2}
  background={params.background}
  create={(_, [trails, canvas]) => createOrbit(canvas, trails, params)}
/>
