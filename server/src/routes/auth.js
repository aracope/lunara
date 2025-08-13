import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { pool } from '../db.js';
import {  verifyJwt, signJwt } from '../utils/jwt.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(60).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

function cookieOpts() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,           // true on HTTPS (prod)
  };
}

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, displayName } = registerSchema.parse(req.body);

    const { rows: existing } = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    if (existing.length) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, display_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, display_name, created_at`,
      [email.toLowerCase(), passwordHash, displayName || null]
    );
    const user = rows[0];

    const token = signJwt({ sub: user.id });
    res.cookie('token', token, cookieOpts());
    res.status(201).json({ user });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid payload', details: err.errors });
    }
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const { rows } = await pool.query(
      'SELECT id, email, display_name, password_hash, created_at FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    const token = signJwt({ sub: user.id });
    res.cookie('token', token, cookieOpts());
    // strip hash before responding
    delete user.password_hash;
    res.json({ user });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid payload', details: err.errors });
    }
    next(err);
  }
});

router.post('/logout', (req, res) => {
  // Clear cookie by setting empty value & immediate expiry
  res.clearCookie('token', cookieOpts());
  res.json({ ok: true });
});

router.get('/me', async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(200).json({ user: null });

    const decoded = verifyJwt(token);
    if (!decoded?.sub) return res.status(200).json({ user: null });

    const { rows } = await pool.query(
      'SELECT id, email, display_name, created_at FROM users WHERE id = $1',
      [decoded.sub]
    );
    res.json({ user: rows[0] || null });
  } catch (err) {
    next(err);
  }
});

export default router;
