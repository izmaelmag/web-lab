<script lang="ts">
	import { writable } from 'svelte/store';
	import type { AnyControl, ControlsConfig, ControlsData } from '$lib/types/controls';
	import NumberControl from './NumberControl.svelte';

	export let onChange: (params: ControlsData) => void;
	export let title: string = 'Controls';
	export let config: ControlsConfig;

	const paramsState = writable(config.defaults);

	paramsState.subscribe((newState) => {
		onChange(newState);
	});

	const groupedNodes: Record<string, AnyControl[]> = config.groups.reduce((result, group) => {
		return {
			...result,
			[group]: Object.values(config.nodes).filter((node) => node.group === group)
		};
	}, {});

	const handleParamPatch = (patch: ControlsData) => {
		paramsState.update((state) => ({
			...state,
			...patch
		}));
	};
</script>

<div class="controls">
	<h2>{title}</h2>

	<div class="nodes">
		{#each config.groups as groupName}
			{#each groupedNodes[groupName] as control}
				{#if control.type === 'number'}
					<NumberControl onChange={handleParamPatch} {control} />
				{/if}
			{/each}
		{/each}
	</div>
</div>

<style>
	.controls {
		display: flex;
		flex-direction: column;
	}

	h2 {
		font-size: 18px;
		font-weight: 600;
		margin-bottom: 8px;
	}
</style>
