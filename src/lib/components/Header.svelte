<script>
	import LCD from '$lib/components/LCD.svelte';
</script>

<header>
	<LCD />
	<h1>
		<span>I</span>ZM<span>A</span>EL<span>M</span>AG
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
		animation: fadeInPrimary 1s 2s ease both;
	}

	h1 span {
		position: relative;
		z-index: 1;
		color: var(--orange-5);
		animation: fadeInSecondary 1s 1s ease both;
	}

	h1 span:last-of-type {
		z-index: 0;
	}

	@keyframes fadeInPrimary {
		from {
			color: var(--neutral-1);
		}

		to {
			color: var(--neutral-7);
		}
	}

	@keyframes fadeInSecondary {
		from {
			color: var(--neutral-1);
		}

		to {
			color: var(--orange-5);
		}
	}
</style>
