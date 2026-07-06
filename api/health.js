/**
 * GET /api/health
 * Health check completo — verifica MongoDB.
 * Siempre devuelve 200 (así Vercel no lo marca como caído si la DB falla).
 * El estado real de cada componente va en el body.
 */
import { methodDispatch, ok } from './_lib/helpers.js';
import { connectMongo } from './_lib/db.js';
import mongoose from 'mongoose';

export default methodDispatch({
  GET: async (_req, res) => {
    let db = { ok: false };

    try {
      await connectMongo();
      const state = mongoose.connection.readyState;
      db = {
        ok: state === 1,
        state: ['disconnected', 'connected', 'connecting', 'disconnecting'][state] || 'unknown',
        host: mongoose.connection.host,
      };
    } catch (e) {
      db = { ok: false, error: e.message };
    }

    return ok(res, {
      ok: db.ok,
      app: 'MTP Platform',
      version: '3.0.0',
      runtime: 'vercel-functions',
      timestamp: new Date().toISOString(),
      db,
      blockchain: {
        name: 'ETTIOS',
        chainId: Number(process.env.ETTIOS_CHAIN_ID || 2237),
      },
    });
  },
});
