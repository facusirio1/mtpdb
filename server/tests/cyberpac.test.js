/**
 * MTP PLATFORM — Tests de cumplimiento con la Guía Cyberpac.
 *
 * Valida que las nuevas defensas implementadas en redsys.js se comporten
 * según lo que pide la documentación oficial de CaixaBank / Comercia.
 */
import { describe, test, before } from 'node:test';
import assert from 'node:assert/strict';

before(() => {
  process.env.REDSYS_MERCHANT_CODE = '369581947';
  process.env.REDSYS_SECRET_KEY = 'sq7HjrUOBfKmC576ILgskD5srU870gJ7';
  process.env.REDSYS_ENVIRONMENT = 'test';
  process.env.REDSYS_TERMINAL = '1';
  process.env.REDSYS_CURRENCY = '978';
});

describe('Cyberpac — validación de orderId (SIS0075/0076/0077)', () => {
  test('rechaza orderId con menos de 4 caracteres', async () => {
    const { validateOrderId } = await import('../src/payments/redsys.js');
    const r = validateOrderId('123');
    assert.equal(r.valid, false);
    assert.match(r.error, /SIS0075/);
  });

  test('rechaza orderId con más de 12 caracteres', async () => {
    const { validateOrderId } = await import('../src/payments/redsys.js');
    const r = validateOrderId('1234567890123');
    assert.equal(r.valid, false);
    assert.match(r.error, /SIS0076/);
  });

  test('rechaza orderId cuyos 4 primeros caracteres no son numéricos', async () => {
    const { validateOrderId } = await import('../src/payments/redsys.js');
    const r = validateOrderId('ABCD1234');
    assert.equal(r.valid, false);
    assert.match(r.error, /SIS0077/);
  });

  test('rechaza caracteres no alfanuméricos (espacios, guiones)', async () => {
    const { validateOrderId } = await import('../src/payments/redsys.js');
    assert.equal(validateOrderId('1234-5678').valid, false);
    assert.equal(validateOrderId('1234 5678').valid, false);
    assert.equal(validateOrderId('1234_5678').valid, false);
  });

  test('acepta orderId válido (4 dígitos numéricos + alfanumérico)', async () => {
    const { validateOrderId } = await import('../src/payments/redsys.js');
    assert.equal(validateOrderId('1234').valid, true);
    assert.equal(validateOrderId('1234ABCD').valid, true);
    assert.equal(validateOrderId('1234abcd5678').valid, true);   // 12 chars max
  });

  test('generateOrderId() genera orderIds que pasan la validación', async () => {
    const { generateOrderId, validateOrderId } = await import('../src/payments/redsys.js');
    for (let i = 0; i < 50; i++) {
      const id = generateOrderId();
      const v = validateOrderId(id);
      assert.equal(v.valid, true, `orderId generado debe ser válido: ${id} — ${v.error}`);
    }
  });
});

describe('Cyberpac — saneamiento de strings (SIS0007/SIS0431)', () => {
  test('elimina el carácter % que rompe el Base64', async () => {
    const { sanitizeForRedsys } = await import('../src/payments/redsys.js');
    assert.equal(sanitizeForRedsys('Descuento 50% off'), 'Descuento 50 off');
    assert.equal(sanitizeForRedsys('%%%%'), '');
  });

  test('elimina caracteres de control y HTML tags', async () => {
    const { sanitizeForRedsys } = await import('../src/payments/redsys.js');
    assert.equal(sanitizeForRedsys('Producto<script>alert(1)</script>'), 'Productoscriptalert(1)/script');
    assert.equal(sanitizeForRedsys('Test\u0000null\u001Fbyte'), 'Testnullbyte');
  });

  test('respeta el límite de longitud', async () => {
    const { sanitizeForRedsys } = await import('../src/payments/redsys.js');
    const long = 'a'.repeat(200);
    assert.equal(sanitizeForRedsys(long, 125).length, 125);
  });

  test('createPayment() rechaza orderId inválido antes de firmar', async () => {
    const { createPayment } = await import('../src/payments/redsys.js');
    assert.throws(
      () => createPayment({ orderId: 'XX', amount: 2900, description: 'Test', userId: 'u' }),
      /SIS0075/
    );
  });

  test('createPayment() sanea el % en la descripción automáticamente', async () => {
    const { createPayment } = await import('../src/payments/redsys.js');
    const form = createPayment({
      orderId: '1234ABCD5678',
      amount: 2900,
      description: 'Promo 50% off — premium',
      userId: 'u',
    });
    const decoded = JSON.parse(Buffer.from(form.Ds_MerchantParameters, 'base64').toString('utf8'));
    assert.ok(!decoded.DS_MERCHANT_PRODUCTDESCRIPTION.includes('%'),
      'la descripción no debe contener % después del saneamiento');
  });

  test('createPayment() valida que amount sea entero positivo', async () => {
    const { createPayment } = await import('../src/payments/redsys.js');
    assert.throws(() => createPayment({ orderId: '1234ABCD', amount: -100, description: 'x', userId: 'u' }), /Importe inválido/);
    assert.throws(() => createPayment({ orderId: '1234ABCD', amount: 'abc', description: 'x', userId: 'u' }), /Importe inválido/);
    // amount=0 cae primero en el guard de "obligatorios" (correcto, otro tipo de error)
    assert.throws(() => createPayment({ orderId: '1234ABCD', amount: 0, description: 'x', userId: 'u' }), /obligatorios/);
  });
});

