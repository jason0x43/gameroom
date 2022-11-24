import type { PageServerLoad } from './$types';
import { getGame, getGameActions } from '$lib/db/game';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = ({ params }) => {
	const id = params.id;
	try {
		const game = getGame(id);
		const actions = getGameActions(id);
		return {
			game,
			actions
		};
	} catch (err) { 
		console.warn(err);
		throw error(404, 'Not found');
	}
};
