<script lang="ts">
	import Layout from '$lib/components/Layout.svelte';
	import Header from '$lib/components/Header.svelte';
	import Playground from '$lib/components/Playground.svelte';
</script>

<Layout>
	<Header links={[{ title: 'Playground', url: '/playground' }, { title: 'Daily #3' }]} />

	<Playground>
		<!-- <div slot="sidebar">sidebar</div> -->

		<div slot="content">content</div>
	</Playground>
</Layout>
