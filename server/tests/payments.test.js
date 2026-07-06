/**
 * MTP PLATFORM — Tests de pagos Redsys + Bizum.
 * Validan que la firma HMAC-SHA256 se calcule correctamente
 * (sin depender del servicio real de Redsys).
 */
import { describe, test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import {
  setupTestDb, teardownTestDb, clearCollections, getApp,
  seedUser, loginAs,
} from './_helpers.js';

let app;
before(async () => {
  // Configurar Redsys ANTES de levantar el app
  process.env.REDSYS_MERCHANT_CODE = '369581947';
  process.env.REDSYS_SECRET_KEY = 'sq7HjrUOBfKmC576ILgskD5srU870gJ7';
  process.env.REDSYS_ENVIRONMENT = 'test';
  process.env.REDSYS_TERMINAL = '1';
  process.env.REDSYS_CURRENCY = '978';
  process.env.BIZUM_ENABLED = 'true';
  await setupTestDb();
  app = await getApp();
});
after(async () => { await teardownTestDb(); });
beforeEach(async () => { await clearCollections(); });

describe('GET /api/payments/health', () => {
  test('devuelve estado de configuración y precios', async () => {
    const r = await request(app).get('/api/payments/health');
    assert.equal(r.status, 200);
    assert.equal(r.body.redsys.configured, true);
    assert.equal(r.body.redsys.environment, 'test');
    assert.match(r.body.redsys.merchant_code, /^\*\*\*\d{4}$/, 'merchant_code debe estar enmascarado');
    assert.equal(r.body.prices.profesional.amount, 2900);
    assert.equal(r.body.prices.premium.amount, 7900);
    assert.equal(r.body.prices.nft.amount, 500);
  });
});

describe('POST /api/payments/redsys/create', () => {
  test('requiere autenticación', async () => {
    const r = await request(app).post('/api/payments/redsys/create').send({ concept: 'profesional' });
    assert.equal(r.status, 401);
  });

  test('rechaza concept inválido', async () => {
    const { user } = await seedUser({ email: 'p@t.com' });
    const token = await loginAs(app, request, user.email);
    const r = await request(app).post('/api/payments/redsys/create')
      .set('Authorization', `Bearer ${token}`)
      .send({ concept: 'invalido' });
    assert.equal(r.status, 400);
  });

  test('crea orden + form de Redsys correctamente firmado', async () => {
    const { user } = await seedUser({ email: 'p2@t.com' });
    const token = await loginAs(app, request, user.email);
    const r = await request(app).post('/api/payments/redsys/create')
      .set('Authorization', `Bearer ${token}`)
      .send({ concept: 'profesional' });
    assert.equal(r.status, 200);
    assert.match(r.body.order_id, /^\d{4}[0-9A-F]{8}$/, 'order_id debe tener formato 4 dígitos + 8 hex');
    assert.equal(r.body.method, 'redsys');
    assert.equal(r.body.amount, 2900);

    // El form que se postea a Redsys
    assert.equal(r.body.form.Ds_SignatureVersion, 'HMAC_SHA256_V1');
    assert.ok(r.body.form.Ds_MerchantParameters.length > 0);
    assert.ok(r.body.form.Ds_Signature.length > 0);
    assert.match(r.body.form.url, /sis-t\.redsys\.es/, 'debe apuntar al endpoint de TEST');

    // La orden debe quedar persistida con status pendiente
    const { Payment } = await import('../src/models/index.js');
    const order = await Payment.findOne({ order_id: r.body.order_id });
    assert.equal(order.status, 'pendiente');
    assert.equal(order.amount, 2900);
    assert.equal(order.concept, 'profesional');
  });
});

describe('POST /api/payments/bizum/create', () => {
  test('requiere teléfono', async () => {
    const { user } = await seedUser({ email: 'b@t.com' });
    const token = await loginAs(app, request, user.email);
    const r = await request(app).post('/api/payments/bizum/create')
      .set('Authorization', `Bearer ${token}`)
      .send({ concept: 'premium' });
    assert.equal(r.status, 400);
  });

  test('crea orden Bizum con teléfono enmascarado en la respuesta', async () => {
    const { user } = await seedUser({ email: 'b2@t.com' });
    const token = await loginAs(app, request, user.email);
    const r = await request(app).post('/api/payments/bizum/create')
      .set('Authorization', `Bearer ${token}`)
      .send({ concept: 'profesional', phone: '+34600123456' });
    assert.equal(r.status, 200);
    assert.equal(r.body.method, 'bizum');
    assert.match(r.body.phone, /\*\*\*\*/, 'el teléfono debe venir enmascarado');
  });
});

describe('Firma de notificación Redsys', () => {
  test('verifyNotification valida firma correctamente y la inválida la rechaza', async () => {
    // Cargamos los helpers directamente
    const { createPayment, verifyNotification } = await import('../src/payments/redsys.js');

    const orderId = '1234ABCD5678';
    const payment = createPayment({ orderId, amount: 2900, description: 'Test', userId: 'u' });

    // Simular notificación válida (re-firmada con la misma orden + amount)
    const notifPayload = Buffer.from(JSON.stringify({
      Ds_Order: orderId, Ds_Amount: '2900', Ds_Response: '0', Ds_AuthorisationCode: 'ABC123',
    })).toString('base64');
    // Generar firma válida usando la misma lógica del módulo
    const crypto = await import('node:crypto');
    function tripleDes(msg, key) {
      const iv = Buffer.alloc(8, 0);
      const c = crypto.createCipheriv('des-ede3-cbc', Buffer.from(key, 'base64'), iv);
      c.setAutoPadding(false);
      const buf = Buffer.from(msg, 'utf8');
      const padded = Buffer.concat([buf, Buffer.alloc(8 - (buf.length % 8 || 8), 0)]);
      return Buffer.concat([c.update(padded), c.final()]);
    }
    const dk = tripleDes(orderId, process.env.REDSYS_SECRET_KEY);
    const validSig = crypto.createHmac('sha256', dk).update(notifPayload).digest('base64')
      .replace(/\+/g, '-').replace(/\//g, '_');

    const valid = verifyNotification({
      Ds_MerchantParameters: notifPayload,
      Ds_Signature: validSig,
    });
    assert.equal(valid.valid, true);
    assert.equal(valid.status, 'aprobado');
    assert.equal(valid.orderId, orderId);

    // Firma corrupta
    const corrupt = verifyNotification({
      Ds_MerchantParameters: notifPayload,
      Ds_Signature: 'firma_invalida_xxx',
    });
    assert.equal(corrupt.valid, false);
  });
});

describe('Verificador público', () => {
  test('búsqueda por hash inexistente devuelve found:false', async () => {
    const r = await request(app).get('/api/verify/' + 'a'.repeat(64));
    assert.equal(r.status, 200);
    assert.equal(r.body.found, false);
  });

  test('búsqueda por hash existente devuelve certificado completo', async () => {
    const { Document } = await import('../src/models/index.js');
    const { user } = await seedUser({ email: 'cert@t.com', full_name: 'Owner', reputation: 75 });
    const hash = 'b'.repeat(64);
    await Document.create({
      user_id: user._id, title: 'Doc verificable', doc_type: 'cte',
      file_hash: hash, status: 'validado',
    });

    const r = await request(app).get('/api/verify/' + hash);
    assert.equal(r.status, 200);
    assert.equal(r.body.found, true);
    assert.equal(r.body.certificate.title, 'Doc verificable');
    assert.equal(r.body.owner.name, 'Owner');
    assert.ok(r.body.score_breakdown.economico > 0);
    assert.ok(r.body.score_breakdown.tributario > 0);
  });
});
