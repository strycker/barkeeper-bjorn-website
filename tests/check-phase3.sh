#!/usr/bin/env bash
# Phase 3 (Content Management) — Static analysis checks
# Covers the 9 automatable structural invariants from 03-VALIDATION.md
# Usage: bash tests/check-phase3.sh (from repo root, or script auto-locates root)

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

PASS=0
FAIL=0

pass() {
  PASS=$((PASS + 1))
  printf "  \xE2\x9C\x93 %s\n" "$1"
}

fail() {
  FAIL=$((FAIL + 1))
  printf "  \xE2\x9C\x97 %s\n" "$1"
}

echo ""
echo "Phase 3 — Content Management: Static Analysis"
echo "=============================================="
echo ""

# ── Check 1 (RECIPE-05): claude-api.js exists ─────────────────────────────
LABEL="claude-api.js exists"
FILE="$REPO_ROOT/app/js/claude-api.js"
if [ -f "$FILE" ]; then
  pass "$LABEL"
else
  fail "$LABEL  [expected: $FILE]"
fi

# ── Check 2 (RECIPE-05): anthropic-dangerous-direct-browser-access header ─
LABEL="anthropic-dangerous-direct-browser-access header present in claude-api.js"
if grep -qF "anthropic-dangerous-direct-browser-access" "$REPO_ROOT/app/js/claude-api.js" 2>/dev/null; then
  pass "$LABEL"
else
  fail "$LABEL"
fi

# ── Check 3 (RECIPE-05): handleGenerate defined in recipes.js ─────────────
LABEL="handleGenerate defined in recipes.js"
if grep -q "function handleGenerate" "$REPO_ROOT/app/js/views/recipes.js" 2>/dev/null; then
  pass "$LABEL"
else
  fail "$LABEL"
fi

# ── Check 4 (RECIPE-05): #sect-ai-key section present in settings.js ──────
LABEL="sect-ai-key section present in settings.js"
if grep -qF "sect-ai-key" "$REPO_ROOT/app/js/views/settings.js" 2>/dev/null; then
  pass "$LABEL"
else
  fail "$LABEL"
fi

# ── Check 5 (RECIPE-05): bb_anthropic_key stored in settings.js ───────────
LABEL="bb_anthropic_key stored in settings.js"
if grep -qF "bb_anthropic_key" "$REPO_ROOT/app/js/views/settings.js" 2>/dev/null; then
  pass "$LABEL"
else
  fail "$LABEL"
fi

# ── Check 6 (EXPORT-03, D-09): dragover event listener in export.js ───────
LABEL="dragover event listener in export.js"
if grep -q "addEventListener.*['\"]dragover['\"]" "$REPO_ROOT/app/js/export.js" 2>/dev/null; then
  pass "$LABEL"
else
  fail "$LABEL"
fi

# ── Check 7 (RECIPE-05): claude-api.js script tag in index.html ───────────
LABEL="claude-api.js script tag in index.html"
if grep -qF "claude-api.js" "$REPO_ROOT/app/index.html" 2>/dev/null; then
  pass "$LABEL"
else
  fail "$LABEL"
fi

# ── Check 8 (EXPORT-01): JSZip script tag in index.html ───────────────────
LABEL="JSZip script tag in index.html"
if grep -qi "jszip" "$REPO_ROOT/app/index.html" 2>/dev/null; then
  pass "$LABEL"
else
  fail "$LABEL"
fi

# ── Check 9: JS syntax valid (node --check on all 4 modified files) ────────
LABEL="JS syntax valid — all 4 Phase 3 modified files"
SYNTAX_FAIL=0
for f in \
  "app/js/claude-api.js" \
  "app/js/export.js" \
  "app/js/views/settings.js" \
  "app/js/views/recipes.js"
do
  if ! node --check "$REPO_ROOT/$f" 2>/dev/null; then
    printf "    syntax error in: %s\n" "$f"
    SYNTAX_FAIL=1
  fi
done
if [ "$SYNTAX_FAIL" -eq 0 ]; then
  pass "$LABEL"
else
  fail "$LABEL"
fi

# ── Summary ────────────────────────────────────────────────────────────────
echo ""
echo "----------------------------------------------"
echo "$PASS passed, $FAIL failed"
echo ""

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
