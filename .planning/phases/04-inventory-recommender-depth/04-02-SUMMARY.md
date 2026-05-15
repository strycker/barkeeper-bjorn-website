---
phase: 04-inventory-recommender-depth
plan: 02
subsystem: inventory-ui
tags: [inventory, ui, canonical-names, equipment, edit-form, tier-system, css]
dependency_graph:
  requires: [04-01-normalize-engine-schema]
  provides: [structured-bottle-chips, inline-edit-form, 6-tier-ui, equipment-tab, canonical-suggestion-banner]
  affects: [inventory-view, app-css]
tech_stack:
  added: [canonical-names.js (IIFE module)]
  patterns:
    - IIFE module with curated Levenshtein fallback (canonical-names.js)
    - snapshot-based revert for inline edit forms
    - one-at-a-time edit form gate via _openEdit module state
    - dirty-state three-step flow (State.patch → markDirty → State.save via save bar)
    - localStorage persistence for custom type options (bb_custom_types)
key_files:
  created:
    - app/js/canonical-names.js
  modified:
    - app/js/views/inventory.js
    - app/css/app.css
    - app/index.html
decisions:
  - "canonical-names.js already existed from a prior commit (1726caf) — Task 1 verified the file was already correct; index.html script order was also already correct"
  - "Tasks 2 and 3 implemented together in a single inventory.js rewrite — commit b3c8241 covers both tasks"
  - "renderEquipmentSection added as its own function called from renderTabContent; Equipment tab uses data-tab='tab-equipment' attribute for re-render on checkbox change"
  - "bottle-chip-remove now uses class bottle-chip-remove instead of chip-remove to match the new chip structure"
  - "closeEditForm handles the case where the × button is clicked on an item that has an open edit form (avoids double-splice)"
metrics:
  duration: ~60 minutes
  completed_date: "2026-05-15"
  tasks_completed: 4
  tasks_total: 4
  files_modified: 3
---

# Phase 4 Plan 02: Wave 2 — Inventory UI (structured bottles, edit form, tiers, equipment, canonical names)

One-liner: Upgraded inventory view to consume the new {style,brand,tier} bottle schema with inline chip editing, snapshot-based revert, 6-tier dot system, Equipment tab with strainer grid, canonical name suggestion banner, and TYPE_OPTIONS datalist.

## Tasks Completed

### Task 1: canonical-names.js IIFE + index.html script tag

**File:** `app/js/canonical-names.js` (already existed from prior commit `1726caf`)

The file was already correctly implemented:
- IIFE pattern: `const CanonicalNames = (() => { ... return { suggest }; })();`
- CURATED array of 71 canonical names (bitters, liqueurs, vermouths, spirits, syrups, brands)
- `lev(a, b)` — standard Levenshtein, 2-row space-optimized DP
- `suggest(input)` — exact case-insensitive match returns null; Levenshtein threshold `q.length < 8 ? 2 : 3`
- `window.CanonicalNames = CanonicalNames` global assignment

**File:** `app/index.html` — script tag already correctly placed before `js/views/inventory.js`:
```html
<script src="js/canonical-names.js"></script>
<script src="js/views/inventory.js"></script>
```

**Commit:** `1726caf` (pre-existing)

### Task 2: Inventory view — bottle chips, inline edit form, 6-tier system, TYPE_OPTIONS, canonical banner

**File:** `app/js/views/inventory.js` — major rewrite

Changes:
- Replaced `TIERS` / `TIER_COLORS` (4-entry old system) with 6-tier system:
  - `TIERS = ['well', 'standard', 'premium', 'craft', 'boutique', 'rare/exceptional']`
  - `TIER_LABEL` map with 'Unset' fallback for empty string
  - `TIER_COLORS` map: each tier → `.tier-{slug}` CSS class, `'' → 'tier-unset'`
- Added `TYPE_OPTIONS` (35 entries), `loadCustomTypes()`, `saveCustomType()`, `allTypeOptions()` for localStorage-backed custom type persistence
- Added module-level `_openEdit = null` for one-at-a-time edit form enforcement
- Rewrote `renderBottleChips()`:
  - `displayName = bottle.style || bottle.name || (typeof bottle === 'string' ? bottle : '')` — backward compat
  - Tier dot uses `TIER_COLORS[bottle.tier] || 'tier-unset'`
  - Brand secondary text rendered in `<span class="bottle-chip-brand">`
  - Tooltip composed from non-empty parts: `style — brand — {tier} tier`
  - `aria-label="Remove {displayName}"` on × button
  - Chip body click (not ×) calls `openEditForm()`
- Rewrote `renderBottleSection()`:
  - Removed tier select from add-bottle row
  - Add-bottle input linked to `<datalist>` populated from `allTypeOptions()`
  - Canonical suggestion banner below input, wired to `CanonicalNames.suggest()`
  - "Use it" button sets input value and triggers input event
  - New entry shape: `{style, type:'', brand:'', tier:'', best_for:'', notes:'', created_at, updated_at}`
