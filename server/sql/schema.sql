-- ===========================================================================
-- Lunara DB Schema
-- ===========================================================================
-- Defines core data model for Lunara:
--   - users        : authentication + profiles
--   - tarot_cards  : static reference deck
--   - moon_data    : cached 3rd-party moon phase data
--   - journal      : user journal entries, linked to tarot/moon
--
-- Post-MVP tables (likes, follows, comments) are stubbed/dropped for now.
-- Script is order-safe and can reset a dev DB cleanly.
-- ===========================================================================
BEGIN;

-- Dev reset drops (order-safe)
DROP TABLE IF EXISTS entry_comments CASCADE;

-- (Post-MVP, if created)
DROP TABLE IF EXISTS entry_likes CASCADE;

-- (Post-MVP, if created)
DROP TABLE IF EXISTS user_follows CASCADE;

-- (Post-MVP, if created)
DROP TABLE IF EXISTS journal_entries CASCADE;

-- LEGACY: ensure it's gone
DROP TABLE IF EXISTS journal CASCADE;

DROP TABLE IF EXISTS moon_data CASCADE;

DROP TABLE IF EXISTS tarot_cards CASCADE;

DROP TABLE IF EXISTS users CASCADE;

-- =======
-- Users
-- =======
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  -- use a functional unique index below for case-insensitive email
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  -- Keep DB in sync with API validation (max 60 chars)
  CONSTRAINT users_display_name_len CHECK (
    display_name IS NULL
    OR char_length(display_name) <= 60
  )
);

-- Case-insensitive unique on email
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique ON users (lower(email));

-- ===============================
-- Tarot cards (reference data)
-- ===============================
CREATE TABLE tarot_cards (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  suit TEXT,
  -- NULL for Major Arcana
  arcana TEXT NOT NULL,
  -- 'Major' | 'Minor'
  upright_meaning TEXT,
  reversed_meaning TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Enforce documented values for arcana
  CONSTRAINT tarot_cards_arcana_chk CHECK (arcana IN ('Major', 'Minor'))
);

-- ======================================
-- Moon data cache (per date + lat/lon)
-- ======================================
CREATE TABLE moon_data (
  id SERIAL PRIMARY KEY,
  for_date DATE NOT NULL,
  lat NUMERIC(9, 6) NOT NULL CHECK (
    lat BETWEEN -90
    AND 90
  ),
  lon NUMERIC(9, 6) NOT NULL CHECK (
    lon BETWEEN -180
    AND 180
  ),
  phase TEXT,
  -- stored as timestamp (date + HH:MM combined in app)
  moonrise TIMESTAMPTZ,
  moonset TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Coordinate/date cache key (rounded in app to stabilize)
  UNIQUE (for_date, lat, lon)
);

-- ===========================================================================
-- Journal entries (per user) with optional moon/tarot attachments
-- FK behavior:
--   journal.user_id      -> users.id        (ON DELETE CASCADE)
--     -> deleting a user deletes all their journal entries
-- 
--   journal.tarot_card_id-> tarot_cards.id  (ON DELETE SET NULL)
--     -> if a tarot card is deleted, references are nulled
-- 
--   journal.moon_data_id -> moon_data.id    (ON DELETE SET NULL)
--     -> if cached moon data is pruned, journal remains intact
-- ===========================================================================
CREATE TABLE journal (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  tarot_card_id INTEGER REFERENCES tarot_cards(id) ON DELETE
  SET
    NULL,
    moon_data_id INTEGER REFERENCES moon_data(id) ON DELETE
  SET
    NULL,
    -- expected shape:
    -- {
    --   date_ymd: "YYYY-MM-DD",
    --   tz: "America/Boise",
    --   lat?: number, lon?: number,
    --   location_label?: string
    -- }
    moon_snapshot JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Keep DB in sync with API validation (max 200 chars)
    CONSTRAINT journal_title_len CHECK (char_length(title) <= 200)
);

-- ===============================
-- Helpful indexes (idempotent)
-- ===============================
-- fast lookup of entries by user
CREATE INDEX IF NOT EXISTS idx_journal_user ON journal(user_id);

-- for /journal list (newest first)
CREATE INDEX IF NOT EXISTS idx_journal_user_created ON journal(user_id, created_at DESC);

-- query moon cache by date
CREATE INDEX IF NOT EXISTS idx_moon_date ON moon_data(for_date);

-- allows filtering/searching by snapshot date inside JSONB
CREATE INDEX IF NOT EXISTS idx_journal_moon_snapshot_date ON journal ((moon_snapshot ->> 'date_ymd'));

-- General JSONB GIN index for flexible querying
CREATE INDEX IF NOT EXISTS idx_journal_moon_snapshot_gin ON journal USING gin (moon_snapshot);

-- ===================================================================
-- Triggers
--   - set_updated_at() ensures updated_at stays fresh w/o app logic
-- ===================================================================
CREATE
OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $ $ BEGIN NEW.updated_at = NOW();

RETURN NEW;

END;

$ $ LANGUAGE plpgsql;

CREATE TRIGGER trg_journal_updated_at BEFORE
UPDATE
  ON journal FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_users_updated_at BEFORE
UPDATE
  ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;