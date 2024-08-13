<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import Layout from '$lib/components/Layout.svelte';
</script>

<Layout>
	<Header />

	<div class="intro">
		<p>Welcome to my digital workspace.</p>

		<p>
			Join me as I explore and express through art and tech, using them together to enhance my
			creativity and bring new visions to life.
		</p>

		<p>It's a journey of learning, experimenting, and growing as an artist and technologist.</p>
	</div>

	<nav class="links">
		<a href="/playground">Playground</a>
		<a href="/about">About<i>/</i>CV</a>
	</nav>
</Layout>

<style>
	.intro {
		padding: 0;
		max-width: 800px;
		z-index: 20;

		& p {
			color: var(--cool-gray-700);
			transition: all 0.3s ease;
			font-size: 28px;
			font-weight: 100;
			text-wrap: balance;
			margin: 8px 0 8px;
			letter-spacing: -0.02em;

			@media screen and (max-width: 1400px) {
				font-size: 20px;
				max-width: 640px;
			}

			@media screen and (max-width: 480px) {
				font-size: 16px;
				max-width: 280px;
			}
		}
	}

	.links {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		margin-top: auto;
		margin-bottom: 16px;
		margin-left: -8px;
		margin-right: -8px;
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
