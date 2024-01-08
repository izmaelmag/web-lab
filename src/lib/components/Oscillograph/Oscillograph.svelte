<script lang="ts">
	import P5 from 'p5-svelte';
	import Sine, { defaults } from './Sine';
	import type { Params, SineProps } from './Sine';
	import { onMount } from 'svelte';

	export let rounded = false;
	export let size = [48, 48];
	export let params: Params = defaults;
	export let sines: SineProps[] = defaults.sines;

	const sketchSize = {
		width: size[0],
		height: size[1] || size[0]
	};

	let audioContext: AudioContext;
	let source: AudioBufferSourceNode;

	onMount(() => {
		audioContext = new window.AudioContext();
		const sampleRate = audioContext.sampleRate;
		const duration = 8;
		const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);

		let data = buffer.getChannelData(0);

		// Get frequencies array
		const frequencies = sines
			.map((sine) => [(sine.frequency || 1) * 220])
			.flat(); // Example frequencies in Hz

		// Sum frequencies
		for (let i = 0; i < data.length; i++) {
			let sample = 0;
			let rate = i / data.length;
			frequencies.forEach((frequency) => {
				sample += Math.sin(rate * Math.PI * frequency + (2 * Math.PI * frequency * i) / sampleRate);
			});
			data[i] = sample / frequencies.length;
		}

		// Create a buffer source node
		source = audioContext.createBufferSource();
		source.buffer = buffer;

		// Connect to the destination and play
		source.connect(audioContext.destination);
	});

	const handlePlay = () => {
		if (source) {
			source.start();
		}
	};
</script>

<div class="oscillograph" class:rounded style="width: {size[0]}px; height: {size[1] || size[0]}px">
	<P5 sketch={Sine({ ...sketchSize, ...params, sines })} />
</div>
<button class="button" on:click={handlePlay}>Play</button>

<style>
	.oscillograph {
		position: relative;
		box-shadow: 0 6px 0px -2px rgba(0, 0, 36, 0.12);

		background: #000;

		&::before {
			content: '';
			display: block;
			width: calc(100% - 2px);
			height: calc(100% - 2px);
			position: absolute;
			top: 1px;
			left: 1px;
			box-shadow: 0 0 0 1px #a9ff9e inset;
			mask-image: linear-gradient(to bottom, rgb(255 255 255 / 60%), rgba(255 255 255 / 10%));
			z-index: 10;
		}

		& > div {
			line-height: 0;
			position: relative;
			z-index: 1;

			&::before {
				content: '';
				display: block;
				position: absolute;
				width: calc(100% - 8px);
				height: calc(100% - 8px);
				top: 4px;
				left: 4px;
				background: linear-gradient(to bottom, #00ffb3 0%, rgba(255 255 255 / 0%) 25%);
				mask-image: radial-gradient(
					ellipse at 50% 50%,
					rgb(255 255 255 / 0%) 0%,
					rgba(255 255 255 / 100%) 100%
				);
				box-shadow: 0 -20px 12px 4px rgba(0 0 0 / 100%) inset;
				z-index: 10;
				opacity: 0.4;
			}

			&::after {
				content: '';
				display: block;
				position: absolute;
				width: 100%;
				height: 100%;
				top: 0;
				left: 0;
				box-shadow: 0 -9px 12px 2px rgb(0, 0, 0) inset;
				z-index: 20;
				opacity: 0.7;
			}
		}

		&::after {
			content: '';
			display: block;
			z-index: 10;
			width: 100%;
			height: 100%;
			position: absolute;
			bottom: 0;
			left: 0;
			background: radial-gradient(ellipse at bottom, #00ffb3 0%, rgba(255 255 255 /0%) 70%);
			background-position: center 120%;
			opacity: 0.3;
		}

		& canvas {
			position: relative;
			z-index: 1;
			border: none;
		}

		&.rounded {
			border-radius: 12px;
			overflow: hidden;

			&::before,
			&::after {
				border-radius: 11px;
			}

			& > div {
				border-radius: 8px;
				overflow: hidden;

				& canvas {
					border-radius: 12px;
					overflow: hidden;
				}

				&::before,
				&::after {
					border-radius: 8px;
				}
			}
		}
	}

	.button {
		z-index: 100;
	}
</style>
