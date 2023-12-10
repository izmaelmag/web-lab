<script lang="ts">
	import { writable } from 'svelte/store';
	import { Divider } from '@svelteuidev/core';
	import type { AnyControl, ControlsConfig, ControlsData } from '$lib/types/controls';
	import NumberControl from './NumberControl.svelte';
	import BooleanControl from './BooleanControl.svelte';

	export let onChange: (params: ControlsData) => void;
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
	<div class="nodes">
		{#each config.groups as groupName}
			<div class="nodeGroup">
				<div class="nodeGroupTitle">
					<Divider label={groupName} labelPosition="center" size="xs" />
				</div>

				<div class="nodeGroupControls">
					{#each groupedNodes[groupName] as control}
						{#if control.type === 'number'}
							<NumberControl onChange={handleParamPatch} {control} />
						{/if}

						{#if control.type === 'boolean'}
							<BooleanControl onChange={handleParamPatch} {control} />
						{/if}
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.controls {
		display: flex;
		flex-direction: column;
	}

	.nodeGroupControls {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.nodeGroupTitle {
		margin-bottom: 0;

		& > div {
			margin: 12px 0 0;
		}
	}
</style>
