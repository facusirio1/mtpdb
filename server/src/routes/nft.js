/**
 * MTP PLATFORM — Tokenización NFT en ETTIOS.
 */
import { Router } from 'express';
import { Document, Validation, Nft } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { mintValidationNFT, buildMetadata, ettiosHealth } from '../blockchain.js';
import { logActivity } from '../helpers.js';

const r = Router();

r.get('/health', async (_req, res) => {
  const h = await ettiosHealth();
  res.json({ chain: 'ETTIOS', chainId: Number(process.env.ETTIOS_CHAIN_ID || 2237), ...h });
});

r.post('/mint/:docId', requireAuth, async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.docId)
      .populate('user_id', 'full_name reputation membership wallet_address kyc_status');
    if (!doc) return res.status(404).json({ error: 'Documento no encontrado' });

    const owner = String(doc.user_id._id) === req.user.id;
    if (!owner && req.user.role !== 'admin') return res.status(403).json({ error: 'Solo el propietario o admin puede mintear' });
    if (doc.status !== 'validado') return res.status(400).json({ error: 'El documento debe estar validado' });

    const already = await Nft.findOne({ document_id: doc._id });
    if (already) return res.status(409).json({ error: 'Este documento ya tiene NFT' });
    if (!doc.user_id.wallet_address) return res.status(400).json({ error: 'El usuario no tiene wallet EVM' });

    const validations = await Validation.find({ document_id: doc._id }).lean();
    const metadata = buildMetadata({ doc, owner: doc.user_id, validationsCount: validations.length });

    const minted = await mintValidationNFT({ to: doc.user_id.wallet_address, metadata });
    const nft = await Nft.create({
      document_id: doc._id, user_id: doc.user_id._id,
      token_id: String(minted.tokenId), tx_hash: minted.txHash,
      contract_address: minted.contractAddress, chain_id: minted.chainId,
      block_number: minted.blockNumber, metadata_uri: minted.metadataUri,
    });

    await logActivity({ userId: req.user.id, action: 'nft_mint', entity: 'document', entityId: doc._id,
                        details: `Token #${minted.tokenId} · tx ${minted.txHash}`, ip: req.ip });
    res.json(nft);
  } catch (e) { next(e); }
});

r.get('/', async (_req, res, next) => {
  try {
    const list = await Nft.find()
      .populate('document_id', 'title doc_type')
      .populate('user_id', 'full_name company_name')
      .sort({ minted_at: -1 }).limit(100).lean();
    res.json(list);
  } catch (e) { next(e); }
});

r.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const list = await Nft.find({ user_id: req.user.id })
      .populate('document_id', 'title doc_type')
      .sort({ minted_at: -1 }).lean();
    res.json(list);
  } catch (e) { next(e); }
});

export default r;
