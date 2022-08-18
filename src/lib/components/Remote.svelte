<script type="ts">
	import { loadCameras, openStream, stopStream } from '$lib/rtc';
	import { peers } from '$lib/stores';
	import { onMount } from 'svelte';
	import Hbox from './Hbox.svelte';
	import Select from './Select.svelte';

	export let stream: MediaStream | undefined;

	let peerSdp: string;

	onMount(function () {
		loadCameras();
	});
</script>

<Hbox>
	<Select bind:value={peerSdp} placeholder="Select a peer">
		{#each $peers as peer (peer.sdp)}
			<option value={peer.sdp}>{peer.name}</option>
		{/each}
	</Select>

	<button
		on:click={async () => {
		}}>{stream ? 'Stop' : 'Start'}</button
	>
</Hbox>

<style>
	button {
		width: 4rem;
	}
</style>
