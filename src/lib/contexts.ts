import { getContext, setContext } from 'svelte';
import type { AppStores } from './stores';

export type AppContext = {
	stores: AppStores;
};

export const appContextKey = Symbol('app');

export function getAppContext() {
	return getContext<AppContext>(appContextKey);
}

export function setAppContext(value: AppContext) {
	return setContext<AppContext>(appContextKey, value);
}
