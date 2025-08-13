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

-- Tarot cards (reference data; can be partially seeded or synced from Flask API later)
CREATE TABLE tarot_cards (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  suit TEXT,                           -- e.g., Cups, Swords, Wands, Pentacles; NULL for Major Arcana
  arcana TEXT NOT NULL,                -- 'Major' or 'Minor'
  upright_meaning TEXT,
  reversed_meaning TEXT,
  image_url TEXT
);

-- Moon data cache (per date + lat/lon)
CREATE TABLE moon_data (
  id SERIAL PRIMARY KEY,
  for_date DATE NOT NULL,
  lat NUMERIC(9,6) NOT NULL,
  lon NUMERIC(9,6) NOT NULL,
  phase TEXT,                          -- e.g. "Waxing Gibbous"
  moonrise TIMESTAMPTZ,
  moonset TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (for_date, lat, lon)
);

-- Journal entries, scoped to user; optionally associated to tarot card and moon record
CREATE TABLE journal_entries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  tarot_card_id INTEGER REFERENCES tarot_cards(id) ON DELETE SET NULL,
  moon_data_id INTEGER REFERENCES moon_data(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helpful indexes
CREATE INDEX idx_journal_user ON journal_entries(user_id);
CREATE INDEX idx_moon_date ON moon_data(for_date);
