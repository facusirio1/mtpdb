/**
 * GET /api/verify/[identifier]
 * Verificación PÚBLICA de un documento por: hash SHA-256, token ID de NFT, o ID de documento.
 * No requiere auth. Devuelve info del certificado y su validación.
 */
import { methodDispatch, notFound, ok } from '../_lib/helpers.js';
import { connectMongo } from '../_lib/db.js';
import { Document, Validation, Nft, User } from '../_lib/models.js';
import mongoose from 'mongoose';

export default methodDispatch({
  GET: async (req, res) => {
    await connectMongo();

    const { identifier } = req.query;
    if (!identifier) return notFound(res, 'Identificador no provisto');

    let doc = null;

    // 1. Buscar por hash SHA-256 (64 chars hex)
    if (/^[a-f0-9]{64}$/i.test(identifier)) {
      doc = await Document.findOne({ file_hash: identifier.toLowerCase() });
    }

    // 2. Buscar por ID de MongoDB
    if (!doc && mongoose.isValidObjectId(identifier)) {
      doc = await Document.findById(identifier);
    }

    // 3. Buscar por NFT token ID
    if (!doc) {
      const nft = await Nft.findOne({ token_id: identifier });
      if (nft) doc = await Document.findById(nft.document_id);
    }

    if (!doc) {
      return notFound(res, 'Documento no encontrado');
    }

    // Buscar validaciones y NFT
    const [validations, nft, owner] = await Promise.all([
      Validation.find({ document_id: doc._id }).sort({ created_at: -1 }).lean(),
      Nft.findOne({ document_id: doc._id }).lean(),
      User.findById(doc.user_id, 'name').lean(),
    ]);

    return ok(res, {
      document: {
        id: doc._id.toString(),
        title: doc.title,
        description: doc.description,
        doc_type: doc.doc_type,
        sector: doc.sector,
        file_hash: doc.file_hash,
        status: doc.status,
        final_score: doc.final_score,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        owner: owner?.name || 'Anónimo',
      },
      validations: validations.map(v => ({
        result: v.result,
        opinion: v.opinion,
        score_impact: v.score_impact,
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
