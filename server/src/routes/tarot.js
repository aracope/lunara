import { Router } from "express";
import { z } from "zod";
import { getCardOfDay, drawYesNo, getCardById } from "../services/tarot.js";

const router = Router();

// GET /tarot/daily
router.get("/daily", async (req, res, next) => {
  try {
    const { seed, date } = req.query; // pass-through if provided
    const data = await getCardOfDay({ seed, date });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// Optional typed question validation (kept for future support: journal?)
const yesNoSchema = z.object({
  question: z.string().min(1).max(200).optional(),
});

// POST /tarot/yesno  (optional body: { question })
router.post("/yesno", async (req, res, next) => {
  try {
    const parsed = yesNoSchema.safeParse(req.body);
    const data = await drawYesNo(parsed.success ? parsed.data : undefined);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /tarot/yesno  (no question required; ideal for simple button UX)
router.get("/yesno", async (_req, res, next) => {
  try {
    const data = await drawYesNo();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /tarot/cards/:id
router.get("/cards/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data = await getCardById(id);
    res.json(data);
  } catch (err) {
    if (err.status === 400)
      return res.status(400).json({ error: "Invalid id" });
    if (err.status === 404) return res.status(404).json({ error: "Not found" });
    next(err);
  }
});

export default router;
