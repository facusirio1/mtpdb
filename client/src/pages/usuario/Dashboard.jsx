import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar.jsx';
import { useAuth } from '../../auth.jsx';
import { api } from '../../api.js';

export default function Dashboard() {
  const { user } = useAuth();
  const [docs, setDocs]   = useState([]);
  const [scoring, setScoring] = useState([]);

  useEffect(() => {
    api.get('/documents').then(setDocs).catch(() => {});
    api.get('/activity/my-scoring').then(setScoring).catch(() => {});
  }, []);

  const validated = docs.filter(d => d.status === 'validado').length;
  const inReview  = docs.filter(d => d.status === 'en_revision').length;

  return (
    <div className="layout">
      <Sidebar />
      <div className="content">
        <div className="topbar">
          <div>
            <h1>Hola, {user.full_name}</h1>
            <p className="muted">Centro de control de tu reputación verificable.</p>
          </div>
          <div className="topbar-user">
            <div className={`score-pill ${user.reputation >= 85 ? 'score-good' : user.reputation >= 65 ? 'score-mid' : 'score-low'}`}>
              <div className="score-num">{Math.round(user.reputation)}</div>
              <div className="score-lbl">SCORE</div>
            </div>
          </div>
        </div>

        <div className="grid grid-4 mt">
          <div className="card stat">
            <div className="stat-val">{docs.length}</div>
            <div className="stat-lbl">Documentos cargados</div>
          </div>
          <div className="card stat">
            <div className="stat-val">{validated}</div>
            <div className="stat-lbl">Validados</div>
          </div>
          <div className="card stat">
            <div className="stat-val">{inReview}</div>
            <div className="stat-lbl">En revisión</div>
          </div>
          <div className="card stat">
            <div className="stat-val">{user.membership}</div>
            <div className="stat-lbl">Membresía</div>
          </div>
        </div>

        <div className="grid grid-2 mt">
          <div className="card">
            <div className="card-head">
              <h3>Mis documentos recientes</h3>
              <Link to="/u/documents" className="btn btn-ghost btn-sm">Ver todos →</Link>
            </div>
            {docs.length === 0 ? (
              <div>
                <p className="muted">Aún no cargaste documentos.</p>
                <Link to="/u/upload" className="btn btn-primary mt">Subir primero ↑</Link>
              </div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {docs.slice(0, 5).map(d => (
                  <li key={d._id} style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                    <Link to={`/u/documents/${d._id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'inherit', textDecoration: 'none' }}>
                      <div>
                        <strong>{d.title}</strong>
                        <div className="dim" style={{ fontSize: '.78rem' }}>{(d.doc_type || 'otro').toUpperCase()}</div>
                      </div>
                      <span className={`badge ${d.status === 'validado' ? 'badge-good' : d.status === 'rechazado' ? 'badge-risk' : 'badge-warn'}`}>{d.status}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <h3>Historial de reputación</h3>
            {scoring.length === 0 ? (
              <p className="muted mt">Sin movimientos aún.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, marginTop: 12 }}>
                {scoring.slice(0, 5).map(s => (
                  <li key={s._id} style={{ padding: '8px 0', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '.88rem' }}>{s.reason}</span>
                    <strong style={{ color: s.delta > 0 ? 'var(--green-500)' : 'var(--red-500)' }}>
                      {s.delta > 0 ? '+' : ''}{s.delta}
                    </strong>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
