<script type="ts">
	export let stream: MediaStream | undefined = undefined;
	export let name: string = 'unknown';

	let video: HTMLVideoElement | undefined;

	$: {
		if (video && stream) {
			video.srcObject = stream;
		}
	}
</script>

<figure>
	<!-- Adding a caption track causes video streams to be solid black on iOS -->
	<!-- svelte-ignore a11y-media-has-caption -->
	<video bind:this={video} autoplay playsinline />
	<figcaption class="video-name">{name}</figcaption>
</figure>

<style>
	figure {
		border: var(--border-normal);
		border-radius: var(--border-radius-normal);
		position: relative;
		aspect-ratio: 16 / 9;
		flex-grow: 1;
		flex-shrink: 0;
		overflow: hidden;
		isolation: isolate;
	}

	video {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.video-name {
		color: white;
		position: absolute;
		border: none;
		background: rgba(0, 0, 0, 0.25);
		padding: 2px 6px 3px 6px;
		bottom: -1px;
		right: -1px;
		border-top-left-radius: var(--border-radius-normal);
	}
</style>
