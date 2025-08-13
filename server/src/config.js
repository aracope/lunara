import 'dotenv/config';

export const PORT = process.env.PORT || 3001;
export const DB_URL = process.env.DB_URL || process.env.DATABASE_URL; // support either name
export const JWT_SECRET = process.env.JWT_SECRET || 'change-me';
export const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

if (!DB_URL) {
  console.error('Missing DB_URL in environment');
  process.exit(1);
}
if (!JWT_SECRET || JWT_SECRET === 'change-me') {
  console.warn('⚠️  Using default JWT_SECRET. Set a strong value in .env.');
}
