import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import { pool } from "../db.js";
import { verifyJwt, signJwt } from "../utils/jwt.js";

const router = Router();

/**
 * Validation schemas (zod)
 * - registerSchema: email, password, optional displayName
 * - loginSchema: email + password
 * Rejects unknown keys for safety.
 */
const registerSchema = z
  .object({
    email: z.email({ message: "Please enter a valid email address." }),
    password: z
      .string()
      .trim()
      .min(8, "Password must be at least 8 characters."),
    displayName: z
      .string()
      .transform((v) => (typeof v === "string" ? v.trim() : v))
      .refine((v) => v === undefined || v === null || v.length <= 60, {
        message: "Display name must be 60 characters or fewer.",
      })
      .optional(),
  })
  .strict();

const loginSchema = z
  .object({
    email: z.email({ message: "Please enter a valid email address." }),
    password: z
      .string()
      .trim()
      .min(8, "Password must be at least 8 characters."),
  })
  .strict();

/**
 * Helper: cookieOpts
 *
 * Standardizes cookie options for the auth token.
 * - httpOnly: not accessible from JS
 * - sameSite: lax (works with most cross-site logins)
 * - secure: only true in production (HTTPS)
 */
function cookieOpts() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd, // true on HTTPS (prod)
  };
}

/**
 * POST /auth/register
 *
 * Register a new user.
 * Steps:
 *  - Validate input with zod
 *  - Check if email already exists
 *  - Hash password with bcrypt
 *  - Insert user into DB
 *  - Issue JWT in httpOnly cookie
 *
 * Dev Notes:
 * - Using `ON CONFLICT ON CONSTRAINT users_email_lower_unique DO NOTHING`
 *   ensures we avoid relying on Postgres error code 23505. This way the logic
 *   is clearer and portable: if no row is returned, we know the email already
 *   exists and can respond with 409.
 *
 * - `const user = rows[0]`:
 *   Each row is a plain JS object (not a class instance). Since we RETURN only
 *   one row, rows[0] is our single user object. We need this to issue the JWT
 *   and include in the response.
 *
 * - This keeps responses predictable:
 *   201 → created and logged in
 *   400 → validation failure
 *   409 → email conflict
 */
