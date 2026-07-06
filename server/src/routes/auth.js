/**
 * MTP PLATFORM — Rutas de autenticación.
 */
import { Router } from 'express';
import { User, LegalConsent } from '../models/index.js';
import { hashPassword, verifyPassword, signToken } from '../auth.js';
import { logActivity, publicUser } from '../helpers.js';
import { requireAuth } from '../middleware/auth.js';

const r = Router();
const TERMS_VERSION = '2026.05';

r.post('/register', async (req, res, next) => {
  try {
    const {
      full_name, email, password,
      entity_type = 'empresa', company_name = null, document_id = null,
      sector = null, as_verifier = false, specialty = null,
      membership = 'basica', wallet_address = null,
      accept_terms = false, accept_privacy = false, accept_kyc = false,
    } = req.body || {};

    if (!full_name || !email || !password) return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' });
    if (!accept_terms || !accept_privacy || !accept_kyc) return res.status(400).json({ error: 'Debés aceptar Términos, Privacidad y KYC/AML' });
    if (password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ error: 'Ya existe una cuenta con ese email' });

    const role = as_verifier ? 'verificador' : 'usuario';
    const user = await User.create({
      full_name, email: email.toLowerCase(),
      password_hash: await hashPassword(password),
      role, entity_type, company_name, document_id, sector,
      specialty: as_verifier ? specialty : null,
      membership, wallet_address,
      terms_accepted_at: new Date(), terms_version: TERMS_VERSION,
      privacy_accepted_at: new Date(), kyc_consent: true,
    });

    const ua = (req.headers['user-agent'] || '').slice(0, 255);
    await LegalConsent.insertMany([
      { user_id: user._id, document_type: 'terms',   version: TERMS_VERSION, ip_address: req.ip, user_agent: ua },
      { user_id: user._id, document_type: 'privacy', version: TERMS_VERSION, ip_address: req.ip, user_agent: ua },
      { user_id: user._id, document_type: 'kyc',     version: TERMS_VERSION, ip_address: req.ip, user_agent: ua },
    ]);

    await logActivity({ userId: user._id, action: 'register', entity: 'user', entityId: user._id,
                        details: `Alta de cuenta (${role}) — consentimientos v${TERMS_VERSION}`, ip: req.ip });

    const token = signToken({ uid: String(user._id), role: user.role });
    res.json({ user: publicUser(user), token });
  } catch (e) { next(e); }
});

r.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña son obligatorios' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
    if (user.status === 'suspendido') return res.status(403).json({ error: 'Cuenta suspendida' });

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    await logActivity({ userId: user._id, action: 'login', entity: 'user', entityId: user._id, details: 'Inicio de sesión', ip: req.ip });

    const token = signToken({ uid: String(user._id), role: user.role });
    res.json({ user: publicUser(user), token });
  } catch (e) { next(e); }
});

r.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ user: publicUser(user) });
  } catch (e) { next(e); }
});

export default r;
