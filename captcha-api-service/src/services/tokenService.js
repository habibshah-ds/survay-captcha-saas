// src/services/tokenService.js
"use strict";

const crypto = require("crypto");
const { pool } = require("../config/database");
const { sign, verify } = require("../config/jwt");
const logger = require("../utils/logger");

/**
 * Generate a secure random JTI (token id).
 */
function makeJti() {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Create a one-time token.
 *
 * payload = {
 *   session_id,
 *   client_id,
 *   flagged (optional)
 * }
 *
 * options = {
 *   expiresInSeconds: 600,
 *   oneTime: true
 * }
 */
async function createToken(payload, options = {}) {
  const {
    expiresInSeconds = 600, // default 10 minutes
    oneTime = true,
  } = options;

  if (!payload || !payload.session_id || !payload.client_id) {
    throw new Error("Missing required payload fields for token creation");
  }

  // generate unique JTI for replay protection
  const jti = makeJti();

  const tokenPayload = {
    sid: payload.session_id,
    cid: payload.client_id,
    flg: payload.flagged ? 1 : 0,
    jti,
  };

  // sign JWT
  const token = sign(tokenPayload, { expiresIn: `${expiresInSeconds}s` });

  // store token metadata in DB for one-time usage
  if (oneTime) {
    const sql = `
      UPDATE captcha_sessions
      SET token_jti = $2,
          token_expires_at = now() + ($3 || ' seconds')::interval,
          token_issued = TRUE,
          updated_at = now()
      WHERE session_id = $1
    `;
    const vals = [
      payload.session_id,
      jti,
      expiresInSeconds.toString(),
    ];

    const r = await pool.query(sql, vals);
    if (!r || r.rowCount !== 1) {
      throw new Error("Failed to persist token metadata");
    }
  }

  return {
    token,
    jti,
    exp: Date.now() + expiresInSeconds * 1000,
  };
}

/**
 * Verify the JWT and ensure:
 * - signature is valid
 * - session exists
 * - session belongs to API client
 * - token jti matches stored jti
 * - token is not used before
 * - token not expired
 * - consume (mark as used)
 */
async function consumeToken(token, apiClientId) {
  if (!token) throw new Error("Missing token");

  let decoded;
  try {
    decoded = verify(token);
  } catch (err) {
    logger.warn("Invalid JWT signature:", err.message);
    throw new Error("Invalid token");
  }

  const { sid, cid, jti } = decoded;

  if (!sid || !cid || !jti) {
    throw new Error("Malformed token");
  }

  // Ensure this token belongs to the API owner's client_id
  if (cid !== apiClientId) {
    throw new Error("Token does not belong to this API key / client");
  }

  // Load session and validate metadata
  const sql = `
    SELECT id, client_id, session_id, token_jti, token_expires_at, token_used
    FROM captcha_sessions
    WHERE session_id = $1
    FOR UPDATE
  `;
  const clientConn = await pool.connect();

  try {
    await clientConn.query("BEGIN");

    const r = await clientConn.query(sql, [sid]);
    if (!r || r.rowCount === 0) {
      throw new Error("Session not found");
    }

    const row = r.rows[0];

    if (row.client_id !== cid) {
      throw new Error("Token client mismatch");
    }

    if (!row.token_jti) {
      throw new Error("Token not registered in session");
    }

    if (row.token_jti !== jti) {
      throw new Error("Token JTI mismatch (possible replay)");
    }

    if (row.token_used === true) {
      throw new Error("Token already used");
    }

    const now = new Date();
    if (row.token_expires_at && new Date(row.token_expires_at) < now) {
      throw new Error("Token expired");
    }

    // Mark token as consumed
    await clientConn.query(
      `
      UPDATE captcha_sessions
      SET token_used = TRUE,
          used_at = now(),
          updated_at = now()
      WHERE id = $1
      `,
      [row.id]
    );

    await clientConn.query("COMMIT");

    return {
      success: true,
      sessionId: sid,
      clientId: cid,
      jti,
      used: true,
    };
  } catch (err) {
    await clientConn.query("ROLLBACK");
    logger.warn("consumeToken error:", err.message);
    throw err;
  } finally {
    clientConn.release();
  }
}

module.exports = {
  createToken,
  consumeToken,
};
