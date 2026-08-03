# # ─────────────────────────────────────────────────────────────────────────────
# # backend/Dockerfile — Multi-stage production build for Node.js + Prisma
# # ─────────────────────────────────────────────────────────────────────────────

# # ── Stage 1: Base ─────────────────────────────────────────────────────────────
# FROM node:20-alpine AS base
# WORKDIR /app
# RUN apk add --no-cache libc6-compat openssl openssl-dev

# # ── Stage 2: Install dependencies ────────────────────────────────────────────
# FROM base AS deps
# COPY package.json package-lock.json ./
# COPY prisma ./prisma/
# RUN npm ci --frozen-lockfile
# RUN npx prisma generate

# # ── Stage 3: Development ──────────────────────────────────────────────────────
# FROM base AS development
# ENV NODE_ENV=development
# WORKDIR /app
# COPY --from=deps /app/node_modules ./node_modules
# COPY --from=deps /app/prisma ./prisma
# COPY . .
# RUN npx prisma generate
# EXPOSE 4000
# CMD ["npm", "run", "dev"]

# # ── Stage 4: Build TypeScript ─────────────────────────────────────────────────
# FROM base AS builder
# WORKDIR /app
# COPY --from=deps /app/node_modules ./node_modules
# COPY --from=deps /app/prisma ./prisma
# COPY . .
# RUN npx prisma generate
# RUN npm run build
# # Remove dev dependencies
# RUN npm prune --omit=dev

# # ── Stage 5: Production ───────────────────────────────────────────────────────
# FROM node:20-alpine AS production
# WORKDIR /app

# ENV NODE_ENV=production
# ENV PORT=4000

# # Install only runtime system deps
# RUN apk add --no-cache openssl libc6-compat wget

# # Create non-root user for security
# RUN addgroup --system --gid 1001 nodejs \
#  && adduser  --system --uid 1001 --ingroup nodejs nodejs

# # Copy built app
# COPY --from=builder --chown=nodejs:nodejs /app/dist         ./dist
# COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
# COPY --from=builder --chown=nodejs:nodejs /app/prisma       ./prisma
# COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

# # Entrypoint script: run migrations then start server
# COPY --chown=nodejs:nodejs <<'EOF' ./entrypoint.sh
# #!/bin/sh
# set -e
# echo "🔄 Running Prisma migrations..."
# npx prisma migrate deploy
# echo "🪔 Starting nityasamagri API..."
# exec "$@"
# EOF
# RUN chmod +x ./entrypoint.sh

# USER nodejs
# EXPOSE 4000

# HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
#   CMD wget -qO- http://localhost:4000/health || exit 1

# ENTRYPOINT ["./entrypoint.sh"]
# CMD ["node", "dist/app.js"]


# ─────────────────────────────────────────────────────────────────────────────
# apps/*/Dockerfile — Multi-stage Next.js 14 production build
# Works for: apps/web, apps/admin, apps/pandit
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Base ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# ── Stage 2: Install dependencies ────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

# ── Stage 3: Development ──────────────────────────────────────────────────────
FROM base AS development
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ── Stage 4: Build for production ────────────────────────────────────────────
FROM base AS builder
ENV NODE_ENV=production
# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept build args for public env vars
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_RAZORPAY_KEY
ARG NEXT_PUBLIC_APP_URL

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_RAZORPAY_KEY=$NEXT_PUBLIC_RAZORPAY_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

RUN npm run build

# ── Stage 5: Production runner ────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apk add --no-cache wget

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 --ingroup nodejs nextjs

# Copy Next.js standalone output
# Requires: output: "standalone" in next.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static    ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public          ./public

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["node", "server.js"]