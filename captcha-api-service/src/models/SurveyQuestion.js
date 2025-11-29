// src/models/SurveyQuestion.js
'use strict';

const { pool } = require('../config/database');
const logger = require('../utils/logger');

class SurveyQuestion {
  static async getRandomForClient(clientId) {
    try {
      const sql = `
        SELECT id, client_id, question_text, question_type, options, scale_min, scale_max
        FROM survey_questions
        WHERE (client_id IS NULL OR client_id = $1)
          AND archived = FALSE
        ORDER BY RANDOM()
        LIMIT 1
      `;
      const res = await pool.query(sql, [clientId]);
      return res.rowCount ? res.rows[0] : null;
    } catch (err) {
      logger.error('SurveyQuestion.getRandomForClient error', err);
      throw err;
    }
  }
}

module.exports = SurveyQuestion;
