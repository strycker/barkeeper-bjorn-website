---
phase: 01-agent-instructions-polish
plan: 04
subsystem: agent-instructions
tags: [markdown, agent-prompt, recipe-template, img-tag, d-08, mirror-invariant]

# Dependency graph
requires:
  - phase: 01-agent-instructions-polish
    provides: "D-07 save reminder in barkeeper-instructions.md uses [cocktailN]-image.png filename (set by plan 01-03)"
provides:
  - "D-08 canonical recipe-template <img> form: width=\"400\", filename [cocktailN]-image.png, alt=\"[Drink Name]\""
  - "Uniform <img> form across all three sync points (barkeeper-instructions.md, recipes.md, instructions/communication.md)"
  - "Cross-plan filename consistency: D-07 save reminder and D-08 recipe-template Image line both reference [cocktailN]-image.png"
affects: [phase-02-web-ui, recipes-view, image-rendering]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Mirror invariant S4 enforced: <img> tag form must match across barkeeper-instructions.md (line 529), recipes.md (line 30), instructions/communication.md (line 42)"
    - "D-08 LOCKED canonical form preferred over older width=\"200\" + snake_case+_001 filename per CONTEXT.md and PATTERNS.md flagged ambiguity #1"

key-files:
  created:
    - ".planning/phases/01-agent-instructions-polish/01-04-SUMMARY.md"
  modified:
    - "barkeeper-instructions.md (line 529 — recipe-template Image field)"
    - "recipes.md (line 30 — recipe-template Image field)"
    - "instructions/communication.md (line 42 — Formatting Defaults image-format note)"

key-decisions:
  - "Honored D-08 LOCKED text verbatim per CONTEXT.md (width=\"400\", [cocktailN]-image.png, alt=\"[Drink Name]\")"
  - "Resolved PATTERNS.md flagged ambiguity #1 in favor of D-08 canonical form across all three sync points (no compromise / no generic width=\"...\" — preserved user-facing example value)"
  - "Both monolith (barkeeper-instructions.md) and module (recipes.md) Image lines now byte-identical at this sync point"

patterns-established:
  - "Mirror obligation S4 satisfied: identical <img> form in all three sync points"
  - "Cross-plan filename invariant: D-07 save reminder filename matches D-08 recipe-template filename"

requirements-completed: [AGENT-04]

# Metrics
duration: 3min
completed: 2026-05-06
---

# Phase 1 Plan 4: Recipe `<img>` Template (D-08) Summary

**Recipe-template `<img>` tag updated to D-08 canonical form (`width="400"`, kebab filename `[cocktailN]-image.png`, `alt="[Drink Name]"`) across all three sync points; mirror invariant S4 satisfied byte-for-byte between barkeeper-instructions.md and recipes.md.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-05-06T03:24:30Z (approx)
- **Completed:** 2026-05-06T03:27:33Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- D-08 canonical recipe-template `<img>` form applied uniformly across `barkeeper-instructions.md`, `recipes.md`, and `instructions/communication.md`
- Both recipe-template Image lines (`barkeeper-instructions.md:529` and `recipes.md:30`) are now byte-identical, satisfying mirror invariant S4
- Cross-plan consistency restored: filename `[cocktailN]-image.png` now appears 2× in `barkeeper-instructions.md` (the D-07 save reminder from plan 01-03 + the recipe-template Image line from this plan), eliminating the prior self-contradicting reference
- Old `width="200"` and `[cocktailN]_short_name_001.png` patterns removed from every sync point — confirmed by negative greps
- Negative invariant held: zero `app/` files modified

## Task Commits

Each task was committed atomically:

1. **Task 1: Update barkeeper-instructions.md and recipes.md recipe-template Image field to D-08 canonical form** — `8d724c1` (feat)
2. **Task 2: Update instructions/communication.md Formatting Defaults image-format note to width="400" (D-08 mirror)** — `bd73150` (feat)

## Files Created/Modified
- `barkeeper-instructions.md` — line 529 Image field: `width="200"` → `width="400"`, filename `[cocktailN]_short_name_001.png` → `[cocktailN]-image.png`, added `alt="[Drink Name]"`
- `recipes.md` — line 30 Image field: identical replacement to `barkeeper-instructions.md` line 529 (mirror invariant S4)
- `instructions/communication.md` — line 42 Formatting Defaults bullet: `width="200"` → `width="400"` (single-character change; rest of bullet preserved verbatim)
- `.planning/phases/01-agent-instructions-polish/01-04-SUMMARY.md` — this file

## Decisions Made
- Honored D-08 LOCKED text verbatim per CONTEXT.md. PATTERNS.md flagged this as ambiguity #1 (planner already pre-resolved by quoting D-08 directly), so the executor had no choice — applied as written.
- Did NOT take PATTERNS.md's alternative suggestion of replacing the `width="400"` with a generic `width="..."` in `instructions/communication.md`. Rationale: keeping the canonical example value preserves user-facing guidance value and reinforces mirror invariant S4.
- Edits to `barkeeper-instructions.md` line 529 and `recipes.md` line 30 were applied atomically (within the same task) so the mirror obligation is never broken between commits.

## Deviations from Plan

None — plan executed exactly as written. Both task actions matched the plan's `<action>` blocks verbatim and all positive + negative grep acceptance criteria passed on the first attempt.

## Issues Encountered

None.

## Verification Evidence

- Plan-level checks (post-Task-2):
  - `grep -c 'width="400"'` returns 1 in each of: `barkeeper-instructions.md`, `recipes.md`, `instructions/communication.md`
  - `grep -c '\[cocktailN\]-image\.png'` returns 2 in `barkeeper-instructions.md` (save reminder + template) and 1 in `recipes.md`
  - `grep -F '[cocktailN]_short_name_001.png'` exits 1 (absent) in both `barkeeper-instructions.md` and `recipes.md`
  - `grep -F 'Images use \`<img src="..." width="200">\`' instructions/communication.md` exits 1 (absent)
  - Mirror symmetry: `diff <(grep ... barkeeper-instructions.md) <(grep ... recipes.md)` for the Image line is empty (exit 0)
  - `git diff --name-only HEAD~2 HEAD | grep -c '^app/'` returns 0
  - Files touched (last 2 commits): `barkeeper-instructions.md`, `instructions/communication.md`, `recipes.md` — exactly the three declared in the plan's `files_modified`

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness
- AGENT-04 closed. The remaining ambiguity flagged in PATTERNS.md (D-11 voice preset name divergence, item #2) is independent of this plan and is for a later plan in this phase.
- Phase 2 (`app/js/views/onboarding.js` and recipe rendering) can now safely render `<img>` tags using the same canonical form documented here, with no further reconciliation needed for the recipe-template image field.

## Self-Check: PASSED

- `.planning/phases/01-agent-instructions-polish/01-04-SUMMARY.md` — exists
- `barkeeper-instructions.md` — exists, modified
- `recipes.md` — exists, modified
- `instructions/communication.md` — exists, modified
- Commit `8d724c1` (Task 1) — present in git log
- Commit `bd73150` (Task 2) — present in git log

---
*Phase: 01-agent-instructions-polish*
*Completed: 2026-05-06*
