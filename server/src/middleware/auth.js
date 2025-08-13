import { verifyJwt } from '../utils/jwt.js';
import { pool } from '../db.js';

export async function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const decoded = verifyJwt(token);
  if (!decoded?.sub) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { rows } = await pool.query(
      'SELECT id, email, display_name, created_at FROM users WHERE id = $1',
      [decoded.sub]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