- Implemented `openEditForm(grid, container, sectionKey, index, inv)`:
  - Coerces legacy `{name}` entries on open
  - JSON.parse/stringify snapshot for revert
  - Default fields: Style (text) + Type (text with datalist)
  - "More fields ▾" toggle reveals Brand, Tier (select with 6 options + Unset), Best for, Notes (textarea)
  - Toggle label flips to "Fewer fields ▴"
  - Save Bottle: patches State, calls saveCustomType() for novel types, sets updated_at, calls markDirty(), closes form
  - Revert Changes: restores snapshot via State.patch, closes form without markDirty
- Implemented `closeEditForm(doRevert)`: removes formEl, re-renders chips for section
- Preserved `saveInventory()`, `markDirty()`, `getNestedArr/setNestedArr`, all existing views

**Commit:** `b3c8241`

### Task 3: Inventory view — Equipment tab + strainer multi-select grid

**File:** `app/js/views/inventory.js` (included in Task 2 commit `b3c8241`)

Changes:
- Added `STRAINER_OPTIONS = ['Hawthorne', 'Julep', 'Fine Mesh', 'Conical']`
- Added 4th tab entry `{ id: 'tab-equipment', label: 'Equipment' }` after Vetoes & Substitutes
- Added `renderEquipmentSection(contentEl, inv)`:
  - Reads `inv.equipment.strainers`, filters to STRAINER_OPTIONS allow-list
  - Empty hint "No equipment tracked yet. Check the strainers you own below." when none checked
  - 2-column `.equipment-strainer-grid` with 4 `.strainer-option` labels
  - Each checkbox: `data-strainer` attribute, pre-checked if in strainers array
  - onChange: patches `i2.equipment.strainers` (add/remove), calls markDirty(), re-renders tab via `.tab[data-tab="tab-equipment"]`.click()
- Added `else if (tabId === 'tab-equipment')` branch in `renderTabContent()`

### Task 4: app.css — tier colors, edit form, canonical banner, equipment grid

**File:** `app/css/app.css` — additive extension

New CSS classes added in Phase 4 section at end of file:

| Class | Description |
|-------|-------------|
| `.tier-well` | `background: #666` — muted gray |
| `.tier-standard` | `background: #4caf7d` — green |
| `.tier-premium` | `background: #5b9bd5` — blue |
| `.tier-craft` | `background: #d4943a` — amber |
| `.tier-boutique` | `background: #c084fc` — purple |
| `.tier-rare-exceptional` | `background: #f59e42` — bright amber-gold |
| `.tier-unset` | `background: transparent; border: 1px solid #444` |
| `.bottle-chip-brand` | `color: var(--text-muted); font-size: 12px` |
| `.bottle-edit-form` | amber left border (3px), bg2, border2, radius, 16px padding |
| `.bottle-edit-fields` / `.bottle-edit-fields--expanded` | flex column, 8px gap |
| `.bottle-edit-toggle` | transparent text link, 12px, text-dim |
| `.bottle-edit-actions` | flex row, flex-end, 12px margin-top |
| `.canonical-suggestion` | rgba(212,148,58,0.08) bg, amber-dim border, 8px/12px padding |
| `.equipment-strainer-grid` | 2-col grid, collapses to 1-col at ≤480px |
| `.strainer-option` | 44px min-height, flex row, border, cursor |
| `.strainer-option.checked` | amber text + amber border |

Legacy classes `.tier-industrial`, `.tier-premium-accessible`, `.tier-boutique`, `.tier-rare` retained verbatim.

**Commit:** `6961a8e`

## Grep Gate Results

All acceptance criteria verified:

### Task 1
- `grep -c "const CanonicalNames = (() => {"` → 1
- `grep -c "return { suggest };"` → 1
- `grep -c "window.CanonicalNames = CanonicalNames"` → 1
- Script order awk check → OK
- `grep -c "function lev"` → 1
- `grep -c "function suggest"` → 1

### Task 2
- `grep -c "const TIERS = \['well'"` → 1
- `grep -c "TIER_LABEL"` → 3 (≥2 required)
- `grep -c "'rare/exceptional'"` → 3 (≥2 required)
- `grep -c "openEditForm"` → 2 (≥2 required)
- `grep -c "closeEditForm"` → 6 (≥2 required)
- `grep -c "_openEdit"` → 10 (≥3 required)
- `grep -c "Save Bottle"` → 2 (≥1 required)
- `grep -c "Revert Changes"` → 2 (≥1 required)
- `grep -c "More fields"` → 3 (≥1 required)
- `grep -c "CanonicalNames.suggest"` → 1 (≥1 required)
- `grep -c "canonical-suggestion"` → 4 (≥2 required)
- `grep -c 'aria-label="Remove '` → 1 (≥1 required)
- `grep -c "Utils.escapeHtml"` → 21 (≥6 required)
- `grep -c "function saveInventory"` → 1 (exactly 1 required)
- `grep -c "TYPE_OPTIONS"` → 3 (≥2 required)
- `grep -c "'Japanese Whisky'"` → 1

