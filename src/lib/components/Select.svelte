<script type="ts">
	export let value: string;
	export let placeholder: string | undefined = undefined;
</script>

<div class="select">
	<select bind:value on:change {...$$restProps} {placeholder}>
		<slot />
	</select>
	{#if placeholder && !value}
		<span class="placeholder">{placeholder}</span>
	{/if}
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
		position: relative;
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

	.placeholder {
		position: absolute;
		left: 0.5rem;
		color: #aaa;
		font-style: italic;
	}
</style>
