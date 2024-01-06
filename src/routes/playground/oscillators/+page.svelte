<script lang="ts">
	import Layout from '$lib/components/Layout.svelte';
	import Header from '$lib/components/Header.svelte';
	import Playground from '$lib/components/Playground.svelte';
	import SineModule from '$lib/components/SineModule/SineModule.svelte';
</script>

<Layout>
	<Header links={[{ title: 'Playground', url: '/playground' }, { title: 'Oscillators' }]} />

	<Playground>
		<div slot="content">
			<div class="col">
				<SineModule frequency={0.5} phase={0} />
				<SineModule amplitude={0.5} frequency={2} phase={0} />
				<SineModule frequency={2} phase={0.5} />
				<SineModule scale={2} amplitude={2} frequency={4} phase={0} />
				<SineModule scale={8} amplitude={4} frequency={8} phase={0.5} />
				<SineModule amplitude={4} frequency={11}/>
				<SineModule amplitude={8} frequency={6}/>
				<SineModule scale={0.5} amplitude={8} frequency={64}/>
			</div>
		</div>
	</Playground>
</Layout>

<style>
	.col {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 8px;
	}
</style>
