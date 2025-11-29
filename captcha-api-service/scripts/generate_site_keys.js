#!/usr/bin/env node
// scripts/generate_site_keys.js
'use strict';

/**
 * Backfill script to create site_key values for clients missing them.
 * Usage:
 *   node scripts/generate_site_keys.js
 *
 * It will:
 *  - find clients where site_key IS NULL or empty
 *  - generate a random site_key (base62 20 chars)
 *  - update the clients table
 *
 * NOTE: this script does NOT touch api_key_hash or raw keys.
 */

const db = require('../src/config/database');
const { randomBase62 } = require('../src/utils/crypto');

async function main() {
  console.log('Backfilling site_key for clients with missing site_key...');
  const res = await db.query("SELECT id FROM clients WHERE site_key IS NULL OR TRIM(site_key) = ''");
  if (!res.rows.length) {
    console.log('No clients require site_key.');
    process.exit(0);
  }
  for (const row of res.rows) {
    const sk = randomBase62(20);
    await db.query('UPDATE clients SET site_key = $1 WHERE id = $2', [sk, row.id]);
    console.log('Updated client', row.id, '->', sk);
  }
  console.log('Done.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error', err);
  process.exit(1);
});
