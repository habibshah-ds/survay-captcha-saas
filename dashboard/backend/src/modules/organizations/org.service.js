import { db } from "../../config/db.js";

export const createOrg = async (userId, { name }) => {
  const result = await db.query(
    `INSERT INTO organizations (user_id,name) VALUES ($1,$2) RETURNING *`,
    [userId, name]
  );
  return result.rows[0];
};

export const getOrg = async (userId) => {
  const result = await db.query(
    `SELECT * FROM organizations WHERE user_id=$1`,
    [userId]
  );
  return result.rows[0];
};
