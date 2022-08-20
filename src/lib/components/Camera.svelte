<script type="ts">
	import { onMount } from 'svelte';
	import Hbox from './Hbox.svelte';
	import Select from './Select.svelte';

	export let stream: MediaStream | undefined = undefined;

	let cameraId: string = '';

	onMount(function () {
		loadCameras();
	});
</script>

<Hbox>
	<Select
		bind:value={cameraId}
		placeholder="Select a camera"
		options={$cameras.map((camera) => ({
			label: camera.label,
			value: camera.deviceId
		}))}
	/>

	<button
		on:click={async () => {
			if (stream) {
				stopStream(stream);
				stream = undefined;
			} else {
				stream = await openStream(cameraId, 720, 405);
			}
		}}>{stream ? 'Stop' : 'Start'}</button
	>
</Hbox>

<style>
	button {
		width: 4rem;
	}
</style>
