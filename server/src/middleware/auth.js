import { verifyJwt } from "../utils/jwt.js";
import { pool } from "../db.js";

/**
 * Middleware: requireAuth
 *
 * Protects routes by requiring a valid JWT.
 * - Reads the token from `req.cookies.token`
 * - Verifies and decodes the JWT
 * - Loads the user from the database by ID (sub claim in the token)
 * - Attaches the user object to `req.user` for downstream handlers
 * - Sends 401 Unauthorized if no valid token or user is found
 *
 * Usage:
 *   import { requireAuth } from './middleware/auth.js';
 *   app.get('/protected', requireAuth, (req, res) => {
 *     res.json({ message: `Welcome, ${req.user.display_name}` });
 *   });
 */

export async function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  // Decode and verify JWT (must contain `sub` = user ID)
  const decoded = verifyJwt(token);
  if (!decoded?.sub) return res.status(401).json({ error: "Unauthorized" });

  try {
    // Fetch user from DB
    const { rows } = await pool.query(
      "SELECT id, email, display_name, created_at FROM users WHERE id = $1",
      [decoded.sub]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    // Attach user to request object
    req.user = user;
    next();
  } catch (err) {
    // Pass database errors to error middleware
    next(err);
  }
}
