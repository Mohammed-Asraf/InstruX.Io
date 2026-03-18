-- Run this once in your Supabase SQL Editor (dashboard.supabase.com → SQL Editor)
-- Creates the table for shareable course links

CREATE TABLE IF NOT EXISTS shared_courses (
  id          TEXT        PRIMARY KEY,
  title       TEXT        NOT NULL,
  slides      JSONB       NOT NULL,
  learner     TEXT,
  strategy    TEXT,
  bloom_level TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Optional: auto-expire old courses after 90 days (comment out if not wanted)
-- ALTER TABLE shared_courses ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "public read" ON shared_courses FOR SELECT USING (true);
