<script lang="ts">
	import P5 from 'p5-svelte';
	import Sine, { defaults } from './Sine';
	import type { Params, SineProps } from './Sine';

	export let rounded = false;
	export let size = [48, 48];
	export let params: Params = defaults;
	export let sines: SineProps[] = defaults.sines;

	const sketchSize = {
		width: size[0],
		height: size[1] || size[0]
	};
</script>

<div class="container">
	<div class="visualizer" class:rounded style="width: {size[0]}px; height: {size[1] || size[0]}px">
		<P5 sketch={Sine({ ...sketchSize, ...params, sines })} />
	</div>
</div>

<style>
	.visualizer {
		position: relative;
		box-shadow: 0 4px 0px -2px rgba(0, 98, 36, 0.252), 0 5px 22px rgba(12, 128, 90, 0.51);

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

		& canvas {
			position: relative;
			z-index: 1;
			border: none;
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

		&.rounded {
			border-radius: 12px;
			overflow: hidden;

			&::before,
			&::after {
				border-radius: 11px;
			}

			& canvas {
				border-radius: 12px;
			}

			& > div {
				&::before,
				&::after {
					border-radius: 12px;
				}

				overflow: hidden;
			}
		}
	}
</style>
