#!/usr/bin/env bash
# Phase 2 — Static Analysis Checks
# Verifies implementation requirements via grep-based assertions.
# Each check prints PASS or FAIL. Exits non-zero if any check fails.

set -euo pipefail

# Always run from repo root so relative paths work
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

PASS=0
FAIL=0

pass() { echo "PASS  $1"; PASS=$((PASS + 1)); }
fail() { echo "FAIL  $1"; FAIL=$((FAIL + 1)); }

check() {
  local id="$1"
  local desc="$2"
  local actual="$3"
  local op="$4"
  local expected="$5"

  case "$op" in
    ge)
      if [ "$actual" -ge "$expected" ] 2>/dev/null; then
        pass "[$id] $desc (got $actual, need >= $expected)"
      else
        fail "[$id] $desc (got $actual, need >= $expected)"
      fi
      ;;
    eq)
      if [ "$actual" -eq "$expected" ] 2>/dev/null; then
        pass "[$id] $desc (got $actual, need = $expected)"
      else
        fail "[$id] $desc (got $actual, need = $expected)"
      fi
      ;;
    gt)
      if [ "$actual" -gt "$expected" ] 2>/dev/null; then
        pass "[$id] $desc (got $actual, need > $expected)"
      else
        fail "[$id] $desc (got $actual, need > $expected)"
      fi
      ;;
  esac
}

# Helper: count non-comment lines matching pattern
gc() {
  grep -v '^[[:space:]]*//' "$1" | grep -c "$2" || true
}

# Helper: count all lines matching pattern (including commented lines when we want that)
gca() {
  grep -c "$1" "$2" || true
}

echo "======================================================"
echo " Phase 2 — Static Analysis Checks"
echo " Repo root: $REPO_ROOT"
echo "======================================================"
echo ""

# ──────────────────────────────────────────────────────────
# ONB-02: Range sliders with pole labels AND Middle label
# ──────────────────────────────────────────────────────────
echo "--- ONB-02: Axis sliders (range input, pole labels, Middle label) ---"

check "ONB-02-a" "axis-slider-group present in onboarding.js" \
  "$(gc app/js/views/onboarding.js 'axis-slider-group')" ge 1

check "ONB-02-b" "axis-pole-label--left present in onboarding.js" \
  "$(gc app/js/views/onboarding.js 'axis-pole-label--left')" ge 1

check "ONB-02-c" "axis-pole-label--right present in onboarding.js" \
  "$(gc app/js/views/onboarding.js 'axis-pole-label--right')" ge 1

check "ONB-02-d" "Middle center label present in onboarding.js" \
  "$(gc app/js/views/onboarding.js 'axis-slider-center-label')" ge 1

check "ONB-02-e" "input type=range present in onboarding.js" \
  "$(gc app/js/views/onboarding.js 'type=\"range\"')" ge 1

echo ""

# ──────────────────────────────────────────────────────────
# ONB-03: Bartender steps at STEPS positions 2-4
# ──────────────────────────────────────────────────────────
echo "--- ONB-03: Bartender steps in STEPS array ---"

check "ONB-03-a" "bartender_name in STEPS array" \
  "$(gc app/js/views/onboarding.js "'bartender_name'")" ge 1

check "ONB-03-b" "bartender_voice in STEPS array" \
  "$(gc app/js/views/onboarding.js "'bartender_voice'")" ge 1

check "ONB-03-c" "bartender_specialty in STEPS array" \
  "$(gc app/js/views/onboarding.js "'bartender_specialty'")" ge 1

# Verify the three bartender steps appear on the same STEPS line (positions 2-4)
STEPS_LINE=$(grep -n "'bartender_name', 'bartender_voice', 'bartender_specialty'" app/js/views/onboarding.js | wc -l || true)
check "ONB-03-d" "bartender_name/voice/specialty on single STEPS line (correct order)" \
  "$STEPS_LINE" ge 1

