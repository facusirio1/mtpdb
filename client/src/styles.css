/* ════════════════════════════════════════════════════════════════════
   MTP PLATFORM — Sistema de diseño unificado
   Paleta: cyan (#18bfe6) · violet (#8b5cf6) · gold (#d79b2b) · green (#15b981)
   Mismos colores en frontend + backend (NFT metadata, badges, mails)
   ════════════════════════════════════════════════════════════════════ */
:root {
  /* Fondos claros */
  --bg:#eef7ff; --bg-2:#f7fbff; --bg-soft:#f4fbff;
  --panel:rgba(255,255,255,.72); --panel-2:rgba(255,255,255,.88);

  /* Texto */
  --ink:#081120; --ink-soft:#334155; --soft:#1e3a8a;
  --line:rgba(30,64,175,.14);

  /* PALETA OFICIAL — usar en todo el sistema */
  --cyan-600:#0ea5c4; --cyan-500:#18bfe6; --cyan-400:#3ee7ff;
  --cyan-300:#7ff3ff; --cyan-200:#a5f3fc; --cyan-100:rgba(24,191,230,.10);
  --blue-500:#4f83ff;
  --violet-500:#8b5cf6;
  --gold-600:#b8841f; --gold-500:#d79b2b; --gold-400:#ffe6a7;
  --green-500:#15b981; --green-400:#56f3a6;
  --red-500:#ef4444;

  --radius:28px; --radius-sm:18px;
  --shadow:0 20px 70px rgba(31,74,125,.10);
  --shadow-lg:0 28px 80px rgba(31,74,125,.14);
  --shadow-cyan:0 18px 48px rgba(91,140,255,.32);

  --font-display:'Plus Jakarta Sans',system-ui,sans-serif;
  --font-body:'Plus Jakarta Sans',system-ui,sans-serif;
}

