import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { api } from '../../api.js';

export default function History() {
  const [history, setHistory] = useState([]);
  useEffect(() => { api.get('/validations/mine').then(setHistory).catch(() => {}); }, []);

  return (
    <div className="layout"><Sidebar />
      <div className="content">
        <div className="topbar"><div><h1>Mis dictámenes</h1><p className="muted">{history.length} dictámenes emitidos.</p></div></div>
        <div className="card">
          {history.length === 0 ? <p className="muted">Aún no emitiste dictámenes.</p> : (
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Fecha</th><th>Documento</th><th>Tipo</th><th>Resultado</th><th>Impacto</th></tr></thead>
                <tbody>
                  {history.map(v => (
                    <tr key={v._id}>
                      <td className="dim" style={{ fontSize: '.85rem' }}>{new Date(v.created_at).toLocaleDateString()}</td>
                      <td><strong>{v.document_id?.title || '—'}</strong></td>
                      <td>{v.val_type}</td>
                      <td><span className={`badge ${v.result === 'aprobado' ? 'badge-good' : v.result === 'observado' ? 'badge-warn' : 'badge-risk'}`}>{v.result}</span></td>
                      <td><strong style={{ color: v.score_impact > 0 ? 'var(--green-500)' : 'var(--red-500)' }}>{v.score_impact > 0 ? '+' : ''}{v.score_impact}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
