// See https://kit.svelte.dev/docs/types#app
declare namespace App {
	interface Locals {
		user: import('@prisma/client').User | undefined;
	}
	// interface Platform {}
	// interface PrivateEnv {}
	// interface PublicEnv {}
}
