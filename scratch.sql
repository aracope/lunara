-- ===================================================================
-- Triggers
--   - set_updated_at() ensures updated_at stays fresh w/o app logic
-- ===================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $func$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$func$;

-- Recreate triggers idempotently
DROP TRIGGER IF EXISTS trg_journal_updated_at ON journal;
CREATE TRIGGER trg_journal_updated_at
BEFORE UPDATE ON journal
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

COMMIT;
