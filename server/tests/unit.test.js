/**
 * MTP PLATFORM — Tests unitarios puros (sin MongoDB).
 * Corren en CI incluso sin red para descargar Mongo binary.
 */
import { describe, test, before } from 'node:test';
import assert from 'node:assert/strict';

before(() => {
  process.env.REDSYS_MERCHANT_CODE = '369581947';
  process.env.REDSYS_SECRET_KEY = 'sq7HjrUOBfKmC576ILgskD5srU870gJ7';
  process.env.REDSYS_ENVIRONMENT = 'test';
  process.env.REDSYS_TERMINAL = '1';
  process.env.REDSYS_CURRENCY = '978';
  process.env.BIZUM_ENABLED = 'true';
});

describe('Redsys — firma HMAC-SHA256 + 3DES', () => {
  test('redsysHealth() refleja la configuración', async () => {
    const { redsysHealth } = await import('../src/payments/redsys.js');
    const h = redsysHealth();
    assert.equal(h.configured, true);
    assert.equal(h.environment, 'test');
    assert.match(h.merchant_code, /^\*\*\*\d{4}$/);
    assert.match(h.endpoint, /sis-t\.redsys\.es/);
  });

  test('generateOrderId() devuelve formato válido (4 dígitos + 8 hex)', async () => {
    const { generateOrderId } = await import('../src/payments/redsys.js');
    const id = generateOrderId();
    assert.equal(id.length, 12);
    assert.match(id, /^\d{4}[0-9A-F]{8}$/);

    // Los IDs deben ser únicos
    const ids = new Set();
    for (let i = 0; i < 100; i++) ids.add(generateOrderId());
    assert.equal(ids.size, 100, 'todos los IDs generados deben ser únicos');
  });

  test('createPayment() arma el form correctamente firmado', async () => {
    const { createPayment } = await import('../src/payments/redsys.js');
    const form = createPayment({
      orderId: '1234ABCD5678',
      amount: 2900,
      description: 'Test',
      userId: 'u1',
    });
    assert.equal(form.Ds_SignatureVersion, 'HMAC_SHA256_V1');
    assert.ok(form.Ds_MerchantParameters.length > 0);
    assert.ok(form.Ds_Signature.length > 0);
    assert.match(form.url, /redsys/);

    // El payload debe ser base64 decodificable y contener los campos esperados
    const decoded = JSON.parse(Buffer.from(form.Ds_MerchantParameters, 'base64').toString('utf8'));
    assert.equal(decoded.DS_MERCHANT_AMOUNT, '2900');
    assert.equal(decoded.DS_MERCHANT_ORDER, '1234ABCD5678');
    assert.equal(decoded.DS_MERCHANT_CURRENCY, '978');
  });

  test('verifyNotification() acepta firma válida y rechaza inválida', async () => {
    const { verifyNotification } = await import('../src/payments/redsys.js');
    const crypto = await import('node:crypto');

    function tripleDes(msg, key) {
      const iv = Buffer.alloc(8, 0);
      const c = crypto.createCipheriv('des-ede3-cbc', Buffer.from(key, 'base64'), iv);
      c.setAutoPadding(false);
      const buf = Buffer.from(msg, 'utf8');
      const padded = Buffer.concat([buf, Buffer.alloc(8 - (buf.length % 8 || 8), 0)]);
      return Buffer.concat([c.update(padded), c.final()]);
    }

    const orderId = '9999ABCDEF12';
    const payload = Buffer.from(JSON.stringify({
      Ds_Order: orderId, Ds_Amount: '2900', Ds_Response: '0', Ds_AuthorisationCode: 'AUTH123',
    })).toString('base64');
    const dk = tripleDes(orderId, process.env.REDSYS_SECRET_KEY);
    const validSig = crypto.createHmac('sha256', dk).update(payload).digest('base64')
      .replace(/\+/g, '-').replace(/\//g, '_');

    const ok = verifyNotification({ Ds_MerchantParameters: payload, Ds_Signature: validSig });
    assert.equal(ok.valid, true);
    assert.equal(ok.status, 'aprobado');           // Ds_Response < 100 → aprobado
    assert.equal(ok.orderId, orderId);
    assert.equal(ok.authorization_code, 'AUTH123');

    const bad = verifyNotification({ Ds_MerchantParameters: payload, Ds_Signature: 'wrong' });
    assert.equal(bad.valid, false);

    // Response code denegado pero firma válida
    const denied = Buffer.from(JSON.stringify({
      Ds_Order: orderId, Ds_Amount: '2900', Ds_Response: '9999',
    })).toString('base64');
    const denSig = crypto.createHmac('sha256', dk).update(denied).digest('base64')
      .replace(/\+/g, '-').replace(/\//g, '_');
    const den = verifyNotification({ Ds_MerchantParameters: denied, Ds_Signature: denSig });
    assert.equal(den.valid, true);
    assert.equal(den.status, 'denegado');
  });
});

describe('Bizum', () => {
  test('bizumHealth() refleja la configuración', async () => {
    const { bizumHealth } = await import('../src/payments/bizum.js');
    const h = bizumHealth();
    assert.equal(h.configured, true);
    assert.equal(h.enabled, true);
  });

  test('createBizumPayment() rechaza teléfono inválido', async () => {
    const { createBizumPayment } = await import('../src/payments/bizum.js');
    assert.throws(
      () => createBizumPayment({ orderId: '1111AAAA2222', amount: 2900, phone: 'noesuntelefono' }),
      /inválido/i,
    );
  });

  test('createBizumPayment() arma form correctamente', async () => {
    const { createBizumPayment } = await import('../src/payments/bizum.js');
    const form = createBizumPayment({
      orderId: '1111AAAA2222', amount: 2900, phone: '+34600123456', description: 'Test',
    });
    assert.equal(form.payment_method, 'bizum');
    assert.match(form.phone_masked, /\*\*\*\*/);

    const decoded = JSON.parse(Buffer.from(form.Ds_MerchantParameters, 'base64').toString('utf8'));
    assert.equal(decoded.DS_MERCHANT_PAYMETHODS, 'z', 'el código z activa Bizum');
    assert.equal(decoded.DS_MERCHANT_P2F, '34600123456');
  });
});

describe('AI heurística', () => {
  test('detecta riesgo alto por keywords sospechosas', async () => {
    const { analyzeDocument } = await import('../src/ai.js');
    const r = await analyzeDocument({
      title: 'Caso de fraude bancario',
      description: 'denuncia urgente sobre estafa',
      type: 'cte',
    });
    assert.equal(r.risk, 'alto');
    assert.match(r.summary, /económico/i);
  });

  test('detecta riesgo medio por keywords moderadas', async () => {
    const { analyzeDocument } = await import('../src/ai.js');
    const r = await analyzeDocument({
      title: 'Documento pendiente',
      description: 'requiere revisar',
      type: 'cen',
    });
    assert.equal(r.risk, 'medio');
  });

  test('riesgo bajo por defecto y summary específico por tipo', async () => {
    const { analyzeDocument } = await import('../src/ai.js');
    const cte = await analyzeDocument({ title: 'Balance Q4', description: 'normal', type: 'cte' });
    assert.equal(cte.risk, 'bajo');
    assert.match(cte.summary, /económic/i);

    const ctk = await analyzeDocument({ title: 'Feedlot', description: 'normal', type: 'ctk' });
    assert.match(ctk.summary, /tokeniz/i);
  });
});
