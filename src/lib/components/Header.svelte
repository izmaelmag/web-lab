<script lang="ts">
	export let links: Array<{ title: string; url?: string }> = [];

	let hasLinks = links.length > 0;
</script>

<div class="header">
	<div>
		{#if hasLinks}
			<nav class="breadcrumbs">
				<a href="/">Home</a>
				<span class="divider">↳</span>

				{#each links as link, index}
					{#if index < links.length - 1}
						<a href={link.url}>{link.title}</a>
						<span class="divider">↳</span>
					{:else}
						<span class="pageName">{link.title}</span>
					{/if}
				{/each}
			</nav>
		{:else}
			<h1>IZMAEL</h1>
		{/if}
	</div>

	<div>
		{#if hasLinks}
			<h1>IZMAELMAG</h1>
		{:else}
			<h1>MAG</h1>
		{/if}
	</div>
</div>

<style>
	.header {
		margin: 8px;
		max-width: 800px;
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		border-top: 1px solid var(--blue-gray-600);
		border-bottom: 1px solid var(--blue-gray-600);

		& a,
		& h1 {
			font-size: 14px;
			text-decoration: none;
			font-weight: 700;
			line-height: 1;
			letter-spacing: 0.05em;
			text-transform: uppercase;
			color: var(--orange-500);
		}

		& a:hover {
			color: var(--orange-700);
		}
	}

	.pageName {
		font-size: 14px;
		text-decoration: none;
		font-weight: 500;
		line-height: 1;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--cool-gray-600);
	}

	.divider {
		color: var(--blue-gray-600);
		margin: 0 2px;
		position: relative;
		top: -2px;
		font-weight: 100;
		font-size: 16px;
		line-height: 14px;
	}

	.breadcrumbs {
		display: flex;
		align-items: baseline;
	}
</style>
