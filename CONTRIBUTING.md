# Cómo contribuir a MTP Platform

Gracias por interesarte en contribuir. Este documento explica el flujo.

## Setup del entorno local

```bash
git clone https://github.com/TU-USUARIO/mtp-platform.git
cd mtp-platform
docker-compose up -d        # MongoDB en :27017
cd server && npm install && cp .env.example .env && npm run init-db && npm run dev
cd ../client && npm install && npm run dev
```

## Branches

- **`main`** — siempre deployable
- **`feat/*`** — nuevas funcionalidades
- **`fix/*`** — bug fixes
- **`docs/*`** — solo documentación
- **`refactor/*`** — refactors sin cambio de comportamiento
- **`test/*`** — tests nuevos o reorganización

## Convención de commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: agrega pago con USDT en Polygon
fix: corrige firma HMAC cuando el orderId tiene 12 chars
docs: actualiza README con instrucciones de Atlas
refactor: separa oracle de crypto en módulos distintos
test: agrega tests de validación de orderId
chore: actualiza dependencias dev
```

Tipos permitidos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`.

## Tests obligatorios

Antes de abrir un PR:

```bash
cd server && npm test            # Todos los tests deben pasar
cd ../client && npm run build    # El frontend debe compilar
```

Si agregás funcionalidad nueva, **agregá tests**. Si arreglás un bug, agregá un test de regresión.

## Pull Request

1. Fork del repo
2. Branch desde `main`: `git checkout -b feat/mi-feature`
3. Commits semánticos
4. Push: `git push origin feat/mi-feature`
5. Abrir PR contra `main` describiendo:
   - Qué cambia
   - Por qué
   - Cómo lo testeaste
6. Esperar review + CI green

## Estilo de código

- **JS/JSX**: 2 espacios, semicolons, single quotes, ES modules (`import/export`)
- **CSS**: BEM-light, paleta unificada en `:root` (no hardcodear colores)
- **Spanish rioplatense** para textos UI y comentarios

## Reportar bugs

Usá el template de bug report en [Issues](../../issues/new?template=bug_report.yml).

## Seguridad

Si encontraste una vulnerabilidad de seguridad, **NO** abras un issue público.
Mandá email a `security@mtp.platform`.

## Licencia

Al contribuir, aceptás que tu código se distribuya bajo la licencia MIT del proyecto.