check "ONB-03-e" "renderBartenderName function defined" \
  "$(gc app/js/views/onboarding.js 'function renderBartenderName')" ge 1

check "ONB-03-f" "renderBartenderVoice function defined" \
  "$(gc app/js/views/onboarding.js 'function renderBartenderVoice')" ge 1

check "ONB-03-g" "renderBartenderSpecialty function defined" \
  "$(gc app/js/views/onboarding.js 'function renderBartenderSpecialty')" ge 1

echo ""

# ──────────────────────────────────────────────────────────
# ONB-04: Inventory paste writes to inventory.unassigned, escapeHtml on items
# ──────────────────────────────────────────────────────────
echo "--- ONB-04: Inventory paste (inventory.unassigned + escapeHtml) ---"

check "ONB-04-a" "unassigned property written in onboarding.js (inv.unassigned or inventory.unassigned)" \
  "$(gc app/js/views/onboarding.js '\.unassigned')" ge 1

check "ONB-04-b" "escapeHtml applied to items in chip render" \
  "$(gc app/js/views/onboarding.js 'Utils\.escapeHtml.*item')" ge 1

check "ONB-04-c" "renderInventoryPaste function exists (dispatch)" \
  "$(gc app/js/views/onboarding.js 'renderInventoryPaste')" ge 2

# Verify NOT writing to inventory.spirits (wrong target)
SPIRITS_WRITE=$(grep -v '^[[:space:]]*//' app/js/views/onboarding.js | grep -c 'inventory\.spirits' || true)
check "ONB-04-d" "inventory.spirits NOT used in onboarding.js (writes to unassigned instead)" \
  "$SPIRITS_WRITE" eq 0

echo ""

# ──────────────────────────────────────────────────────────
# NAV-01: header-avatar img in index.html
# ──────────────────────────────────────────────────────────
echo "--- NAV-01: Header avatar img ---"

check "NAV-01-a" "header-avatar id in index.html" \
  "$(gca 'id=\"header-avatar\"' app/index.html)" ge 1

check "NAV-01-b" "header-avatar class in index.html" \
  "$(gca 'class=\"header-avatar\"' app/index.html)" ge 1

check "NAV-01-c" "header-avatar referenced in app.js (updateNav sets src)" \
  "$(gc app/js/app.js 'header-avatar')" ge 1

echo ""

# ──────────────────────────────────────────────────────────
# NAV-02: dash-hero in dashboard.js with onerror fallback
# ──────────────────────────────────────────────────────────
echo "--- NAV-02: Dashboard hero image ---"

check "NAV-02-a" "dash-hero class in dashboard.js" \
  "$(gc app/js/views/dashboard.js 'dash-hero')" ge 1

check "NAV-02-b" "onerror fallback hides heroEl on 404" \
  "$(gc app/js/views/dashboard.js 'onerror.*display.*none\|heroEl\.style\.display.*none')" ge 1

check "NAV-02-c" "hero URL built from GitHubAPI.cfg() (not hardcoded)" \
  "$(gc app/js/views/dashboard.js 'GitHubAPI\.cfg()')" ge 1

echo ""

# ──────────────────────────────────────────────────────────
# NAV-03: wizard-avatar-wrap and caption in onboarding.js welcome step
# ──────────────────────────────────────────────────────────
echo "--- NAV-03: Bjorn avatar on onboarding welcome step ---"

check "NAV-03-a" "wizard-avatar-wrap in onboarding.js" \
  "$(gc app/js/views/onboarding.js 'wizard-avatar-wrap')" ge 1

check "NAV-03-b" "wizard-avatar-caption in onboarding.js" \
  "$(gc app/js/views/onboarding.js 'wizard-avatar-caption')" ge 1

check "NAV-03-c" "barkeeper_bjorn_001.png referenced in onboarding.js" \
  "$(gc app/js/views/onboarding.js 'barkeeper_bjorn_001')" ge 1

echo ""

