/**
 * MTP PLATFORM — Rutas de pagos.
 */
import { Router } from 'express';
import { Payment, User } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { logActivity } from '../helpers.js';
import { createPayment, verifyNotification, generateOrderId, redsysHealth } from '../payments/redsys.js';
import { createBizumPayment, bizumHealth } from '../payments/bizum.js';
import { cryptoHealth, getCryptoQuote, verifyCryptoTransfer, supportedNetworks } from '../payments/crypto.js';
import { oracleHealth } from '../payments/oracle.js';

const r = Router();
const PRICES = {
  profesional: { amount: 2900, label: 'Membresía Profesional (mensual)' },
  premium:     { amount: 7900, label: 'Membresía Premium (mensual)' },
  nft:         { amount: 500,  label: 'Minteo de NFT en ETTIOS' },
};

r.get('/health', async (_req, res) => res.json({
  redsys: redsysHealth(),
  bizum:  bizumHealth(),
  crypto: cryptoHealth(),
  oracle: await oracleHealth(),
  prices: PRICES,
  crypto_networks: supportedNetworks(),
  cyberpac_compliance: {
    sha256_signing: true,
    pci_dss_passthrough: true,
    notification_url_https: (process.env.REDSYS_NOTIFICATION_URL || '').startsWith('https://'),
    redsys_test_endpoint: 'https://sis-t.redsys.es:25443/sis/realizarPago',
    redsys_prod_endpoint: 'https://sis.redsys.es/sis/realizarPago',
    canales_test:  'https://sis-t.redsys.es:25443/canales/',
    canales_prod:  'https://canales.redsys.es/',
    support_email: 'virtualtpv@comerciaglobalpay.com',
    support_phone: '902 157 235 / 914 353 028 (opción comercio electrónico)',
  },
}));

/** GET /api/payments/errors/:code — info sobre un código SIS00xx o HTTP */
r.get('/errors/:code', async (req, res) => {
  const { lookupRedsysError, SIS_ERRORS, HTTP_NOTIFY_ERRORS } = await import('../payments/redsys-errors.js');
  if (req.params.code === 'all') {
    return res.json({ sis: SIS_ERRORS, http: HTTP_NOTIFY_ERRORS });
  }
  const info = lookupRedsysError(req.params.code);
  if (!info) return res.status(404).json({ error: 'Código no catalogado', suggestion: 'Contactá virtualtpv@comerciaglobalpay.com' });
  res.json(info);
});

r.post('/redsys/create', requireAuth, async (req, res, next) => {
  try {
    const { concept } = req.body || {};
    if (!PRICES[concept]) return res.status(400).json({ error: 'concept inválido' });
    const orderId = generateOrderId();
    const { amount, label } = PRICES[concept];
    await Payment.create({ order_id: orderId, user_id: req.user.id, method: 'redsys', concept, amount, status: 'pendiente' });
    const form = createPayment({ orderId, amount, description: label, userId: req.user.id });
    await logActivity({ userId: req.user.id, action: 'payment_init', entity: 'payment', entityId: orderId,
                        details: `Redsys · ${concept} · ${amount/100} €`, ip: req.ip });
    res.json({ order_id: orderId, method: 'redsys', amount, label, form });
  } catch (e) { next(e); }
});

r.post('/bizum/create', requireAuth, async (req, res, next) => {
  try {
    const { concept, phone } = req.body || {};
    if (!PRICES[concept]) return res.status(400).json({ error: 'concept inválido' });
    if (!phone) return res.status(400).json({ error: 'phone es obligatorio' });
    const orderId = generateOrderId();
    const { amount, label } = PRICES[concept];
    await Payment.create({ order_id: orderId, user_id: req.user.id, method: 'bizum', concept, amount, phone, status: 'pendiente' });
    const form = createBizumPayment({ orderId, amount, phone, description: label, userId: req.user.id });
    await logActivity({ userId: req.user.id, action: 'payment_init', entity: 'payment', entityId: orderId,
                        details: `Bizum · ${concept} · ${amount/100} €`, ip: req.ip });
    res.json({ order_id: orderId, method: 'bizum', amount, label, phone: form.phone_masked, form });
  } catch (e) { next(e); }
});

r.post('/notify', async (req, res, next) => {
  try {
    const v = verifyNotification(req.body);
    if (!v.valid) {
      console.warn('[Redsys notify] Firma inválida:', { orderId: v.orderId, error: v.error });
      return res.status(400).send('FIRMA_INVALIDA');
    }
    const order = await Payment.findOne({ order_id: v.orderId });
    if (!order) {
      console.warn('[Redsys notify] Orden no encontrada:', v.orderId);
      return res.status(404).send('ORDEN_NO_ENCONTRADA');
    }
    if (order.status !== 'pendiente') return res.send('OK');

    order.status = v.status;
    order.response_code = v.response_code;
    order.authorization_code = v.authorization_code;
    order.completed_at = new Date();
    await order.save();

    if (v.status === 'aprobado' && (order.concept === 'profesional' || order.concept === 'premium')) {
      await User.findByIdAndUpdate(order.user_id, { membership: order.concept });
    }
    await logActivity({
      userId: order.user_id, action: 'payment_' + v.status, entity: 'payment',
      entityId: v.orderId,
      details: `${order.method} · ${order.concept} · ${order.amount/100} € · ${v.response_reason || ''}`.trim(),
      ip: req.ip,
    });
    res.send('OK');
  } catch (e) { next(e); }
});

