import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function Login() {
  const { login, roleHome } = useAuth();
  const nav = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr]           = useState(null);
  const [loading, setLoading]   = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      await login(email, password);
      nav(roleHome());
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-box">
        <Link to="/" className="auth-brand">
          <div className="brand-mark">M<span>T</span>P</div>
          <div><strong style={{ fontSize: '1.05rem' }}>MTP Platform</strong><br /><small style={{ color: 'var(--cyan-600)' }}>Economía Verificable</small></div>
        </Link>
        <div className="card">
          <h2>Iniciá sesión</h2>
          <p className="muted">Acceso para usuarios, verificadores y administradores.</p>
          {err && <div className="alert alert-error mt">{err}</div>}
          <form onSubmit={submit} className="mt">
            <div className="field">
              <label>Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="vos@mtp.test" />
            </div>
            <div className="field">
              <label>Contraseña</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>
          <p className="dim mt" style={{ textAlign: 'center', fontSize: '.85rem' }}>
            ¿No tenés cuenta? <Link to="/register">Crear cuenta</Link>
          </p>
        </div>
        <details style={{ marginTop: 18 }}>
          <summary className="dim" style={{ cursor: 'pointer', fontSize: '.85rem', textAlign: 'center' }}>Cuentas demo</summary>
          <div className="card mt" style={{ fontSize: '.82rem' }}>
            <p className="muted">Password de todas: <code style={{ color: 'var(--cyan-600)' }}>mtp1234</code></p>
            <ul style={{ paddingLeft: 18, marginTop: 8, color: 'var(--ink-soft)' }}>
              <li>admin@mtp.test — admin</li>
              <li>empresa@mtp.test — usuario profesional</li>
              <li>abogada@mtp.test — verificador premium</li>
              <li>contador@mtp.test — verificador profesional</li>
              <li>usuario@mtp.test — usuario básico</li>
            </ul>
          </div>
        </details>
      </div>
    </div>
  );
}
