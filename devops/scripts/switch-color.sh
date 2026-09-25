#!/usr/bin/env bash
#
# scripts/switch-color.sh
#
# Cuts real traffic over to the given blue/green color by copying the
# matching nginx/active/{svc}-backend.{color}.conf over the live
# nginx/active/{svc}-backend.conf and reloading nginx. Extracted from the
# "Cut traffic over to the new color" and "Clean up failed idle deploy"
# steps in github-actions/deploy-scheduled.yml (originally
# deploy-scheduled.yml) — this file existed but the cutover logic itself
# was never pulled out as a standalone script.
#
# Usage:
#   ./switch-color.sh <blue|green> [service ...]
#
#   service - one or more of: api web admin  (default: all three)
#             (chatbot has no blue/green setup — see nginx/active/README.md)
#
# Env vars:
#   APP_DIR      - path to the checked-out app repo (default: ~/Nitya_Samagri)
#   NGINX_DIR    - path to this devops repo's nginx/ dir
#                   (default: ~/Nitya_Samagri/devops/nginx)
#   COMPOSE_DIR  - path to this devops repo's docker/ dir
#                   (default: ~/Nitya_Samagri/devops/docker)
#   STATE_FILE   - where the current color is recorded
#                   (default: $APP_DIR/.active_color)

set -euo pipefail

COLOR="${1:?Usage: switch-color.sh <blue|green> [service ...]}"
shift || true
SERVICES=("${@:-api web admin}")
[ "${#SERVICES[@]}" -eq 1 ] && SERVICES=(${SERVICES[0]})  # split default string

case "$COLOR" in
  blue|green) ;;
  *) echo "❌ color must be 'blue' or 'green'"; exit 1 ;;
esac

APP_DIR="${APP_DIR:-$HOME/Nitya_Samagri}"
NGINX_DIR="${NGINX_DIR:-$HOME/Nitya_Samagri/devops/nginx}"
COMPOSE_DIR="${COMPOSE_DIR:-$HOME/Nitya_Samagri/devops/docker}"
STATE_FILE="${STATE_FILE:-$APP_DIR/.active_color}"

echo "🔀 Switching [${SERVICES[*]}] to $COLOR..."

for svc in "${SERVICES[@]}"; do
  cp "${NGINX_DIR}/active/${svc}-backend.${COLOR}.conf" "${NGINX_DIR}/active/${svc}-backend.conf"
done

docker compose -f "${COMPOSE_DIR}/docker-compose.dev.yml" -f "${COMPOSE_DIR}/docker-compose.prod.yml" \
  exec -T nginx nginx -s reload

echo "$COLOR" > "$STATE_FILE"
echo "✅ Traffic switched to $COLOR."