/**
 * MTP PLATFORM — Inicialización Mongo + seed.
 */
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { connectMongo } from './db.js';
import mongoose from 'mongoose';
import {
  User, Document, Validation, ScoringHistory, ActivityLog, Nft, LegalConsent, Payment,
} from './models/index.js';

async function run() {
  await connectMongo();
  console.log('');

  await Promise.all([
    User.deleteMany({}), Document.deleteMany({}), Validation.deleteMany({}),
    ScoringHistory.deleteMany({}), ActivityLog.deleteMany({}),
    Nft.deleteMany({}), LegalConsent.deleteMany({}), Payment.deleteMany({}),
  ]);
  console.log('✓ Colecciones vaciadas');

  await Promise.all([
    User.createIndexes(), Document.createIndexes(), Validation.createIndexes(),
    ScoringHistory.createIndexes(), ActivityLog.createIndexes(),
    Nft.createIndexes(), LegalConsent.createIndexes(), Payment.createIndexes(),
  ]);
  console.log('✓ Índices creados');

  const hash = await bcrypt.hash('mtp1234', 10);
  const seeds = [
    { full_name: 'Administrador MTP',    email: 'admin@mtp.test',    role: 'admin',
      entity_type: 'organizacion', company_name: 'Aston Mining S.L.', document_id: 'B-12345678',
      sector: 'Tecnología',  kyc_status: 'verificado', reputation: 100.0, membership: 'premium',
      wallet_address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1' },
    { full_name: 'Estudio Vega & Asoc.', email: 'empresa@mtp.test',  role: 'usuario',
      entity_type: 'empresa', company_name: 'Vega & Asociados', document_id: 'B-87654321',
      sector: 'Inmobiliario',kyc_status: 'verificado', reputation: 62.0,  membership: 'profesional',
      wallet_address: '0x9c4afE3e2d8c12bC4A7e9F5cD83b6E1aF24Bf2E1' },
    { full_name: 'Bruno Acosta',         email: 'usuario@mtp.test',  role: 'usuario',
      entity_type: 'profesional', document_id: '28999111',
      sector: 'Agro',        kyc_status: 'pendiente',  reputation: 50.0,  membership: 'basica' },
    { full_name: 'Dra. Lucía Ferreyra',  email: 'abogada@mtp.test',  role: 'verificador',
      entity_type: 'profesional', document_id: '27888222',
      sector: 'Legal',       specialty: 'abogado',  kyc_status: 'verificado', reputation: 88.0,  membership: 'premium',
      wallet_address: '0xc12a4f7e9b3d2c8a1f5e6d4b7c9a8e2f3d1b5c7a' },
    { full_name: 'Cont. Marco Salinas',  email: 'contador@mtp.test', role: 'verificador',
      entity_type: 'profesional', document_id: '20777333',
      sector: 'Finanzas',    specialty: 'contador', kyc_status: 'verificado', reputation: 91.0,  membership: 'profesional' },
  ];

  const TERMS_VERSION = '2026.05';
  const now = new Date();
  const consents = [];
  for (const s of seeds) {
    const u = await User.create({
      ...s, password_hash: hash,
      terms_accepted_at: now, terms_version: TERMS_VERSION,
      privacy_accepted_at: now, kyc_consent: true,
    });
    consents.push(
      { user_id: u._id, document_type: 'terms',   version: TERMS_VERSION, ip_address: '127.0.0.1', user_agent: 'seed/initDb' },
      { user_id: u._id, document_type: 'privacy', version: TERMS_VERSION, ip_address: '127.0.0.1', user_agent: 'seed/initDb' },
      { user_id: u._id, document_type: 'kyc',     version: TERMS_VERSION, ip_address: '127.0.0.1', user_agent: 'seed/initDb' },
    );
  }
  await LegalConsent.insertMany(consents);
  console.log(`✓ 5 usuarios demo (password: mtp1234) + ${consents.length} consentimientos`);

  const empresa  = await User.findOne({ email: 'empresa@mtp.test' });
  const abogada  = await User.findOne({ email: 'abogada@mtp.test' });
  const contador = await User.findOne({ email: 'contador@mtp.test' });
  const usuario  = await User.findOne({ email: 'usuario@mtp.test' });

  const doc1 = await Document.create({
    user_id: empresa._id,
    title: 'Contrato de fideicomiso inmobiliario — Torre Norte',
    doc_type: 'cen',
    description: 'Estructura de fideicomiso para 42 unidades funcionales en AMBA.',
    file_hash: '3f8b9e2c47a9d18e1f8a72b6c9d4e5a8b3c1f9e2d6a4b8c7f5e3d2a1b9c8e7f6a',
    status: 'validado', ai_risk: 'bajo',
    ai_summary: 'Sin inconsistencias relevantes.', assigned_to: abogada._id,
  });
  await Validation.create({
    document_id: doc1._id, verifier_id: abogada._id,
    val_type: 'juridica', result: 'aprobado', score_impact: 8,
    opinion: 'Estructura jurídica adecuada. Cláusulas claras.',
  });

  const doc2 = await Document.create({
    user_id: empresa._id,
    title: 'Balance contable Q4 2025 — Vega & Asociados',
    doc_type: 'cte',
    description: 'Estados financieros del cuarto trimestre conforme normas IFRS.',
    file_hash: 'c12a4f7e9b3d2c8a1f5e6d4b7c9a8e2f3d1b5c7a9e6f4d2b8c1a3f7e5d9b6c4a',
    status: 'validado', ai_risk: 'bajo',
    ai_summary: 'Coherencia interna correcta.', assigned_to: contador._id,
  });
  await Validation.create({
    document_id: doc2._id, verifier_id: contador._id,
    val_type: 'economica', result: 'aprobado', score_impact: 8,
    opinion: 'Balance conforme a IFRS.',
  });

  await Document.create({
    user_id: usuario._id,
    title: 'Certificación de feedlot ganadero — 200 cabezas Brangus',
    doc_type: 'ctk',
    description: 'Documentación de feedlot para tokenización ganadera.',
    status: 'cargado', ai_risk: 'medio',
    ai_summary: 'Requiere validación profesional veterinaria.',
  });
  console.log('✓ 3 documentos demo (2 validados + 1 en cola)');

  const admin = await User.findOne({ email: 'admin@mtp.test' });
  await ActivityLog.create({
    user_id: admin._id, action: 'seed', entity: 'system',
    details: 'Inicialización del sistema con datos demo', ip_address: '127.0.0.1',
  });

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ✓ LISTO — iniciá el servidor con:  npm run dev');
  console.log('');
  console.log('  Logins demo (password: mtp1234):');
  console.log('    • admin@mtp.test    (admin · premium · KYC verificado)');
  console.log('    • empresa@mtp.test  (usuario · profesional · KYC verif.)');
  console.log('    • usuario@mtp.test  (usuario · básica · KYC pendiente)');
  console.log('    • abogada@mtp.test  (verificador · premium · Legal)');
  console.log('    • contador@mtp.test (verificador · profesional · Finanzas)');
  console.log('═══════════════════════════════════════════════════════════\n');

  await mongoose.disconnect();
}

run().catch(err => { console.error('✗ Init falló:', err.message); process.exit(1); });
