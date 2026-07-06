# syntax=docker/dockerfile:1.7

# ════════════════════════════════════════════════════════════════
# MTP Platform — Backend Node 22 + Express + Mongoose
#
# Build:
#   docker build -t mtp-api ./server
# Run standalone:
#   docker run --rm -p 4000:4000 -e MONGO_URI=mongodb://host.docker.internal:27017/mtp mtp-api
# ════════════════════════════════════════════════════════════════

FROM node:22-alpine AS base
WORKDIR /app

# Dependencias del sistema necesarias para ethers, mongoose y módulos nativos
RUN apk add --no-cache \
        python3 \
        make \
        g++ \
        && rm -rf /var/cache/apk/*

# ─── Instalación de dependencias (capa cacheable) ──────────────
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --no-audit --no-fund && \
    npm cache clean --force

# ─── Copiar código fuente ──────────────────────────────────────
COPY . .

# Limpiar el sistema build chain ya que no se necesita en runtime
RUN apk del python3 make g++ 2>/dev/null || true

# Directorio de uploads escribible
RUN mkdir -p uploads && chmod 755 uploads

# Usuario no-root por seguridad
RUN addgroup -S mtp && adduser -S mtp -G mtp && \
    chown -R mtp:mtp /app
USER mtp

EXPOSE 4000

# Healthcheck propio del container (independiente de docker-compose)
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://localhost:4000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# En producción usamos `npm start`. En dev `docker-compose` puede sobrescribir el command.
CMD ["npm", "start"]
