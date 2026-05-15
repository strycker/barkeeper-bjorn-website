---
phase: 04-inventory-recommender-depth
plan: "03"
subsystem: recommender-ui
tags: [recommender, ui, mood-sliders, scope-toggle, occasion-filter, sidebar-layout]
requires: [04-01]
provides: [REC-01, REC-02, REC-03]
affects: [app/js/views/recommender.js, app/css/app.css]
tech-stack:
  added: []
  patterns:
    - CSS grid two-column layout with sticky sidebar
    - Cumulative section rendering driven by _scopeLevel state
    - Ephemeral profile override for mood re-ranking without State mutation
    - Multi-select OR filtering with Set-based _activeOccasions
key-files:
  modified:
    - app/js/views/recommender.js
    - app/css/app.css
decisions:
  - Slider re-ranking uses onchange (release) not oninput (drag) per D-14
  - Sliders reset to saved profile on every render() call per D-15 — no sessionStorage
  - _scopeLevel / _activeFilter / _activeOccasions NOT reset on render (persist within session)
  - addToShoppingList calls State.save('inventory') directly (accepted per T-04-12)
  - --amber-dim, --border2, --radius-sm, --bg2 all existed in :root — no literal fallbacks needed
metrics:
  duration: "~25 minutes"
  completed: "2026-05-15T16:16:20Z"
  tasks_completed: 2
  tasks_total: 2
---

# Phase 4 Plan 03: Recommender Sidebar Layout, Mood Sliders, Scope Toggle, Occasion Chips Summary

Two-column recommender sidebar with 6-axis mood sliders pre-loaded from profile, cumulative scope toggle for 0/1/2 missing bottles, and occasion chips multi-select derived from CLASSICS_DB tags — all wired into real-time re-ranking via ephemeral profile override.

## What Was Built

### Task 1: recommender.js restructure

**File:** `app/js/views/recommender.js`  
**Line count:** Before: 186 lines → After: 310 lines (+124 lines net)

**New module-level state added:**
- `AXIS_KEYS` — ordered array of 6 axis names
- `AXIS_POLES` — display pole labels for each axis
- `_scopeLevel` (0|1|2) — drives cumulative section display
- `_activeOccasions` (Set) — multi-select occasion filter
- `_sliderValues` — ephemeral slider positions, reset on every render()
- `_savedSliderValues` — snapshot at render time for "Reset to saved"
- `_slidersVisible` — mobile toggle state

**New helper functions:**
- `_getInitialSliderValues(profile)` — extracts 0-1 numeric values from profile axes using POS_MAP
- `_buildOverrideProfile(baseProfile)` — deep-clones profile and writes slider values into axes for ephemeral engine re-ranking
- `_getOccasionTags()` — derives sorted unique tags from CLASSICS_DB[*].tags
- `addToShoppingList(itemName)` — appends to inventory.shopping_list with duplicate guard, calls State.save('inventory')

**New card renderer:**
- `_renderTwoAwayCard(item)` — renders two-away cards with two missing-ingredient rows each having a data-item button

**Revised `_rerender()`:**
- Reads `_scopeLevel`, `_activeOccasions`, `_activeFilter`, `_results`
- Applies combined occasion + base-spirit filter via `applyFilters()`
- Renders "You Can Make These" section always
- Conditionally renders "One Bottle Away" section when `_scopeLevel >= 1`
- Conditionally renders "Two Bottles Away" section when `_scopeLevel >= 2`
- Wires `.rec-twoaway-link` buttons to `addToShoppingList()` after innerHTML set
- Wires `.rec-clear-filters` buttons to reset filters

**Revised `_attach()`:**
- Base-spirit filter chips: set `_activeFilter`, call `_rerender()`
- Scope buttons: set `_scopeLevel`, call `_rerender()`
- Occasion chips: toggle Set membership or clear all (for `__all__` tag)
- Mood sliders: `change` event only (not `input`) — updates `_sliderValues`, re-runs engine with `_buildOverrideProfile`, calls `_rerender()`
- Save to Profile button: patches profile axes with current slider values, calls `State.save('profile')`, shows toast
- Reset to saved link: restores `_sliderValues` from `_savedSliderValues`, updates slider DOM values, re-runs engine
- Mobile mood toggle: shows/hides `.rec-mood-sliders-inner`, changes button text

**Revised `render()`:**
- Resets ephemeral state (`_sliderValues`, `_savedSliderValues`, `_slidersVisible`) on every call
- Does NOT reset `_scopeLevel`, `_activeFilter`, `_activeOccasions` (session-persistent)
- Emits full two-column layout: `rec-root > rec-header + rec-layout > (rec-sidebar + rec-main)`
- Sidebar contains: mood panel with 6 sliders, scope toggle, base-spirit chips, occasion chips
- Main column is empty `.rec-cards` populated by `_rerender()`

### Task 2: app.css additions

**File:** `app/css/app.css`  
**Lines added:** 194 lines appended

**New CSS classes added:**

