// src/config/database.js
'use strict';

const { Pool } = require('pg');
const logger = require('../utils/logger');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  logger.error('DATABASE_URL not set. Exiting.');
  throw new Error('DATABASE_URL required');
}

const pool = new Pool({
  connectionString,
  max: process.env.PG_POOL_MAX ? Number(process.env.PG_POOL_MAX) : 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  logger.error('Unexpected PG pool error', err);
});

async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('SQL', { text, duration, rowCount: res.rowCount });
    return res;
  } catch (err) {
    logger.error('Query error', { text, err });
    throw err;
  }
}

module.exports = {
  pool,
  query,
};
