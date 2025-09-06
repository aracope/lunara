import { Router } from "express";
import { z } from "zod";
import { pool } from "../../src/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/** Schemas
 * moonSnapshot: optional denormalized moon info stored alongside an entry.
 * - date_ymd: "YYYY-MM-DD" (UTC)
 * - tz: IANA timezone string (e.g., "America/Boise")
 * - lat/lon: both required together if present
 * - location_label: friendly label, max 120 chars (e.g., "Boise, ID")
 */
const moonSnapshotSchema = z
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

/**
 * Create payload
 *  - title, body: required
 *  - moon_data_id, tarot_card_id: optional foreign keys
 *  - moonSnapshot: optional denormalized JSON (camelCase in API, stored as moon_snapshot)
 */
const createSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  moon_data_id: z.number().int().positive().optional(),
  tarot_card_id: z.number().int().positive().optional(),
  // API accepts camelCase, DB stores as moon_snapshot
  moonSnapshot: moonSnapshotSchema.optional(),
});

/**
 * Update payload (PATCH)
 *  - Any field optional; at least one must be present
 *  - *_id fields accept null to clear FK
 *  - moonSnapshot accepts null to clear snapshot
 */
const updateSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    body: z.string().min(1).optional(),
    moon_data_id: z.number().int().positive().nullable().optional(),
    tarot_card_id: z.number().int().positive().nullable().optional(),
    moonSnapshot: moonSnapshotSchema.nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "No fields to update",
  });

/**
 * GET /journal
 * Auth: required
 * Returns the current user's entries, newest first.
 *
 * Response: { entries: JournalEntry[] }
 * JournalEntry: {
 *   id, user_id, title, body, tarot_card_id, moon_data_id, moon_snapshot,
 *   created_at, updated_at
 * }
 */
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, user_id, title, body, tarot_card_id, moon_data_id, moon_snapshot,
              created_at, updated_at
         FROM journal
        WHERE user_id = $1
        ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ entries: rows });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /journal
 * Auth: required
 * Create a new journal entry for the current user.
 *
 * Steps:
 *  - Validate body with zod
 *  - If FK fields provided, verify they exist (friendly 400 on invalid)
 *  - Insert entry; store moonSnapshot (if provided) as JSONB column moon_snapshot
 *
 * Request:
 *  { title, body, moon_data_id?, tarot_card_id?, moonSnapshot? }
 *
 * Responses:
 *  - 201 { entry }
 *  - 400 { error } on bad payload or invalid FK
 */
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const payload = createSchema.parse(req.body);

    // Optional FK checks -> friendly errors
    if (payload.moon_data_id != null) {
      const { rowCount } = await pool.query(
        "SELECT 1 FROM moon_data WHERE id = $1",
        [payload.moon_data_id]
      );
      if (!rowCount)
        return res.status(400).json({ error: "Invalid moon_data_id" });
    }
    if (payload.tarot_card_id != null) {
      const { rowCount } = await pool.query(
        "SELECT 1 FROM tarot_cards WHERE id = $1",
        [payload.tarot_card_id]
      );
      if (!rowCount)
        return res.status(400).json({ error: "Invalid tarot_card_id" });
    }

    const { rows } = await pool.query(
      `INSERT INTO journal
         (user_id, title, body, tarot_card_id, moon_data_id, moon_snapshot)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, title, body, tarot_card_id, moon_data_id, moon_snapshot,
                 created_at, updated_at`,
      [
        req.user.id,
        payload.title.trim(),
        payload.body,
        payload.tarot_card_id ?? null,
        payload.moon_data_id ?? null,
        payload.moonSnapshot ? JSON.stringify(payload.moonSnapshot) : null,
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

/** PATCH /journal/:id  * Auth: required
 * Update fields on a single entry owned by the current user.
 *
 * - Validates :id (positive integer)
 * - Dynamically builds a parameterized UPDATE
 * - Sets updated_at = NOW()
 *
 * Request: any subset of { title, body, moon_data_id, tarot_card_id, moonSnapshot }
 *   - To clear FKs/snapshot, send null for that field
 *
 * Responses:
 *  - 200 { entry }
 *  - 400 { error } on bad input/FKs
 *  - 404 { error: "Entry not found" } if not owned or missing
 */
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
    if (payload.moonSnapshot !== undefined) {
      fields.push(`moon_snapshot = $${idx++}`);
      values.push(
        payload.moonSnapshot ? JSON.stringify(payload.moonSnapshot) : null
      );
    }

    fields.push(`updated_at = NOW()`);

    const { rows } = await pool.query(
      `UPDATE journal
          SET ${fields.join(", ")}
        WHERE id = $${idx} AND user_id = $${idx + 1}
        RETURNING id, user_id, title, body, tarot_card_id, moon_data_id, moon_snapshot,
                  created_at, updated_at`,
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
    if (err.code === "23503") {
      return res
        .status(400)
        .json({ error: "Invalid foreign key (moon_data_id or tarot_card_id)" });
    }
    next(err);
  }
});

/** DELETE /journal/:id
 * Auth: required
 * Delete a single entry owned by the current user.
 *
 * Responses:
 *  - 200 { ok: true }
 *  - 400 { error } invalid id
 *  - 404 { error } not found or not owned by user
 */
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0)
      return res.status(400).json({ error: "Invalid id" });

    const { rowCount } = await pool.query(
      `DELETE FROM journal
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
