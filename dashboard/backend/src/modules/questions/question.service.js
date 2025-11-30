// src/modules/questions/question.service.js
const db = require('../../db');
const uuid = require('crypto').randomUUID;

async function listQuestions(orgId) {
  const q = `SELECT id, org_id, title, type, options, created_at, updated_at
             FROM survey_questions WHERE org_id = $1 ORDER BY created_at DESC`;
  const res = await db.query(q, [orgId]);
  return res.rows;
}

async function getQuestion(orgId, id) {
  const res = await db.query('SELECT * FROM survey_questions WHERE id = $1 AND org_id = $2', [id, orgId]);
  return res.rows[0];
}

async function createQuestion(orgId, payload) {
  const id = uuid();
  const { title, type = 'multiple_choice', options = [] } = payload;
  const q = `INSERT INTO survey_questions (id, org_id, title, type, options)
             VALUES ($1,$2,$3,$4,$5) RETURNING id, org_id, title, type, options, created_at, updated_at`;
  const res = await db.query(q, [id, orgId, title, type, JSON.stringify(options)]);
  return res.rows[0];
}

async function updateQuestion(orgId, id, payload) {
  const fields = [];
  const values = [];
  let idx = 1;

  if (payload.title !== undefined) { fields.push(`title = $${idx++}`); values.push(payload.title); }
  if (payload.type !== undefined) { fields.push(`type = $${idx++}`); values.push(payload.type); }
  if (payload.options !== undefined) { fields.push(`options = $${idx++}`); values.push(JSON.stringify(payload.options)); }

  if (fields.length === 0) return getQuestion(orgId, id); // nothing to update

  const q = `UPDATE survey_questions SET ${fields.join(', ')}, updated_at = now()
             WHERE id = $${idx++} AND org_id = $${idx++} RETURNING id, org_id, title, type, options, created_at, updated_at`;
  values.push(id, orgId);
  const res = await db.query(q, values);
  return res.rows[0];
}

async function deleteQuestion(orgId, id) {
  await db.query('DELETE FROM survey_questions WHERE id = $1 AND org_id = $2', [id, orgId]);
}

module.exports = {
  listQuestions, getQuestion, createQuestion, updateQuestion, deleteQuestion
};
