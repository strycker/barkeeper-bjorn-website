#!/usr/bin/env bash
# Phase 1 — Agent Instructions Polish — Static Analysis Checks
# Verifies behavioral requirements via grep assertions on markdown agent files.
# Each check prints PASS or FAIL clearly. Exits non-zero if any check fails.

set -euo pipefail

# Always run from repo root so relative paths work
REPO_ROOT="$(git rev-parse --show-toplevel)"
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

# Count lines matching fixed string in file
gcf() {
  grep -cF "$1" "$2" || true
}

echo "======================================================"
echo " Phase 1 — Agent Instructions Polish — Static Analysis"
echo " Repo root: $REPO_ROOT"
echo "======================================================"
echo ""

# ──────────────────────────────────────────────────────────
# AGENT-01: One-question rule — WRONG/RIGHT blocks + numbered-list ban
# Requirement: All 3 files contain WRONG/RIGHT negative example and explicit
# numbered-list ban. barkeeper-instructions.md and communication.md
# explicitly name "recipe design, analytics mode".
# ──────────────────────────────────────────────────────────
echo "--- AGENT-01: One-question rule (WRONG/RIGHT blocks + numbered-list ban) ---"

# WRONG block in all 3 files
check "AGENT-01-a" "WRONG block present in barkeeper-instructions.md" \
  "$(gcf 'WRONG' barkeeper-instructions.md)" ge 1

check "AGENT-01-b" "WRONG block present in instructions/communication.md" \
  "$(gcf 'WRONG' instructions/communication.md)" ge 1

check "AGENT-01-c" "WRONG block present in instructions/onboarding.md" \
  "$(gcf 'WRONG' instructions/onboarding.md)" ge 1

# RIGHT block in all 3 files
check "AGENT-01-d" "RIGHT block present in barkeeper-instructions.md" \
  "$(gcf 'RIGHT' barkeeper-instructions.md)" ge 1

check "AGENT-01-e" "RIGHT block present in instructions/communication.md" \
  "$(gcf 'RIGHT' instructions/communication.md)" ge 1

check "AGENT-01-f" "RIGHT block present in instructions/onboarding.md" \
  "$(gcf 'RIGHT' instructions/onboarding.md)" ge 1

# Numbered-list ban in all 3 files
check "AGENT-01-g" "No numbered question lists ban present in barkeeper-instructions.md" \
  "$(gcf 'No numbered question lists.' barkeeper-instructions.md)" ge 1

check "AGENT-01-h" "No numbered question lists ban present in instructions/communication.md" \
  "$(gcf 'No numbered question lists.' instructions/communication.md)" ge 1

check "AGENT-01-i" "No numbered question lists ban present in instructions/onboarding.md" \
  "$(gcf 'No numbered question lists.' instructions/onboarding.md)" ge 1

# "recipe design, analytics mode" enumeration in barkeeper-instructions.md and communication.md
check "AGENT-01-j" "recipe design, analytics mode named in barkeeper-instructions.md" \
  "$(gcf 'recipe design, analytics mode' barkeeper-instructions.md)" ge 1

check "AGENT-01-k" "recipe design, analytics mode named in instructions/communication.md" \
  "$(gcf 'recipe design, analytics mode' instructions/communication.md)" ge 1

echo ""

# ──────────────────────────────────────────────────────────
# AGENT-02: Session-start menu — always-show-menu rule + Exception(named tasks only)
# Requirement: "Always show the menu first" in barkeeper-instructions.md and
# instructions/onboarding.md. "Exception (named tasks only)" in both.
# Old permissive "honor it directly — the menu is a convenience, not a gate"
# wording for vague openers is ABSENT.
# ──────────────────────────────────────────────────────────
echo "--- AGENT-02: Session-start menu (always-show-menu rule + Exception narrowing) ---"

check "AGENT-02-a" "Always show the menu first in barkeeper-instructions.md" \
  "$(gcf 'Always show the menu first for returning users' barkeeper-instructions.md)" ge 1

check "AGENT-02-b" "Always show the menu first in instructions/onboarding.md" \
  "$(gcf 'Always show the menu first for returning users' instructions/onboarding.md)" ge 1

check "AGENT-02-c" "Exception (named tasks only) in barkeeper-instructions.md" \
  "$(gcf 'Exception (named tasks only):' barkeeper-instructions.md)" ge 1

check "AGENT-02-d" "Exception (named tasks only) in instructions/onboarding.md" \
  "$(gcf 'Exception (named tasks only):' instructions/onboarding.md)" ge 1

