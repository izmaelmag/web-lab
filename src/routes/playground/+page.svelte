<script>
	import Header from '$lib/components/Header.svelte';
	import Layout from '$lib/components/Layout.svelte';
</script>

<Layout>
	<Header links={[{ title: 'Playground' }]} />

	<nav>
		<a href="/playground/spirograph">Spirograph</a>
		<a href="/playground/loop_demo">Loop demo</a>
		<a href="/playground/daily-1">Daily #1</a>
		<a href="/playground/daily-2">Daily #2</a>
		<a href="/playground/daily-3">Daily #3</a>
		<a href="/playground/oscillators">Oscillators</a>
	</nav>
</Layout>

<style>
	nav {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	a {
		color: var(--blue-gray-600);
		text-decoration: none;
		font-size: 32px;
		line-height: 1;
		font-weight: 900;

		&:hover {
			color: var(--orange-600);
		}
	}
</style>
