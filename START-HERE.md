# Empezá acá

> Guía express para publicar el repo en GitHub y deployarlo.

## En 3 comandos: subir el repo a GitHub

```bash
git init && git branch -M main
git add . && git commit -m "feat: MTP Platform v3.0"
gh repo create mtp-platform --public --source=. --remote=origin --push
```

Si no tenés `gh` CLI: [docs/GITHUB-SETUP.md](docs/GITHUB-SETUP.md) tiene la versión manual con GitHub Desktop.

## En 3 comandos: correr en tu PC (con Docker)

```bash
docker compose up -d --build
docker compose --profile seed run --rm seed
open http://localhost:5173
```

Login demo: `admin@mtp.test` / `mtp1234`

## Deploy a producción

Tres opciones según lo que quieras:

**Opción A — Render + Vercel + Atlas** (más simple, ~15 min)
```
1. Atlas    → cluster + 0.0.0.0/0 en Network Access                (5 min)
2. GitHub   → push del repo                                          (3 min)
3. Render   → New Blueprint Instance → seleccionar el repo           (10 min)
4. Vercel   → Import Git Repository → detecta vercel.json solo       (5 min)
```
Guía completa: [docs/DEPLOY-RENDER.md](docs/DEPLOY-RENDER.md)

**Opción B — VPS Hostinger** (más control, ~30 min)
```bash
ssh root@TU-VPS
curl -fsSL https://raw.githubusercontent.com/TU-USUARIO/mtp-platform/main/vps/install.sh | bash
# después: clonar repo + configurar .env + activar systemd + nginx + SSL
```
Guía completa: [docs/VPS-HOSTINGER.md](docs/VPS-HOSTINGER.md)

**Opción C — Docker local**
```bash
docker compose up -d --build
```
Guía completa: [docs/DOCKER.md](docs/DOCKER.md)

## Archivos clave para revisar antes de subir

```
📄 README.md              ← descripción principal
📄 render.yaml            ← configuración de Render (deploy automático)
📄 vercel.json            ← configuración de Vercel
📄 .env.example           ← template de variables (NO tiene secretos)
📄 .gitignore             ← protege .env, node_modules, wallets, keys
```

## Marco regulatorio implementado

Todo el sistema está alineado con normativa europea:

- **RGPD** (Reglamento UE 2016/679) para protección de datos
- **AMLD5/AMLD6** para prevención de blanqueo de capitales
- **SEPBLAC** como autoridad AML en España
- **AEPD** como autoridad de protección de datos
- **MiCA** (Reglamento UE 2023/1114) para criptoactivos
- **PSD2** para servicios de pago (Redsys/Bizum)

## Comandos útiles

| Comando | Función |
|---|---|
| `npm run setup:atlas` | Setup interactivo de MongoDB Atlas |
| `npm run docker:up` | Levantar todo con Docker |
| `npm run test` | Correr los 44 tests |
| `npm run build` | Build de producción del frontend |

## Guías detalladas

- [`docs/GITHUB-SETUP.md`](docs/GITHUB-SETUP.md) — subir a GitHub paso a paso
- [`docs/DEPLOY-RENDER.md`](docs/DEPLOY-RENDER.md) — deploy en Render + Vercel
- [`docs/ATLAS.md`](docs/ATLAS.md) — MongoDB Atlas
- [`docs/DOCKER.md`](docs/DOCKER.md) — Docker Compose local
- [`docs/PAYMENTS.md`](docs/PAYMENTS.md) — Redsys, Bizum, USDC/USDT
- [`docs/SCHEMA.md`](docs/SCHEMA.md) — 8 colecciones MongoDB

## Soporte

Si tenés un problema, abrí un [Issue](../../issues/new/choose) con el template correspondiente.

Para reportar vulnerabilidades de seguridad, ver [SECURITY.md](SECURITY.md).
