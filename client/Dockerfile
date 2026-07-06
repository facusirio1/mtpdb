# syntax=docker/dockerfile:1.7

# ════════════════════════════════════════════════════════════════
# MTP Platform — Frontend React 18 + Vite 5
#
# En development: usa el dev server de Vite con HMR
# En production: build estático servido con nginx
#
# Build dev (default en docker-compose):
#   docker build -t mtp-web ./client
#   docker run --rm -p 5173:5173 mtp-web
#
# Build prod:
#   docker build --target prod -t mtp-web:prod ./client
#   docker run --rm -p 80:80 mtp-web:prod
# ════════════════════════════════════════════════════════════════

# ─── Stage común: dependencias ─────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund && \
    npm cache clean --force

# ─── Stage dev: Vite dev server con HMR ────────────────────────
FROM node:22-alpine AS dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 5173

# --host 0.0.0.0 es necesario para que el dev server sea accesible
# desde fuera del container (Docker network → host)
CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "5173"]

# ─── Stage build: compila el bundle estático ──────────────────
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ─── Stage prod: nginx sirviendo dist/ ─────────────────────────
FROM nginx:1.27-alpine AS prod
WORKDIR /usr/share/nginx/html

# Copiar el bundle compilado
COPY --from=build /app/dist .

# Configuración nginx — SPA con fallback a index.html
RUN cat > /etc/nginx/conf.d/default.conf << 'NGINXEOF'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Compresión gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
    gzip_min_length 1000;

    # Cache largo para assets con hash
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback — todas las rutas devuelven index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
NGINXEOF

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# Default target = dev (para `docker compose up`)
FROM dev
