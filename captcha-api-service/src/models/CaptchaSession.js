// src/models/CaptchaSession.js
'use strict';

const { pool } = require('../config/database');
const logger = require('../utils/logger');

class CaptchaSession {
  static async findBySessionId(sessionId) {
    try {
      const sql = `
        SELECT *
        FROM captcha_sessions
        WHERE session_id = $1
        LIMIT 1
      `;
      const res = await pool.query(sql, [sessionId]);
      return res.rowCount ? res.rows[0] : null;
    } catch (err) {
      logger.error('CaptchaSession.findBySessionId error', err);
      throw err;
    }
  }

  static async create(data) {
    const sql = `
      INSERT INTO captcha_sessions
        (client_id, session_id, status, altcha_params, survey_snapshot, expires_at, created_at)
      VALUES ($1, $2, 'pending', $3::jsonb, $4::jsonb, $5, now())
      RETURNING *
    `;
    const values = [
      data.client_id,
      data.session_id,
      JSON.stringify(data.altcha_params),
      JSON.stringify(data.survey_snapshot),
      data.expires_at,
    ];
    const res = await pool.query(sql, values);
    return res.rows[0];
  }

  static async markUsed(id, tokenJti, answer, timings) {
    const sql = `
      UPDATE captcha_sessions
      SET status = 'used',
          token_issued = TRUE,
          token_jti = $2,
          survey_answer = $3::jsonb,
          timings = $4::jsonb,
          used_at = now(),
          updated_at = now()
      WHERE id = $1
      RETURNING *
    `;
    const res = await pool.query(sql, [
      id,
      tokenJti,
      JSON.stringify(answer),
      JSON.stringify(timings),
    ]);
    return res.rows[0];
  }
}

module.exports = CaptchaSession;