*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{
  font-family:var(--font-body); color:var(--ink); line-height:1.55; font-size:15px;
  min-height:100vh; overflow-x:hidden;
  background:
    radial-gradient(circle at 8% 8%,rgba(24,191,230,.22),transparent 30%),
    radial-gradient(circle at 86% 10%,rgba(79,131,255,.16),transparent 30%),
    radial-gradient(circle at 50% 42%,rgba(139,92,246,.10),transparent 34%),
    linear-gradient(180deg,#f4fbff 0%,#eef7ff 42%,#f8fbff 100%);
}
body:before{
  content:"";position:fixed;inset:0;pointer-events:none;opacity:.42;z-index:-1;
  background-image:
    linear-gradient(rgba(24,191,230,.09) 1px,transparent 1px),
    linear-gradient(90deg,rgba(24,191,230,.09) 1px,transparent 1px);
  background-size:42px 42px;
  mask-image:linear-gradient(to bottom,black,transparent 82%);
  -webkit-mask-image:linear-gradient(to bottom,black,transparent 82%);
}
h1,h2,h3,h4{font-family:var(--font-display);font-weight:800;color:var(--ink);line-height:1.15;letter-spacing:-.02em;margin:0}
a{color:var(--cyan-600);text-decoration:none}
a:hover{color:var(--cyan-500)}
.muted{color:var(--ink-soft);font-size:.95rem;margin:0;font-weight:500}
.dim{color:var(--ink-soft);font-size:.85rem}
.mt{margin-top:14px}
.row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.row.between{justify-content:space-between}

/* Brand mark — usado en todos los headers */
.brand-mark{
  width:44px;height:44px;border-radius:14px;
  background:conic-gradient(from 220deg,var(--cyan-500),var(--blue-500),var(--violet-500),var(--gold-500),var(--cyan-500));
  box-shadow:0 0 32px rgba(62,231,255,.32);
  position:relative;display:grid;place-items:center;color:#fff;font-weight:900;font-size:13px;
}
.brand-mark:after{content:"";position:absolute;inset:8px;border-radius:10px;border:1px solid rgba(255,255,255,.72)}

/* Sidebar autenticado */
.layout{display:grid;grid-template-columns:264px 1fr;min-height:100vh}
.sidebar{background:rgba(255,255,255,.72);backdrop-filter:blur(18px);padding:24px 16px;display:flex;flex-direction:column;gap:18px;position:sticky;top:0;height:100vh;border-right:1px solid var(--line)}
.brand{display:flex;align-items:center;gap:12px;padding:0 6px;text-decoration:none}
.brand strong{display:block;font-family:var(--font-display);font-size:1.05rem;color:var(--ink);font-weight:800}
.brand small{color:var(--cyan-600);font-size:.74rem;font-weight:600}
.nav{display:flex;flex-direction:column;gap:2px;margin-top:6px}
.nav a{color:var(--ink-soft);padding:10px 12px;border-radius:12px;font-weight:600;font-size:.92rem;display:flex;align-items:center;gap:10px;text-decoration:none}
.nav a:hover{background:rgba(24,191,230,.06);color:var(--cyan-600)}
.nav a.active{background:linear-gradient(135deg,rgba(24,191,230,.12),rgba(139,92,246,.08));color:var(--cyan-600);box-shadow:inset 2px 0 0 var(--cyan-500)}
.sidebar-foot{margin-top:auto;padding-top:14px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:10px}
.role-tag{font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;padding:5px 11px;border-radius:99px;background:rgba(24,191,230,.10);color:var(--cyan-600);width:fit-content;font-weight:800;border:1px solid rgba(24,191,230,.25)}
.logout{color:var(--ink-soft);font-size:.85rem;cursor:pointer;background:none;border:0;text-align:left;padding:0;font-weight:600}
.logout:hover{color:var(--cyan-600);text-decoration:underline}
.content{padding:28px 32px;max-width:100%;overflow-x:hidden}
.topbar{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:22px}
.topbar h1{font-size:1.7rem;margin-bottom:2px;letter-spacing:-.02em}
.topbar-user{display:flex;align-items:center;gap:14px}
.score-pill{display:flex;flex-direction:column;align-items:center;border:1.5px solid var(--line);border-radius:14px;padding:7px 14px;background:rgba(255,255,255,.78);min-width:78px;box-shadow:0 8px 22px rgba(31,74,125,.06)}
.score-num{font-family:var(--font-display);font-weight:900;font-size:1.3rem}
.score-lbl{font-size:.64rem;text-transform:uppercase;letter-spacing:.06em;color:var(--ink-soft);margin-top:3px;font-weight:700}
.score-good{border-color:var(--green-500)}.score-good .score-num{color:var(--green-500)}
.score-mid{border-color:var(--cyan-500)}.score-mid .score-num{color:var(--cyan-600)}
.score-low{border-color:var(--gold-500)}.score-low .score-num{color:var(--gold-600)}
.score-risk{border-color:var(--red-500)}.score-risk .score-num{color:var(--red-500)}
.avatar{width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,var(--cyan-500),var(--blue-500));color:#fff;display:grid;place-items:center;font-weight:800}
.who strong{display:block;font-size:.92rem;color:var(--ink)}
.who span{color:var(--ink-soft);font-size:.8rem}

/* Cards & grid */
.card{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);padding:24px;box-shadow:var(--shadow);backdrop-filter:blur(12px)}
.card:hover{background:var(--panel-2)}
.card h2{font-size:1.2rem;margin-bottom:6px}
.card h3{font-size:1.1rem;margin-bottom:12px}
.card p,.card li{color:var(--ink-soft);font-size:.95rem;font-weight:500}
.card-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.grid{display:grid;gap:18px}
.grid-4{grid-template-columns:repeat(4,1fr)}
.grid-3{grid-template-columns:repeat(3,1fr)}
.grid-2{grid-template-columns:repeat(2,1fr)}
.stat .stat-val{font-family:var(--font-display);font-weight:900;font-size:2.2rem;line-height:1;background:linear-gradient(135deg,var(--green-500),var(--cyan-500));-webkit-background-clip:text;color:transparent;letter-spacing:-.04em}
.stat .stat-lbl{color:var(--ink-soft);font-size:.85rem;margin-top:6px;font-weight:600}

