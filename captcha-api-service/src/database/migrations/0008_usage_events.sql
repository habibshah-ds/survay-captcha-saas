-- 0008_usage_events.sql
-- Lightweight analytics / audit log for events.
BEGIN;

CREATE TABLE IF NOT EXISTS usage_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  event_type varchar(64) NOT NULL,  -- captcha_solved | captcha_failed | rate_limit | api_error
  ip_address inet,
  user_agent text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usage_events_client_id ON usage_events(client_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_event_type ON usage_events(event_type);

COMMIT;
