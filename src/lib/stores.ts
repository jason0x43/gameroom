import { writable } from 'svelte/store';
import type { Peer } from './types';

export const peers = writable<Peer[]>([]);
export const cameras = writable<MediaDeviceInfo[]>([]);
