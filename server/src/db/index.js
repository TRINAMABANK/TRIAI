import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env.js';

const dbPath = path.resolve(process.cwd(), env.DATABASE_PATH);
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sqlite = sqlite3.verbose();
let dbInstance = null;

export function getDb() {
  if (!dbInstance) {
    dbInstance = new sqlite.Database(dbPath, (err) => {
      if (err) {
        console.error('[DB ERROR] Failed to connect to SQLite database:', err.message);
      } else {
        console.log(`[DB SUCCESS] SQLite connected: ${dbPath}`);
      }
    });

    // Enable foreign keys and WAL mode for better concurrency
    dbInstance.run('PRAGMA foreign_keys = ON;');
    dbInstance.run('PRAGMA journal_mode = WAL;');
  }
  return dbInstance;
}

export const db = {
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      getDb().get(sql, params, (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      });
    });
  },

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      getDb().all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
  },

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      getDb().run(sql, params, function (err) {
        if (err) return reject(err);
        resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },

  exec(sql) {
    return new Promise((resolve, reject) => {
      getDb().exec(sql, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  },

  async transaction(fn) {
    await this.run('BEGIN TRANSACTION');
    try {
      const result = await fn(this);
      await this.run('COMMIT');
      return result;
    } catch (err) {
      await this.run('ROLLBACK');
      throw err;
    }
  },

  close() {
    return new Promise((resolve, reject) => {
      if (!dbInstance) return resolve();
      dbInstance.close((err) => {
        if (err) return reject(err);
        dbInstance = null;
        resolve();
      });
    });
  }
};

export default db;
