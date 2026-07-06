import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { shortAddr } from '../lib.js';

function QrPattern({ value, size = 140 }) {
  // QR estilizado, no es escaneable — placeholder visual
  const cells = 21;
  const cellSize = size / cells;
  const hash = value || 'mtp';
  function on(x, y) {
    const n = (hash.charCodeAt((x * cells + y) % hash.length) + x * 7 + y * 11) % 5;
    return n < 2;
  }
  function corner(cx, cy) {
    const r = [];
    for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) {
      if (i === 0 || j === 0 || i === 6 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4))
        r.push(<rect key={`c${cx}-${cy}-${i}-${j}`} x={(cx + j) * cellSize} y={(cy + i) * cellSize} width={cellSize} height={cellSize} fill="#081120" />);
    }
    return r;
  }
  const dots = [];
  for (let i = 0; i < cells; i++) for (let j = 0; j < cells; j++) {
    if ((i < 7 && j < 7) || (i < 7 && j > cells - 8) || (i > cells - 8 && j < 7)) continue;
    if (on(i, j)) dots.push(<rect key={`${i}-${j}`} x={j * cellSize} y={i * cellSize} width={cellSize} height={cellSize} fill="#081120" />);
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} shapeRendering="crispEdges">
      <rect width={size} height={size} fill="#fff" />
      {corner(0, 0)}{corner(0, cells - 7)}{corner(cells - 7, 0)}
      {dots}
    </svg>
  );
}

