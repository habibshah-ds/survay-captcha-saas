// src/utils/crypto.js
'use strict';

const crypto = require('crypto');

const API_KEY_PEPPER = process.env.API_KEY_PEPPER || '';
if (!API_KEY_PEPPER) {
  // don't throw — allow tests to run, but warn
  console.warn('Warning: API_KEY_PEPPER is not set. Set in production env.');
}

function hmacSha256Hex(key, msg) {
  return crypto.createHmac('sha256', key).update(msg, 'utf8').digest('hex');
}

/**
 * Compute stored api_key_hash from raw api_key
 * (Use this only when rotating keys manually — raw keys should never be stored.)
 */
function computeApiKeyHash(rawApiKey) {
  if (!API_KEY_PEPPER) throw new Error('API_KEY_PEPPER not configured');
  return hmacSha256Hex(API_KEY_PEPPER, rawApiKey);
}

function secureCompare(a, b) {
  // constant-time compare
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) {
    // still run timing safe compare on padded buffers
    const res = crypto.timingSafeEqual(
      Buffer.concat([bufA, Buffer.alloc(Math.abs(bufA.length - bufB.length))]),
      Buffer.concat([bufB, Buffer.alloc(Math.abs(bufA.length - bufB.length))])
    );
    return false && res;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function randomBase62(len = 24) {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const bytes = crypto.randomBytes(len);
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

function newJti() {
  return crypto.randomBytes(16).toString('hex'); // 32 char hex
}

module.exports = {
  computeApiKeyHash,
  secureCompare,
  randomBase62,
  newJti,
};
