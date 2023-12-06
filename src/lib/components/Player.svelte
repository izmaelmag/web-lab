<script lang="ts">
	import { Group, ActionIcon, Divider, NumberInput } from '@svelteuidev/core';
	import { Play, Pause, TrackPrevious, Timer } from 'radix-icons-svelte';
	import RangeSlider from './RangeSlider.svelte';

	export let currentFrame: number = 0;
	export let totalFrames: number = 0;
	export let isPlaying: boolean = false;
	export let onPlay: () => void;
	export let onPause: () => void;
	export let onReset: () => void;
	export let onChange: (frame: number) => void;
	$: currentFrame;

	const handleFrameInput = () => {
		onChange(currentFrame);
	};
</script>

<Divider label="Player" labelPosition="center" />

<div class="frameInput">
	<div class="icon">
		<Timer />
	</div>

	<div class="frameInputSlider">
		<RangeSlider
			bind:value={currentFrame}
			onChange={handleFrameInput}
			min={0}
			max={totalFrames}
			step={1}
		/>
	</div>

	<Group position="center" spacing={4} noWrap>
		<ActionIcon color="blue" size="sm" variant="outline" on:click={onReset}>
			<TrackPrevious />
		</ActionIcon>

		<ActionIcon
			color="green"
			size="sm"
			variant={isPlaying ? 'filled' : 'outline'}
			on:click={onPlay}
		>
			<Play />
		</ActionIcon>

		<ActionIcon
			color="orange"
			size="sm"
			variant={!isPlaying ? 'filled' : 'outline'}
			on:click={onPause}
		>
			<Pause />
		</ActionIcon>
	</Group>
</div>

<style>
	.frameInput {
		position: relative;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.icon {
		flex-shrink: 0;
    height: 14px;
    width: 14px;
		font-size: 0;
	}

	.frameInputSlider {
		width: calc(1px + 189px);
		height: 12px;
	}
</style>
