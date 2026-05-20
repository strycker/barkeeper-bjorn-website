---
phase: 06-recipe-recommender-ux
plan: 02
subsystem: ui
tags: [vanilla-js, iife, recipes, originals, dual-write, xss-escaping, modal]

# Dependency graph
requires:
  - phase: 06-recipe-recommender-ux
    provides: "Utils.sameRecipe(a,b) name+base comparator (06-01); universal detail modal showRecipeDetail (Phase 5)"
provides:
  - "showRecipeDetail conditional editable rendering for _source==='originals' (name/method/glassware/garnish inputs + add/remove ingredient editor)"
  - "Dual-write Save Recipe: recipes.originals (by id, name+base fallback) AND the originating inline list copy (by OLD name+base), rename-safe via pre-edit key capture"
  - "Read-only modal preserved unchanged for classics-db / ai-generated / undefined sources"
  - "Editable-field modal CSS (.rdm-edit-*) using dark amber custom properties"
affects: [06-03 originals-in-recommender (D-07), 06-UAT, 06-VALIDATION]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Provenance-driven UI: modal editability gated on recipe._source==='originals'"
    - "Capture canonical lookup keys (id + pre-edit name+base) BEFORE applying edits so a rename does not orphan the inline copy"
    - "Single State.patch dual-write with Object.assign (not replacement) to preserve tracking fields"

key-files:
  created:
    - .planning/phases/06-recipe-recommender-ux/06-02-SUMMARY.md
  modified:
    - app/js/views/recipes.js
    - app/css/app.css

key-decisions:
  - "Editable path fires only for _source==='originals'; all other sources keep the existing read-only template"
  - "Originals reach the editable modal today via the modal's own made-again write (preserves recipe._source); 06-03/D-07 makes the Recommender write _source:'originals' for Originals"
  - "Save Recipe and Save Notes both present in the editable footer — Save Recipe dual-writes recipe fields, Save Notes keeps its existing per-list notes write"

patterns-established:
  - "Modal editability is driven by _source, not by which list/page the chip came from (Pages are views; chips are the interface)"
  - "Dual-write inline-copy lookup uses Utils.sameRecipe against a pre-edit probe; canonical lookup prefers stable id with name+base fallback"

requirements-completed: [RECIPE-VIEW-02, RECIPE-MADE-02]

# Metrics
duration: ~5min
completed: 2026-05-20
---

# Phase 6 Plan 02: Editable Originals in the Universal Modal with Dual-Write Summary

**The universal detail modal now unlocks name / ingredients / method / glassware / garnish as editable inputs when `_source==='originals'`, and Save Recipe dual-writes the edits to both `recipes.originals` (canonical) and the originating inline list copy — rename-safe by capturing the old id + name+base before applying edits.**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-05-20T19:58:30Z
- **Completed:** 2026-05-20T20:03:00Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments
- `showRecipeDetail` computes `const editable = recipe._source === 'originals'` and renders an alternate editable modal body (`.rdm-edit-name`, `.rdm-edit-method`, `.rdm-edit-glassware`, `.rdm-edit-garnish`, `#rdm-ingredients` editor with `.rdm-add-ing`, and a `.rdm-save-recipe` button). The ingredient editor reuses `ingredientRowHtml` / `bindIngredientRemove`; the read-only template is preserved byte-for-byte for every other source. Times Made tally and Notes textarea render in both branches.
- Dual-write Save Recipe handler attached only when `editable`. It captures `origId = recipe.id` and `origProbe = {name, base}` BEFORE reading edited inputs, then in one `State.patch('recipes', ...)` `Object.assign`s the edits onto the canonical originals entry (matched by id, falling back to `Utils.sameRecipe(o, origProbe)`) AND onto the inline list copy (matched by `Utils.sameRecipe(x, origProbe)`). `Object.assign` preserves `made_log` tracking fields and `_source`. Rename-safe: a new name is written while the OLD name+base resolves the lookups.
- Editable-field CSS appended to `app/css/app.css` using existing dark amber custom properties (`--bg3`, `--border`, `--radius-sm`, `--amber`, `--amber-dim`, `--text`, `--text-dim`): full-width larger-font name input, inline meta inputs, ingredient-row spacing.

## Task Commits

Each task was committed atomically:

1. **Task 1: Conditionally render editable fields in showRecipeDetail for Originals** - `8076a5f` (feat)
2. **Task 2: Dual-write save for edited Originals (capture old key BEFORE edits)** - `1bb9730` (feat)
3. **Task 3: Add editable-field CSS to .recipe-detail-modal** - `f68599c` (feat)

**Plan metadata:** committed separately with this SUMMARY (docs)

_Note: Tasks 1 and 2 are marked tdd in the plan; with no test framework in this static SPA (CLAUDE.md: no build step, no npm), the RED/GREEN cycle is satisfied by the plan's automated `node -e` assertion blocks + `node --check`, run before each commit._

## Files Created/Modified
- `app/js/views/recipes.js` - `showRecipeDetail` extended with an `editable` branch (Task 1) and a `.rdm-save-recipe` dual-write handler (Task 2). Read-only path, close handlers, notes save, tally/made/reset handlers all unchanged.
- `app/css/app.css` - Appended `.recipe-detail-modal .rdm-edit-*` and `#rdm-ingredients` styles (Task 3), no existing rules modified.

## Decisions Made
None beyond plan instructions. The editable footer keeps both Save Recipe (dual-write of recipe fields) and Save Notes (existing per-list notes write) as the plan's action spec required; this is consistent with the plan's behavior block.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- D-06 is delivered: Originals are editable from any list chip with a correct, rename-safe dual-write; non-originals stay locked. This unblocks 06-03 (D-07), which will make the Recommender stamp `_source:'originals'` on Originals so the editable path is reachable from Recommendation chips as well.
- No blockers.

## Self-Check: PASSED
- `app/js/views/recipes.js` present, `node --check` exits 0; `app/css/app.css` present.
- Commits `8076a5f`, `1bb9730`, `f68599c` present in branch history.
- Acceptance criteria: Task 1 — `_source === 'originals'`=1 (>=1), `rdm-edit-name`=2 (>=1; markup input + save-handler read), `rdm-add-ing`=2 (>=2), `bindIngredientRemove(overlay`=2 (>=1). Task 2 — `origProbe`=3 (>=3), `Object.assign(canon`=1, `Object.assign(copy`=1, `o.id === origId`=1. Task 3 — `rdm-edit-name`=2 (>=1), `rdm-edit`=11 (>=2), `var(--` present.
- Threat T-06-03: every interpolated user value in the editable branch wrapped in `Utils.escapeHtml`; input reads via `.value` (no innerHTML sink).

---
*Phase: 06-recipe-recommender-ux*
*Completed: 2026-05-20*
