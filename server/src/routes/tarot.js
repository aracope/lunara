import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";
import { getCardOfDay, drawYesNo, getCardById } from "../services/tarot.js";

const router = Router();

/**
 * GET /tarot/daily
 *
 * Returns a deterministic "card of the day".
 * Optional query params are passed through to the service:
 *  - seed: string/number -> stable seed for deterministic result
 *  - date: "YYYY-MM-DD" -> pick a specific date instead of today
 *
 * Example:
 *   /tarot/daily?seed=user123&date=2025-09-06
 *
 * Response (proxy from Tarot API): { card: {...}, date: "YYYY-MM-DD" }
 */
router.get("/daily", async (req, res, next) => {
  try {
    const { seed, date } = req.query; // pass-through if provided
    const data = await getCardOfDay({ seed, date });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * Validation for optional typed question (kept to support future journal use)
 * POST /tarot/yesno accepts a body { question?: string (1..200) }
 */
const yesNoSchema = z.object({
  question: z.string().min(1).max(200).optional(),
});

/**
 * POST /tarot/yesno
 *
 * Draw a Yes/No/Maybe. If a question is provided, it’s sent to the upstream.
 * Request body (optional): { question?: string }
 *
 * Response (proxy): { answer: "Yes" | "No" | "Maybe", ... }
 */
router.post("/yesno", async (req, res, next) => {
  try {
    const parsed = yesNoSchema.safeParse(req.body);
    const data = await drawYesNo(parsed.success ? parsed.data : undefined);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /tarot/yesno
 *
 * Draw a Yes/No/Maybe without a question (simple button UX).
 * Response (proxy): { answer: "Yes" | "No" | "Maybe", ... }
 */
router.get("/yesno", async (_req, res, next) => {
  try {
    const data = await drawYesNo();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /tarot/cards/:id
 *
 * Fetch a single tarot card by numeric id (positive integer).
 *
 * Responses:
 *  - 200 { ...card }
 *  - 400 { error: "Invalid id" }
 *  - 404 { error: "Not found" }
 *
 * Note: This proxies to the Tarot service for the card payload.
 */
router.get("/cards/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid id" });
    }
    const data = await getCardById(id);
    if (!data) return res.status(404).json({ error: "Not found" });
    res.json(data);
  } catch (err) {
    if (err.status === 400)
      return res.status(400).json({ error: "Invalid id" });
    if (err.status === 404) return res.status(404).json({ error: "Not found" });
    next(err);
  }
});

/**
 * GET /tarot/cards
 *
 * List basic metadata for all cards from the local DB table `tarot_cards`.
 * (Useful for dropdowns, search, etc.)
 *
 * Response:
 *  { cards: [{ id, name, arcana, suit }, ...] }
 *
 * Ordering:
 *  - Major Arcana first
 *  - Then Minor by suit (NULLS FIRST)
 *  - Then by id
 */
router.get("/cards", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, arcana, suit
         FROM tarot_cards
         ORDER BY
           CASE WHEN arcana='Major' THEN 0 ELSE 1 END,
           suit NULLS FIRST,
           id`
    );
    res.json({ cards: rows });
  } catch (err) {
    next(err);
  }
});

export default router;
