#!/usr/bin/env node
/**
 * scripts/migrate.js
 * Simple PostgreSQL migration runner that applies SQL files in src/database/migrations/
 *
 * Usage:
 *   DATABASE_URL=postgres://user:pass@localhost:5432/db npm run migrate
 *
 * It records applied files in table "schema_migrations".
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'src', 'database', 'migrations');

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  const user = process.env.DB_USER || 'captcha_user';
  const pass = process.env.DB_PASS || 'password123';
  const name = process.env.DB_NAME || 'captcha_db';
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${name}`;
}

async function run() {
  const client = new Client({ connectionString: getDatabaseUrl() });
  await client.connect();

  // ensure migrations table
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const exists = await client.query('SELECT 1 FROM schema_migrations WHERE filename = $1 LIMIT 1', [file]);
    if (exists.rowCount > 0) {
      console.log(`SKIP  ${file} (already applied)`);
      continue;
    }

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    console.log(`APPLY ${file} ...`);
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations(filename) VALUES($1)', [file]);
      await client.query('COMMIT');
      console.log(`OK    ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`FAILED ${file}:`, err.message || err);
      process.exitCode = 1;
      await client.end();
      process.exit(1);
    }
  }

  await client.end();
  console.log('MIGRATIONS COMPLETE');
}

run().catch(err => {
  console.error('Migration runner error:', err && err.stack ? err.stack : err);
  process.exit(1);
});