router.post("/register", async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return res.status(400).json({
        error: issue?.message || "Invalid input.",
        field: issue?.path?.[0] ?? null,
      });
    }
    const { email, password, displayName } = parsed.data;

    // Pre-check for existing email (friendlier than raw DB error)
    const { rows: existing } = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase()]
    );
    if (existing.length) {
      return res
        .status(409)
        .json({ error: "That email is already registered.", field: "email" });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Upsert-safe insert: avoid throwing unique-violation errors by using ON CONFLICT.
    // This uses your functional unique constraint name (users_email_lower_unique).
    // If there is a conflict, DO NOTHING and we'll detect that by the lack of returning rows.
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, display_name)
       VALUES ($1, $2, $3)
       ON CONFLICT ON CONSTRAINT users_email_lower_unique
       DO NOTHING
       RETURNING id, email, display_name, created_at`,
      [email.toLowerCase(), passwordHash, displayName || null]
    );

    if (!rows || rows.length === 0) {
      // No row returned -> conflict occurred (another process inserted same normalized email)
      return res
        .status(409)
        .json({ error: "That email is already registered.", field: "email" });
    }

    const user = rows[0];
    const token = signJwt({ sub: user.id });
    res.cookie("token", token, cookieOpts());
    return res.status(201).json({ user });
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /auth/login
 *
 * Log in an existing user.
 * Steps:
 *  - Validate input with zod
 *  - Fetch user by email
 *  - Compare password with bcrypt
 *  - Issue JWT in httpOnly cookie
 *
 * Responses:
 *  - 200 { user }
 *  - 400 { error, field } on bad input
 *  - 401 { error } if invalid email/password
 */
router.post("/login", async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return res.status(400).json({
        error: issue?.message || "Invalid input.",
        field: issue?.path?.[0] ?? null,
      });
    }
    const { email, password } = parsed.data;

    const { rows } = await pool.query(
      "SELECT id, email, display_name, password_hash, created_at, status FROM users WHERE email = $1",
      [email.toLowerCase()]
    );
    const user = rows[0];
    if (!user)
      return res.status(401).json({ error: "Invalid email or password" });

    if (user.status === "inactive") {
      return res.status(403).json({ error: "This account is deactivated." });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok)
      return res.status(401).json({ error: "Invalid email or password" });

    // track last successful login
    await pool.query("UPDATE users SET last_login_at = NOW() WHERE id = $1", [
      user.id,
    ]);

    const token = signJwt({ sub: user.id });
    res.cookie("token", token, cookieOpts());

    // never return the hash
    delete user.password_hash;
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});

/**
 * POST /auth/logout
 *
 * Clear the auth cookie (immediate expiry).
 * Response: { ok: true }
 */
router.post("/logout", (req, res) => {
  res.clearCookie("token", cookieOpts());
  res.json({ ok: true });
});

/**
 * GET /auth/me
 *
 * Get the current authenticated user, if any.
 * - Verifies JWT in cookie
 * - Looks up user by id
 *
 * Responses:
 *  - 200 { user } (or { user: null } if not logged in)
 */
router.get("/me", async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(200).json({ user: null });

    const decoded = verifyJwt(token);
    if (!decoded?.sub) return res.status(200).json({ user: null });

    const { rows } = await pool.query(
      "SELECT id, email, display_name, created_at FROM users WHERE id = $1",
      [decoded.sub]
    );
    return res.json({ user: rows[0] || null });
  } catch (err) {
    return next(err);
  }
});

const emailSchema = z
  .object({
    email: z.email({ message: "Please enter a valid email address." }),
  })
  .strict();

router.put("/email", async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const decoded = verifyJwt(token);
    if (!decoded?.sub) return res.status(401).json({ error: "Unauthorized" });

    const parsed = emailSchema.safeParse(req.body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return res
        .status(400)
        .json({ error: issue?.message || "Invalid email", field: "email" });
    }
    const email = parsed.data.email.toLowerCase();

    // conflict check
    const { rows: taken } = await pool.query(
      "SELECT 1 FROM users WHERE lower(email) = $1 AND id <> $2",
      [email, decoded.sub]
    );
    if (taken.length) {
      return res
        .status(409)
        .json({ error: "That email is already registered.", field: "email" });
    }

    const { rows } = await pool.query(
      "UPDATE users SET email = $1 WHERE id = $2 RETURNING id, email, display_name, created_at",
      [email, decoded.sub]
    );

    return res.json({ user: rows[0] });
  } catch (err) {
    return next(err);
  }
});

const passwordSchema = z
  .object({
    current_password: z
      .string()
      .trim()
      .min(8, "Current password must be at least 8 characters."),
    new_password: z
      .string()
      .trim()
      .min(8, "New password must be at least 8 characters."),
  })
  .strict();

router.put("/password", async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const decoded = verifyJwt(token);
    if (!decoded?.sub) return res.status(401).json({ error: "Unauthorized" });

    const parsed = passwordSchema.safeParse(req.body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return res.status(400).json({ error: issue?.message || "Invalid input" });
    }
    const { current_password, new_password } = parsed.data;

    const { rows } = await pool.query(
      "SELECT password_hash FROM users WHERE id = $1",
      [decoded.sub]
    );
    const row = rows[0];
    if (!row) return res.status(404).json({ error: "User not found" });

    const ok = await bcrypt.compare(current_password, row.password_hash);
    if (!ok)
      return res.status(401).json({ error: "Current password is incorrect" });

    const saltRounds = 12;
    const newHash = await bcrypt.hash(new_password, saltRounds);

    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
      newHash,
      decoded.sub,
    ]);

    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

// POST /auth/deactivate
router.post("/deactivate", async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const decoded = verifyJwt(token);
    if (!decoded?.sub) return res.status(401).json({ error: "Unauthorized" });

    await pool.query(
      "UPDATE users SET status = 'inactive', deactivated_at = NOW() WHERE id = $1",
      [decoded.sub]
    );

    // clear session cookie
    res.clearCookie("token", cookieOpts());
    return res.json({ ok: true });
  } catch (err) {
    return next(err);
  }
});

export default router;
