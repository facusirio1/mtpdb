/**
 * GET /api/documents
 * Lista los documentos del usuario autenticado.
 */
import { methodDispatch, requireAuth, ok } from './_lib/helpers.js';
import { connectMongo } from './_lib/db.js';
import { Document } from './_lib/models.js';

export default methodDispatch({
  GET: async (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;

    await connectMongo();

    const docs = await Document.find({ user_id: user.id })
      .sort({ created_at: -1 })
      .lean();

    return ok(res, {
      items: docs.map(d => ({
        id: d._id.toString(),
        title: d.title,
        description: d.description,
        doc_type: d.doc_type,
        sector: d.sector,
        status: d.status,
        file_hash: d.file_hash,
        ai_risk: d.ai_risk,
        final_score: d.final_score,
        created_at: d.created_at,
        updated_at: d.updated_at,
      })),
    });
  },
});
