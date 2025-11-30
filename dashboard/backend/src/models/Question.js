import db from "../db/index.js";

export async function findAllQuestions(orgId) {
  return db.manyOrNone(
    "SELECT q.*, json_agg(o.* ORDER BY o.order_index) AS options FROM questions q LEFT JOIN question_options o ON q.id = o.question_id WHERE q.organization_id = $1 GROUP BY q.id ORDER BY q.id DESC",
    [orgId]
  );
}

export async function findQuestionById(id, orgId) {
  return db.oneOrNone(
    "SELECT q.*, json_agg(o.* ORDER BY o.order_index) AS options FROM questions q LEFT JOIN question_options o ON q.id = o.question_id WHERE q.id = $1 AND q.organization_id = $2 GROUP BY q.id",
    [id, orgId]
  );
}

export async function createQuestion(orgId, title, type) {
  return db.one(
    "INSERT INTO questions (organization_id, title, type) VALUES ($1, $2, $3) RETURNING *",
    [orgId, title, type]
  );
}

export async function addOptions(questionId, options) {
  const queries = options.map((o, idx) =>
    db.none(
      "INSERT INTO question_options (question_id, label, value, order_index) VALUES ($1, $2, $3, $4)",
      [questionId, o.label, o.value, idx]
    )
  );
  return Promise.all(queries);
}

export async function deleteQuestion(id, orgId) {
  return db.none(
    "DELETE FROM questions WHERE id = $1 AND organization_id = $2",
    [id, orgId]
  );
}
