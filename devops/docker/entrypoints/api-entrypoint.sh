#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# docker/entrypoints/api-entrypoint.sh
# Backend container startup script: wait for DB → (optional migrations) → start API
#
# Originally used PostgreSQL + `npx prisma migrate deploy`. Updated for
# MongoDB: Mongoose has no built-in migration runner, so this waits for
# Mongo to accept connections, then calls `npm run migrate --if-present`
# as a hook in case you're using a tool like migrate-mongo — safe to leave
# that script undefined if you don't need migrations.
# ─────────────────────────────────────────────────────────────────────────────
set -e

echo "🪔 nityasamagri API — starting up..."

# ── Wait for MongoDB to be ready ──────────────────────────────────────────────
echo "⏳ Waiting for MongoDB..."
MAX_RETRIES=30
RETRY_COUNT=0

until node -e "require('mongoose').connect(process.env.MONGO_URI).then(()=>process.exit(0)).catch(()=>process.exit(1))" > /dev/null 2>&1; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; then
    echo "❌ MongoDB did not become ready in time. Exiting."
    exit 1
  fi
  echo "   MongoDB not ready yet (attempt $RETRY_COUNT/$MAX_RETRIES)... retrying in 2s"
  sleep 2
done
echo "✅ MongoDB is ready"

# ── Run database migrations (optional) ────────────────────────────────────────
# No-op unless package.json defines a "migrate" script (e.g. migrate-mongo up).
echo "🔄 Checking for migrations..."
npm run migrate --if-present
echo "✅ Migration step done"

# ── Start the application ─────────────────────────────────────────────────────
echo "🚀 Starting nityasamagri API server..."
exec "$@"