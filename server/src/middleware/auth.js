/**
 * MTP PLATFORM — Middleware JWT.
 */
import { verifyToken } from '../auth.js';
import { User } from '../models/index.js';

export async function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = verifyToken(token);
    if (payload?.uid) {
      const user = await User.findById(payload.uid).lean();
      if (user) {
        req.user = { id: String(user._id), role: user.role, email: user.email, full_name: user.full_name, raw: user };
      }
    }
  } catch { /* ignore */ }
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Sesión no encontrada o expirada' });
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Sesión no encontrada' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tenés permisos para esta acción' });
    }
    next();
  };
}
