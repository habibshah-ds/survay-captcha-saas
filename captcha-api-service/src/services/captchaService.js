// src/services/captchaService.js
'use strict';

const crypto = require('crypto');
const { pool } = require('../config/database');
const altchaService = require('./altchaService');
const tokenService = require('./tokenService');
const logger = require('../utils/logger');

const MIN_SOLVE_MS = 300; // minimum human-like solve time (ms)
const DEFAULT_EXPIRES_MINUTES = 10; // challenge expiry window

function makeSessionId() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Pick a single survey question for the client.
 * Considers global questions (client_id IS NULL) and client-specific ones.
 * Returns normalized JS object.
 */
async function pickSurveyQuestion(clientId) {
  const sql = `
    SELECT id, client_id, question_text, question_type, options, scale_min, scale_max
    FROM survey_questions
    WHERE (client_id IS NULL OR client_id = $1)
      AND archived = FALSE
    ORDER BY RANDOM()
    LIMIT 1
  `;
  const { rows } = await pool.query(sql, [clientId]);
  if (!rows || rows.length === 0) {
    // Return a safe fallback question so widget still works (optional)
    return {
      id: null,
      client_id: null,
      question_text: 'Please confirm you are human',
      question_type: 'multiple_choice',
      options: [{ id: 'yes', text: 'Yes' }, { id: 'no', text: 'No' }],
      scale_min: null,
      scale_max: null,
    };
  }
  const r = rows[0];
  return {
    id: r.id,
    client_id: r.client_id,
    question_text: r.question_text,
    question_type: r.question_type,
    options: r.options || null,
    scale_min: r.scale_min || null,
    scale_max: r.scale_max || null,
  };
}

/**
 * CreateChallenge:
 * - validate client
 * - pick survey
 * - request altcha params (lightweight)
 * - create captcha_sessions row (pending)
 * - return challenge/session id and widget payload
 */
async function createChallenge(client, difficulty = 'easy') {
  if (!client || !client.id) throw new Error('Invalid client');

  // pick survey question
  const question = await pickSurveyQuestion(client.id);

  // generate altcha params — altchaService should return safe public params
  let altcha;
  try {
    altcha = await altchaService.generateChallenge({ difficulty });
  } catch (err) {
    logger.warn('altchaService.generateChallenge failed, falling back', err && err.message ? err.message : err);
    // continue with minimal altcha object so client can still show widget
    altcha = { type: 'none', publicParams: null };
  }

  const sessionId = makeSessionId();
  const expiresAt = new Date(Date.now() + DEFAULT_EXPIRES_MINUTES * 60 * 1000);

  const surveySnapshot = {
    id: question.id,
    question_text: question.question_text,
    question_type: question.question_type,
    options: question.options,
    scale_min: question.scale_min,
    scale_max: question.scale_max,
  };

  const insertSQL = `
    INSERT INTO captcha_sessions
      (client_id, session_id, status, altcha_params, survey_snapshot, expires_at, created_at)
    VALUES ($1, $2, 'pending', $3::jsonb, $4::jsonb, $5, now())
    RETURNING id
  `;
  const vals = [
    client.id,
    sessionId,
    JSON.stringify(altcha),
    JSON.stringify(surveySnapshot),
    expiresAt.toISOString(),
  ];

  const res = await pool.query(insertSQL, vals);
  if (!res || res.rowCount !== 1) {
    throw new Error('Failed to create captcha session');
  }

  // optional: provide quota info via optional service
  let quota = null;
  try {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const rateLimitService = require('./rateLimitService');
    if (rateLimitService && typeof rateLimitService.getQuotaForClient === 'function') {
      quota = await rateLimitService.getQuotaForClient(client.id);
    }
  } catch (e) {
    // optional dependency, ignore
  }

  return {
    challengeId: sessionId,
    widgetData: {
      altcha: (altcha && altcha.publicParams) ? altcha.publicParams : altcha,
      survey: surveySnapshot,
    },
    expiresAt: expiresAt.toISOString(),
    quota,
  };
}

/**
 * Complete a challenge:
 * options = {
 *   client,
 *   challengeId,
 *   altchaSolution,
 *   surveyAnswer,
 *   solveTimeMs,
 *   ip,
 *   userAgent
 * }
 *
 * returns signed token string on success
 */
