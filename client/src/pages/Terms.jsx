import { Link } from 'react-router-dom';

const ARTICLES = [
  ['1. Objeto', 'Estas condiciones regulan el uso de la plataforma MTP, operada por Aston Mining S.L.'],
  ['2. Definiciones', 'Usuario, Verificador, Documento, Validación, NFT MTP, Certificación, Reputación.'],
  ['3. Identificación KYC/AML', 'Conforme a las Directivas europeas AMLD5 (2015/849) y AMLD6 (2018/1673) sobre prevención de blanqueo de capitales, y bajo supervisión de SEPBLAC en España, todo usuario debe acreditar identidad.'],
  ['4. Membresías y pagos', 'Básica gratuita · Profesional 29€/mes · Premium 79€/mes. Cobros mediante Redsys/Bizum (PSD2) y stablecoins (MiCA).'],
  ['5. Verificadores', 'Profesionales con título habilitante. Pueden ser auditados y suspendidos por dictámenes erróneos.'],
  ['6. Blockchain ETTIOS', 'Los certificados se emiten como NFTs ERC-721 en ETTIOS (Chain ID 2237). Utility tokens no considerados instrumentos financieros bajo MiCA (Reglamento UE 2023/1114).'],
  ['7. Reputación (scoring)', 'Algoritmo 0-100 basado en KYC, validaciones y antigüedad. Aprobado: +8 · Observado: −3 · Rechazado: −10.'],
  ['8. Confidencialidad', 'MTP preserva el secreto profesional. Solo accederán al documento el propietario, el verificador asignado y el administrador.'],
  ['9. Propiedad intelectual', 'El usuario mantiene la titularidad de sus documentos. Otorga a MTP licencia para procesarlos.'],
  ['10. Responsabilidad de los verificadores', 'Los dictámenes son opiniones profesionales y comprometen al verificador conforme a su matrícula.'],
  ['11. Modificaciones', 'MTP puede actualizar estos términos con notificación a usuarios. La aceptación de la nueva versión es necesaria.'],
  ['12. Datos personales', 'El tratamiento se rige por la Política de Privacidad. Cumplimiento con RGPD (Reglamento UE 2016/679) y LOPDGDD (LO 3/2018).'],
  ['13. Ley aplicable y jurisdicción', 'Derecho español y de la Unión Europea. Tribunales de Madrid, sin perjuicio del fuero del consumidor conforme al Reglamento Bruselas I bis.'],
  ['14. Contacto', 'Aston Mining S.L. — contacto@mtp.platform — Madrid, España.'],
];

export default function Terms() {
  return (
    <div style={{ minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <Link to="/" className="lp-brand" style={{ marginBottom: 30 }}>
          <div className="brand-mark">M<span>T</span>P</div>
          <div><strong>MTP Platform</strong></div>
        </Link>
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 30 }}>
          <aside style={{ position: 'sticky', top: 20, alignSelf: 'start' }}>
            <div className="card" style={{ padding: 18 }}>
              <strong style={{ color: 'var(--cyan-600)', fontSize: '.78rem', letterSpacing: '.06em', textTransform: 'uppercase' }}>Índice</strong>
              <ul style={{ listStyle: 'none', padding: 0, marginTop: 12, fontSize: '.86rem', color: 'var(--ink-soft)', lineHeight: 2 }}>
                {ARTICLES.map(([title], i) => (
                  <li key={i}><a href={`#a${i}`}>{title}</a></li>
                ))}
              </ul>
            </div>
          </aside>
          <main>
            <h1 style={{ fontSize: '2.5rem', marginBottom: 10 }}>Términos y Condiciones</h1>
            <p className="muted">Versión 2026.05 · Aston Mining S.L.</p>
            <div className="card mt">
              {ARTICLES.map(([title, body], i) => (
                <div key={i} id={`a${i}`} style={{ marginBottom: 22, paddingBottom: 18, borderBottom: '1px solid var(--line)' }}>
                  <h3 style={{ color: 'var(--cyan-600)', fontSize: '1rem', marginBottom: 8 }}>{title}</h3>
                  <p className="muted">{body}</p>
                </div>
              ))}
              <p className="dim" style={{ textAlign: 'center', fontSize: '.82rem' }}>Última actualización: mayo 2026</p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
