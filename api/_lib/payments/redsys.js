/**
 * MTP PLATFORM — Redsys / CaixaBank Cyberpac.
 *
 * Implementación basada en la Guía de Integración oficial del Cyberpac
 * publicada por Comercia Global Payments (CaixaBank).
 *
 *   • Firma HMAC-SHA256 sobre payload Base64 + 3DES del orderId
 *   • orderId 4-12 caracteres, primeros 4 numéricos, alfanumérico [A-Za-z0-9]
 *   • Saneamiento del carácter % que rompe el JSON Base64 (causa de SIS0007 / SIS0431)
 *   • Endpoints test (sis-t.redsys.es:25443) y producción (sis.redsys.es)
 */
import crypto from 'node:crypto';
import { friendlyDeniedReason } from './redsys-errors.js';

const REDSYS_URLS = {
  test:       'https://sis-t.redsys.es:25443/sis/realizarPago',
  production: 'https://sis.redsys.es/sis/realizarPago',
};

const ENV = process.env.REDSYS_ENVIRONMENT || 'test';
const MERCHANT_CODE = process.env.REDSYS_MERCHANT_CODE || '';
const TERMINAL = process.env.REDSYS_TERMINAL || '1';
const CURRENCY = process.env.REDSYS_CURRENCY || '978';
const SECRET_KEY = process.env.REDSYS_SECRET_KEY || '';

/**
 * Sanea un string para que sea seguro de incluir en el JSON que se codifica en
 * Base64. Quita el % (causa SIS0007/SIS0431) y otros caracteres especiales
 * que históricamente generan problemas con Redsys.
 */
