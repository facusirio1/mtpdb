/**
 * MTP PLATFORM — Motor IA heurístico (Capa 2).
 * Reemplazable por LLM real (Claude/GPT) en fase 3 del roadmap.
 */
const RISK_KEYWORDS = {
  alto:  ['fraude','estafa','litigio','quiebra','denuncia','urgente','irregular','sospechoso'],
  medio: ['observación','pendiente','revisar','incompleto','desactualizado','parcial'],
};

export function analyzeDocument({ title = '', description = '', type = 'otro' }) {
  const text = (title + ' ' + description).toLowerCase();

  let risk = 'bajo';
  if (RISK_KEYWORDS.alto .some(k => text.includes(k))) risk = 'alto';
  else if (RISK_KEYWORDS.medio.some(k => text.includes(k))) risk = 'medio';

  const summary = type === 'cte'  ? 'Documento económico-financiero. Revisar coherencia interna y métricas.'
                : type === 'ctpi' ? 'Proceso administrativo / judicial. Validar línea temporal y evidencia.'
                : type === 'cen'  ? 'Documento jurídico-notarial. Verificar firmas y representación.'
                : type === 'ctk'  ? 'Activo tokenizable. Confirmar custodia y valuación.'
                : 'Documento general. El motor IA no detectó inconsistencias relevantes.';

  return { risk, summary };
}
