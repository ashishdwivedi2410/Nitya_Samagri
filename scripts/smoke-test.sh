#!/usr/bin/env bash
#
# scripts/smoke-test.sh
#
# Verifies production is actually serving traffic after a deploy or
# rollback. Checks the API health endpoint, the customer storefront, and
# the admin panel — each independently skippable, since the single-service
# workflows (deploy-api.yml, deploy-web.yml, deploy-admin.yml) only touch
# one of the three and shouldn't fail on the other two being untouched/down
# for unrelated reasons.
#
# Env vars:
#   SKIP_API / SKIP_WEB / SKIP_ADMIN   - set to "1" to skip that check
#   SMOKE_TEST_RETRIES                 - attempts per check (default 5)
#   SMOKE_TEST_RETRY_DELAY             - seconds between attempts (default 5)
#   API_HEALTH_URL / WEB_URL / ADMIN_URL
#       - override the URL checked for that service
#       - defaults are the production domains from DEPLOYMENT_GUIDE.md

set -uo pipefail

RETRIES="${SMOKE_TEST_RETRIES:-5}"
DELAY="${SMOKE_TEST_RETRY_DELAY:-5}"

API_HEALTH_URL="${API_HEALTH_URL:-https://api.nityasamagri.com/health}"
WEB_URL="${WEB_URL:-https://nityasamagri.com}"
ADMIN_URL="${ADMIN_URL:-https://admin.nityasamagri.com}"

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

if [ "${SKIP_API:-0}" = "1" ]; then
  echo "── API health: skipped"
else
  check "API health" "$API_HEALTH_URL" '"status":"ok"' || FAILED=1
fi

if [ "${SKIP_WEB:-0}" = "1" ]; then
  echo "── Customer web: skipped"
else
  check "Customer web" "$WEB_URL" || FAILED=1
fi

if [ "${SKIP_ADMIN:-0}" = "1" ]; then
  echo "── Admin panel: skipped"
else
  check "Admin panel" "$ADMIN_URL" || FAILED=1
fi

echo ""
if [ "$FAILED" -ne 0 ]; then
  echo "❌ Smoke test failed."
  exit 1
fi

echo "✅ All smoke tests passed."