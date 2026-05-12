#!/usr/bin/env bash
# Phase 2 — Web UI UX & Settings — Static Analysis Checks
# Verifies behavioral requirements via grep assertions on implementation files.
# Each check prints PASS or FAIL clearly. Exits non-zero if any check fails.

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

# Count non-comment lines matching pattern in file
gc() {
  grep -v '^[[:space:]]*//' "$1" | grep -c "$2" || true
}

# Count ALL lines matching pattern in file (including comments, for HTML/attribute checks)
gca() {
  grep -c "$1" "$2" || true
}

echo "======================================================"
echo " Phase 2 — Web UI UX & Settings — Static Analysis"
echo " Repo root: $REPO_ROOT"
echo "======================================================"
echo ""

# ──────────────────────────────────────────────────────────
# ONB-02: Range sliders with pole labels AND Middle label
# Requirement: axis steps render range sliders with left/right pole labels
# and a "Middle" center label below the track.
# ──────────────────────────────────────────────────────────
echo "--- ONB-02: Axis sliders (range input, pole labels, Middle label) ---"

check "ONB-02-a" "axis-slider-group present in onboarding.js" \
  "$(gc app/js/views/onboarding.js 'axis-slider-group')" ge 1

check "ONB-02-b" "axis-pole-label--left present in onboarding.js" \
  "$(gc app/js/views/onboarding.js 'axis-pole-label--left')" ge 1

check "ONB-02-c" "axis-pole-label--right present in onboarding.js" \
  "$(gc app/js/views/onboarding.js 'axis-pole-label--right')" ge 1

check "ONB-02-d" "axis-slider-center-label (Middle) present in onboarding.js" \
  "$(gc app/js/views/onboarding.js 'axis-slider-center-label')" ge 1

check "ONB-02-e" "input type=range (slider element) present in onboarding.js" \
  "$(gc app/js/views/onboarding.js 'type="range"')" ge 1

echo ""

# ──────────────────────────────────────────────────────────
# ONB-03: Bartender steps at STEPS positions 2-4
# Requirement: STEPS array has bartender_name at position 2,
# bartender_voice at 3, bartender_specialty at 4.
# ──────────────────────────────────────────────────────────
echo "--- ONB-03: Bartender steps in STEPS array at positions 2-4 ---"

check "ONB-03-a" "bartender_name key present in onboarding.js" \
  "$(gc app/js/views/onboarding.js "'bartender_name'")" ge 1

check "ONB-03-b" "bartender_voice key present in onboarding.js" \
  "$(gc app/js/views/onboarding.js "'bartender_voice'")" ge 1

check "ONB-03-c" "bartender_specialty key present in onboarding.js" \
  "$(gc app/js/views/onboarding.js "'bartender_specialty'")" ge 1

# All three must appear together in the STEPS array in the correct order
STEPS_LINE=$(grep -c "'bartender_name', 'bartender_voice', 'bartender_specialty'" \
  app/js/views/onboarding.js || true)
check "ONB-03-d" "bartender_name/voice/specialty in correct order in STEPS" \
  "$STEPS_LINE" ge 1

check "ONB-03-e" "renderBartenderName function defined" \
  "$(gc app/js/views/onboarding.js 'function renderBartenderName')" ge 1

check "ONB-03-f" "renderBartenderVoice function defined" \
  "$(gc app/js/views/onboarding.js 'function renderBartenderVoice')" ge 1

check "ONB-03-g" "renderBartenderSpecialty function defined" \
  "$(gc app/js/views/onboarding.js 'function renderBartenderSpecialty')" ge 1

echo ""

# ──────────────────────────────────────────────────────────
# ONB-04: Inventory paste writes to inventory.unassigned + escapeHtml on items
# Requirement: comma-parse textarea → chip preview → saves to inventory.unassigned.
# Items must be XSS-escaped via Utils.escapeHtml.
# ──────────────────────────────────────────────────────────
echo "--- ONB-04: Inventory paste writes to inventory.unassigned + escapeHtml ---"

check "ONB-04-a" ".unassigned write target in onboarding.js (not inventory.spirits)" \
  "$(gc app/js/views/onboarding.js '\.unassigned')" ge 1

check "ONB-04-b" "Utils.escapeHtml applied to item in chip render" \
  "$(gc app/js/views/onboarding.js 'Utils\.escapeHtml.*item')" ge 1

check "ONB-04-c" "renderInventoryPaste defined and dispatched (need >= 2 occurrences)" \
  "$(gc app/js/views/onboarding.js 'renderInventoryPaste')" ge 2

# Anti-pattern: must NOT write to inventory.spirits
SPIRITS_WRITE=$(grep -v '^[[:space:]]*//' app/js/views/onboarding.js | \
  grep -c 'inventory\.spirits' || true)
check "ONB-04-d" "inventory.spirits NOT written in onboarding.js (writes to unassigned)" \
  "$SPIRITS_WRITE" eq 0

echo ""

