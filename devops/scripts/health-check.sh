#!/usr/bin/env bash
#
# scripts/health-check.sh
#
# Verifies production is actually serving traffic after a deploy or
# rollback. Checks the API health endpoint, the customer storefront, and
# the admin panel — each independently skippable, since the single-service
# workflows (deploy-api.yml, deploy-web.yml, deploy-admin.yml) only touch
# one of the three and shouldn't fail on the other two being untouched/down
# for unrelated reasons.
#
# Usage: ./health-check.sh [service]
#   service - optional: api | web | admin | chatbot | all (default: all)
#             (accepted for compatibility with callers like
#             `./health-check.sh chatbot` in chatbot.yml)
#
# Env vars:
#   SKIP_API / SKIP_WEB / SKIP_ADMIN / SKIP_CHATBOT - set to "1" to skip that check
#   SMOKE_TEST_RETRIES                 - attempts per check (default 5)
#   SMOKE_TEST_RETRY_DELAY             - seconds between attempts (default 5)
#   API_HEALTH_URL / WEB_URL / ADMIN_URL / CHATBOT_HEALTH_URL
#       - override the URL checked for that service
#       - defaults are the production domains from DEPLOYMENT_GUIDE.md
#       - CHATBOT_HEALTH_URL is NEW (chatbot service didn't exist originally);
#         confirm it against the real deployed domain

set -uo pipefail

RETRIES="${SMOKE_TEST_RETRIES:-5}"
DELAY="${SMOKE_TEST_RETRY_DELAY:-5}"

API_HEALTH_URL="${API_HEALTH_URL:-https://api.adminns.in/health}"
WEB_URL="${WEB_URL:-https://nityasamagri.in}"
ADMIN_URL="${ADMIN_URL:-https://adminns.in}"
CHATBOT_HEALTH_URL="${CHATBOT_HEALTH_URL:-https://chat.nityasamagri.in/health}"

TARGET="${1:-all}"
FAILED=0

# check NAME URL [required_substring]
check() {
  local name="$1" url="$2" pattern="${3:-}"
  local attempt=1 body

  echo "── ${name}: ${url}"
  while [ "$attempt" -le "$RETRIES" ]; do
    if body=$(curl -sf --max-time 10 "$url" 2>/dev/null); then
      if [ -z "$pattern" ] || printf '%s' "$body" | grep -q "$pattern"; then
        echo "   ✅ OK (attempt ${attempt}/${RETRIES})"
        return 0
      fi
      echo "   ⚠️  attempt ${attempt}/${RETRIES}: reachable but response didn't match expected content"
    else
      echo "   ⚠️  attempt ${attempt}/${RETRIES}: request failed"
    fi
    attempt=$((attempt + 1))
    [ "$attempt" -le "$RETRIES" ] && sleep "$DELAY"
  done

  echo "   ❌ FAILED after ${RETRIES} attempts"
  return 1
}

run_api=0; run_web=0; run_admin=0; run_chatbot=0
case "$TARGET" in
  all)     run_api=1; run_web=1; run_admin=1; run_chatbot=1 ;;
  api)     run_api=1 ;;
  web)     run_web=1 ;;
  admin)   run_admin=1 ;;
  chatbot) run_chatbot=1 ;;
  *) echo "Unknown target '$TARGET' (expected: api|web|admin|chatbot|all)"; exit 2 ;;
esac

if [ "$run_api" = "1" ]; then
  if [ "${SKIP_API:-0}" = "1" ]; then
    echo "── API health: skipped"
  else
    check "API health" "$API_HEALTH_URL" '"status":"ok"' || FAILED=1
  fi
fi

if [ "$run_web" = "1" ]; then
  if [ "${SKIP_WEB:-0}" = "1" ]; then
    echo "── Customer web: skipped"
  else
    check "Customer web" "$WEB_URL" || FAILED=1
  fi
fi

if [ "$run_admin" = "1" ]; then
  if [ "${SKIP_ADMIN:-0}" = "1" ]; then
    echo "── Admin panel: skipped"
  else
    check "Admin panel" "$ADMIN_URL" || FAILED=1
  fi
fi

if [ "$run_chatbot" = "1" ]; then
  if [ "${SKIP_CHATBOT:-0}" = "1" ]; then
    echo "── Chatbot health: skipped"
  else
    check "Chatbot health" "$CHATBOT_HEALTH_URL" '"status":"ok"' || FAILED=1
  fi
fi

echo ""
if [ "$FAILED" -ne 0 ]; then
  echo "❌ Smoke test failed."
  exit 1
fi

echo "✅ All smoke tests passed."