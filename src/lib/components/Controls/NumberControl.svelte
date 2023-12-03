<script lang="ts">
	import { NumberInput } from '@svelteuidev/core';
	import type { NumberControl } from '$lib/types/controls';
	import * as Icon from 'radix-icons-svelte';
	export let onChange: (patch: Record<string, number>) => void;

	export let control: NumberControl;
	$: control;

	let value: number;
	$: value;

	const patchParam = () => {
		onChange({
			[control.key]: value
		});
	};

	// @ts-ignore
	// Required for dynamic icon selection that actually works
	const ControlIcon = control.icon ? Icon[control.icon] : Icon.RulerSquare;
</script>

<div class="rangeControl">
	<NumberInput
		bind:value
		on:input={patchParam}
		label={control.name}
		placeholder={control.placeholder}
		defaultValue={control.defaultValue}
		min={control.min}
		max={control.max}
		ste={control.step}
		stepHoldDelay={200}
		stepHoldInterval={50}
		disabled={control.disabled}
		color="orange"
		icon={ControlIcon}
		hideControls
		size="xs"
	/>

	<div class="rangeSlider">
		<input
			bind:value
			on:input={patchParam}
			type="range"
			min={control.min}
			max={control.max}
			step={control.step}
			class="range"
		/>

		<div class="rangePips" />
	</div>
</div>

<style>
	.rangeControl {
		margin-bottom: 16px;
		position: relative;
	}

	.rangeSlider {
		width: calc(1px + 189px);
		position: absolute;
		right: 10px;
		bottom: -9px;
		height: 30px;
	}

	.range {
		width: 100%;
		position: relative;
		top: -4px;
		z-index: 10;
		padding: 0;

		&[type='range'] {
			appearance: none;
			background: transparent;
		}

		&[type='range']::-webkit-slider-thumb,
		&[type='range']::-moz-range-thumb {
			-webkit-appearance: none;
			border: 1px solid var(--orange-500);
			height: 12px;
			width: 12px;
			border-radius: 3px;
			background: #ffffff;
			cursor: pointer;
		}

		&[type='range']:focus {
			outline: none;
		}

		&[type='range']::-webkit-slider-runnable-track,
		&[type='range']::-moz-range-track {
			height: 1px;
			cursor: pointer;
			background: var(--cool-gray-400);
		}
	}

	.rangePips {
		width: 100%;
		height: 5px;
		position: absolute;
		top: 4px;
		left: 2px;
		background-image: linear-gradient(
			90deg,
			var(--cool-gray-400) 0%,
			var(--cool-gray-400) 10%,
			rgba(255, 255, 255, 0) 10%
		);
		background-size: 9px 100%;
	}
</style>
