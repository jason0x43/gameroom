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

export type StandardPinochleGame = {
	id: string;
	player1: string;
	player2: string;
	player3: string;
	player4: string;
}
