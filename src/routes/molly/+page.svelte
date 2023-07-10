<script lang="ts">
	import { onMount } from 'svelte';
	import P5, { type Sketch } from 'p5-svelte';
	import Molly from '$lib/modules/Molly';

	let sketch: Sketch;
	const molly = new Molly();

	onMount(() => {
		sketch = molly.render;
	});
</script>

<div class="container">
	<P5 {sketch} />
</div>

<style>
	.container {
    position: absolute;
    top: 0;
    left: 0;
		width: 100%;
		height: 100%;
	}
</style>
