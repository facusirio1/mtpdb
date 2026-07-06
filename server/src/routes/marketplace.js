/**
 * MTP PLATFORM — Marketplace público.
 */
import { Router } from 'express';
import { User, Nft } from '../models/index.js';

const r = Router();

r.get('/sectors', async (_req, res, next) => {
  try {
    const sectors = await User.distinct('sector', { sector: { $nin: [null, ''] } });
    res.json(sectors.sort());
  } catch (e) { next(e); }
});

r.get('/professionals', async (req, res, next) => {
  try {
    const { sector, membership, q } = req.query;
    const filter = {
      status: 'activo',
      kyc_status: 'verificado',
      $or: [{ role: 'verificador' }, { entity_type: { $in: ['profesional','empresa','organizacion'] } }],
    };
    if (sector)     filter.sector = sector;
    if (membership) filter.membership = membership;
    if (q) {
      const re = new RegExp(q.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
      filter.$and = [{ $or: [{ full_name: re }, { company_name: re }, { specialty: re }] }];
    }

    const pros = await User.find(filter)
      .select('full_name company_name entity_type sector specialty membership reputation role')
      .sort({ membership: -1, reputation: -1 })
      .limit(60)
      .lean();

    res.json(pros.map(p => ({ ...p, id: String(p._id), _id: undefined })));
  } catch (e) { next(e); }
});

r.get('/stats', async (_req, res, next) => {
  try {
    const [professionals, agg, sectors, nfts_minted] = await Promise.all([
      User.countDocuments({ status: 'activo', kyc_status: 'verificado',
        $or: [{ role: 'verificador' }, { membership: { $in: ['profesional','premium'] } }] }),
      User.aggregate([
        { $match: { status: 'activo', kyc_status: 'verificado' } },
        { $group: { _id: null, avg: { $avg: '$reputation' } } },
      ]),
      User.distinct('sector', { sector: { $nin: [null, ''] }, kyc_status: 'verificado' }),
      Nft.countDocuments(),
    ]);
    res.json({
      professionals,
      avg_reputation: agg[0] ? Number(agg[0].avg.toFixed(1)) : 0,
      sectors: sectors.length,
      nfts_minted,
    });
  } catch (e) { next(e); }
});

export default r;