# Old permissive wording must be ABSENT (the vague-opener override)
OLD_PERM_BI=$(gcf 'If the user skips the menu and just says something ("make me something smoky"), honor it directly — the menu is a convenience, not a gate.' barkeeper-instructions.md)
check "AGENT-02-e" "Old permissive honor-it-directly wording ABSENT in barkeeper-instructions.md (must be 0)" \
  "$OLD_PERM_BI" eq 0

OLD_PERM_OB=$(gcf 'If the user skips the menu and just says something ("make me something smoky"), honor it directly — the menu is a convenience, not a gate.' instructions/onboarding.md)
check "AGENT-02-f" "Old permissive honor-it-directly wording ABSENT in instructions/onboarding.md (must be 0)" \
  "$OLD_PERM_OB" eq 0

echo ""

# ──────────────────────────────────────────────────────────
# AGENT-03: Auto 3 image-prompt variants — auto-generate, 1920s Vintage/retro,
# flavor axes excluded
# Requirement: "automatically generate three image-prompt variants" present;
# "1920s" present; "Do not include the user's flavor axes" present;
# "offer to suggest" ABSENT.
# ──────────────────────────────────────────────────────────
echo "--- AGENT-03: Auto 3 image-prompt variants (auto-generate, 1920s, no flavor axes) ---"

check "AGENT-03-a" "automatically generate three image-prompt variants in barkeeper-instructions.md" \
  "$(gcf 'automatically generate three image-prompt variants' barkeeper-instructions.md)" ge 1

check "AGENT-03-b" "1920s vintage/retro variant C present in barkeeper-instructions.md" \
  "$(gcf '1920s' barkeeper-instructions.md)" ge 1

check "AGENT-03-c" "flavor axes excluded: Do not include the users flavor axes in barkeeper-instructions.md" \
  "$(gcf "Do **not** include the user's flavor axes" barkeeper-instructions.md)" ge 1

# "offer to suggest" must be ABSENT (replaced by auto-generate)
OFFER_TO_SUGGEST=$(gcf 'offer to suggest image generation prompts' barkeeper-instructions.md)
check "AGENT-03-d" "offer to suggest image generation prompts ABSENT in barkeeper-instructions.md (must be 0)" \
  "$OFFER_TO_SUGGEST" eq 0

echo ""

# ──────────────────────────────────────────────────────────
# AGENT-04: <img> template sync — width="400" + [cocktailN]-image.png at all 3
# sync points; old width="200" and _short_name_001.png ABSENT everywhere.
# ──────────────────────────────────────────────────────────
echo "--- AGENT-04: <img> template sync (width=400, [cocktailN]-image.png, old patterns absent) ---"

check "AGENT-04-a" 'width="400" in barkeeper-instructions.md' \
  "$(gcf 'width="400"' barkeeper-instructions.md)" ge 1

check "AGENT-04-b" 'width="400" in recipes.md' \
  "$(gcf 'width="400"' recipes.md)" ge 1

check "AGENT-04-c" 'width="400" in instructions/communication.md' \
  "$(gcf 'width="400"' instructions/communication.md)" ge 1

check "AGENT-04-d" '[cocktailN]-image.png in barkeeper-instructions.md' \
  "$(gcf '[cocktailN]-image.png' barkeeper-instructions.md)" ge 1

check "AGENT-04-e" '[cocktailN]-image.png in recipes.md' \
  "$(gcf '[cocktailN]-image.png' recipes.md)" ge 1

# Old width="200" ABSENT in all 3 sync points (check each independently)
OLD_WIDTH_BI=$(gcf 'width="200"' barkeeper-instructions.md)
check "AGENT-04-f" 'old width="200" ABSENT in barkeeper-instructions.md (must be 0)' \
  "$OLD_WIDTH_BI" eq 0

OLD_WIDTH_RM=$(gcf 'width="200"' recipes.md)
check "AGENT-04-g" 'old width="200" ABSENT in recipes.md (must be 0)' \
  "$OLD_WIDTH_RM" eq 0

OLD_WIDTH_CM=$(gcf 'width="200"' instructions/communication.md)
check "AGENT-04-h" 'old width="200" ABSENT in instructions/communication.md (must be 0)' \
  "$OLD_WIDTH_CM" eq 0

# Old _short_name_001.png ABSENT in all 3 sync points
OLD_FNAME_BI=$(gcf '_short_name_001.png' barkeeper-instructions.md)
check "AGENT-04-i" 'old _short_name_001.png ABSENT in barkeeper-instructions.md (must be 0)' \
  "$OLD_FNAME_BI" eq 0

