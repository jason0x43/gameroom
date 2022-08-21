import url from 'url';
import { WebSocketServer } from 'ws';
import { parse as parseCookies } from 'cookie';
import { PrismaClient } from '@prisma/client';

/**
 * This is the signal server used to manage connections between peers.
 *
 * @typedef {import('http').Server} HttpServer
 * @typedef {import('http').IncomingMessage} IncomingMessage
 * @typedef {import('ws').WebSocket} WebSocket
 * @typedef {import('./src/lib/types').Peer} Peer
 * @typedef {import('./src/lib/types').Message} Message
 * @typedef {import('./src/lib/types').PeerMessage} PeerMessage
 * @typedef {import('./src/lib/types').OfferMessage} OfferMessage
 * @typedef {import('@prisma/client').User} User
 */

/**
 * @param {HttpServer} httpServer
 * @param {string} path
 */
export function createSignalServer(httpServer, path) {
	const server = new WebSocketServer({ noServer: true });

	const db = new PrismaClient();
	db.$connect();

	/**
	 * A map of sockets to peer info.
	 *
	 * @type {Map<WebSocket, Peer>}
	 */
	const connections = new Map();

	/**
	 * A map of sockets to users.
	 *
	 * @type {Map<WebSocket, User>}
	 */
	const users = new Map();

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
	 * @param {boolean} [remove]
	 */
	async function notifyClient(socket, client, peer, remove) {
		const clientUser = await getUser(client.userId);
		const peerUser = await getUser(peer.userId);

		if (remove) {
			console.log(`Telling ${clientUser?.username} that peer ${peerUser?.username} disconnected`);
		} else {
			console.log(`Telling ${clientUser?.username} about peer ${peerUser?.username}`);
		}

		/** @type {PeerMessage} */
		const msg = {
			type: 'peer',
			data: {
				...peer,
				remove
			}
		};
		socket.send(JSON.stringify(msg));
	}

	/**
	 * Handle an incoming message.
	 *
	 * @param {Message} msg
	 * @param {WebSocket} socket
	 */
	async function handleMessage(msg, socket) {
		console.log(`Received [${msg.type}] message`);

		switch (msg.type) {
			case 'peer': {
				const client = msg.data;
				const clientUser = await getUser(client.userId);
				client.name = clientUser?.username ?? client.id;

				// This is a new client -- tell it about any existing peers
				if (!connections.has(socket)) {
					console.log('Adding peer', client);
					for (const peer of connections.values()) {
						notifyClient(socket, client, peer);
					}
				} else {
					console.log('Updating peer', client);
				}


				// Announce the new/updated peer
				for (const [sock, peer] of connections.entries()) {
					notifyClient(sock, peer, client);
				}

				// Store / update the connection's peer data
				connections.set(socket, client);
				break;
			}

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

	/** @param {string} userId */
	async function getUser(userId) {
		try {
			const user = await db.user.findUnique({
				where: {
					id: userId
				}
			});

			return user ?? undefined;
		} catch (error) {
			return undefined;
		}
	}

	/** @param {IncomingMessage} request */
	async function getSessionUser(request) {
		const { headers } = request;
		const cookie = headers['cookie'];

		if (!cookie) {
			return undefined;
		}

		const cookies = parseCookies(cookie);
		if (!cookies.session) {
			return undefined;
		}

		try {
			const session = await db.session.findUnique({
				where: {
					id: cookies.session
				},
				include: {
					user: true
				}
			});

			return session?.user;
		} catch (error) {
			return undefined;
		}
	}

	httpServer.on('upgrade', async function (request, socket, head) {
		const { url } = request;
		if (url === path) {
			if (!(await getSessionUser(request))) {
				return;
			}

			server.handleUpgrade(request, socket, head, function (ws) {
				server.emit('connection', ws, request);
			});
		}
	});

	server.on('connection', async (socket, request) => {
		console.log('Client connected');

		const user = /** @type {User} */ (await getSessionUser(request));
		users.set(socket, user); 

		// Handle an incoming message from the client
		socket.on('message', (message) => {
			console.log('Received message');
			try {
				handleMessage(JSON.parse(`${message}`), socket);
			} catch (error) {
				console.warn(`Error parsing message: ${error}`);
			}
		});

		// When the client connection closes, remove the client's peer info
		socket.on('close', () => {
			console.log('Client disconnected');
			const client = connections.get(socket);
			if (client) {
				connections.delete(socket);

				// Notify peers that a client has closed
				for (const [sock, peer] of connections.entries()) {
					notifyClient(sock, peer, client, true);
				}
			}
		});
	});

	return server;
}

// Code to run when this script is called directly
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
