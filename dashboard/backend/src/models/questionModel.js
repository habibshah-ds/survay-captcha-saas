// backend/src/models/questionModel.js
import pool from "../db/pool.js";

export async function createQuestion({ organizationId, questionText, options }) {
  const result = await pool.query(
    `INSERT INTO survey_questions (organization_id, question_text, options)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [organizationId, questionText, JSON.stringify(options)]
  );
  return result.rows[0];
}

export async function getQuestions(organizationId) {
  const result = await pool.query(
    `SELECT * FROM survey_questions
     WHERE organization_id = $1
     ORDER BY created_at DESC`,
    [organizationId]
  );
  return result.rows;
}

export async function deleteQuestion(id, organizationId) {
  await pool.query(
    `DELETE FROM survey_questions 
     WHERE id = $1 AND organization_id = $2`,
    [id, organizationId]
  );
  return true;
}

export async function getQuestionById(id, organizationId) {
  const result = await pool.query(
    `SELECT * FROM survey_questions 
     WHERE id = $1 AND organization_id = $2`,
    [id, organizationId]
  );
  return result.rows[0];
}
