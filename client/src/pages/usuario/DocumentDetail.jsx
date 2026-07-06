import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar.jsx';
import { useAuth } from '../../auth.jsx';
import { api } from '../../api.js';
import { shortAddr } from '../../lib.js';

export default function DocumentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [doc, setDoc] = useState(null);
  const [minting, setMinting] = useState(false);
  const [err, setErr] = useState(null);

  function load() { api.get(`/documents/${id}`).then(setDoc).catch(e => setErr(e.message)); }
  useEffect(load, [id]);

  async function mintNft() {
    setErr(null); setMinting(true);
    try { await api.post(`/nft/mint/${id}`); load(); }
    catch (e) { setErr(e.message); }
    finally { setMinting(false); }
  }

  if (!doc) return (
    <div className="layout"><Sidebar />
      <div className="content"><p className="muted">{err || 'Cargando…'}</p></div>
    </div>
  );

  const isOwner = String(doc.user_id?._id) === user.id;

  return (
    <div className="layout"><Sidebar />
      <div className="content">
        <div className="topbar">
          <div>
            <Link to="/u/documents" className="dim" style={{ fontSize: '.85rem' }}>← Volver a mis documentos</Link>
            <h1 style={{ marginTop: 4 }}>{doc.title}</h1>
            <div className="row mt">
              <span className="badge badge-info">{(doc.doc_type || 'otro').toUpperCase()}</span>
              <span className={`badge ${doc.status === 'validado' ? 'badge-good' : doc.status === 'rechazado' ? 'badge-risk' : 'badge-warn'}`}>{doc.status}</span>
              <span className={`badge ${doc.ai_risk === 'bajo' ? 'badge-good' : doc.ai_risk === 'medio' ? 'badge-warn' : 'badge-risk'}`}>IA: {doc.ai_risk}</span>
            </div>
          </div>
        </div>

        {err && <div className="alert alert-error">{err}</div>}

        {doc.nft ? (
          <div className="nft-card">
            <div className="row between">
              <div>
                <span className="nft-pill">★ NFT EN ETTIOS</span>
                <h3 style={{ marginTop: 10 }}>Token #{doc.nft.token_id}</h3>
                <p className="muted">Chain {doc.nft.chain_id} · Block #{doc.nft.block_number}</p>
              </div>
              <Link to={`/verify/${doc.nft.token_id}`} className="btn btn-gold btn-sm">Ver verificador público →</Link>
            </div>
            <div className="mt">
              <div className="dim" style={{ fontSize: '.78rem', marginBottom: 4 }}>TX Hash</div>
              <code className="tx-hash">{doc.nft.tx_hash}</code>
            </div>
          </div>
        ) : doc.status === 'validado' && isOwner ? (
          <div className="alert alert-info">
            <strong>El documento está validado.</strong> Podés mintear el NFT certificado en ETTIOS Blockchain.
            <div className="mt"><button className="btn btn-gold" onClick={mintNft} disabled={minting}>{minting ? 'Minteando…' : '★ Mintear NFT (5 €)'}</button></div>
          </div>
        ) : null}

        <div className="grid grid-2 mt">
          <div className="card">
            <h3>Información del documento</h3>
            <dl className="verify-dl mt">
              <dt>Descripción</dt><dd>{doc.description || '—'}</dd>
              <dt>Propietario</dt><dd>{doc.user_id?.full_name} {doc.user_id?.company_name && <span className="dim">· {doc.user_id.company_name}</span>}</dd>
              <dt>Wallet</dt><dd>{doc.user_id?.wallet_address ? <code className="tx-hash" style={{ display: 'inline-block', fontSize: '.7rem' }}>{shortAddr(doc.user_id.wallet_address)}</code> : '—'}</dd>
              <dt>Verificador</dt><dd>{doc.assigned_to?.full_name || '— sin asignar —'}</dd>
              <dt>Hash SHA-256</dt><dd><code className="tx-hash" style={{ display: 'inline-block', fontSize: '.7rem' }}>{doc.file_hash || '—'}</code></dd>
              <dt>Tamaño</dt><dd>{(doc.file_size / 1024).toFixed(1)} KB</dd>
              <dt>Cargado</dt><dd>{new Date(doc.created_at).toLocaleString()}</dd>
            </dl>
          </div>
          <div className="card">
            <h3>Análisis IA</h3>
            <p className="muted mt">{doc.ai_summary}</p>
            <div className="mt">
              <strong style={{ fontSize: '.85rem' }}>Nivel de riesgo: </strong>
              <span className={`badge ${doc.ai_risk === 'bajo' ? 'badge-good' : doc.ai_risk === 'medio' ? 'badge-warn' : 'badge-risk'}`}>{doc.ai_risk}</span>
            </div>
          </div>
        </div>

        <div className="card mt">
          <h3>Dictámenes profesionales ({doc.validations?.length || 0})</h3>
          {doc.validations?.length === 0 ? (
            <p className="muted mt">Sin dictámenes todavía. Esperando asignación de verificador.</p>
          ) : (
            <div className="mt">
              {doc.validations.map(v => (
                <div key={v._id} style={{ padding: '14px 0', borderBottom: '1px solid var(--line)' }}>
                  <div className="row between">
                    <strong>{v.verifier_id?.full_name}</strong>
                    <span className={`badge ${v.result === 'aprobado' ? 'badge-good' : v.result === 'observado' ? 'badge-warn' : 'badge-risk'}`}>{v.result}</span>
                  </div>
                  <p className="dim" style={{ fontSize: '.78rem' }}>{v.verifier_id?.specialty} · {v.val_type}</p>
                  {v.opinion && <p className="muted mt">"{v.opinion}"</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
