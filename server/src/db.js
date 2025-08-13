import pkg from 'pg';
import { DB_URL } from './config.js';

const { Pool } = pkg;

export const pool = new Pool({
  connectionString: DB_URL,
  // If you later deploy to a managed Postgres that requires SSL:
  // ssl: { rejectUnauthorized: false }
});

// Optional sanity check (can help detect bad URLs early)
pool.on('error', (err) => {
  console.error('Unexpected PG Pool error', err);
});
