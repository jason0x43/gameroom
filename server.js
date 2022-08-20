import url from 'url';
import { WebSocketServer } from 'ws';

/** @typedef {import('http').Server} HttpServer */
/** @typedef {import('./src/lib/types').Peer} Peer */
/** @typedef {import('./src/lib/types').Message} Message */
/** @typedef {import('./src/lib/types').PeerMessage} PeerMessage */
/** @typedef {import('./src/lib/types').OfferMessage} OfferMessage */

/**
 * @param {HttpServer} httpServer
 * @param {string} path
 */
export function createSignalServer(httpServer, path) {
	const server = new WebSocketServer({ noServer: true });
	/**
	 * A map of sockets to peer info
	 * @type {Map<WebSocket, Peer | null>}
	 */
	const connections = new Map();
	/**
	 * A map of peer IDs to sockets
	 * @type {Map<string, WebSocket>}
	 */
	const peers = new Map();

	/** @param {Message} msg */
	function handleMessage(msg, socket) {
		console.log(`Received [${msg.type}]`);
		console.log(`${connections.size} active peers`);

		switch (msg.type) {
			case 'peer':
				connections.set(socket, msg.data);
				peers.set(msg.data.id, socket);

				// Announce the new/updated peer
				for (const skt of connections.keys()) {
					if (skt !== socket) {
						console.log(`Telling client about peer ${msg.data.id}`);
						skt.send(
							JSON.stringify({
								type: 'peer',
								data: msg.data
							})
						);
					}
				}
				break;

			case 'offer':
				peers.get(msg.data.target)?.send(JSON.stringify(msg));
				break;

			case 'answer':
				peers.get(msg.data.source)?.send(JSON.stringify(msg));
				break;

			case 'candidate': {
				peers.get(msg.data.target)?.send(JSON.stringify(msg));
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
		console.log(`Client connected with ${connections.size} active peers`);
		connections.set(socket, null);

		// Handle an incoming message from the client
		socket.on('message', (message) => {
			try {
				const msg = JSON.parse(`${message}`);
				handleMessage(msg, socket);
			} catch (error) {
				console.warn(`Error parsing message: ${error}`);
			}
		});

		// When the client connection closes, remove the client's peer info
		socket.on('close', () => {
			console.log('Socket closed');
			const peer = connections.get(socket);
			connections.delete(socket);
			for (const entry of peers.entries()) {
				if (entry[1] === socket) {
					peers.delete(entry[0]);
					break;
				}
			}

			if (peer) {
				for (const conn of connections.keys()) {
					/** @type {PeerMessage} */
					const msg = {
						type: 'peer',
						data: {
							id: peer.id,
							remove: true
						}
					};
					conn.send(JSON.stringify(msg));
				}
			}
		});

		// Tell the client about any known peers
		for (const peer of connections.values()) {
			if (peer) {
				console.log(`Telling new client about peer ${peer.id}`);
				socket.send(JSON.stringify({ type: 'peer', data: peer }));
			}
		}
	});

	return server;
}

if (import.meta.url === `${url.pathToFileURL(process.argv[1])}`) {
	const { handler } = await import('./build/handler.js');
	const express = (await import('express')).default;
	const app = express();

	app.use(handler);

	const server = app.listen(3000, () => {
		console.log('Listening on port 3000...');
	});

	createSignalServer(server, '/ss');
}
