import { Router } from 'express';
import { z } from 'zod';
import { getMoonFor } from '../services/moon.js';

const router = Router();

const qSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180)
});

router.get('/today', async (req, res, next) => {
  try {
    const { lat, lon } = qSchema.parse(req.query);
    const out = await getMoonFor(new Date(), lat, lon);
    res.json(out); // { date, phase, moonrise, moonset, zodiacSign, location }
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid query', details: err.errors });
    }
    next(err);
  }
});

export default router;
