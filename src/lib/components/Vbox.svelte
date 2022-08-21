<div class="vbox">
	<slot />
</div>

<style>
	.vbox {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		flex-grow: 1;
		flex-basis: 0;
	}
</style>
