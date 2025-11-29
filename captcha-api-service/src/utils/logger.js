// src/utils/logger.js
'use strict';

const util = require('util');

function scrub(obj) {
  // Remove known secret keys when logging to prevent accidental leakage.
  if (!obj || typeof obj !== 'object') return obj;
  const copy = Object.assign({}, obj);
  const secrets = ['api_key', 'apiKey', 'raw_api_key', 'password', 'JWT_SECRET', 'API_KEY_PEPPER'];
  for (const s of secrets) {
    if (s in copy) copy[s] = '[REDACTED]';
  }
  return copy;
}

function debug(...args) {
  console.debug('[DEBUG]', ...args.map((a) => (typeof a === 'object' ? util.inspect(scrub(a), { depth: 3 }) : a)));
}
function info(...args) {
  console.info('[INFO]', ...args.map((a) => (typeof a === 'object' ? util.inspect(scrub(a), { depth: 2 }) : a)));
}
function warn(...args) {
  console.warn('[WARN]', ...args.map((a) => (typeof a === 'object' ? util.inspect(scrub(a), { depth: 2 }) : a)));
}
function error(...args) {
  console.error('[ERROR]', ...args.map((a) => (typeof a === 'object' ? util.inspect(scrub(a), { depth: 2 }) : a)));
}

module.exports = {
  debug,
  info,
  warn,
  error,
};