/* Buttons */
.btn{display:inline-flex;gap:8px;align-items:center;border:1px solid var(--line);cursor:pointer;font:800 .92rem/1 var(--font-body);padding:13px 18px;border-radius:999px;text-decoration:none;transition:.25s;background:rgba(255,255,255,.72);color:var(--ink);box-shadow:0 12px 32px rgba(31,74,125,.08)}
.btn:hover{transform:translateY(-2px);text-decoration:none}
.btn:active{transform:translateY(0)}
.btn-primary{background:linear-gradient(135deg,var(--cyan-500),var(--blue-500));color:#fff;border:0;box-shadow:var(--shadow-cyan)}
.btn-primary:hover{filter:brightness(1.05);color:#fff}
.btn-gold,.btn-accent{background:linear-gradient(135deg,var(--gold-400),var(--gold-500));color:#15100a;border:0}
.btn-green{background:linear-gradient(135deg,#90ffd0,var(--green-500));color:#04130b;border:0}
.btn-violet{background:linear-gradient(135deg,#c4b5fd,var(--violet-500));color:#fff;border:0}
.btn-ghost{background:rgba(255,255,255,.72);border:1.5px solid var(--line);color:var(--ink)}
.btn-ghost:hover{border-color:var(--cyan-500);color:var(--cyan-600)}
.btn-danger{background:#fff;border:1.5px solid #fecaca;color:#b91c1c}
.btn-danger:hover{background:#fef2f2}
.btn-sm{padding:8px 14px;font-size:.82rem}
.btn:disabled{opacity:.55;cursor:not-allowed;transform:none}

/* Badges */
.badge{display:inline-block;padding:5px 11px;border-radius:99px;font-size:.74rem;font-weight:800;letter-spacing:.02em;border:1px solid transparent}
.badge-good{background:rgba(21,185,129,.10);color:#0b7a5a;border-color:rgba(21,185,129,.28)}
.badge-warn{background:rgba(215,155,43,.10);color:var(--gold-600);border-color:rgba(215,155,43,.30)}
.badge-risk{background:rgba(239,68,68,.10);color:#b91c1c;border-color:rgba(239,68,68,.30)}
.badge-info{background:rgba(24,191,230,.10);color:var(--cyan-600);border-color:rgba(24,191,230,.30)}
.badge-violet{background:rgba(139,92,246,.10);color:#6d28d9;border-color:rgba(139,92,246,.30)}
.badge-neutral{background:rgba(30,64,175,.06);color:var(--ink-soft);border-color:var(--line)}
.mem-basica{background:rgba(30,64,175,.06);color:var(--ink-soft);border-color:var(--line)}
.mem-profesional{background:rgba(24,191,230,.10);color:var(--cyan-600);font-weight:800;border-color:rgba(24,191,230,.30)}
.mem-premium{background:linear-gradient(135deg,rgba(215,155,43,.12),rgba(255,230,167,.18));color:var(--gold-600);font-weight:800;border-color:rgba(215,155,43,.35)}

/* Forms */
.field{display:flex;flex-direction:column;gap:6px;margin-bottom:14px}
.field label{font-size:.84rem;font-weight:700;color:var(--ink-soft)}
.field input,.field select,.field textarea{padding:12px 14px;border-radius:14px;border:1.5px solid var(--line);font:inherit;background:rgba(255,255,255,.78);color:var(--ink)}
.field input:focus,.field select:focus,.field textarea:focus{outline:0;border-color:var(--cyan-500);box-shadow:0 0 0 4px rgba(24,191,230,.15)}
.field textarea{min-height:80px;resize:vertical}
.field select{cursor:pointer}

/* Tablas */
.table-wrap{overflow:auto;border-radius:var(--radius-sm);border:1px solid var(--line);background:rgba(255,255,255,.7)}
table.data{width:100%;border-collapse:collapse;font-size:.92rem}
table.data th{background:rgba(24,191,230,.08);text-align:left;padding:13px 16px;font-weight:800;font-size:.74rem;color:var(--cyan-600);text-transform:uppercase;letter-spacing:.06em;border-bottom:1px solid var(--line)}
table.data td{padding:13px 16px;border-bottom:1px solid var(--line);vertical-align:top;color:var(--ink)}
table.data tr:last-child td{border-bottom:0}
table.data tr:hover{background:rgba(24,191,230,.04)}

/* Alerts */
.alert{padding:13px 18px;border-radius:14px;margin-bottom:16px;font-size:.92rem;font-weight:600}
.alert-success{background:rgba(21,185,129,.10);color:#0b7a5a;border-left:4px solid var(--green-500)}
.alert-error{background:rgba(239,68,68,.10);color:#b91c1c;border-left:4px solid var(--red-500)}
.alert-info{background:rgba(24,191,230,.10);color:var(--cyan-600);border-left:4px solid var(--cyan-500)}
.alert-warn{background:rgba(215,155,43,.10);color:var(--gold-600);border-left:4px solid var(--gold-500)}

/* Score bar */
.scorebar{height:10px;background:rgba(30,64,175,.08);border-radius:99px;overflow:hidden;margin:8px 0}
.scorebar>span{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--green-500),var(--cyan-500));box-shadow:0 0 12px rgba(24,191,230,.4)}

/* NFT highlights */
.nft-pill{display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,var(--gold-400),var(--gold-500));color:#15100a;padding:6px 12px;border-radius:99px;font-size:.75rem;font-weight:800;box-shadow:0 6px 18px rgba(215,155,43,.32)}
.nft-card{background:linear-gradient(160deg,rgba(255,230,167,.20),rgba(215,155,43,.04));border:2px solid var(--gold-500);border-radius:var(--radius);padding:22px;margin-bottom:16px;box-shadow:0 18px 50px rgba(215,155,43,.18)}
.tx-hash{font-family:ui-monospace,Menlo,monospace;font-size:.78rem;color:var(--cyan-600);word-break:break-all;background:rgba(24,191,230,.06);padding:7px 11px;border-radius:8px;border:1px solid rgba(24,191,230,.18);margin-top:4px}

/* Auth screens */
.auth-wrap{min-height:100vh;display:grid;place-items:center;padding:30px 20px}
.auth-box{max-width:430px;width:100%}
.auth-brand{display:flex;align-items:center;gap:12px;margin-bottom:20px;justify-content:center;text-decoration:none}

/* Plans (checkout + register) */
.plans{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:16px}
.plan{position:relative;cursor:pointer}
.plan input{position:absolute;opacity:0;pointer-events:none}
.plan-inner{padding:18px;border-radius:var(--radius-sm);border:2px solid var(--line);background:rgba(255,255,255,.78);height:100%;display:flex;flex-direction:column;gap:8px;transition:.15s}
.plan-inner:hover{border-color:var(--cyan-500)}
.plan input:checked + .plan-inner{border-color:var(--cyan-500);box-shadow:0 8px 24px rgba(24,191,230,.22)}
.plan.is-premium input:checked + .plan-inner{border-color:var(--gold-500);box-shadow:0 8px 24px rgba(215,155,43,.32)}
.plan-top{display:flex;align-items:center;justify-content:space-between}
.plan-name{font-family:var(--font-display);font-weight:800;font-size:1rem;color:var(--ink)}
.plan-ico{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:rgba(24,191,230,.12);color:var(--cyan-600);font-size:1.1rem}
.plan.is-premium .plan-ico{background:rgba(215,155,43,.12);color:var(--gold-600)}
.plan-price{font-family:var(--font-display);font-size:1.5rem;font-weight:900;line-height:1;color:var(--ink);letter-spacing:-.03em}
.plan-feats{list-style:none;padding:0;margin:0;font-size:.8rem;color:var(--ink-soft);line-height:1.6}
.plan-feats li::before{content:"✓ ";color:var(--green-500);font-weight:800}

/* Payment methods */
.payment-methods{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.pay-method{display:flex;gap:11px;padding:14px 16px;border:1.5px solid var(--line);border-radius:var(--radius-sm);background:rgba(255,255,255,.78);cursor:pointer;align-items:flex-start;transition:.15s}
.pay-method:hover{border-color:var(--cyan-500)}
.pay-method.active{border-color:var(--cyan-500);background:rgba(24,191,230,.06);box-shadow:0 6px 20px rgba(24,191,230,.18)}
.pay-method.disabled{opacity:.55;cursor:not-allowed}
.pay-method input{margin-top:4px;accent-color:var(--cyan-500)}
.pay-method strong{display:block;color:var(--ink);font-size:.95rem;font-weight:700}

/* Legal consents block */
.legal-consents{background:rgba(24,191,230,.06);border:1px solid rgba(24,191,230,.22);border-radius:var(--radius-sm);padding:18px 20px;margin:18px 0}
.legal-consents > strong{display:block;color:var(--cyan-600);font-size:.82rem;text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px;font-weight:900}
.lc-row{display:flex;gap:10px;align-items:flex-start;padding:6px 0;font-size:.9rem;line-height:1.5;color:var(--ink);cursor:pointer}
.lc-row input{margin-top:4px;width:16px;height:16px;accent-color:var(--cyan-500)}
.lc-row a{color:var(--cyan-600);font-weight:700}

/* KYC steps */
.kyc-steps{display:flex;flex-direction:column;gap:14px}
.kyc-step{display:flex;gap:14px;align-items:center;padding:14px 16px;border-radius:var(--radius-sm);border:1px solid var(--line);background:var(--panel)}
.kyc-step strong{color:var(--ink)}
.kyc-step-num{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;font-weight:900;flex-shrink:0;background:rgba(255,255,255,.78);color:var(--ink-soft);border:2px solid var(--line)}
.kyc-done .kyc-step-num{background:linear-gradient(135deg,var(--cyan-500),var(--blue-500));color:#fff;border-color:transparent;box-shadow:0 6px 18px rgba(24,191,230,.32)}
.kyc-active{border-color:var(--cyan-500);box-shadow:0 12px 30px rgba(24,191,230,.12)}
.kyc-active .kyc-step-num{background:rgba(24,191,230,.15);color:var(--cyan-600);border-color:var(--cyan-500)}

/* Verify page */
.verify-page{min-height:100vh}
.verify-wrap{max-width:980px;margin:0 auto;padding:60px 30px 80px}
.verify-head{text-align:center;margin-bottom:36px}
.verify-head h1{font-size:2.6rem;color:var(--ink);margin:8px 0;letter-spacing:-.03em}
.verify-form{display:flex;gap:10px;margin-bottom:14px}
.verify-form input{flex:1;padding:14px 18px;border-radius:14px;border:1.5px solid var(--line);background:var(--panel);font-family:ui-monospace,Menlo,monospace;font-size:.95rem}
.verify-form input:focus{outline:0;border-color:var(--cyan-500);box-shadow:0 0 0 4px rgba(24,191,230,.15)}
.verify-banner{display:flex;align-items:center;gap:16px;padding:18px 22px;background:linear-gradient(160deg,rgba(24,191,230,.10),transparent);border:1.5px solid var(--cyan-500);border-radius:var(--radius);margin-bottom:22px;box-shadow:0 14px 40px rgba(24,191,230,.12)}
.verify-icon{display:grid;place-items:center;width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,var(--cyan-500),var(--blue-500));color:#fff;font-weight:900;font-size:1.4rem;flex-shrink:0}
.verify-cert{background:var(--panel);border:1.5px solid var(--cyan-500);border-radius:var(--radius);padding:30px;box-shadow:0 18px 50px rgba(24,191,230,.10);margin-bottom:22px}
.verify-cert-head{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;padding-bottom:18px;border-bottom:1px solid var(--line);margin-bottom:22px}
.verify-cert-head h2{font-size:1.6rem;margin:4px 0 6px;letter-spacing:-.02em}
.verify-seal{font-size:3.5rem;background:linear-gradient(135deg,var(--cyan-500),var(--violet-500));-webkit-background-clip:text;color:transparent;line-height:1}
.verify-cert-body{display:grid;grid-template-columns:1.4fr 1fr;gap:30px}
.verify-dl{display:grid;grid-template-columns:auto 1fr;gap:8px 16px;margin:0}
.verify-dl dt{color:var(--ink-soft);font-size:.82rem;font-weight:700;padding:4px 0}
.verify-dl dd{margin:0;padding:4px 0}
.verify-qr-wrap{text-align:center}
.verify-qr{display:inline-block;padding:16px;background:rgba(255,255,255,.78);border-radius:var(--radius-sm);border:1px solid var(--line)}
.verify-chip{background:rgba(24,191,230,.08);color:var(--cyan-600);border:1px solid rgba(24,191,230,.25);padding:4px 11px;border-radius:99px;font-size:.76rem;cursor:pointer;font-family:ui-monospace,Menlo,monospace;font-weight:700}
.verify-chip:hover{background:rgba(24,191,230,.15)}

/* Responsive */
@media(max-width:900px){
  .layout{grid-template-columns:1fr}
  .sidebar{position:relative;height:auto;flex-direction:row;align-items:center;flex-wrap:wrap;padding:14px 18px}
  .nav{flex-direction:row;flex-wrap:wrap;flex:1}
  .sidebar-foot{flex-direction:row;border-top:0;padding-top:0;margin-left:auto}
  .grid-4,.grid-3,.grid-2{grid-template-columns:1fr}
  .plans,.payment-methods{grid-template-columns:1fr}
  .verify-cert-body{grid-template-columns:1fr}
}
