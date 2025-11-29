-- 0007_verification_tokens.sql
-- For email verification, password resets, etc. token_hash stores hashed value.
BEGIN;

CREATE TABLE IF NOT EXISTS verification_tokens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  token_hash varchar(128) NOT NULL,
  token_type varchar(32) NOT NULL, -- verify_email | reset_password
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_tokens_client_id ON verification_tokens(client_id);

COMMIT;
