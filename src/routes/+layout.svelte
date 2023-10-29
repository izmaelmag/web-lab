<script>
	import '$lib/styles/fonts.css';
	import '$lib/styles/colors.css';
	import '$lib/styles/global.css';
	import Container from '$lib/components/Container.svelte';
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="true" />
	<link
		href="https://fonts.googleapis.com/css2?family=Alexandria:wght@100..900&family=Caprasimo:wght@400&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<main class="app">
	<Container>
		<slot />
	</Container>
</main>

<style>
	main {
		height: 100vh;
	}
</style>
