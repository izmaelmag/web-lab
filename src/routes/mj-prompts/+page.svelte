<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import PromptPartForm from '$lib/components/prompts/PromptPart.svelte';
	import PromptPartAdd from '$lib/components/prompts/PromptPartAdd.svelte';
	import {
		prompts as promptsStore,
		type Prompt,
		type PromptPart as PromptPartType
	} from '$lib/stores/prompts';

	let prompt: Prompt = { parts: [] };
	$: parts = prompt.parts;

	promptsStore.subscribe((prompts) => {
		prompt = prompts[0];
		parts = prompt.parts;
	});

	const partsToPrompt = (parts: PromptPartType[]): string => {
		return parts
			.reduce((output, { text, weight }) => `${output} ((${text}))::${weight}`, '')
			.trim();
	};

	const updatePart = (index: number, updatedPart: PromptPartType) => {
		parts[index] = updatedPart;
	};

	const addNewPart = () => {
		promptsStore.set([
			{
				parts: [...parts, { text: 'New part', weight: 0 }]
			}
		]);
	};
</script>

<Header subtitle="Midjourney prompts constructor" title="Prompster 🤖" />

<div class="columnsView">
	<div class="editor">
		<div class="promptParts">
			{#each parts as part, index}
				<PromptPartForm onDelete={() => {}} onChange={(p) => updatePart(index, p)} {part} />
			{/each}

			<PromptPartAdd onClick={addNewPart} />
		</div>
	</div>

	<div class="preview">
		<div class="result">{partsToPrompt(parts)}</div>
	</div>
</div>

<style>
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
		gap: 32px;

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
</style>
