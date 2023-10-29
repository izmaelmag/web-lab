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

<nav class="nav">
	<a href="/mj-prompts">Midjourney prompt helper</a>
</nav>

<section class="sketch_section">
	<P5 {sketch} />
</section>

<Footer />

<style>
	.nav {
		font-family: var(--font-heading);
		font-size: 24px;

		& a {
			text-decoration: none;
			color: var(--orange-500);

			&:hover {
				color: var(--orange-700);
			}
		}
	}
	.sketch_section {
		z-index: 0;
		width: 100%;
		height: 100%;
		position: fixed;
		top: 0;
		right: 0;
		transform: translateX(60%);
		flex-grow: 1;
		flex-shrink: 1;
		min-height: 0;
	}
</style>
