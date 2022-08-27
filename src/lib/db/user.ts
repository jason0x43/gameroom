import bcrypt from 'bcryptjs';
import { getDb } from '.';
import type { Password, User } from './schema';

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
      FROM Password
      INNER JOIN User
        ON User.id = Password.userId
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

  const user: User = db.prepare<User['username']>(
    'SELECT * from User WHERE username = ?'
  ).get(username);

	return user;
}

export function getUserById(userId: User['id']): User | null {
  const db = getDb();

  const user: User = db.prepare<User['id']>(
    'SELECT * from User WHERE id = ?'
  ).get(userId);

	return user;
}
