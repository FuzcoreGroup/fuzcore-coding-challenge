import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const setupDatabase = async () => {
  // Connect to default postgres database first
  const adminPool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: 'postgres', // Connect to default database
  });

  try {
    console.log('🔄 Setting up database...');
    
    // Check if database exists
    const dbName = process.env.DB_NAME || 'bankdash_db';
    const checkDb = await adminPool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );

    if (checkDb.rowCount === 0) {
      // Create database
      await adminPool.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database "${dbName}" created`);
    } else {
      console.log(`✅ Database "${dbName}" already exists`);
    }

    // Close admin connection
    await adminPool.end();

    // Connect to the new database
    const dbPool = new Pool({
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: dbName,
    });

    // Create users table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `;

    await dbPool.query(createTableQuery);
    console.log('✅ Users table created');

    await dbPool.end();
    console.log('🎉 Database setup complete!');
    
  } catch (error) {
    console.error('❌ Database setup error:', error);
  }
};

setupDatabase();