OLD_FNAME_RM=$(gcf '_short_name_001.png' recipes.md)
check "AGENT-04-j" 'old _short_name_001.png ABSENT in recipes.md (must be 0)' \
  "$OLD_FNAME_RM" eq 0

echo ""

# ──────────────────────────────────────────────────────────
# AGENT-05: INSTALL.md paste-ready Standard init blocks for ChatGPT, Gemini, Grok
# Requirement: "Read all your knowledge files" >= 3 times (one per platform);
# "Conversation starters" present (ChatGPT); "opening message" present (Gemini);
# "system prompt" present (Grok).
# ──────────────────────────────────────────────────────────
echo "--- AGENT-05: INSTALL.md paste-ready Standard init blocks (ChatGPT, Gemini, Grok) ---"

check "AGENT-05-a" "Read all your knowledge files appears >= 3 times in INSTALL.md" \
  "$(gcf 'Read all your knowledge files' INSTALL.md)" ge 3

check "AGENT-05-b" "Conversation starters field name present in INSTALL.md (ChatGPT)" \
  "$(gcf 'Conversation starters' INSTALL.md)" ge 1

check "AGENT-05-c" "opening message field name present in INSTALL.md (Gemini)" \
  "$(gcf 'opening message' INSTALL.md)" ge 1

check "AGENT-05-d" "system prompt field name present in INSTALL.md (Grok)" \
  "$(gcf 'system prompt' INSTALL.md)" ge 1

echo ""

# ──────────────────────────────────────────────────────────
# AGENT-06: Bartender Personalization step 2 — transition prompt, 5 voice presets,
# 5 specialty focus options, D-13 field order (name → voice → specialty)
# Requirement: "Bartender Personalization" in both files; verbatim transition
# quote "Before we go further" in both; all 5 voice preset names in both;
# all 5 specialty options in both; field order name → voice → specialty in F2.
# ──────────────────────────────────────────────────────────
echo "--- AGENT-06: Bartender Personalization step 2 (transition, voice presets, specialty) ---"

check "AGENT-06-a" "Bartender Personalization heading in barkeeper-instructions.md" \
  "$(gcf 'Bartender Personalization' barkeeper-instructions.md)" ge 1

check "AGENT-06-b" "Bartender Personalization heading in instructions/onboarding.md" \
  "$(gcf 'Bartender Personalization' instructions/onboarding.md)" ge 1

check "AGENT-06-c" "Transition quote Before we go further in barkeeper-instructions.md" \
  "$(gcf "Before we go further — I'm Barkeeper Bjorn by default" barkeeper-instructions.md)" ge 1

check "AGENT-06-d" "Transition quote Before we go further in instructions/onboarding.md" \
  "$(gcf "Before we go further — I'm Barkeeper Bjorn by default" instructions/onboarding.md)" ge 1

# 5 voice preset names in both files
check "AGENT-06-e" "Voice preset: Professional & measured in barkeeper-instructions.md" \
  "$(gcf 'Professional & measured' barkeeper-instructions.md)" ge 1

check "AGENT-06-f" "Voice preset: Warm & playful in barkeeper-instructions.md" \
  "$(gcf 'Warm & playful' barkeeper-instructions.md)" ge 1

check "AGENT-06-g" "Voice preset: Terse & opinionated in barkeeper-instructions.md" \
  "$(gcf 'Terse & opinionated' barkeeper-instructions.md)" ge 1

check "AGENT-06-h" "Voice preset: Theatrical & verbose in barkeeper-instructions.md" \
  "$(gcf 'Theatrical & verbose' barkeeper-instructions.md)" ge 1

check "AGENT-06-i" "Voice preset: Nerdy / analytical in barkeeper-instructions.md" \
  "$(gcf 'Nerdy / analytical' barkeeper-instructions.md)" ge 1

check "AGENT-06-j" "Voice preset: Professional & measured in instructions/onboarding.md" \
  "$(gcf 'Professional & measured' instructions/onboarding.md)" ge 1

check "AGENT-06-k" "Voice preset: Warm & playful in instructions/onboarding.md" \
  "$(gcf 'Warm & playful' instructions/onboarding.md)" ge 1

check "AGENT-06-l" "Voice preset: Terse & opinionated in instructions/onboarding.md" \
  "$(gcf 'Terse & opinionated' instructions/onboarding.md)" ge 1

