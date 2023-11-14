<script lang="ts" context="module">
</script>

<script lang="ts">
	import type { PromptPart } from '$lib/database/prompts';

	export let part: PromptPart;
	export let onChange: (part: PromptPart) => void;
	export let onDelete: (id: PromptPart['id']) => void;

	$: pp = part;

	const handleTextChange = (e: Event) => {
		const target = e.target as HTMLInputElement;
		pp.text = target.value.trim();

		onChange(pp);
	};

	const handleWeightChange = (e: Event) => {
		const target = e.target as HTMLInputElement;
		pp.weight = Number(target.value.trim());

		onChange(pp);
	};

	const handleDelete = () => {
		onDelete(pp.id);
	};
</script>

<div class="promptPart">
	<div class="fieldContainer">
		<input on:input={handleTextChange} class="input text" type="text" value={pp.text} />
		<button class="delete" on:click={handleDelete}>❌</button>
	</div>

	<div class="rangeContainer">
		<input
			on:input={handleWeightChange}
			class="weight"
			type="range"
			min={-30}
			max={30}
			value={pp.weight}
			class:number-positive={pp.weight >= 0}
		/>

		<div class="rangeNumber" class:number-positive={pp.weight >= 0}>
			{pp.weight}
		</div>
	</div>
</div>

<style>
	.delete {
		padding: 0;
		width: 32px;
		height: 32px;
		flex-shrink: 0;
		border-radius: 6px;
		background-color: var(--white);
		border: 2px solid var(--rose-100);
		transition: all 0.3s;
		font-size: 14px;
		cursor: pointer;

		&:focus,
		&:hover {
			outline: none;
			border-color: var(--rose-400);
		}
	}

	.promptPart {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		width: 100%;
		gap: 8px;
		padding: 8px;
		border-radius: 6px;
		background-color: var(--blue-gray-100);
	}

	.promptPart:focus-within {
		border-color: var(--cool-gray-200);
	}

	.input {
		background-color: var(--white);
		width: 100%;
		border: none;
		border-radius: 6px;
		padding: 12px 16px;
		color: var(--blue-gray-700);
		font-size: 16px;
		font-family: var(--font-body);
		box-shadow: 0 0 0 1px var(--blue-gray-200) inset;
		transition: box-shadow 0.3s;

		&:focus {
			outline: none;
			box-shadow: 0 0 0 1px var(--amber-400) inset;
		}
	}

	.text {
		width: 100%;
	}

	.weight {
		width: 100%;
		flex: 1 1;
		min-width: 0;
	}

	input[type='range'] {
		appearance: none;
		cursor: pointer;

		&::-ms-track {
			width: 100%;

			/* Hides the slider so custom styles can be added */
			background: transparent;
			border-color: transparent;
			color: transparent;
		}

		&:focus {
			outline: none;
		}

		&::-webkit-slider-thumb {
			height: 16px;
			width: 16px;
			transform: translateY(calc(-50% + 2px)) scale(1);
			background: var(--rose-500);
			border-radius: 50%;
			appearance: none;
			transition: all 0.3s;
		}

		&:focus::-webkit-slider-thumb {
			transform: translateY(calc(-50% + 2px)) scale(1.3);
		}

		&::-webkit-slider-runnable-track {
			width: 100%;
			height: 4px;
			border-radius: 4px;
			background: linear-gradient(
				to right,
				var(--rose-300) 0%,
				var(--rose-300) 50%,
				var(--lime-300) 50%,
				var(--lime-300) 100%
			);
		}

		&.number-positive::-webkit-slider-thumb {
			background: var(--lime-600);
		}
	}

	.rangeContainer {
		width: 100%;
		display: flex;
		align-items: center;
	}

	.rangeNumber {
		flex-shrink: 0;
		min-width: 0;
		width: 24px;
		margin-left: 8px;
		font-weight: 500;
		color: var(--amber-500);
		font-family: var(--font-body);
		font-variant-numeric: tabular-nums;
		text-align: right;
		color: var(--rose-500);
		transition: color 0.3s;
		font-size: 14px;

		&.number-positive {
			color: var(--lime-600);
		}
	}

	.fieldContainer {
		width: 100%;
		display: flex;
		gap: 8px;
	}
</style>
