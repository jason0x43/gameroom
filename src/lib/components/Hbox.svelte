<script type="ts">
	export let between = false;
	export let bottom = false;
	export let middle = false;
</script>

<div class="hbox" class:between class:bottom class:middle>
	<slot />
</div>

<style>
	.hbox {
		display: flex;
		flex-direction: row;
		gap: 1rem;
		flex-grow: 1;
		flex-basis: 0;
	}

	.between {
		justify-content: space-between;
	}

	.middle {
		align-items: center;
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
