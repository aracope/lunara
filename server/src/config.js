import "dotenv/config";

/**
 * Centralized configuration.
 * Reads from environment variables (via dotenv) with sensible defaults for dev.
 *
 * Required:
 *   - DB_URL / DATABASE_URL
 *   - JWT_SECRET (warns if not set)
 *
 * Optional:
 *   - PORT, CORS_ORIGIN, MOON_API_URL, MOON_API_KEY, TAROT_API_BASE
 */

// Port the server listens on (default: 3001)
export const PORT = process.env.PORT || 3001;

// Database connection URL (PostgreSQL).
// Supports either DB_URL or DATABASE_URL env var for flexibility.
export const DB_URL = process.env.DB_URL || process.env.DATABASE_URL;

// JWT secret used to sign/verify tokens.
// Default is "change-me" (unsafe for production).
export const JWT_SECRET = process.env.JWT_SECRET || "change-me";

// Allowed CORS origins (comma-separated string in env).
// Default: Vite dev server (http://localhost:5173).
export const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

// Moon API configuration (third-party: ipgeolocation.io)
export const MOON_API_URL =
  process.env.MOON_API_URL || "https://api.ipgeolocation.io/astronomy";
export const MOON_API_KEY = process.env.MOON_API_KEY || "";

// Tarot API base URL (our own Flask microservice).
// Default assumes it's running locally on port 5001.
export const TAROT_API_BASE =
  process.env.TAROT_API_BASE || "http://localhost:5001";

// Validate critical env vars
if (!DB_URL) {
  console.error("Missing DB_URL in environment");
  process.exit(1);
}
if (!JWT_SECRET || JWT_SECRET === "change-me") {
  console.warn("Using default JWT_SECRET. Set a strong value in .env.");
}
