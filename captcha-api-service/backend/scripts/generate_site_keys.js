// backend/scripts/generate_site_keys.js
/**
 * Backfill script to generate site_key values for existing clients that lack them.
 * Usage: NODE_ENV=development node backend/scripts/generate_site_keys.js
 *
 * NOTE: If your DB still stores raw api_key values, do NOT try to compute hashes here.
 * Instead rotate server keys or follow instructions in README.
 */

const { query } = require('../../src/config/database');
const crypto = require('crypto');

function genSiteKey(len = 22) {
  // base62-like
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  const bytes = crypto.randomBytes(len);
  for (let i = 0; i < len; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

async function run() {
  const clients = await query('SELECT id, site_key FROM clients');
  for (const c of clients) {
    if (!c.site_key) {
      const newKey = genSiteKey();
      console.log(`Setting site_key for client ${c.id} -> ${newKey}`);
      await query('UPDATE clients SET site_key = $2, updated_at = now() WHERE id = $1', [c.id, newKey]);
    }
  }
  console.log('Done');
  process.exit(0);
}

run().catch(err => {
  console.error('Error', err);
  process.exit(1);
});
