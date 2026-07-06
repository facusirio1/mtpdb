/**
 * MTP PLATFORM — Bizum sobre Redsys.
 */
import crypto from 'node:crypto';
import { generateOrderId } from './redsys.js';

const REDSYS_URLS = {
  test:       'https://sis-t.redsys.es:25443/sis/realizarPago',
  production: 'https://sis.redsys.es/sis/realizarPago',
};

const ENV = process.env.REDSYS_ENVIRONMENT || 'test';
const MERCHANT_CODE = process.env.REDSYS_MERCHANT_CODE || '';
const TERMINAL = process.env.REDSYS_TERMINAL || '1';
const CURRENCY = process.env.REDSYS_CURRENCY || '978';
const SECRET_KEY = process.env.REDSYS_SECRET_KEY || '';
const BIZUM_ENABLED = process.env.BIZUM_ENABLED === 'true';

function tripleDesEncrypt(msg, key) {
  const iv = Buffer.alloc(8, 0);
  const cipher = crypto.createCipheriv('des-ede3-cbc', Buffer.from(key, 'base64'), iv);
  cipher.setAutoPadding(false);
  const buf = Buffer.from(msg, 'utf8');
  const padded = Buffer.concat([buf, Buffer.alloc(8 - (buf.length % 8 || 8), 0)]);
  return Buffer.concat([cipher.update(padded), cipher.final()]);
}
function sign(b64, orderId) {
  const dk = tripleDesEncrypt(orderId, SECRET_KEY);
  return crypto.createHmac('sha256', dk).update(b64).digest('base64');
}

export function bizumHealth() {
  return { configured: !!(MERCHANT_CODE && SECRET_KEY), enabled: BIZUM_ENABLED, environment: ENV };
}

export function createBizumPayment({ orderId, amount, phone, description, userId }) {
  if (!MERCHANT_CODE || !SECRET_KEY) throw new Error('Bizum no configurado.');
  if (!BIZUM_ENABLED) throw new Error('Bizum no está habilitado en este contrato.');
  if (!phone) throw new Error('Para Bizum, el teléfono es obligatorio');
  if (!/^[+]?[0-9]{9,15}$/.test(phone.replace(/\s/g, ''))) throw new Error('Teléfono inválido');

  const payload = {
    DS_MERCHANT_AMOUNT: String(amount),
    DS_MERCHANT_ORDER: orderId || generateOrderId(),
    DS_MERCHANT_MERCHANTCODE: MERCHANT_CODE,
    DS_MERCHANT_CURRENCY: CURRENCY,
    DS_MERCHANT_TRANSACTIONTYPE: '0',
    DS_MERCHANT_TERMINAL: TERMINAL,
    DS_MERCHANT_PAYMETHODS: 'z',
    DS_MERCHANT_P2F: phone.replace(/[\s+]/g, ''),
    DS_MERCHANT_MERCHANTURL: process.env.REDSYS_NOTIFICATION_URL || '',
    DS_MERCHANT_URLOK:       process.env.REDSYS_OK_URL || '',
    DS_MERCHANT_URLKO:       process.env.REDSYS_KO_URL || '',
    DS_MERCHANT_PRODUCTDESCRIPTION: description || 'MTP Platform — Bizum',
    DS_MERCHANT_TITULAR: userId || 'usuario',
    DS_MERCHANT_CONSUMERLANGUAGE: '001',
  };

  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  return {
    url: REDSYS_URLS[ENV],
    Ds_SignatureVersion: 'HMAC_SHA256_V1',
    Ds_MerchantParameters: b64,
    Ds_Signature: sign(b64, payload.DS_MERCHANT_ORDER),
    payment_method: 'bizum',
    phone_masked: phone.slice(0, 3) + '****' + phone.slice(-3),
  };
}
