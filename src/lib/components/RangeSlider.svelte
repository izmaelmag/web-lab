<script lang="ts">
	export let value: number = 0;
	export let min: number = 0;
	export let max: number = 100;
	export let step: number = 1;
	export let onChange: (newValue: number) => void;

	$: value;
	$: pipsCount = Math.min(20, Math.max(2, max - min + 1));
	$: pipsArray = Array.from({ length: pipsCount }, (_, i) => i);
	$: pipStep = (max - min) / (pipsCount - 1);
</script>

<div class="container">
	<input type="range" bind:value on:input={() => onChange(value)} {min} {max} {step} class="range" />

	<div class="rangePips">
		{#each pipsArray as pip}
			<div class="pip" style="left: calc({pip / (pipsCount - 1)} * 100%)"></div>
		{/each}
	</div>
</div>

<style>
	.container {
		position: relative;
		width: 100%;
		height: 100%;
		max-height: 32px;
	}

	.range {
		width: 100%;
		height: 100%;
		position: relative;
		z-index: 10;
		margin: 0;
		padding: 0;
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
		margin-top: 10px;
	}

	input[type='range']:focus {
		outline: none;
	}

	input[type='range']::-webkit-slider-runnable-track,
	input[type='range']::-moz-range-track {
		width: 100%;
		height: 100%;
		cursor: pointer;
		background: var(--cool-gray-400);
	}

	.rangePips {
		width: 100%;
		height: 100%;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
	}

	.pip {
		position: absolute;
		top: calc(50% - 3px);
		width: 1px;
		height: 7px;
		background-color: var(--cool-gray-400);
	}

	/* Middle line */
	.rangePips::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		height: 1px;
		background-color: var(--cool-gray-400);
		z-index: 1;
	}
</style>
