import { Router } from 'express';
import { z } from 'zod';
import { getCardOfDay, drawYesNo, getCardById } from '../services/tarot.js';

const router = Router();

router.get('/daily', async (req, res, next) => {
  try {
    const data = await getCardOfDay();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// If you want to accept a question, validate it (optional)
const yesNoSchema = z.object({
  question: z.string().min(1).max(200).optional()
});

router.post('/yesno', async (req, res, next) => {
  try {
    // Optional: forward a question to Flask if supported
    const parsed = yesNoSchema.safeParse(req.body);
    const data = await drawYesNo(parsed.success ? parsed.data : undefined);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/cards/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data = await getCardById(id);
    res.json(data);
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ error: 'Invalid id' });
    if (err.status === 404) return res.status(404).json({ error: 'Not found' });
    next(err);
  }
});

export default router;

