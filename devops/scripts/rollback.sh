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
# Expects to be run from the deploy host, in the directory containing
# docker-compose.yml + docker-compose.prod.yml (see docker/ in this repo).

set -euo pipefail

TAG="${1:-}"
SERVICE="${2:-all}"
STATE_FILE=".deploy_state"

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

echo "🔙 Rolling back [$SERVICES] to tag: $TAG"

for svc in $SERVICES; do
  docker pull "docker.io/nityasamagri/${svc}:${TAG}"
  docker tag  "docker.io/nityasamagri/${svc}:${TAG}" "docker.io/nityasamagri/${svc}:latest"
done

docker compose -f docker/docker-compose.dev.yml -f docker/docker-compose.prod.yml \
  up -d --no-deps $SERVICES

sleep 20

# Keep a record of what we rolled back *from*, and mark $TAG as the new
# current state so the scheduled-deploy rollback path stays consistent
# with reality.
[ -f "$STATE_FILE" ] && cp "$STATE_FILE" "${STATE_FILE}.rolled-back-from"
echo "$TAG" > "$STATE_FILE"
echo "✅ Rollback deploy complete."