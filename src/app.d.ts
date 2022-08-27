// See https://kit.svelte.dev/docs/types#app
declare namespace App {
	interface Locals {
		user: import('./lib/db/schema').User | undefined;
	}
}
