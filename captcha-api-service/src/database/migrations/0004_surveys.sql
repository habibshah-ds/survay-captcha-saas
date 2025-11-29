-- 0004_surveys.sql
-- Survey questions that are presented during captcha solving.
BEGIN;

CREATE TABLE IF NOT EXISTS surveys (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  text text NOT NULL,
  question_type varchar(32) NOT NULL DEFAULT 'multiple_choice', -- multiple_choice | image_choice | rating | text
  options_json jsonb,   -- for multiple_choice / image_choice [{id,label,image_url},...]
  scale_min integer,    -- for rating
  scale_max integer,    -- for rating
  correct_answer_json jsonb,
  required boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_surveys_client_id ON surveys(client_id);

COMMIT;
