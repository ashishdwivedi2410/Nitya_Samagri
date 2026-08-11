# ─────────────────────────────────────────────────────────────────────────────
# backend/Dockerfile — Multi-stage production build for Node.js + Prisma
#
# Built from the REPO ROOT as build context (see .github/workflows/
# deploy-api.yml), not from ./backend — package-lock.json lives at the
# workspace root (npm workspaces), so the build context has to include it.
# Every COPY below is therefore rooted at the monorepo root and nests build
# output under backend/, mirroring the same fix applied to apps/web and
# apps/admin's Dockerfiles.
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Base ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl openssl-dev

# ── Stage 2: Install dependencies ────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
RUN npm ci --workspace=backend --include-workspace-root --frozen-lockfile
COPY backend/prisma ./backend/prisma/
RUN npx prisma generate --schema=./backend/prisma/schema.prisma

# ── Stage 3: Development ──────────────────────────────────────────────────────
FROM base AS development
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
WORKDIR /app/backend
EXPOSE 4000
CMD ["npm", "run", "dev"]

# ── Stage 4: Build TypeScript ─────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
WORKDIR /app/backend
RUN npx prisma generate
RUN npm run build
# Remove dev dependencies. `prisma` (the CLI, distinct from the
# @prisma/client runtime library) must be a real dependency — not a
# devDependency — because entrypoint.sh below runs `npx prisma migrate
# deploy` at container startup; pruning a devDependency here would make
# every production container fail to boot. See package.json.
RUN npm prune --omit=dev

# ── Stage 5: Production ───────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Install only runtime system deps
RUN apk add --no-cache openssl libc6-compat wget

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 --ingroup nodejs nodejs

# Copy built app
COPY --from=builder --chown=nodejs:nodejs /app/node_modules         ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/backend/dist         ./backend/dist
COPY --from=builder --chown=nodejs:nodejs /app/backend/prisma       ./backend/prisma
COPY --from=builder --chown=nodejs:nodejs /app/backend/package.json ./backend/package.json

WORKDIR /app/backend

# Entrypoint script: run migrations then start server
COPY --chown=nodejs:nodejs <<'ENTRYPOINT_EOF' ./entrypoint.sh
#!/bin/sh
set -e
echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy
echo "🪔 Starting nityasamagri API..."
exec "$@"
ENTRYPOINT_EOF
RUN chmod +x ./entrypoint.sh

USER nodejs
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "dist/server.js"]