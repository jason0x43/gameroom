<script type="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { isPeerMessage } from '$lib/types';
	import { peers } from '$lib/stores';
	import Camera from '$lib/components/Camera.svelte';
	import Video from '$lib/components/Video.svelte';
	import Hbox from '$lib/components/Hbox.svelte';
	import Vbox from '$lib/components/Vbox.svelte';
	import Remote from '$lib/components/Remote.svelte';

	let name: string;
	let socket: WebSocket | undefined;
	let updateTimer: ReturnType<typeof setTimeout> | undefined;
	let nameInput: HTMLInputElement | undefined;
	let localStream: MediaStream | undefined;
	let remoteStream: MediaStream | undefined;

	$: {
		clearTimeout(updateTimer);
		updateTimer = setTimeout(function () {
			socket?.send(JSON.stringify({ type: 'name', value: name }));
			nameInput?.blur();
		}, 1000);
	}

	onMount(function () {
		const loc = `ws://${window.location.host}/ss`;
		const ws = new WebSocket(loc);

		ws.onopen = function () {
			socket = ws;
		};

		ws.onmessage = function (event) {
			const msg = JSON.parse(event.data);
			if (isPeerMessage(msg)) {
				$peers = [...$peers, msg.value];
			}
		};

		ws.onerror = function (error) {
			console.warn('socket error:', error);
		};

		ws.onclose = function () {
			socket = undefined;
		};

		return () => {
			ws.close();
		};
	});
</script>

<main>
	<h1>GameRoom</h1>
	<Vbox>
		<Hbox>
			<input bind:this={nameInput} bind:value={name} placeholder="Name" />
		</Hbox>
		<Hbox>
			<Vbox>
				<Camera bind:stream={localStream} />
				<Video stream={localStream} />
			</Vbox>
			<Vbox>
				<Remote bind:stream={remoteStream} />
				<Video stream={remoteStream} />
			</Vbox>
		</Hbox>
	</Vbox>
</main>

<style>
	main {
		margin: 4rem auto;
		max-width: 600px;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>
