/**
 * MTP PLATFORM — Validaciones / dictámenes.
 */
import { Router } from 'express';
import { Document, Validation } from '../models/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { applyScore, logActivity } from '../helpers.js';

const r = Router();

r.get('/queue', requireAuth, requireRole('verificador','admin'), async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin'
      ? { status: { $in: ['cargado','en_revision'] } }
      : { status: 'en_revision', assigned_to: req.user.id };
    const docs = await Document.find(filter)
      .populate('user_id', 'full_name company_name reputation membership')
      .sort({ created_at: 1 })
      .limit(50)
      .lean();
    res.json(docs);
  } catch (e) { next(e); }
});

r.post('/take/:docId', requireAuth, requireRole('verificador'), async (req, res, next) => {
  try {
    const doc = await Document.findByIdAndUpdate(req.params.docId,
      { assigned_to: req.user.id, status: 'en_revision' }, { new: true });
    if (!doc) return res.status(404).json({ error: 'Documento no encontrado' });
    await logActivity({ userId: req.user.id, action: 'doc_take', entity: 'document', entityId: doc._id,
                        details: 'Auto-asignación', ip: req.ip });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

r.post('/', requireAuth, requireRole('verificador'), async (req, res, next) => {
  try {
    const { document_id, val_type = 'general', result, opinion = '' } = req.body || {};
    if (!document_id || !result) return res.status(400).json({ error: 'document_id y result son obligatorios' });
    if (!['aprobado','observado','rechazado'].includes(result)) return res.status(400).json({ error: 'result inválido' });

    const doc = await Document.findById(document_id);
    if (!doc) return res.status(404).json({ error: 'Documento no encontrado' });

    const score_impact = result === 'aprobado' ? 8 : result === 'observado' ? -3 : -10;
    const validation = await Validation.create({
      document_id, verifier_id: req.user.id, val_type, result, score_impact, opinion,
    });

    if (result === 'aprobado')       doc.status = 'validado';
    else if (result === 'rechazado') doc.status = 'rechazado';
    else                             doc.status = 'en_revision';
    await doc.save();

    await applyScore({
      userId: doc.user_id, delta: score_impact,
      reason: `Dictamen "${result}" del verificador ${req.user.id}`,
      documentId: doc._id, validationId: validation._id,
    });

    await logActivity({ userId: req.user.id, action: 'doc_validate', entity: 'document', entityId: doc._id,
                        details: `Dictamen ${result} (${val_type})`, ip: req.ip });
    res.json(validation);
  } catch (e) { next(e); }
});

r.get('/mine', requireAuth, requireRole('verificador'), async (req, res, next) => {
  try {
    const vals = await Validation.find({ verifier_id: req.user.id })
      .populate('document_id', 'title doc_type')
      .sort({ created_at: -1 })
      .limit(60)
      .lean();
    res.json(vals);
  } catch (e) { next(e); }
});

export default r;
