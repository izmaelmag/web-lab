<script lang="ts">
	import P5 from 'p5-svelte';
	import { Daily2, defaultParams, type Params as SketchParams } from './daily-2';
	import Layout from '$lib/components/Layout.svelte';
	import Header from '$lib/components/Header.svelte';
	import Controls from '$lib/components/Controls/Controls.svelte';
	import { controls } from './controls';
	import type { ControlsData } from '$lib/types/controls';
	import Player from '$lib/components/Player.svelte';

	let currentFrame: number;
	let isPlaying: boolean;
	let isRecording: boolean;

	const sketch = new Daily2({
		settings: {
			w: 420,
			h: 420,
			fps: 30,
			duration: 10
		},

		onTick: (settings) => {
			currentFrame = settings.currentFrame;
			isPlaying = settings.isPlaying;
			isRecording = settings.isRecording;
		},

		params: defaultParams
	});

	const handleControlsChange = (newParams: ControlsData) => {
		const params = newParams as SketchParams;
		sketch.setParams({ ...defaultParams, ...params });
	};
</script>

<Layout>
	<Header links={[{ title: 'Playground', url: '/playground' }, { title: 'Daily #2' }]} />
	<div class="playground">
		<div class="controls">
			<Player
				onSkip={() => sketch.setFrame(sketch.totalFrames)}
				onPlay={() => sketch.play()}
				onPause={() => sketch.pause()}
				onReset={() => sketch.reset()}
				onRecord={() => sketch.record()}
				onChange={(currentFrame) => sketch.setFrame(currentFrame)}
				{currentFrame}
				{isPlaying}
				{isRecording}
				totalFrames={sketch.totalFrames}
			/>
			<Controls onChange={handleControlsChange} config={controls.config} />
		</div>

		<div class="preview">
			{#if sketch}
				<P5 sketch={sketch.render} />
			{/if}
		</div>
	</div>
</Layout>

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
			border-bottom: 1px solid var(--cool-gray-300);
			padding-bottom: 8px;

			& > div {
				display: flex !important;
				align-items: center;
				justify-content: center;
			}
		}

		& canvas {
			border: 1px solid var(--cool-gray-300);

			@media screen and (max-width: 640px) {
				width: 50% !important;
				height: auto !important;
				aspect-ratio: 1 / 1;
			}
		}
	}
</style>
