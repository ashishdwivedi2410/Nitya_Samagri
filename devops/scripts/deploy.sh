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
#                     (default: ~/Nitya_Samagri/devops/docker)
#
# Note: chatbot has no blue/green pair (see nginx/active/README.md), so it
# deploys as a bare service; api/web/admin do, so this script updates
# whichever color is currently live, in place — same pattern the CI
# workflows use for their single-service deploys. Migrations for the api
# service run automatically inside the container's own entrypoint
# (docker/entrypoints/api-entrypoint.sh) before the server starts, so
# there's no separate migrate step here.

set -euo pipefail

SERVICE="${1:?Usage: deploy.sh <api|web|admin|chatbot> [health_url]}"
APP_DIR="${APP_DIR:-$HOME/Nitya_Samagri}"
COMPOSE_DIR="${COMPOSE_DIR:-$HOME/Nitya_Samagri/devops/docker}"

case "$SERVICE" in
  api)     DEFAULT_HEALTH_URL="https://api.adminns.in/health" ;;
  web)     DEFAULT_HEALTH_URL="https://nityasamagri.in" ;;
  admin)   DEFAULT_HEALTH_URL="https://adminns.in" ;;
  chatbot) DEFAULT_HEALTH_URL="https://chat.nityasamagri.in/health" ;;  # NEW service
  *) echo "❌ Unknown service '$SERVICE' (expected: api|web|admin|chatbot)"; exit 1 ;;
esac
HEALTH_URL="${2:-$DEFAULT_HEALTH_URL}"

echo "🚀 Deploying $SERVICE..."

cd "$APP_DIR"
git pull origin main

COMPOSE="docker compose -f ${COMPOSE_DIR}/docker-compose.dev.yml -f ${COMPOSE_DIR}/docker-compose.prod.yml"

if [ "$SERVICE" = "chatbot" ]; then
  TARGET="chatbot"
else
  ACTIVE=$(cat "${APP_DIR}/.active_color" 2>/dev/null || echo blue)
  TARGET="${SERVICE}_${ACTIVE}"
  docker tag "docker.io/nityasamagri/${SERVICE}:latest" "docker.io/nityasamagri/${SERVICE}:${ACTIVE}" 2>/dev/null || true
fi

# Pull new image
$COMPOSE pull "$TARGET"

# Restart just this service
$COMPOSE up -d --no-deps "$TARGET"

# Wait and health check
sleep 15
curl -sf "$HEALTH_URL" > /dev/null || { echo "❌ Health check failed for $SERVICE"; exit 1; }

# Cleanup dangling images from the old version
docker image prune -f

echo "✅ $SERVICE deployed successfully!"