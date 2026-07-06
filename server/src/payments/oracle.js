/**
 * MTP PLATFORM — Cotización EUR/USD vía Chainlink Price Feeds.
 *
 * Los feeds oficiales de Chainlink son consultas read-only on-chain
 * que devuelven el precio actualizado del par. Por ejemplo:
 *
 *   EUR/USD = 1.0850 → 1 EUR = 1.0850 USD (= 1.0850 USDC ≈ 1.0850 USDT)
 *
 * Direcciones oficiales de los aggregators:
 *   Ethereum mainnet: 0xb49f677943BC038e9857d61E7d053CaA2C1734C1
 *   Polygon mainnet:  0x73366Fe0AA0Ded304479862808e02506FE556a98
 *
 * BSC no tiene un feed EUR/USD directo a nivel mainnet, así que para
 * pagos en BSC usamos la cotización de Ethereum como referencia
 * (Chainlink garantiza coherencia entre cadenas).
 *
 * Cache: la cotización se cachea por 5 minutos para no spamear el RPC
 * en cada request. Chainlink actualiza el EUR/USD cada ~15 min con
 * desviación 0.15%, así que un cache de 5 min es seguro.
 *
 * Fallback: si el oracle falla (RPC caído, gas error, etc.), usamos
 * paridad 1:1 con un warning para no romper el flujo de pago.
 */

import { ethers } from 'ethers';
import 'dotenv/config';

// Feeds Chainlink EUR/USD por red. La address es el aggregator (proxy).
const EUR_USD_FEEDS = {
  1:   { address: '0xb49f677943BC038e9857d61E7d053CaA2C1734C1', name: 'Ethereum' },
  137: { address: '0x73366Fe0AA0Ded304479862808e02506FE556a98', name: 'Polygon' },
};

// Red preferida para leer el feed (la de menor gas y mayor disponibilidad).
const PREFERRED_FEED_CHAIN = Number(process.env.CHAINLINK_PREFERRED_CHAIN || 137);

// ABI mínimo del AggregatorV3Interface de Chainlink.
const AGGREGATOR_ABI = [
  'function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
  'function decimals() external view returns (uint8)',
  'function description() external view returns (string)',
];

// Cache simple en memoria. Reset al reiniciar el servidor.
const cache = {
  rate: null,               // ej. 1.0853
  decimals: 8,              // Chainlink suele usar 8
  fetchedAt: 0,             // timestamp epoch ms
  updatedAt: 0,             // timestamp del round on-chain
  source: null,             // 'chainlink' | 'fallback'
  network: null,
};

const CACHE_TTL_MS = Number(process.env.CHAINLINK_CACHE_TTL_MS || 5 * 60 * 1000); // 5 min default
const MAX_STALENESS_S = Number(process.env.CHAINLINK_MAX_STALENESS_S || 4 * 60 * 60); // 4 hs
function isFallbackDisabled() {
  return process.env.CHAINLINK_FALLBACK_DISABLED === 'true';
}

function getRpcs() {
  return {
    1:   process.env.CRYPTO_RPC_ETHEREUM || 'https://ethereum-rpc.publicnode.com',
    137: process.env.CRYPTO_RPC_POLYGON  || 'https://polygon-rpc.com',
  };
}

const providerCache = {};
function getProvider(chainId) {
  if (!providerCache[chainId]) {
    const rpc = getRpcs()[chainId];
    if (!rpc) throw new Error(`Sin RPC para chainId ${chainId}`);
    // staticNetwork evita que ethers haga polling de detección de red
    // (que reintenta en loop si el RPC falla, lo cual rompe tests y agrega ruido).
    providerCache[chainId] = new ethers.JsonRpcProvider(
      rpc,
      { chainId, name: EUR_USD_FEEDS[chainId].name },
      { staticNetwork: true, batchMaxCount: 1 },
    );
  }
  return providerCache[chainId];
}

/** Limpia el provider cache. Útil después de tests o si cambia la URL de RPC. */
export function _resetProviders() {
  for (const k in providerCache) {
    try { providerCache[k].destroy(); } catch { /* ignore */ }
    delete providerCache[k];
  }
}

/**
 * Lee el precio EUR/USD directamente del aggregator de Chainlink.
 * No usa cache.
 */
