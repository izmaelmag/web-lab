<script lang="ts">
	export let title: string | undefined = 'Izmael Mag';
	export let subtitle: string;

	const processedTitle = title
		?.split(' ')
		.map((word) => {
			const [first, ...rest] = [...word];
			return `<span class="org">${first}</span><span>${rest.join('')}</span>`;
		})
		.join('');
</script>

<header>
	<h1>
		{@html processedTitle}
	</h1>

	{#if Boolean(subtitle)}
		<div class="subheading">{subtitle}</div>
	{/if}
</header>

<style>
	header {
		text-align: center;
		padding: 16px;
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	h1 {
		font-size: 96px;
		color: var(--neutral-9);

		@media (max-width: 480px) {
			font-size: 64px;
		}
	}

	:global(.org) {
		color: var(--orange-5);
	}

	.subheading {
		font-size: 24px;
		line-height: 1;
		font-family: var(--font-body);
		font-weight: 450;
		margin-top: -8px;
		color: var(--neutral-8);

		@media (max-width: 480px) {
			font-size: 16px;
			margin-top: -2px;
		}
	}
</style>