export function sanitizeForRedsys(str, maxLen = 125) {
  if (!str) return '';
  return String(str)
    .replace(/%/g, '')                  // SIS0431 — el % rompe el Base64
    .replace(/[\u0000-\u001F\u007F]/g, '') // caracteres de control
    .replace(/[<>"]/g, '')              // tags HTML / quote bug
    .replace(/\s+/g, ' ')               // colapsar espacios
    .trim()
    .slice(0, maxLen);                  // límite seguro
}

/**
 * Valida que un orderId cumpla las reglas oficiales de Redsys:
 *   • 4 a 12 caracteres
 *   • Los primeros 4 deben ser numéricos
 *   • Sólo [A-Z][a-z][0-9]
 * Devuelve { valid, error } sin lanzar excepciones.
 */
export function validateOrderId(orderId) {
  if (!orderId) return { valid: false, error: 'orderId vacío (SIS0075)' };
  const s = String(orderId);
  if (s.length < 4)  return { valid: false, error: `orderId con menos de 4 caracteres (SIS0075): "${s}"` };
  if (s.length > 12) return { valid: false, error: `orderId con más de 12 caracteres (SIS0076): "${s}"` };
  if (!/^\d{4}/.test(s)) return { valid: false, error: `los primeros 4 caracteres deben ser numéricos (SIS0077): "${s}"` };
  if (!/^[A-Za-z0-9]+$/.test(s)) return { valid: false, error: `caracteres inválidos en orderId (SIS0077): "${s}"` };
  return { valid: true };
}

export function redsysHealth() {
  return {
    configured: !!(MERCHANT_CODE && SECRET_KEY),
    environment: ENV,
    endpoint: REDSYS_URLS[ENV],
    merchant_code: MERCHANT_CODE ? `***${MERCHANT_CODE.slice(-4)}` : null,
    notification_url_configured: !!process.env.REDSYS_NOTIFICATION_URL,
    notification_url_is_https: (process.env.REDSYS_NOTIFICATION_URL || '').startsWith('https://'),
  };
}

export function generateOrderId() {
  return Date.now().toString().slice(-4) + crypto.randomBytes(4).toString('hex').toUpperCase();
}

function tripleDesEncrypt(message, key) {
  const iv = Buffer.alloc(8, 0);
  const cipher = crypto.createCipheriv('des-ede3-cbc', Buffer.from(key, 'base64'), iv);
  cipher.setAutoPadding(false);
  const buf = Buffer.from(message, 'utf8');
  const padded = Buffer.concat([buf, Buffer.alloc(8 - (buf.length % 8 || 8), 0)]);
  return Buffer.concat([cipher.update(padded), cipher.final()]);
}

function sign(payloadBase64, orderId) {
  const derivedKey = tripleDesEncrypt(orderId, SECRET_KEY);
  return crypto.createHmac('sha256', derivedKey).update(payloadBase64).digest('base64');
}

export function createPayment({ orderId, amount, description, userId }) {
  if (!MERCHANT_CODE || !SECRET_KEY) throw new Error('Redsys no está configurado. Revisá REDSYS_MERCHANT_CODE y REDSYS_SECRET_KEY.');
  if (!orderId || !amount) throw new Error('orderId y amount son obligatorios');

  // Validar orderId según reglas oficiales (SIS0075/0076/0077)
  const v = validateOrderId(orderId);
  if (!v.valid) throw new Error(`Redsys: ${v.error}`);

  // Validar amount (debe ser entero positivo en céntimos)
  const amountInt = Math.round(Number(amount));
  if (!Number.isFinite(amountInt) || amountInt <= 0) {
    throw new Error(`Importe inválido: ${amount}. Debe ser entero positivo en céntimos.`);
  }

  // Sanear strings que van al JSON — evita SIS0007 / SIS0431
  const safeDescription = sanitizeForRedsys(description || 'MTP Platform', 125);
  const safeTitular     = sanitizeForRedsys(userId || 'usuario', 60);

  const payload = {
    DS_MERCHANT_AMOUNT: String(amountInt),
    DS_MERCHANT_ORDER: orderId,
    DS_MERCHANT_MERCHANTCODE: MERCHANT_CODE,
    DS_MERCHANT_CURRENCY: CURRENCY,
    DS_MERCHANT_TRANSACTIONTYPE: '0',
    DS_MERCHANT_TERMINAL: TERMINAL,
    DS_MERCHANT_MERCHANTURL: process.env.REDSYS_NOTIFICATION_URL || '',
    DS_MERCHANT_URLOK:       process.env.REDSYS_OK_URL || '',
    DS_MERCHANT_URLKO:       process.env.REDSYS_KO_URL || '',
    DS_MERCHANT_PRODUCTDESCRIPTION: safeDescription,
    DS_MERCHANT_TITULAR: safeTitular,
    DS_MERCHANT_CONSUMERLANGUAGE: '001',
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  return {
    url: REDSYS_URLS[ENV],
    Ds_SignatureVersion: 'HMAC_SHA256_V1',
    Ds_MerchantParameters: payloadBase64,
    Ds_Signature: sign(payloadBase64, orderId),
  };
}

export function verifyNotification(body) {
  const params = body.Ds_MerchantParameters;
  const receivedSig = body.Ds_Signature;
  if (!params || !receivedSig) return { valid: false, error: 'Faltan parámetros' };

  const decoded = JSON.parse(Buffer.from(params, 'base64').toString('utf8'));
  const orderId = decoded.Ds_Order || decoded.DS_MERCHANT_ORDER;
  if (!orderId) return { valid: false, error: 'Orden no encontrada' };

  const expectedSig = sign(params, orderId).replace(/\+/g, '-').replace(/\//g, '_');
  const incomingSig = receivedSig.replace(/\+/g, '-').replace(/\//g, '_');

  const valid = expectedSig === incomingSig;
  const responseCode = Number(decoded.Ds_Response || 9999);
  const status = valid && responseCode < 100 ? 'aprobado'
               : valid && responseCode === 900 ? 'aprobado'   // 900 = confirmación devolución
               : valid ? 'denegado'
               : 'firma_invalida';

  return {
    valid, status, orderId,
    amount: Number(decoded.Ds_Amount || 0),
    response_code: responseCode,
    response_reason: friendlyDeniedReason(responseCode),
    authorization_code: decoded.Ds_AuthorisationCode || null,
    decoded,
  };
}
