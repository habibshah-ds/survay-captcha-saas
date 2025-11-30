// backend/src/services/questionService.js
import { query } from '../db/index.js';

/**
 * Basic service functions. Keep logic here to make controllers thin.
 */

export async function listQuestions({ clientId } = {}) {
  // If you have client ownership, join through surveys -> clients
  const sql = `
    SELECT q.* FROM questions q
    JOIN surveys s ON s.id = q.survey_id
    WHERE ($1::uuid IS NULL OR s.client_id = $1)
    ORDER BY q.position ASC, q.created_at DESC
    LIMIT 100
  `;
  const { rows } = await query(sql, [clientId]);
  return rows;
}

export async function getQuestionById(id) {
  const { rows } = await query('SELECT * FROM questions WHERE id=$1', [id]);
  if (rows.length === 0) return null;
  const q = rows[0];
  const { rows: choices } = await query('SELECT * FROM choices WHERE question_id=$1 ORDER BY position ASC', [id]);
  q.choices = choices;
  return q;
}

export async function createQuestion({ survey_id, type, prompt, metadata = {}, position = 0 }) {
  const sql = `
    INSERT INTO questions (survey_id, type, prompt, metadata, position)
    VALUES ($1,$2,$3,$4::jsonb,$5)
    RETURNING *
  `;
  const { rows } = await query(sql, [survey_id, type, prompt, JSON.stringify(metadata), position]);
  return rows[0];
}

export async function updateQuestion(id, { prompt, metadata, position, is_active }) {
  // keep it simple; update only provided fields
  const parts = [];
  const vals = [];
  let idx = 1;
  if (prompt !== undefined) { parts.push(`prompt = $${idx++}`); vals.push(prompt); }
  if (metadata !== undefined) { parts.push(`metadata = $${idx++}::jsonb`); vals.push(JSON.stringify(metadata)); }
  if (position !== undefined) { parts.push(`position = $${idx++}`); vals.push(position); }
  if (is_active !== undefined) { parts.push(`is_active = $${idx++}`); vals.push(is_active); }
  if (parts.length === 0) {
    const { rows } = await query('SELECT * FROM questions WHERE id=$1', [id]);
    return rows[0];
  }
  const sql = `UPDATE questions SET ${parts.join(', ')} WHERE id=$${idx} RETURNING *`;
  vals.push(id);
  const { rows } = await query(sql, vals);
  return rows[0];
}

export async function deleteQuestion(id) {
  await query('DELETE FROM questions WHERE id=$1', [id]);
}

export async function listChoices(questionId) {
  const { rows } = await query('SELECT * FROM choices WHERE question_id=$1 ORDER BY position ASC', [questionId]);
  return rows;
}

export async function createChoice(questionId, { text, value = null, position = 0 }) {
  const sql = `INSERT INTO choices (question_id, text, value, position) VALUES ($1,$2,$3,$4) RETURNING *`;
  const { rows } = await query(sql, [questionId, text, value, position]);
  return rows[0];
}

export async function deleteChoice(choiceId) {
  await query('DELETE FROM choices WHERE id=$1', [choiceId]);
}
