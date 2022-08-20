<script type="ts">
	export let between = false;
	export let bottom = false;
</script>

<div class:between class:bottom>
	<slot />
</div>

<style>
	div {
		display: flex;
		flex-direction: row;
		gap: 1rem;
		flex-grow: 1;
		flex-basis: 0;
	}

	.between {
		justify-content: space-between;
	}

	.bottom {
		align-items: flex-end;
	}

	@media (max-width: 600px) {
		div {
			flex-direction: column;
		}
	}
</style>
