-- src/database/migrations/20251127_fix_sitekey_fk.sql
-- Migration: ensure clients table has site_key/api_key_hash columns and that survey_questions.client_id FK references clients(id).
-- This migration attempts to be careful (uses IF NOT EXISTS). Inspect before running in production.

BEGIN;

-- Add site_key / api_key_hash / last rotated if missing
ALTER TABLE IF EXISTS clients
  ADD COLUMN IF NOT EXISTS site_key text;

ALTER TABLE IF EXISTS clients
  ADD COLUMN IF NOT EXISTS api_key_hash text;

ALTER TABLE IF EXISTS clients
  ADD COLUMN IF NOT EXISTS api_key_last_rotated timestamptz;

-- Add unique index on site_key if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_clients_site_key'
  ) THEN
    BEGIN
      CREATE UNIQUE INDEX idx_clients_site_key ON clients (site_key);
    EXCEPTION WHEN others THEN
      -- ignore
      RAISE NOTICE 'idx_clients_site_key create skipped: %', SQLERRM;
    END;
  END IF;
END$$;

-- Ensure survey_questions.client_id column exists
ALTER TABLE IF EXISTS survey_questions
  ADD COLUMN IF NOT EXISTS client_id integer;

-- Now (re)create FK if possible
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'survey_questions_client_id_fkey') THEN
    -- constraint exists, do nothing
    RAISE NOTICE 'FK survey_questions_client_id_fkey exists';
  ELSE
    BEGIN
      ALTER TABLE survey_questions
        ADD CONSTRAINT survey_questions_client_id_fkey
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not add FK survey_questions_client_id_fkey: %', SQLERRM;
    END;
  END IF;
END$$;

COMMIT;
