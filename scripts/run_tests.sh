#!/usr/bin/env bash
# TaxWijs — unified test runner
# Runs all test suites in one command and exits non-zero if any suite fails.
#
# Usage:
#   ./scripts/run_tests.sh            # run everything
#   ./scripts/run_tests.sh django     # Django tests only
#   ./scripts/run_tests.sh phase2     # RAG retrieval tests only
#   ./scripts/run_tests.sh phase3     # Calculator scenario tests only
#
# Prerequisites:
#   - DJANGO_SETTINGS_MODULE or .env file with DATABASE_URL
#   - OPENAI_API_KEY set to run phase2 tests (they embed queries)
#   - Run from the project root

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SUITE="${1:-all}"
FAILURES=0

# ── Colours ───────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
RESET='\033[0m'

pass() { echo -e "${GREEN}✓ $1${RESET}"; }
fail() { echo -e "${RED}✗ $1${RESET}"; FAILURES=$((FAILURES + 1)); }
section() { echo -e "\n${BLUE}═══ $1 ═══${RESET}"; }

# ── Django tests ──────────────────────────────────────────────────────────────
run_django() {
  section "Django backend tests (apps.calculator, apps.chat, apps.portal, apps.users)"
  cd "$ROOT/backend"
  if python3 manage.py test \
      apps.calculator \
      apps.chat \
      apps.portal \
      apps.users \
      --verbosity=2 \
      --failfast 2>&1; then
    pass "Django tests"
  else
    fail "Django tests"
  fi
  cd "$ROOT"
}

# ── Phase 2 — RAG retrieval tests ─────────────────────────────────────────────
run_phase2() {
  section "Phase 2 — RAG retrieval tests (requires OPENAI_API_KEY + built index)"
  if [ -z "${OPENAI_API_KEY:-}" ]; then
    echo "  OPENAI_API_KEY not set — skipping phase2 tests"
    return
  fi
  cd "$ROOT"
  if python3 phase2/test_retrieval.py 2>&1; then
    pass "Phase 2 retrieval tests"
  else
    fail "Phase 2 retrieval tests"
  fi
}

# ── Phase 3 — Calculator scenario tests ──────────────────────────────────────
run_phase3() {
  section "Phase 3 — Tax calculator scenario tests (6 scenarios, <1% error)"
  cd "$ROOT"
  if python3 phase3/test_scenarios.py 2>&1; then
    pass "Phase 3 scenario tests"
  else
    fail "Phase 3 scenario tests"
  fi
}

# ── Phase 1 — validate.py ─────────────────────────────────────────────────────
run_phase1() {
  section "Phase 1 — Knowledge base validation (validate.py)"
  cd "$ROOT"
  if python3 phase1/scripts/validate.py 2>&1; then
    pass "Phase 1 validate.py"
  else
    fail "Phase 1 validate.py"
  fi
}

# ── Main ──────────────────────────────────────────────────────────────────────
case "$SUITE" in
  django)  run_django  ;;
  phase1)  run_phase1  ;;
  phase2)  run_phase2  ;;
  phase3)  run_phase3  ;;
  all)
    run_phase1
    run_django
    run_phase3
    run_phase2
    ;;
  *)
    echo "Unknown suite '$SUITE'. Use: all | django | phase1 | phase2 | phase3"
    exit 1
    ;;
esac

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
if [ "$FAILURES" -eq 0 ]; then
  echo -e "${GREEN}All test suites passed.${RESET}"
  exit 0
else
  echo -e "${RED}$FAILURES suite(s) failed.${RESET}"
  exit 1
fi
