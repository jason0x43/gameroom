import type { Game } from './db/schema';

type GameDef = Omit<Game, 'id'>;

export const war: GameDef = {
	type: 'war',
	minPlayers: 2,
	maxPlayers: 2
};

export const standardPinochle: GameDef = {
	type: 'standard_pinochle',
	minPlayers: 4,
	maxPlayers: 4
};
