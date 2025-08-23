import { Router } from "express";
import { z } from "zod";
import { getMoonFor } from "../services/moon.js";

const router = Router();

// Union: (lat/lon) OR (location string) OR (useClientIp flag)
const qSchema = z.union([
  z.object({
    lat: z.coerce.number().min(-90).max(90),
    lon: z.coerce.number().min(-180).max(180),
  }),
  z.object({
    location: z.string().trim().min(1),
  }),
  z.object({
    useClientIp: z.literal("1"),
  }),
]);

router.get("/today", async (req, res, next) => {
  try {
    const q = qSchema.parse(req.query);

    // Try to get the user's real IP (works behind reverse proxies if trust proxy is set)
    // Express tip: app.set('trust proxy', true) if you're behind Render/NGINX/Heroku, etc.
    const forwarded = req.headers["x-forwarded-for"];
    const clientIp =
      Array.isArray(forwarded)
        ? forwarded[0]
        : (forwarded?.split(",")[0]?.trim() || req.ip);

    let out;
    if ("lat" in q) {
      out = await getMoonFor(new Date(), q.lat, q.lon);
    } else if ("location" in q) {
      out = await getMoonFor(new Date(), undefined, undefined, q.location);
    } else {
      out = await getMoonFor(new Date(), undefined, undefined, undefined, clientIp);
    }

    res.json(out);
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ error: "Invalid query", details: err.errors });
    }
    next(err);
  }
});

export default router;
