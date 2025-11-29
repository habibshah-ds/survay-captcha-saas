// src/middleware/authMiddleware.js
'use strict';

const { pool } = require('../config/database');
const { hmacSha256Hex } = require('../utils/crypto');
const logger = require('../utils/logger');

const API_KEY_PEPPER = process.env.API_KEY_PEPPER || null;

/**
 * Helper: find client by site_key
 * returns client row or null
 */
async function getClientBySiteKey(siteKey) {
  if (!siteKey) return null;
  try {
    const res = await pool.query(
      `SELECT id, name, site_key, plan, monthly_limit, api_key_last_rotated
       FROM clients
       WHERE site_key = $1
       LIMIT 1`,
      [siteKey]
    );
    return res.rowCount ? res.rows[0] : null;
  } catch (err) {
    logger.error('DB error in getClientBySiteKey', err);
    throw err;
  }
}

/**
 * Helper: find client by API key (raw api key provided by caller)
 * We compute HMAC-SHA256(apiKey, API_KEY_PEPPER) and match against api_key_hash.
 */
async function getClientByApiKey(rawApiKey) {
  if (!rawApiKey) return null;
  if (!API_KEY_PEPPER) {
    // In dev we still allow, but warn
    logger.warn('API_KEY_PEPPER is not set. Comparing unhashed API keys is insecure (dev only).');
  }
  try {
    // compute hash using pepper
    const apiKeyHash = API_KEY_PEPPER ? hmacSha256Hex(API_KEY_PEPPER, rawApiKey) : rawApiKey;

    const res = await pool.query(
      `SELECT id, name, site_key, plan, monthly_limit, api_key_last_rotated
       FROM clients
       WHERE api_key_hash = $1
       LIMIT 1`,
      [apiKeyHash]
    );
    return res.rowCount ? res.rows[0] : null;
  } catch (err) {
    logger.error('DB error in getClientByApiKey', err);
    throw err;
  }
}

/**
 * Middleware: requireApiKey
 * Verifies X-API-Key header and attaches req.client
 */
async function requireApiKey(req, res, next) {
  try {
    const apiKey = (req.header('x-api-key') || '').trim();
    if (!apiKey) {
      return res.status(401).json({ error: 'Missing X-API-Key header' });
    }

    const client = await getClientByApiKey(apiKey);
    if (!client) {
      logger.warn('Invalid API key attempt from IP %s', req.ip);
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // attach client to request
    req.client = client;
    req.auth = { method: 'api_key' };
    next();
  } catch (err) {
    logger.error('requireApiKey middleware error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Middleware: requireSiteKey
 * Ensures a valid site_key is provided (for client-side flows like challenge)
 */
async function requireSiteKey(req, res, next) {
  try {
    const siteKey = (req.body && req.body.site_key) || req.query.site_key || req.header('x-site-key') || '';
    if (!siteKey) {
      return res.status(400).json({ error: 'Missing site_key' });
    }
    const client = await getClientBySiteKey(siteKey);
    if (!client) {
      logger.warn('Invalid site_key attempt from IP %s', req.ip);
      return res.status(400).json({ error: 'Invalid site_key' });
    }
    req.client = client;
    req.auth = { method: 'site_key' };
    next();
  } catch (err) {
    logger.error('requireSiteKey middleware error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Middleware: optionalSiteKey
 * If site_key is present and valid attach client; otherwise move on (no error).
 * Useful for endpoints that accept both anonymous and site-key calls.
 */
async function optionalSiteKey(req, res, next) {
  try {
    const siteKey = (req.body && req.body.site_key) || req.query.site_key || req.header('x-site-key') || null;
    if (!siteKey) return next();
    const client = await getClientBySiteKey(siteKey);
    if (!client) {
      // do not fail — treat as anonymous but log suspicious attempts
      logger.warn('Received invalid site_key but continuing as anonymous — IP %s', req.ip);
      return next();
    }
    req.client = client;
    req.auth = { method: 'site_key' };
    next();
  } catch (err) {
    logger.error('optionalSiteKey middleware error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Combiner: allow either API key (server) OR site key (client)
 * - If X-API-Key present it takes precedence and requires it to be valid.
 * - Otherwise tries site_key and requires it.
 *
 * Use for endpoints that should allow server verification OR site-side challenge initiation.
 */
async function requireApiKeyOrSiteKey(req, res, next) {
  try {
    const apiKey = (req.header('x-api-key') || '').trim();
    if (apiKey) {
      return requireApiKey(req, res, next);
    }
    return requireSiteKey(req, res, next);
  } catch (err) {
    logger.error('requireApiKeyOrSiteKey middleware error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  requireApiKey,
  requireSiteKey,
  optionalSiteKey,
  requireApiKeyOrSiteKey,
  getClientBySiteKey,
  getClientByApiKey,
};
