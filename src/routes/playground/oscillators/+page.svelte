<script lang="ts">
	import Layout from '$lib/components/Layout.svelte';
	import Header from '$lib/components/Header.svelte';
	import Playground from '$lib/components/Playground.svelte';
	import SineModule from '$lib/components/SineModule/SineModule.svelte';

	const sines = [
		{ amplitude: 1, frequency: 1, phase: 0 },
		{ amplitude: 1, frequency: 2, phase: 0 },
		{ amplitude: 1, frequency: 4, phase: 0 },
		{ amplitude: 1, frequency: 8, phase: 0 }
	];
</script>

<Layout>
	<Header links={[{ title: 'Playground', url: '/playground' }, { title: 'Oscillators' }]} />

	<Playground>
		<div slot="content">
			<div class="col">
				{#each sines as sine}
					<SineModule rounded sines={[sine]} params={{ fade: false }} size={[256, 48]} />
				{/each}

				<SineModule rounded {sines} params={{ fade: false }} size={[256, 128]} />
			</div>
		</div>
	</Playground>
</Layout>

<style>
	.col {
		display: grid;
		grid-template-columns: repeat(1, auto);
		gap: 4px;
	}
</style>
