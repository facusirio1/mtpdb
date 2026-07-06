import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { api } from '../../api.js';

export default function Queue() {
  const [queue, setQueue] = useState([]);
  const [active, setActive] = useState(null);
  const [result, setResult] = useState('aprobado');
  const [opinion, setOpinion] = useState('');
  const [valType, setValType] = useState('general');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  function load() { api.get('/validations/queue').then(setQueue).catch(() => {}); }
  useEffect(load, []);

  async function submitDictamen() {
    setErr(null); setLoading(true);
    try {
      await api.post('/validations', { document_id: active._id, val_type: valType, result, opinion });
      setActive(null); setOpinion(''); setResult('aprobado');
      load();
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="layout"><Sidebar />
      <div className="content">
        <div className="topbar"><div><h1>Cola de validación</h1><p className="muted">{queue.length} documentos esperando dictamen.</p></div></div>

        <div className="grid grid-2">
          <div className="card">
            <h3>Pendientes</h3>
            {queue.length === 0 ? <p className="muted mt">Sin documentos pendientes.</p> : (
              <ul style={{ listStyle: 'none', padding: 0, marginTop: 14 }}>
                {queue.map(d => (
                  <li key={d._id} style={{ padding: '12px 14px', borderRadius: 12, background: active?._id === d._id ? 'rgba(24,191,230,.10)' : 'transparent', cursor: 'pointer', marginBottom: 6 }} onClick={() => setActive(d)}>
                    <div className="row between"><strong>{d.title}</strong><span className="badge badge-info">{(d.doc_type || 'otro').toUpperCase()}</span></div>
                    <div className="dim" style={{ fontSize: '.78rem' }}>{d.user_id?.full_name} · {d.user_id?.sector || 'sin sector'}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            {!active ? (
              <p className="muted">Seleccioná un documento de la lista para emitir dictamen.</p>
            ) : (
              <div>
                <h3>{active.title}</h3>
                <p className="muted">{active.description || 'Sin descripción.'}</p>
                {err && <div className="alert alert-error mt">{err}</div>}
                <div className="field"><label>Tipo de validación</label>
                  <select value={valType} onChange={e => setValType(e.target.value)}>
                    <option value="general">General</option><option value="juridica">Jurídica</option>
                    <option value="economica">Económica</option><option value="tecnica">Técnica</option>
                    <option value="sanitaria">Sanitaria</option>
                  </select>
                </div>
                <div className="field"><label>Resultado</label>
                  <div className="row">
                    {['aprobado','observado','rechazado'].map(r => (
                      <label key={r} style={{ flex: 1, cursor: 'pointer' }}>
                        <input type="radio" name="result" value={r} checked={result === r} onChange={() => setResult(r)} style={{ marginRight: 6 }} />
                        <span className={`badge ${r === 'aprobado' ? 'badge-good' : r === 'observado' ? 'badge-warn' : 'badge-risk'}`}>{r}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="field"><label>Dictamen escrito</label>
                  <textarea value={opinion} onChange={e => setOpinion(e.target.value)} placeholder="Tu opinión profesional sobre el documento…" />
                </div>
                <button className="btn btn-primary" onClick={submitDictamen} disabled={loading}>
                  {loading ? 'Enviando…' : 'Emitir dictamen'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
