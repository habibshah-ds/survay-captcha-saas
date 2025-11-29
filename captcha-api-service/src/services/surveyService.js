// src/services/surveyService.js
'use strict';

const db = require('../config/database');

/**
 * Load a survey question for client (optionally random).
 * Returns question object with fields:
 * { id, client_id, question_text, question_type, options, scale_min, scale_max }
 */
async function getQuestionForClient(clientId) {
  // pick a random active question for client
  const q = `
    SELECT id, client_id, question_text, question_type, options_json, scale_min, scale_max
    FROM survey_questions
    WHERE client_id = $1
      AND active = true
    ORDER BY RANDOM()
    LIMIT 1
  `;
  const res = await db.query(q, [clientId]);
  if (res.rowCount === 0) return null;
  const r = res.rows[0];
  return {
    id: r.id,
    client_id: r.client_id,
    question_text: r.question_text,
    question_type: r.question_type,
    options: r.options_json ? JSON.parse(r.options_json) : null,
    scale_min: r.scale_min,
    scale_max: r.scale_max,
  };
}

/**
 * Validate that survey answer shape matches question
 * - multiple_choice: answer must be option id (string/number) matching an option id
 * - image_choice: same as multiple_choice
 * - rating: numeric between scale_min..scale_max
 * - text: non-empty string
 *
 * Returns { ok: boolean, normalizedAnswer, error }
 */
function validateAnswer(question, answer) {
  if (!question) return { ok: false, error: 'no_question' };
  const t = question.question_type;
  if (t === 'multiple_choice' || t === 'image_choice') {
    // answer must be one of options[].id
    if (!question.options || !Array.isArray(question.options)) return { ok: false, error: 'no_options' };
    const found = question.options.find(o => String(o.id) === String(answer));
    if (!found) return { ok: false, error: 'invalid_option' };
    return { ok: true, normalizedAnswer: String(answer) };
  } else if (t === 'rating') {
    const v = Number(answer);
    if (Number.isNaN(v)) return { ok: false, error: 'invalid_rating' };
    if (typeof question.scale_min === 'number' && typeof question.scale_max === 'number') {
      if (v < question.scale_min || v > question.scale_max) return { ok: false, error: 'rating_out_of_range' };
    }
    return { ok: true, normalizedAnswer: v };
  } else if (t === 'text') {
    if (typeof answer !== 'string' || answer.trim().length === 0) return { ok: false, error: 'empty_text' };
    return { ok: true, normalizedAnswer: answer.trim().slice(0, 2000) };
  } else {
    return { ok: false, error: 'unsupported_type' };
  }
}

module.exports = {
  getQuestionForClient,
  validateAnswer,
};
