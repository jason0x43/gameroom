import { sveltekit } from '@sveltejs/kit/vite';
import { createSignalServer } from './server.js';

/** @type {import('vite').Plugin} */
const signalServer = {
	name: 'signalServer',
	configureServer: async function (server) {
		createSignalServer(server.httpServer, '/ss');
	}
};

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit(), signalServer]
};

export default config;
