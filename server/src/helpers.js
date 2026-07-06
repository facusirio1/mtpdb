/**
 * MTP PLATFORM — Helpers compartidos.
 */
import { User, ScoringHistory, ActivityLog } from './models/index.js';

export async function applyScore({ userId, delta, reason, documentId = null, validationId = null }) {
  if (!userId || !delta) return;
  const user = await User.findById(userId);
  if (!user) return;
  const prev = Number(user.reputation);
  const next = Math.max(0, Math.min(100, prev + Number(delta)));
  user.reputation = next;
  await user.save();
  await ScoringHistory.create({
    user_id: userId, document_id: documentId, validation_id: validationId,
    prev_score: prev, new_score: next, delta, reason: reason || '',
  });
  return { prev, next };
}

export async function logActivity({ userId, action, entity = null, entityId = null, details = '', ip = null }) {
  try {
    await ActivityLog.create({
      user_id: userId, action, entity, entity_id: entityId, details, ip_address: ip,
    });
  } catch (e) {
    console.warn('  ⚠ logActivity fallido:', e.message);
  }
}

export function scoreLabel(score) {
  const s = Number(score) || 0;
  if (s >= 85) return { label: 'excelente', cls: 'score-good' };
  if (s >= 65) return { label: 'sólido',    cls: 'score-mid'  };
  if (s >= 45) return { label: 'aceptable', cls: 'score-low'  };
  return { label: 'a mejorar', cls: 'score-risk' };
}

export function publicUser(u) {
  if (!u) return null;
  const obj = u.toObject ? u.toObject() : { ...u };
  obj.id = String(obj._id);
  delete obj._id;
  delete obj.__v;
  delete obj.password_hash;
  return obj;
}
