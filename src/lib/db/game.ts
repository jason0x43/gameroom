import cuid from 'cuid';
import { prepare } from './lib/db.js';
import type { Game, GameAction, GamePlayer, User } from './schema.js';

export function createGame(data: Omit<Game, 'id'>): Game {
	const game: Game = prepare(
		`INSERT INTO game (id, type, minPlayers, maxPlayers)
		VALUES (:id, :type, :minPlayers, :maxPlayers)
		RETURNING *`
	).get({
		...data,
		id: cuid()
	});
	return game;
}

export function getGame(gameId: Game['id']): Game {
	const game: Game = prepare(`SELECT * FROM game WHERE id = ?`).get(gameId);
	if (!game) {
		throw new Error(`Unknown game id ${gameId}`);
	}
	return game;
}

export function addGamePlayer(gameId: Game['id'], userId: User['id']): void {
	const game = getGame(gameId);
	if (!game) {
		throw new Error(`Unknown game ID ${gameId}`);
	}

	const players = getGamePlayers(gameId);
	if (players.length === game.maxPlayers) {
		throw new Error(`Game is full`);
	}

	prepare(`INSERT INTO gamePlayer (gameId, userId) VALUES (?, ?)`).run(
		gameId,
		userId
	);
}

export function getGamePlayers(gameId: Game['id']): GamePlayer[] {
	const players: GamePlayer[] = prepare(
		`SELECT * FROM gamePlayer WHERE gameId=?`
	).all(gameId);
	return players;
}

export function getGameActions(gameId: Game['id']): GameAction[] {
	const actions = prepare(`SELECT * FROM gameAction WHERE gameId=?`).all(
		gameId
	);
	return actions.map<GameAction>((action) => ({
		...action,
		action: JSON.parse(action.action)
	}));
}

export function addGameAction(action: Omit<GameAction, 'time'>): void {
	prepare(
		`INSERT INTO gameAction (gameId, userId, time, action)
		VALUES (:gameId, :userId, :time, :action)`
	).run({
		...action,
		time: Date.now(),
		action: JSON.stringify(action.action)
	});
}
