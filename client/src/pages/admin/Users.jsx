import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { api } from '../../api.js';

export default function Users() {
  const [users, setUsers] = useState([]);
  function load() { api.get('/users').then(setUsers).catch(() => {}); }
  useEffect(load, []);

  async function update(id, field, value) {
    try { await api.patch(`/users/${id}/${field}`, { [field]: value }); load(); }
    catch (e) { alert(e.message); }
  }

  return (
    <div className="layout"><Sidebar />
      <div className="content">
        <div className="topbar"><div><h1>Usuarios &amp; KYC</h1><p className="muted">Gestión de roles, membresías y verificaciones.</p></div></div>
        <div className="card">
          <div className="table-wrap">
            <table className="data">
              <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>KYC</th><th>Membresía</th><th>Score</th><th>Estado</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td><strong>{u.full_name}</strong></td>
                    <td className="dim" style={{ fontSize: '.85rem' }}>{u.email}</td>
                    <td>
                      <select value={u.role} onChange={e => update(u.id, 'role', e.target.value)} style={{ padding: 4, fontSize: '.82rem' }}>
                        <option value="admin">admin</option><option value="usuario">usuario</option><option value="verificador">verificador</option>
                      </select>
                    </td>
                    <td>
                      <select value={u.kyc_status} onChange={e => update(u.id, 'kyc', e.target.value)} style={{ padding: 4, fontSize: '.82rem' }}>
                        <option value="pendiente">pendiente</option><option value="verificado">verificado</option><option value="rechazado">rechazado</option>
                      </select>
                    </td>
                    <td>
                      <select value={u.membership} onChange={e => update(u.id, 'membership', e.target.value)} style={{ padding: 4, fontSize: '.82rem' }}>
                        <option value="basica">básica</option><option value="profesional">profesional</option><option value="premium">premium</option>
                      </select>
                    </td>
                    <td><strong style={{ color: 'var(--cyan-600)' }}>{Math.round(u.reputation)}</strong></td>
                    <td>
                      <select value={u.status} onChange={e => update(u.id, 'status', e.target.value)} style={{ padding: 4, fontSize: '.82rem' }}>
                        <option value="activo">activo</option><option value="suspendido">suspendido</option>
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
