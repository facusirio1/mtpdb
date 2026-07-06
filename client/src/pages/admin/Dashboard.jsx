import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { api } from '../../api.js';

export default function Dashboard() {
  const [stats, setStats] = useState({});
  useEffect(() => { api.get('/users/stats/overview').then(setStats).catch(() => {}); }, []);
  return (
    <div className="layout"><Sidebar />
      <div className="content">
        <div className="topbar"><div><h1>Centro de control</h1><p className="muted">Estadísticas globales del sistema MTP.</p></div></div>
        <div className="grid grid-3">
          <div className="card stat"><div className="stat-val">{stats.usersTotal || 0}</div><div className="stat-lbl">Usuarios totales</div></div>
          <div className="card stat"><div className="stat-val">{stats.verifsTotal || 0}</div><div className="stat-lbl">Verificadores</div></div>
          <div className="card stat"><div className="stat-val">{stats.docsTotal || 0}</div><div className="stat-lbl">Documentos</div></div>
          <div className="card stat"><div className="stat-val">{stats.docsValidated || 0}</div><div className="stat-lbl">Validados</div></div>
          <div className="card stat"><div className="stat-val">{stats.validationsTotal || 0}</div><div className="stat-lbl">Dictámenes</div></div>
          <div className="card stat"><div className="stat-val">{stats.nftsTotal || 0}</div><div className="stat-lbl">NFTs en ETTIOS</div></div>
        </div>
      </div>
    </div>
  );
}