# ──────────────────────────────────────────────────────────
# NAV-04: exactly 2 disabled cards with menu-item--disabled in dashboard.js
# ──────────────────────────────────────────────────────────
echo "--- NAV-04: 7-item grid with 2 disabled cards ---"

DISABLED_COUNT=$(gc app/js/views/dashboard.js 'menu-item--disabled')
check "NAV-04-a" "menu-item--disabled appears >= 2 times in dashboard.js" \
  "$DISABLED_COUNT" ge 2

check "NAV-04-b" "data-coming-soon attribute present >= 2 times in dashboard.js" \
  "$(gc app/js/views/dashboard.js 'data-coming-soon')" ge 2

check "NAV-04-c" "coming-soon-badge present >= 2 times in dashboard.js" \
  "$(gc app/js/views/dashboard.js 'coming-soon-badge')" ge 2

check "NAV-04-d" "showToast called for disabled card click" \
  "$(gc app/js/views/dashboard.js 'showToast.*Unlock')" ge 1

echo ""

# ──────────────────────────────────────────────────────────
# NAV-05: nav-settings-link in index.html AND app.js updateNav uses isConfigured()
# ──────────────────────────────────────────────────────────
echo "--- NAV-05: Settings nav link + isConfigured() gating ---"

check "NAV-05-a" "nav-settings-link id in index.html" \
  "$(gca 'nav-settings-link' app/index.html)" ge 1

check "NAV-05-b" "nav-setup-link id in index.html" \
  "$(gca 'nav-setup-link' app/index.html)" ge 1

check "NAV-05-c" "nav-settings-link referenced in app.js" \
  "$(gc app/js/app.js 'nav-settings-link')" ge 1

check "NAV-05-d" "isConfigured() called in app.js updateNav" \
  "$(gc app/js/app.js 'isConfigured')" ge 1

echo ""

# ──────────────────────────────────────────────────────────
# SETTINGS-01: State.patch + State.save on barkeeper in settings.js
# ──────────────────────────────────────────────────────────
echo "--- SETTINGS-01: Bartender identity save via State.patch + State.save ---"

check "SETTINGS-01-a" "State.patch('barkeeper') in settings.js" \
  "$(grep -v '^[[:space:]]*//' app/js/views/settings.js | grep -c "State\.patch" || true)" ge 1

check "SETTINGS-01-b" "State.save('barkeeper') in settings.js" \
  "$(grep -v '^[[:space:]]*//' app/js/views/settings.js | grep -c "State\.save" || true)" ge 1

check "SETTINGS-01-c" "Bartender Identity section heading present" \
  "$(gc app/js/views/settings.js 'Bartender Identity')" ge 1

echo ""

# ──────────────────────────────────────────────────────────
# SETTINGS-02: all 4 localStorage.setItem('bb_*') calls in settings.js
# ──────────────────────────────────────────────────────────
echo "--- SETTINGS-02: GitHub fields save to localStorage ---"

check "SETTINGS-02-a" "localStorage.setItem('bb_token') in settings.js" \
  "$(grep -v '^[[:space:]]*//' app/js/views/settings.js | grep -c "bb_token" || true)" ge 1

check "SETTINGS-02-b" "localStorage.setItem('bb_owner') in settings.js" \
  "$(grep -v '^[[:space:]]*//' app/js/views/settings.js | grep -c "bb_owner" || true)" ge 1

check "SETTINGS-02-c" "localStorage.setItem('bb_repo') in settings.js" \
  "$(grep -v '^[[:space:]]*//' app/js/views/settings.js | grep -c "bb_repo" || true)" ge 1

check "SETTINGS-02-d" "localStorage.setItem('bb_branch') in settings.js" \
  "$(grep -v '^[[:space:]]*//' app/js/views/settings.js | grep -c "bb_branch" || true)" ge 1

echo ""

# ──────────────────────────────────────────────────────────
# SETTINGS-03: dynamic bb_* enumeration via startsWith('bb_') AND window.confirm count = 0
# ──────────────────────────────────────────────────────────
echo "--- SETTINGS-03: Logout clears ALL bb_* keys dynamically (no window.confirm) ---"

