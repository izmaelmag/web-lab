<script lang="ts" context="module">
	export type Part = {
		text: string;
		weight: number;
	};
</script>

<script lang="ts">
	export let part: Part = { text: '', weight: 0 };
</script>

<div class="promptPart">
	<input class="input text" type="text" value={part.text} />
	<input class="input weight" type="text" min={-30} max={30} value={part.weight} />
</div>

<style>
	.promptPart {
    display: flex;
    gap: 8px;
	}

	.input {
		border: 1px solid var(--cool-gray-400);
		border-radius: 6px;
		padding: 8px 12px;
		color: var(--cool-gray-700);
		font-size: 16px;
		font-family: var(--font-body);
    box-shadow: 0 8px 20px var(--cool-gray-200);

    &:focus {
      outline: none;
      border-color: var(--cool-gray-700);
    }
	}

	.text {
		width: 420px;
	}

	.weight {
		width: 48px;
		padding-right: 12px;
		appearance: none;
	}
</style>
