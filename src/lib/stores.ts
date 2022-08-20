import { writable } from 'svelte/store';
import type { Peer } from './types';

export function createStores() {
	return {
		peers: writable<Peer[]>([]),
		cameras: writable<MediaDeviceInfo[]>([]),
		localStream: writable<MediaStream | undefined>(),
		remoteStreams: writable<MediaStream[]>([])
	};
}

export type AppStores = ReturnType<typeof createStores>;
