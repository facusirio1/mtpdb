import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';

function MarketplaceSection() {
  const [pros, setPros] = useState([]);
  const [sector, setSector] = useState('');
  const [membership, setMembership] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams();
    if (sector) q.set('sector', sector);
    if (membership) q.set('membership', membership);
    api.get('/marketplace/professionals' + (q.toString() ? '?' + q : ''))
      .then(setPros).catch(() => setPros([])).finally(() => setLoading(false));
  }, [sector, membership]);

  const sectors = ['Legal', 'Finanzas', 'Inmobiliario', 'Agro', 'Tecnología'];

  return (
    <section className="lp-section lp-section-dark" id="marketplace">
      <div className="lp-section-head">
        <span className="lp-eyebrow">MARKETPLACE VIVO</span>
        <h2>Conectate con profesionales verificados ahora mismo.</h2>
        <p>Cada profesional pasó KYC y construyó su reputación con dictámenes reales. Filtrá por sector y membresía para encontrar al indicado.</p>
      </div>

      <div className="market-toolbar">
        <div className="filters">
          <button className={`filter-chip ${!sector ? 'active' : ''}`} onClick={() => setSector('')}>Todos los sectores</button>
          {sectors.map(s => (
            <button key={s} className={`filter-chip ${sector === s ? 'active' : ''}`} onClick={() => setSector(s)}>{s}</button>
          ))}
        </div>
        <div className="filters">
          <button className={`filter-chip ${!membership ? 'active' : ''}`} onClick={() => setMembership('')}>Todas</button>
          <button className={`filter-chip ${membership === 'basica' ? 'active' : ''}`} onClick={() => setMembership('basica')}>Básica</button>
          <button className={`filter-chip ${membership === 'profesional' ? 'active' : ''}`} onClick={() => setMembership('profesional')}>Profesional</button>
          <button className={`filter-chip ${membership === 'premium' ? 'active' : ''}`} onClick={() => setMembership('premium')}>Premium</button>
        </div>
      </div>

      {loading ? (
        <div className="empty-box"><p className="muted">Cargando profesionales…</p></div>
      ) : pros.length === 0 ? (
        <div className="empty-box">
          <p className="muted">Sin resultados con esos filtros.</p>
          <button className="btn btn-ghost btn-sm mt" onClick={() => { setSector(''); setMembership(''); }}>Limpiar filtros</button>
        </div>
      ) : (
        <div className="grid grid-3">
          {pros.slice(0, 6).map(p => (
            <div key={p.id} className={`card pro-card ${p.membership === 'premium' ? 'pro-card-premium' : ''}`}>
              {p.membership === 'premium' && <span className="pro-ribbon">★ PREMIUM</span>}
              <div className="pro-top">
                <div className="pro-ava">{(p.full_name || '?').slice(0, 2).toUpperCase()}</div>
                <div>
                  <div className="pro-name">{p.full_name}</div>
                  <div className="pro-meta">{p.specialty || p.company_name || p.entity_type}</div>
                </div>
              </div>
              <div className="pro-tags">
                {p.sector && <span className="badge badge-info">{p.sector}</span>}
                <span className={`badge mem-${p.membership}`}>{p.membership}</span>
                {p.role === 'verificador' && <span className="badge badge-good">verificador</span>}
              </div>
              <div className="pro-foot">
                <div>
                  <strong style={{ color: 'var(--cyan-600)', fontSize: '1.2rem' }}>{Math.round(p.reputation)}</strong>
                  <span className="dim" style={{ fontSize: '.78rem', marginLeft: 4 }}>/100</span>
                </div>
                <Link to="/register" className="btn btn-ghost btn-sm">Contactar</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function Landing() {
  const { user, roleHome } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [stats, setStats] = useState({ professionals: 0, avg_reputation: 0, sectors: 0, nfts_minted: 0 });
  const [open, setOpen] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll);
    api.get('/marketplace/stats').then(setStats).catch(() => {});
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="lp">
      <nav className={`lp-nav ${scrolled ? 'is-scrolled' : ''}`}>
        <Link to="/" className="lp-brand">
          <div className="brand-mark">M<span>T</span>P</div>
          <div><strong>MTP Platform</strong><small>Economía Verificable</small></div>
        </Link>
        <div className="lp-nav-links">
          <a href="#simple">Cómo funciona</a>
          <a href="#marketplace">Marketplace</a>
          <a href="#certificaciones">Certificaciones</a>
          <a href="#roadmap">Roadmap</a>
          <a href="#pagos">Pagos</a>
          <Link to="/verify">Verificar</Link>
        </div>
        <div className="row" style={{ gap: 8 }}>
          {user ? (
            <Link to={roleHome()} className="btn btn-primary btn-sm">Mi panel →</Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Ingresar</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Comenzar</Link>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div>
            <span className="lp-tag"><span className="lp-pulse" /> IA + Verificadores + Usuarios + Trazabilidad</span>
            <h1><em>MTP Platform</em><br />la red global de confianza verificable.</h1>
            <p>Una plataforma donde cada usuario carga información, sigue la trazabilidad, recibe validación profesional y obtiene evidencia verificable. Diseñada para personas, empresas, instituciones y verificadores.</p>
            <div className="row" style={{ gap: 13, marginTop: 30 }}>
              <Link to="/register" className="btn btn-primary">Quiero evaluar algo</Link>
              <Link to="/register?as=verifier" className="btn btn-green">Quiero ser verificador</Link>
              <a href="#marketplace" className="btn btn-gold">Explorar marketplace ↓</a>
            </div>
            <div className="lp-hero-stats">
              <div><strong>{stats.professionals}</strong><span>profesionales</span></div>
              <div><strong>{stats.avg_reputation}</strong><span>reputación media</span></div>
              <div><strong>{stats.sectors}</strong><span>sectores</span></div>
              <div><strong>{stats.nfts_minted}</strong><span>NFTs en ETTIOS</span></div>
            </div>
          </div>
          <div className="lp-hero-card">
            <div className="row between" style={{ marginBottom: 18 }}>
              <div>
                <strong style={{ color: 'var(--ink)', fontSize: 18 }}>Centro de Control MTP</strong><br />
                <small style={{ color: 'var(--ink-soft)' }}>Economía verificable en tiempo real</small>
              </div>
              <span className="lp-tag" style={{ margin: 0 }}>ECOSISTEMA ACTIVO</span>
            </div>
            <div className="grid grid-2" style={{ gap: 13 }}>
              <div className="card" style={{ padding: 17 }}>
                <div className="dim" style={{ fontSize: 11, letterSpacing: '.13em', textTransform: 'uppercase', marginBottom: 10 }}>Score de confianza</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 52, lineHeight: 1, letterSpacing: '-.04em', background: 'linear-gradient(135deg,var(--green-500),var(--cyan-500))', WebkitBackgroundClip: 'text', color: 'transparent' }}>94</div>
                <div className="scorebar mt"><span style={{ width: '94%' }} /></div>
                <small className="dim">Evidencia y validaciones consolidadas</small>
              </div>
              <div className="card" style={{ padding: 17 }}>
                <div className="dim" style={{ fontSize: 11, letterSpacing: '.13em', textTransform: 'uppercase', marginBottom: 10 }}>Participación humana</div>
                <h3 style={{ fontSize: 38, color: 'var(--green-500)', margin: 0, fontWeight: 900, letterSpacing: '-.02em' }}>12</h3>
                <div className="scorebar mt"><span style={{ width: '78%' }} /></div>
                <small className="dim">Verificadores asignados por especialidad</small>
              </div>
            </div>
            <div className="card" style={{ padding: 17, marginTop: 13 }}>
              <div className="dim" style={{ fontSize: 11, letterSpacing: '.13em', textTransform: 'uppercase', marginBottom: 10 }}>Ruta de trazabilidad</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
                {['1. Cargo', '2. Ordena IA', '3. Valida humano', '4. Se traza', '5. Certifica'].map(s => (
                  <div key={s} style={{ padding: '10px 7px', borderRadius: 12, textAlign: 'center', color: 'var(--ink-soft)', fontSize: 12, background: 'rgba(255,255,255,.6)', border: '1px solid var(--line)', fontWeight: 600 }}>{s}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRAZABILIDAD SIMPLE */}
      <section className="lp-section" id="simple">
        <div className="lp-section-head">
          <span className="lp-eyebrow">CÓMO FUNCIONA</span>
          <h2>Trazabilidad simple: siempre sabés dónde estás.</h2>
          <p>Ningún usuario ni verificador debe perderse dentro de la plataforma.</p>
        </div>
        <div className="simple-strip">
          {[
            ['1. Inicio',           'Elegís: soy usuario, empresa, institución o verificador.'],
            ['2. Carga',            'Subís documentos y la plataforma muestra el progreso.'],
            ['3. Análisis IA',      'La IA resume, clasifica y detecta riesgos.'],
            ['4. Validación humana','Verificadores idóneos revisan y dejan evidencia.'],
            ['5. Certificación',    'Recibís informe, score, QR y trazabilidad completa.'],
          ].map(([title, text]) => (
            <div key={title} className="simple-item"><b>{title}</b><span>{text}</span></div>
          ))}
        </div>
      </section>

      <MarketplaceSection />

      {/* CERTIFICACIONES */}
      <section className="lp-section" id="certificaciones">
        <div className="lp-section-head">
          <span className="lp-eyebrow">CERTIFICACIONES</span>
          <h2>Cuatro estándares de certificación on-chain.</h2>
          <p>Cada certificado se emite como NFT en ETTIOS con metadatos públicos verificables.</p>
        </div>
        <div className="grid grid-2">
          {[
            { code: 'CTE',  name: 'Trazabilidad Económica', desc: 'Proyectos, empresas, inversiones, compliance y estructuras financieras.', items: ['Bancos, inversores y fondos.', 'Startups y proyectos productivos.', 'Validación económica, jurídica y documental.'] },
            { code: 'CTPI', name: 'Procesos Inteligentes',  desc: 'Procesos judiciales, sanitarios, productivos y gubernamentales.',           items: ['Justicia, municipios, gobiernos y hospitales.', 'Empresas, universidades y ciudadanos.', 'Línea de tiempo, evidencia, riesgos y dictámenes.'] },
            { code: 'CEN',  name: 'Escritural Notarial',    desc: 'Escribano digital con fe pública blockchain.',                                items: ['Contratos y poderes con validez notarial.', 'Escrituras públicas y privadas.', 'Protocolización on-chain.'] },
            { code: 'CTK',  name: 'Tokenización',           desc: 'Activos reales tokenizados: inmuebles, ganado, vehículos eléctricos.',        items: ['Cuotapartes en NFT transferibles.', 'Liquidez secundaria.', 'Custodio regulado.'] },
          ].map(c => (
            <div key={c.code} className="card">
              <div className="lp-cert-head">
                <div className="lp-cert-icon">{c.code}</div>
                <div>
                  <div className="lp-cert-code">{c.code}</div>
                  <div className="lp-cert-name">{c.name}</div>
                </div>
              </div>
              <p className="muted" style={{ marginBottom: 12 }}>{c.desc}</p>
              <ul className="lp-list" style={{ marginTop: 0 }}>{c.items.map(i => <li key={i}>{i}</li>)}</ul>
            </div>
          ))}
        </div>
      </section>

      {/* ROADMAP */}
      <section className="lp-section lp-section-dark" id="roadmap">
        <div className="lp-section-head">
          <span className="lp-eyebrow">ROADMAP · 6 FASES</span>
          <h2>De Desarrollo Fundacional a Infraestructura Económica Global.</h2>
        </div>
        <div className="roadmap">
          {[
            ['Desarrollo Fundacional',        'Infraestructura base + 7 capas operativas + smart contracts ERC-721 en ETTIOS.', 'active'],
            ['Escalabilidad Multisectorial',  'Onboarding masivo de profesionales + sectores agro/inmobiliario/deporte.',       'next'],
            ['Automatización IA',             'LLM real para pre-validación automática y triage inteligente.',                  ''],
            ['Interoperabilidad Global',      'Bridges a Ethereum, Polygon, BSC. Estándar MiCA y reconocimiento legal cruzado.', ''],
            ['Blockchain Readiness',          'Tokens ERC-1155 para fracción de activos, marketplace secundario.',              ''],
            ['Infraestructura Económica Global', 'MTP adoptado por gobiernos, municipios y bancos centrales.',                   ''],
          ].map(([title, desc, state], idx) => (
            <div key={title} className={`roadmap-phase ${state === 'active' ? 'roadmap-active' : state === 'next' ? 'roadmap-next' : ''}`}>
              <div className="roadmap-num">{String(idx + 1).padStart(2, '0')}</div>
              <div className="roadmap-body">
                <div className="row between" style={{ alignItems: 'flex-start' }}>
                  <h3>{title}</h3>
                  <span className={`badge ${state === 'active' ? 'badge-good' : state === 'next' ? 'badge-warn' : 'badge-neutral'}`}>
                    {state === 'active' ? 'Activo' : state === 'next' ? 'Próximo' : 'Futuro'}
                  </span>
                </div>
                <p className="muted">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PAGOS */}
      <section className="lp-section" id="pagos">
        <div className="lp-section-head">
          <span className="lp-eyebrow">PAGOS</span>
          <h2>Tres formas de pagar. Fiat o cripto.</h2>
          <p>La plataforma acepta tarjeta (CaixaBank · Redsys), Bizum y stablecoins USDC/USDT en cuatro redes blockchain.</p>
        </div>
        <div className="payments" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="card">
            <h3>💳 Tarjeta · Redsys</h3>
            <p className="muted" style={{ marginBottom: 14 }}>TPV virtual CaixaBank Cyberpac, firma HMAC-SHA256, entornos test y producción, operaciones autorizadas/denegadas y notificaciones HTTP.</p>
            <span className="logo-pill">CaixaBank</span>
            <span className="logo-pill">Cyberpac</span>
            <span className="logo-pill">Visa</span>
            <span className="logo-pill">Mastercard</span>
            <div className="mt"><Link to="/checkout" className="btn btn-primary btn-sm">Pagar con tarjeta →</Link></div>
          </div>
          <div className="card">
            <h3>📱 Bizum</h3>
            <p className="muted" style={{ marginBottom: 14 }}>Pago instantáneo con número de teléfono y clave Bizum recibida por SMS. Solo para usuarios en España.</p>
            <span className="logo-pill">Bizum</span>
            <span className="logo-pill">Mobile Pay</span>
            <span className="logo-pill">SMS Key</span>
            <div className="mt"><Link to="/checkout?plan=profesional" className="btn btn-primary btn-sm">Pagar con Bizum →</Link></div>
          </div>
          <div className="card" style={{ border: '1.5px solid rgba(139,92,246,.28)', background: 'linear-gradient(160deg, rgba(139,92,246,.04), rgba(255,255,255,.7))' }}>
            <h3>◈ Stablecoins · USDC/USDT</h3>
            <p className="muted" style={{ marginBottom: 14 }}>Pagá desde tu wallet (MetaMask, Trust, Rabby) en Ethereum, Polygon, BSC o ETTIOS. Verificación on-chain automática del Transfer.</p>
            <span className="logo-pill">USDC</span>
            <span className="logo-pill">USDT</span>
            <span className="logo-pill">Polygon</span>
            <span className="logo-pill">ETTIOS</span>
            <div className="mt"><Link to="/checkout" className="btn btn-primary btn-sm" style={{ background: 'linear-gradient(135deg, var(--violet-500), var(--cyan-500))' }}>Pagar con cripto →</Link></div>
          </div>
        </div>
      </section>

      {/* PROPIEDAD INTELECTUAL */}
      <section className="lp-section">
        <div className="ip-block">
          <h2>Propiedad intelectual, titularidad y desarrollo.</h2>
          <p className="muted" style={{ marginTop: 8 }}>Figura con claridad institucional en la web y en el footer.</p>
          <div className="ip-grid">
            <div className="ip-item"><span>Autor intelectual y creador conceptual</span><strong>Lic. Pablo Rutigliano</strong></div>
            <div className="ip-item"><span>Titular patrimonial</span><strong>Aston Mining S.L.</strong></div>
            <div className="ip-item"><span>Desarrollo tecnológico de la web</span><strong>ETTIOS</strong></div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="lp-section lp-section-dark">
        <div className="lp-section-head">
          <span className="lp-eyebrow">PREGUNTAS FRECUENTES</span>
          <h2>Lo que más nos preguntan.</h2>
        </div>
        <div>
          {[
            ['¿Qué es la fe pública blockchain?',  'Es la rúbrica notarial trasladada a blockchain. El escribano digital firma criptográficamente el documento; el resultado se ancla on-chain con validez legal equivalente a la escritura tradicional.'],
            ['¿Cómo se calcula el scoring?',       'La reputación (0-100) combina KYC, calidad y cantidad de validaciones recibidas, historial profesional y antigüedad. Cada dictamen aprobado suma 8 puntos; rechazado resta 10.'],
            ['¿Qué red blockchain usan?',          'ETTIOS Blockchain — Layer 1 EVM-compatible con Chain ID 2237. Smart contracts auditados y explorer público en scan.ettiosblockchain.io.'],
            ['¿Quién puede ser verificador?',      'Profesionales con título habilitante: abogados, jueces, ex fiscales, contadores, médicos, ingenieros, técnicos, empresarios, auditores y especialistas.'],
            ['¿Los NFTs se pueden transferir?',    'Los CTE/CTPI/CEN son Soulbound — no transferibles, atados a la identidad. Los CTK (Tokenización) sí son transferibles porque representan activos reales.'],
          ].map(([q, a], i) => (
            <div key={i} className={`lp-faq ${open === i ? 'is-open' : ''}`} onClick={() => setOpen(open === i ? -1 : i)}>
              <div className="lp-faq-q"><span>{q}</span><span className="lp-faq-toggle">{open === i ? '−' : '+'}</span></div>
              {open === i && <p className="lp-faq-a muted">{a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta">
        <div className="lp-cta-panel">
          <span className="lp-tag"><span className="lp-pulse" /> La confianza se vuelve visible</span>
          <h2 style={{ marginTop: 18 }}>Una plataforma clara para todos. Una infraestructura poderosa para el mundo.</h2>
          <p className="muted" style={{ fontSize: 19, maxWidth: 780, margin: '14px auto 30px' }}>MTP Platform une usuarios, verificadores, instituciones e inteligencia artificial para construir la economía verificable del futuro.</p>
          <div className="row" style={{ justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary">Crear cuenta</Link>
            <Link to="/register?as=verifier" className="btn btn-green">Ser verificador</Link>
            <a href="#marketplace" className="btn btn-gold">Ver marketplace</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-foot">
        <div className="row between" style={{ flexWrap: 'wrap', gap: 20 }}>
          <div>
            <strong style={{ color: 'var(--ink)', fontSize: '1.05rem' }}>MTP Platform</strong>
            <p className="dim mt">Infraestructura Global de Economía Verificable.</p>
            <p className="dim">© 2026 Lic. Pablo Rutigliano. Todos los derechos reservados.</p>
          </div>
          <div className="dim" style={{ textAlign: 'right' }}>
            <div>Desarrollo tecnológico: <strong style={{ color: 'var(--cyan-600)' }}>ETTIOS</strong></div>
            <div>Titular patrimonial: <strong style={{ color: 'var(--ink)' }}>Aston Mining S.L.</strong></div>
            <code style={{ fontSize: 11, color: 'var(--cyan-600)' }}>rpc.ettiosblockchain.io</code>
          </div>
        </div>
      </footer>
    </div>
  );
}
