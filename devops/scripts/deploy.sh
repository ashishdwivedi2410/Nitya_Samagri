#!/usr/bin/env bash
#
# scripts/deploy.sh
#
# Pulls the latest image for a service and restarts it. Extracted and
# generalized from the inline SSH steps in github-actions/backend.yml,
# frontend.yml and admin.yml (originally deploy-api.yml / deploy-web.yml /
# deploy-admin.yml), which each had near-identical deploy logic. Run from
# the deploy host, inside the checked-out app repo (cwd must contain the
# docker/ dir from this devops repo, or point COMPOSE_DIR at it).
#
# Usage:
#   ./deploy.sh <service> [health_url]
#
#   service     - api | web | admin | chatbot
#   health_url  - optional URL to curl after restart (defaults per service)
#
# Env vars:
#   APP_DIR       - path to the checked-out app repo (default: ~/Nitya_Samagri)
#   COMPOSE_DIR    - path to this devops repo's docker/ dir
#                     (default: ~/nitya-samagri-devops/docker)
#   RUN_MIGRATIONS - "1" to run `prisma migrate deploy` after restart
#                     (only meaningful for the api service; default "1" for api)

set -euo pipefail

SERVICE="${1:?Usage: deploy.sh <api|web|admin|chatbot> [health_url]}"
APP_DIR="${APP_DIR:-$HOME/Nitya_Samagri}"
COMPOSE_DIR="${COMPOSE_DIR:-$HOME/nitya-samagri-devops/docker}"

case "$SERVICE" in
  api)     DEFAULT_HEALTH_URL="https://api.adminns.in/health" ;;
  web)     DEFAULT_HEALTH_URL="https://nityasamagri.in" ;;
  admin)   DEFAULT_HEALTH_URL="https://adminns.in" ;;
  chatbot) DEFAULT_HEALTH_URL="https://chat.nityasamagri.in/health" ;;  # NEW service
  *) echo "❌ Unknown service '$SERVICE' (expected: api|web|admin|chatbot)"; exit 1 ;;
esac
HEALTH_URL="${2:-$DEFAULT_HEALTH_URL}"
RUN_MIGRATIONS="${RUN_MIGRATIONS:-$([ "$SERVICE" = "api" ] && echo 1 || echo 0)}"

echo "🚀 Deploying $SERVICE..."

cd "$APP_DIR"
git pull origin main

COMPOSE="docker compose -f ${COMPOSE_DIR}/docker-compose.dev.yml -f ${COMPOSE_DIR}/docker-compose.prod.yml"

# Pull new image
$COMPOSE pull "$SERVICE"

# Restart just this service
$COMPOSE up -d --no-deps "$SERVICE"

# Wait and health check
sleep 15
curl -sf "$HEALTH_URL" > /dev/null || { echo "❌ Health check failed for $SERVICE"; exit 1; }

if [ "$RUN_MIGRATIONS" = "1" ]; then
  echo "📦 Running database migrations..."
  $COMPOSE exec -T api npx prisma migrate deploy
fi

# Cleanup dangling images from the old version
docker image prune -f

echo "✅ $SERVICE deployed successfully!"