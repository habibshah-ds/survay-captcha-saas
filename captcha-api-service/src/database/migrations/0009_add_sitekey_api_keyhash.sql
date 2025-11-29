-- 0009_add_sitekey_api_keyhash.sql
-- Ensure clients table contains site_key and api_key_hash columns (idempotent).
BEGIN;

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS site_key varchar(64),
  ADD COLUMN IF NOT EXISTS api_key_hash varchar(128),
  ADD COLUMN IF NOT EXISTS api_key_last_rotated timestamptz,
  ADD COLUMN IF NOT EXISTS verify_ttl_seconds integer DEFAULT 300;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_site_key_unique_2 ON clients(site_key);
CREATE INDEX IF NOT EXISTS idx_clients_api_key_hash ON clients(api_key_hash);

COMMIT;
