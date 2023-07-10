<script>
	import '$lib/styles/fonts.css';
	import '$lib/styles/colors.css';
	import '$lib/styles/global.css';
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
	<div class="interface">
		<a href="/">Home</a>
	</div>
	<slot />
</main>

<style>
	main {
		max-height: 100%;
		overflow: hidden;
		position: relative;
	}

	.interface {
		position: relative;
		z-index: 1;
	}
</style>
