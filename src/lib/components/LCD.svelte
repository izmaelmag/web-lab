<script lang="ts">
	import P5 from 'p5-svelte';
	import LCDSketch from '$lib/sketches/LCD';

	const sketch = LCDSketch;
</script>

<picture>
	<P5 {sketch} />
</picture>

<style>
	picture {
		padding: 0;
		margin: 0;
		width: 190px;
		display: block;
	}
</style>
