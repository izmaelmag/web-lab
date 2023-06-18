<script>
	import LCD from '$lib/components/LCD.svelte';
</script>

<header>
	<LCD />
	<h1>
		<span>I</span>ZMAEL<span>M</span>AG
	</h1>
</header>

<style>
	header {
		padding: 16px;
		display: flex;
		align-items: center;
		gap: 16px;
		flex-shrink: 0;
	}

	h1 {
		/* Manual adjustment values */
		font-size: 136px;
		line-height: 96px;
		letter-spacing: -28px;
		transform-origin: 0 100%;
		color: var(--neutral-7);
	}

	h1 span {
		color: var(--orange-5);
	}
</style>
