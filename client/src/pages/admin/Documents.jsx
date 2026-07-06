import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { api } from '../../api.js';

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [users, setUsers] = useState([]);

  function load() { api.get('/documents').then(setDocs).catch(() => {}); }
  useEffect(() => { load(); api.get('/users').then(rs => setUsers(rs.filter(u => u.role === 'verificador'))).catch(() => {}); }, []);

  async function assign(docId, verifierId) {
    if (!verifierId) return;
    try { await api.patch(`/documents/${docId}/assign`, { verifier_id: verifierId }); load(); }
    catch (e) { alert(e.message); }
  }

  return (
    <div className="layout"><Sidebar />
      <div className="content">
        <div className="topbar"><div><h1>Documentos</h1><p className="muted">Asignación de verificadores a documentos cargados.</p></div></div>
        <div className="card">
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Título</th><th>Propietario</th><th>Tipo</th><th>Estado</th><th>Verificador</th><th>Asignar</th></tr></thead>
              <tbody>
                {docs.map(d => (
                  <tr key={d._id}>
                    <td><strong>{d.title}</strong></td>
                    <td>{d.user_id?.full_name}</td>
                    <td><span className="badge badge-info">{(d.doc_type || 'otro').toUpperCase()}</span></td>
                    <td><span className={`badge ${d.status === 'validado' ? 'badge-good' : d.status === 'rechazado' ? 'badge-risk' : 'badge-warn'}`}>{d.status}</span></td>
                    <td>{d.assigned_to?.full_name || <span className="dim">— sin asignar —</span>}</td>
                    <td>
                      <select onChange={e => assign(d._id, e.target.value)} defaultValue="" style={{ padding: 4, fontSize: '.82rem' }}>
                        <option value="" disabled>— elegir —</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
