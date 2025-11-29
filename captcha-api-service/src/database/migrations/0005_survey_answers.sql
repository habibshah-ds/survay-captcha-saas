-- 0005_survey_answers.sql
-- Captures the survey answers submitted as part of a captcha session.
BEGIN;

CREATE TABLE IF NOT EXISTS survey_answers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id uuid REFERENCES captcha_sessions(session_id) ON DELETE CASCADE,
  question_id uuid REFERENCES surveys(id) ON DELETE CASCADE,
  answer jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_survey_answers_session_id ON survey_answers(session_id);

COMMIT;
