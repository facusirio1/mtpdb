import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { useAuth } from '../../auth.jsx';
import { api } from '../../api.js';

const STEPS = [
  ['Datos personales', 'Información básica de identidad'],
  ['Documento',         'Tipo y número'],
  ['Wallet (opcional)', 'Para recibir NFTs en ETTIOS'],
  ['Revisión',          'Confirmación final'],
];

export default function KYC() {
  const { user, setUser } = useAuth();
  const [step, setStep] = useState(0);
  const [kyc, setKyc] = useState(null);
  const [country, setCountry]     = useState('España');
  const [docType, setDocType]     = useState('DNI');
  const [docNumber, setDocNumber] = useState('');
  const [wallet, setWallet]       = useState('');
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(false);

  useEffect(() => { api.get('/kyc/me').then(setKyc).catch(() => {}); }, []);

  async function submit() {
    setErr(null);
    try {
      const r = await api.post('/kyc', { country, doc_type: docType, doc_number: docNumber, wallet_address: wallet || null });
      setDone(true);
      const me = await api.get('/auth/me');
      setUser(me.user);
      const updated = await api.get('/kyc/me');
      setKyc(updated);
    } catch (e) { setErr(e.message); }
  }

  if (kyc?.kyc_status === 'verificado') {
    return (
      <div className="layout"><Sidebar />
        <div className="content">
          <div className="topbar"><div><h1>Verificación KYC</h1><p className="muted">Tu identidad ya fue verificada.</p></div></div>
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 64, color: 'var(--green-500)' }}>✓</div>
            <h2>KYC verificado</h2>
            <p className="muted mt">{kyc.kyc_country} · {kyc.kyc_doc_type} · ref {kyc.kyc_reference}</p>
            <p className="dim mt">Completado el {new Date(kyc.kyc_completed_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="layout"><Sidebar />
      <div className="content">
        <div className="topbar"><div><h1>Verificación KYC</h1><p className="muted">Conforme a las Directivas AMLD5/AMLD6 (UE) y al RGPD. Conservamos los datos 10 años (art. 40 AMLD5).</p></div></div>

        {err && <div className="alert alert-error">{err}</div>}
        {done && <div className="alert alert-success">Solicitud enviada. Un admin revisará tus datos en breve.</div>}

        <div className="grid grid-2">
          <div className="kyc-steps">
            {STEPS.map(([t, d], i) => (
              <div key={i} className={`kyc-step ${i < step ? 'kyc-done' : ''} ${i === step ? 'kyc-active' : ''}`}>
                <div className="kyc-step-num">{i < step ? '✓' : i + 1}</div>
                <div><strong>{t}</strong><div className="dim" style={{ fontSize: '.8rem' }}>{d}</div></div>
              </div>
            ))}
          </div>

          <div className="card">
            {step === 0 && (
              <div>
                <h3>Datos personales</h3>
                <p className="muted">Verificá que tu información es correcta.</p>
                <dl className="verify-dl mt">
                  <dt>Nombre</dt><dd>{user.full_name}</dd>
                  <dt>Email</dt><dd>{user.email}</dd>
                  <dt>Tipo</dt><dd>{user.entity_type}</dd>
                </dl>
                <button className="btn btn-primary mt" onClick={() => setStep(1)}>Continuar →</button>
              </div>
            )}
            {step === 1 && (
              <div>
                <h3>Documento de identidad</h3>
                <div className="field"><label>País</label>
                  <select value={country} onChange={e => setCountry(e.target.value)}>
                    {['España','Argentina','Paraguay','México','Chile','Uruguay','Colombia','Otro'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="field"><label>Tipo</label>
                  <select value={docType} onChange={e => setDocType(e.target.value)}>
                    {['DNI','Pasaporte','CI','RUC','NIF','CUIT','CURP','Otro'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="field"><label>Número</label>
                  <input required value={docNumber} onChange={e => setDocNumber(e.target.value)} />
                </div>
                <div className="row">
                  <button className="btn btn-ghost" onClick={() => setStep(0)}>← Atrás</button>
                  <button className="btn btn-primary" disabled={!docNumber} onClick={() => setStep(2)}>Continuar →</button>
                </div>
              </div>
            )}
            {step === 2 && (
              <div>
                <h3>Wallet EVM (opcional)</h3>
                <p className="muted">Necesaria solo si querés recibir NFTs en ETTIOS Blockchain.</p>
                <div className="field"><label>Dirección 0x…</label>
                  <input value={wallet} onChange={e => setWallet(e.target.value)} placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1" style={{ fontFamily: 'ui-monospace,Menlo,monospace' }} />
                </div>
                <div className="row">
                  <button className="btn btn-ghost" onClick={() => setStep(1)}>← Atrás</button>
                  <button className="btn btn-primary" onClick={() => setStep(3)}>Continuar →</button>
                </div>
              </div>
            )}
            {step === 3 && (
              <div>
                <h3>Revisión</h3>
                <dl className="verify-dl">
                  <dt>País</dt><dd>{country}</dd>
                  <dt>Tipo</dt><dd>{docType}</dd>
                  <dt>Número</dt><dd>{docNumber}</dd>
                  <dt>Wallet</dt><dd>{wallet || <span className="dim">(no proporcionada)</span>}</dd>
                </dl>
                <div className="row mt">
                  <button className="btn btn-ghost" onClick={() => setStep(2)}>← Atrás</button>
                  <button className="btn btn-primary" onClick={submit}>Enviar para verificación →</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
