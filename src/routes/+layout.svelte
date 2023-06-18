<script>
	import '$lib/styles/fonts.css';
	import '$lib/styles/colors.css';
	import '$lib/styles/global.css';

	import Header from '$lib/components/Header.svelte';
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="true" />
	<link
		href="https://fonts.googleapis.com/css2?family=Archivo:wght@100;400;900&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<main class="app">
	<Header />
	<div class="content">
		<slot />
	</div>
	<footer>
		<a href="https://twitter.com/MagomedIzmael" rel="noreferrer noopener">Twitter</a>
		<a href="https://www.instagram.com/izmaelmag/" rel="noreferrer noopener">Instagram</a>
		<a href="https://github.com/izmaelmag" rel="noreferrer noopener">GitHub</a>
	</footer>
</main>

<style>
	footer {
		padding: 16px 16px 32px;
		margin-top: auto;
		display: flex;
		align-items: baseline;
		gap: 48px;
		flex-shrink: 0;
	}

	footer a,
	footer a:visited {
		text-decoration: none;
		font-weight: 700;
		text-transform: uppercase;
		color: var(--neutral-5);
		font-size: 32px;
		transition: color 0.6s ease;
	}
	
	footer a:hover {
		color: var(--orange-6);
		transition: color 0s linear;
	}
</style>
