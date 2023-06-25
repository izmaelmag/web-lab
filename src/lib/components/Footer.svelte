<footer>
	<div>
		Contact&nbsp;me:&nbsp;<a href="mailto:izmaelmag@pm.me">izmaelmag@pm.me</a>
	</div>
</footer>

<style>
	footer {
		width: 100%;
		padding: 16px 16px 32px;
		margin-top: auto;
		display: flex;
		justify-content: center;
		align-items: baseline;
		gap: 24px;
		flex-shrink: 0;
		font-size: 24px;
		font-family: var(--font-heading);
		color: var(--neutral-9);

		@media (max-width: 480px) {
			font-size: 20px;
		}
	}

	footer a,
	footer a:visited {
		text-decoration: none;
		color: var(--orange-5);
		transition: color 0.6s ease;
	}

	footer a:hover {
		color: var(--orange-8);
		transition: color 0s linear;
	}
</style>
