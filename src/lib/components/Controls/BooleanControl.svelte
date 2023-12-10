<script lang="ts">
	import type { BooleanControl } from '$lib/types/controls';
	import { Switch } from '@svelteuidev/core';

	export let onChange: (patch: Record<string, boolean>) => void;

	export let control: BooleanControl;
	$: control;

	let value: boolean = control.defaultValue;
	$: value;

	const patchParam = () => {
		value = !value;

		onChange({
			[control.key]: value
		});
	};
</script>

<Switch
	size="sm"
	onLabel="On"
	offLabel="Off"
	checked={value}
	on:change={patchParam}
	label={control.description}
/>
