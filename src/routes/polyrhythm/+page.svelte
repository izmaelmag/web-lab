<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import { onMount } from 'svelte';
	import P5, { type Sketch } from 'p5-svelte';
	import Circles from '$lib/sketches/Polyrhythms';

	let sketch: Sketch;

	onMount(() => {
		sketch = Circles();
	});
</script>

<Header title="Polyrhythms" subtitle="" />

<section class="sketch_section">
	<P5 {sketch} />
</section>

<style>
	.sketch_section {
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 24px auto;
    border: 1px solid #ddd;
	}
</style>
