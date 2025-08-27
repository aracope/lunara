import { Router } from "express";
import { z } from "zod";
import { getMoonFor } from "../services/moon.js";
import tzLookup from "tz-lookup";

const router = Router();

// Union: (lat/lon) OR (location string) OR (useClientIp flag)
const qSchema = z.union([
  z.object({
    lat: z.coerce.number().min(-90).max(90),
    lon: z.coerce.number().min(-180).max(180),
  }),
  z.object({ location: z.string().trim().min(1) }),
  z.object({ useClientIp: z.literal("1") }),
]);

router.get("/today", async (req, res, next) => {
  try {
    const q = qSchema.parse(req.query);

    const trustProxy = req.app.get("trust proxy");
    let clientIp = req.ip;
    if (trustProxy) {
      const fwd = req.headers["x-forwarded-for"];
      const first = Array.isArray(fwd) ? fwd[0] : fwd?.split(",")[0]?.trim();
      clientIp = first || req.ip;
    }

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

    // add timezone
    try {
      const { lat, lon } = out.location || {};
      if (typeof lat === "number" && typeof lon === "number") {
        out.timezone = tzLookup(lat, lon); // e.g., "America/Boise"
      }
    } catch {}

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

// NEW: Get moon data for a specific date (YYYY-MM-DD) and location
const whereSchema = z.union([
  z.object({
    lat: z.coerce.number().min(-90).max(90),
    lon: z.coerce.number().min(-180).max(180),
  }),
  z.object({ location: z.string().trim().min(1) }),
]);

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
