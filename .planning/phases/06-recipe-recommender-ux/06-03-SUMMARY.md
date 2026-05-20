---
phase: 06-recipe-recommender-ux
plan: 03
subsystem: ui
tags: [recommender, originals, inventory-matching, vanilla-js, css]

# Dependency graph
requires:
  - phase: 06-recipe-recommender-ux (06-01)
    provides: Utils.sameRecipe + name+base dedup so badged Originals toggle correctly
  - phase: 06-recipe-recommender-ux (06-02)
    provides: editable universal detail modal for _source:'originals' recipes (D-06)
provides:
  - "RecommenderEngine.recommend accepts opts.originals and scores them inventory-aware (Strategy B, D-07)"
  - "normalizeOriginal synthesizes keywords/searchIn/base/optional/tags/_source for raw Originals"
  - "_hasIngredient crash guard against missing keywords/searchIn (T-06-06)"
  - "Recommender view passes opts.originals at all 5 recommend() call sites"
  - "Favorite/wishlist/made writes preserve item.recipe._source so Originals open editable (D-06)"
  - "Amber 'Your original' badge on Original cards in both card renderers"
affects: [recipe-view, recommender-ux, future-recipe-features]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Normalize user-authored Originals into engine recipe shape before scoring (Strategy B)"
    - "Permissive searchIn (ALL SECTION_MAP keys) for Originals lacking section metadata"
    - "Provenance preservation via item.recipe._source || 'classics-db' on writes"

key-files:
  created:
    - .planning/phases/06-recipe-recommender-ux/06-03-SUMMARY.md
  modified:
    - app/js/recommender-engine.js
    - app/js/views/recommender.js
    - app/css/app.css

key-decisions:
  - "Implemented Strategy B (inventory-aware) per locked D-07, NOT Strategy A from RESEARCH.md"
  - "Originals lacking BOTH derivable base AND ingredients are excluded before scoring"
  - "if (!pool.length) early-return (was !db.length) so Originals show even if CLASSICS_DB empty"

patterns-established:
  - "normalizeOriginal: raw Original -> engine-shaped recipe with synthesized matching metadata"
  - "Defensive _hasIngredient: guard keywords/searchIn with || [] against any unnormalized recipe"

requirements-completed: [REC-SEARCH-01, RECIPE-VIEW-02]

# Metrics
duration: 2min
completed: 2026-05-20
---

# Phase 6 Plan 03: Score Originals in Recommender (inventory-aware) Summary

**User-authored Originals are normalized and matched against actual inventory (Strategy B, D-07), mixed into Recommender results with an amber 'Your original' badge, with a crash guard and provenance-preserving writes.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-20T20:01:54Z
- **Completed:** 2026-05-20T20:03:21Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Engine accepts `opts.originals`, normalizes each via `normalizeOriginal` (synthesized keywords/searchIn/base/optional/tags/_source), and scores them inventory-aware alongside CLASSICS_DB in a unified `pool`.
- Guarded the `_hasIngredient` crash site (`ingredient.keywords.map` / `ingredient.searchIn`) with `|| []`, eliminating the keywords.map crash on raw Originals (T-06-06).
- Originals lacking both a derivable base and ingredients are filtered out before scoring.
- View passes `originals: State.get('recipes')?.originals || []` at all 5 `recommend()` call sites.
- Favorite/wishlist/made writes now preserve `item.recipe._source` so a Recommender-favorited Original stores `_source:'originals'` and opens editable per D-06.
- Amber 'Your original' badge added to both card renderers, styled via `--amber`/`--amber-dim` custom properties.

## Task Commits

Each task was committed atomically:

1. **Task 1: Engine — accept opts.originals, normalize, guard crash** - `e091b30` (feat)
2. **Task 2: View — pass opts.originals, preserve _source on writes** - `c4ff4b1` (feat)
3. **Task 3: View + CSS — amber 'Your original' badge** - `0ad6bbe` (feat)

_Note: Task 1 was tdd="true"; its `<verify>` vm harness is the failing-then-passing test, run after the implementation in a single commit (no separate code path to test in isolation)._

## Files Created/Modified
- `app/js/recommender-engine.js` - Added ALL_SECTIONS + normalizeOriginal; guarded _hasIngredient; built pool=[...db,...normOriginals]; pool-based loop and early-return; exported normalizeOriginal.
- `app/js/views/recommender.js` - Added opts.originals at 5 call sites; preserved item.recipe._source on 3 add branches; rendered amber badge in both card renderers.
- `app/css/app.css` - Added `.rec-original-badge` amber styling.

## Decisions Made
- Followed LOCKED D-07 Strategy B (inventory-aware), not RESEARCH.md's Strategy A recommendation, per user-decision fidelity.
- Changed the early-return guard from `!db.length` to `!pool.length` so Originals surface even when CLASSICS_DB is empty (per plan action c).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None. The Task 1 vm harness verify printed `OK` on first run; all acceptance greps matched expected counts; `node --check` passed on both modified JS files.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Originals are now discoverable, ranked, and editable from the Recommender.
- UAT note (Pitfall F, accepted): Originals show "Advanced" difficulty chip since difficulty is undefined; left as-is per plan.
- Known tradeoff (accepted per D-07): an Original whose ingredient names don't normalize to inventory tokens may not appear buildable.

---
*Phase: 06-recipe-recommender-ux*
*Completed: 2026-05-20*
