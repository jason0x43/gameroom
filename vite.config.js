import { sveltekit } from '@sveltejs/kit/vite';
import { createSignalServer } from './scripts/server.js';
import { readFileSync } from 'fs';

/** @type {import('vite').Plugin} */
const signalServer = {
	name: 'signalServer',
	configureServer: async function (server) {
		createSignalServer(server.httpServer, '/ss');
	}
};

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit(), signalServer],
	server: {
		https: {
			key: readFileSync('jasons-mbp.key.pem'),
			cert: readFileSync('jasons-mbp.crt.pem'),
		}
	}
};

export default config;
