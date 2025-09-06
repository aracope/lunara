import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { CORS_ORIGIN } from "./config.js";

import healthRouter from "./routes/health.js";
import { notFound, errorHandler } from "./middleware/error.js";
import authRouter from "./routes/auth.js";
import journalRouter from "./routes/journal.js";
import moonRouter from "./routes/moon.js";
import tarotRouter from "./routes/tarot.js";

const app = express();

/**
 * Express App Initialization
 *
 * This file wires together all global middleware and routes for the Lunara backend.
 * Middleware order is important:
 *   1. Security headers (helmet)
 *   2. CORS handling
 *   3. JSON body parsing
 *   4. Cookie parsing
 *   5. Application routes
 *   6. 404 + error handlers (last)
 */

// Security headers
app.use(helmet());

// CORS support
// - Reads allowed origins from CORS_ORIGIN env (comma-separated list)
// - Enables credentials (cookies) for cross-origin requests
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));

// JSON body parsing
app.use(express.json());

// Parse cookies (for JWT tokens, etc.)
app.use(cookieParser());

/**
 * Advanced CORS handling
 *
 * - Splits env var CORS_ORIGIN into a whitelist
 * - Allows requests with no Origin (curl, same-origin server calls)
 * - Returns error for disallowed origins
 */
const allowList = (CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // allow curl / same-origin
      if (allowList.length === 0 || allowList.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

/**
 * Routes
 *
 * /health   - readiness/liveness check
 * /auth     - authentication (login, register, logout)
 * /journal  - journaling CRUD (requires auth)
 * /moon     - moon phase API wrapper + caching
 * /tarot    - tarot card draws (proxy to tarot API)
 */
app.use("/health", healthRouter);
app.use("/auth", authRouter);
app.use("/journal", journalRouter);
app.use("/moon", moonRouter);
app.use("/tarot", tarotRouter);

// Fallbacks: 404 + centralized error handler
app.use(notFound);
app.use(errorHandler);

export default app;
