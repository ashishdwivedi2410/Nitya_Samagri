# ─────────────────────────────────────────────────────────────────────────────
# backend/Dockerfile — Multi-stage production build for Node.js + MongoDB
#
# Built from the REPO ROOT as build context (see .github/workflows/
# deploy-api.yml), not from ./backend — package-lock.json lives at the
# workspace root (npm workspaces), so the build context has to include it.
# Every COPY below is therefore rooted at the monorepo root and nests build
# output under backend/, mirroring the same fix applied to apps/web and
# apps/admin's Dockerfiles.
#
# Updated: this app runs on MongoDB/Mongoose now, not PostgreSQL/Prisma —
# every `prisma generate` / `prisma migrate deploy` step has been removed.
# openssl is no longer needed either (it was only required for Prisma's
# query engine binary), but libc6-compat stays since some native npm
# packages still need it on alpine.
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Base ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# ── Stage 2: Install dependencies ────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
RUN npm ci --workspace=backend --include-workspace-root --frozen-lockfile

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
RUN npm run build
RUN npm prune --omit=dev

# ── Stage 5: Production ───────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Install only runtime system deps
RUN apk add --no-cache libc6-compat wget

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 --ingroup nodejs nodejs

# Copy built app
COPY --from=builder --chown=nodejs:nodejs /app/node_modules         ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/backend/dist         ./backend/dist
COPY --from=builder --chown=nodejs:nodejs /app/backend/package.json ./backend/package.json

WORKDIR /app/backend

# Entrypoint script: wait for MongoDB, run optional migrations, start server.
# Kept inline here (rather than only devops/docker/entrypoints/api-entrypoint.sh)
# so the image is self-contained and doesn't depend on the devops repo being
# checked out alongside it at build time — the devops copy is the canonical
# version if the two ever drift, this one should be kept in sync with it.
COPY --chown=nodejs:nodejs <<'ENTRYPOINT_EOF' ./entrypoint.sh
#!/bin/sh
set -e
echo "⏳ Waiting for MongoDB..."
MAX_RETRIES=30
RETRY_COUNT=0
until node -e "require('mongoose').connect(process.env.MONGO_URI).then(()=>process.exit(0)).catch(()=>process.exit(1))" > /dev/null 2>&1; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; then
    echo "❌ MongoDB did not become ready in time. Exiting."
    exit 1
  fi
  sleep 2
done
echo "✅ MongoDB is ready"
npm run migrate --if-present
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