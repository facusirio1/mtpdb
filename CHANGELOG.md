# Changelog

Todos los cambios notables de este proyecto se documentan acá.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] — 2026-06-14

### Agregado
- Sistema completo React 18 + Vite 5 + Node 22 + Express + MongoDB
- 22 pantallas React con paleta unificada cyan/violet/gold
- 10 routers de API (auth, marketplace, documents, validations, users, activity, nft, kyc, verify, payments)
- 8 colecciones MongoDB con Mongoose 8
- Smart contract ERC-721 `MTPValidationNFT.sol` autocontenido para ETTIOS
- Auth con JWT + bcryptjs + 3 consentimientos legales obligatorios (Terms + Privacy + KYC)
- Pagos Redsys/CaixaBank Cyberpac con firma HMAC-SHA256 + 3DES
- Pagos Bizum sobre Redsys (paymethod="z")
- Pagos USDC/USDT en Ethereum, Polygon, BSC y ETTIOS con verificación on-chain
- Oracle Chainlink EUR/USD con cache 5 min + fallback automático 1:1
- Catálogo de 25 códigos SIS00xx de error Redsys con mensajes legibles
- Verificador público con QR — `/verify/:hash_o_token_o_id`
- KYC 4 pasos conforme AMLD5/AMLD6 (UE) + RGPD (10 años retención art. 40 AMLD5)
- Marketplace público embebido en landing con filtros
- 3 paneles role-based (usuario, verificador, admin)
- Trazabilidad inmutable en `activity_log`
- 44 tests automatizados (18 unit + 26 integration)
- GitHub Actions CI con jobs separados (unit + integration)
- Docker Compose con MongoDB 7 + Mongo Express

### Seguridad
- Saneamiento de `%` en JSON Base64 (evita SIS0007/SIS0431)
- Validación estricta de orderId Redsys (4-12 chars, primeros 4 numéricos)
- Datos de tarjeta nunca tocan el backend (PCI-DSS passthrough)
- Hash SHA-256 de cada upload para integridad

### Documentación
- `README.md` completo con badges y arquitectura
- `docs/SCHEMA.md` con las 8 colecciones MongoDB
- `docs/DEPLOYMENT.md` con guía de Atlas + Render + Vercel
- `docs/PAYMENTS.md` con tablas de tarjetas test, IPs whitelist, checklist Cyberpac
- `CONTRIBUTING.md` con conventional commits
- `CODE_OF_CONDUCT.md` basado en Contributor Covenant
- `SECURITY.md` con política de reporte de vulnerabilidades

## [Unreleased]

### Futuro
- Smart contract deploy guide para ETTIOS via Remix
- Integración Claude API real para motor IA (reemplaza heurística)
- Tests de integración del flujo completo de pago (mock Redsys + blockchain)
- Soporte multi-idioma (ES + EN)
- More tokens: DAI, EURC
- App móvil con Capacitor
