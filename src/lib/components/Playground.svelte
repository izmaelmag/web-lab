<div class="playground">
	<slot name="sidebar" class="controls" />

	<div class="preview">
		<slot name="content" />
	</div>
</div>

<style>
	.playground {
		display: flex;
		align-items: stretch;
		gap: 8px;
		height: 100%;

		@media screen and (max-width: 640px) {
			flex-direction: column-reverse;
		}
	}

	.controls {
		width: 300px;
		height: 100%;
		padding-right: 8px;
		overflow: auto;
		flex-shrink: 0;

		@media screen and (max-width: 640px) {
			height: 100%;
			width: 100%;
			min-height: 0;
			flex-shrink: 1;
			padding-bottom: 80px;
		}
	}

	.preview {
		border: 1px solid var(--cool-gray-300);
		width: 100%;
		min-width: 0;
		display: flex;
		align-items: center;
		justify-content: center;

		@media screen and (max-width: 640px) {
			height: auto;
			flex-shrink: 0;
			border: none;
			padding-bottom: 8px;
			display: flex;
			align-items: center;
			justify-content: center;
			margin: auto;

			& > div {
				display: flex !important;
				align-items: center;
				justify-content: center;
			}
		}

		& canvas {
			border: 1px solid var(--cool-gray-300);

			@media screen and (max-width: 640px) {
				width: 100% !important;
				height: auto !important;
				aspect-ratio: 1 / 1;
			}
		}
	}
</style>
