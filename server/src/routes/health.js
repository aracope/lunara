import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

/**
 * GET /health
 *
 * Liveness / readiness probe for the API.
 * - Confirms the app is up
 * - Performs a lightweight DB query (`SELECT 1`) to ensure connectivity
 *
 * Responses:
 *   200 { ok: true } if both server and DB are reachable
 *   500 { error } if DB connection fails (handled by error middleware)
 *
 * Usage:
 *   curl http://localhost:3001/health
 *   -> { "ok": true }
 *
 * Notes:
 * - Useful for uptime monitoring, load balancer health checks, or CI/CD smoke tests.
 * - Keep this route public & minimal — no auth, no heavy queries.
 */
router.get("/", async (req, res, next) => {
  try {
    // quick DB ping
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
