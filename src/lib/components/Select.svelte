<script type="ts">
	export let value: string;
</script>

<div class="select">
	<select bind:value on:change {...$$restProps}>
		<slot />
	</select>
	<div class="arrow" />
</div>

<style>
	.select {
		position: relative;
		display: flex;
		align-items: center;
		border: var(--border-normal);
		border-radius: var(--border-radius-normal);
		flex-grow: 1;
	}

	select {
		flex-grow: 1;
		appearance: none;
		border: none;
		background: transparent;
		color: currentColor;
		padding: var(--control-padding-normal);
	}

	.arrow {
		background-color: currentColor;
		clip-path: polygon(100% 0%, 0 0%, 50% 100%);
		height: 0.5rem;
		pointer-events: none;
		position: absolute;
		right: 0.5rem;
		width: 0.5rem;
	}
</style>
