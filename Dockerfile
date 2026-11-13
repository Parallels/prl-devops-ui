# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:26-alpine AS builder

WORKDIR /app

# Copy manifests first for better layer caching
COPY package*.json ./
COPY packages/ui-kit/package*.json ./packages/ui-kit/

RUN npm ci --no-audit --no-fund

# Copy source and build
COPY . .

# Amplitude ingestion key (optional). Passed as a build-arg so it never lives
# in the repo; only the obfuscated form is baked into the bundle (see
# vite.config.ts). This ARG is confined to the builder stage and does NOT end
# up in the final image. Alternative without rebuilds: set the runtime env
# AMPLITUDE_API_KEY_OBFUSCATED (generate with scripts/obfuscate-amplitude-key.mjs).
ARG AMPLITUDE_API_KEY=""
ENV AMPLITUDE_API_KEY=${AMPLITUDE_API_KEY}

RUN npm run build:web

# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM nginx:alpine AS production

# Pull in Alpine security fixes published after the base image was built
RUN apk upgrade --no-cache

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
