/**
 * Helpers compartidos para Vercel Functions.
 * Reemplaza el middleware de Express con funciones que se llaman explícitamente.
 */
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// ─── CORS ────────────────────────────────────────────────────────
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
export function applyCors(req, res) {
  const origin = req.headers.origin || '*';
  const allowed = CORS_ORIGIN === '*' || CORS_ORIGIN.split(',').includes(origin);
  res.setHeader('Access-Control-Allow-Origin', allowed ? origin : CORS_ORIGIN.split(',')[0]);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

// ─── JWT ─────────────────────────────────────────────────────────
export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// ─── Auth middleware para Vercel ──────────────────────────────────
/**
 * Verifica el JWT del header Authorization: Bearer XXX
 * Devuelve el user decoded o envía 401 y devuelve null.
 *
 * Uso:
 *   const user = requireAuth(req, res);
 *   if (!user) return; // ya se envió 401
 */
export function requireAuth(req, res) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Token no provisto' });
    return null;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: 'Token inválido o expirado' });
    return null;
  }

  return decoded;
}

/**
 * Verifica que el user tenga un rol específico.
 * Uso:
 *   const user = requireRole(req, res, ['admin', 'verificador']);
 *   if (!user) return;
 */
export function requireRole(req, res, allowedRoles) {
  const user = requireAuth(req, res);
  if (!user) return null;

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  if (!roles.includes(user.role)) {
    res.status(403).json({ error: 'No autorizado para este endpoint' });
    return null;
  }

  return user;
}

// ─── Password hashing ────────────────────────────────────────────
export async function hashPassword(pw) {
  return bcrypt.hash(pw, 10);
}

export async function comparePassword(pw, hash) {
  return bcrypt.compare(pw, hash);
}

// ─── Response helpers ────────────────────────────────────────────
export function ok(res, data) {
  return res.status(200).json(data);
}

export function created(res, data) {
  return res.status(201).json(data);
}

export function badRequest(res, error) {
  return res.status(400).json({ error });
}

export function notFound(res, error = 'No encontrado') {
  return res.status(404).json({ error });
}

export function serverError(res, error) {
  console.error('[Server Error]', error);
  return res.status(500).json({ error: 'Error interno del servidor' });
}

// ─── Method matcher ──────────────────────────────────────────────
/**
 * Handler wrapper que despacha por método HTTP.
 * Uso:
 *   export default methodDispatch({
 *     GET: async (req, res) => { ... },
 *     POST: async (req, res) => { ... },
 *   });
 */
export function methodDispatch(handlers) {
  return async (req, res) => {
    if (applyCors(req, res)) return;

    const handler = handlers[req.method];
    if (!handler) {
      res.setHeader('Allow', Object.keys(handlers).join(', '));
      return res.status(405).json({ error: `Método ${req.method} no permitido` });
    }

    // ─── Parse body defensivo ─────────────────────────────────
    // Vercel Node runtime normalmente parsea req.body a objeto cuando
    // Content-Type es application/json, pero hay casos edge (payloads
    // grandes, headers mal seteados) donde llega como string o Buffer.
    // Este parseo defensivo garantiza que req.body sea un objeto.
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body != null) {
      if (typeof req.body === 'string') {
        try { req.body = JSON.parse(req.body); }
        catch { req.body = {}; }
      } else if (Buffer.isBuffer(req.body)) {
        try { req.body = JSON.parse(req.body.toString('utf8')); }
        catch { req.body = {}; }
      }
    }

    // Si por alguna razón no llegó body pero es POST con content-type JSON,
    // leerlo del stream manualmente (fallback)
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && !req.body) {
      const ct = req.headers['content-type'] || '';
      if (ct.includes('application/json')) {
        try {
          const chunks = [];
          for await (const c of req) chunks.push(c);
          const raw = Buffer.concat(chunks).toString('utf8');
          req.body = raw ? JSON.parse(raw) : {};
        } catch {
          req.body = {};
        }
      }
    }

    try {
      await handler(req, res);
    } catch (e) {
      return serverError(res, e);
    }
  };
}
