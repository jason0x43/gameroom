import type { Database } from 'better-sqlite3';

type Migration = {
	up: (db: Database) => void;
	down: (db: Database) => void;
};

export function runMigrations(db: Database) {
	const version = getVersion(db);
	for (let i = version + 1; i < migrations.length; i++) {
		migrations[i].up(db);
	}
}

function getVersion(db: Database): number {
	try {
		const ver = db.prepare(`SELECT value FROM meta WHERE key='version'`).get();
		return Number(ver.value);
	} catch (error) {
		return -1;
	}
}

export const migrations: Migration[] = [
	// Initial migration
	{
		up(db) {
			db.transaction(function () {
				db.prepare(
					`CREATE TABLE meta (
						key TEXT NOT NULL PRIMARY KEY,
						value TEXT NOT NULL
					)`
				).run();

				db.prepare<[string, string]>(
					'INSERT INTO meta (key, value) VALUES (?, ?)'
				).run('version', '0');

				db.prepare(
					`CREATE TABLE user (
						id TEXT NOT NULL PRIMARY KEY,
						email TEXT NOT NULL UNIQUE,
						username TEXT NOT NULL UNIQUE
					)`
				).run();

				db.prepare(
					`CREATE TABLE password (
						hash TEXT NOT NULL,
						userId TEXT NOT NULL UNIQUE,
						FOREIGN KEY (userId) REFERENCES user (id) ON DELETE CASCADE ON UPDATE NO ACTION
					)`
				).run();

				db.prepare(
					`CREATE TABLE session (
						id TEXT NOT NULL PRIMARY KEY,
						data TEXT,
						expires DATETIME NOT NULL,
						userId TEXT NOT NULL,
						FOREIGN KEY (userId) REFERENCES user (id) ON DELETE CASCADE ON UPDATE NO ACTION
					)`
				).run();
			})();
		},

		down(db) {
			db.prepare('DROP TABLE session').run();
			db.prepare('DROP TABLE password').run();
			db.prepare('DROP TABLE user').run();
			db.prepare('DROP TABLE meta').run();
		}
	}
];
