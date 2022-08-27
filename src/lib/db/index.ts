import sqlite3, { type Database } from 'better-sqlite3';

export type { Database };

let db: Database | undefined;

export function getDb() {
  if (!db) {
    db = sqlite3(import.meta.env.VITE_DB);
  }
  return db;
}
