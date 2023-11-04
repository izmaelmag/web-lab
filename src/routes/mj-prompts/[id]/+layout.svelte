<script lang="ts">
	import { goto } from '$app/navigation';
	import { promptsDB, AspectRatio, deletePrompt } from '$lib/database/prompts';
	import Header from '$lib/components/Header.svelte';
	import { liveQuery } from 'dexie';
	import type { PageData } from './$types';

	const prompts = liveQuery(() => promptsDB.prompts.toArray());

	export let data: PageData;
	$: ({ id } = data);

	const handlePromptCreate = async () => {
		const newId = await promptsDB.prompts.add({
			name: `New prompt ${$prompts.length + 1}`,
			settings: {
				ar: AspectRatio.square,
				parts: []
			}
		});

		goto(`/mj-prompts/${newId}`);
	};
</script>

<Header subtitle="Midjourney prompts constructor" title="Prompster 🤖" />

<div class="layout">
	<div class="sidebar">
		<h2>Prompts</h2>
		{#if $prompts}
			{#each $prompts as prompt (prompt.id)}
				<a
					class="link"
					class:active={prompt.id === id}
					href={prompt.id === id ? '' : `/mj-prompts/${prompt.id}`}
				>
					{prompt.name || 'Unnamed prompt'}

					<button on:click={() => deletePrompt(prompt.id)}>Delete</button>
				</a>
			{/each}
		{/if}

		<button type="button" class="add" on:click|preventDefault={handlePromptCreate}>
			Add prompt
		</button>
	</div>

	<div class="content">
		<slot />
	</div>
</div>

<style>
	.layout {
		display: flex;
		align-items: stretch;
		gap: 24px;
	}

	.sidebar {
		width: max(20%, 200px);
		flex-shrink: 0;

		& h2 {
			margin: 0 0 16px;
			color: var(--cool-gray-700);
		}
	}

	.content {
		flex: 1 1;
		min-width: 0;
		width: 100%;
	}

	.link {
		position: relative;
		color: var(--cyan-700);
		text-decoration: none;
		font-family: var(--font-body);
		font-weight: 500;
		display: flex;
		justify-content: space-between;
		background: transparent;
		padding: 2px 4px;
		border-radius: 2px;
		margin: 12px 0 12px -4px;
		box-shadow: 0 0 0 0 var(--white);
		transition: all 0.3s;
		z-index: 1;

		&:hover {
			z-index: 2;
			background-color: var(--cool-gray-200);
			box-shadow: 0 0 0 2px var(--cool-gray-200);
		}

		&.active {
			z-index: 2;
			background-color: var(--cool-gray-800);
			box-shadow: 0 0 0 6px var(--cool-gray-800);
			color: var(--white);
		}
	}

	.add {
		width: 100%;
		border: none;
		background-color: var(--cool-gray-100);
		color: var(--cool-gray-700);
		text-align: center;
		padding: 8px 16px;
		border-radius: 6px;
		font-family: var(--font-body);
		font-weight: 700;
		font-size: 16px;
		cursor: pointer;
		transition: all 0.3s ease;

		&:hover {
			background-color: var(--cool-gray-200);
		}
	}
</style>
