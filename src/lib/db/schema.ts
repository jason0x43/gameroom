export type Meta = {
	key: string;
	value: string;
};

export type User = {
	id: string;
	email: string;
	username: string;
};

export type Password = {
	hash: string;
	userId: User['id'];
};

export type Session = {
	id: string;
	data?: string;
	expires: number;
	userId: User['id'];
};

export type Game = {
	id: string;
	type: 'standard_pinochle' | 'war';
	minPlayers: number;
	maxPlayers: number;
};

export type GamePlayer = {
	gameId: string;
	uerId: string;
};

export type GameAction = {
	gameId: string;
	userId: string;
	time: number;
	action: Record<string, unknown>;
};
