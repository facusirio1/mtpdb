import { Link } from 'react-router-dom';

const SECTIONS = [
  ['1. Responsable del tratamiento', 'Aston Mining S.L., con domicilio en Madrid, España. Delegado de Protección de Datos: dpo@mtp.platform.'],
  ['2. Datos que recopilamos', 'Identificación KYC, datos de contacto, documentos cargados, metadatos de uso, IPs y user-agents.'],
  ['3. Finalidad y base jurídica', 'Cumplimiento KYC/AML (obligación legal, art. 6.1.c RGPD), gestión de la plataforma (ejecución del contrato, art. 6.1.b RGPD), emisión de certificaciones, comunicación.'],
  ['4. Conservación (AMLD5)', '10 años desde el último contacto con el cliente, conforme al art. 40 de la Directiva UE 2015/849 y su transposición en la Ley 10/2010 española de prevención del blanqueo de capitales.'],
  ['5. Compartición de datos', 'Solo con verificadores asignados, autoridades competentes (SEPBLAC, AEPD, juzgados) y encargados del tratamiento estrictamente necesarios con contrato art. 28 RGPD.'],
  ['6. Cookies', 'Solo cookies técnicas estrictamente necesarias. Sin tracking publicitario. Conforme a la Directiva ePrivacy y la LSSI-CE española.'],
  ['7. Derechos del usuario', 'Acceso, rectificación, supresión, oposición, limitación, portabilidad y no ser objeto de decisiones automatizadas (arts. 15-22 RGPD). Ejercer en contacto@mtp.platform o dpo@mtp.platform.'],
  ['8. Seguridad', 'Cifrado en reposo (AES-256) y en tránsito (TLS 1.3). Backups encriptados. Hash SHA-256 de cada documento. Medidas técnicas y organizativas conforme art. 32 RGPD.'],
  ['9. Blockchain', 'Los hashes SHA-256 de los documentos se anclan en ETTIOS Blockchain. La información on-chain es pública y permanente. Utility tokens no considerados criptoactivos financieros bajo MiCA (Reglamento UE 2023/1114).'],
  ['10. Transferencias internacionales', 'Servidores dentro del Espacio Económico Europeo. Cualquier transferencia fuera del EEE se realiza mediante Cláusulas Contractuales Tipo aprobadas por la Comisión Europea.'],
  ['11. Autoridades de control', 'Agencia Española de Protección de Datos (AEPD, www.aepd.es) para protección de datos. SEPBLAC (www.sepblac.es) para prevención de blanqueo de capitales. Comité Europeo de Protección de Datos (EDPB) para coordinación UE.'],
];

export default function Privacy() {
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
              <strong style={{ color: 'var(--cyan-600)', fontSize: '.78rem', letterSpacing: '.06em', textTransform: 'uppercase' }}>Secciones</strong>
              <ul style={{ listStyle: 'none', padding: 0, marginTop: 12, fontSize: '.86rem', color: 'var(--ink-soft)', lineHeight: 2 }}>
                {SECTIONS.map(([title], i) => <li key={i}><a href={`#s${i}`}>{title}</a></li>)}
              </ul>
            </div>
          </aside>
          <main>
            <h1 style={{ fontSize: '2.5rem', marginBottom: 10 }}>Política de Privacidad</h1>
            <p className="muted">Conforme al RGPD (Reglamento UE 2016/679), la LOPDGDD (LO 3/2018) y la Directiva AMLD5 (UE 2015/849).</p>
            <div className="alert alert-info mt">
              <strong>Importante:</strong> conservamos los datos KYC durante 10 años conforme al art. 40 de la Directiva UE 2015/849 (AMLD5) y su transposición en la Ley 10/2010 de prevención del blanqueo de capitales.
            </div>
            <div className="card mt">
              {SECTIONS.map(([title, body], i) => (
                <div key={i} id={`s${i}`} style={{ marginBottom: 22, paddingBottom: 18, borderBottom: '1px solid var(--line)' }}>
                  <h3 style={{ color: 'var(--cyan-600)', fontSize: '1rem', marginBottom: 8 }}>{title}</h3>
                  <p className="muted">{body}</p>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
