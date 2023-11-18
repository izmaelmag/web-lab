<div class="layout">
	<div class="header">
		<h1 class="name">IZMAEL<span />MAG</h1>
	</div>

	<nav class="links">
		<a href="/"><span>09</span>Gallery</a>
		<a href="/"><span>11</span>Experiments</a>
		<a href="/"><span>03</span>Blueprints</a>
		<a href="/"><span>**</span>About</a>
	</nav>
</div>

<style>
	.layout {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.header {
		padding: 8px;

		& h1 {
			font-size: 14px;
			font-weight: 750;
			display: flex;
			line-height: 1;
			justify-content: space-between;
			letter-spacing: 0.05em;
			color: var(--cool-gray-600);
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

		& a {
			font-size: 32px;
			color: var(--cool-gray-600);
			text-decoration: none;
			padding: 0 8px;
			line-height: 0.7;
			font-weight: 900;
			text-transform: uppercase;
			position: relative;
			display: flex;
			align-items: flex-start;
			border-bottom: 0.5px solid var(--cool-gray-600);
			padding-top: 12px;
			overflow: hidden;
			position: relative;
			transition: all 0.3s ease;

			& span {
				font-weight: 500;
				margin-right: 8px;
				font-size: 12px;
        margin-top: 4px;
				color: var(--amber-500);
			}

			&::before,
			&::after {
				content: '';
				display: block;
				position: absolute;
				bottom: 0;
				right: 0;
				width: 150px;
				height: 24px;
				background: url(/corner.svg) no-repeat right bottom;
				background-size: auto 8px;
				transform: translateX(8px);
        transition: all .3s ease;
			}

      &::before {
        transform: rotateY(180deg) translateX(28px);
        right: auto;
        left: 0;
      }

			&:hover {
				color: var(--cool-gray-900);
				border-bottom: 0.5px solid var(--cool-gray-900);

				&::after {
					transform: translateX(0);
				}
			}
		}
	}
</style>
