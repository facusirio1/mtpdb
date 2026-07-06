import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar.jsx';
import { api } from '../../api.js';

export default function Documents() {
  const [docs, setDocs] = useState([]);
  useEffect(() => { api.get('/documents').then(setDocs).catch(() => {}); }, []);

  return (
    <div className="layout">
      <Sidebar />
      <div className="content">
        <div className="topbar">
          <div><h1>Mis documentos</h1><p className="muted">Todos los documentos que cargaste a la plataforma.</p></div>
          <Link to="/u/upload" className="btn btn-primary">+ Subir nuevo</Link>
        </div>
        <div className="card">
          {docs.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <p className="muted">No hay documentos todavía.</p>
              <Link to="/u/upload" className="btn btn-primary mt">Subir primero ↑</Link>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Título</th><th>Tipo</th><th>Estado</th><th>IA Risk</th><th>Subido</th><th></th></tr></thead>
                <tbody>
                  {docs.map(d => (
                    <tr key={d._id}>
                      <td><strong>{d.title}</strong></td>
                      <td><span className="badge badge-info">{(d.doc_type || 'otro').toUpperCase()}</span></td>
                      <td><span className={`badge ${d.status === 'validado' ? 'badge-good' : d.status === 'rechazado' ? 'badge-risk' : 'badge-warn'}`}>{d.status}</span></td>
                      <td><span className={`badge ${d.ai_risk === 'bajo' ? 'badge-good' : d.ai_risk === 'medio' ? 'badge-warn' : 'badge-risk'}`}>{d.ai_risk}</span></td>
                      <td className="dim" style={{ fontSize: '.85rem' }}>{new Date(d.created_at).toLocaleDateString()}</td>
                      <td><Link to={`/u/documents/${d._id}`} className="btn btn-ghost btn-sm">Ver →</Link></td>
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
