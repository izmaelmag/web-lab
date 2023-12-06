<script lang="ts">
	import P5 from 'p5-svelte';
	import { Spirograph, defaultParams, type Params as SketchParams } from './spirograph';
	import Layout from '$lib/components/Layout.svelte';
	import Header from '$lib/components/Header.svelte';
	import Controls from '$lib/components/Controls/Controls.svelte';
	import { controls } from './controls';
	import type { ControlsData } from '$lib/types/controls';
	import Player from '$lib/components/Player.svelte';

	let currentFrame: number;
	let isPlaying: boolean;

	const spirograph = new Spirograph({
		settings: {
			w: 480,
			h: 480,
			fps: 60,
			duration: 10
		},

		onTick: (settings) => {
			currentFrame = settings.currentFrame;
			isPlaying = settings.isPlaying;
		},

		params: defaultParams
	});

	const handleControlsChange = (newParams: ControlsData) => {
		const params = newParams as SketchParams;
		spirograph.setParams(params);
	};
</script>

<Layout>
	<Header links={[{ title: 'Playground', url: '/playground' }, { title: 'Spirograph' }]} />
	<div class="playground">
		<div class="controls">
			<Player
				onPlay={() => spirograph.play()}
				onPause={() => spirograph.pause()}
				onReset={() => spirograph.reset()}
				onChange={(currentFrame) => spirograph.setFrame(currentFrame)}
				{currentFrame}
				{isPlaying}
				totalFrames={spirograph.totalFrames}
			/>
			<Controls onChange={handleControlsChange} config={controls.config} />
		</div>

		<div class="preview">
			{#if spirograph}
				<P5 sketch={spirograph.render} />
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
	}

	.controls {
		width: 300px;
		height: 100%;
		padding-right: 8px;
		overflow: auto;
		flex-shrink: 0;
	}

	.preview {
		border: 1px solid var(--cool-gray-300);
		width: 100%;
		min-width: 0;
		display: flex;
		align-items: center;
		justify-content: center;

		& canvas {
			border: 1px solid var(--cool-gray-300);
		}
	}
</style>
