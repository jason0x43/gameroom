import { createGame } from '$lib/db/game';
import type { Game } from '$lib/db/schema';
import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const data = await request.formData();

	const type = data.get('type') as Game['type'];
	if (typeof type !== 'string') {
		throw error(400, `Invalid game type ${type}`);
	}

	const minPlayers = Number(data.get('minPlayers'));
	if (isNaN(minPlayers)) {
		throw error(400, `${minPlayers} is not a valid number`);
	}

	const maxPlayers = Number(data.get('maxPlayers'));
	if (isNaN(maxPlayers)) {
		throw error(400, `${maxPlayers} is not a valid number`);
	}

	let game: Game;

	try {
		game = createGame({ type, minPlayers, maxPlayers });
	} catch (err) {
		throw error(500, `${err}`);
	}

	throw redirect(302, `/app/game/${game.id}`);
}
