-- 0002_api_keys.sql
-- Optional table to support multiple API keys per client.
BEGIN;

CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  key_hash varchar(128) NOT NULL,
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_rotated_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_api_keys_client_id ON api_keys(client_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_key_hash_unique ON api_keys(key_hash);

COMMIT;
