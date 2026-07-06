/**
 * POST /api/auth/login
 * Body: { email, password }
 * Response: { token, user: { id, email, role, membership, name, ... } }
 */
import { methodDispatch, badRequest, notFound, ok, signToken, comparePassword } from '../_lib/helpers.js';
import { connectMongo } from '../_lib/db.js';
import { User, ActivityLog } from '../_lib/models.js';

export default methodDispatch({
  POST: async (req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return badRequest(res, 'Email y password son obligatorios');
    }

    await connectMongo();

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return notFound(res, 'Usuario no encontrado');
    }

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      return badRequest(res, 'Password incorrecto');
    }

    const token = signToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      membership: user.membership,
    });

    // Log activity (best-effort, no bloqueante)
    ActivityLog.create({
      user_id: user._id,
      action: 'login',
      entity: 'user',
      entity_id: user._id.toString(),
      ip_address: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown',
    }).catch(() => { /* ignore */ });

    return ok(res, {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        membership: user.membership,
        kyc_status: user.kyc_status,
        reputation: user.reputation,
        wallet_address: user.wallet_address,
        avatar: user.avatar,
      },
    });
  },
});
