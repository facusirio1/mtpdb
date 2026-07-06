# Política de seguridad

## Versiones soportadas

| Versión | Soporte |
|---|---|
| 3.x | ✅ activo |
| < 3.0 | ❌ no soportada |

## Reportar una vulnerabilidad

**NO** abrir issues públicos para vulnerabilidades de seguridad.

Mandá un email a `security@mtp.platform` con:
- Descripción del problema
- Pasos para reproducir
- Versión afectada
- Impacto potencial

Respondemos en menos de 48 horas. Si se confirma la vulnerabilidad:
1. Coordinamos un fix
2. Publicamos un patch
3. Reconocemos al reportador en el changelog (si lo desea)

## Buenas prácticas en deploy

- **Nunca** commitear archivos `.env` — están en `.gitignore`
- **Rotar** secrets (JWT, REDSYS_SECRET_KEY, ETTIOS_PRIVATE_KEY) periódicamente
- En producción usar **HTTPS obligatorio** para el webhook de Redsys
- Mantener `MAX_UPLOAD_BYTES` razonable (default 8 MB)
- En MongoDB Atlas: restringir IPs a las de tu hosting (no `0.0.0.0/0` en producción seria)
- Habilitar autenticación en MongoDB cuando se exponga públicamente
- Mantener dependencias al día — Dependabot está configurado en `.github/dependabot.yml`

## Datos sensibles que el sistema NUNCA debe almacenar

Por diseño, MTP Platform:
- **NO** almacena datos de tarjeta — viajan directos del cliente a Redsys (PCI-DSS passthrough)
- **NO** almacena claves privadas EVM de los usuarios — solo direcciones públicas
- **NO** almacena documentos sin cifrado en reposo (AES-256 en disco)
- Los hashes SHA-256 de documentos sí van on-chain — son **públicos por diseño**

## Cumplimiento

- **RGPD** (UE): conservación de datos KYC durante 10 años, derecho de acceso/rectificación/supresión
- **AMLD5/AMLD6** (UE): Directivas 2015/849 y 2018/1673 de prevención de blanqueo. Supervisión SEPBLAC en España.
- **PSD2** (UE): Directiva 2015/2366 de servicios de pago (aplica a Redsys/Bizum)
- **MiCA** (UE): Reglamento 2023/1114 sobre criptoactivos. Tokens MTP son utility (no financieros)
- **PCI-DSS**: passthrough — no procesamos datos de tarjeta, solo redirigimos
- **MiCA** (UE): tokens MTP son utility tokens / SoulBound, no instrumentos financieros
