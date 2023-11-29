<script lang="ts">
	import P5 from 'p5-svelte';
	import { Spirograph } from './spirograph';
	import { onMount } from 'svelte';

	let sketch: Spirograph;

	onMount(() => {
		sketch = new Spirograph({ params: { radius: 100 } });
	});
</script>

<h1>Spirograph</h1>

{#if sketch}
	<P5 sketch={sketch.render} />
{/if}
