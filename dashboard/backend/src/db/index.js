// src/db/index.js
const pool = require('../config/db');

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  // optional logging in dev:
  if (process.env.NODE_ENV === 'development') {
    console.log('PG QUERY', { text: text.replace(/\s+/g, ' ').trim(), duration, rows: res.rowCount });
  }
  return res;
}

module.exports = { query, pool };
