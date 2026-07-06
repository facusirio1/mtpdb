/**
 * MTP PLATFORM — Modelos Mongoose (8 colecciones)
 */
import mongoose from 'mongoose';
const { Schema, model } = mongoose;

// ─── 1. USERS ────────────────────────────────────────────────
const userSchema = new Schema({
  full_name:     { type: String, required: true, trim: true },
  email:         { type: String, required: true, unique: true, lowercase: true, trim: true,
                   match: [/^[^@\s]+@[^@\s]+\.[^@\s]+$/, 'Email inválido'] },
  password_hash: { type: String, required: true },

  role:          { type: String, enum: ['admin','usuario','verificador'], default: 'usuario', index: true },
  entity_type:   { type: String, enum: ['profesional','empresa','organizacion','particular'], default: 'profesional' },
  company_name:  { type: String, default: null },
  document_id:   { type: String, default: null },

  sector:        { type: String, default: null, index: true },
  specialty:     { type: String, default: null },

  kyc_status:    { type: String, enum: ['pendiente','verificado','rechazado'], default: 'pendiente' },
  reputation:    { type: Number, default: 50.0, min: 0, max: 100 },
  membership:    { type: String, enum: ['basica','profesional','premium'], default: 'basica', index: true },

  wallet_address: { type: String, default: null },
  status:         { type: String, enum: ['activo','suspendido'], default: 'activo' },

  // Marco legal
  terms_accepted_at:   { type: Date, default: null },
  terms_version:       { type: String, default: null },
  privacy_accepted_at: { type: Date, default: null },
  kyc_consent:         { type: Boolean, default: false },

  // KYC detalle
  kyc_country:      { type: String, default: null },
  kyc_doc_type:     { type: String, default: null },
  kyc_doc_number:   { type: String, default: null },
  kyc_provider:     { type: String, default: null },
  kyc_reference:    { type: String, default: null },
  kyc_completed_at: { type: Date,   default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

userSchema.index({ role: 1, membership: 1 });
export const User = model('User', userSchema);

// ─── 2. DOCUMENTS ────────────────────────────────────────────
const documentSchema = new Schema({
  user_id:     { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title:       { type: String, required: true },
  doc_type:    { type: String, default: 'otro' },     // cte | ctpi | cen | ctk | contrato | balance | otro
  description: { type: String, default: '' },
  file_path:   { type: String, default: null },
  file_hash:   { type: String, default: null, index: true },
  file_size:   { type: Number, default: 0 },
  status:      { type: String, enum: ['cargado','en_revision','validado','rechazado'], default: 'cargado', index: true },
  ai_risk:     { type: String, enum: ['bajo','medio','alto'], default: 'bajo' },
  ai_summary:  { type: String, default: '' },
  assigned_to: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
export const Document = model('Document', documentSchema);

// ─── 3. VALIDATIONS ──────────────────────────────────────────
const validationSchema = new Schema({
  document_id:  { type: Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
  verifier_id:  { type: Schema.Types.ObjectId, ref: 'User',     required: true, index: true },
  val_type:     { type: String, default: 'general' },
  result:       { type: String, enum: ['aprobado','observado','rechazado'], required: true },
  score_impact: { type: Number, default: 0 },
  opinion:      { type: String, default: '' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
export const Validation = model('Validation', validationSchema);

// ─── 4. SCORING HISTORY ──────────────────────────────────────
const scoringHistorySchema = new Schema({
  user_id:       { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  document_id:   { type: Schema.Types.ObjectId, ref: 'Document', default: null },
  validation_id: { type: Schema.Types.ObjectId, ref: 'Validation', default: null },
  prev_score:    { type: Number, required: true },
  new_score:     { type: Number, required: true },
  delta:         { type: Number, required: true },
  reason:        { type: String, default: '' },
}, { timestamps: { createdAt: 'created_at' } });
export const ScoringHistory = model('ScoringHistory', scoringHistorySchema, 'scoring_history');

// ─── 5. ACTIVITY LOG ─────────────────────────────────────────
const activityLogSchema = new Schema({
  user_id:    { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  action:     { type: String, required: true },
  entity:     { type: String, default: null },
  entity_id:  { type: Schema.Types.Mixed, default: null },
  details:    { type: String, default: '' },
  ip_address: { type: String, default: null },
}, { timestamps: { createdAt: 'created_at' } });
export const ActivityLog = model('ActivityLog', activityLogSchema, 'activity_log');

// ─── 6. NFTS ─────────────────────────────────────────────────
const nftSchema = new Schema({
  document_id:      { type: Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
  user_id:          { type: Schema.Types.ObjectId, ref: 'User', required: true },
  token_id:         { type: String, required: true, index: true },
  tx_hash:          { type: String, required: true },
  contract_address: { type: String, required: true },
  chain_id:         { type: Number, default: 2237 },
  block_number:     { type: Number, default: null },
  metadata_uri:     { type: String, default: null },
  minted_at:        { type: Date,   default: Date.now },
});
export const Nft = model('Nft', nftSchema, 'nfts');

// ─── 7. LEGAL CONSENTS ───────────────────────────────────────
const legalConsentSchema = new Schema({
  user_id:       { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  document_type: { type: String, enum: ['terms','privacy','kyc','aml'], required: true },
  version:       { type: String, required: true },
  ip_address:    { type: String, default: null },
  user_agent:    { type: String, default: null },
  accepted_at:   { type: Date,   default: Date.now },
});
export const LegalConsent = model('LegalConsent', legalConsentSchema, 'legal_consents');

// ─── 8. PAYMENTS ─────────────────────────────────────────────
const paymentSchema = new Schema({
  order_id:           { type: String, required: true, unique: true, index: true },
  user_id:            { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  method:             { type: String, enum: ['redsys','bizum','crypto'], required: true },
  concept:            { type: String, enum: ['profesional','premium','nft'], required: true },
  amount:             { type: Number, required: true },
  status:             { type: String, enum: ['pendiente','aprobado','denegado','firma_invalida'], default: 'pendiente', index: true },
  response_code:      { type: Number, default: null },
  authorization_code: { type: String, default: null },
  phone:              { type: String, default: null },

  // Campos específicos de pagos cripto USDC/USDT
  crypto_chain_id:         { type: Number, default: null },
  crypto_token:            { type: String, default: null },       // 'USDC' | 'USDT'
  crypto_amount_units:     { type: String, default: null },       // BigInt como string
  crypto_merchant_address: { type: String, default: null },
  crypto_tx_hash:          { type: String, default: null },
  crypto_block_number:     { type: Number, default: null },
  crypto_confirmations:    { type: Number, default: null },
  crypto_from_address:     { type: String, default: null },

  completed_at:       { type: Date,   default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });
export const Payment = model('Payment', paymentSchema, 'payments');
