-- 0003_captcha_sessions.sql
-- Tracks captcha sessions, issued tokens (jti), and single-use consumption.
BEGIN;

CREATE TABLE IF NOT EXISTS captcha_sessions (
  session_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  site_key varchar(64),
  status varchar(32) NOT NULL DEFAULT 'issued',
  altcha_params jsonb,
  question_id uuid,
  survey_answer jsonb,
  last_result text,
  token_jti varchar(128),
  token_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_captcha_sessions_client_id ON captcha_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_captcha_sessions_token_jti ON captcha_sessions(token_jti);

COMMIT;