export default function Verify() {
  const { id } = useParams();
  const [q, setQ] = useState(id || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (id) search(id); }, [id]);

  async function search(value) {
    if (!value) return;
    setLoading(true); setResult(null);
    try {
      const r = await api.get(`/verify/${encodeURIComponent(value)}`);
      setResult(r);
    } catch (e) { setResult({ ok: false, error: e.message }); }
    finally { setLoading(false); }
  }

  function submit(e) { e.preventDefault(); search(q.trim()); }

  return (
    <div className="verify-page">
      <nav className="lp-nav">
        <Link to="/" className="lp-brand">
          <div className="brand-mark">M<span>T</span>P</div>
          <div><strong>MTP Platform</strong><small>Verificador público</small></div>
        </Link>
        <div className="row" style={{ gap: 8 }}>
          <Link to="/" className="btn btn-ghost btn-sm">Inicio</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Crear cuenta</Link>
        </div>
      </nav>

      <div className="verify-wrap">
        <div className="verify-head">
          <span className="lp-tag"><span className="lp-pulse" /> VERIFICADOR PÚBLICO MTP</span>
          <h1>Verificá un certificado on-chain.</h1>
          <p className="muted">Buscá por hash SHA-256, token ID o ID de documento. La consulta no requiere cuenta.</p>
        </div>

        <form onSubmit={submit} className="verify-form">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Pegá un hash SHA-256, token ID o doc ID…" />
          <button className="btn btn-primary" disabled={loading || !q.trim()}>{loading ? 'Buscando…' : 'Verificar'}</button>
        </form>
        <div className="dim" style={{ fontSize: '.8rem', textAlign: 'center', marginBottom: 30 }}>
          Probá con: <button className="verify-chip" onClick={() => search('3f8b9e2c47a9d18e1f8a72b6c9d4e5a8b3c1f9e2d6a4b8c7f5e3d2a1b9c8e7f6a')}>hash demo</button>
        </div>

        {result?.ok && result.found && (
          <>
            <div className="verify-banner">
              <div className="verify-icon">✓</div>
              <div>
                <strong style={{ display: 'block', fontSize: '1.1rem', color: 'var(--ink)' }}>Certificado verificado</strong>
                <span className="muted" style={{ fontSize: '.9rem' }}>
                  {result.verification_status === 'on_chain' ? 'NFT anclado en ETTIOS Blockchain.' : `Estado: ${result.verification_status}`}
                </span>
              </div>
            </div>

            <div className="verify-cert">
              <div className="verify-cert-head">
                <div>
                  <span className="badge badge-info">{(result.certificate.doc_type || 'OTRO').toUpperCase()}</span>
                  <h2>{result.certificate.title}</h2>
                  <p className="muted">{result.certificate.description}</p>
                </div>
                <div className="verify-seal">◈</div>
              </div>

              <div className="verify-cert-body">
                <dl className="verify-dl">
                  <dt>Propietario</dt>             <dd><strong>{result.owner.name}</strong> {result.owner.company_name && <span className="dim">· {result.owner.company_name}</span>}</dd>
                  <dt>Tipo de entidad</dt>         <dd>{result.owner.entity_type}</dd>
                  <dt>Sector</dt>                  <dd>{result.owner.sector || '—'}</dd>
                  <dt>KYC</dt>                     <dd><span className={`badge ${result.owner.kyc_status === 'verificado' ? 'badge-good' : 'badge-warn'}`}>{result.owner.kyc_status}</span></dd>
                  <dt>Membresía</dt>               <dd><span className={`badge mem-${result.owner.membership}`}>{result.owner.membership}</span></dd>
                  <dt>Reputación</dt>              <dd><strong style={{ color: 'var(--cyan-600)' }}>{Math.round(result.owner.reputation)}</strong>/100</dd>
                  <dt>Validaciones</dt>            <dd>{result.validations.length}</dd>
                  <dt>Hash SHA-256</dt>            <dd><code className="tx-hash" style={{ display: 'inline-block', fontSize: '.7rem' }}>{result.certificate.file_hash || '—'}</code></dd>
                </dl>
                <div className="verify-qr-wrap">
                  <div className="verify-qr">
                    <QrPattern value={result.certificate.id} />
                  </div>
                  <p className="dim mt" style={{ fontSize: '.78rem' }}>Escaneá para compartir esta verificación</p>
                </div>
              </div>

              <div className="mt">
                <h3 style={{ fontSize: '1.05rem', marginBottom: 10 }}>Score consolidado por dimensión</h3>
                <div className="grid grid-4">
                  {Object.entries(result.score_breakdown).map(([k, v]) => (
                    <div key={k} className="card" style={{ padding: 14, textAlign: 'center' }}>
                      <div className="dim" style={{ fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>{k}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 900, background: 'linear-gradient(135deg,var(--green-500),var(--cyan-500))', WebkitBackgroundClip: 'text', color: 'transparent' }}>{v}</div>
                      <div className="scorebar"><span style={{ width: `${v}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {result.nft && (
              <div className="nft-card">
                <div className="row between">
                  <div>
                    <span className="nft-pill">★ NFT EN ETTIOS</span>
                    <h3 style={{ marginTop: 10 }}>Token #{result.nft.token_id}</h3>
                    <p className="muted">Chain ID {result.nft.chain_id} · Block #{result.nft.block_number}</p>
                  </div>
                  <a href={result.nft.explorer_url} target="_blank" rel="noreferrer" className="btn btn-gold btn-sm">Ver en explorer ↗</a>
                </div>
                <div className="mt">
                  <div className="dim" style={{ fontSize: '.78rem', marginBottom: 4 }}>Transaction hash</div>
                  <code className="tx-hash">{result.nft.tx_hash}</code>
                  <div className="dim" style={{ fontSize: '.78rem', marginTop: 12, marginBottom: 4 }}>Contrato ERC-721</div>
                  <code className="tx-hash">{result.nft.contract_address}</code>
                </div>
              </div>
            )}

            <h3 style={{ marginTop: 30, marginBottom: 14 }}>Dictámenes profesionales</h3>
            {result.validations.length === 0 ? (
              <p className="muted">Aún no hay dictámenes para este certificado.</p>
            ) : (
              <div className="grid grid-2">
                {result.validations.map((v, i) => (
                  <div key={i} className="card">
                    <div className="row between">
                      <strong>{v.verifier_name}</strong>
                      <span className={`badge ${v.result === 'aprobado' ? 'badge-good' : v.result === 'observado' ? 'badge-warn' : 'badge-risk'}`}>{v.result}</span>
                    </div>
                    <p className="dim" style={{ fontSize: '.78rem', marginTop: 4 }}>{v.specialty} · score {Math.round(v.verifier_reputation || 0)}</p>
                    {v.opinion && <p className="muted mt" style={{ fontSize: '.9rem' }}>"{v.opinion}"</p>}
                    <p className="dim" style={{ fontSize: '.75rem', marginTop: 10 }}>{new Date(v.created_at).toLocaleDateString()} · {v.val_type}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {result?.ok === false && (
          <div className="alert alert-warn">
            <strong>Certificado no encontrado.</strong> {result.error || 'Revisá el identificador.'}
          </div>
        )}
      </div>
    </div>
  );
}
