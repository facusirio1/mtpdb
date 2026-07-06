# Tests del backend

Hay **dos niveles** de tests, organizados de menos a más dependencias externas:

## `npm run test:unit` — tests unitarios puros (sin red, sin DB)

- `tests/unit.test.js` — 10 tests cubriendo:
  - **Firma Redsys** HMAC-SHA256 + 3DES (generación + verificación)
  - **Bizum** validación de teléfono + estructura del form
  - **IA heurística** detección de riesgo por keywords

Corren en menos de 200ms. Son los que **siempre tienen que pasar** en cualquier entorno.

## `npm run test:int` — tests de integración (requieren descarga de Mongo)

Usan `mongodb-memory-server` que descarga un binario de Mongo (~70 MB) la primera vez
para correr una instancia efímera en RAM. Necesitan acceso a `fastdl.mongodb.org`.

- `tests/auth.test.js` — registro + login + consentimientos legales (8 tests)
- `tests/validations.test.js` — flujo validación + scoring + reglas de roles (10 tests)
- `tests/payments.test.js` — endpoints de pagos + verificador público (8 tests)

## Cómo correr todo

```bash
npm test                # corre todos
npm run test:unit       # solo unit (rápido)
npm run test:int        # solo integration (lento la primera vez)
npm run test:watch      # modo watch para TDD
```

## CI

GitHub Actions ejecuta `npm run test:unit` en cada push.
Para los de integración, el workflow levanta un servicio Mongo en sidecar — ver `.github/workflows/ci.yml`.