async function fetchFromChain(chainId = PREFERRED_FEED_CHAIN) {
  const feed = EUR_USD_FEEDS[chainId];
  if (!feed) throw new Error(`No hay feed EUR/USD configurado para chainId ${chainId}`);

  const provider = getProvider(chainId);
  const aggregator = new ethers.Contract(feed.address, AGGREGATOR_ABI, provider);

  // Timeout agresivo: si el RPC no responde en 3s, fallamos a fallback.
  // Sin esto, una caída del RPC podría dejar colgada la request varios minutos.
  const timeoutMs = Number(process.env.CHAINLINK_TIMEOUT_MS || 3000);
  const withTimeout = (promise) => Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error(`Chainlink RPC timeout (>${timeoutMs}ms)`)), timeoutMs)),
  ]);

  const [round, decimals] = await Promise.all([
    withTimeout(aggregator.latestRoundData()),
    withTimeout(aggregator.decimals()),
  ]);

  const answer = BigInt(round.answer);
  const updatedAt = Number(round.updatedAt);
  const ageS = Math.floor(Date.now() / 1000) - updatedAt;

  if (ageS > MAX_STALENESS_S) {
    throw new Error(`Feed Chainlink stale: última actualización hace ${ageS}s (límite ${MAX_STALENESS_S}s)`);
  }
  if (answer <= 0n) throw new Error(`Feed Chainlink devolvió valor inválido: ${answer}`);

  // Convertir a número: answer / 10^decimals
  const dec = Number(decimals);
  const rate = Number(ethers.formatUnits(answer, dec));

  return { rate, decimals: dec, updatedAt, ageS, network: feed.name };
}

/**
 * Cotización pública. Usa cache si está fresco, sino busca on-chain.
 * Si falla, devuelve paridad 1:1 con flag de fallback (salvo que esté
 * deshabilitado por CHAINLINK_FALLBACK_DISABLED=true).
 */
export async function getEurUsdRate() {
  const now = Date.now();

  if (cache.rate !== null && (now - cache.fetchedAt) < CACHE_TTL_MS) {
    return { ...cache, cached: true };
  }

  try {
    const fresh = await fetchFromChain();
    cache.rate = fresh.rate;
    cache.decimals = fresh.decimals;
    cache.updatedAt = fresh.updatedAt;
    cache.fetchedAt = now;
    cache.source = 'chainlink';
    cache.network = fresh.network;
    return { ...cache, ageS: fresh.ageS, cached: false };
  } catch (err) {
    if (isFallbackDisabled()) {
      throw new Error(`Chainlink oracle falló y CHAINLINK_FALLBACK_DISABLED=true: ${err.message}`);
    }

    console.warn(`  ⚠ Chainlink oracle falló, usando fallback 1:1 — ${err.message}`);
    cache.rate = 1.0;
    cache.decimals = 8;
    cache.updatedAt = Math.floor(now / 1000);
    cache.fetchedAt = now;
    cache.source = 'fallback';
    cache.network = 'simulated';
    return { ...cache, cached: false, error: err.message };
  }
}

/**
 * Convierte céntimos de EUR al monto equivalente en USDC/USDT, multiplicando
 * por la cotización EUR/USD actual. USDC y USDT están pegadas al dólar.
 *
 * @returns BigInt con el monto en unidades del token (con sus decimales).
 */
export async function convertEurToStable(amountCents, tokenDecimals) {
  const { rate } = await getEurUsdRate();
  const eurFloat = amountCents / 100;
  const usdFloat = eurFloat * rate;

  // Truncar a tokenDecimals para evitar errores de precisión BigInt
  // Ej: 29 EUR * 1.0853 = 31.4737 → "31.473700" con 6 decimales → 31473700n
  const fixed = usdFloat.toFixed(tokenDecimals);
  return { units: ethers.parseUnits(fixed, tokenDecimals), rate, displayUsd: fixed };
}

/**
 * Estado del oracle, para `/api/payments/health`.
 */
export async function oracleHealth() {
  try {
    const { rate, source, ageS, network, updatedAt } = await getEurUsdRate();
    return {
      configured: true,
      source,                                        // chainlink | fallback
      network,
      rate_eur_usd: rate,
      last_updated_on_chain: updatedAt ? new Date(updatedAt * 1000).toISOString() : null,
      age_seconds: ageS,
      cache_ttl_ms: CACHE_TTL_MS,
      fallback_disabled: isFallbackDisabled(),
    };
  } catch (err) {
    return {
      configured: true,
      source: 'error',
      error: err.message,
      fallback_disabled: isFallbackDisabled(),
    };
  }
}

/** Útil para los tests: reset del cache y los providers. */
export function _resetCache() {
  cache.rate = null;
  cache.fetchedAt = 0;
  cache.source = null;
  _resetProviders();
}
