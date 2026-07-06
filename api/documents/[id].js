/**
 * GET /api/documents/[id]
 * Detalle de un documento del usuario autenticado.
 */
import { methodDispatch, requireAuth, notFound, ok } from '../_lib/helpers.js';
import { connectMongo } from '../_lib/db.js';
import { Document, Validation, Nft } from '../_lib/models.js';
import mongoose from 'mongoose';

export default methodDispatch({
  GET: async (req, res) => {
    const user = requireAuth(req, res);
    if (!user) return;

    const { id } = req.query;
    if (!mongoose.isValidObjectId(id)) return notFound(res, 'ID inválido');

    await connectMongo();

    const doc = await Document.findById(id);
    if (!doc) return notFound(res, 'Documento no encontrado');

    // Solo el dueño o admin puede ver
    if (doc.user_id.toString() !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const [validations, nft] = await Promise.all([
      Validation.find({ document_id: doc._id }).sort({ created_at: -1 }).lean(),
      Nft.findOne({ document_id: doc._id }).lean(),
    ]);

    return ok(res, {
      document: {
        id: doc._id.toString(),
        title: doc.title,
        description: doc.description,
        doc_type: doc.doc_type,
        sector: doc.sector,
        status: doc.status,
        file_hash: doc.file_hash,
        file_name: doc.file_name,
        file_size: doc.file_size,
        ai_risk: doc.ai_risk,
        ai_summary: doc.ai_summary,
        final_score: doc.final_score,
        assigned_to: doc.assigned_to,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
      },
      validations: validations.map(v => ({
        id: v._id.toString(),
        result: v.result,
        opinion: v.opinion,
        score_impact: v.score_impact,
        verifier_id: v.verifier_id,
        verifier_name: v.verifier_name,
        verifier_role: v.verifier_role,
        created_at: v.created_at,
      })),
      nft: nft ? {
        token_id: nft.token_id,
        tx_hash: nft.tx_hash,
        contract_address: nft.contract_address,
        chain_id: nft.chain_id,
        minted_at: nft.created_at,
      } : null,
    });
  },
});
