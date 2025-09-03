import { pool } from "../../src/db.js";

// global test helpers
export async function resetDb() {
  // truncate in dependency order or use CASCADE
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

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await pool.end();
});
