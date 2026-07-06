#!/usr/bin/env node
/**
 * MTP Platform — Seed remoto para Atlas (funciona sin Express).
 *
 * Uso:
 *   MONGO_URI="mongodb+srv://..." node scripts/seed-atlas.js
 *
 * O si ya tenés .env local:
 *   node --env-file=server/.env scripts/seed-atlas.js
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('✗ MONGO_URI no está configurada');
  console.error('  Uso: MONGO_URI="mongodb+srv://..." node scripts/seed-atlas.js');
  process.exit(1);
}

// ─── Schemas mínimos (mismo shape que server/src/models/index.js) ──
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password_hash: { type: String, required: true },
  name: String,
  role: { type: String, enum: ['usuario', 'verificador', 'admin'], default: 'usuario' },
  membership: { type: String, enum: ['basica', 'profesional', 'premium'], default: 'basica' },
  kyc_status: { type: String, enum: ['pendiente', 'verificado', 'rechazado'], default: 'pendiente' },
  wallet_address: String,
  reputation: { type: Number, default: 50 },
  specialty: String,
  avatar: String,
  created_at: { type: Date, default: Date.now },
});

const documentSchema = new mongoose.Schema({
  user_id: mongoose.Schema.Types.ObjectId,
  title: String,
  description: String,
  doc_type: String,
  sector: String,
  status: { type: String, default: 'pendiente' },
  file_hash: String,
  file_name: String,
  file_size: Number,
  ai_risk: String,
  ai_summary: String,
  final_score: Number,
  assigned_to: mongoose.Schema.Types.ObjectId,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const legalConsentSchema = new mongoose.Schema({
  user_id: mongoose.Schema.Types.ObjectId,
  document_type: { type: String, enum: ['terms', 'privacy', 'kyc', 'aml'] },
  version: String,
  accepted_at: Date,
  ip_address: String,
  user_agent: String,
});

const validationSchema = new mongoose.Schema({
  document_id: mongoose.Schema.Types.ObjectId,
  verifier_id: mongoose.Schema.Types.ObjectId,
  verifier_name: String,
  verifier_role: String,
  result: { type: String, enum: ['aprobado', 'observado', 'rechazado'] },
  score_impact: Number,
  opinion: String,
  created_at: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);
const Document = mongoose.model('Document', documentSchema);
const LegalConsent = mongoose.model('LegalConsent', legalConsentSchema);
const Validation = mongoose.model('Validation', validationSchema);

// ─── Seed ──────────────────────────────────────────────────────
async function seed() {
  console.log('▶ Conectando a Atlas…');
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  console.log('✓ Conectado');

  const dbName = mongoose.connection.db.databaseName;
  console.log(`✓ Base: ${dbName}`);

  // Limpiar
  await User.deleteMany({});
  await Document.deleteMany({});
  await LegalConsent.deleteMany({});
  await Validation.deleteMany({});
  console.log('✓ Colecciones vaciadas');

  // Crear índices
  await User.createIndexes();
  await Document.createIndexes();
  console.log('✓ Índices creados');

  // Password común para demos
  const passwordHash = await bcrypt.hash('mtp1234', 10);

  // 5 usuarios demo
  const users = await User.create([
    {
      email: 'admin@mtp.test',
      password_hash: passwordHash,
      name: 'Administrador MTP',
      role: 'admin',
      membership: 'premium',
      kyc_status: 'verificado',
      wallet_address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
      reputation: 100,
    },
    {
      email: 'empresa@mtp.test',
      password_hash: passwordHash,
      name: 'Empresa Demo S.L.',
      role: 'usuario',
      membership: 'profesional',
      kyc_status: 'verificado',
      reputation: 82,
    },
    {
      email: 'usuario@mtp.test',
      password_hash: passwordHash,
      name: 'Usuario Demo',
      role: 'usuario',
      membership: 'basica',
      kyc_status: 'pendiente',
      reputation: 50,
    },
    {
      email: 'abogada@mtp.test',
      password_hash: passwordHash,
      name: 'Dra. Verificadora Legal',
      role: 'verificador',
      membership: 'premium',
      kyc_status: 'verificado',
      specialty: 'legal/abogado',
      reputation: 95,
    },
    {
      email: 'contador@mtp.test',
      password_hash: passwordHash,
      name: 'CPA Verificador',
      role: 'verificador',
      membership: 'profesional',
      kyc_status: 'verificado',
      specialty: 'finanzas/contador',
      reputation: 89,
    },
  ]);
  console.log(`✓ ${users.length} usuarios demo (password: mtp1234)`);

  // Consentimientos legales
  const consents = [];
  for (const user of users) {
    for (const dt of ['terms', 'privacy', 'kyc']) {
      consents.push({
        user_id: user._id,
        document_type: dt,
        version: '2026.05',
        accepted_at: new Date(),
        ip_address: '127.0.0.1',
        user_agent: 'seed',
      });
    }
  }
  await LegalConsent.insertMany(consents);
  console.log(`✓ ${consents.length} consentimientos (AMLD5 + RGPD)`);

  // 3 documentos demo
  const empresa = users.find(u => u.email === 'empresa@mtp.test');
  const abogada = users.find(u => u.email === 'abogada@mtp.test');
  const contador = users.find(u => u.email === 'contador@mtp.test');

  const docs = await Document.create([
    {
      user_id: empresa._id,
      title: 'Balance auditado Q1 2026',
      description: 'Balance contable trimestral con dictamen del auditor externo.',
      doc_type: 'balance',
      sector: 'finanzas',
      status: 'validado',
      file_hash: crypto.randomBytes(32).toString('hex'),
      file_name: 'balance-q1.pdf',
      file_size: 245600,
      ai_risk: 'bajo',
      ai_summary: 'Balance con estructura estándar, sin anomalías detectadas.',
      final_score: 92,
      assigned_to: contador._id,
    },
    {
      user_id: empresa._id,
      title: 'Escritura de constitución',
      description: 'Escritura pública de constitución de la sociedad.',
      doc_type: 'contrato',
      sector: 'legal',
      status: 'validado',
      file_hash: crypto.randomBytes(32).toString('hex'),
      file_name: 'escritura.pdf',
      file_size: 512300,
      ai_risk: 'bajo',
      ai_summary: 'Escritura pública notarial con todos los elementos requeridos.',
      final_score: 88,
      assigned_to: abogada._id,
    },
    {
      user_id: empresa._id,
      title: 'Contrato comercial pendiente',
      description: 'Contrato de servicios pendiente de validación legal.',
      doc_type: 'contrato',
      sector: 'legal',
      status: 'pendiente',
      file_hash: crypto.randomBytes(32).toString('hex'),
      file_name: 'contrato-2026.pdf',
      file_size: 189200,
      ai_risk: 'medio',
      ai_summary: 'Contrato bilateral con cláusulas estándar. Requiere revisión de la cláusula 7 sobre penalizaciones.',
      assigned_to: abogada._id,
    },
  ]);
  console.log(`✓ ${docs.length} documentos demo`);

  // Validaciones para los 2 aprobados
  await Validation.create([
    {
      document_id: docs[0]._id,
      verifier_id: contador._id,
      verifier_name: contador.name,
      verifier_role: 'contador',
      result: 'aprobado',
      score_impact: 8,
      opinion: 'Balance revisado y validado. Estructura contable correcta según NIIF.',
    },
    {
      document_id: docs[1]._id,
      verifier_id: abogada._id,
      verifier_name: abogada.name,
      verifier_role: 'abogado',
      result: 'aprobado',
      score_impact: 8,
      opinion: 'Escritura verificada. Cumple con los requisitos del Registro Mercantil.',
    },
  ]);
  console.log(`✓ 2 validaciones aprobadas`);

  await mongoose.disconnect();
  console.log('\n✅  Seed completado');
  console.log('   Login: admin@mtp.test / mtp1234');
}

seed().catch(e => {
  console.error('\n✗ Error:', e.message);
  process.exit(1);
});
