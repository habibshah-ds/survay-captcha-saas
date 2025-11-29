// src/services/altchaService.js
'use strict';

const crypto = require('crypto');
const logger = require('../utils/logger');

const DEFAULT_DIFFICULTY = 3; // number of leading hex zero chars (adjustable)

/**
 * Count of leading hex '0' nibbles required. This is coarse but simple.
 * difficulty: 'easy'|'medium'|'hard' or numeric
 */
function difficultyToZeros(difficulty) {
  if (!difficulty) return DEFAULT_DIFFICULTY;
  if (typeof difficulty === 'number') return Math.max(1, difficulty);
  switch (difficulty) {
    case 'easy': return 2;
    case 'medium': return 3;
    case 'hard': return 4;
    default:
      // try parse if like "3"
      const n = parseInt(difficulty, 10);
      return Number.isFinite(n) && n > 0 ? n : DEFAULT_DIFFICULTY;
  }
}

/**
 * sha256 hex
 */
function sha256Hex(...parts) {
  const h = crypto.createHash('sha256');
  for (const p of parts) {
    h.update(String(p));
  }
  return h.digest('hex');
}

/**
 * Public API:
 * generateChallenge({ difficulty })
 *  - returns object with publicParams (serverNonce & zeros) that client can use
 */
async function generateChallenge({ difficulty = 'easy' } = {}) {
  const zeros = difficultyToZeros(difficulty);
  // serverNonce ties this challenge to server to prevent trivial replay across servers
  const serverNonce = crypto.randomBytes(16).toString('hex');

  // Return shape:
  // - publicParams: safe to send to browser
  // - serverSecret: any server-side secret info (not sent to client) — keep null for simplicity
  const publicParams = {
    serverNonce,
    zeros,
    note: 'Find a proof string such that sha256(serverNonce + proof) starts with N hex zero characters.',
  };

  // Some server-side secret could be returned for internal trace/debug; omitted here.
  return {
    publicParams,
    serverOnly: { createdAt: new Date().toISOString() },
  };
}

/**
 * verifySolution({ params, solution, clientIp, userAgent })
 * params: the altcha_params object stored in DB (as generated earlier)
 * solution: object from client, expected { proof: string }
 *
 * returns boolean
 */
async function verifySolution({ params = {}, solution = {} } = {}) {
  try {
    if (!params || !params.publicParams) {
      // older code may have stored params directly - handle gracefully
      // params may be the object returned by generateChallenge (we allowed altchaParams = altcha in captchaService)
      // support both shapes:
      if (params.serverNonce && params.zeros) {
        params = { publicParams: { serverNonce: params.serverNonce, zeros: params.zeros } };
      } else {
        logger.warn('altchaService.verifySolution: missing params');
        return false;
      }
    }

    const { serverNonce, zeros } = params.publicParams || params;
    if (!serverNonce || typeof zeros !== 'number') {
      logger.warn('altchaService.verifySolution: invalid params format');
      return false;
    }

    const proof = (solution && solution.proof) ? String(solution.proof) : '';
    if (!proof) {
      return false;
    }

    const digest = sha256Hex(serverNonce, proof);
    // check leading zeros (hex chars)
    const expectedPrefix = '0'.repeat(Math.max(0, zeros));
    const ok = digest.startsWith(expectedPrefix);

    // small logging for debug (do not log proofs in production)
    logger.debug && logger.debug('[altcha] verify', { digest, expectedPrefix, ok });

    return ok;
  } catch (err) {
    logger.warn('altchaService.verifySolution error', err && err.message ? err.message : err);
    return false;
  }
}

module.exports = {
  generateChallenge,
  verifySolution,
};
