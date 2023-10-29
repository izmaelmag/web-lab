<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import PromptPart from '$lib/components/prompts/PromptPart.svelte';

	type Part = {
		text: string;
		weight: number;
	};

	let parts: Part[] = [{ text: '', weight: 0 }];
</script>

<Header subtitle="Midjourney prompts constructor" title="Prompster" />

{#each parts as part, index}
	<PromptPart {part} />
{/each}
