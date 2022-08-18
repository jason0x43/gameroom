<script type="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { isPeerMessage } from '$lib/types';
	import { peers } from '$lib/stores';
	import Camera from '$lib/components/Camera.svelte';
	import Video from '$lib/components/Video.svelte';

	let name: string;
	let socket: WebSocket | undefined;
	let updateTimer: ReturnType<typeof setTimeout> | undefined;
	let nameInput: HTMLInputElement | undefined;

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

	let stream: MediaStream | undefined;
</script>

<main>
	<h1>GameRoom</h1>
	<input bind:this={nameInput} bind:value={name} placeholder="Name" />
	<Camera videoSize={{ width: 400, height: 225 }} bind:stream />
	<Video {stream} size={{ width: 400, height: 225 }} />
</main>

<style>
	main {
		margin: 4rem auto;
		width: 400px;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
</style>
