import sqlite3, { type Database } from 'better-sqlite3';
import { runMigrations } from './migrations.js';

export type { Database };
export * from '../schema.js';

let db: Database | undefined;

export function getDb() {
  if (!process.env.VITE_DB) {
    throw new Error('The VITE_DB environment variable must be defined');
  }

  if (!db) {
    db = sqlite3(process.env.VITE_DB);
    runMigrations(db);
  }
  return db;
}
