#!/usr/bin/env bash
#
# scripts/rollback.sh
#
# Rolls a service (or all services) back to a previous Docker image tag.
# Extracted from the inline SSH step in github-actions/rollback.yml
# (originally .github/workflows/rollback.yml) so it can be run by hand or
# invoked from CI without duplicating the logic.
#
# Usage:
#   ./rollback.sh [tag] [service]
#
#   tag     - image tag to roll back to. Leave blank / pass "" to use the
#             tag recorded in .deploy_state.previous
#   service - one of: all | api | web | admin | chatbot  (default: all)
#
# Env vars:
#   APP_DIR      - path to the checked-out app repo (default: ~/Nitya_Samagri)
#   COMPOSE_DIR  - path to this devops repo's docker/ dir
#                   (default: ~/Nitya_Samagri/devops/docker)

set -euo pipefail

TAG="${1:-}"
SERVICE="${2:-all}"
APP_DIR="${APP_DIR:-$HOME/Nitya_Samagri}"
COMPOSE_DIR="${COMPOSE_DIR:-$HOME/Nitya_Samagri/devops/docker}"
STATE_FILE="${APP_DIR}/.deploy_state"

cd "$APP_DIR"

if [ -z "$TAG" ]; then
  TAG=$(cat "${STATE_FILE}.previous" 2>/dev/null || echo "")
fi
if [ -z "$TAG" ]; then
  echo "❌ No tag was given, and no previous version is on record."
  echo "❌ Pass the tag explicitly (check Docker Hub for available tags)."
  exit 1
fi

if [ "$SERVICE" = "all" ]; then
  SERVICES="api web admin chatbot"
else
  SERVICES="$SERVICE"
fi

# Prod only runs blue/green pairs for api/web/admin — there's no bare
# service to target, so roll back whichever color is currently live, in
# place (chatbot has no blue/green pair — see nginx/active/README.md).
ACTIVE=$(cat "${APP_DIR}/.active_color" 2>/dev/null || echo blue)
echo "🔙 Rolling back [$SERVICES] (color: $ACTIVE) to tag: $TAG"

TARGETS=""
for svc in $SERVICES; do
  if [ "$svc" = "chatbot" ]; then
    docker pull "docker.io/nityasamagri/${svc}:${TAG}"
    docker tag  "docker.io/nityasamagri/${svc}:${TAG}" "docker.io/nityasamagri/${svc}:latest"
    TARGETS="$TARGETS chatbot"
  else
    docker pull "docker.io/nityasamagri/${svc}:${TAG}"
    docker tag  "docker.io/nityasamagri/${svc}:${TAG}" "docker.io/nityasamagri/${svc}:${ACTIVE}"
    TARGETS="$TARGETS ${svc}_${ACTIVE}"
  fi
done

docker compose -f "${COMPOSE_DIR}/docker-compose.dev.yml" -f "${COMPOSE_DIR}/docker-compose.prod.yml" \
  up -d --no-deps $TARGETS

sleep 20

# Keep a record of what we rolled back *from*, and mark $TAG as the new
# current state so the scheduled-deploy rollback path stays consistent
# with reality.
[ -f "$STATE_FILE" ] && cp "$STATE_FILE" "${STATE_FILE}.rolled-back-from"
echo "$TAG" > "$STATE_FILE"
echo "✅ Rollback deploy complete."