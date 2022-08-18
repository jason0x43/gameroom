import url from 'url';
import { WebSocketServer } from 'ws';

/** @typedef {import('http').Server} HttpServer */

/**
 * @param {HttpServer} server
 * @param {string} path
 */
export function createSignalServer(server, path) {
	const ws = new WebSocketServer({ noServer: true });

	server.on('upgrade', function (request, socket, head) {
		const { url } = request;
		if (url === path) {
			ws.handleUpgrade(request, socket, head, function (skt) {
				ws.emit('connection', skt);
			});
		}
	});

	ws.on('connection', function () {
		console.log('connected!');
	});

	return ws;
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
