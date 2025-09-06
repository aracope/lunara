import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";

// tokens expire in 1 week
const ACCESS_TOKEN_TTL = "7d";

/**
 * signJwt
 *
 * Create a JWT signed with the app's secret.
 *
 * @param {Object} payload - Data to encode in the token. Should include at least `sub` (user id).
 * @returns {string} A signed JWT string that expires in 7 days.
 *
 * Usage:
 *   const token = signJwt({ sub: user.id });
 *   res.cookie("token", token, { httpOnly: true });
 */
export function signJwt(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

/**
 * verifyJwt
 *
 * Verify and decode a JWT.
 *
 * @param {string} token - The JWT string (from cookie or Authorization header).
 * @returns {Object|null} Decoded payload if valid; null if invalid/expired.
 *
 * Usage:
 *   const decoded = verifyJwt(req.cookies.token);
 *   if (!decoded) return res.status(401).json({ error: "Unauthorized" });
 */
export function verifyJwt(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    // invalid, expired, or tampered token
    return null;
  }
}
