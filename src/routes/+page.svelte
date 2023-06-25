<script>
	import P5 from 'p5-svelte';
	import Sketch from '$lib/sketches/Circles';

	const sketch = Sketch();
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
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