| Class | Purpose |
|-------|---------|
| `.rec-layout` | Two-column grid: `280px 1fr`, gap 24px |
| `.rec-sidebar` | Sticky 280px panel, bg2 background, border2 border |
| `.rec-sidebar-section` | Section spacing within sidebar |
| `.rec-main` | `min-width: 0` to prevent grid blowout |
| `.rec-mood-panel` | Mood slider group container |
| `.rec-mood-heading` | "Mood" section label (12px, uppercase, amber-dim) |
| `.mood-toggle-btn` | Hidden on desktop, inline-flex on mobile (<860px) |
| `.rec-mood-sliders-inner` | Visible on desktop, hidden on mobile until toggle |
| `.rec-axis-row` | Per-slider row with 12px bottom margin |
| `.rec-axis-label` | Axis name label (12px, text-dim) |
| `.rec-axis-pole-row` | Flex row for left-label + slider + right-label |
| `.axis-pole-label--left` | Left pole label (12px, text-muted, min-width 36px, right-aligned) |
| `.axis-pole-label--right` | Right pole label (12px, text-muted, min-width 36px) |
| `.rec-mood-save` | Flex row for Save + Reset controls |
| `.rec-mood-reset` | "Reset to saved" link (12px, amber-dim) |
| `.rec-scope-toggle` | Column flex for 3 scope buttons |
| `.rec-scope-btn` | Scope button (transparent bg, border2, full-width) |
| `.rec-scope-btn.active` | Active scope (amber-dim bg, amber border, white text) |
| `.rec-occasion-heading` | Section label (12px, uppercase, amber-dim) |
| `.rec-occ-chips` | Flex wrap container for occasion chips |
| `.rec-section-heading` | Section heading h3 (20px, 400 weight, text color) |
| `.rec-section-heading--oneaway` | Amber color + amber left border |
| `.rec-section-heading--twoaway` | Blue color + blue left border |
| `.rec-card--twoaway` | Blue left border on two-away cards |
| `.rec-twoaway-missing` | Missing ingredient row (flex, 13px) |
| `.rec-twoaway-link` | Shopping list button (transparent, blue, underlined) |

**Responsive breakpoints added:** Two `@media (max-width: 860px)` blocks — layout collapse and mood toggle visibility.

## Grep Gate Results (Acceptance Criteria)

All acceptance criteria verified:

```
Task 1:
_scopeLevel count: 9 (≥4 required)
_activeOccasions count: 13 (≥4 required)
_buildOverrideProfile count: 3 (≥2 required)
_renderTwoAwayCard count: 2 (≥2 required)
rec-layout count: 1 (≥1 required)
rec-scope-btn count: 5 (≥3 required)
_scopeLevel >= 1 count: 1 (exactly 1 required)
_scopeLevel >= 2 count: 1 (exactly 1 required)
Two Bottles Away count: 2 (≥1 required)
rec-occ-chip count: 5 (≥3 required)
rec-axis-slider count: 3 (≥2 required)
rec-twoaway-link count: 3 (≥2 required)
addToShoppingList count: 2 (≥2 required)
Utils.escapeHtml count: 25 (≥10 required)
return { render }; count: 1 (exactly 1 required)
oninput count: 0 (must be 0 — no inline oninput handlers)

Task 2:
.rec-layout count: 1 (exactly 1 required)
.rec-sidebar count: 1 (exactly 1 required)
max-width: 860px count: 3 (≥2 required)
.mood-toggle-btn count: 1 (exactly 1 required)
.rec-scope-btn.active count: 1 (exactly 1 required)
.rec-section-heading count: 1 (exactly 1 required)
.rec-section-heading--oneaway count: 1 (exactly 1 required)
.rec-section-heading--twoaway count: 1 (exactly 1 required)
.rec-card--twoaway count: 1 (exactly 1 required)
.rec-twoaway-link count: 1 (exactly 1 required)
280px count: 2 (≥1 required)
.rec-card count: 1 (existing rule preserved)
.rec-filter-chip count: 1 (existing rule preserved)
```

## CSS Custom Property Notes

All custom properties referenced in the new CSS exist in `:root` — no literal fallbacks were required:
- `--amber-dim: #a06e22` — exists
- `--border2: #444` — exists
- `--radius-sm: 5px` — exists
- `--bg2: #1a1a1a` — exists
- `--amber: #d4943a` — exists
- `--blue: #5b9bd5` — exists
- `--text: #e8e2d9` — exists
- `--text-dim: #9a9080` — exists
- `--text-muted: #666` — exists
- `--radius: 8px` — exists

Note: `--amber-dim` is `#a06e22` (a dark amber), not `rgba(212,148,58,0.6)` as the plan comment suggested. The actual value is correct for the dark theme — no deviation needed as it renders appropriately.

## Browser Smoke Test

Not run (static analysis only — no browser available in this environment). All implementation follows the verified grep gate counts and matches the plan's acceptance criteria exactly.

## Deviations from Plan

None — plan executed exactly as written.

The only minor note: the plan's CSS block comments used `rgba(212,148,58,0.6)` as an example fallback for `--amber-dim`, but since the variable exists in `:root` as `#a06e22`, no fallback was needed. This is consistent with plan instructions ("If a custom property you need does not exist in `:root`, use its literal fallback value inline").

## Known Stubs

None. All data flows are wired:
- Mood sliders read from `State.get('profile').flavor_profile.axes`
- Engine called with `RecommenderEngine.recommend(inventory, profile)` / override profile
- Occasion tags derived from `CLASSICS_DB[*].tags` (added in plan 04-01)
- Shopping list writes to `State.get('inventory').shopping_list` via `State.save('inventory')`

## Self-Check: PASSED

Files created/modified:
- app/js/views/recommender.js — FOUND
- app/css/app.css — FOUND

Commits:
- 88bb6d2 (recommender.js Task 1) — FOUND
- 4a4e07f (app.css Task 2) — FOUND
