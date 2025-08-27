import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/** Schemas */
const moonRefSchema = z
  .object({
    date_ymd: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/),
    tz: z.string().min(1),
    lat: z.number().optional(),
    lon: z.number().optional(),
    location_label: z.string().max(120).optional(),
  })
  .refine(
    (v) => (v.lat == null && v.lon == null) || (v.lat != null && v.lon != null),
    {
      message: "lat and lon must be provided together",
      path: ["lat"],
    }
  );

const createSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  moon_data_id: z.number().int().positive().optional(),
  tarot_card_id: z.number().int().positive().optional(),
  moonRef: moonRefSchema.optional(),
});

const updateSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    body: z.string().min(1).optional(),
    moon_data_id: z.number().int().positive().nullable().optional(),
    tarot_card_id: z.number().int().positive().nullable().optional(),
    moonRef: moonRefSchema.nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "No fields to update",
  });

/** GET /journal — list current user’s entries (newest first) */
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, user_id, title, body, tarot_card_id, moon_data_id, moon_ref, created_at, updated_at
       FROM journal_entries
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ entries: rows });
  } catch (err) {
    next(err);
  }
});

/** POST /journal — create new entry for current user */
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const payload = createSchema.parse(req.body);

    // If foreign keys are provided, ensure they exist (optional but clearer errors)
    if (payload.moon_data_id) {
      const { rowCount } = await pool.query(
        "SELECT 1 FROM moon_data WHERE id = $1",
        [payload.moon_data_id]
      );
      if (!rowCount)
        return res.status(400).json({ error: "Invalid moon_data_id" });
    }
    if (payload.tarot_card_id) {
      const { rowCount } = await pool.query(
        "SELECT 1 FROM tarot_cards WHERE id = $1",
        [payload.tarot_card_id]
      );
      if (!rowCount)
        return res.status(400).json({ error: "Invalid tarot_card_id" });
    }

    const { rows } = await pool.query(
      `INSERT INTO journal_entries (user_id, title, body, tarot_card_id, moon_data_id, moon_ref)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, title, body, tarot_card_id, moon_data_id, moon_ref, created_at, updated_at`,
      [
        req.user.id,
        payload.title.trim(),
        payload.body,
        payload.tarot_card_id || null,
        payload.moon_data_id || null,
        payload.moonRef ? JSON.stringify(payload.moonRef) : null,
      ]
    );

    res.status(201).json({ entry: rows[0] });
  } catch (err) {
    if (err.name === "ZodError") {
      return res
        .status(400)
        .json({ error: "Invalid payload", details: err.errors });
    }
    next(err);
  }
});

/** PATCH /journal/:id — update only your entry */
router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0)
      return res.status(400).json({ error: "Invalid id" });

    const payload = updateSchema.parse(req.body);

    // Build dynamic SET list safely
    const fields = [];
    const values = [];
    let idx = 1;

    if (payload.title !== undefined) {
      fields.push(`title = $${idx++}`);
      values.push(payload.title.trim());
    }
    if (payload.body !== undefined) {
      fields.push(`body = $${idx++}`);
      values.push(payload.body);
    }
    if (payload.tarot_card_id !== undefined) {
      fields.push(`tarot_card_id = $${idx++}`);
      values.push(payload.tarot_card_id ?? null);
    }
    if (payload.moon_data_id !== undefined) {
      fields.push(`moon_data_id = $${idx++}`);
      values.push(payload.moon_data_id ?? null);
    }
    if (payload.moonRef !== undefined) {
      fields.push(`moon_ref = $${idx++}`);
      values.push(payload.moonRef ? JSON.stringify(payload.moonRef) : null);
    }

    fields.push(`updated_at = NOW()`);

    // Ownership check in WHERE clause
    const { rows } = await pool.query(
      `UPDATE journal_entries
         SET ${fields.join(", ")}
       WHERE id = $${idx} AND user_id = $${idx + 1}
       RETURNING id, user_id, title, body, tarot_card_id, moon_data_id, moon_ref, created_at, updated_at`,
      [...values, id, req.user.id]
    );

    const entry = rows[0];
    if (!entry) return res.status(404).json({ error: "Entry not found" });
    res.json({ entry });
  } catch (err) {
    if (err.name === "ZodError") {
      return res
        .status(400)
        .json({ error: "Invalid payload", details: err.errors });
    }
    // FK violations surface as code '23503'
    if (err.code === "23503") {
      return res
        .status(400)
        .json({ error: "Invalid foreign key (moon_data_id or tarot_card_id)" });
    }
    next(err);
  }
});

/** DELETE /journal/:id — delete only your entry */
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0)
      return res.status(400).json({ error: "Invalid id" });

    const { rowCount } = await pool.query(
      `DELETE FROM journal_entries
        WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );

    if (rowCount === 0)
      return res.status(404).json({ error: "Entry not found" });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
