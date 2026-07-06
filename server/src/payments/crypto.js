/**
 * MTP PLATFORM — Pagos en stablecoins (USDC / USDT).
 *
 * Soporta USDC y USDT en cuatro redes EVM:
 *   - Ethereum mainnet (chainId 1)
 *   - Polygon         (chainId 137)
 *   - BSC             (chainId 56)
 *   - ETTIOS          (chainId 2237)
 *
 * Flujo:
 *   1. El usuario solicita una cotización  → /api/payments/crypto/quote
 *   2. El backend devuelve la dirección destino + monto exacto en la stablecoin
 *   3. El usuario envía la transferencia desde su wallet
 *   4. El usuario pega el tx hash en el frontend → /api/payments/crypto/confirm
 *   5. El backend lee el evento Transfer(ERC-20) on-chain y valida:
 *        a) que sea hacia la dirección correcta del comercio
 *        b) que el monto coincida con el cotizado
 *        c) que sea sobre el contrato del stablecoin oficial
 *        d) que la tx esté confirmada (al menos N bloques)
 */

import { ethers } from 'ethers';
import 'dotenv/config';
import { convertEurToStable } from './oracle.js';

// Las direcciones se evalúan al llamar a las funciones (no en module load),
// así los tests pueden setear env vars antes de cada llamada.
function getStablecoins() {
  return {
    // Ethereum mainnet
    1: {
      name: 'Ethereum',
      usdc: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
      usdt: { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
    },
    // Polygon
    137: {
      name: 'Polygon',
      usdc: { address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6 },
      usdt: { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 },
    },
    // BSC
    56: {
      name: 'BSC',
      usdc: { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18 },
      usdt: { address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
    },
    // ETTIOS
    2237: {
      name: 'ETTIOS',
      usdc: { address: process.env.ETTIOS_USDC_ADDRESS || null, decimals: 6 },
      usdt: { address: process.env.ETTIOS_USDT_ADDRESS || null, decimals: 6 },
    },
  };
}

function getRpcs() {
  return {
    1:    process.env.CRYPTO_RPC_ETHEREUM || 'https://ethereum-rpc.publicnode.com',
    137:  process.env.CRYPTO_RPC_POLYGON  || 'https://polygon-rpc.com',
    56:   process.env.CRYPTO_RPC_BSC      || 'https://bsc-dataseed1.binance.org',
    2237: process.env.ETTIOS_RPC_URL      || 'https://rpc.ettiosblockchain.io',
  };
}

const MIN_CONFIRMATIONS_DEFAULT = 3;

// ABI mínimo de ERC-20 (solo lo que necesitamos para validar)
const ERC20_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

const TRANSFER_TOPIC = ethers.id('Transfer(address,address,uint256)');

// Cache de providers para no reconstruirlos en cada llamada
const providerCache = {};
function getProvider(chainId) {
  if (!providerCache[chainId]) {
    const rpc = getRpcs()[chainId];
    if (!rpc) throw new Error(`Red no soportada: chainId ${chainId}`);
    providerCache[chainId] = new ethers.JsonRpcProvider(rpc, { chainId, name: getStablecoins()[chainId].name });
  }
  return providerCache[chainId];
}

/**
 * Devuelve el estado de configuración del módulo (para /api/payments/health).
 */
export function cryptoHealth() {
  const merchant = process.env.CRYPTO_MERCHANT_ADDRESS || '';
  const minConf = Number(process.env.CRYPTO_MIN_CONFIRMATIONS || MIN_CONFIRMATIONS_DEFAULT);
  const networks = Object.entries(getStablecoins()).map(([cid, info]) => ({
    chainId: Number(cid),
    name: info.name,
    usdc_available: !!info.usdc.address,
    usdt_available: !!info.usdt.address,
  }));

  // Validación detallada
  let status, statusReason, checksumAddress = null;
  if (!merchant) {
    status = 'not_configured';
    statusReason = 'CRYPTO_MERCHANT_ADDRESS está vacía. Pegá tu dirección EVM en Render → Environment.';
  } else if (!ethers.isAddress(merchant)) {
    status = 'invalid_address';
    statusReason = `La dirección "${merchant}" no es válida. Debe ser 0x + 40 hex.`;
  } else {
    try {
      // Convertir a checksum EIP-55 (formato canónico con mayúsculas correctas)
      checksumAddress = ethers.getAddress(merchant);
      status = 'configured';
      statusReason = checksumAddress === merchant
        ? 'Dirección válida con checksum EIP-55 correcto'
        : 'Dirección válida (en lowercase — sugerido usar formato checksum EIP-55)';
    } catch (e) {
      status = 'invalid_checksum';
      statusReason = `Checksum EIP-55 inválido: ${e.message}`;
    }
  }

  return {
    configured: status === 'configured',
    status,
    status_reason: statusReason,
    merchant_address: merchant
      ? merchant.slice(0, 6) + '…' + merchant.slice(-4)
      : null,
    merchant_address_checksum: checksumAddress,
    min_confirmations: minConf,
    networks,
  };
}

/**
 * Convierte un monto en céntimos de euro a la cantidad equivalente
 * en stablecoin. Usa el oracle de Chainlink (EUR/USD) y multiplica
 * por la cotización actual. Si el oracle falla, cae a paridad 1:1
 * (a menos que CHAINLINK_FALLBACK_DISABLED=true).
 */
async function eurToStableUnits(amountCents, decimals) {
  const r = await convertEurToStable(amountCents, decimals);
  // Adjuntar el source actual (chainlink | fallback) para el frontend
  const { getEurUsdRate } = await import('./oracle.js');
  const rateInfo = await getEurUsdRate();
  return { ...r, source: rateInfo.source };
}

/**
 * Devuelve la cotización: dirección destino, monto en unidades del token, info de red.
 *
 * @param {Object} p
 * @param {number} p.amountCents — monto a cobrar en céntimos de euro
 * @param {number} p.chainId     — 1 / 137 / 56 / 2237
 * @param {string} p.token       — 'usdc' | 'usdt'
 */
export async function getCryptoQuote({ amountCents, chainId, token }) {
  const merchant = process.env.CRYPTO_MERCHANT_ADDRESS || '';
  if (!merchant) throw new Error('Cripto no configurado. Falta CRYPTO_MERCHANT_ADDRESS en el .env.');
  if (!ethers.isAddress(merchant)) throw new Error('CRYPTO_MERCHANT_ADDRESS inválida');

  const STABLECOINS = getStablecoins();
  if (!STABLECOINS[chainId]) throw new Error(`Red no soportada: ${chainId}`);

  const tokenInfo = STABLECOINS[chainId][token];
  if (!tokenInfo) throw new Error(`Token ${token} no disponible en ${STABLECOINS[chainId].name}`);
  if (!tokenInfo.address) throw new Error(`Contrato de ${token.toUpperCase()} no configurado para ${STABLECOINS[chainId].name}`);

  const { units: amountUnits, rate, displayUsd, source } = await eurToStableUnits(amountCents, tokenInfo.decimals);

  return {
    chain_id: chainId,
    network: STABLECOINS[chainId].name,
    token: token.toUpperCase(),
    token_contract: tokenInfo.address,
    decimals: tokenInfo.decimals,
    merchant_address: merchant,
    amount_cents_eur: amountCents,
    amount_units: amountUnits.toString(),
    amount_display: ethers.formatUnits(amountUnits, tokenInfo.decimals),
    exchange_rate_eur_usd: rate,
    rate_source: source,
    expires_in_minutes: 30,
    instructions: [
      `Abrí tu wallet (MetaMask, Trust Wallet, etc.).`,
      `Cambiate a la red ${STABLECOINS[chainId].name} (chainId ${chainId}).`,
      `Enviá exactamente ${ethers.formatUnits(amountUnits, tokenInfo.decimals)} ${token.toUpperCase()} a ${merchant}.`,
      `Cotización aplicada: 1 EUR = ${rate.toFixed(4)} ${token.toUpperCase()}.`,
      `Pegá el hash de la transacción para confirmar.`,
    ],
  };
}

/**
 * Verifica que una transacción en una red EVM:
 *  - existe y está confirmada
 *  - emite un evento Transfer del token correcto
 *  - el destino es nuestro merchant address
 *  - el monto coincide con el cotizado
 *
 * @returns {Object} { ok, confirmations, from, to, amount_units, ...errores }
 */
export async function verifyCryptoTransfer({ txHash, chainId, token, expectedAmountUnits }) {
  const STABLECOINS = getStablecoins();
  const merchant = process.env.CRYPTO_MERCHANT_ADDRESS || '';
  const minConf = Number(process.env.CRYPTO_MIN_CONFIRMATIONS || MIN_CONFIRMATIONS_DEFAULT);

  if (!STABLECOINS[chainId]) return { ok: false, error: `Red no soportada: ${chainId}` };
  if (!/^0x[0-9a-fA-F]{64}$/.test(txHash || '')) return { ok: false, error: 'Tx hash con formato inválido' };

  const tokenInfo = STABLECOINS[chainId][token];
  if (!tokenInfo?.address) return { ok: false, error: `Contrato ${token} no configurado` };

  const provider = getProvider(chainId);
  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) return { ok: false, error: 'Transacción no encontrada o aún sin minar' };
  if (receipt.status !== 1) return { ok: false, error: 'La transacción falló en la red (status 0)' };

  const currentBlock = await provider.getBlockNumber();
  const confirmations = currentBlock - receipt.blockNumber + 1;
  if (confirmations < minConf) {
    return { ok: false, error: `Faltan confirmaciones (${confirmations}/${minConf}). Reintentá en unos segundos.`, confirmations };
  }

  const expectedContract = tokenInfo.address.toLowerCase();
  const merchantTopic = ethers.zeroPadValue(merchant.toLowerCase(), 32);

  const transferLog = receipt.logs.find(log =>
    log.address.toLowerCase() === expectedContract &&
    log.topics[0] === TRANSFER_TOPIC &&
    log.topics[2]?.toLowerCase() === merchantTopic.toLowerCase()
  );

  if (!transferLog) {
    return { ok: false, error: `La transacción no incluye un Transfer de ${token.toUpperCase()} hacia el comercio. Verificá la red y el token.` };
  }

  const from = '0x' + transferLog.topics[1].slice(26);
  const to   = '0x' + transferLog.topics[2].slice(26);
  const amount = BigInt(transferLog.data);

  if (amount !== BigInt(expectedAmountUnits)) {
    return {
      ok: false,
      error: `Monto incorrecto. Esperado: ${ethers.formatUnits(BigInt(expectedAmountUnits), tokenInfo.decimals)}. Recibido: ${ethers.formatUnits(amount, tokenInfo.decimals)}.`,
      received_units: amount.toString(),
    };
  }

  return {
    ok: true,
    confirmations,
    from, to,
    amount_units: amount.toString(),
    amount_display: ethers.formatUnits(amount, tokenInfo.decimals),
    block_number: receipt.blockNumber,
    network: STABLECOINS[chainId].name,
    token: token.toUpperCase(),
    explorer_url: explorerTxUrl(chainId, txHash),
  };
}

function explorerTxUrl(chainId, txHash) {
  const map = {
    1:    'https://etherscan.io/tx/',
    137:  'https://polygonscan.com/tx/',
    56:   'https://bscscan.com/tx/',
    2237: 'https://scan.ettiosblockchain.io/tx/',
  };
  return (map[chainId] || '') + txHash;
}

export function supportedNetworks() {
  return Object.entries(getStablecoins()).map(([cid, info]) => ({
    chainId: Number(cid),
    name: info.name,
    tokens: ['usdc', 'usdt'].filter(t => !!info[t]?.address),
  })).filter(n => n.tokens.length > 0);
}
