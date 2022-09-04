import { sveltekit } from '@sveltejs/kit/vite';
import { loadEnv } from 'vite';
import { readFileSync } from 'fs';

/** @type {import('vite').UserConfigFn} */
export default async function defineConfig({ command, mode }) {
	/** @type {import('vite').UserConfig} */
	const config = {
		plugins: [sveltekit()]
	};

	if (command === 'serve' && mode !== 'test') {
		const { createSignalServer } = await import('./scripts/serverUtil.js');
		process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

		/** @type {import('vite').Plugin} */
		const signalServer = {
			name: 'signalServer',
			configureServer: async function (server) {
				createSignalServer(server.httpServer, '/ss');
			}
		};

		config.plugins.push(signalServer);
	}

	const { SSL_CRT, SSL_KEY } = process.env;
	if (SSL_CRT && SSL_KEY) {
		config.server = {
			https: {
				key: readFileSync(SSL_KEY),
				cert: readFileSync(SSL_CRT)
			}
		};
	}

	if (mode === 'test' && !process.env.DATABASE_URL) {
		process.env.DATABASE_URL = 'file:../test.db?connection_limit=1';
	}

	return config;
}
