// src/models/Client.js
'use strict';

const { pool } = require('../config/database');
const logger = require('../utils/logger');

class Client {
  static async findBySiteKey(siteKey) {
    if (!siteKey) return null;
    try {
      const sql = `
        SELECT id, name, site_key, plan, monthly_limit, api_key_last_rotated
        FROM clients
        WHERE site_key = $1
        LIMIT 1
      `;
      const res = await pool.query(sql, [siteKey]);
      return res.rowCount ? res.rows[0] : null;
    } catch (err) {
      logger.error('Client.findBySiteKey error', err);
      throw err;
    }
  }

  static async findByApiKeyHash(apiKeyHash) {
    if (!apiKeyHash) return null;
    try {
      const sql = `
        SELECT id, name, site_key, plan, monthly_limit, api_key_last_rotated
        FROM clients
        WHERE api_key_hash = $1
        LIMIT 1
      `;
      const res = await pool.query(sql, [apiKeyHash]);
      return res.rowCount ? res.rows[0] : null;
    } catch (err) {
      logger.error('Client.findByApiKeyHash error', err);
      throw err;
    }
  }
}

module.exports = Client;
