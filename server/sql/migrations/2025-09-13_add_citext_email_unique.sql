BEGIN;

-- 1) Remove old functional unique index if present
DROP INDEX IF EXISTS users_email_lower_unique;

-- 2) Ensure citext extension exists (required for case-insensitive email column)
CREATE EXTENSION IF NOT EXISTS citext;

-- 3) Convert email column to citext and normalize values to lower-case while converting.
--    Using lower(email) preserves uniqueness semantics and migrates existing rows.
ALTER TABLE
    users
ALTER COLUMN
    email TYPE citext USING lower(email) :: citext;

-- 4) Add a named unique constraint on the (now case-insensitive) email column.
DO $$ BEGIN IF NOT EXISTS (
    SELECT
        1
    FROM
        pg_constraint
    WHERE
        conname = 'users_email_unique'
        AND conrelid = 'users' :: regclass
) THEN
ALTER TABLE
    users
ADD
    CONSTRAINT users_email_unique UNIQUE (email);

END IF;

END $$;

COMMIT;