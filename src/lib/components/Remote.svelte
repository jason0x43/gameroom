<script type="ts">
	import { onMount } from 'svelte';
	import Hbox from './Hbox.svelte';
	import Select from './Select.svelte';

	export let stream: MediaStream | undefined = undefined;
	export let socket: WebSocket;

	let peerSdp: string = '';

	onMount(function () {
		loadCameras();
	});
</script>

<Hbox>
	<Select
		bind:value={peerSdp}
		placeholder="Select a peer"
		options={$peers.map((peer) => ({
			label: peer.name,
			value: peer.sdp ?? ''
		}))}
	/>

	<!--
	TODO: send an answer message with this client's SDP string and the name
	of the other client as the target. This code should probably exist in an
	external module. The gist is:
	  1. This client starts a connection listener and broadcasts an offer
	  2. Another client responds with an answer to this client
	  3. This client returns its candidate connections
	  4. The other client returns its candidate connections
	See https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling#signaling_transaction_flow
	-->
	<button on:click={async () => {
		socket.send(JSON.stringify({ type: 'answer', value: {
			sdp: peerSdp,
		}}));
	}}>{stream ? 'Stop' : 'Start'}</button>
</Hbox>

<style>
	button {
		width: 4rem;
	}
</style>
