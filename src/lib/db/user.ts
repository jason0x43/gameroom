import bcrypt from 'bcryptjs';
import cuid from 'cuid';
import { getDb } from './lib/db.js';
import type { Password, User } from './schema.js';

export function createUser(userData: Omit<User, 'id'>, password: string) {
	const db = getDb();
	const user: User = db
		.prepare<[User['id'], User['username'], User['email']]>(
			'INSERT INTO user (id, username, email) VALUES (?, ?, ?) RETURNING *'
		)
		.get(cuid(), userData.username, userData.email);
	db.prepare<[Password['hash'], User['id']]>(
		'INSERT INTO password (hash, userId) VALUES (?, ?)'
	).run(bcrypt.hashSync(password, 7), user.id);
	return user;
}

export function verifyLogin({
	username,
	password
}: {
	username: User['username'];
	password: Password['hash'];
}): User | null {
	const db = getDb();
	const passwd: Pick<Password, 'hash'> = db
		.prepare<User['username']>(
			`SELECT hash
			FROM password
			INNER JOIN user
			ON user.id = password.userId
			WHERE username = ?`
		)
		.get(username);

	if (!passwd) {
		return null;
	}

	const isValid = bcrypt.compareSync(password, passwd.hash);

	if (!isValid) {
		return null;
	}

	const user: User = db
		.prepare<User['username']>('SELECT * from User WHERE username = ?')
		.get(username);

	return user;
}

export function getUserById(userId: User['id']): User | null {
	const db = getDb();

	const user: User = db
		.prepare<User['id']>('SELECT * from user WHERE id = ?')
		.get(userId);

	return user;
}
