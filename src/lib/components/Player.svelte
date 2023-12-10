<script lang="ts">
	import { Tooltip, Group, ActionIcon, Divider, NumberInput } from '@svelteuidev/core';
	import { Play, Pause, TrackPrevious, Timer, Radiobutton } from 'radix-icons-svelte';
	import RangeSlider from './RangeSlider.svelte';

	export let currentFrame: number = 0;
	export let totalFrames: number = 0;
	export let isPlaying: boolean = false;
	export let isRecording: boolean = false;
	export let onPlay: () => void;
	export let onPause: () => void;
	export let onReset: () => void;
	export let onRecord: () => void;
	export let onChange: (frame: number) => void;

	$: frameTimerText = `${currentFrame
		.toString()
		.padStart(totalFrames.toString().length, '0')}/${totalFrames}`;

	$: currentFrame;

	const handleFrameInput = () => {
		onChange(currentFrame);
	};
</script>

<div class="player">
	<Divider class="divider" label={`Player – ${frameTimerText}`} labelPosition="center" />

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
			<Tooltip label="Reset" withArrow openDelay={100}>
				<ActionIcon color="blue" size="sm" variant="outline" on:click={onReset}>
					<TrackPrevious />
				</ActionIcon>
			</Tooltip>

			<Tooltip label="Play" withArrow openDelay={100}>
				<ActionIcon
					color="green"
					size="sm"
					variant={isPlaying ? 'filled' : 'outline'}
					on:click={onPlay}
				>
					<Play />
				</ActionIcon>
			</Tooltip>

			<Tooltip label="Pause" withArrow openDelay={100}>
				<ActionIcon
					color="orange"
					size="sm"
					variant={!isPlaying ? 'filled' : 'outline'}
					on:click={onPause}
				>
					<Pause />
				</ActionIcon>
			</Tooltip>

			<Tooltip label="Record" withArrow openDelay={100}>
				<ActionIcon
					color="red"
					size="sm"
					variant={isRecording ? 'filled' : 'outline'}
					on:click={onRecord}
				>
					<Radiobutton />
				</ActionIcon>
			</Tooltip>
		</Group>
	</div>
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

	.player {
		--svelteui-fonts-standard: 'Azareth Mono', monospace;
		--svelteui-fontSizes-xs: 10px;
	}
</style>