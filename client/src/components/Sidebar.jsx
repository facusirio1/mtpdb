import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { ROLES } from '../lib.js';

const NAV_BY_ROLE = {
  usuario: [
    { to: '/u',            label: 'Panel general', icon: '◉' },
    { to: '/u/documents',  label: 'Mis documentos', icon: '◫' },
    { to: '/u/upload',     label: 'Subir nuevo',    icon: '↑' },
    { to: '/u/reputation', label: 'Reputación',     icon: '◆' },
    { to: '/u/kyc',        label: 'KYC / Identidad',icon: '◊' },
  ],
  verificador: [
    { to: '/verificador',         label: 'Panel general', icon: '◉' },
    { to: '/verificador/queue',   label: 'Cola de validación', icon: '◧' },
    { to: '/verificador/history', label: 'Mis dictámenes', icon: '◐' },
  ],
  admin: [
    { to: '/admin',              label: 'Panel general',  icon: '◉' },
    { to: '/admin/users',        label: 'Usuarios & KYC', icon: '◍' },
    { to: '/admin/documents',    label: 'Documentos',     icon: '◫' },
    { to: '/admin/scoring',      label: 'Motor scoring',  icon: '◆' },
    { to: '/admin/traceability', label: 'Trazabilidad',   icon: '⇆' },
    { to: '/admin/nfts',         label: 'NFTs en ETTIOS', icon: '◇' },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  if (!user) return null;
  const items = NAV_BY_ROLE[user.role] || [];

  return (
    <aside className="sidebar">
      <Link to="/" className="brand">
        <div className="brand-mark">M<span>T</span>P</div>
        <div><strong>MTP Platform</strong><small>{ROLES[user.role]?.label || user.role}</small></div>
      </Link>
      <nav className="nav">
        {items.map(it => (
          <Link key={it.to} to={it.to} className={pathname === it.to ? 'active' : ''}>
            <span>{it.icon}</span> {it.label}
          </Link>
        ))}
      </nav>
      <div className="sidebar-foot">
        <span className="role-tag">{user.role}</span>
        <div className="row">
          <div className="avatar">{(user.full_name || '?').slice(0, 2).toUpperCase()}</div>
          <div className="who">
            <strong>{user.full_name}</strong>
            <span>{user.email}</span>
          </div>
        </div>
        <button className="logout" onClick={logout}>Cerrar sesión</button>
      </div>
    </aside>
  );
}
