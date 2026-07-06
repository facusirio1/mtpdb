import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { api } from '../api.js';
import { fmt } from '../lib.js';

const PLANS = {
  profesional: { amount: 2900, label: 'Profesional', desc: 'Documentos ilimitados · NFTs a 5€ c/u' },
  premium:     { amount: 7900, label: 'Premium',     desc: 'Todo Profesional + NFTs ilimitados + escribanos digitales' },
  nft:         { amount: 500,  label: 'Mintear NFT', desc: 'Un NFT en ETTIOS Blockchain (Chain ID 2237)' },
};

const NETWORKS_INFO = {
  1:    { icon: 'Ξ',  hint: 'Más segura · gas más caro' },
  137:  { icon: '◇',  hint: 'Gas barato · rápida' },
  56:   { icon: '◈',  hint: 'Económica · Binance' },
  2237: { icon: '◐',  hint: 'Native MTP · gas mínimo' },
};

export default function Checkout() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [concept, setConcept] = useState(params.get('plan') || 'profesional');
  const [method, setMethod] = useState('redsys');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [health, setHealth] = useState(null);

  // Estado del flujo cripto
  const [chainId, setChainId] = useState(137);
  const [token, setToken] = useState('usdc');
  const [quote, setQuote] = useState(null);
  const [txHash, setTxHash] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(null);

  useEffect(() => { api.get('/payments/health').then(setHealth).catch(() => {}); }, []);

  if (!user) {
    return (
      <div className="auth-wrap">
        <div className="auth-box card">
          <h2>Iniciá sesión para pagar</h2>
          <p className="muted mt">Necesitás una cuenta para procesar el pago.</p>
          <Link to="/login" className="btn btn-primary mt">Ingresar</Link>
        </div>
      </div>
    );
  }

  // Pago fiat (Redsys/Bizum)
  async function submitFiat(e) {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      const endpoint = method === 'bizum' ? '/payments/bizum/create' : '/payments/redsys/create';
      const body = method === 'bizum' ? { concept, phone } : { concept };
      const r = await api.post(endpoint, body);
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = r.form.url;
      for (const k of ['Ds_SignatureVersion', 'Ds_MerchantParameters', 'Ds_Signature']) {
        const inp = document.createElement('input');
        inp.type = 'hidden'; inp.name = k; inp.value = r.form[k];
        form.appendChild(inp);
      }
      document.body.appendChild(form);
      form.submit();
    } catch (e) { setErr(e.message); setLoading(false); }
  }

  // Cripto paso 1: cotización
  async function getCryptoQuote(e) {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      const r = await api.post('/payments/crypto/quote', { concept, chain_id: chainId, token });
      setQuote(r);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  // Cripto paso 2: confirmar con tx hash
  async function confirmCryptoPayment(e) {
    e.preventDefault();
    setErr(null); setConfirming(true);
    try {
      const r = await api.post('/payments/crypto/confirm', { order_id: quote.order_id, tx_hash: txHash });
      setConfirmed(r);
    } catch (e) { setErr(e.message); }
    finally { setConfirming(false); }
  }

  async function copyToClipboard(text) {
    try { await navigator.clipboard.writeText(text); } catch {}
  }

  const selected = PLANS[concept];
  const fiatConfigured   = health?.redsys?.configured;
  const bizumAvailable   = health?.bizum?.configured && health?.bizum?.enabled;
  const cryptoConfigured = health?.crypto?.configured;
  const availableNetworks = health?.crypto_networks || [];

  // VISTA 3 — confirmación exitosa
  if (confirmed) {
    return (
      <div className="auth-wrap">
        <div className="auth-box" style={{ maxWidth: 480, textAlign: 'center' }}>
          <div style={{ fontSize: 64, lineHeight: 1, color: 'var(--green-500)' }}>✓</div>
          <h2 style={{ fontSize: '1.8rem' }}>Pago cripto confirmado</h2>
          <p className="muted mt">{confirmed.amount} {confirmed.token} en {confirmed.network} · {confirmed.confirmations} confirmaciones.</p>
          <div className="card mt" style={{ textAlign: 'left' }}>
            <div className="dim" style={{ fontSize: '.78rem' }}>TX HASH</div>
            <code className="tx-hash">{confirmed.tx_hash}</code>
            <div className="mt"><a href={confirmed.explorer_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">Ver en explorer ↗</a></div>
          </div>
          <div className="row mt" style={{ justifyContent: 'center', gap: 10 }}>
            <Link to="/u" className="btn btn-primary">Ir al panel</Link>
          </div>
        </div>
      </div>
    );
  }

  // VISTA 2 — cotización cripto + esperar tx
  if (quote) {
    return (
      <div className="auth-wrap">
        <div className="auth-box" style={{ maxWidth: 600 }}>
          <Link to="/" className="auth-brand">
            <div className="brand-mark">M<span>T</span>P</div>
            <div><strong style={{ fontSize: '1.05rem' }}>MTP Platform</strong><br /><small style={{ color: 'var(--cyan-600)' }}>Pago cripto · paso 2 de 2</small></div>
          </Link>
          <div className="card">
            <h2>Enviá la transferencia</h2>
            <p className="muted">Desde tu wallet (MetaMask, Trust Wallet, etc.) enviá exactamente:</p>

            <div className="card mt" style={{ background: 'rgba(24,191,230,.06)', border: '1.5px solid var(--cyan-500)' }}>
              <div className="row between">
                <div>
                  <div className="dim" style={{ fontSize: '.78rem' }}>MONTO EXACTO</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900, color: 'var(--cyan-600)', letterSpacing: '-.02em' }}>
                    {quote.quote.amount_display} {quote.quote.token}
                  </div>
                  {quote.quote.exchange_rate_eur_usd && (
                    <div className="dim mt" style={{ fontSize: '.74rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {quote.quote.rate_source === 'chainlink' ? (
                        <>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green-500)', display: 'inline-block', boxShadow: '0 0 6px var(--green-500)' }}></span>
                          Cotización Chainlink: 1 EUR = {quote.quote.exchange_rate_eur_usd.toFixed(4)} {quote.quote.token}
                        </>
                      ) : (
                        <>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold-500)', display: 'inline-block' }}></span>
                          Paridad 1:1 (oracle no disponible)
                        </>
                      )}
                    </div>
                  )}
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => copyToClipboard(quote.quote.amount_display)}>Copiar monto</button>
              </div>
            </div>

            <div className="card mt">
              <div className="row between">
                <div style={{ flex: 1 }}>
                  <div className="dim" style={{ fontSize: '.78rem' }}>DIRECCIÓN DESTINO ({quote.quote.network})</div>
                  <code className="tx-hash" style={{ marginTop: 6 }}>{quote.quote.merchant_address}</code>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => copyToClipboard(quote.quote.merchant_address)}>Copiar</button>
              </div>
            </div>

            <div className="alert alert-warn mt">
              <strong>Atención:</strong> enviá desde la red <strong>{quote.quote.network}</strong> (chainId {quote.quote.chain_id}). Si enviás desde otra red, el pago no se reconocerá.
            </div>

            <ol style={{ marginTop: 16, paddingLeft: 18, color: 'var(--ink-soft)', fontSize: '.9rem', lineHeight: 1.7 }}>
              {quote.quote.instructions.map((step, i) => <li key={i}>{step}</li>)}
            </ol>

            <form onSubmit={confirmCryptoPayment} className="mt">
              <div className="field">
                <label>Hash de la transacción *</label>
                <input
                  required value={txHash} onChange={e => setTxHash(e.target.value)}
                  placeholder="0x..." style={{ fontFamily: 'ui-monospace,Menlo,monospace', fontSize: '.85rem' }}
                />
                <small className="dim">Copialo desde tu wallet o el explorer de la red.</small>
              </div>
              {err && <div className="alert alert-error">{err}</div>}
              <div className="row between">
                <button type="button" className="btn btn-ghost" onClick={() => { setQuote(null); setTxHash(''); setErr(null); }}>← Cambiar red/token</button>
                <button className="btn btn-primary" disabled={confirming || !txHash}>
                  {confirming ? 'Verificando on-chain…' : 'Confirmar pago →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // VISTA 1 — selector método + plan
  return (
    <div className="auth-wrap">
      <div className="auth-box" style={{ maxWidth: 640 }}>
        <Link to="/" className="auth-brand">
          <div className="brand-mark">M<span>T</span>P</div>
          <div><strong style={{ fontSize: '1.05rem' }}>MTP Platform</strong><br /><small style={{ color: 'var(--cyan-600)' }}>Checkout seguro</small></div>
        </Link>
        <div className="card">
          <h2>Confirmar pago</h2>
          <p className="muted">Tres formas de pagar: tarjeta, Bizum o stablecoins (USDC/USDT).</p>
          {err && <div className="alert alert-error mt">{err}</div>}

          <form onSubmit={method === 'crypto' ? getCryptoQuote : submitFiat} className="mt">
            <div className="field">
              <label>Concepto</label>
              <div className="plans">
                {Object.entries(PLANS).map(([k, p]) => (
                  <label key={k} className={`plan ${k === 'premium' ? 'is-premium' : ''}`}>
                    <input type="radio" name="concept" value={k} checked={concept === k} onChange={() => setConcept(k)} />
                    <div className="plan-inner">
                      <div className="plan-top">
                        <div className="plan-name">{p.label}</div>
                        <div className="plan-ico">{k === 'premium' ? '★' : k === 'profesional' ? '◆' : '◌'}</div>
                      </div>
                      <div className="plan-price">{fmt(p.amount)}</div>
                      <div className="dim" style={{ fontSize: '.78rem' }}>{p.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Método de pago</label>
              <div className="payment-methods" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                <label className={`pay-method ${method === 'redsys' ? 'active' : ''} ${!fiatConfigured ? 'disabled' : ''}`}>
                  <input type="radio" value="redsys" checked={method === 'redsys'} onChange={() => fiatConfigured && setMethod('redsys')} disabled={!fiatConfigured} />
                  <div>
                    <strong>💳 Tarjeta</strong>
                    <div className="dim" style={{ fontSize: '.74rem' }}>Visa · CaixaBank</div>
                  </div>
                </label>
                <label className={`pay-method ${method === 'bizum' ? 'active' : ''} ${!bizumAvailable ? 'disabled' : ''}`}>
                  <input type="radio" value="bizum" checked={method === 'bizum'} onChange={() => bizumAvailable && setMethod('bizum')} disabled={!bizumAvailable} />
                  <div>
                    <strong>📱 Bizum</strong>
                    <div className="dim" style={{ fontSize: '.74rem' }}>Teléfono + SMS</div>
                  </div>
                </label>
                <label className={`pay-method ${method === 'crypto' ? 'active' : ''} ${!cryptoConfigured ? 'disabled' : ''}`}>
                  <input type="radio" value="crypto" checked={method === 'crypto'} onChange={() => cryptoConfigured && setMethod('crypto')} disabled={!cryptoConfigured} />
                  <div>
                    <strong>◈ Cripto</strong>
                    <div className="dim" style={{ fontSize: '.74rem' }}>USDC · USDT</div>
                  </div>
                </label>
              </div>
              {!cryptoConfigured && (
                <small className="dim mt" style={{ display: 'block' }}>
                  ⚠ Pagos cripto requieren configurar <code>CRYPTO_MERCHANT_ADDRESS</code> en el .env del backend.
                </small>
              )}
            </div>

            {method === 'bizum' && (
              <div className="field">
                <label>Teléfono asociado a Bizum *</label>
                <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="+34 600 12 34 56" />
              </div>
            )}

            {method === 'crypto' && (
              <div style={{ background: 'rgba(139,92,246,.04)', border: '1px solid rgba(139,92,246,.20)', borderRadius: 14, padding: 16, marginBottom: 14 }}>
                <div className="dim" style={{ fontSize: '.74rem', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 800, color: 'var(--violet-500)', marginBottom: 10 }}>
                  PAGO EN STABLECOINS
                </div>
                <div className="field" style={{ marginBottom: 12 }}>
                  <label>Red blockchain</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 6 }}>
                    {availableNetworks.map(net => (
                      <label key={net.chainId} className={`pay-method ${chainId === net.chainId ? 'active' : ''}`} style={{ padding: '10px 12px' }}>
                        <input type="radio" value={net.chainId} checked={chainId === net.chainId} onChange={() => setChainId(net.chainId)} />
                        <div>
                          <strong style={{ fontSize: '.88rem' }}>{NETWORKS_INFO[net.chainId]?.icon} {net.name}</strong>
                          <div className="dim" style={{ fontSize: '.7rem' }}>{NETWORKS_INFO[net.chainId]?.hint}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>Stablecoin</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {['usdc', 'usdt'].map(t => (
                      <label key={t} className={`pay-method ${token === t ? 'active' : ''}`} style={{ padding: '10px 12px' }}>
                        <input type="radio" value={t} checked={token === t} onChange={() => setToken(t)} />
                        <div>
                          <strong>{t.toUpperCase()}</strong>
                          <div className="dim" style={{ fontSize: '.7rem' }}>{t === 'usdc' ? 'Circle · regulado' : 'Tether · más liquidez'}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <p className="dim mt" style={{ fontSize: '.78rem' }}>
                  Vas a recibir la dirección destino y el monto exacto. Confirmás pegando el hash de la transferencia.
                </p>
              </div>
            )}

            <div className="row between" style={{ paddingTop: 16, borderTop: '1px solid var(--line)' }}>
              <div>
                <div className="dim" style={{ fontSize: '.78rem' }}>Total a pagar</div>
                <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', letterSpacing: '-.02em' }}>{fmt(selected.amount)}</strong>
                {method === 'crypto' && <span className="dim" style={{ marginLeft: 8, fontSize: '.88rem' }}>≈ {(selected.amount/100).toFixed(2)} {token.toUpperCase()}</span>}
              </div>
              <button className="btn btn-primary" disabled={loading || (method === 'bizum' && !phone)}>
                {loading ? 'Procesando…'
                  : method === 'crypto' ? 'Obtener dirección →'
                  : method === 'bizum'  ? 'Pagar con Bizum →'
                  : 'Pagar con tarjeta →'}
              </button>
            </div>
          </form>
        </div>

        <p className="dim mt" style={{ textAlign: 'center', fontSize: '.8rem' }}>
          Al pagar aceptás los <Link to="/terms">Términos</Link> y la <Link to="/privacy">Política de Privacidad</Link>.
        </p>
      </div>
    </div>
  );
}
