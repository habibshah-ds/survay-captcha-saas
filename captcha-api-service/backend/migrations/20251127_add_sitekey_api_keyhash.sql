-- backend/migrations/20251127_add_sitekey_api_keyhash.sql
-- Adds site_key, api_key_hash and api_key_last_rotated to clients table.
-- Adds captcha_sessions and survey_questions tables if missing.

BEGIN;

-- 1) clients: add site_key, api_key_hash, api_key_last_rotated, verify_ttl_seconds
ALTER TABLE IF EXISTS clients
  ADD COLUMN IF NOT EXISTS site_key varchar(48),
  ADD COLUMN IF NOT EXISTS api_key_hash varchar(128),
  ADD COLUMN IF NOT EXISTS api_key_last_rotated timestamptz,
  ADD COLUMN IF NOT EXISTS verify_ttl_seconds integer DEFAULT 300;

CREATE INDEX IF NOT EXISTS idx_clients_site_key ON clients(site_key);
CREATE INDEX IF NOT EXISTS idx_clients_api_key_hash ON clients(api_key_hash);

-- 2) captcha_sessions (new)
CREATE TABLE IF NOT EXISTS captcha_sessions (
  session_id varchar(64) PRIMARY KEY,
  client_id bigint REFERENCES clients(id) ON DELETE SET NULL,
  site_key varchar(48),
  status varchar(32) NOT NULL DEFAULT 'issued',
  altcha_params jsonb,
  question_id bigint,
  survey_answer jsonb,
  last_result text,
  token_jti varchar(64),
  token_expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  consumed_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_captcha_sessions_client_id ON captcha_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_captcha_sessions_token_jti ON captcha_sessions(token_jti);

-- 3) survey_questions: support question_type and JSON options
CREATE TABLE IF NOT EXISTS survey_questions (
  id bigserial PRIMARY KEY,
  client_id bigint REFERENCES clients(id) ON DELETE CASCADE,
  text text NOT NULL,
  question_type varchar(32) NOT NULL DEFAULT 'multiple_choice',
  options_json jsonb,
  scale_min integer,
  scale_max integer,
  correct_answer_json jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_survey_questions_client_id ON survey_questions(client_id);

COMMIT;
