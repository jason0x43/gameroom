import { sveltekit } from '@sveltejs/kit/vite';
import { createSignalServer } from './scripts/serverUtil.js';
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
	plugins: [sveltekit(), signalServer]
};

const { SSL_CRT, SSL_KEY } = process.env;
if (SSL_CRT && SSL_KEY) {
	config.server = {
		https: {
			key: readFileSync(SSL_KEY),
			cert: readFileSync(SSL_CRT)
		}
	};
}

export default config;
