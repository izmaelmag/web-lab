<script lang="ts">
	export let title: string | undefined = 'Izmael Mag';
	export let subtitle: string;

	const processedTitle = title
		?.split(/\s+/)
		.map((word) => {
			const [first, ...rest] = [...word];
			return `<span class="org">${first}</span><span>${rest.join('')}</span>`;
		})
		.join(' ');
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
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	h1 {
		font-size: 48px;
		color: var(--blue-gray-800);

		@media (max-width: 480px) {
			font-size: 32px;
		}
	}

	:global(.org) {
		color: var(--orange-500);
	}

	.subheading {
		font-size: 16px;
		line-height: 1.2;
		font-family: var(--font-body);
		font-weight: 450;
		color: var(--cool-gray-600);

		@media (max-width: 480px) {
			font-size: 16px;
		}
	}
</style>
