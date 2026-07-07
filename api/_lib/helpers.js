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
export function methodDispatch(handlers) {
  return async (req, res) => {
    if (applyCors(req, res)) return;

    const handler = handlers[req.method];
    if (!handler) {
      res.setHeader('Allow', Object.keys(handlers).join(', '));
      return res.status(405).json({ error: `Método ${req.method} no permitido` });
    }

    // ─── Parse body unificado y ultra agresivo ───────────────────
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      try {
        if (req.body != null) {
          if (typeof req.body === 'string') {
            req.body = JSON.parse(req.body);
          } else if (Buffer.isBuffer(req.body)) {
            req.body = JSON.parse(req.body.toString('utf8'));
          }
        }
        
        // Si el body sigue vacío o desestructurado incorrectamente, leemos el stream
        if (!req.body || Object.keys(req.body).length === 0) {
          const ct = req.headers['content-type'] || '';
          if (ct.includes('application/json')) {
            const chunks = [];
            for await (const c of req) chunks.push(c);
            const raw = Buffer.concat(chunks).toString('utf8');
            if (raw) {
              req.body = JSON.parse(raw);
            }
          }
        }

        // Si por un error del frontend los datos venían anidados como { body: { email, ... } }
        // lo aplanamos de forma automática para rescatar la petición.
        if (req.body && req.body.body && Object.keys(req.body).length === 1) {
          req.body = req.body.body;
        }

      } catch (err) {
        console.warn('[Parser Warning] No se pudo parsear el body:', err.message);
        req.body = {};
      }
    }

    try {
      await handler(req, res);
    } catch (e) {
      return serverError(res, e);
    }
  };
}
