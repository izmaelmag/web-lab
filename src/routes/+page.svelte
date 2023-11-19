<script lang="ts">
	import { onMount } from 'svelte';
	import P5, { type Sketch } from 'p5-svelte';
	import Circles from '$lib/sketches/Circles';

	let sketch: Sketch;

	onMount(() => {
		sketch = Circles();
	});
</script>

<div class="layout">
	<div class="header">
		<h1 class="name">IZMAEL<span />MAG</h1>
	</div>

	<p class="intro">Welcome to my digital workspace.</p>
	<p class="intro">
		Join me as I explore and express through art and tech, using them together to enhance my
		creativity and bring new visions to life.
	</p>
	<p class="intro">
		It's a journey of learning, experimenting, and growing as an artist and technologist.
	</p>

	<nav class="links">
		<a href="/gallery"><span>00</span>Gallery</a>
		<a href="/lab"><span>00</span>Experiments</a>
		<a href="/blueprint"><span>00</span>Blueprints</a>
		<a href="/about"><span>**</span>About<i>/</i>CV</a>
	</nav>

	<picture class="sketch">
		<P5 {sketch} />
	</picture>
</div>

<style>
	.layout {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		position: relative;
	}

	.intro {
		padding: 0 8px;
		margin: 8px 0 8px;
		text-wrap: balance;
		max-width: 800px;
		font-weight: 100;
		color: var(--cool-gray-700);
		font-size: 28px;
		z-index: 20;
		transition: all 0.3s ease;

		& br {
			display: block;
			border: 1px solid red;
			margin-bottom: 24px;
		}

		@media screen and (max-width: 1400px) {
			font-size: 20px;
			max-width: 640px;
		}

		@media screen and (max-width: 480px) {
			font-size: 16px;
			max-width: 280px;

			& br {
				margin-bottom: 8px;
			}
		}
	}

	.header {
		padding: 8px 8px 0;
		max-width: 800px;

		& h1 {
			font-size: 14px;
			font-weight: 600;
			display: flex;
			line-height: 1;
			justify-content: space-between;
			letter-spacing: 0.05em;
			color: var(--orange-500);
			border-top: 1px solid var(--blue-gray-600);
			border-bottom: 1px solid var(--blue-gray-600);
		}
	}

	.links {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		margin-top: auto;
		margin-bottom: 16px;
		z-index: 20;

		& a {
			font-size: 64px;
			color: var(--cool-gray-600);
			text-decoration: none;
			padding: 0 8px;
			line-height: 0.7;
			font-weight: 900;
			text-transform: uppercase;
			position: relative;
			display: flex;
			align-items: flex-end;
			border-bottom: 0.5px solid var(--cool-gray-600);
			padding-top: 12px;
			overflow: hidden;
			position: relative;
			transition: all 0.3s ease;

			@media screen and (max-width: 1400px) {
				font-size: 42px;
			}

			@media screen and (max-width: 640px) {
				font-size: 32px;
			}

			& span {
				font-weight: 500;
				margin-right: 8px;
				font-size: 12px;
				font-variant-numeric: tabular-nums;
				color: var(--orange-500);
				font-family: monospace;
				transition: all 0.3s ease;
			}

			& i {
				font-style: normal;
				color: var(--cool-gray-400);
			}

			&:hover {
				color: var(--orange-600);
				border-bottom: 0.5px solid var(--cool-gray-900);

				& span {
					margin-bottom: 12px;
				}
			}
		}
	}

	.sketch {
		position: absolute;
		right: 0px;
		top: 0px;
		width: 640px;
		height: 640px;

		@media screen and (max-width: 1400px) {
			width: 480px;
			height: 480px;
		}

		@media screen and (max-width: 640px) {
			width: 100vw;
			height: 100vw;
			top: 50%;
			right: 50%;
			transform: translateX(50%) translateY(-50%);
		}

		& > div,
		& canvas {
			width: 100% !important;
			height: 100% !important;
		}
	}
</style>