# ──────────────────────────────────────────────────────────
# NAV-01: header-avatar img in index.html
# Requirement: <img id="header-avatar"> is present in the header
# so app.js can set its src when GitHub is configured.
# ──────────────────────────────────────────────────────────
echo "--- NAV-01: Header avatar img in index.html ---"

check "NAV-01-a" "id=header-avatar on img element in index.html" \
  "$(gca 'id="header-avatar"' app/index.html)" ge 1

check "NAV-01-b" "class=header-avatar on img element in index.html" \
  "$(gca 'class="header-avatar"' app/index.html)" ge 1

check "NAV-01-c" "header-avatar referenced in app.js updateNav (sets src)" \
  "$(gc app/js/app.js 'header-avatar')" ge 1

echo ""

# ──────────────────────────────────────────────────────────
# NAV-02: dash-hero in dashboard.js with onerror fallback
# Requirement: hero image div above greeting; collapses (display:none) on 404.
# ──────────────────────────────────────────────────────────
echo "--- NAV-02: Dashboard hero image with onerror fallback ---"

check "NAV-02-a" "dash-hero class in dashboard.js" \
  "$(gc app/js/views/dashboard.js 'dash-hero')" ge 1

check "NAV-02-b" "onerror handler sets display:none on heroEl in dashboard.js" \
  "$(gc app/js/views/dashboard.js 'onerror')" ge 1

check "NAV-02-c" "hero URL built from GitHubAPI.cfg() — not a hardcoded owner/repo" \
  "$(gc app/js/views/dashboard.js 'GitHubAPI\.cfg()')" ge 1

echo ""

# ──────────────────────────────────────────────────────────
# NAV-03: wizard-avatar-wrap and caption in onboarding.js welcome step
# Requirement: Bjorn avatar (barkeeper_bjorn_001.png) in welcome step
# with wizard-avatar-caption text below.
# ──────────────────────────────────────────────────────────
echo "--- NAV-03: Bjorn avatar + caption on onboarding welcome step ---"

check "NAV-03-a" "wizard-avatar-wrap div in onboarding.js" \
  "$(gc app/js/views/onboarding.js 'wizard-avatar-wrap')" ge 1

check "NAV-03-b" "wizard-avatar-caption in onboarding.js" \
  "$(gc app/js/views/onboarding.js 'wizard-avatar-caption')" ge 1

check "NAV-03-c" "barkeeper_bjorn_001.png image referenced in onboarding.js" \
  "$(gc app/js/views/onboarding.js 'barkeeper_bjorn_001')" ge 1

echo ""

# ──────────────────────────────────────────────────────────
# NAV-04: exactly 2 disabled cards with menu-item--disabled in dashboard.js
# Requirement: 7-item grid; 2 disabled cards with coming-soon badges;
# clicking a disabled card fires showToast.
# ──────────────────────────────────────────────────────────
echo "--- NAV-04: 7-item grid with exactly 2 disabled cards ---"

check "NAV-04-a" "menu-item--disabled present >= 2 times in dashboard.js" \
  "$(gc app/js/views/dashboard.js 'menu-item--disabled')" ge 2

check "NAV-04-b" "data-coming-soon attribute present >= 2 times in dashboard.js" \
  "$(gc app/js/views/dashboard.js 'data-coming-soon')" ge 2

check "NAV-04-c" "coming-soon-badge present >= 2 times in dashboard.js" \
  "$(gc app/js/views/dashboard.js 'coming-soon-badge')" ge 2

check "NAV-04-d" "showToast called for disabled card click in dashboard.js" \
  "$(gc app/js/views/dashboard.js 'showToast.*Unlock')" ge 1

echo ""

# ──────────────────────────────────────────────────────────
# NAV-05: nav-settings-link in index.html AND app.js updateNav uses isConfigured()
# Requirement: gear icon links to #settings post-config;
# Setup link hidden after config via isConfigured() toggle.
# ──────────────────────────────────────────────────────────
echo "--- NAV-05: nav-settings-link in index.html + isConfigured() gating in app.js ---"

check "NAV-05-a" "nav-settings-link id in index.html" \
  "$(gca 'nav-settings-link' app/index.html)" ge 1

check "NAV-05-b" "nav-setup-link id in index.html (existing setup link has id)" \
  "$(gca 'nav-setup-link' app/index.html)" ge 1

check "NAV-05-c" "nav-settings-link referenced in app.js updateNav" \
  "$(gc app/js/app.js 'nav-settings-link')" ge 1

check "NAV-05-d" "isConfigured() called in app.js for nav gating" \
  "$(gc app/js/app.js 'isConfigured')" ge 1

echo ""

# ──────────────────────────────────────────────────────────
# SETTINGS-01: State.patch + State.save on barkeeper in settings.js
# Requirement: bartender rename + voice change saves to barkeeper.json
# via State.patch() then State.save().
# ──────────────────────────────────────────────────────────
echo "--- SETTINGS-01: Bartender identity saves via State.patch + State.save ---"

check "SETTINGS-01-a" "State.patch called in settings.js (identity save)" \
  "$(grep -v '^[[:space:]]*//' app/js/views/settings.js | grep -c 'State\.patch' || true)" ge 1

