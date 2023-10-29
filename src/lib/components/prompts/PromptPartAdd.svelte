<script lang="ts">
	export let onClick: () => void;
</script>

<button class="container" on:click={onClick}>
	<div class="text">+ New part</div>
</button>

<style>
	.container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 48px;
		font-family: var(--font-body);
		font-size: 18px;
		width: 100%;
		font-weight: 600;
		color: var(--cool-gray-600);
		padding: 12px;
		border-radius: 8px;
		position: relative;
		background: var(--cool-gray-100);
		cursor: pointer;
		transition: all 0.3s;
    border: none;
    
		&:hover {
			background-color: var(--cool-gray-200);
			color: var(--cool-gray-700);
		}
	}
</style>
