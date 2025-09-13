import { Router } from "express";
import { z } from "zod";
import { pool } from "../../src/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/** Schemas
 * -------
 * moonSnapshot (camelCase in API; stored as JSONB column `moon_snapshot`):
 *  - date_ymd (required): "YYYY-MM-DD" (UTC reference date)
 *  - tz (optional): IANA timezone, e.g. "America/Boise"
 *  - lat/lon (optional as a pair): both must be present if either is provided
 *  - location_label (optional): friendly human label (e.g., "Boise, ID")
 *  - phase/moonrise/moonset/zodiacSign (optional): enriched fields for
 *    instant rendering/offline resilience; if missing, the client can fetch.
 */
const moonSnapshotSchema = z
  .object({
    date_ymd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    tz: z.string().min(1).optional().nullable(),
    lat: z.number().optional().nullable(),
    lon: z.number().optional().nullable(),
    location_label: z.string().optional().nullable(),
    // optional enriched fields for instant rendering
    phase: z.string().optional().nullable(),
    moonrise: z.string().optional().nullable(),
    moonset: z.string().optional().nullable(),
    zodiacSign: z.string().optional().nullable(),
  })
  .refine(
    (s) =>
      // lat & lon must be both present or both absent/null
      (s.lat == null && s.lon == null) ||
      (typeof s.lat === "number" && typeof s.lon === "number"),
    { message: "lat/lon must be provided together" }
  )
  .strict();

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
    tarot_card_id: z.number().int().positive().nullable().optional(),
    moon_data_id: z.number().int().positive().nullable().optional(),
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
      `SELECT id, user_id, title, body, tarot_card_id, moon_data_id, moon_snapshot, created_at, updated_at
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
 * Behavior:
 *  - Validates :id (positive integer)
 *  - Validates body (at least one field)
 *  - FK fields (tarot_card_id, moon_data_id) accept null to clear
 *  - moonSnapshot accepts null to clear
 *  - Dynamically builds a parameterized UPDATE; sets updated_at = NOW()
 *
 * Request (any subset):
 *  { title?, body?, tarot_card_id?, moon_data_id?, moonSnapshot? }
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

    // Optional FK checks before update (only when non-null values provided)
    if (payload.tarot_card_id !== undefined && payload.tarot_card_id !== null) {
      const { rowCount } = await pool.query(
        "SELECT 1 FROM tarot_cards WHERE id = $1",
        [payload.tarot_card_id]
      );
      if (!rowCount)
        return res.status(400).json({ error: "Invalid tarot_card_id" });
    }
    if (payload.moon_data_id !== undefined && payload.moon_data_id !== null) {
      const { rowCount } = await pool.query(
        "SELECT 1 FROM moon_data WHERE id = $1",
        [payload.moon_data_id]
      );
      if (!rowCount)
        return res.status(400).json({ error: "Invalid moon_data_id" });
    }

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

    // Ensure we are actually updating something (should be guaranteed by schema)
    if (fields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    fields.push(`updated_at = NOW()`);

    const { rows } = await pool.query(
      `UPDATE journal
          SET ${fields.join(", ")}
        WHERE id = $${idx} AND user_id = $${idx + 1}
        RETURNING id, user_id, title, body, tarot_card_id, moon_data_id, moon_snapshot, created_at, updated_at`,
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
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const { rowCount } = await pool.query(
      `DELETE FROM journal
        WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: "Entry not found" });
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
