import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import { pool } from "../db.js";
import { verifyJwt, signJwt } from "../utils/jwt.js";

const router = Router();

const registerSchema = z
  .object({
    email: z.string().trim().email("Please enter a valid email address."),
    password: z
      .string()
      .trim()
      .min(8, "Password must be at least 8 characters."),
    // Optional: allow omitted or empty-after-trim to become undefined
    displayName: z
      .string()
      .transform((v) => (typeof v === "string" ? v.trim() : v))
      .refine((v) => v === undefined || v === null || v.length <= 60, {
        message: "Display name must be 60 characters or fewer.",
      })
      .optional(),
  })
  .strict(); // reject unknown keys with a clear message

const loginSchema = z
  .object({
    email: z.string().trim().email("Please enter a valid email address."),
    password: z
      .string()
      .trim()
      .min(8, "Password must be at least 8 characters."),
  })
  .strict();

function cookieOpts() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd, // true on HTTPS (prod)
  };
}

router.post("/register", async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      // Send the first field error (or swap to return all)
      const issue = parsed.error.issues[0];
      return res.status(400).json({
        error: issue?.message || "Invalid input.",
        field: issue?.path?.[0] ?? null,
      });
    }
    const { email, password, displayName } = parsed.data;

    // pre-check to give a friendlier message than a raw 23505
    const { rows: existing } = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase()]
    );
    if (existing.length) {
      return res
        .status(409)
        .json({ error: "That email is already registered.", field: "email" });
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    try {
      const { rows } = await pool.query(
        `INSERT INTO users (email, password_hash, display_name)
         VALUES ($1, $2, $3)
         RETURNING id, email, display_name, created_at`,
        [email.toLowerCase(), passwordHash, displayName || null]
      );
      const user = rows[0];

      const token = signJwt({ sub: user.id });
      res.cookie("token", token, cookieOpts());
      return res.status(201).json({ user });
    } catch (err) {
      // Map unique-violation to a clear 409 even if the functional index fires
      if (
        err?.code === "23505" &&
        (
          err?.constraint === "users_email_lower_unique" || // functional unique index
          err?.constraint === "users_email_key" || // plain UNIQUE on column
          (typeof err?.detail === "string" && err.detail.includes("(lower(email))"))
        )
      ) {
        return res.status(409).json({
          error: "That email is already registered.",
          field: "email",
        });
      }
      throw err; // let the general catch handle anything else
    }
  } catch (err) {
    // Any other error falls through to your error handler
    return next(err);
  }
});

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
      "SELECT id, email, display_name, password_hash, created_at FROM users WHERE email = $1",
      [email.toLowerCase()]
    );
    const user = rows[0];
    if (!user)
      return res.status(401).json({ error: "Invalid email or password" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok)
      return res.status(401).json({ error: "Invalid email or password" });

    const token = signJwt({ sub: user.id });
    res.cookie("token", token, cookieOpts());
    // strip hash before responding
    delete user.password_hash;
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});

router.post("/logout", (req, res) => {
  // Clear cookie by setting empty value & immediate expiry
  res.clearCookie("token", cookieOpts());
  res.json({ ok: true });
});

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

export default router;
