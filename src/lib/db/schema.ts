export const version = 1;

export type Meta = {
	version: number;
}

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
