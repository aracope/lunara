-- =========
-- Lunara DB Schema
-- =========
-- Run order-safe drops for dev resets
DROP TABLE IF EXISTS entry_comments CASCADE;       -- (Post-MVP, if created)
DROP TABLE IF EXISTS entry_likes CASCADE;          -- (Post-MVP, if created)
DROP TABLE IF EXISTS user_follows CASCADE;         -- (Post-MVP, if created)
DROP TABLE IF EXISTS journal CASCADE;
DROP TABLE IF EXISTS moon_data CASCADE;
DROP TABLE IF EXISTS tarot_cards CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =========
-- Users
-- =========
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
  -- Post-MVP:
  -- , phone TEXT
  -- , phone_verified BOOLEAN NOT NULL DEFAULT FALSE
  -- , password_reset_token TEXT
  -- , password_reset_expires_at TIMESTAMPTZ
);

-- =========
-- Tarot cards (reference data)
-- =========
CREATE TABLE tarot_cards (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  suit TEXT,                -- NULL for Major Arcana
  arcana TEXT NOT NULL,     -- 'Major' | 'Minor'
  upright_meaning TEXT,
  reversed_meaning TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- Post-MVP:
  -- , yes_no_maybe TEXT CHECK (yes_no_maybe IN ('Yes','No','Maybe'))
);

-- =========
-- Moon data cache (per date + lat/lon)
-- =========
CREATE TABLE moon_data (
  id SERIAL PRIMARY KEY,
  for_date DATE NOT NULL,
  lat NUMERIC(9,6) NOT NULL CHECK (lat BETWEEN -90 AND 90),
  lon NUMERIC(9,6) NOT NULL CHECK (lon BETWEEN -180 AND 180),
  phase TEXT,
  moonrise TIMESTAMPTZ,
  moonset TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (for_date, lat, lon)
  -- Post-MVP (advanced lunar details):
  -- , zodiac_sign TEXT
  -- , illumination_percent NUMERIC(5,2)
  -- , moon_age_days NUMERIC(5,2)
  -- , distance_km NUMERIC(7,2)
  -- , next_full_moon TIMESTAMPTZ
  -- , next_new_moon TIMESTAMPTZ
);

-- =========
-- Journal entries (per user) with optional moon/tarot attachments
-- =========
CREATE TABLE journal (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  tarot_card_id INTEGER REFERENCES tarot_cards(id) ON DELETE SET NULL,
  moon_data_id INTEGER REFERENCES moon_data(id) ON DELETE SET NULL,
  moon_snapshot JSONB,  -- { date_ymd, tz, lat?, lon?, location_label? }
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- Post-MVP (social/community/sharing):
  -- , visibility TEXT CHECK (visibility IN ('private','followers','public')) DEFAULT 'private'
);

-- =========
-- Helpful indexes
-- =========
CREATE INDEX idx_journal_user ON journal(user_id);
CREATE INDEX idx_journal_user_created ON journal(user_id, created_at DESC);
CREATE INDEX idx_moon_date ON moon_data(for_date);

-- quick lookup by embedded moon_snapshot date
CREATE INDEX idx_journal_moon_snapshot_date
  ON journal (((moon_snapshot->>'date_ymd')::date));

-- =========
-- Triggers
-- =========
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_journal_updated_at
BEFORE UPDATE ON journal
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =========
-- Post-MVP community tables (commented out for now)
-- =========
-- CREATE TABLE user_follows (
--   follower_id INT REFERENCES users(id) ON DELETE CASCADE,
--   followee_id INT REFERENCES users(id) ON DELETE CASCADE,
--   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--   PRIMARY KEY (follower_id, followee_id)
-- );
--
-- CREATE TABLE entry_likes (
--   user_id INT REFERENCES users(id) ON DELETE CASCADE,
--   journal_entry_id INT REFERENCES journal(id) ON DELETE CASCADE,
--   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--   PRIMARY KEY (user_id, journal_entry_id)
-- );
--
-- CREATE TABLE entry_comments (
--   id SERIAL PRIMARY KEY,
--   journal_entry_id INT REFERENCES journal(id) ON DELETE CASCADE,
--   user_id INT REFERENCES users(id) ON DELETE SET NULL,
--   body TEXT NOT NULL,
--   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );
--
-- CREATE TRIGGER trg_entry_comments_updated_at
-- BEFORE UPDATE ON entry_comments
-- FOR EACH ROW EXECUTE FUNCTION set_updated_at();
