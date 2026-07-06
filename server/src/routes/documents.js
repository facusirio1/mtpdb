/**
 * MTP PLATFORM — Documentos.
 */
import { Router } from 'express';
import { Document, Validation, Nft, User } from '../models/index.js';
import { upload, sha256File } from '../middleware/upload.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { analyzeDocument } from '../ai.js';
import { logActivity } from '../helpers.js';

const r = Router();

r.post('/', requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    const { title, doc_type = 'otro', description = '' } = req.body || {};
    if (!title) return res.status(400).json({ error: 'El título es obligatorio' });
    if (!req.file) return res.status(400).json({ error: 'Tenés que subir un archivo' });

    const file_hash = sha256File(req.file.path);
    const { risk, summary } = analyzeDocument({ title, description, type: doc_type });

    const doc = await Document.create({
      user_id: req.user.id, title, doc_type, description,
      file_path: req.file.path, file_hash, file_size: req.file.size,
      ai_risk: risk, ai_summary: summary, status: 'cargado',
    });

    await logActivity({ userId: req.user.id, action: 'doc_upload', entity: 'document', entityId: doc._id,
                        details: `Subió "${title}" (${doc_type})`, ip: req.ip });
    res.json(doc);
  } catch (e) { next(e); }
});

r.get('/', requireAuth, async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { user_id: req.user.id };
    const docs = await Document.find(filter)
      .populate('user_id', 'full_name email entity_type company_name')
      .populate('assigned_to', 'full_name specialty')
      .sort({ created_at: -1 })
      .limit(100)
      .lean();
    res.json(docs);
  } catch (e) { next(e); }
});

r.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id)
      .populate('user_id', 'full_name email company_name reputation membership wallet_address')
      .populate('assigned_to', 'full_name specialty reputation')
      .lean();
    if (!doc) return res.status(404).json({ error: 'Documento no encontrado' });

    const owner   = String(doc.user_id?._id) === req.user.id;
    const assignd = doc.assigned_to && String(doc.assigned_to._id) === req.user.id;
    if (!owner && !assignd && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No tenés acceso a este documento' });
    }

    const [validations, nft] = await Promise.all([
      Validation.find({ document_id: doc._id })
        .populate('verifier_id', 'full_name specialty reputation membership')
        .sort({ created_at: -1 })
        .lean(),
      Nft.findOne({ document_id: doc._id }).lean(),
    ]);

    res.json({ ...doc, validations, nft });
  } catch (e) { next(e); }
});

r.patch('/:id/assign', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { verifier_id } = req.body || {};
    if (!verifier_id) return res.status(400).json({ error: 'verifier_id es obligatorio' });
    const v = await User.findOne({ _id: verifier_id, role: 'verificador' });
    if (!v) return res.status(404).json({ error: 'El verificador no existe' });

    const doc = await Document.findByIdAndUpdate(req.params.id,
      { assigned_to: verifier_id, status: 'en_revision' }, { new: true });
    if (!doc) return res.status(404).json({ error: 'Documento no encontrado' });

    await logActivity({ userId: req.user.id, action: 'doc_assign', entity: 'document', entityId: doc._id,
                        details: `Asignado a ${v.full_name}`, ip: req.ip });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default r;