check "SETTINGS-01-b" "State.save called in settings.js (barkeeper write)" \
  "$(grep -v '^[[:space:]]*//' app/js/views/settings.js | grep -c 'State\.save' || true)" ge 1

check "SETTINGS-01-c" "Bartender Identity section heading present in settings.js" \
  "$(gc app/js/views/settings.js 'Bartender Identity')" ge 1

echo ""

# ──────────────────────────────────────────────────────────
# SETTINGS-02: all 4 localStorage.setItem('bb_*') calls in settings.js
# Requirement: GitHub token, owner, repo, branch all written to localStorage.
# ──────────────────────────────────────────────────────────
echo "--- SETTINGS-02: All 4 bb_* localStorage.setItem calls present ---"

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
# SETTINGS-03: dynamic bb_* enumeration via startsWith('bb_') AND window.confirm = 0
# Requirement: logout clears ALL bb_* keys by dynamic enumeration;
# uses CSS dialog, NOT window.confirm().
# ──────────────────────────────────────────────────────────
echo "--- SETTINGS-03: Dynamic bb_* logout enumeration, no window.confirm ---"

check "SETTINGS-03-a" "startsWith('bb_') for dynamic key enumeration in settings.js" \
  "$(grep -v '^[[:space:]]*//' app/js/views/settings.js | grep -c "startsWith" || true)" ge 1

check "SETTINGS-03-b" "window.confirm() ABSENT from settings.js (must be 0)" \
  "$(gc app/js/views/settings.js 'window\.confirm')" eq 0

check "SETTINGS-03-c" "confirm-dialog-overlay CSS dialog used instead of window.confirm" \
  "$(gc app/js/views/settings.js 'confirm-dialog-overlay')" ge 1

echo ""

# ──────────────────────────────────────────────────────────
# SETTINGS-04: 4+ sequential await State.save AND st-reset-state-2 two-click reveal
# Requirement: reset executes 4 sequential awaited State.save() calls;
# two-click pattern (state-1 hidden, state-2 shown on first click).
# ──────────────────────────────────────────────────────────
echo "--- SETTINGS-04: 4 sequential await State.save + two-click reset reveal ---"

check "SETTINGS-04-a" "at least 5 'await State.save' calls in settings.js (4 reset + 1 identity)" \
  "$(gc app/js/views/settings.js 'await State\.save')" ge 5

check "SETTINGS-04-b" "st-reset-state-1 (initial reveal state) present in settings.js" \
  "$(gc app/js/views/settings.js 'st-reset-state-1')" ge 1

check "SETTINGS-04-c" "st-reset-state-2 (two-click confirm state) present in settings.js" \
  "$(gc app/js/views/settings.js 'st-reset-state-2')" ge 1

check "SETTINGS-04-d" "st-reset-confirm destructive confirm button present in settings.js" \
  "$(gc app/js/views/settings.js 'st-reset-confirm')" ge 1

echo ""

# ──────────────────────────────────────────────────────────
# INV-01: inv-search-bar + scoped #tab-content query in inventory.js
# Requirement: real-time filter scoped to #tab-content;
# MUST NOT use document.querySelectorAll('.bottle-chip') (unscoped = bug).
# ──────────────────────────────────────────────────────────
echo "--- INV-01: Search bar scoped to #tab-content (no unscoped querySelectorAll) ---"

check "INV-01-a" "inv-search-bar present in inventory.js" \
  "$(gc app/js/views/inventory.js 'inv-search-bar')" ge 1

check "INV-01-b" "inv-search-input present in inventory.js" \
  "$(gc app/js/views/inventory.js 'inv-search-input')" ge 1

check "INV-01-c" "document.querySelector('#tab-content') scoped query present" \
  "$(gc app/js/views/inventory.js "'#tab-content'")" ge 1

# Critical anti-pattern: unscoped document.querySelectorAll('.bottle-chip') must NOT exist
UNSCOPED=$(grep -v '^[[:space:]]*//' app/js/views/inventory.js | \
  grep -c "document\.querySelectorAll.*bottle-chip" || true)
check "INV-01-d" "document.querySelectorAll('.bottle-chip') unscoped query ABSENT (must be 0)" \
  "$UNSCOPED" eq 0

check "INV-01-e" "Search inventory placeholder text present (copywriting contract)" \
  "$(gc app/js/views/inventory.js 'Search inventory')" ge 1

echo ""

# ──────────────────────────────────────────────────────────
# INV-02: scrollIntoView in inventory.js
# Requirement: category dropdown change smooth-scrolls to matching
# .inventory-section[data-sectionKey] element.
# ──────────────────────────────────────────────────────────
echo "--- INV-02: Category select smooth-scrolls to inventory section ---"

check "INV-02-a" "scrollIntoView present in inventory.js" \
  "$(gc app/js/views/inventory.js 'scrollIntoView')" ge 1

check "INV-02-b" "behavior: 'smooth' in scrollIntoView call" \
  "$(gc app/js/views/inventory.js "behavior.*'smooth'")" ge 1

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
