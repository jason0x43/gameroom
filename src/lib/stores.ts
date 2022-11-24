import { writable } from 'svelte/store';
import type { Game, GameAction } from './db/schema';
import type { Peer } from './types';

export function createStores() {
	return {
		peers: writable<Peer[]>([]),
		cameras: writable<MediaDeviceInfo[]>([]),
		localStream: writable<MediaStream | undefined>(),
		remoteStreams: writable<MediaStream[]>([]),
		game: writable<Game | undefined>(),
		gameActions: writable<GameAction[]>([])
	};
}

export type AppStores = ReturnType<typeof createStores>;
