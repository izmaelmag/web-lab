<script>
	import Header from '$lib/components/Header.svelte';
	import Layout from '$lib/components/Layout.svelte';
</script>

<Layout>
	<Header links={[{ title: 'Playground' }]} />

	<a href="/playground/spirograph">Spirograph</a>
	<a href="/playground/loop_demo">Loop demo</a>
</Layout>
