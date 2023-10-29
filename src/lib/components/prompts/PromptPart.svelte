<script lang="ts" context="module">
</script>

<script lang="ts">
	import type { PromptPart } from '$lib/stores/prompts';

	export let part: PromptPart;
	export let onChange: (part: PromptPart) => void;
	export let onDelete: () => void;

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
</script>

<div class="promptPart">
	<input on:input={handleTextChange} class="input text" type="text" value={pp.text} />

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

	<button class="delete" />
</div>

<style>
	.delete {
		position: absolute;
		border: none;
		top: 0;
		right: calc(-32px - 8px);
		width: 32px;
		height: 32px;
		border-radius: 6px;
		background-color: var(--white);
		border: 2px solid var(--rose-100);
		transition: all 0.3s;
		cursor: pointer;
		opacity: 0;
		transform: translateX(-16px);
		z-index: 2;

		&:hover {
			border-color: var(--rose-300);
		}
	}

	.promptPart {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		width: 100%;
		gap: 8px;
		padding: 6px;
		border-radius: 6px;
		background-color: var(--cool-gray-50);
		border: 2px solid var(--cool-gray-100);
		transition: border-color 0.3s;

		&:hover {
			& .delete {
				transform: translateX(0);
				opacity: 1;

				&::after {
					content: '';
					display: block;
					position: absolute;
					top: -30%;
					right: -30%;
					width: 160%;
					height: 160%;
					z-index: 1;
				}
			}
		}
	}

	.promptPart:focus-within {
		border-color: var(--cool-gray-200);
	}

	.input {
		background-color: var(--white);
		border: 0;
		border-radius: 3px;
		padding: 8px 12px;
		color: var(--cool-gray-700);
		font-size: 16px;
		font-family: var(--font-body);
		box-shadow: 0 0 0 1px var(--cool-gray-200);
		transition: box-shadow 0.3s;

		&:focus {
			outline: none;
			box-shadow: 0 0 0 1px var(--amber-500);
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
			height: 20px;
			width: 20px;
			transform: translateY(calc(-50% + 2px));
			background: var(--rose-500);
			border-radius: 24px;
			border: 3px solid var(--white);
			appearance: none;
			transition: background-color 0.3s;
		}

		&:focus::-webkit-slider-thumb {
			background: var(--rose-500);
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
</style>
