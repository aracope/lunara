-- Drop tables for clean resets during development (optional)
DROP TABLE IF EXISTS journal_entries CASCADE;
DROP TABLE IF EXISTS moon_data CASCADE;
DROP TABLE IF EXISTS tarot_cards CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tarot cards (reference data)
CREATE TABLE tarot_cards (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  suit TEXT,                -- NULL for Major Arcana
  arcana TEXT NOT NULL,     -- 'Major' or 'Minor'
  upright_meaning TEXT,
  reversed_meaning TEXT,
  image_url TEXT
);

-- Moon data cache (per date + lat/lon)
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
);

-- Journal entries (per user). Keep moon_data_id for future caching.
CREATE TABLE journal_entries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  tarot_card_id INTEGER REFERENCES tarot_cards(id) ON DELETE SET NULL,
  moon_data_id INTEGER REFERENCES moon_data(id) ON DELETE SET NULL,
  moon_ref JSONB,  -- { date_ymd, tz, lat?, lon?, location_label? }
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helpful indexes
CREATE INDEX idx_journal_user ON journal_entries(user_id);
CREATE INDEX idx_journal_user_created ON journal_entries(user_id, created_at DESC);
CREATE INDEX idx_moon_date ON moon_data(for_date);
CREATE INDEX idx_journal_moon_ref_date
  ON journal_entries (((moon_ref->>'date_ymd')::date));

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_journal_entries_updated_at
BEFORE UPDATE ON journal_entries
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
