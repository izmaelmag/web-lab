<script lang="ts">
	import P5, { type Sketch } from 'p5-svelte';
	import Sine from '$lib/sketches/Sine';

	export let amplitude = 1;
	export let frequency = 1;
	export let phase = 1;
	export let scale = 1;
</script>

<div class="container">
	<div class="visualizer">
		<P5 sketch={Sine({ amplitude, frequency, phase, scale })} />
	</div>
</div>

<style>
	.container {
		/* padding: 6px;
		border: 0.5px solid var(--blue-gray-400);
		background-color: var(--blue-gray-200);
		box-shadow: 4px 4px 0 color-mix(in srgb, var(--blue-gray-900) 6%, transparent); */
	}

	.visualizer {
		position: relative;
		overflow: hidden;
		border-radius: 50%;
		box-shadow: 0 5px 22px rgba(12, 128, 90, 0.51), 0 1px 3px 1px rgba(4, 125, 153, 0.68);

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
			border-radius: 50%;
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
				border-radius: 50%;
				background: linear-gradient(to bottom, #00ffb3 0%, rgba(255 255 255 / 0%) 50%);
				mask-image: radial-gradient(
					ellipse at 50% 50%,
					rgb(255 255 255 / 0%) 0%,
					rgba(255 255 255 / 100%) 100%
				);
				z-index: 10;
				opacity: 0.7;
			}

			&::after {
				content: '';
				display: block;
				position: absolute;
				width: 100%;
				height: 100%;
				top: 0;
				left: 0;
				border-radius: 50%;
				box-shadow: 0 -9px 12px 2px rgb(29, 71, 109) inset;
				z-index: 20;
				opacity: 0.7;
			}
		}

		& canvas {
			position: relative;
			z-index: 1;
			border: none;
			border-radius: 50%;
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
			border-radius: 50%;
		}
	}
</style>
