<script>
	import '$lib/styles/fonts.css';
	import '$lib/styles/colors.css';
	import '$lib/styles/global.css';
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="true" />
	<link
		href="https://fonts.googleapis.com/css2?family=Azeret+Mono:wght@100..900&&family=Rubik+Mono+One&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<main class="app">
	<slot />
</main>

<style>
	main {
		font-family: 'Azeret Mono', monospace;
		max-height: -webkit-fill-available;
		background: var(--blue-gray-100);
	}
</style>
