# MTP Platform

> **Infraestructura Global de Economía Verificable** — Plataforma de certificación documental con IA, verificadores humanos profesionales y NFTs en ETTIOS Blockchain.

[![CI](https://img.shields.io/badge/CI-passing-15b981?style=flat-square)](.github/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-18bfe6?style=flat-square)](LICENSE)
[![Node](https://img.shields.io/badge/node-22%2B-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![Tests](https://img.shields.io/badge/tests-44%20passing-15b981?style=flat-square)](server/tests/)

---

## ¿Qué es MTP Platform?

Una infraestructura web que une **cuatro pilares** para producir certificaciones documentales verificables on-chain:

1. **Usuarios** que cargan proyectos, balances, contratos, escrituras
2. **Verificadores humanos** con título habilitante que emiten dictámenes profesionales
3. **Motor IA** que pre-clasifica, resume y detecta riesgos
4. **ETTIOS Blockchain** (Layer 1 EVM, Chain ID 2237) donde quedan los certificados como NFTs ERC-721

Resultado: cualquier persona puede **verificar públicamente** un certificado MTP a través de su hash SHA-256, token ID o ID de documento — sin necesidad de cuenta.

## Quick start con Docker (recomendado)

Si tenés Docker instalado, **un solo comando levanta todo el stack** (MongoDB + backend + frontend):

```bash
git clone https://github.com/TU-USUARIO/mtp-platform.git
cd mtp-platform
docker compose up -d --build
docker compose --profile seed run --rm seed   # carga datos demo
```

Listo. Abrí http://localhost:5173

Ver [`docs/DOCKER.md`](docs/DOCKER.md) para la guía completa de Docker.

## Quick start con MongoDB Atlas (cloud)

Si querés usar Atlas en vez de Mongo local:

```bash
git clone https://github.com/TU-USUARIO/mtp-platform.git
cd mtp-platform
cd server && npm install && cd ..

# Setup interactivo — pide la password de Atlas sin mostrarla y valida la conexión
npm run setup:atlas

# Cargar el seed
cd server && npm run init-db && npm run dev
```

En otra terminal:
```bash
cd client && npm install && npm run dev
```

## Quick start sin Docker (Mongo nativo)

```bash
# 1. Clonar
git clone https://github.com/TU-USUARIO/mtp-platform.git
cd mtp-platform

# 2. Levantar MongoDB con Docker (o usar Mongo local instalado)
docker run -d -p 27017:27017 --name mtp-mongo mongo:7

# 3. Backend (terminal 1)
cd server && npm install && cp .env.example .env && npm run init-db && npm run dev

# 4. Frontend (terminal 2)
cd client && npm install && npm run dev

# 5. Abrir http://localhost:5173
```

**Cuentas demo** (password `mtp1234`):

| Email | Rol | Membresía | Notas |
|---|---|---|---|
| `admin@mtp.test` | admin | premium | Acceso total al panel admin |
| `empresa@mtp.test` | usuario | profesional | Tiene documentos validados |
| `usuario@mtp.test` | usuario | básica | KYC pendiente |
| `abogada@mtp.test` | verificador | premium | Especialidad: legal/abogado |
| `contador@mtp.test` | verificador | profesional | Especialidad: contador |

## Arquitectura

```
mtp-platform/
├── client/                    Frontend — React 18 + Vite 5
│   └── src/
│       ├── pages/             22 pantallas (públicas + 3 paneles role-based)
│       ├── components/        Componentes reutilizables (Sidebar, etc.)
│       ├── styles.css         Paleta unificada cyan/violet/gold
│       ├── api.js             Cliente HTTP del backend
│       └── auth.jsx           Provider de autenticación
│
├── server/                    Backend — Node 22 + Express + Mongoose
│   ├── src/
│   │   ├── routes/            10 routers (auth, docs, validations, payments, etc.)
│   │   ├── models/            8 colecciones MongoDB
│   │   ├── payments/          Redsys + Bizum + USDC/USDT + Chainlink oracle
│   │   ├── middleware/        auth + upload con SHA-256
│   │   ├── blockchain.js      Cliente ethers.js v6 para ETTIOS
│   │   └── ai.js              Motor IA heurístico (reemplazable por LLM)
│   ├── contracts/             Smart contract Solidity ERC-721
│   └── tests/                 44 tests unitarios
│
├── docs/
│   ├── SCHEMA.md              Esquema MongoDB (8 colecciones)
│   ├── DEPLOYMENT.md          Guía de deploy (local, Docker, cloud)
│   └── PAYMENTS.md            Integración Redsys/Bizum/Cripto + Cyberpac compliance
│
├── .github/
│   ├── workflows/ci.yml       GitHub Actions — unit + integration tests
│   ├── ISSUE_TEMPLATE/        Bug report + feature request
│   └── dependabot.yml         Updates automáticos
│
└── docker-compose.yml         MongoDB + Mongo Express local
```

## Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend | React 18.3 · Vite 5 · React Router 6 · CSS variables |
| Backend | Node 22 · Express 4 · Mongoose 8 |
| Database | MongoDB 7 (local + Atlas) |
| Blockchain | ethers.js v6 · Solidity 0.8.20 · ETTIOS Chain ID 2237 |
| Pagos | Redsys/CaixaBank Cyberpac · Bizum · USDC/USDT en 4 redes EVM |
| Oracle | Chainlink EUR/USD Price Feed (cache + fallback) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Files | Multer + SHA-256 |
| Tests | `node:test` (nativo) + MongoMemoryServer + supertest |

## Funcionalidades

- ✅ Auth con 3 consentimientos legales — Terms + Privacy + KYC/AML
- ✅ Carga de documentos con IA + verificación humana
- ✅ 4 tipos de certificación: CTE / CTPI / CEN / CTK
- ✅ NFTs en ETTIOS Blockchain — ERC-721 verificable
- ✅ Verificador público con QR — sin requerir cuenta
- ✅ KYC 4 pasos conforme AMLD5/AMLD6 (UE) + RGPD
- ✅ 3 métodos de pago:
  - Tarjeta vía Redsys/CaixaBank Cyberpac (firma SHA-256)
  - Bizum sobre Redsys
  - Stablecoins USDC/USDT en Ethereum/Polygon/BSC/ETTIOS
- ✅ Oracle Chainlink EUR/USD para cotización real en pagos cripto
- ✅ Marketplace público embebido en el landing
- ✅ 3 paneles role-based: Usuario / Verificador / Admin
- ✅ Trazabilidad inmutable (activity_log)
- ✅ 44 tests automatizados en CI

## Tests

```bash
# Tests unitarios (sin DB, sin red) — rápidos
cd server && npm run test:unit

# Tests de integración (con MongoMemoryServer)
cd server && npm run test:int

# Todo
cd server && npm test
```

## Deploy a producción

Tenés 3 opciones según tu escenario:

### Opción A — Render + Vercel + Atlas (más simple)
Ver [`docs/DEPLOY-RENDER.md`](docs/DEPLOY-RENDER.md).

### Opción B — VPS propio (más control, más económico)
Ver [`docs/VPS-HOSTINGER.md`](docs/VPS-HOSTINGER.md).

### Opción C — Docker Compose local
Ver [`docs/DOCKER.md`](docs/DOCKER.md).

**Comparación rápida:**

| Aspecto | Render/Vercel/Atlas | VPS Hostinger | Docker local |
|---|---|---|---|
| Costo | Gratis o €7-15/mes | ~€10/mes fijo | Gratis (tu PC) |
| Setup | 15-20 min | 30-45 min | 5 min |
| Sleep tras inactividad | Sí (free) | No | No |
| Control | Limitado | Total | Total |
| Escalabilidad | Auto horizontal | Vertical manual | Solo local |
| Mantenimiento | Cero | Actualizaciones manuales | Cero |

**Cuándo usar cada uno:**
- **Render/Vercel/Atlas**: MVP, prototipos, no querés admin de servidor
- **VPS Hostinger**: producción con control total, un solo pago fijo
- **Docker local**: desarrollo, testing, demos

## Pagos — Cumplimiento Cyberpac

El sistema cumple con la Guía oficial de Integración del Cyberpac publicada por Comercia Global Payments / CaixaBank:

- ✅ Firma HMAC-SHA256 + 3DES
- ✅ Validación de `orderId` (4-12 chars, primeros 4 numéricos)
- ✅ Saneamiento del carácter `%` (evita SIS0007/SIS0431)
- ✅ Datos de tarjeta nunca pasan por nuestros servidores (PCI-DSS passthrough)
- ✅ 25 códigos SIS00xx catalogados con mensajes legibles
- ✅ Webhook HTTPS con verificación de firma

Ver [`docs/PAYMENTS.md`](docs/PAYMENTS.md).

## Documentación

- [`docs/SCHEMA.md`](docs/SCHEMA.md) — 8 colecciones MongoDB
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — deploy paso a paso
- [`docs/PAYMENTS.md`](docs/PAYMENTS.md) — Redsys + Bizum + USDC/USDT + Chainlink
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — cómo contribuir
- [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) — código de conducta

## Propiedad intelectual

- **Autor intelectual:** Lic. Pablo Rutigliano
- **Titular patrimonial:** Aston Mining S.L.
- **Desarrollo tecnológico:** ETTIOS

## Licencia

MIT — ver [`LICENSE`](LICENSE).

---

<div align="center">

**MTP Platform** · *La confianza se vuelve visible*

</div>
