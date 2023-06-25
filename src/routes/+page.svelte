<script lang="ts">
	import { onMount } from 'svelte';
	import P5, { type Sketch } from 'p5-svelte';
	import Circles from '$lib/sketches/Circles';

	let sketch: Sketch;

	onMount(() => {
		sketch = Circles();
	})
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<section class="sketch_section">
	<P5 {sketch} />
</section>

<style>
	.sketch_section {
		width: 100%;
		flex-grow: 1;
		flex-shrink: 1;
		min-height: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
