/**
 * MTP PLATFORM — Servidor Express.
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { connectMongo, getDbStatus, friendlyMongoError } from './db.js';
import { ettiosHealth } from './blockchain.js';
import { optionalAuth } from './middleware/auth.js';

import authRoutes         from './routes/auth.js';
import marketplaceRoutes  from './routes/marketplace.js';
import documentRoutes     from './routes/documents.js';
import validationRoutes   from './routes/validations.js';
import userRoutes         from './routes/users.js';
import activityRoutes     from './routes/activity.js';
import nftRoutes          from './routes/nft.js';
import kycRoutes          from './routes/kyc.js';
import verifyRoutes       from './routes/verify.js';
import paymentsRoutes     from './routes/payments.js';

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
  credentials: false,
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(optionalAuth);

if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    if (req.path.startsWith('/api')) {
      const start = Date.now();
      process.nextTick(() => console.log(`  ${req.method.padEnd(6)} ${req.path}  (${Date.now() - start}ms)`));
    }
    next();
  });
}

app.use('/api/auth',        authRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/documents',   documentRoutes);
app.use('/api/validations', validationRoutes);
app.use('/api/users',       userRoutes);
app.use('/api/activity',    activityRoutes);
app.use('/api/nft',         nftRoutes);
app.use('/api/kyc',         kycRoutes);
app.use('/api/verify',      verifyRoutes);
app.use('/api/payments',    paymentsRoutes);

app.get('/api/health', async (_req, res) => {
  // Health debe SIEMPRE devolver 200 — su rol es que Render sepa que el
  // proceso está vivo. El estado real de cada componente va en el body.
  let db, chain;
  try { db = await getDbStatus(); }
  catch (e) { db = { ok: false, error: e.message }; }
  try { chain = await ettiosHealth(); }
  catch (e) { chain = { ok: false, error: e.message }; }
  res.json({
    ok: !!db?.ok,
    app: 'MTP Platform', version: '3.0.0',
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.round(process.uptime()),
    db,
    blockchain: { name: 'ETTIOS', chainId: Number(process.env.ETTIOS_CHAIN_ID || 2237), ...chain },
  });
});

// Endpoint extra liviano que Render usa para healthcheck — no toca DB ni RPC
app.get('/api/ping', (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.use('/api/*', (_req, res) => res.status(404).json({ error: 'Endpoint no encontrado' }));

app.use((err, _req, res, _next) => {
  const mongo = err ? friendlyMongoError(err) : null;
  if (mongo) {
    console.error(`  ✗ Mongo ${err.code || err.name}: ${err.message}`);
    return res.status(mongo.status).json({ error: mongo.message });
  }
  if (err?.message && /File too large|Tipo de archivo/.test(err.message)) {
    return res.status(400).json({ error: err.message });
  }
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido en el body' });
  console.error('✗ Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

async function connectMongoWithRetry(maxAttempts = 5) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await connectMongo();
      return true;
    } catch (e) {
      const wait = Math.min(30000, 2000 * Math.pow(2, attempt - 1));   // 2s, 4s, 8s, 16s, 30s
      console.error(`\n  ⚠ Intento ${attempt}/${maxAttempts} fallido. Reintentando en ${wait/1000}s…`);
      if (attempt === maxAttempts) {
        console.error('\n  ✗ No se pudo conectar a MongoDB después de varios intentos.');
        console.error('  ✗ El servidor seguirá vivo pero /api/health reportará db.ok=false.');
        console.error('  ✗ Verificá MONGO_URI, IP whitelist en Atlas y que el cluster esté activo.\n');
        return false;
      }
      await new Promise(r => setTimeout(r, wait));
    }
  }
}

async function start() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║       MTP PLATFORM — API (React + Mongo)             ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  // 1) Arrancar el HTTP server INMEDIATAMENTE — necesario para que Render
  //    detecte que el puerto está abierto y no marque el servicio como caído.
  //    El healthcheck en /api/health reporta el estado real de Mongo.
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✓ API escuchando en 0.0.0.0:${PORT}`);
    console.log(`  Chain: ETTIOS (id ${process.env.ETTIOS_CHAIN_ID || 2237})`);
    console.log(`  CORS:  ${process.env.CORS_ORIGIN || '* (todos)'}\n`);
  });

  // 2) Conectar Mongo en background con retry exponencial.
  //    Si falla todos los intentos, el server sigue vivo (modo "degradado"),
  //    pero las rutas que necesitan DB van a devolver error.
  connectMongoWithRetry().then(ok => {
    if (ok) console.log('\n✓ MongoDB conectado y operativo\n');
  });

  return server;
}

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT',  () => process.exit(0));
process.on('unhandledRejection', err => console.error('✗ Unhandled rejection:', err));

start();
