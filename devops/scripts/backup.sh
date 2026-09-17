#!/usr/bin/env bash
#
# scripts/backup.sh
#
# Dumps MongoDB, compresses it, and uploads to S3, pruning backups older
# than 30 days. Originally extracted from the database-backup job of
# github-actions/maintenance.yml when the app used PostgreSQL — updated
# to mongodump/mongorestore now that the main backend runs on MongoDB.
#
# Usage:
#   ./backup.sh
#
# Env vars (all required except COMPOSE_DIR/RETENTION_DAYS):
#   AWS_S3_BUCKET, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
#   MONGO_ROOT_USER, MONGO_ROOT_PASSWORD  - must match docker-compose's mongodb service
#   COMPOSE_DIR      - path to this devops repo's docker/ dir
#                       (default: ~/nitya-samagri-devops/docker)
#   RETENTION_DAYS   - how many most-recent backups to keep (default: 30)

set -euo pipefail

: "${AWS_S3_BUCKET:?AWS_S3_BUCKET is required}"
: "${AWS_REGION:?AWS_REGION is required}"
: "${MONGO_ROOT_USER:?MONGO_ROOT_USER is required}"
: "${MONGO_ROOT_PASSWORD:?MONGO_ROOT_PASSWORD is required}"

COMPOSE_DIR="${COMPOSE_DIR:-$HOME/nitya-samagri-devops/docker}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

DATE=$(date +%Y-%m-%d)
BACKUP_FILE="nityasamagri_backup_${DATE}.archive.gz"

COMPOSE="docker compose -f ${COMPOSE_DIR}/docker-compose.dev.yml -f ${COMPOSE_DIR}/docker-compose.prod.yml"

echo "🗄️  Starting database backup..."

# Dump into the mongodb container, then copy out
$COMPOSE exec -T mongodb \
  mongodump --username "$MONGO_ROOT_USER" --password "$MONGO_ROOT_PASSWORD" \
  --authenticationDatabase admin --db nityasamagri --archive="/tmp/${BACKUP_FILE}" --gzip

docker cp "$($COMPOSE ps -q mongodb):/tmp/${BACKUP_FILE}" "/tmp/${BACKUP_FILE}"
$COMPOSE exec -T mongodb rm -f "/tmp/${BACKUP_FILE}"

aws s3 cp "/tmp/${BACKUP_FILE}" \
  "s3://${AWS_S3_BUCKET}/backups/${BACKUP_FILE}" \
  --region "$AWS_REGION"

# Keep only the most recent N backups
aws s3 ls "s3://${AWS_S3_BUCKET}/backups/" | \
  sort | head -n "-${RETENTION_DAYS}" | \
  awk '{print $4}' | \
  xargs -I {} aws s3 rm "s3://${AWS_S3_BUCKET}/backups/{}"

rm "/tmp/${BACKUP_FILE}"

echo "✅ Backup complete: ${BACKUP_FILE}"