<script lang="ts">
  import Stage from '../Stage.svelte';
  import { findExperiment } from '../catalog';
  import { createTriangled } from '../sketches/triangled';

  let { preview = false, playing = $bindable(true) }: { preview?: boolean; playing?: boolean } =
    $props();

  const { label } = findExperiment('triangled')!;
</script>

<Stage {label} {preview} bind:playing create={(_, [canvas]) => createTriangled(canvas)} />
