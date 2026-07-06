import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function Register() {
  const { register, roleHome } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const asVerifier = params.get('as') === 'verifier';

  const [form, setForm] = useState({
    full_name: '', email: '', password: '',
    entity_type: asVerifier ? 'profesional' : 'empresa',
    company_name: '', document_id: '',
    sector: '', specialty: '',
    wallet_address: '',
    accept_terms: false, accept_privacy: false, accept_kyc: false,
  });
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  function up(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      await register({ ...form, as_verifier: asVerifier });
      nav(roleHome());
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  const allAccepted = form.accept_terms && form.accept_privacy && form.accept_kyc;

  return (
    <div className="auth-wrap">
      <div className="auth-box" style={{ maxWidth: 540 }}>
        <Link to="/" className="auth-brand">
          <div className="brand-mark">M<span>T</span>P</div>
          <div><strong style={{ fontSize: '1.05rem' }}>MTP Platform</strong><br /><small style={{ color: 'var(--cyan-600)' }}>{asVerifier ? 'Alta de verificador' : 'Crear cuenta'}</small></div>
        </Link>
        <div className="card">
          <h2>{asVerifier ? 'Quiero ser verificador' : 'Crear cuenta'}</h2>
          <p className="muted">Completá los datos para sumarte a la red.</p>
          {err && <div className="alert alert-error mt">{err}</div>}
          <form onSubmit={submit} className="mt">
            <div className="grid grid-2" style={{ gap: 10 }}>
              <div className="field">
                <label>Nombre completo *</label>
                <input required value={form.full_name} onChange={e => up('full_name', e.target.value)} />
              </div>
              <div className="field">
                <label>Email *</label>
                <input type="email" required value={form.email} onChange={e => up('email', e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label>Contraseña * (mínimo 6 caracteres)</label>
              <input type="password" required minLength={6} value={form.password} onChange={e => up('password', e.target.value)} />
            </div>
            <div className="grid grid-2" style={{ gap: 10 }}>
              <div className="field">
                <label>Tipo de entidad</label>
                <select value={form.entity_type} onChange={e => up('entity_type', e.target.value)}>
                  <option value="profesional">Profesional independiente</option>
                  <option value="empresa">Empresa</option>
                  <option value="organizacion">Organización</option>
                  <option value="particular">Particular</option>
                </select>
              </div>
              <div className="field">
                <label>{form.entity_type === 'profesional' ? 'DNI / CUIT' : 'CIF / NIF'}</label>
                <input value={form.document_id} onChange={e => up('document_id', e.target.value)} />
              </div>
            </div>
            {form.entity_type !== 'profesional' && form.entity_type !== 'particular' && (
              <div className="field">
                <label>Razón social</label>
                <input value={form.company_name} onChange={e => up('company_name', e.target.value)} />
              </div>
            )}
            <div className="grid grid-2" style={{ gap: 10 }}>
              <div className="field">
                <label>Sector</label>
                <select value={form.sector} onChange={e => up('sector', e.target.value)}>
                  <option value="">— elegí uno —</option>
                  <option>Legal</option><option>Finanzas</option><option>Inmobiliario</option>
                  <option>Agro</option><option>Tecnología</option><option>Salud</option><option>Otro</option>
                </select>
              </div>
              {asVerifier && (
                <div className="field">
                  <label>Especialidad</label>
                  <select value={form.specialty} onChange={e => up('specialty', e.target.value)}>
                    <option value="">— elegí una —</option>
                    <option>abogado</option><option>contador</option><option>médico</option>
                    <option>ingeniero</option><option>escribano</option><option>perito</option>
                  </select>
                </div>
              )}
            </div>
            <div className="field">
              <label>Wallet EVM (opcional, para recibir NFTs)</label>
              <input value={form.wallet_address} onChange={e => up('wallet_address', e.target.value)} placeholder="0x..." style={{ fontFamily: 'ui-monospace,Menlo,monospace', fontSize: '.88rem' }} />
            </div>

            <div className="legal-consents">
              <strong>MARCO LEGAL · 3 CONSENTIMIENTOS</strong>
              <label className="lc-row">
                <input type="checkbox" checked={form.accept_terms} onChange={e => up('accept_terms', e.target.checked)} />
                <span>Acepto los <Link to="/terms" target="_blank">Términos y Condiciones</Link> de MTP Platform.</span>
              </label>
              <label className="lc-row">
                <input type="checkbox" checked={form.accept_privacy} onChange={e => up('accept_privacy', e.target.checked)} />
                <span>He leído la <Link to="/privacy" target="_blank">Política de Privacidad</Link> (RGPD · conservación 10 años AMLD5).</span>
              </label>
              <label className="lc-row">
                <input type="checkbox" checked={form.accept_kyc} onChange={e => up('accept_kyc', e.target.checked)} />
                <span>Consiento el procedimiento KYC/AML conforme a AMLD5/AMLD6 (UE) y supervisión de SEPBLAC.</span>
              </label>
            </div>

            <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading || !allAccepted}>
              {loading ? 'Creando cuenta…' : 'Crear cuenta'}
            </button>
          </form>
          <p className="dim mt" style={{ textAlign: 'center', fontSize: '.85rem' }}>
            ¿Ya tenés cuenta? <Link to="/login">Ingresar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
