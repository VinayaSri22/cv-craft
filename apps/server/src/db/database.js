import { mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const schema = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');

/** SQLite file for the API. Override with DATABASE_PATH. */
export function defaultDatabasePath() {
  if (process.env.DATABASE_PATH) return process.env.DATABASE_PATH;
  return fileURLToPath(new URL('../../../../data/cv-craft.db', import.meta.url));
}

/** @param {string} [path] A file path, or ":memory:" in tests. */
export function openDatabase(path = defaultDatabasePath()) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON');
  if (path !== ':memory:') db.exec('PRAGMA journal_mode = WAL');
  db.exec(schema);
  return db;
}

/** Runs fn inside a transaction. fn must be synchronous. */
export function withTransaction(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
