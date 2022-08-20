<script type="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import Video from '$lib/components/Video.svelte';
	import Hbox from '$lib/components/Hbox.svelte';
	import Vbox from '$lib/components/Vbox.svelte';
	import Select from '$lib/components/Select.svelte';
	import { WebRTCClient } from '$lib/rtc';
	import { browser } from '$app/env';
	import type { Offer, Peer } from '$lib/types';

	let name: string;
	let peer: string = '';
	let peers: Peer[] = [];
	let updateTimer: ReturnType<typeof setTimeout> | undefined;
	let localStream: MediaStream | undefined;
	let remoteStream: MediaStream | undefined;
	let client: WebRTCClient;
	let status = 'disconnected';
	let offer: Offer | undefined;
	let accepted: Offer | undefined;

	$: {
		if (browser) {
			clearTimeout(updateTimer);
			updateTimer = setTimeout(function () {
				client.name = name;
				localStorage.setItem('gameroom:name', name ?? '');
			}, 1000);
		}
	}

	function getPeerName(offer: Offer) {
		const p = peers.find((peer) => peer.id === offer.source);
		return p?.name ?? offer.source;
	}

	onMount(function () {
		client = new WebRTCClient();

		client.on('connected', () => {
			status = 'connected';
		});

		client.on('disconnected', () => {
			status = 'disconnected';
		});

		client.on('streamopened', (stream) => {
			remoteStream = stream;
		});

		client.on('peerschanged', () => {
			peers = client.peers;
		});

		client.on('offer', (ofr) => {
			offer = ofr;
		});

		const playerName = localStorage.getItem('gameroom:name');
		if (playerName) {
			name = playerName;
		}

		return () => {
			client.close();
		};
	});
</script>

<header>
	<Hbox between>
		<h1>GameRoom</h1>
	</Hbox>
</header>

<main>
	<Vbox>
		<Hbox>
			<input bind:value={name} placeholder="Your name" />
			<Select
				bind:value={peer}
				placeholder="Select a peer"
				options={peers.map((peer) => ({
					label: peer.name,
					value: peer.id
				}))}
			/>
			<button
				on:click={async () => {
					localStream = await client.openStream();
					client?.invite(peer);
				}}
				disabled={!peer}>Connect</button
			>
		</Hbox>
		<Hbox>
			<Vbox>
				<Video stream={localStream} />
			</Vbox>
			<Vbox>
				<Video stream={remoteStream} />
			</Vbox>
		</Hbox>
	</Vbox>
</main>

<footer>
	<Hbox between>
		<p>Client ID: {client?.id}</p>
		<span class="status" class:connected={status === 'connected'}>{status}</span>
	</Hbox>
</footer>

{#if offer && accepted !== offer}
	<div class="modal">
		<div class="modal-content">
			<Vbox>
				<p>Invite from {getPeerName(offer)}</p>
				<button
					on:click={async () => {
						if (offer) {
							localStream = await client.openStream();
							client.accept(offer);
							accepted = offer;
						}
					}}>Accept</button
				>
			</Vbox>
		</div>
	</div>
{/if}

<style>
	main,
	header,
	footer {
		margin: 0 auto;
		padding: 0 1rem;
		max-width: 600px;
	}

	header {
		margin-top: 4rem;
	}

	main {
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	footer {
		color: #aaa;
	}

	.status {
		font-style: italic;
		color: #a00;
	}

	.connected {
		color: #0a0;
	}

	.modal {
		position: absolute;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.modal-content {
		background: white;
		padding: 1rem;
	}

	@media (max-width: 600px) {
		header {
			margin-top: 1rem;
		}
	}
</style>
