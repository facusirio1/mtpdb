/**
 * MTP PLATFORM — Helper para tests.
 * Levanta una instancia de MongoDB en memoria + el server Express,
 * todo dentro del proceso de test. Cero side-effects sobre tu Mongo real.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

let mongoServer;

export async function setupTestDb() {
  // Mongo efímero en RAM. Usamos 6.0.14 (binario estable disponible).
  mongoServer = await MongoMemoryServer.create({
    binary: { version: '6.0.14' },
  });
  process.env.MONGO_URI = mongoServer.getUri();
  process.env.JWT_SECRET = 'test_secret_only_for_tests';
  process.env.NODE_ENV = 'test';

  await mongoose.connect(process.env.MONGO_URI);
  return mongoose;
}

export async function teardownTestDb() {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
}

export async function clearCollections() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

export async function getApp() {
  // Importar el app DESPUÉS de configurar las env vars
  const { default: express } = await import('express');
  const { default: cors } = await import('cors');

  const { optionalAuth } = await import('../src/middleware/auth.js');
  const { default: authRoutes }       = await import('../src/routes/auth.js');
  const { default: marketRoutes }     = await import('../src/routes/marketplace.js');
  const { default: docRoutes }        = await import('../src/routes/documents.js');
  const { default: valRoutes }        = await import('../src/routes/validations.js');
  const { default: userRoutes }       = await import('../src/routes/users.js');
  const { default: activityRoutes }   = await import('../src/routes/activity.js');
  const { default: kycRoutes }        = await import('../src/routes/kyc.js');
  const { default: verifyRoutes }     = await import('../src/routes/verify.js');
  const { default: paymentsRoutes }   = await import('../src/routes/payments.js');

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(optionalAuth);

  app.use('/api/auth',        authRoutes);
  app.use('/api/marketplace', marketRoutes);
  app.use('/api/documents',   docRoutes);
  app.use('/api/validations', valRoutes);
  app.use('/api/users',       userRoutes);
  app.use('/api/activity',    activityRoutes);
  app.use('/api/kyc',         kycRoutes);
  app.use('/api/verify',      verifyRoutes);
  app.use('/api/payments',    paymentsRoutes);

  app.use((err, _req, res, _next) => {
    if (err?.name === 'ValidationError') return res.status(400).json({ error: err.message });
    if (err?.code === 11000) return res.status(409).json({ error: 'Duplicate' });
    res.status(500).json({ error: err.message });
  });
  return app;
}

export async function seedUser({ role = 'usuario', ...rest } = {}) {
  const { User } = await import('../src/models/index.js');
  const password = rest.password || 'test1234';
  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({
    full_name: rest.full_name || 'Test User',
    email:     rest.email     || `user-${Date.now()}-${Math.random().toString(36).slice(2,6)}@test.local`,
    password_hash: hash,
    role,
    kyc_status: rest.kyc_status || 'verificado',
    membership: rest.membership || 'profesional',
    reputation: rest.reputation ?? 60,
    sector:     rest.sector,
    specialty:  rest.specialty,
    wallet_address: rest.wallet_address || null,
    status: 'activo',
    terms_accepted_at: new Date(), terms_version: '2026.05',
    privacy_accepted_at: new Date(), kyc_consent: true,
  });
  return { user, plainPassword: password };
}

export async function loginAs(app, request, email, password = 'test1234') {
  const r = await request(app).post('/api/auth/login').send({ email, password });
  if (r.status !== 200) throw new Error(`Login falló: ${r.status} ${JSON.stringify(r.body)}`);
  return r.body.token;
}
