<script type="ts">
	export let vertical = false;
	export let fill = false;
	export let align: 'start' | 'center' | 'end' = 'start';
	export let justify: 'start' | 'around' | 'between' | 'center' | 'end' =
		'start';
</script>

<div
	class="box"
	class:vertical
	class:fill
	class:align-start={align === 'start'}
	class:align-center={align === 'center'}
	class:align-end={align === 'end'}
	class:justify-start={justify === 'start'}
	class:justify-center={justify === 'center'}
	class:justify-end={justify === 'end'}
	class:justify-around={justify === 'around'}
	class:justify-between={justify === 'between'}
>
	<slot />
</div>

<style>
	.box {
		display: flex;
		flex-direction: row;
		gap: 1rem;
		flex-grow: 1;
		flex-basis: 0;
	}

	.vertical {
		flex-direction: column;
	}

	.fill {
		width: 100%;
		height: 100%;
	}

	.justify-start {
		justify-content: start;
	}

	.justify-center {
		justify-content: center;
	}

	.justify-end {
		justify-content: end;
	}

	.justify-between {
		justify-content: space-between;
	}

	.justify-around {
		justify-content: space-around;
	}

	.align-start {
		align-items: flex-start;
	}

	.align-center {
		align-items: center;
	}

	.align-end {
		align-items: flex-end;
	}

	@media (max-width: 600px) {
		div {
			flex-direction: column;
		}
	}
</style>
