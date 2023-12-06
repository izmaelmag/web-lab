<script lang="ts">
	export let value: number = 0;
	export let min: number = 0;
	export let max: number = 100;
	export let step: number = 1;
	export let onChange: () => void;

	$: value;
</script>

<div class="container">
	<input type="range" bind:value on:input={onChange} {min} {max} {step} class="range" />
	<div class="rangePips" />
</div>

<style>
	.container {
		position: relative;
		width: 100%;
	}

	.range {
		width: 100%;
		position: relative;
		top: -4px;
		z-index: 10;
		padding: 0;
	}

	input[type='range'] {
		appearance: none;
		background: transparent;
	}

	input[type='range']::-webkit-slider-thumb,
	input[type='range']::-moz-range-thumb {
		-webkit-appearance: none;
		border: 1px solid var(--orange-500);
		height: 12px;
		width: 12px;
		border-radius: 3px;
		background: #ffffff;
		cursor: pointer;
	}

	input[type='range']:focus {
		outline: none;
	}

	input[type='range']::-webkit-slider-runnable-track,
	input[type='range']::-moz-range-track {
		height: 1px;
		cursor: pointer;
		background: var(--cool-gray-400);
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
