<script type="ts">
	import { onMount } from 'svelte';
	import Video from '$lib/components/Video.svelte';
	import Box from '$lib/components/Box.svelte';
	import Select from '$lib/components/Select.svelte';
	import { WebRTCClient } from '$lib/rtc';
	import type { Offer, Peer } from '$lib/types';
	import type { PageData } from './$types';

	export let data: PageData;

	const user = data.user;

	let peer = '';
	let peers: Peer[] = [];
	let localStream: MediaStream | undefined;
	let connectedPeers: {
		[peerId: string]: { stream: MediaStream; name: string };
	} = {};
	let client: WebRTCClient;
	let status = 'disconnected';
	let offer: Offer | undefined;
	let accepted: Offer | undefined;

	function getPeerName(offer: Offer) {
		const p = peers.find((peer) => peer.id === offer.source);
		return p?.name ?? offer.source;
	}

	onMount(function () {
		client = new WebRTCClient(user.id);

		client.on('connected', () => {
			status = 'connected';
		});

		client.on('disconnected', () => {
			status = 'disconnected';
		});

		client.on('peerconnected', ({ stream, peer }) => {
			connectedPeers = {
				...connectedPeers,
				[peer.id]: { stream, name: peer.name ?? peer.id }
			};
		});

		client.on('peeradded', (peer) => {
			peers = [...peers, peer];
		});

		client.on('peerupdated', (peer) => {
			if (connectedPeers[peer.id]) {
				connectedPeers = {
					...connectedPeers,
					[peer.id]: { ...connectedPeers[peer.id], name: peer.name ?? peer.id }
				};
			}
		});

		client.on('peerremoved', (peer) => {
			const index = peers.findIndex(({ id }) => id === peer.id);
			if (index > -1) {
				peers = [...peers.slice(0, index), ...peers.slice(index + 1)];
			}
		});

		client.on('offer', (ofr) => {
			offer = ofr;
		});

		return () => {
			client.close();
		};
	});
</script>

<main>
	<Box vertical>
		<Video name={user.username} stream={localStream} />
		<Box>
			<Select
				bind:value={peer}
				placeholder="Select a friend"
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
		</Box>
		<Box>
			<Box vertical>
				{#each Object.values(connectedPeers) as { stream, name }}
					<Video {name} {stream} />
				{/each}
			</Box>
		</Box>
	</Box>
	<Box justify="between">
		<p class="dim">Client ID: {client?.id}</p>
		<span class="status" class:connected={status === 'connected'}>{status}</span
		>
	</Box>
</main>

{#if offer && accepted !== offer}
	<div class="modal">
		<div class="modal-content">
			<Box vertical>
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
			</Box>
		</div>
	</div>
{/if}

<style>
	main {
		margin: 0 auto;
		max-width: 400px;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.dim {
		color: #aaa;
	}

	.status {
		font-style: italic;
		color: #a00;
		/* to account for italic slant */
		padding-right: 0.25em;
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
</style>
