#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# docker/entrypoint.sh
# Backend container startup script: wait for DB → run migrations → start API
# ─────────────────────────────────────────────────────────────────────────────
set -e

echo "🪔 nityasamagri API — starting up..."

# ── Wait for PostgreSQL to be ready ───────────────────────────────────────────
echo "⏳ Waiting for PostgreSQL..."
MAX_RETRIES=30
RETRY_COUNT=0

until npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; then
    echo "❌ PostgreSQL did not become ready in time. Exiting."
    exit 1
  fi
  echo "   Postgres not ready yet (attempt $RETRY_COUNT/$MAX_RETRIES)... retrying in 2s"
  sleep 2
done
echo "✅ PostgreSQL is ready"

# ── Run database migrations ───────────────────────────────────────────────────
echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy
echo "✅ Migrations complete"

# ── Generate Prisma client (safety net in case build skipped it) ─────────────
npx prisma generate > /dev/null 2>&1 || true

# ── Start the application ─────────────────────────────────────────────────────
echo "🚀 Starting nityasamagri API server..."
exec "$@"
