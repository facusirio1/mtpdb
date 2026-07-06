/**
 * MTP PLATFORM — KYC / consentimientos.
 */
import { Router } from 'express';
import crypto from 'node:crypto';
import { User, LegalConsent } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { logActivity } from '../helpers.js';

const r = Router();
const VALID_DOC_TYPES = ['DNI','Pasaporte','CI','RUC','NIF','CUIT','CURP','Otro'];

r.post('/', requireAuth, async (req, res, next) => {
  try {
    const { country, doc_type, doc_number, wallet_address } = req.body || {};
    if (!country || !doc_type || !doc_number) return res.status(400).json({ error: 'País, tipo y número de documento son obligatorios' });
    if (!VALID_DOC_TYPES.includes(doc_type)) return res.status(400).json({ error: 'Tipo de documento inválido' });

    const reference = 'MTP-KYC-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    const update = {
      kyc_country: country, kyc_doc_type: doc_type, kyc_doc_number: doc_number,
      kyc_provider: 'manual', kyc_reference: reference, kyc_status: 'pendiente',
    };
    if (wallet_address) update.wallet_address = wallet_address;
    await User.findByIdAndUpdate(req.user.id, update);

    await logActivity({ userId: req.user.id, action: 'kyc_submit', entity: 'user', entityId: req.user.id,
                        details: `KYC enviado · ${doc_type} ${country} · ref ${reference}`, ip: req.ip });
    res.json({ ok: true, reference, status: 'pendiente' });
  } catch (e) { next(e); }
});

r.get('/me', requireAuth, async (req, res, next) => {
  try {
    const u = await User.findById(req.user.id)
      .select('kyc_status kyc_country kyc_doc_type kyc_doc_number kyc_provider kyc_reference kyc_completed_at terms_accepted_at terms_version privacy_accepted_at kyc_consent')
      .lean();
    res.json(u || {});
  } catch (e) { next(e); }
});

r.get('/consents', requireAuth, async (req, res, next) => {
  try {
    const rows = await LegalConsent.find({ user_id: req.user.id }).sort({ accepted_at: -1 }).lean();
    res.json(rows);
  } catch (e) { next(e); }
});

export default r;
