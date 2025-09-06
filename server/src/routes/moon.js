import { Router } from "express";
import { z } from "zod";
import { getMoonFor } from "../services/moon.js";
import tzLookup from "tz-lookup";

const router = Router();

/**
 * Validation: query shapes for location
 * ------------------------------------
 * Accept exactly ONE of:
 *  - { lat, lon }   : numbers (coerced), lat ∈ [-90,90], lon ∈ [-180,180]
 *  - { location }   : non-empty string (e.g., "Boise, ID" or "Paris, FR")
 *  - { useClientIp} : literal "1" (derive IP from request)
 */
const qSchema = z.union([
  z.object({
    lat: z.coerce.number().min(-90).max(90),
    lon: z.coerce.number().min(-180).max(180),
  }),
  z.object({ location: z.string().trim().min(1) }),
  z.object({ useClientIp: z.literal("1") }),
]);

/**
 * GET /moon/today
 *
 * Get today's moon data for a place specified by:
 *   - lat/lon, or
 *   - location string, or
 *   - useClientIp=1 (uses request IP; respects "trust proxy")
 *
 * Query (one of):
 *   /moon/today?lat=43.61&lon=-116.20
 *   /moon/today?location=Boise, ID
 *   /moon/today?useClientIp=1
 *
 * Behavior:
 *  - Normalizes input via service -> { phase, moonrise, moonset, zodiacSign, location{...} }
 *  - Adds `timezone` using tz-lookup from normalized coordinates (best-effort)
 *
 * Response 200:
 * {
 *   date: "YYYY-MM-DD",
 *   phase: string|null,
 *   moonrise: "YYYY-MM-DD HH:MM:SS"|null,
 *   moonset: "YYYY-MM-DD HH:MM:SS"|null,
 *   zodiacSign: string|null,
 *   location: { lat, lon, city, state, country, locality, elevation },
 *   timezone?: "Area/City"
 * }
 *
 * Errors:
 *  - 400 { error, details } invalid query
 *  - 502 { error } upstream issues (from service)
 */
router.get("/today", async (req, res, next) => {
  try {
    const q = qSchema.parse(req.query);

    // Determine client IP (when useClientIp=1), honoring "trust proxy"
    const trustProxy = req.app.get("trust proxy");
    let clientIp = req.ip;
    if (trustProxy) {
      const fwd = req.headers["x-forwarded-for"];
      const first = Array.isArray(fwd) ? fwd[0] : fwd?.split(",")[0]?.trim();
      clientIp = first || req.ip;
    }

    // Route to service according to query shape
    let out;
    if ("lat" in q) {
      out = await getMoonFor(new Date(), q.lat, q.lon);
    } else if ("location" in q) {
      out = await getMoonFor(new Date(), undefined, undefined, q.location);
    } else {
      out = await getMoonFor(
        new Date(),
        undefined,
        undefined,
        undefined,
        clientIp
      );
    }

    // Best-effort timezone from normalized coordinates
    try {
      const { lat, lon } = out.location || {};
      if (typeof lat === "number" && typeof lon === "number") {
        out.timezone = tzLookup(lat, lon);
      }
    } catch {
      /* swallow tz lookup errors */
    }

    res.json(out);
  } catch (err) {
    if (err.name === "ZodError") {
      return res
        .status(400)
        .json({ error: "Invalid query", details: err.errors });
    }
    next(err);
  }
});

/**
 * Validation: explicit-date where-clause
 * - Accepts either coords OR location string (no IP option here)
 */
const whereSchema = z.union([
  z.object({
    lat: z.coerce.number().min(-90).max(90),
    lon: z.coerce.number().min(-180).max(180),
  }),
  z.object({ location: z.string().trim().min(1) }),
]);

/**
 * GET /moon/on
 *
 * Moon data for a specific date (UTC).
 *
 * Query:
 *   date=YYYY-MM-DD  (required, UTC)
 *   AND one of:
 *     lat,lon=...            -> /moon/on?date=2025-09-06&lat=43.61&lon=-116.20
 *     location="City, CC"    -> /moon/on?date=2025-09-06&location=Boise, ID
 *
 * Behavior:
 *  - Converts date to a Date at 00:00:00Z
 *  - Resolves place via service (same normalization as /today)
 *  - Adds best-effort `timezone` derived from coords
 *
 * Responses / Errors: same shape as /today (200 on success; 400 on invalid query)
 */
router.get("/on", async (req, res, next) => {
  try {
    const dateStr = z
      .string()
      .regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)
      .parse(req.query.date);
    const where = whereSchema.parse(req.query);

    const date = new Date(`${dateStr}T00:00:00Z`);

    let out;
    if ("lat" in where) out = await getMoonFor(date, where.lat, where.lon);
    else out = await getMoonFor(date, undefined, undefined, where.location);

    try {
      const { lat, lon } = out.location || {};
      if (typeof lat === "number" && typeof lon === "number") {
        out.timezone = tzLookup(lat, lon);
      }
    } catch {}

    res.json(out);
  } catch (err) {
    if (err.name === "ZodError")
      return res
        .status(400)
        .json({ error: "Invalid query", details: err.errors });
    next(err);
  }
});

export default router;
