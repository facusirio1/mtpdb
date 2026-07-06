import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar.jsx';
import { useAuth } from '../../auth.jsx';
import { api } from '../../api.js';

export default function Dashboard() {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api.get('/validations/queue').then(setQueue).catch(() => {});
    api.get('/validations/mine').then(setHistory).catch(() => {});
  }, []);

  return (
    <div className="layout"><Sidebar />
      <div className="content">
        <div className="topbar">
          <div><h1>Hola, {user.full_name}</h1><p className="muted">{user.specialty || 'Verificador'} · sector {user.sector || '—'}</p></div>
          <div className={`score-pill ${user.reputation >= 85 ? 'score-good' : 'score-mid'}`}>
            <div className="score-num">{Math.round(user.reputation)}</div><div className="score-lbl">MI SCORE</div>
          </div>
        </div>

        <div className="grid grid-3 mt">
          <div className="card stat"><div className="stat-val">{queue.length}</div><div className="stat-lbl">En mi cola</div></div>
          <div className="card stat"><div className="stat-val">{history.length}</div><div className="stat-lbl">Dictámenes totales</div></div>
          <div className="card stat"><div className="stat-val">{history.filter(v => v.result === 'aprobado').length}</div><div className="stat-lbl">Aprobados</div></div>
        </div>

        <div className="card mt">
          <div className="card-head"><h3>Próximos en cola</h3><Link to="/verificador/queue" className="btn btn-ghost btn-sm">Ver todos →</Link></div>
          {queue.length === 0 ? <p className="muted">No tenés documentos asignados.</p> : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {queue.slice(0, 5).map(d => (
                <li key={d._id} style={{ padding: '12px 0', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between' }}>
                  <div><strong>{d.title}</strong><div className="dim" style={{ fontSize: '.78rem' }}>{d.user_id?.full_name} · {(d.doc_type || 'otro').toUpperCase()}</div></div>
                  <span className="badge badge-warn">{d.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
