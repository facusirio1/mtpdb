/**
 * GET /api/payments/health
 * Estado de la integración de pagos: Redsys, Bizum, Cripto, Oracle Chainlink.
 */
import { methodDispatch, ok } from '../_lib/helpers.js';
import { redsysHealth } from '../_lib/payments/redsys.js';
import { bizumHealth } from '../_lib/payments/bizum.js';
import { cryptoHealth } from '../_lib/payments/crypto.js';
import { oracleHealth } from '../_lib/payments/oracle.js';

const PRICES = {
  profesional: { amount: 2900, label: 'Plan Profesional (29 €/mes)' },
  premium:     { amount: 7900, label: 'Plan Premium (79 €/mes)' },
  nft:         { amount: 500,  label: 'Certificado NFT (5 €)' },
};

export default methodDispatch({
  GET: async (_req, res) => {
    return ok(res, {
      redsys: redsysHealth(),
      bizum:  bizumHealth(),
      crypto: cryptoHealth(),
      oracle: await oracleHealth(),
      prices: PRICES,
      cyberpac_compliance: {
        sha256_signing: true,
        pci_dss_passthrough: true,
        notification_url_https: (process.env.REDSYS_NOTIFICATION_URL || '').startsWith('https://'),
        redsys_test_endpoint: 'https://sis-t.redsys.es:25443/sis/realizarPago',
        redsys_prod_endpoint: 'https://sis.redsys.es/sis/realizarPago',
        support_email: 'virtualtpv@comerciaglobalpay.com',
        support_phone: '902 157 235 / 914 353 028',
      },
    });
  },
});