check "AGENT-06-m" "Voice preset: Theatrical & verbose in instructions/onboarding.md" \
  "$(gcf 'Theatrical & verbose' instructions/onboarding.md)" ge 1

check "AGENT-06-n" "Voice preset: Nerdy / analytical in instructions/onboarding.md" \
  "$(gcf 'Nerdy / analytical' instructions/onboarding.md)" ge 1

# 5 specialty focus options in both files
check "AGENT-06-o" "Specialty: Classics (pre-Prohibition and golden-era cocktails) in barkeeper-instructions.md" \
  "$(gcf 'Classics (pre-Prohibition and golden-era cocktails)' barkeeper-instructions.md)" ge 1

check "AGENT-06-p" "Specialty: Modern / contemporary in barkeeper-instructions.md" \
  "$(gcf 'Modern / contemporary' barkeeper-instructions.md)" ge 1

check "AGENT-06-q" "Specialty: Tiki / tropical in barkeeper-instructions.md" \
  "$(gcf 'Tiki / tropical' barkeeper-instructions.md)" ge 1

check "AGENT-06-r" "Specialty: NA-forward (non-alcoholic and low-ABV) in barkeeper-instructions.md" \
  "$(gcf 'NA-forward (non-alcoholic and low-ABV)' barkeeper-instructions.md)" ge 1

check "AGENT-06-s" "Specialty: No preference (broad and balanced) in barkeeper-instructions.md" \
  "$(gcf 'No preference (broad and balanced)' barkeeper-instructions.md)" ge 1

check "AGENT-06-t" "Specialty: Classics (pre-Prohibition and golden-era cocktails) in instructions/onboarding.md" \
  "$(gcf 'Classics (pre-Prohibition and golden-era cocktails)' instructions/onboarding.md)" ge 1

check "AGENT-06-u" "Specialty: Modern / contemporary in instructions/onboarding.md" \
  "$(gcf 'Modern / contemporary' instructions/onboarding.md)" ge 1

check "AGENT-06-v" "Specialty: Tiki / tropical in instructions/onboarding.md" \
  "$(gcf 'Tiki / tropical' instructions/onboarding.md)" ge 1

check "AGENT-06-w" "Specialty: NA-forward (non-alcoholic and low-ABV) in instructions/onboarding.md" \
  "$(gcf 'NA-forward (non-alcoholic and low-ABV)' instructions/onboarding.md)" ge 1

check "AGENT-06-x" "Specialty: No preference (broad and balanced) in instructions/onboarding.md" \
  "$(gcf 'No preference (broad and balanced)' instructions/onboarding.md)" ge 1

# D-13 field order: within Phase F2, Bartender name precedes Voice preset, which precedes Specialty focus
# Extract Phase F2 block and verify line ordering
F2_BLOCK=$(awk '/^### Phase F2 — Bartender Personalization/,/^### Phase F3 — /' barkeeper-instructions.md)
NAME_LINE=$(echo "$F2_BLOCK" | grep -n 'Bartender name' | head -1 | cut -d: -f1)
VOICE_LINE=$(echo "$F2_BLOCK" | grep -n 'Voice preset' | head -1 | cut -d: -f1)
SPEC_LINE=$(echo "$F2_BLOCK" | grep -n 'Specialty focus' | head -1 | cut -d: -f1)

NAME_LINE="${NAME_LINE:-0}"
VOICE_LINE="${VOICE_LINE:-0}"
SPEC_LINE="${SPEC_LINE:-0}"

check "AGENT-06-y" "D-13: Bartender name field found in Phase F2 block (line > 0)" \
  "$NAME_LINE" gt 0

check "AGENT-06-z" "D-13: Voice preset field found in Phase F2 block (line > 0)" \
  "$VOICE_LINE" gt 0

# Verify ordering: name_line < voice_line < spec_line
if [ "$NAME_LINE" -gt 0 ] && [ "$VOICE_LINE" -gt 0 ] && [ "$SPEC_LINE" -gt 0 ] && \
   [ "$NAME_LINE" -lt "$VOICE_LINE" ] && [ "$VOICE_LINE" -lt "$SPEC_LINE" ]; then
  pass "[AGENT-06-za] D-13 field order strictly name($NAME_LINE) < voice($VOICE_LINE) < specialty($SPEC_LINE)"
  PASS=$((PASS + 1))
else
  fail "[AGENT-06-za] D-13 field order WRONG: name=$NAME_LINE voice=$VOICE_LINE specialty=$SPEC_LINE (need name < voice < specialty, all > 0)"
  FAIL=$((FAIL + 1))
fi

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
