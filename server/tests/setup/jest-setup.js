import { pool } from "../../src/db.js";

/**
 * Global Jest setup for server-side integration tests.
 *
 * Responsibilities:
 *   - resetDb(): truncate all tables between tests
 *   - beforeEach: ensure tests start with a clean DB
 *   - afterAll: gracefully close PG pool
 *
 * Truncates are wrapped in conditional checks so they only run if
 * tables exist (helpful for partial migrations or schema evolution).
 *
 * CASCADE ensures dependent rows (FKs) are also removed.
 * RESTART IDENTITY resets SERIAL/identity counters to 1.
 */

// global test helper: truncate all known tables
export async function resetDb() {
  await pool.query(`
     DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='journal') THEN
        EXECUTE 'TRUNCATE journal RESTART IDENTITY CASCADE';
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='moon_data') THEN
        EXECUTE 'TRUNCATE moon_data RESTART IDENTITY CASCADE';
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='tarot_cards') THEN
        EXECUTE 'TRUNCATE tarot_cards RESTART IDENTITY CASCADE';
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='users') THEN
        EXECUTE 'TRUNCATE users RESTART IDENTITY CASCADE';
      END IF;
    END$$;
  `);
}

// Clean DB before each test case
beforeEach(async () => {
  await resetDb();
});

// Ensure PG pool is closed after the whole test suite
afterAll(async () => {
  await pool.end();
});
