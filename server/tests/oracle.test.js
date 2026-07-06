/**
 * MTP PLATFORM — Tests del oracle Chainlink EUR/USD.
 *
 * No hacemos calls reales a Chainlink en CI (eso requeriría conectividad
 * a un RPC público). Probamos la lógica de fallback, la conversión y el
 * cache. Para validación end-to-end con Chainlink real, ver oracle:live
 * en el script test:live (corre solo on demand).
 */
import { describe, test, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

before(() => {
  // Timeout corto para que los tests no tarden eternamente esperando
  // que un RPC inexistente devuelva un error.
  process.env.CHAINLINK_TIMEOUT_MS = '500';
  // Forzamos fallback porque los tests corren en CI sin acceso al RPC.
  // El módulo crypto seguirá funcionando con paridad 1:1 si Chainlink falla.
  process.env.CHAINLINK_FALLBACK_DISABLED = 'false';
  // Apuntamos a un RPC inexistente para garantizar que el fetch falle
  // y caigamos al fallback. Esto valida que el fallback funcione.
  process.env.CRYPTO_RPC_POLYGON = 'https://127.0.0.1:1/this-will-fail';
  process.env.CRYPTO_RPC_ETHEREUM = 'https://127.0.0.1:1/this-will-fail';
});

beforeEach(async () => {
  const { _resetCache } = await import('../src/payments/oracle.js');
  _resetCache();
});

describe('Oracle — Chainlink EUR/USD', () => {
  test('getEurUsdRate() con fallback devuelve paridad 1:1', async () => {
    const { getEurUsdRate } = await import('../src/payments/oracle.js');
    const r = await getEurUsdRate();
    // Como el RPC está roto y fallback NO está deshabilitado, debe devolver 1.0
    assert.equal(r.source, 'fallback');
    assert.equal(r.rate, 1.0);
    assert.ok(r.error, 'debe incluir el mensaje de error original');
  });

  test('oracleHealth() informa correctamente el estado fallback', async () => {
    const { oracleHealth } = await import('../src/payments/oracle.js');
    const h = await oracleHealth();
    assert.equal(h.configured, true);
    assert.equal(h.source, 'fallback');
    assert.equal(h.rate_eur_usd, 1.0);
  });

  test('convertEurToStable() con paridad 1:1 devuelve monto idéntico', async () => {
    const { convertEurToStable } = await import('../src/payments/oracle.js');
    // 29 EUR con paridad 1:1 = 29 USDC = 29000000 unidades (6 decimales)
    const r = await convertEurToStable(2900, 6);
    assert.equal(r.units, 29000000n);
    assert.equal(r.rate, 1.0);
    assert.equal(r.displayUsd, '29.000000');
  });

  test('convertEurToStable() respeta los decimales del token', async () => {
    const { convertEurToStable } = await import('../src/payments/oracle.js');
    // USDT en BSC usa 18 decimales
    const r = await convertEurToStable(7900, 18);
    assert.equal(r.units, 79000000000000000000n);
  });

  test('cache funciona: dos llamadas seguidas no van al RPC dos veces', async () => {
    const { getEurUsdRate } = await import('../src/payments/oracle.js');
    const t1 = Date.now();
    await getEurUsdRate();
    const elapsed1 = Date.now() - t1;

    const t2 = Date.now();
    const r2 = await getEurUsdRate();
    const elapsed2 = Date.now() - t2;

    assert.equal(r2.cached, true, 'la segunda llamada debe venir del cache');
    assert.ok(elapsed2 < elapsed1, 'la segunda llamada debe ser más rápida');
  });

  test('CHAINLINK_FALLBACK_DISABLED=true hace que tire error en lugar de devolver 1:1', async () => {
    // Setear la flag y resetear el cache
    process.env.CHAINLINK_FALLBACK_DISABLED = 'true';
    const { getEurUsdRate, _resetCache } = await import('../src/payments/oracle.js');
    _resetCache();
    await assert.rejects(
      async () => await getEurUsdRate(),
      /Chainlink oracle falló y CHAINLINK_FALLBACK_DISABLED=true/
    );
    // Restaurar para no afectar tests siguientes
    process.env.CHAINLINK_FALLBACK_DISABLED = 'false';
  });
});

describe('Integración crypto + oracle', () => {
  test('getCryptoQuote() incluye exchange_rate_eur_usd', async () => {
    process.env.CRYPTO_MERCHANT_ADDRESS = '0x742d35cc6634c0532925a3b844bc9e7595f0beb1';
    const { _resetCache } = await import('../src/payments/oracle.js');
    _resetCache();

    const { getCryptoQuote } = await import('../src/payments/crypto.js');
    const q = await getCryptoQuote({ amountCents: 2900, chainId: 137, token: 'usdc' });

    assert.equal(typeof q.exchange_rate_eur_usd, 'number');
    assert.ok(q.exchange_rate_eur_usd > 0);
    assert.ok(['chainlink', 'fallback'].includes(q.rate_source), `rate_source debe ser chainlink o fallback, fue: ${q.rate_source}`);

    // Con fallback 1:1 (en CI), 29 EUR = 29 USDC
    // Con chainlink real, sería ~31-32 USDC según la cotización del día
    assert.ok(q.amount_units === '29000000' || BigInt(q.amount_units) > 25000000n);

    // Las instrucciones deben mencionar la cotización
    assert.ok(q.instructions.some(s => /Cotización aplicada/.test(s)));
  });
});
