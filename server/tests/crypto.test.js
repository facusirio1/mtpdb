/**
 * MTP PLATFORM — Tests del módulo de pagos cripto USDC/USDT.
 * Sin red real — solo validamos lógica de cotización y formato.
 */
import { describe, test, before } from 'node:test';
import assert from 'node:assert/strict';

before(() => {
  process.env.CRYPTO_MERCHANT_ADDRESS = '0x742d35cc6634c0532925a3b844bc9e7595f0beb1';
  process.env.CRYPTO_MIN_CONFIRMATIONS = '3';
  // Configurar contratos ETTIOS para tests
  process.env.ETTIOS_USDC_ADDRESS = '0x1234567890123456789012345678901234567890';
  process.env.ETTIOS_USDT_ADDRESS = '0x0987654321098765432109876543210987654321';
  // Forzar fallback del oracle Chainlink (no hay RPC en CI)
  process.env.CHAINLINK_FALLBACK_DISABLED = 'false';
  process.env.CHAINLINK_TIMEOUT_MS = '500';
  process.env.CRYPTO_RPC_POLYGON = 'https://127.0.0.1:1/fail';
});

describe('Cripto — health', () => {
  test('cryptoHealth() refleja configuración correcta', async () => {
    const { cryptoHealth } = await import('../src/payments/crypto.js');
    const h = cryptoHealth();
    assert.equal(h.configured, true);
    assert.equal(h.min_confirmations, 3);
    assert.match(h.merchant_address, /^0x[0-9a-fA-F]{4}…[0-9a-fA-F]{4}$/, 'address debe estar enmascarada');
    assert.ok(h.networks.length >= 4, 'al menos 4 redes soportadas');
    assert.ok(h.networks.find(n => n.chainId === 1), 'Ethereum debe estar');
    assert.ok(h.networks.find(n => n.chainId === 137), 'Polygon debe estar');
    assert.ok(h.networks.find(n => n.chainId === 56), 'BSC debe estar');
    assert.ok(h.networks.find(n => n.chainId === 2237), 'ETTIOS debe estar');
  });

  test('supportedNetworks() devuelve solo las que tienen tokens disponibles', async () => {
    const { supportedNetworks } = await import('../src/payments/crypto.js');
    const nets = supportedNetworks();
    nets.forEach(n => {
      assert.ok(n.tokens.length > 0, `${n.name} debe tener al menos un token`);
    });
  });
});

describe('Cripto — cotización', () => {
  test('getCryptoQuote() para Polygon USDC genera monto correcto', async () => {
    const { getCryptoQuote } = await import('../src/payments/crypto.js');
    const q = await getCryptoQuote({ amountCents: 2900, chainId: 137, token: 'usdc' });
    assert.equal(q.chain_id, 137);
    assert.equal(q.network, 'Polygon');
    assert.equal(q.token, 'USDC');
    assert.equal(q.decimals, 6);
    assert.equal(q.amount_cents_eur, 2900);
    // Con paridad 1:1 fallback (sin Chainlink real), 29 EUR = 29 USDC = 29000000 unidades
    assert.equal(q.amount_units, '29000000');
    assert.equal(q.merchant_address.toLowerCase(), '0x742d35cc6634c0532925a3b844bc9e7595f0beb1');
    assert.ok(q.instructions.length >= 3);
    assert.ok(typeof q.exchange_rate_eur_usd === 'number');
  });

  test('USDT en BSC usa 18 decimales (BEP-20)', async () => {
    const { getCryptoQuote } = await import('../src/payments/crypto.js');
    const q = await getCryptoQuote({ amountCents: 7900, chainId: 56, token: 'usdt' });
    assert.equal(q.network, 'BSC');
    assert.equal(q.token, 'USDT');
    assert.equal(q.decimals, 18);
    assert.equal(q.amount_units, '79000000000000000000');
  });

  test('USDC en Ethereum usa 6 decimales', async () => {
    const { getCryptoQuote } = await import('../src/payments/crypto.js');
    const q = await getCryptoQuote({ amountCents: 500, chainId: 1, token: 'usdc' });
    assert.equal(q.network, 'Ethereum');
    assert.equal(q.decimals, 6);
    assert.equal(q.amount_units, '5000000');
  });

  test('rechaza red no soportada', async () => {
    const { getCryptoQuote } = await import('../src/payments/crypto.js');
    await assert.rejects(
      async () => await getCryptoQuote({ amountCents: 2900, chainId: 9999, token: 'usdc' }),
      /(no soportada|inválida)/i
    );
  });

  test('con merchant configurado no tira error', async () => {
    const { getCryptoQuote } = await import('../src/payments/crypto.js');
    process.env.CRYPTO_MERCHANT_ADDRESS = '0x742d35cc6634c0532925a3b844bc9e7595f0beb1';
    await assert.doesNotReject(async () => await getCryptoQuote({ amountCents: 2900, chainId: 137, token: 'usdc' }));
  });
});

describe('Cripto — verificación de tx', () => {
  test('verifyCryptoTransfer() rechaza hash con formato inválido', async () => {
    const { verifyCryptoTransfer } = await import('../src/payments/crypto.js');
    const r = await verifyCryptoTransfer({
      txHash: 'no_es_un_hash',
      chainId: 137,
      token: 'usdc',
      expectedAmountUnits: '29000000',
    });
    assert.equal(r.ok, false);
    assert.match(r.error, /formato inválido/);
  });

  test('verifyCryptoTransfer() rechaza red no soportada', async () => {
    const { verifyCryptoTransfer } = await import('../src/payments/crypto.js');
    const r = await verifyCryptoTransfer({
      txHash: '0x' + 'a'.repeat(64),
      chainId: 9999,
      token: 'usdc',
      expectedAmountUnits: '29000000',
    });
    assert.equal(r.ok, false);
    assert.match(r.error, /no soportada/);
  });
});
