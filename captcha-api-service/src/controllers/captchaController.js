// src/controllers/captchaController.js
'use strict';

const captchaService = require('../services/captchaService');
const logger = require('../utils/logger');

/**
 * Create a new challenge for a client.
 * Expects:
 *   req.client  (injected by authMiddleware using site_key)
 *   req.body.difficulty (optional: easy, medium, hard)
 */
async function createChallenge(req, res) {
  try {
    const client = req.client;
    const difficulty = req.body?.difficulty || 'easy';

    const result = await captchaService.createChallenge(client, difficulty);

    return res.json({
      success: true,
      challenge_id: result.challengeId,
      widget: result.widgetData,
      expires_at: result.expiresAt,
      quota: result.quota || null,
    });
  } catch (err) {
    logger.warn('createChallenge error:', err?.message || err);
    return res.status(400).json({
      success: false,
      error: err.message || 'Failed to create challenge',
    });
  }
}

/**
 * Complete a challenge.
 * Expects:
 *   req.client
 *   req.body = {
 *      challenge_id,
 *      altcha_solution,
 *      survey_answer,
 *      solve_time_ms
 *   }
 */
async function completeChallenge(req, res) {
  try {
    const client = req.client;

    const {
      challenge_id,
      altcha_solution,
      survey_answer,
      solve_time_ms,
    } = req.body || {};

    const token = await captchaService.completeChallenge({
      client,
      challengeId: challenge_id,
      altchaSolution: altcha_solution,
      surveyAnswer: survey_answer,
      solveTimeMs: Number(solve_time_ms || 0),
      ip: req.ip,
      userAgent: req.get('user-agent') || '',
    });

    return res.json({
      success: true,
      token,
    });

  } catch (err) {
    logger.warn('completeChallenge error:', err?.message || err);

    const message = err.message || 'Failed to complete challenge';

    // classify errors to give better UX
    if (message.includes('expired')) {
      return res.status(410).json({ success: false, error: 'Challenge expired' });
    }
    if (message.includes('used')) {
      return res.status(409).json({ success: false, error: 'Challenge already used' });
    }
    if (message.includes('ALTCHA')) {
      return res.status(400).json({ success: false, error: 'Invalid proof-of-work' });
    }

    return res.status(400).json({
      success: false,
      error: message,
    });
  }
}

/**
 * Verify token (server-to-server).
 * Expects:
 *   req.client  (API client)
 *   req.body = { token }
 */
async function verifyToken(req, res) {
  try {
    const client = req.client;
    const token = req.body?.token;

    if (!token) {
      return res.status(400).json({ success: false, error: 'Missing token' });
    }

    const result = await captchaService.verifyAndConsumeToken(client, token);

    return res.json({
      success: true,
      session_id: result.session_id,
      client_id: result.client_id,
      jti: result.jti,
      consumed: true,
    });
  } catch (err) {
    logger.warn('verifyToken error:', err?.message || err);
    return res.status(400).json({
      success: false,
      error: err.message || 'Invalid token',
    });
  }
}

module.exports = {
  createChallenge,
  completeChallenge,
  verifyToken,
};
