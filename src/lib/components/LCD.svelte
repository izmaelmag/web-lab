<script lang="ts">
	import { onMount } from 'svelte';
	import P5, { type Sketch } from 'p5-svelte';
	import LCDSketch from '$lib/sketches/LCD';

	let sketch: Sketch;

	onMount(() => {
		sketch = LCDSketch();
	});
</script>

<picture>
	<P5 {sketch} />
</picture>

<style>
	picture {
		padding: 0;
		margin: 0;
		width: calc(95px * 1);
		display: block;
	}
</style>
