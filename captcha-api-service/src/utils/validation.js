// src/utils/validation.js
'use strict';

/**
 * Minimal validation helpers used by services/controllers
 */

/**
 * Basic body validator (thin wrapper)
 */
function validateBody(body, required = []) {
  const missing = [];
  required.forEach((k) => {
    if (body[k] === undefined || body[k] === null || (typeof body[k] === 'string' && body[k].trim() === '')) {
      missing.push(k);
    }
  });
  if (missing.length) return { ok: false, missing };
  return { ok: true };
}

/**
 * random Base62 string
 */
function randomBase62(length = 16) {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let out = '';
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

module.exports = {
  validateBody,
  randomBase62
};
