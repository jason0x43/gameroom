<script type="ts">
	import { loadCameras, openStream, stopStream } from '$lib/rtc';
	import { cameras } from '$lib/stores';
	import { onMount } from 'svelte';
	import Hbox from './Hbox.svelte';
	import Select from './Select.svelte';

	export let videoSize: { width: number; height: number };
	export let stream: MediaStream | undefined;

	let cameraId: string;

	onMount(function () {
		loadCameras();
	});
</script>

<Hbox>
	<Select bind:value={cameraId}>
		{#each $cameras as camera (camera.deviceId)}
			<option value={camera.deviceId}>{camera.label}</option>
		{/each}
	</Select>

	<button
		on:click={async () => {
			if (stream) {
				stopStream(stream);
				stream = undefined;
			} else {
				stream = await openStream(cameraId, videoSize.width, videoSize.height);
			}
		}}>{stream ? 'Stop' : 'Start'}</button
	>
</Hbox>

<style>
	button {
		width: 5rem;
	}
</style>
