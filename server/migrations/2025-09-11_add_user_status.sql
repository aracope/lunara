-- Add columns if they don't exist
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;

-- Ensure the status constraint exists (drop & recreate defensively)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_status_chk'
      AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_status_chk;
  END IF;
END
$$;

ALTER TABLE users
  ADD CONSTRAINT users_status_chk CHECK (status IN ('active','inactive'));

-- Optional but recommended (your code reads/writes this)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
-- Add columns if they don't exist
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;

-- Ensure the status constraint exists (drop & recreate defensively)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_status_chk'
      AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_status_chk;
  END IF;
END
$$;

ALTER TABLE users
  ADD CONSTRAINT users_status_chk CHECK (status IN ('active','inactive'));

-- Optional but recommended (your code reads/writes this)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
