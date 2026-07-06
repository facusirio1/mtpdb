/**
 * POST /api/auth/register
 * Body: { email, password, name, accept_terms, accept_privacy, accept_kyc }
 * Response: { token, user }
 */
import { methodDispatch, badRequest, created, signToken, hashPassword } from '../_lib/helpers.js';
import { connectMongo } from '../_lib/db.js';
import { User, LegalConsent, ActivityLog } from '../_lib/models.js';

const CONSENT_VERSION = '2026.05';

export default methodDispatch({
  POST: async (req, res) => {
    const {
      email, password, name,
      accept_terms, accept_privacy, accept_kyc,
    } = req.body || {};

    if (!email || !password || !name) {
      return badRequest(res, 'Email, password y nombre son obligatorios');
    }

    if (!accept_terms || !accept_privacy || !accept_kyc) {
      return badRequest(res, 'Los 3 consentimientos legales son obligatorios');
    }

    if (password.length < 6) {
      return badRequest(res, 'La contraseña debe tener al menos 6 caracteres');
    }

    await connectMongo();

    const normalizedEmail = email.toLowerCase().trim();

    // Verificar que no existe
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return badRequest(res, 'Ya existe una cuenta con ese email');
    }

    // Crear usuario
    const password_hash = await hashPassword(password);
    const user = await User.create({
      email: normalizedEmail,
      password_hash,
      name: name.trim(),
      role: 'usuario',
      membership: 'basica',
      kyc_status: 'pendiente',
      reputation: 50,
    });

    // Registrar los 3 consentimientos legales (AMLD5/RGPD compliance)
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const now = new Date();

    await LegalConsent.insertMany([
      { user_id: user._id, document_type: 'terms',   version: CONSENT_VERSION, accepted_at: now, ip_address: ip, user_agent: userAgent },
      { user_id: user._id, document_type: 'privacy', version: CONSENT_VERSION, accepted_at: now, ip_address: ip, user_agent: userAgent },
      { user_id: user._id, document_type: 'kyc',     version: CONSENT_VERSION, accepted_at: now, ip_address: ip, user_agent: userAgent },
    ]);

    // Log activity
    await ActivityLog.create({
      user_id: user._id,
      action: 'register',
      entity: 'user',
      entity_id: user._id.toString(),
      ip_address: ip,
    });

    const token = signToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      membership: user.membership,
    });

    return created(res, {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        membership: user.membership,
        kyc_status: user.kyc_status,
        reputation: user.reputation,
      },
    });
  },
});
