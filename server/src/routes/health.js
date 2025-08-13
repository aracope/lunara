import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// Simple health route; also checks DB connectivity lightly
router.get('/', async (req, res, next) => {
  try {
    await pool.query('SELECT 1'); // quick ping
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