check "SETTINGS-03-a" "startsWith('bb_') in settings.js for dynamic key enumeration" \
  "$(grep -v '^[[:space:]]*//' app/js/views/settings.js | grep -c "startsWith" || true)" ge 1

check "SETTINGS-03-b" "window.confirm NOT used in settings.js (must be 0)" \
  "$(gc app/js/views/settings.js 'window\.confirm')" eq 0

check "SETTINGS-03-c" "confirm-dialog-overlay CSS class used (not window.confirm)" \
  "$(gc app/js/views/settings.js 'confirm-dialog-overlay')" ge 1

echo ""

# ──────────────────────────────────────────────────────────
# SETTINGS-04: 4+ sequential await State.save calls AND st-reset-state-2 two-click reveal
# ──────────────────────────────────────────────────────────
echo "--- SETTINGS-04: Sequential await State.save x4 + two-click reset reveal ---"

check "SETTINGS-04-a" "at least 4 'await State.save' calls in settings.js (4 reset + identity save)" \
  "$(gc app/js/views/settings.js 'await State\.save')" ge 4

check "SETTINGS-04-b" "st-reset-state-1 (first-click state) present in settings.js" \
  "$(gc app/js/views/settings.js 'st-reset-state-1')" ge 1

check "SETTINGS-04-c" "st-reset-state-2 (two-click reveal state) present in settings.js" \
  "$(gc app/js/views/settings.js 'st-reset-state-2')" ge 1

check "SETTINGS-04-d" "st-reset-confirm (destructive confirm button) present in settings.js" \
  "$(gc app/js/views/settings.js 'st-reset-confirm')" ge 1

echo ""

# ──────────────────────────────────────────────────────────
# INV-01: inv-search-bar + scoped #tab-content query (NOT document.querySelectorAll)
# ──────────────────────────────────────────────────────────
echo "--- INV-01: Search bar scoped to #tab-content (no unscoped querySelectorAll) ---"

check "INV-01-a" "inv-search-bar present in inventory.js" \
  "$(gc app/js/views/inventory.js 'inv-search-bar')" ge 1

check "INV-01-b" "inv-search-input present in inventory.js" \
  "$(gc app/js/views/inventory.js 'inv-search-input')" ge 1

check "INV-01-c" "#tab-content scoped query present in inventory.js" \
  "$(gc app/js/views/inventory.js "'#tab-content'")" ge 1

UNSCOPED=$(grep -v '^[[:space:]]*//' app/js/views/inventory.js | grep -c "document\.querySelectorAll.*\.bottle-chip\|document\.querySelectorAll.*'\.bottle-chip'" || true)
check "INV-01-d" "document.querySelectorAll('.bottle-chip') unscoped query ABSENT (must be 0)" \
  "$UNSCOPED" eq 0

check "INV-01-e" "Search inventory placeholder text present" \
  "$(gc app/js/views/inventory.js 'Search inventory')" ge 1

echo ""

# ──────────────────────────────────────────────────────────
# INV-02: scrollIntoView in inventory.js
# ──────────────────────────────────────────────────────────
echo "--- INV-02: Category select smooth-scrolls to section ---"

check "INV-02-a" "scrollIntoView present in inventory.js" \
  "$(gc app/js/views/inventory.js 'scrollIntoView')" ge 1

check "INV-02-b" "behavior: 'smooth' passed to scrollIntoView" \
  "$(gc app/js/views/inventory.js "behavior.*'smooth'\|'smooth'.*behavior")" ge 1

check "INV-02-c" "inv-category-select present in inventory.js" \
  "$(gc app/js/views/inventory.js 'inv-category-select')" ge 1

echo ""

# ──────────────────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────────────────
echo "======================================================"
echo " Results: $PASS passed, $FAIL failed"
echo "======================================================"

if [ "$FAIL" -gt 0 ]; then
  exit 1
else
  exit 0
fi
