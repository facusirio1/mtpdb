/**
 * GET /api/auth/me
 * Headers: Authorization: Bearer <token>
 * Response: { user }
 */
import { methodDispatch, requireAuth, notFound, ok } from '../_lib/helpers.js';
import { connectMongo } from '../_lib/db.js';
import { User } from '../_lib/models.js';

export default methodDispatch({
  GET: async (req, res) => {
    const decoded = requireAuth(req, res);
    if (!decoded) return;

    await connectMongo();

    const user = await User.findById(decoded.id);
    if (!user) return notFound(res, 'Usuario no encontrado');

    return ok(res, {
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
