<script lang="ts">
	import type { Prompt, PromptPart } from '$lib/database/prompts';
	import { promptsDB } from '$lib/database/prompts';
	import { liveQuery } from 'dexie';

	import PromptPartForm from './PromptPartForm.svelte';
	import PromptPartAdd from './PromptPartAdd.svelte';

	export let prompt: Prompt;
	$: prompt;

	$: parts = liveQuery(
		async () => await promptsDB.parts.filter((part) => part.promptId === prompt.id).toArray()
	);

	const deletePart = async (partId: PromptPart['id']) => {
		await promptsDB.parts.delete(partId);
	};

	const updatePart = async (updatedPart: PromptPart) => {
		await promptsDB.parts.put(updatedPart);
	};

	const addNewPart = async () => {
		await promptsDB.parts.add({
			promptId: prompt.id,
			text: 'New text',
			weight: 0
		});
	};
</script>

<div class="columnsView">
	<div class="editor">
		<div class="section">
			<h3>Prompt content</h3>

			<div class="promptParts">
				{#if $parts}
					{#each $parts as part, index}
						<PromptPartForm onDelete={() => deletePart(part.id)} onChange={updatePart} {part} />
					{/each}
				{/if}

				<PromptPartAdd onClick={addNewPart} />
			</div>
		</div>
	</div>

	<div class="preview">
		<div class="section">
			<h3>Prompt</h3>
			<div class="result">
				{$parts?.map((p) => `((${p.text}))::${p.weight}`).join(' ')}
				{prompt.settings.ar}
			</div>
		</div>
	</div>
</div>

<style>
	h3 {
		margin-bottom: 8px;
		color: var(--cool-gray-700);
	}

	.result {
		background: var(--cool-gray-200);
		padding: 12px;
		border-radius: 6px;
		width: 100%;
		margin: 0;
		font-family: monospace;
	}

	.columnsView {
		display: flex;
		width: 100%;
		height: 100%;
		gap: 32px;
		padding-bottom: 32px;

		& > div {
			width: 100%;
			flex: 1 1;
		}
	}

	.promptParts {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.section:not(:last-child) {
		margin-bottom: 32px;
	}
</style>
