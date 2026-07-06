import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { api } from '../../api.js';

export default function Traceability() {
  const [log, setLog] = useState([]);
  useEffect(() => { api.get('/activity/activity').then(setLog).catch(() => {}); }, []);
  return (
    <div className="layout"><Sidebar />
      <div className="content">
        <div className="topbar"><div><h1>Trazabilidad</h1><p className="muted">{log.length} eventos registrados.</p></div></div>
        <div className="card">
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Entidad</th><th>Detalles</th><th>IP</th></tr></thead>
              <tbody>
                {log.map(e => (
                  <tr key={e._id}>
                    <td className="dim" style={{ fontSize: '.78rem' }}>{new Date(e.created_at).toLocaleString()}</td>
                    <td>{e.user_id?.full_name || <span className="dim">—</span>}</td>
                    <td><span className="badge badge-info">{e.action}</span></td>
                    <td className="dim">{e.entity || '—'}</td>
                    <td style={{ fontSize: '.85rem' }}>{e.details}</td>
                    <td className="dim" style={{ fontSize: '.75rem', fontFamily: 'ui-monospace,Menlo,monospace' }}>{e.ip_address || '—'}</td>
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
