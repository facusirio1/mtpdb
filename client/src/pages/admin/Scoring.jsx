import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { api } from '../../api.js';

export default function Scoring() {
  const [ranking, setRanking] = useState([]);
  const [recent, setRecent] = useState([]);
  useEffect(() => {
    api.get('/users/scoring/ranking').then(setRanking).catch(() => {});
    api.get('/users/scoring/recent').then(setRecent).catch(() => {});
  }, []);
  return (
    <div className="layout"><Sidebar />
      <div className="content">
        <div className="topbar"><div><h1>Motor de scoring</h1><p className="muted">Ranking y movimientos recientes.</p></div></div>
        <div className="grid grid-2">
          <div className="card">
            <h3>Top 20 por reputación</h3>
            <div className="table-wrap mt">
              <table className="data">
                <thead><tr><th>#</th><th>Nombre</th><th>Rol</th><th>Score</th></tr></thead>
                <tbody>
                  {ranking.map((u, i) => (
                    <tr key={u.id}><td>{i + 1}</td><td><strong>{u.full_name}</strong></td><td className="dim">{u.role}</td>
                      <td><strong style={{ color: 'var(--cyan-600)', fontSize: '1.05rem' }}>{Math.round(u.reputation)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card">
            <h3>Movimientos recientes</h3>
            <ul style={{ listStyle: 'none', padding: 0, marginTop: 12 }}>
              {recent.map(h => (
                <li key={h._id} style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                  <div className="row between">
                    <strong style={{ fontSize: '.92rem' }}>{h.user_id?.full_name}</strong>
                    <strong style={{ color: h.delta > 0 ? 'var(--green-500)' : 'var(--red-500)' }}>{h.delta > 0 ? '+' : ''}{h.delta}</strong>
                  </div>
                  <div className="dim" style={{ fontSize: '.78rem' }}>{h.reason}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
