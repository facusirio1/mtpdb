/**
 * GET /api/marketplace?sector=X&doc_type=Y&search=Z
 * Response: { items: [...], total: N }
 *
 * Endpoint PÚBLICO — no requiere auth.
 * Muestra solo documentos que ya fueron validados (aprobados).
 */
import { methodDispatch, ok } from './_lib/helpers.js';
import { connectMongo } from './_lib/db.js';
import { Document, User } from './_lib/models.js';

export default methodDispatch({
  GET: async (req, res) => {
    await connectMongo();

    const { sector, doc_type, search, limit = 50 } = req.query || {};

    const filter = { status: 'validado' };
    if (sector)   filter.sector = sector;
    if (doc_type) filter.doc_type = doc_type;
    if (search) {
      filter.$or = [
        { title:       new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
      ];
    }

    const docs = await Document.find(filter)
      .sort({ updated_at: -1 })
      .limit(Math.min(Number(limit), 100))
      .lean();

    // Buscar usuarios propietarios (batch)
    const userIds = [...new Set(docs.map(d => d.user_id.toString()))];
    const users = await User.find({ _id: { $in: userIds } }, 'name role').lean();
    const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u]));

    const items = docs.map(d => ({
      id: d._id.toString(),
      doc_type: d.doc_type,
      title: d.title,
      description: d.description,
      sector: d.sector,
      created_at: d.created_at,
      updated_at: d.updated_at,
      owner: userMap[d.user_id.toString()]?.name || 'Anónimo',
      score: d.final_score,
    }));

    return ok(res, {
      items,
      total: items.length,
    });
  },
});