r.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const rows = await Payment.find({ user_id: req.user.id }).sort({ created_at: -1 }).limit(50).lean();
    res.json(rows);
  } catch (e) { next(e); }
});

r.get('/:orderId', requireAuth, async (req, res, next) => {
  try {
    const row = await Payment.findOne({ order_id: req.params.orderId, user_id: req.user.id }).lean();
    if (!row) return res.status(404).json({ error: 'Orden no encontrada' });
    res.json(row);
  } catch (e) { next(e); }
});

// ═══════════ CRIPTO (USDC / USDT) ════════════════════════════════════
//
// Flujo: quote → usuario envía la transferencia desde su wallet → confirm
//

/** POST /api/payments/crypto/quote — devuelve la dirección destino + monto exacto */
r.post('/crypto/quote', requireAuth, async (req, res, next) => {
  try {
    const { concept, chain_id, token } = req.body || {};
    if (!PRICES[concept]) return res.status(400).json({ error: 'concept inválido' });
    if (!chain_id)        return res.status(400).json({ error: 'chain_id es obligatorio' });
    if (!['usdc','usdt'].includes(token)) return res.status(400).json({ error: 'token debe ser usdc o usdt' });

    const orderId = generateOrderId();
    const { amount, label } = PRICES[concept];

    const quote = await getCryptoQuote({ amountCents: amount, chainId: Number(chain_id), token });

    await Payment.create({
      order_id: orderId, user_id: req.user.id, method: 'crypto',
      concept, amount, status: 'pendiente',
      crypto_chain_id: Number(chain_id),
      crypto_token: token.toUpperCase(),
      crypto_amount_units: quote.amount_units,
      crypto_merchant_address: quote.merchant_address,
    });

    await logActivity({
      userId: req.user.id, action: 'payment_init', entity: 'payment', entityId: orderId,
      details: `Cripto · ${concept} · ${quote.amount_display} ${quote.token} en ${quote.network}`, ip: req.ip,
    });

    res.json({ order_id: orderId, method: 'crypto', amount, label, quote });
  } catch (e) {
    if (e.message.includes('configurado') || e.message.includes('soportada') || e.message.includes('disponible')) {
      return res.status(400).json({ error: e.message });
    }
    next(e);
  }
});

/** POST /api/payments/crypto/confirm — usuario pega el tx hash y validamos on-chain */
r.post('/crypto/confirm', requireAuth, async (req, res, next) => {
  try {
    const { order_id, tx_hash } = req.body || {};
    if (!order_id || !tx_hash) return res.status(400).json({ error: 'order_id y tx_hash son obligatorios' });

    const order = await Payment.findOne({ order_id, user_id: req.user.id });
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
    if (order.method !== 'crypto') return res.status(400).json({ error: 'La orden no es de pago en cripto' });
    if (order.status === 'aprobado') return res.json({ ok: true, status: 'aprobado', note: 'Orden ya confirmada' });

    const result = await verifyCryptoTransfer({
      txHash: tx_hash,
      chainId: order.crypto_chain_id,
      token: order.crypto_token.toLowerCase(),
      expectedAmountUnits: order.crypto_amount_units,
    });

    if (!result.ok) {
      return res.status(400).json({ error: result.error, ...result });
    }

    // Marcar la orden como aprobada
    order.status = 'aprobado';
    order.crypto_tx_hash = tx_hash;
    order.crypto_block_number = result.block_number;
    order.crypto_confirmations = result.confirmations;
    order.crypto_from_address  = result.from;
    order.completed_at = new Date();
    await order.save();

    // Activar membresía si corresponde
    if (order.concept === 'profesional' || order.concept === 'premium') {
      await User.findByIdAndUpdate(order.user_id, { membership: order.concept });
    }

    await logActivity({
      userId: req.user.id, action: 'payment_aprobado', entity: 'payment', entityId: order_id,
      details: `Cripto ${order.crypto_token} en ${result.network} · ${result.amount_display} · tx ${tx_hash.slice(0,12)}…`,
      ip: req.ip,
    });

    res.json({
      ok: true,
      status: 'aprobado',
      tx_hash,
      block_number: result.block_number,
      confirmations: result.confirmations,
      explorer_url: result.explorer_url,
      amount: result.amount_display,
      token: result.token,
      network: result.network,
    });
  } catch (e) { next(e); }
});

export default r;
