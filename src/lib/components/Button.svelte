<script lang="ts">
	export let onClick: () => void;
	export let theme: 'gray' | 'white' | 'black' = 'gray';
	export let isInline: boolean = false;
</script>

<button
	type="button"
	class={['button', theme].join(' ')}
	class:inline={isInline}
	on:click|preventDefault={onClick}
>
	<slot />
</button>

<style>
	.button {
    width: 100%;
    display: block;
		border: none;
		border-radius: 8px;
		padding: 12px 16px;
		margin: 0;
		font-size: 16px;
		font-weight: 500;
		font-family: var(--font-body);
		transition: all 0.3s ease;
		box-shadow: 0 0 0 0 transparent;
		cursor: pointer;
		background-color: var(--button-idle-bg);
		color: var(--button-idle-text);

		&:focus {
			outline: none;
		}

		&:hover {
			background-color: var(--button-hover-bg);
			color: var(--button-hover-text);
		}

		&:focus:not(:hover) {
			box-shadow: 0 0 0 2px var(--button-focus-outline);
		}
	}

	.gray {
		--button-idle-bg: var(--blue-gray-200);
		--button-idle-text: var(--blue-gray-700);
		--button-hover-bg: var(--blue-gray-300);
		--button-hover-text: var(--blue-gray-800);
		--button-focus-outline: var(--blue-gray-500);
	}

	.white {
		--button-idle-bg: var(--white);
		--button-idle-text: var(--blue-gray-600);
		--button-hover-bg: var(--white);
		--button-hover-text: var(--blue-gray-800);
		--button-focus-outline: var(--blue-gray-200);
	}

	.black {
		--button-idle-bg: var(--cool-gray-800);
		--button-idle-text: var(--blue-gray-100);
		--button-hover-bg: var(--cool-gray-900);
		--button-hover-text: var(--blue-gray-100);
		--button-focus-outline: var(--blue-gray-900);
	}

	.inline {
		padding: 0;
		display: inline-block;
		background-color: transparent;
	}
</style>
