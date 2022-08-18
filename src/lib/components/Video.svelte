<script type="ts">
	export let stream: MediaStream | undefined = undefined;

	let video: HTMLVideoElement | undefined;

	$: {
		if (video && stream) {
			video.srcObject = stream;
		}
	}
</script>

<div>
	<video bind:this={video} autoplay playsinline>
		<track kind="captions" />
	</video>
</div>

<style>
	div {
		border: var(--border-normal);
		border-radius: var(--border-radius-normal);
		position: relative;
		aspect-ratio: 16 / 9;
		flex-grow: 1;
	}

	video {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}
</style>
