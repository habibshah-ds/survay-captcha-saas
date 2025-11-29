// src/middleware/rateLimitMiddleware.js
'use strict';

/**
 * Simple in-memory rate limiter.
 * Returns a middleware function.
 *
 * Usage:
 *   const rateLimit = require('./rateLimitMiddleware')({ windowSec: 60, limit: 60 });
 *   router.post('/route', rateLimit, handler);
 */

module.exports = function rateLimitMiddleware({ windowSec = 60, limit = 60 } = {}) {
  const hits = new Map();

  return function (req, res, next) {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';

    const now = Date.now();
    const windowStart = now - windowSec * 1000;

    if (!hits.has(ip)) {
      hits.set(ip, []);
    }

    // remove expired hits
    const timestamps = hits.get(ip).filter(ts => ts > windowStart);
    timestamps.push(now);
    hits.set(ip, timestamps);

    if (timestamps.length > limit) {
      return res.status(429).json({
        success: false,
        error: 'rate_limit_exceeded'
      });
    }

    next();
  };
};
