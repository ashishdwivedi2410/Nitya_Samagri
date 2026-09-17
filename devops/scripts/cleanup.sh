#!/usr/bin/env bash
#
# scripts/cleanup.sh
#
# NEW: the original workflows only ever ran a bare `docker image prune -f`
# inline after each deploy. This consolidates that plus a few other routine
# housekeeping tasks (dangling volumes, stopped containers, old logs) into
# one script you can run on a schedule or manually.
#
# Usage:
#   ./cleanup.sh
#
# Env vars:
#   LOG_DIR          - path to app logs to prune (default: /var/log/nginx)
#   LOG_RETENTION_DAYS - delete logs older than this many days (default: 14)
#   PRUNE_VOLUMES    - "1" to also prune unused Docker volumes (default: "0",
#                       since this is destructive if a volume isn't attached
#                       to a running container but you still need its data)

set -euo pipefail

LOG_DIR="${LOG_DIR:-/var/log/nginx}"
LOG_RETENTION_DAYS="${LOG_RETENTION_DAYS:-14}"
PRUNE_VOLUMES="${PRUNE_VOLUMES:-0}"

echo "🧹 Removing stopped containers..."
docker container prune -f

echo "🧹 Removing dangling/unused images..."
docker image prune -af --filter "until=72h"

if [ "$PRUNE_VOLUMES" = "1" ]; then
  echo "🧹 Removing unused volumes..."
  docker volume prune -f
else
  echo "⏭  Skipping volume prune (set PRUNE_VOLUMES=1 to enable)"
fi

echo "🧹 Removing unused networks..."
docker network prune -f

if [ -d "$LOG_DIR" ]; then
  echo "🧹 Deleting logs older than ${LOG_RETENTION_DAYS} days in ${LOG_DIR}..."
  find "$LOG_DIR" -type f -name "*.log*" -mtime "+${LOG_RETENTION_DAYS}" -delete
else
  echo "⏭  Log dir ${LOG_DIR} not found, skipping log cleanup"
fi

echo "✅ Cleanup complete."