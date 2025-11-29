// src/config/jwt.js
'use strict';

/**
 * Minimal JWT config loader.
 * 
 * All signing / verification logic is handled in src/services/tokenService.js.
 * This file only exposes the JWT_SECRET (or null in dev mode).
 */

const logger = require('../utils/logger');

const JWT_SECRET =
  process.env.JWT_SECRET ||
  process.env.APP_JWT_SECRET ||
  null;

if (!JWT_SECRET) {
  logger.warn('JWT_SECRET is not set. Tokens will use dev insecure signing. NOT FOR PRODUCTION.');
}

module.exports = {
  JWT_SECRET,
};

