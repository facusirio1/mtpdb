/**
 * GET /api/ping
 * Endpoint ultraliviano para healthchecks.
 * No toca DB, no toca RPC. Solo confirma que el proceso está vivo.
 */
import { methodDispatch, ok } from './_lib/helpers.js';

export default methodDispatch({
  GET: async (_req, res) => {
    return ok(res, {
      ok: true,
      ts: Date.now(),
      runtime: 'vercel-functions',
    });
  },
});
