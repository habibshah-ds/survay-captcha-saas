-- 0001_create_clients.sql
-- Creates the clients table which holds each site owner (customer).
BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text,
  email text,
  plan_type varchar(32) DEFAULT 'standard',
  monthly_limit bigint DEFAULT 1000,
  current_usage bigint DEFAULT 0,
  site_key varchar(64),
  api_key_hash varchar(128),
  api_key_last_rotated timestamptz,
  verify_ttl_seconds integer DEFAULT 300,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_site_key_unique ON clients(site_key);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

COMMIT;
