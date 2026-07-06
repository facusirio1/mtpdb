/**
 * MTP PLATFORM — Trazabilidad / activity log.
 */
import { Router } from 'express';
import { ActivityLog, ScoringHistory } from '../models/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const r = Router();

r.get('/my-scoring', requireAuth, async (req, res, next) => {
  try {
    const rows = await ScoringHistory.find({ user_id: req.user.id })
      .sort({ created_at: -1 }).limit(40).lean();
    res.json(rows);
  } catch (e) { next(e); }
});

r.get('/activity', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { entity = null, limit = 100 } = req.query;
    const filter = entity ? { entity } : {};
    const rows = await ActivityLog.find(filter)
      .populate('user_id', 'full_name email role')
      .sort({ created_at: -1 })
      .limit(Math.min(Number(limit) || 100, 500))
      .lean();
    res.json(rows);
  } catch (e) { next(e); }
});

export default r;
