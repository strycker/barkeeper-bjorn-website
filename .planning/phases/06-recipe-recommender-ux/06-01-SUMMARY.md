---
phase: 06-recipe-recommender-ux
plan: 01
subsystem: ui
tags: [vanilla-js, iife, dedup, recommender, recipes, xss-escaping]

# Dependency graph
requires:
  - phase: 05-polish-depth-ux-tidy
    provides: heart/star toggle cards (REC-10/REC-11), made_log schema, universal recipe modal
provides:
  - "Utils.sameRecipe(a, b) — single shared case-insensitive name+base recipe comparator"
  - "Recommender card dedup routed through Utils.sameRecipe at all read checks + toggle handlers"
  - "Escaped data-base attribute on the 3 action buttons in both Recommender card renderers"
  - "Recipes-view modal + chip dedup routed through Utils.sameRecipe"
affects: [06-02 editable-modal-dual-write (D-06), 06-03 originals-in-recommender (D-07)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Single shared equality helper (Utils.sameRecipe) instead of inline name-only comparisons"
    - "name+base unique key (case-insensitive) as the canonical recipe identity"

key-files:
  created:
    - .planning/phases/06-recipe-recommender-ux/06-01-SUMMARY.md
  modified:
    - app/js/utils.js
    - app/js/views/recommender.js
    - app/js/views/recipes.js

key-decisions:
  - "D-08 unique key = name + base spirit, case-insensitive; missing fields normalized to '' so '' === '' holds"
  - "Favorites and Wishlist remain independent lists; a recipe can be in both at once"
  - "Hardcoded _source:'classics-db' in Recommender add branches left untouched (deferred to 06-03/D-07)"

patterns-established:
  - "Route every recipe-equality check through Utils.sameRecipe — no inline name-only comparisons"
  - "Every new data-* attribute carrying user recipe data is wrapped in Utils.escapeHtml (T-06-01 mitigation)"

requirements-completed: [REC-10, REC-11, RECIPE-MADE-01, RECIPE-MADE-02, RECIPE-VIEW-01, RECIPE-VIEW-02, RECIPE-SEARCH-01, REC-SEARCH-01]

# Metrics
duration: ~2min
completed: 2026-05-20
---

# Phase 6 Plan 01: name+base Duplicate Guard (D-08) Summary

**Single shared `Utils.sameRecipe(a, b)` comparator (case-insensitive name AND base) routed through every dedup site in the Recommender and Recipes views, with escaped `data-base` added to all six Recommender action buttons.**

## Performance

- **Duration:** ~2 min (verification + summary; task code committed during the same session)
- **Started:** 2026-05-20T19:55:19Z
- **Completed:** 2026-05-20T19:56:34Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Added `Utils.sameRecipe(a, b)` — the single source of truth for recipe identity (name + base, case-insensitive, null-guarded). Verified runtime behavior matches the plan's full `<behavior>` spec.
- Routed all Recommender read checks (button-state), all three allItems lookups, all three isFav/isWish/isMade reads, and all three remove filters through `Utils.sameRecipe` (15 uses). Added escaped `data-base` to the 3 action buttons in BOTH card renderers (6 total).
- Routed all nine Recipes-view modal + chip dedup sites (favorites/wishlist/made remove filters, list/made-log lookups, notes-save, made-again, tally-refresh, reset/unmade filters) through `Utils.sameRecipe`, while leaving the Originals id-based logic untouched.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Utils.sameRecipe(a, b) comparator** - `f1e160f` (feat)
2. **Task 2: Route Recommender dedup through name+base** - `d09feb2` (feat)
3. **Task 3: Route Recipes-view dedup through name+base** - `ee1d6bd` (feat)

**Plan metadata:** committed separately with this SUMMARY (docs)

## Files Created/Modified
- `app/js/utils.js` - Added `sameRecipe(a, b)` inside the Utils IIFE and exported it in the return object. No existing export removed or renamed.
- `app/js/views/recommender.js` - Replaced name-only checks with `Utils.sameRecipe` at button-state reads, allItems lookups, isX reads, and remove filters; added escaped `data-base` to all six action buttons. Add branches' hardcoded `_source:'classics-db'` left unchanged (06-03 owns it).
- `app/js/views/recipes.js` - Replaced name-only checks with `Utils.sameRecipe` at all nine modal/chip dedup sites; Originals id-based delete/findIndex (`x.id !== r.id`) left untouched.

## Decisions Made
None - followed plan as specified. The D-08 unique key (name + base, case-insensitive) and the deliberate non-change to the hardcoded `_source:'classics-db'` add branches were both explicit plan instructions.

## Deviations from Plan

None - plan executed exactly as written.

Note: All three task commits already existed in the branch history at execution time (`f1e160f`, `d09feb2`, `ee1d6bd`). Execution confirmed each task's `<verify>` automated block and every `<acceptance_criteria>` grep passes, ran `node --check` on all three files (all exit 0), and verified `sameRecipe` runtime behavior against the plan's `<behavior>` spec before producing this summary.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Foundational name+base equality is now correct everywhere, unblocking 06-02 (D-06 editable modal dual-write) and 06-03 (D-07 Originals in Recommender), both of which rely on name+base identity.
- No blockers.

## Self-Check: PASSED
- `app/js/utils.js`, `app/js/views/recommender.js`, `app/js/views/recipes.js` — all present and pass `node --check`.
- Commits `f1e160f`, `d09feb2`, `ee1d6bd` — all present in branch history.
- Acceptance criteria: utils.js function/export present (1 def + export); recommender.js 15 `Utils.sameRecipe` (>=12), 6 `data-base=` (>=6), 0 name-only checks; recipes.js 9 `Utils.sameRecipe` (>=9), 0 name-only checks, 1 `x.id !== r.id` (Originals intact).

---
*Phase: 06-recipe-recommender-ux*
*Completed: 2026-05-20*
