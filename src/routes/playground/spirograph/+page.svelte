<script lang="ts">
	import P5 from 'p5-svelte';
	import { spirograph } from './spirograph';
	import Layout from '$lib/components/Layout.svelte';
	import Header from '$lib/components/Header.svelte';

	let sketch = spirograph;
	$: sketch;
</script>

<Layout>
	<Header
		links={[
			{ title: 'Playground', url: '/playground' },
			{ title: 'Spirograph', url: '/playground/spirograph' }
		]}
	/>

	<div class="playground">
		<div class="controls">
			<h2>Controls</h2>
			<section>
				<h3>Base circle</h3>

				<div class="field">
					<div class="label">X-Radius</div>
					<input type="range" value="20" min={20} max={200} />
				</div>
			</section>
		</div>

		<div class="preview">
			{#if sketch}
				<P5 sketch={spirograph.render} />
			{/if}
		</div>
	</div>
</Layout>

<style>
	.playground {
		display: flex;
		align-items: flex-start;
		gap: 24px;
		padding: 8px;
	}

	.controls {
		width: 300px;
		padding-right: 8px;
		border-right: 1px solid var(--cool-gray-300);
	}
</style>