describe('Cyberpac — catálogo de errores SIS', () => {
  test('lookupRedsysError() reconoce SIS0042 (firma inválida)', async () => {
    const { lookupRedsysError } = await import('../src/payments/redsys-errors.js');
    const info = lookupRedsysError('SIS0042');
    assert.ok(info);
    assert.match(info.title, /firma/i);
    assert.match(info.fix, /REDSYS_SECRET_KEY/);
  });

  test('lookupRedsysError() reconoce formatos alternativos (0042, 42)', async () => {
    const { lookupRedsysError } = await import('../src/payments/redsys-errors.js');
    assert.ok(lookupRedsysError('0042'));
    assert.ok(lookupRedsysError('42'));
    assert.ok(lookupRedsysError(42));
  });

  test('lookupRedsysError() reconoce HTTP 403 con las IPs de Redsys a whitelistear', async () => {
    const { lookupRedsysError } = await import('../src/payments/redsys-errors.js');
    const info = lookupRedsysError(403);
    assert.ok(info);
    assert.match(info.fix, /193\.16\.243/);
    assert.match(info.fix, /194\.224\.159/);
  });

  test('lookupRedsysError() retorna null para códigos desconocidos', async () => {
    const { lookupRedsysError } = await import('../src/payments/redsys-errors.js');
    assert.equal(lookupRedsysError('SIS9876'), null);
    assert.equal(lookupRedsysError(null), null);
  });

  test('friendlyDeniedReason() devuelve mensaje legible según código', async () => {
    const { friendlyDeniedReason } = await import('../src/payments/redsys-errors.js');
    assert.equal(friendlyDeniedReason(0), 'Operación aprobada');
    assert.equal(friendlyDeniedReason(50), 'Operación aprobada');     // <100 = OK
    assert.equal(friendlyDeniedReason(900), 'Devolución/preautorización confirmada');
    assert.match(friendlyDeniedReason(101), /Denegada por el banco/);
    assert.match(friendlyDeniedReason(9001), /(Error|validación)/i);  // 9001 está catalogado
    assert.match(friendlyDeniedReason(9928), /Sesión expirada/);     // 30 min sin completar
    assert.match(friendlyDeniedReason(9929), /Anulación/);            // cliente canceló
  });

  test('verifyNotification() incluye response_reason en la respuesta', async () => {
    const { createPayment, verifyNotification } = await import('../src/payments/redsys.js');
    const crypto = await import('node:crypto');

    function tripleDes(msg, key) {
      const iv = Buffer.alloc(8, 0);
      const c = crypto.createCipheriv('des-ede3-cbc', Buffer.from(key, 'base64'), iv);
      c.setAutoPadding(false);
      const buf = Buffer.from(msg, 'utf8');
      const padded = Buffer.concat([buf, Buffer.alloc(8 - (buf.length % 8 || 8), 0)]);
      return Buffer.concat([c.update(padded), c.final()]);
    }

    // Notificación denegada con código 184 (autenticación fallida)
    const orderId = '9999ABCDEF12';
    const payload = Buffer.from(JSON.stringify({
      Ds_Order: orderId, Ds_Amount: '2900', Ds_Response: '184',
    })).toString('base64');
    const dk = tripleDes(orderId, process.env.REDSYS_SECRET_KEY);
    const sig = crypto.createHmac('sha256', dk).update(payload).digest('base64')
      .replace(/\+/g, '-').replace(/\//g, '_');

    const r = verifyNotification({ Ds_MerchantParameters: payload, Ds_Signature: sig });
    assert.equal(r.valid, true);
    assert.equal(r.status, 'denegado');
    assert.equal(r.response_code, 184);
    assert.match(r.response_reason, /autenticación|3D Secure/i);
  });
});