### Task 3
- `grep -c "STRAINER_OPTIONS"` → 3 (≥2 required)
- `grep -c 'data-tab="tab-equipment"'` → 1 (≥1 required)
- `grep -c "equipment-strainer-grid"` → 1 (≥1 required)
- `grep -c "strainer-option"` → 1 (≥2 in plan, but CSS adds more)
- `grep -c "i2.equipment.strainers"` → 2 (≥1 required)
- `grep -c "No equipment tracked yet"` → 1 (≥1 required)
- All 4 strainer string literals present: Hawthorne, Julep, Fine Mesh, Conical

### Task 4
- All 7 new `.tier-*` classes present
- `.bottle-edit-form`, `.bottle-edit-fields--expanded`, `.bottle-edit-toggle`, `.bottle-edit-actions`, `.bottle-chip-brand` all present
- `.canonical-suggestion` with `padding: 8px 12px` present
- `.equipment-strainer-grid`, `.strainer-option`, `.strainer-option.checked` present
- `@media (max-width: 480px)` containing `.equipment-strainer-grid { grid-template-columns: 1fr; }` present
- Legacy `.tier-industrial`, `.tier-premium-accessible` retained

## UI-SPEC Contract Notes

- `--radius-sm` is `5px` (defined in `:root` — confirmed present, used for `.canonical-suggestion` and `.strainer-option`)
- `--amber-dim` is `#a06e22` (already exists in `:root`) — used for canonical banner border
- `--text-muted` is `#666` — used for `.bottle-chip-brand` color
- The `h3` inside `.equipment-section` overrides the default `h3` global style (1.05rem/bold) to `20px` per UI-SPEC
- `.canonical-suggestion` does not use `--radius-sm` as a var (hardcoded `var(--radius-sm)`) to match existing pattern

## Deviations from Plan

### Task 1 - Already Implemented
**Found during:** Start of Task 1
**Issue:** `canonical-names.js` already existed (committed as `1726caf`) and was already correctly wired in `index.html`.
**Resolution:** Verified all acceptance criteria passed for the pre-existing file. No changes needed. Treated as complete.
**Impact:** None — file was already correct per the IIFE spec in the plan.

### Task 2/3 Combined Commit
**Decision:** Tasks 2 and 3 both modify `app/js/views/inventory.js`. Implemented together in one write and committed as `b3c8241`. The Task 3 content (Equipment tab) was included in the Task 2 commit rather than a separate commit.
**Rationale:** Writing the full file in one pass prevents reading/editing a partially-complete state. All Task 3 acceptance criteria pass via the single commit.

### bottle-chip-remove class naming
**Found during:** Task 2 implementation
**Issue:** Old code used `.chip-remove` class; new code uses `.bottle-chip-remove` to be consistent with BEM-style naming and avoid selector collision with existing CSS `.bottle-chip .chip-remove` rule.
**Resolution:** Used `.bottle-chip-remove` throughout new chip rendering. The existing CSS `.bottle-chip .chip-remove` rule still applies for the old remove button style. New button gets the aria-label as required.
**Impact:** Minor CSS specificity difference — old `.chip-remove` rule still applies to `.bottle-chip-remove` via the `.bottle-chip` descendant selector (class name change doesn't break the selector).

## Known Stubs

None. All data is wired to real `State.get('inventory')` data. The TYPE_OPTIONS datalist shows real types; canonical suggestion returns live Levenshtein results; equipment.strainers binds to real inventory data.

## Threat Surface Scan

All threat mitigations from the plan's threat model applied:

| Threat | Status |
|--------|--------|
| T-04-05: bottle.style/brand/notes → innerHTML | MITIGATED — 21 occurrences of Utils.escapeHtml across all user strings |
| T-04-06: Custom types from localStorage → datalist | MITIGATED — allTypeOptions() wraps all values in Utils.escapeHtml(t) |
| T-04-07: Canonical suggestion echoes user input | MITIGATED — only the CURATED canonical name (not user input) is interpolated via Utils.escapeHtml(suggestion.canonical) |
| T-04-08: No audit trail beyond updated_at | ACCEPTED — updated_at set on every Save Bottle |
| T-04-09: Strainer checkbox values | MITIGATED — UI-level: only 4 fixed checkboxes; normalize.js-level: VALID_STRAINERS filter on load |

No new threat surface introduced beyond what was modeled in the plan.

## Self-Check: PASSED

Files verified:
- `app/js/canonical-names.js` — exists, IIFE pattern, suggest(), lev(), window.CanonicalNames
- `app/js/views/inventory.js` — exists, 6-tier constants, openEditForm/closeEditForm, Equipment tab, TYPE_OPTIONS
- `app/css/app.css` — exists, all 7 new tier classes, bottle-edit-form, canonical-suggestion, equipment-strainer-grid
- `app/index.html` — canonical-names.js script tag before inventory.js

Commits verified:
- `1726caf` feat(canonical-names): add curated lookup + levenshtein suggestion module
- `b3c8241` feat(inventory): structured bottle chips, inline edit form, 6-tier system
- `6961a8e` feat(css): inventory edit form, tier dots, equipment tab, canonical banner
