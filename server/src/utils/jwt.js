import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';

const ACCESS_TOKEN_TTL = '7d'; // 1 week

export function signJwt(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

export function verifyJwt(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
