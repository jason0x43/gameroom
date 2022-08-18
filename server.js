import url from 'url';
import { WebSocketServer } from 'ws';

/** @typedef {import('http').Server} HttpServer */
/** @typedef {{ name: string }} Connection */
/** @typedef {{ type: string, value: unknown }} Message */

/**
 * @param {HttpServer} httpServer
 * @param {string} path
 */
export function createSignalServer(httpServer, path) {
	const server = new WebSocketServer({ noServer: true });
	/** @type {Map<WebSocket, Connection>} */
	const connections = new Map();

	/** @param {Message} msg */
	function handleMessage(msg, socket) {
		if (msg.type === 'name') {
			const con = connections.get(socket);
			con.name = msg.value;
			console.log(`Set name to ${msg.value}`);
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

	server.on('connection', function (socket) {
		console.log('Client connected');
		connections.set(socket, { name: '' });

		socket.on('message', function (message) {
			try {
				const msg = JSON.parse(`${message}`);
				handleMessage(msg, socket);
			} catch (error) {
				console.warn(`Error parsing message: ${error}`);
			}
		});
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
