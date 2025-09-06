import pkg from "pg";
import { DB_URL } from "./config.js";

const { Pool } = pkg;

/**
 * PostgreSQL Connection Pool
 *
 * Exports a shared `pool` instance for running queries across the app.
 * - Uses the connection string from config.js (DB_URL / DATABASE_URL)
 * - By default, maintains a pool of clients with automatic reuse
 * - Recommended usage: `const { rows } = await pool.query("SELECT ...", [params]);`
 *
 * Notes:
 * - If deploying to a managed Postgres that requires SSL (e.g. Heroku, Render),
 *   uncomment the `ssl` block below.
 * - Pool errors are logged so the app doesn’t silently hang on connection drops.
 */
export const pool = new Pool({
  connectionString: DB_URL,
  // ssl: { rejectUnauthorized: false }
});

// Log unexpected errors on idle clients
pool.on("error", (err) => {
  console.error("Unexpected PG Pool error", err);
});
