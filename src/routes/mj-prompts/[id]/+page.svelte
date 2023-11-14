<script lang="ts">
	import { promptsDB, type Prompt } from '$lib/database/prompts';
	import type { PageData } from './$types';
	import PromptEditor from '$lib/layouts/PromptEditor/PromptEditor.svelte';
	import { liveQuery } from 'dexie';

	export let data: PageData;
	$: ({ id } = data);

	let prompts: Prompt[] = [];
	$: prompts;

	$: prompt = liveQuery(async () => {
		const results = await promptsDB.prompts.where('id').equals(id).toArray();
		prompts = results;
		return results[0];
	});
</script>

{#if prompts.length === 0}
	<h3>⬅️ Create your first prompt!</h3>
{:else if $prompt}
	<PromptEditor prompt={$prompt} />
{:else}
	<h3>Loading...</h3>
{/if}
