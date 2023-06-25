<script>
	import LCD from '$lib/components/LCD.svelte';
</script>

<header>
	<h1>
		<span>I</span>zmael<span>M</span>ag
	</h1>
	<div class="subheading">Designer & Creative Developer</div>
</header>

<style>
	header {
		padding: 16px;
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	h1 {
		font-size: 96px;
		color: var(--neutral-9);
	}

	h1 span {
		color: var(--orange-5);
	}

	.subheading {
		font-size: 24px;
		line-height: 1;
		font-family: var(--font-body);
		font-weight: 450;
		margin-top: -8px;
		color: var(--neutral-8);
	}
</style>
