<script lang="ts">
	import { onMount } from 'svelte';
	import P5, { type Sketch } from 'p5-svelte';
	import Circles from '$lib/sketches/Circles';

	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';

	let sketch: Sketch;

	onMount(() => {
		sketch = Circles();
	});
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<Header subtitle="Designer & Creative developer" />

<nav class="links">
	<a href="/polyrhythm">Polyrhythm Sounds</a>
</nav>

<section class="sketch_section">
	<P5 {sketch} />
</section>

<Footer />

<style>
	.links {
		position: relative;
		z-index: 1;
		width: 100%;
		display: flex;
		align-items: center;
		flex-direction: column;
		gap: 16px;

		& a {
			font-size: 40px;
			color: var(--orange-5);
			text-decoration: none;
			font-family: var(--font-heading);

			&:hover {
				color: var(--orange-7);
			}
		}
	}

	.sketch_section {
		z-index: 0;
		width: 100%;
		height: 100%;
		position: fixed;
		top: 0;
		left: 0;
		flex-grow: 1;
		flex-shrink: 1;
		min-height: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
