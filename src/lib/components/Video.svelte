<script type="ts">
	export let stream: MediaStream | undefined = undefined;
	export let size: { width: number; height: number };

	let video: HTMLVideoElement | undefined;

	$: {
		if (video && stream) {
			video.srcObject = stream;
		}
	}
</script>

<video
	bind:this={video}
	autoplay
	playsinline
	style={`width:${size.width}px; height:${size.height}px`}
>
	<track kind="captions" />
</video>

<style>
	video {
		border: var(--border-normal);
		border-radius: var(--border-radius-normal);
	}
</style>
