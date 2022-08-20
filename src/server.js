import url from 'url';
import { WebSocketServer } from 'ws';

/**
 * This is the signal server used to manage connections between peers.
 *
 * @typedef {import('http').Server} HttpServer
 * @typedef {import('ws').WebSocket} WebSocket
 * @typedef {import('./lib/types').Peer} Peer
 * @typedef {import('./lib/types').Message} Message
 * @typedef {import('./lib/types').PeerMessage} PeerMessage
 * @typedef {import('./lib/types').OfferMessage} OfferMessage
 */

/**
 * @param {HttpServer} httpServer
 * @param {string} path
 */
export function createSignalServer(httpServer, path) {
	const server = new WebSocketServer({ noServer: true });
	/**
	 * A map of sockets to peer info.
	 *
	 * @type {Map<WebSocket, Peer>}
	 */
	const connections = new Map();

	/**
	 * Get the connection for a given peer ID.
	 *
	 * @param {string} peerId
	 */
	function getConnection(peerId) {
		for (const entry of connections.entries()) {
			if (entry[1].id === peerId) {
				return entry[0];
			}
		}
	}

	/**
	 * Notify a client of a peer update.
	 *
	 * @param {WebSocket} socket - client socket
	 * @param {Peer} client
	 * @param {Peer} peer
	 */
	function notifyClient(socket, client, peer) {
		console.log(`Telling ${client.name} about peer ${peer.name}`);
		socket.send(
			JSON.stringify({
				type: 'peer',
				data: peer
			})
		);
	}

	/**
	 * Handle an incoming message.
	 *
	 * @param {Message} msg
	 * @param {WebSocket} socket
	 */
	function handleMessage(msg, socket) {
		console.log(`Received [${msg.type}]`);
		console.log(`${connections.size} active peers`);

		switch (msg.type) {
			case 'peer':
				if (!connections.has(socket)) {
					// This is a new client -- tell them about any existing peers
					for (const peer of connections.values()) {
						notifyClient(socket, msg.data, peer);
					}
				}

				// Store / update the connection's peer data
				connections.set(socket, msg.data);

				// Announce the new/updated peer
				for (const [conn, peer] of connections.entries()) {
					if (conn !== socket) {
						notifyClient(conn, peer, msg.data);
					}
				}
				break;

			case 'offer':
				// Notify the offer target about the offer
				getConnection(msg.data.target)?.send(JSON.stringify(msg));
				break;

			case 'answer':
				// Notify the offeror that an offer was accepted
				getConnection(msg.data.source)?.send(JSON.stringify(msg));
				break;

			case 'candidate': {
				// Notify one end of a connection of a candidate
				getConnection(msg.data.target)?.send(JSON.stringify(msg));
				break;
			}
		}
	}

	httpServer.on('upgrade', function (request, socket, head) {
		const { url } = request;
		if (url === path) {
			server.handleUpgrade(request, socket, head, function (ws) {
				server.emit('connection', ws);
			});
		}
	});

	server.on('connection', (socket) => {
		console.log('Client connected');

		// Handle an incoming message from the client
		socket.on('message', (message) => {
			try {
				handleMessage(JSON.parse(`${message}`), socket);
			} catch (error) {
				console.warn(`Error parsing message: ${error}`);
			}
		});

		// When the client connection closes, remove the client's peer info
		socket.on('close', () => {
			console.log('Client disconnected');
			const peer = connections.get(socket);
			if (peer) {
				connections.delete(socket);

				// Notify other peers that a peer has closed
				for (const conn of connections.keys()) {
					/** @type {PeerMessage} */
					const msg = {
						type: 'peer',
						data: {
							id: peer.id,
							remove: true
						}
					};
					console.log(`Telling peer that ${peer.id} disconnected`);
					conn.send(JSON.stringify(msg));
				}
			}
		});
	});

	return server;
}

// Code to run when this script is called directly
if (import.meta.url === `${url.pathToFileURL(process.argv[1])}`) {
	const { handler } = await import('./../build/handler.js');
	const express = (await import('express')).default;
	const app = express();

	app.use(handler);

	const server = app.listen(3000, () => {
		console.log('Listening on port 3000...');
	});

	createSignalServer(server, '/ss');
}
