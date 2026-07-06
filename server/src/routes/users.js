/**
 * MTP PLATFORM — Usuarios / admin.
 */
import { Router } from 'express';
import { User, Document, Validation, ScoringHistory, Nft } from '../models/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { logActivity } from '../helpers.js';

const r = Router();

r.get('/', requireAuth, requireRole('admin'), async (_req, res, next) => {
  try {
    const users = await User.find().sort({ created_at: -1 }).limit(200).lean();
    res.json(users.map(u => ({ ...u, id: String(u._id), _id: undefined, password_hash: undefined })));
  } catch (e) { next(e); }
});

r.patch('/:id/kyc', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { kyc_status } = req.body || {};
    if (!['pendiente','verificado','rechazado'].includes(kyc_status)) return res.status(400).json({ error: 'kyc_status inválido' });
    const update = { kyc_status };
    if (kyc_status === 'verificado') update.kyc_completed_at = new Date();
    await User.findByIdAndUpdate(req.params.id, update);
    await logActivity({ userId: req.user.id, action: 'kyc_update', entity: 'user', entityId: req.params.id,
                        details: `KYC → ${kyc_status}`, ip: req.ip });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

r.patch('/:id/role', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { role } = req.body || {};
    if (!['admin','usuario','verificador'].includes(role)) return res.status(400).json({ error: 'role inválido' });
    await User.findByIdAndUpdate(req.params.id, { role });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

r.patch('/:id/membership', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { membership } = req.body || {};
    if (!['basica','profesional','premium'].includes(membership)) return res.status(400).json({ error: 'membership inválido' });
    await User.findByIdAndUpdate(req.params.id, { membership });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

r.patch('/:id/status', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!['activo','suspendido'].includes(status)) return res.status(400).json({ error: 'status inválido' });
    await User.findByIdAndUpdate(req.params.id, { status });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

r.get('/stats/overview', requireAuth, requireRole('admin'), async (_req, res, next) => {
  try {
    const [usersTotal, verifsTotal, docsTotal, docsValidated, nftsTotal, validationsTotal] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'verificador' }),
      Document.countDocuments(),
      Document.countDocuments({ status: 'validado' }),
      Nft.countDocuments(),
      Validation.countDocuments(),
    ]);
    res.json({ usersTotal, verifsTotal, docsTotal, docsValidated, nftsTotal, validationsTotal });
  } catch (e) { next(e); }
});

r.get('/scoring/ranking', requireAuth, requireRole('admin'), async (_req, res, next) => {
  try {
    const top = await User.find({ status: 'activo' })
      .sort({ reputation: -1 }).limit(20)
      .select('full_name email role membership reputation kyc_status').lean();
    res.json(top.map(u => ({ ...u, id: String(u._id), _id: undefined })));
  } catch (e) { next(e); }
});

r.get('/scoring/recent', requireAuth, requireRole('admin'), async (_req, res, next) => {
  try {
    const recent = await ScoringHistory.find()
      .populate('user_id', 'full_name')
      .sort({ created_at: -1 }).limit(40).lean();
    res.json(recent);
  } catch (e) { next(e); }
});

export default r;
