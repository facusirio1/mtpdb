import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { useAuth } from '../../auth.jsx';
import { api } from '../../api.js';

export default function Reputation() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  useEffect(() => { api.get('/activity/my-scoring').then(setHistory).catch(() => {}); }, []);

  return (
    <div className="layout"><Sidebar />
      <div className="content">
        <div className="topbar"><div><h1>Mi reputación</h1><p className="muted">Score 0-100 calculado por la plataforma según validaciones e historial.</p></div></div>

        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div className="dim" style={{ textTransform: 'uppercase', letterSpacing: '.06em', fontSize: '.78rem' }}>Score actual</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '6rem', fontWeight: 900, lineHeight: 1, marginTop: 10, background: 'linear-gradient(135deg,var(--green-500),var(--cyan-500))', WebkitBackgroundClip: 'text', color: 'transparent', letterSpacing: '-.04em' }}>{Math.round(user.reputation)}</div>
          <div className="dim mt">de 100</div>
          <div className="scorebar mt" style={{ maxWidth: 400, margin: '20px auto', height: 14 }}><span style={{ width: `${user.reputation}%` }} /></div>
        </div>

        <div className="card mt">
          <h3>Historial de movimientos</h3>
          {history.length === 0 ? (
            <p className="muted mt">Sin movimientos aún. Cargá documentos y recibí dictámenes para construir tu reputación.</p>
          ) : (
            <div className="table-wrap mt">
              <table className="data">
                <thead><tr><th>Fecha</th><th>Motivo</th><th>Score previo</th><th>Δ</th><th>Score nuevo</th></tr></thead>
                <tbody>
                  {history.map(h => (
                    <tr key={h._id}>
                      <td className="dim" style={{ fontSize: '.85rem' }}>{new Date(h.created_at).toLocaleString()}</td>
                      <td>{h.reason}</td>
                      <td>{h.prev_score}</td>
                      <td><strong style={{ color: h.delta > 0 ? 'var(--green-500)' : 'var(--red-500)' }}>{h.delta > 0 ? '+' : ''}{h.delta}</strong></td>
                      <td><strong>{h.new_score}</strong></td>
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
