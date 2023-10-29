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

	const deletePart = (index: number) => {
		console.log('Deleting', index);
		promptsStore.set([
			{
				parts: parts.toSpliced(index, 1)
			}
		]);
	};
</script>

<Header subtitle="Midjourney prompts constructor" title="Prompster 🤖" />

<div class="columnsView">
	<div class="editor">
		<div class="section">
			<h3>Prompt content</h3>

			<div class="promptParts">
				{#each parts as part, index}
					<PromptPartForm
						onDelete={() => deletePart(index)}
						onChange={(p) => updatePart(index, p)}
						{part}
					/>
				{/each}

				<PromptPartAdd onClick={addNewPart} />
			</div>
		</div>
	</div>

	<div class="preview">
		<div class="section">
			<h3>Prompt</h3>
			<div class="result">{partsToPrompt(parts) || '[empty]'}</div>
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
