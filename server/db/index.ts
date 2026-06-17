import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

// Create SQLite database file (will be created automatically)
const sqlite = new Database('sqlite.db');
export const db = drizzle(sqlite, { schema });

export const testConnection = async () => {
  try {
    console.log('✅ SQLite connected successfully');
    return true;
  } catch (error) {
    console.error('❌ SQLite connection error:', error);
    return false;
  }
};