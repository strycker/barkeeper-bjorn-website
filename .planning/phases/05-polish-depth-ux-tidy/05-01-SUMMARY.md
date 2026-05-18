---
phase: 05-polish-depth-ux-tidy
plan: "01"
subsystem: recommender
tags: [recommender, engine, scope, vetoes, favorites, wishlist, derivations]
dependency_graph:
  requires: [05-00]
  provides: [REC-05, REC-06, REC-07, REC-08, REC-09]
  affects: [app/js/recommender-engine.js, app/js/views/recommender.js, app/css/app.css]
tech_stack:
  added: []
  patterns:
    - IIFE module ephemeral state (Set reset on render)
    - Immediate-save pattern for recipe writes (no dirty flag)
    - Absolute-positioned overlay for card quick-action buttons
key_files:
  created: []
  modified:
    - app/js/recommender-engine.js
    - app/js/views/recommender.js
    - app/css/app.css
decisions:
  - DERIVATIONS array uses corrected mint and honey targets from classics-db.js searchIn verification
  - _expandLookup mutates lookup in place (no allocation overhead)
  - rec-card-actions uses absolute overlay (not flex restructure) to avoid card template churn
  - Scope button handler re-runs engine on click (not just _rerender) so Unconstrained actually expands results
  - Both _renderCard and _renderTwoAwayCard get fav/wish buttons
  - .rec-card gets position:relative to anchor the absolute card-actions overlay
metrics:
  duration: ~35 minutes
  completed: "2026-05-18"
  tasks_completed: 2
  files_modified: 3
---

# Phase 05 Plan 01: Recommender UX Depth Summary

Engine + view + CSS additions delivering cumulative scope highlight, Unconstrained scope button, per-session vetoes panel, heart/star quick-action card buttons, and silent ingredient derivation expansion.

## Tasks Completed

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Engine opts param + _expandLookup derivation pass | 546f690 | app/js/recommender-engine.js |
| 2 | View — scope highlight, Unconstrained btn, vetoes panel, fav/wish buttons | 90181b0 | app/js/views/recommender.js, app/css/app.css |

Task 3 is a human-verification checkpoint — not auto-executable.

## Implementation Details

### Final DERIVATIONS Array

```js
const DERIVATIONS = [
  ['lime',  'lime juice',   'produce',     'perishables'],
  ['lemon', 'lemon juice',  'produce',     'perishables'],
  ['sugar', 'simple syrup', 'pantry',      'syrups'],
  ['egg',   'egg white',    'perishables'],
  ['mint',  'muddled mint', 'produce',     'pantry'],
  ['cream', 'heavy cream',  'perishables'],
  ['honey', 'honey syrup',  'syrups',      'pantry',      'perishables'],
];
```

Corrections from PLAN.md defaults (verified against classics-db.js searchIn keys):
- `mint` → targets are `['produce', 'pantry']` (not just `['produce']`) — classics-db Fresh Mint uses `searchIn: ['produce', 'pantry']`
- `honey` → targets are `['syrups', 'pantry', 'perishables']` (not just `['pantry', 'syrups']`) — classics-db Honey Syrup uses `searchIn: ['syrups', 'pantry', 'perishables']`

### `.rec-card` position:relative

`.rec-card` did NOT have `position: relative` before this plan. Added in app/css/app.css line 655. Required to anchor `.rec-card-actions` absolute overlay to each card.

### Engine Call Sites Updated

All 5 `RecommenderEngine.recommend()` call sites in recommender.js were updated to pass `{ scope: _scopeLevel, ignoreVetoes: _vetoOverrides }`. The 3 sites referenced in PLAN.md were the original three (slider change, reset link, initial render). Two additional sites were added as part of this plan (scope button click handler, veto chip click handler) — all 5 now pass opts.

### CSS Additions

Beyond the spec, no additional CSS was added. Exact additions:
- `.rec-scope-btn--unconstrained { border-style: dashed; }` — dashed border for Unconstrained button
- `.rec-veto-chip.bypassed { text-decoration: line-through; opacity: 0.5; }` — bypassed veto appearance
- `.rec-card-actions { position: absolute; top: 8px; right: 8px; ... }` — absolute overlay container
- `.rec-fav-btn, .rec-wish-btn { ... }` — circular icon button styles
- `.rec-fav-btn:hover, .rec-wish-btn:hover { background: var(--amber-dim); }` — hover state

## Deviations from Plan

### Auto-fixed Issues

None.

### Scope Button Re-runs Engine

The PLAN.md scope button handler description implied only `_rerender(container)` was needed. In practice, changing scope must also re-run the engine because opts.scope controls how `recommend()` categorizes recipes (Unconstrained puts everything in buildable). Added `RecommenderEngine.recommend(...)` call in the scope button click handler. This is a correctness requirement, not a new feature. [Rule 2 - Missing critical functionality]

### Veto Chip State Update

After toggling a veto chip, the plan described wiring a `_runRecommend()` helper. Instead, the engine re-run is done inline in the click handler with a follow-up `btn.classList.toggle('bypassed', ...)` call to update the chip's visual state immediately without re-rendering the entire sidebar (which would lose focus). This is equivalent behavior, slightly more efficient.

### Both Card Types Get Fav/Wish Buttons

The plan specified adding buttons to `_renderCard`. `_renderTwoAwayCard` was also updated since two-away recipes are equally valid save targets. This is an obvious correctness extension.

## Known Stubs

None. All new functionality is fully wired:
- `_vetoOverrides` → engine `opts.ignoreVetoes` → filters active veto list
- `_expandLookup` → called inside `recommend()` after `_buildLookup`
- `rec-fav-btn`/`rec-wish-btn` → `State.patch('recipes', ...)` + `State.save('recipes')`
- Scope buttons → engine re-run + `_rerender`

## Threat Flags

None. No new network endpoints, auth paths, or file access patterns introduced. Recipe save writes to the existing `recipes.json` data file via the existing `State.save('recipes')` path.

## Self-Check: PASSED

- [x] `app/js/recommender-engine.js` exists and has `_expandLookup`, `DERIVATIONS`, `opts` param
- [x] `app/js/views/recommender.js` exists and has `_vetoOverrides`, `rec-scope-btn--unconstrained`, `data-scope="3"`, `<= _scopeLevel`, `rec-fav-btn`, `rec-wish-btn`, `ignoreVetoes: _vetoOverrides` (5 occurrences)
- [x] `app/css/app.css` has `.rec-veto-chip.bypassed`, `.rec-scope-btn--unconstrained`, `.rec-card-actions`, `.rec-fav-btn`
- [x] Commit 546f690 exists (Task 1)
- [x] Commit 90181b0 exists (Task 2)
