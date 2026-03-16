# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:25-alpine AS builder

WORKDIR /app

# Copy manifests first for better layer caching
COPY package*.json ./
COPY packages/ui-kit/package*.json ./packages/ui-kit/

RUN npm ci

# Copy source and build
COPY . .
RUN npm run build:web

# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM nginx:alpine AS production

# Runtime entrypoint (generates env-config.js)
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# nginx SPA config
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Static assets from build stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