async function completeChallenge(options = {}) {
  const {
    client,
    challengeId,
    altchaSolution,
    surveyAnswer,
    solveTimeMs = 0,
    ip = null,
    userAgent = '',
  } = options;

  if (!client || !client.id) throw new Error('Invalid client');
  if (!challengeId) throw new Error('Missing challenge_id');

  // Load session row inside transaction to avoid races
  const clientConn = await pool.connect();
  try {
    await clientConn.query('BEGIN');

    const selectSQL = `
      SELECT id, client_id, session_id, status, altcha_params, survey_snapshot, expires_at, token_issued, token_jti
      FROM captcha_sessions
      WHERE session_id = $1
      FOR UPDATE
    `;
    const r = await clientConn.query(selectSQL, [challengeId]);
    if (!r || r.rowCount === 0) {
      throw new Error('Invalid challenge_id');
    }
    const row = r.rows[0];

    if (row.client_id !== client.id) {
      throw new Error('Challenge does not belong to this client');
    }

    if (row.status === 'used' || row.token_issued === true) {
      throw new Error('Challenge already used');
    }

    const now = new Date();
    const expiresAt = new Date(row.expires_at);
    if (expiresAt < now) {
      await clientConn.query(
        `UPDATE captcha_sessions SET status = 'expired', updated_at = now() WHERE id = $1`,
        [row.id]
      );
      throw new Error('Challenge expired');
    }

    // Verify ALTCHA solution (if altcha was used)
    let altchaOk = true;
    try {
      const altchaParams = row.altcha_params || {};
      if (altchaParams && altchaParams.type && altchaParams.type !== 'none') {
        altchaOk = await altchaService.verifySolution({
          params: altchaParams,
          solution: altchaSolution,
          clientIp: ip,
          userAgent,
        });
      }
    } catch (err) {
      logger.warn('altcha verification error: ', err && err.message ? err.message : err);
      altchaOk = false;
    }

    if (!altchaOk) {
      await clientConn.query(
        `UPDATE captcha_sessions SET status = 'failed', last_error = $2, updated_at = now() WHERE id = $1`,
        [row.id, 'altcha_failed']
      );
      throw new Error('ALTCHA verification failed');
    }

    // Enforce minimal human-like solve time
    if (Number(solveTimeMs) < MIN_SOLVE_MS) {
      // record and fail
      await clientConn.query(
        `UPDATE captcha_sessions SET status = 'failed', last_error = $2, updated_at = now() WHERE id = $1`,
        [row.id, 'too_fast']
      );
      throw new Error('Solve time too fast');
    }

    // Basic / pluggable risk scoring
    let riskScore = 0;
    try {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const riskScoringService = require('./riskScoringService');
      if (riskScoringService && typeof riskScoringService.score === 'function') {
        riskScore = await riskScoringService.score({
          clientId: client.id,
          ip,
          userAgent,
          solveTimeMs,
          surveyAnswer,
        });
      } else {
        // fallback heuristics
        if (solveTimeMs < 600) riskScore += 5;
      }
    } catch (e) {
      // optional; fallback heuristics
      if (solveTimeMs < 600) riskScore += 5;
    }

    if (riskScore >= 50) {
      await clientConn.query(
        `UPDATE captcha_sessions SET status = 'failed', last_error = $2, updated_at = now() WHERE id = $1`,
        [row.id, 'high_risk']
      );
      throw new Error('Challenge rejected due to risk score');
    }

    // Issue one-time token via tokenService
    const tokenPayload = {
      session_id: row.session_id,
      client_id: client.id,
      flagged: riskScore > 0,
    };

    const created = await tokenService.createToken(tokenPayload, {
      expiresInSeconds: 60 * DEFAULT_EXPIRES_MINUTES,
      oneTime: true,
    });

    if (!created || !created.token) {
      throw new Error('Failed to create token');
    }

    // persist survey answer and mark session used + attach token jti
    const updateSQL = `
      UPDATE captcha_sessions
        SET status = 'used',
            token_issued = TRUE,
            token_jti = $2,
            survey_answer = $3::jsonb,
            timings = $4::jsonb,
            used_at = now(),
            updated_at = now()
      WHERE id = $1
    `;
    const updateVals = [
      row.id,
      created.jti || null,
      JSON.stringify({ answer: surveyAnswer }),
      JSON.stringify({ solve_time_ms: solveTimeMs, ip, userAgent }),
    ];
    await clientConn.query(updateSQL, updateVals);

    await clientConn.query('COMMIT');

    return created.token;
  } catch (err) {
    try {
      await clientConn.query('ROLLBACK');
    } catch (er) {
      logger.warn('Rollback failed', er && er.message ? er.message : er);
    }
    logger.warn('completeChallenge error:', err && err.message ? err.message : err);
    throw err;
  } finally {
    clientConn.release();
  }
}

/**
 * verifyAndConsumeToken(apiClient, token)
 * - delegates to tokenService.consumeToken
 * - returns consumption info or throws
 */
async function verifyAndConsumeToken(apiClient, token) {
  if (!apiClient || !apiClient.id) throw new Error('Invalid api client');
  if (!token) throw new Error('Missing token');

  const consumed = await tokenService.consumeToken(token, apiClient.id);
  return consumed;
}

module.exports = {
  createChallenge,
  completeChallenge,
  verifyAndConsumeToken,
};
