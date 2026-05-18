---
phase: 05-polish-depth-ux-tidy
plan: 02
subsystem: ui
tags: [vanilla-js, inventory, form, schema, normalize]

# Dependency graph
requires:
  - phase: 05-00
    provides: Phase 5 initialization, test checklist, plan structure

provides:
  - INV-08: bottle edit form labels renamed Style->Category and Type->Specific Style/Type with placeholders and tooltips
  - INV-09: Nationality free-text field in expanded More fields section; persists via existing data-field save loop
  - schema/inventory.schema.json bottleEntry nationality string property
  - normalize.js coerceBottle nationality default "" coercion (idempotent)
  - INV-10 regression: QUICK_ADD_RULES and renderQuickAddBar untouched; confirmed zero diff in those regions

affects: [future inventory plans, data-model plans, any plan touching normalize.js bottleEntry]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "data-field attribute pattern: any [data-field] input in the edit form is auto-saved by the existing querySelectorAll loop -- no handler changes needed for new fields"
    - "Label-only rename: JSON keys stay unchanged (style, type); only <label> text and placeholder change"
    - "normalize.js idempotent coercion: ensureString(out.nationality) defaults missing field to empty string without affecting existing values"

key-files:
  created: []
  modified:
    - app/js/views/inventory.js
    - app/js/normalize.js
    - schema/inventory.schema.json

key-decisions:
  - "INV-08: JSON keys style and type unchanged; only label text and placeholder copy changed (D-15)"
  - "INV-09: Nationality added to expanded More fields section alongside Brand and Tier; not on chip face (D-16, D-18)"
  - "Tooltip phrasing: Category input title=Broad category (Bourbon, Gin, Mezcal, etc.); Type input title=The specific bottle's style/type (e.g. Single Barrel, Espadin)"

patterns-established:
  - "New bottle edit form fields: add data-field input inside expanded section; save loop picks up automatically"

requirements-completed: [INV-08, INV-09, INV-10]

# Metrics
duration: 15min
completed: 2026-05-18
---

# Phase 5 Plan 02: Inventory Label Renames + Nationality Field Summary

**Bottle edit form label renames (Style->Category, Type->Specific Style/Type) with placeholders and tooltips; Nationality free-text field added to expanded More fields section; schema and normalize updated for nationality; INV-10 quick-add bar confirmed untouched**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-05-18T19:16Z
- **Completed:** 2026-05-18T19:31Z
- **Tasks:** 1 auto task completed (Task 2 is checkpoint:human-verify -- awaiting human)
- **Files modified:** 3

## Accomplishments
- INV-08: Bottle edit form now shows "Category" (not "Style") and "Specific Style/Type" (not "Type") with example placeholders and title tooltip attributes; JSON keys `style` and `type` unchanged
- INV-09: Nationality free-text input present in expanded "More fields" section with placeholder "e.g. Scotland, Mexico, Kentucky USA"; persists to inventory.json via existing `data-field` save loop at line 349-352; not shown on chip face
- Schema and normalize updated: `schema/inventory.schema.json` bottleEntry has `nationality` string property; `normalize.js` coerceBottle defaults `nationality` to `""` on every bottle entry (idempotent)

## Task Commits

1. **Task 1: Label renames + Nationality field + schema + normalize (INV-08, INV-09)** - `546f690` (feat -- note: picked up in parallel 05-01 commit on shared working tree)

## Files Created/Modified
- `app/js/views/inventory.js` - INV-08 label renames (line 306-307) and INV-09 Nationality input (line 313)
- `app/js/normalize.js` - coerceBottle nationality default "" (line 72-73)
- `schema/inventory.schema.json` - nationality string property in bottleEntry (lines 170-174)

## Decisions Made
- Tooltip phrasing used: Category input gets `title="Broad category (Bourbon, Gin, Mezcal, etc.)"` and Specific Style/Type input gets `title="The specific bottle's style/type (e.g. Single Barrel, Espadin)"` -- matches D-15 spirit exactly
- Nationality placed between Brand and Tier in expanded section (alongside Brand, before Tier, Best for, Notes)
- Schema diff: added `nationality` as `{ "type": "string", "default": "", "description": "Country/region of origin..." }` after `notes` property
- No separate save handler for nationality -- relies entirely on existing `[data-field]` loop

## Deviations from Plan

None - plan executed exactly as written. The only notable event is that the parallel 05-01 agent committed all three files (inventory.js, normalize.js, schema/inventory.schema.json) in commit 546f690 on the shared working tree before a separate 05-02 task commit could be created. All Task 1 changes are present and correct in that commit.

## INV-10 Regression Verification

Zero edits to QUICK_ADD_RULES (inventory.js lines 88-108) or renderQuickAddBar (lines 428-514). Confirmed via `git show 546f690 -- app/js/views/inventory.js`: only openEditForm region (lines 306-313) is in the diff. The quick-add bar keyword parser is unmodified and awaits human regression test in Task 2 (checkpoint:human-verify).

## Issues Encountered

Parallel execution caused all three modified files (inventory.js, normalize.js, schema/inventory.schema.json) to be staged and committed by the 05-01 parallel agent before this agent could commit them separately. All changes are correct and present -- the commit hash for Task 1 work is 546f690.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Task 1 code complete; awaiting human verification checkpoint (Task 2) for INV-08, INV-09, INV-10 regression
- After human approves Task 2, plan 05-02 is fully complete
- Ready to continue with 05-03 (data model tidy: equipment consolidation, axis migration, rich profile fields)

---
*Phase: 05-polish-depth-ux-tidy*
*Completed: 2026-05-18*
