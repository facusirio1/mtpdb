/**
 * MTP PLATFORM — Verificación pública de certificados.
 */
import { Router } from 'express';
import mongoose from 'mongoose';
import { Document, Validation, Nft } from '../models/index.js';

const r = Router();

r.get('/:identifier', async (req, res, next) => {
  try {
    const ident = String(req.params.identifier || '').trim();
    if (!ident) return res.status(400).json({ ok: false, error: 'Identificador requerido' });

    let doc = null;
    if (/^[0-9a-f]{64}$/i.test(ident)) {
      doc = await Document.findOne({ file_hash: ident })
        .populate('user_id', 'full_name entity_type company_name sector reputation membership kyc_status');
    } else if (/^\d{1,18}$/.test(ident) && ident.length > 6) {
      const nft = await Nft.findOne({ token_id: ident });
      if (nft) doc = await Document.findById(nft.document_id)
        .populate('user_id', 'full_name entity_type company_name sector reputation membership kyc_status');
    } else if (mongoose.Types.ObjectId.isValid(ident)) {
      doc = await Document.findById(ident)
        .populate('user_id', 'full_name entity_type company_name sector reputation membership kyc_status');
    }

    if (!doc) return res.json({ ok: false, found: false, error: 'Certificado no encontrado' });

    const [validations, nft] = await Promise.all([
      Validation.find({ document_id: doc._id })
        .populate('verifier_id', 'full_name specialty reputation')
        .sort({ created_at: -1 }).lean(),
      Nft.findOne({ document_id: doc._id }).lean(),
    ]);

    const rep = Number(doc.user_id?.reputation || 50);
    const approvals = validations.filter(v => v.result === 'aprobado').length;

    res.json({
      ok: true, found: true,
      verification_status: doc.status === 'validado' ? (nft ? 'on_chain' : 'validado') : doc.status,
      certificate: {
        id: String(doc._id), title: doc.title, doc_type: doc.doc_type, description: doc.description,
        ai_risk: doc.ai_risk, status: doc.status, file_hash: doc.file_hash,
        created_at: doc.created_at, validated_at: doc.updated_at,
      },
      owner: {
        name: doc.user_id?.full_name, entity_type: doc.user_id?.entity_type,
        company_name: doc.user_id?.company_name, sector: doc.user_id?.sector,
        reputation: rep, membership: doc.user_id?.membership, kyc_status: doc.user_id?.kyc_status,
      },
      validations: validations.map(v => ({
        val_type: v.val_type, result: v.result, opinion: v.opinion, created_at: v.created_at,
        verifier_name: v.verifier_id?.full_name, specialty: v.verifier_id?.specialty,
        verifier_reputation: v.verifier_id?.reputation,
      })),
      score_breakdown: {
        economico:  Math.min(100, Math.round(rep + approvals * 2)),
        tributario: Math.min(100, Math.round(rep * 0.95 + approvals * 1.5)),
        financiero: Math.min(100, Math.round(rep * 1.05)),
        laboral:    Math.min(100, Math.round(rep * 0.98 + approvals)),
      },
      nft: nft ? {
        token_id: nft.token_id, tx_hash: nft.tx_hash, contract_address: nft.contract_address,
        chain_id: nft.chain_id, block_number: nft.block_number, metadata_uri: nft.metadata_uri,
        minted_at: nft.minted_at,
        explorer_url: `https://scan.ettiosblockchain.io/tx/${nft.tx_hash}`,
      } : null,
    });
  } catch (e) { next(e); }
});

export default r;
