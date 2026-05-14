# Phase 4: Inventory & Recommender Depth — Research

**Researched:** 2026-05-14
**Domain:** Vanilla JS SPA — bottle schema migration, inline edit UX, recommender engine extension, canonical name fuzzy matching
**Confidence:** HIGH (all findings verified against codebase; no external dependencies)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Bottle Object Schema (INV-03, INV-05)**
- D-01: New bottleEntry shape — `{ type, brand, style, tier, best_for, notes, created_at, updated_at }`. Minimum to add a bottle is `style` + `type`; all other fields optional. Chip displays `style` with `brand` as secondary info.
- D-02: Type field — appendable enum with dropdown of standard categories plus "Add new category type" option. Single input with dropdown — not two separate fields. Custom types persist to localStorage only.
- D-03: `best_for` retained — optional field shown in edit form expand section. Null/empty acceptable.
- D-04: Timestamps — every `bottleEntry` gets `created_at` and `updated_at` ISO timestamps. Set on add; `updated_at` refreshed on every edit save.
- D-05: Tier system — 6 tiers replacing old 4: `Well → Standard → Premium → Craft → Boutique → Rare/Exceptional`. Old tier values (`industrial`, `premium-accessible`, `boutique`, `rare/exceptional`) cleared on migration write.
- D-06: One-time migration write — on first `State.save('inventory')` after upgrade. Pattern: sequential `State.save()` from `settings.js:337–363`. Never parallel saves.

**Edit Form UX (INV-04)**
- D-07: Inline expand below chip grid — no modal, no overlay.
- D-08: Default visible fields — `style` and `type` only. "Expand" toggle reveals `brand`, `tier`, `best_for`, `notes`.
- D-09: Save + Revert buttons — Save patches State, marks dirty; sticky "Save to GitHub" bar handles GitHub write. Revert restores snapshot from form-open time.
- D-10: Revert scope — snapshot at form-open time only. No full undo history.

**Strainer Field (INV-06)**
- D-11: Data location — new top-level `equipment` object in `inventory.json`: `{ strainers: ['Hawthorne', 'Fine Mesh'] }`. Four canonical options: Hawthorne, Julep, Fine Mesh, Conical.
- D-12: UI location — new "Equipment" tab (4th tab) alongside Spirits, Pantry, Vetoes.

**Recommender Session State (REC-01, REC-02, REC-03)**
- D-13: Mood sliders — 6-axis sliders (sweetness, acid, strength, complexity, season, risk) at top of Recommender page. Pre-loaded from saved profile on page load.
- D-14: Slider re-ranking — results re-rank on `onchange` (slider release), not `oninput`.
- D-15: Slider persistence — resets to saved profile values on navigate away/return. No sessionStorage.
- D-16: "Save changes to profile" button — calls `State.save('profile')` and shows toast.
- D-17: Scope toggle (cumulative) — three levels: "Only what I have" / "Allow 1 missing" / "Allow 2 missing". Each level adds a section cumulatively — not a tab swap.
- D-18: Two-away cards — each card shows both missing ingredients with individual "Add to shopping list" links.
- D-19: Occasion filter — multi-select chip bar; values derived at runtime from `recipe.occasion` strings.

**Recommender Page Layout**
- D-20: Responsive layout — desktop (≥860px): 280px sidebar + 1fr main. Mobile: stacked.
- D-21: Mood sliders visibility — desktop always visible; mobile collapsed behind "Adjust Mood" toggle.

**Canonical Name Matching (INV-07)**
- D-22: Matching strategy — curated lookup table + fuzzy edit-distance fallback.
- D-23: Canonical name seed — from classics DB ingredient names + hand-curated brand additions.
- D-24: Suggestion UX — inline banner below inventory input: "Did you mean: Angostura Bitters? [Use it]".

**Recommender Engine Compatibility**
- D-25: `_buildLookup` extractors must handle both old `{name}` objects and new `{style, brand, ...}` objects. Engine extracts `style` as primary match string, `brand` as secondary.

### Claude's Discretion
- Exact edit-distance threshold for fuzzy canonical name matching (recommend Levenshtein ≤ 2 for inputs ≤ 6 chars, ≤ 3 for inputs > 6 chars)
- CSS breakpoint 860px for desktop/mobile layout switch
- Type enum seed list composition
- Animation/transition on inline edit form expand/collapse (none required per UI-SPEC)

### Deferred Ideas (OUT OF SCOPE)
- Full multi-level undo history
- Page-level inventory import
- Type enum persistence to GitHub
- Ingredient hierarchy / automatic derivations (limes → lime juice, etc.)
- Rich bar-owner-profile fields (background, archetypes)
- Equipment consolidation from profile/barkeeper into inventory only
- Numeric axis values in profile storage
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INV-03 | Clicking a bottle chip opens an in-place edit popover with individual fields | D-07/D-08/D-09: inline form below chip grid; snapshot + Save/Revert; `renderBottleChips` is the extension point |
| INV-04 | Tier options expanded to 6 tiers | D-05: new TIERS/TIER_COLORS constants; old tier CSS kept as backward-compat stubs |
| INV-05 | Barware strainers field uses multi-select checkboxes | D-11/D-12: `equipment.strainers` in JSON; new Equipment tab following existing tab pattern |
| INV-06 | Recommender engine normalizes bottle entries for keyword matching | D-25: `lc` helper already updated (BUG-01 hotfix); `_buildLookup` needs `style`-first extraction |
| INV-07 | Canonical name suggestions to prevent inventory drift | D-22/D-23/D-24: new `canonical-names.js` IIFE module; Levenshtein ≤ 2/3; banner UX |
| REC-01 | 6-axis mood sliders pre-loaded from profile | D-13/D-14/D-16: slider panel in sidebar; `onchange` re-ranks; "Save to Profile" button |
| REC-02 | Scope control for 0/1/2 missing ingredients | D-17: cumulative sections; scope toggle replaces tab-swap; engine needs two-away pass |
| REC-03 | Occasion tag filter chips | D-19: derived at runtime from `recipe.occasion`; multi-select OR logic; same `.rec-filter-chip` pattern |
</phase_requirements>

---

## Summary

Phase 4 is a pure vanilla JS upgrade spanning three systems: (1) the inventory data model and edit UX, (2) the recommender engine and view, and (3) a new canonical-name matching utility. No external dependencies are introduced. All changes are brownfield extensions to existing IIFE modules — no new frameworks, no npm, no build step.

The inventory side requires upgrading the bottleEntry schema from `{name, tier, ...}` to `{style, type, brand, tier, best_for, notes, created_at, updated_at}`, with a one-time migration write that follows the sequential `State.save()` pattern already established in `settings.js:337–363`. The chip-click inline edit form is the most complex UI piece: it must manage a snapshot for Revert, a one-at-a-time open rule, and dirty-state propagation to the existing sticky save bar. The Equipment tab is additive and follows the exact existing tab pattern.

The recommender side requires: (a) fixing BUG-02 (spirit-subtype false positives) in the engine, (b) extending `recommend()` to return a `twoAway` list alongside `buildable` and `oneAway`, (c) replacing the two-tab layout with a cumulative scope-section layout driven by a segmented control, and (d) adding mood sliders (reading from profile, re-running the engine on `onchange`) and occasion filter chips (derived from DB data). The desktop sidebar layout is a new CSS grid pattern with a 860px breakpoint.

**Primary recommendation:** Plan in two waves — Wave 1 covers the engine bug fix + schema + normalize.js + migration (no UI risk); Wave 2 covers inventory UX (inline edit, Equipment tab, canonical names) and recommender UX (sliders, scope, occasion). This sequencing means engine correctness is verified before the new UI depends on it.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| bottleEntry schema migration | Browser / Client | — | `Normalize.inventory()` runs client-side on load; one-time write via `State.save()` |
| Inline edit form (INV-03) | Browser / Client | — | DOM manipulation in `inventory.js`; State.patch() for in-memory update |
| Equipment tab + strainers | Browser / Client | — | New tab in existing tab-swap pattern; reads/writes `inventory.equipment.strainers` |
| Canonical name matching | Browser / Client | — | `canonical-names.js` IIFE; Levenshtein computed in-browser; no server call |
| Mood sliders | Browser / Client | — | Session state only; ephemeral profile object passed to engine |
| Scope toggle + two-away engine pass | Browser / Client | — | Engine logic in `recommender-engine.js`; view renders cumulative sections |
| Occasion filter | Browser / Client | — | Filter derived at render time from CLASSICS_DB; no persistence needed |
| BUG-02 fix (spirit-subtype guard) | Browser / Client | — | `_hasIngredient()` logic in `recommender-engine.js`; keyword audit in `classics-db.js` |
| Data persistence | CDN / Static (GitHub) | — | All writes go through `State.save()` → `GitHubAPI.writeJSON()` |

---

## Standard Stack

No external libraries are introduced. All code is vanilla ES6+.

### Core (existing — verified against codebase)

| Module | File | Purpose | Phase 4 Change |
|--------|------|---------|----------------|
| InventoryView | `app/js/views/inventory.js` | Bottle chip grid, tab layout, dirty-state save bar | Extend for inline edit, Equipment tab, new schema fields |
| RecommenderEngine | `app/js/recommender-engine.js` | Ingredient matching, flavor scoring | Add two-away pass; fix `_hasIngredient` subtype guard; update `_buildLookup` extractors |
| RecommenderView | `app/js/views/recommender.js` | Results render, filter chips | Replace tab-swap with cumulative sections; add sidebar layout, sliders, occasion chips |
| Normalize | `app/js/normalize.js` | Idempotent schema coercers on load/import | Add `equipment.strainers` normalization; update `coerceBottle` for new `style`/`type` fields; update `INVENTORY_KEYS` |
| State | `app/js/state.js` | Central data store, GitHub write, SHA retry | No changes needed — patterns already correct |
| Utils | `app/js/utils.js` | DOM helpers, toast | No changes needed |

### New File to Create

| Module | File | Purpose |
|--------|------|---------|
| CanonicalNames | `app/js/canonical-names.js` | Curated lookup + Levenshtein fallback for bottle name suggestions |

### Alternatives Considered

| Instead of | Could Use | Why Standard Wins |
|------------|-----------|-------------------|
| Custom Levenshtein | `fastest-levenshtein` npm | No npm allowed; hand-rolled Levenshtein is ~20 lines and sufficient for ≤30-char strings |
| sessionStorage for slider state | In-memory module variable | D-15 explicitly requires reset on navigate-away; module variable achieves this naturally |
| Modal for edit form | Inline DOM expansion | D-07 explicitly requires no modal; inline avoids z-index complexity |

---

## Architecture Patterns

### System Architecture Diagram

```
User Action
    │
    ▼
inventory.js (InventoryView)
  ├── chip click → openEditForm(bottle, snapshot)
  │     ├── renders .bottle-edit-form below .bottle-grid
  │     ├── Save Bottle → State.patch('inventory', ...) → markDirty()
  │     └── Revert → restore snapshot, close form
  ├── add bottle → CanonicalNames.suggest(value) → banner render
  │     └── "Use it" → fill input with canonical name
  ├── Equipment tab → reads inventory.equipment.strainers
  │     └── checkbox toggle → State.patch → markDirty()
  └── "Save to GitHub" sticky bar → State.save('inventory') [sequential]
           └── Normalize.inventory() runs on write via State.set()

recommender.js (RecommenderView)
  ├── page load → read saved profile → populate sliders
  ├── slider onchange → build ephemeralProfile → RecommenderEngine.recommend(inv, ephemeralProfile)
  │     └── _rerender() → replace #rec-list innerHTML
  ├── scope toggle → set _scopeLevel (0/1/2) → _rerender()
  ├── occasion chip click → toggle _activeOccasions set → _rerender()
  └── "Save to Profile" → State.save('profile') → toast

RecommenderEngine.recommend(inventory, rawProfile)
  ├── _buildLookup(inv) → flat lookup per SECTION_MAP
  │     └── extractor now handles both {name} objects AND {style, brand, ...} objects
  ├── for each recipe in CLASSICS_DB:
  │     ├── veto check
  │     ├── _hasIngredient(lookup, ing) — with spirit-subtype guard
  │     └── missing.length → 0 → buildable / 1 → oneAway / 2 → twoAway
  └── returns { buildable, oneAway, twoAway }

State.save('inventory') [migration path]
  ├── Normalize.inventory() coerces all bottleEntry objects to {style, type, ...}
  ├── old tier values cleared (Well/Standard/... become null)
  └── sequential: one save at a time (never parallel)
```

### Recommended Project Structure

No new directories needed. New file lands alongside existing modules:

```
app/js/
├── canonical-names.js    # NEW — CanonicalNames IIFE module
├── classics-db.js        # MODIFY — keyword audit for BUG-02
├── normalize.js          # MODIFY — coerceBottle for new shape; equipment.strainers
├── recommender-engine.js # MODIFY — two-away pass; _hasIngredient guard; _buildLookup extractors
├── views/
│   ├── inventory.js      # MODIFY — inline edit form; Equipment tab; new TIERS/TIER_COLORS; add-bottle row
│   └── recommender.js    # MODIFY — scope sections; sliders; occasion chips; sidebar layout
app/css/
└── app.css               # MODIFY — new tier dot classes; bottle-edit-form; rec-layout; mood panel; equipment grid
schema/
└── inventory.schema.json # MODIFY — new bottleEntry definition; equipment object
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SHA conflict on save | Custom retry logic | Existing `State.save()` stale-SHA retry (BUG-03 fix already in state.js) | Already handles: catch → getFileSHA → retry once |
| Sequential writes | Promise.all() | `await State.save(key)` one at a time | `settings.js:337–363` is the canonical pattern; parallel writes cause 409 |
| Dirty-state UI | New notification system | Existing `#inv-save-bar` sticky bar pattern | Already wired; `markDirty()` shows it; discard hides it |
| Toast notifications | Custom alerts | `Utils.showToast(msg)` / `Utils.showToast(msg, 'error')` | Already present and styled |
| HTML escaping | Custom sanitizer | `Utils.escapeHtml(str)` | Already in utils.js; every user-supplied string must go through it |
| Dot-path array access | Custom object traversal | `getNestedArr(inv, dotKey)` / `setNestedArr(inv, dotKey, value)` | Already in `inventory.js`; supports `equipment.strainers` path as-is |

**Key insight:** The infrastructure for every new feature already exists. The risk is not missing-infrastructure — it is accidentally duplicating what's there or breaking the sequential-save discipline.

---

## BUG-02 Analysis: Spirit-Subtype False Positives

This is a critical correctness bug that must be fixed in this phase before the two-away scope adds more surface area for false positives.

### Root Cause (VERIFIED: codebase inspection)

`_hasIngredient()` uses `item.includes(kw)` — pure substring match. When a user has `{name: "Japanese Whisky"}`, `lc()` produces `"japanese whisky"`. The string `"japanese whisky".includes("whisky")` is `true`.

The Rob Roy recipe has:
```js
keywords: ['scotch', 'whisky', 'islay', 'speyside', 'highland', 'blended']
```

So `"japanese whisky"` matches keyword `"whisky"` — false positive. Japanese Whisky satisfies the Scotch requirement in the engine. The Penicillin recipe has the same issue (`keywords: ['scotch', 'whisky', 'blended']`).

**Affected recipes (VERIFIED: classics-db.js scan):**
- Rob Roy (id: `rob-roy`) — keywords include bare `'whisky'`
- Penicillin (id: `penicillin`) — keywords include bare `'whisky'`
- Japanese Whisky Highball (id: `whiskey-highball`) — keywords include bare `'whisky'` and `'whiskey'` — this is the reverse: a Japanese Whisky recipe would also match on any Bourbon/Rye bottle containing `"whiskey"` [VERIFIED]

**Recipes with broad `'whiskey'` or `'whisky'` that are NOT subtype-specific (safe to keep broad):**
- Old Fashioned: `['bourbon', 'rye', 'whiskey', 'whisky']` — explicitly allows either, so broad is correct
- Manhattan: `['rye', 'bourbon', 'whiskey', 'whisky']` — explicitly allows either, correct
- Boulevardier: `['bourbon', 'rye', 'whiskey']` — correct; recipe tolerates both
- Whiskey Sour, Gold Rush, Whiskey Smash: all list `'bourbon'` as primary, broad `'whiskey'` as secondary — recipe note indicates tolerance

**Fix strategy (two-part, recommended):**

1. **Keyword tightening in classics-db.js:** For recipes that specifically require Scotch (Rob Roy, Penicillin), remove the bare `'whisky'` from keywords. Keep `'scotch'`, `'islay'`, `'speyside'`, `'highland'`, `'blended'`. This is the safest fix — it does not change the engine logic.

2. **Spirit-subtype guard in `_hasIngredient()`:** Add a guard: if the ingredient name contains `"scotch"` (case-insensitive), verify that the matching inventory item also contains `"scotch"` or a Scotch region keyword — not just any whisky/whiskey. This is more robust for future DB additions. The guard fires only when the ingredient name contains a specific subtype token (`"scotch"`, `"rye"`, `"bourbon"`, `"japanese"`).

**Recommended implementation:** Apply both fixes. Tighten the keywords in the DB (targeted, auditable change), and add a subtype-aware check in `_hasIngredient()` as a safety net for future recipes.

**Regression tests required:**
- Japanese Whisky in inventory does NOT satisfy Rob Roy's Scotch requirement
- Japanese Whisky in inventory DOES satisfy Japanese Whisky Highball requirement
- Bourbon satisfies "Bourbon or Rye" ingredient (broad match must still work)
- BUG-01 regression: `{name: "Bourbon"}` object correctly matches `'bourbon'` keyword

---

## Common Pitfalls

### Pitfall 1: Parallel State.save() Calls

**What goes wrong:** Two `State.save()` calls fire before the first returns — the second uses a stale SHA and GitHub returns 409.

**Why it happens:** Developers use `Promise.all([State.save('inventory'), State.save('profile')])` for brevity.

**How to avoid:** Always `await State.save(key)` sequentially. The migration write that touches only `'inventory'` is safe. If a future task needs to save two keys (e.g., profile after mood slider save), they must be sequential.

**Warning signs:** "Save failed: does not match [sha]" toast immediately after a multi-save operation.

### Pitfall 2: Mutating State Directly Instead of Using patch()

**What goes wrong:** Code modifies `State.get('inventory').base_spirits.whiskey.push(...)` and the change is visible in memory but the dirty flag is never set and `notify()` is never called.

**Why it happens:** `State.get()` returns the live object reference. Direct mutation bypasses the notify cycle.

**How to avoid:** Always use `State.patch('inventory', inv => { inv.base_spirits.whiskey.push(bottle); })` or modify via the local `inv` variable captured at render time and call `markDirty()` explicitly (the current `inventory.js` pattern — this is acceptable because the view holds the live reference).

**Warning signs:** Changes visible in UI not persisting to GitHub; no "Unsaved changes" bar appearing.

### Pitfall 3: Inline Edit Form Not Closing on Second Chip Click

**What goes wrong:** User clicks chip A (form opens), then clicks chip B — two forms open simultaneously, both writing to State independently.

**Why it happens:** Chip click handler opens a new form without checking if one is already open.

**How to avoid:** Module-level variable `_openEditForm` (the DOM element or the bottle idx). Before opening a new form, call `_closeOpenForm()` (which does NOT save — it silently discards per D-10 one-at-a-time rule).

**Warning signs:** Two `.bottle-edit-form` elements in the DOM at the same time.

### Pitfall 4: normalize.js Not Updated for New Schema Fields

**What goes wrong:** `Normalize.inventory()` doesn't know about `style`, `type`, `brand`, `created_at`, `updated_at` — it either strips them (if they're not in the allowed-keys whitelist) or fails to coerce old `{name}` entries to the new shape.

**Why it happens:** BUG-04 fix added `Normalize`, but it predates Phase 4's schema changes.

**How to avoid:** Update `coerceBottle()` to: (a) preserve all new fields if already present, (b) migrate `{name: str}` → `{style: str, created_at: ..., updated_at: ...}`, (c) map old tier values (`'industrial'` → `null`, `'premium-accessible'` → `null`, `'boutique'` → `null`, `'rare/exceptional'` → `null`) so they are cleared as per D-05. Also update `equipment` normalization from the current stub to fully coerce `equipment.strainers` as an array of valid canonical strings.

**Warning signs:** Import of a Phase-3 export breaking after Phase-4 deploy; strainer values disappearing on reload.

### Pitfall 5: `occasion` Field in DB is Prose, Not a Tag

**What goes wrong:** REC-03 occasion filter tries to use `recipe.occasion` as a short chip label but the field is a full descriptive sentence ("The gold-standard evening sipper. Spirit-forward, minimal intervention."), not a tag like "After dinner".

**Why it happens (VERIFIED: classics-db.js inspection):** The `occasion` field in the DB contains prose descriptions, not enumerated tag values. The 62 recipes that have `occasion` all use sentence-form descriptions.

**Impact on D-19:** Deriving occasion chips "at runtime from `recipe.occasion` strings" will not produce usable chip labels from the raw values — they're too long and not de-duplicatable.

**Resolution required:** One of:
- (a) Add a separate `tags` array to each classics-db recipe with enumerated values (`["aperitif", "after-dinner", "party", "refreshing", "cozy", "brunch"]`), OR
- (b) Derive occasion chips from `recipe.base` (spirit type) instead — but this duplicates the base-spirit filter that already exists, OR
- (c) Implement a `recipe.occasion` → tag extraction heuristic (keyword scan of the prose for "after dinner", "aperitif", "party", "brunch", etc.)

**Recommended:** Option (a) — add a `tags` array to each classics-db recipe. This is a one-time DB edit, keeps the data clean, and makes the filter genuinely useful. The planner must include a task for this DB update in Wave 1 before the occasion filter UI is built in Wave 2.

This is a CRITICAL planning blocker — the implementation approach for REC-03 depends on resolving this. [VERIFIED: classics-db.js]

### Pitfall 6: `lc()` Helper Handling New bottleEntry Shape

**What goes wrong:** After D-01 migration, bottle entries are `{style, brand, type, ...}` — no longer `{name}`. The current `lc()` helper in `recommender-engine.js` extracts `s?.name` for objects (BUG-01 fix). After Phase 4, `s?.name` will be undefined for new-shape entries; `lc()` will fall back to `String(s)` which produces `"[object Object]"`.

**Why it happens:** BUG-01 fixed `lc` for `{name}` objects. D-25 requires the engine to handle both `{name}` (old) and `{style, brand}` (new).

**How to avoid:** Update `lc()` to: `(typeof s === 'string' ? s : (s?.style ?? s?.name ?? String(s ?? ''))).toLowerCase()`. This handles all three cases: strings, old `{name}` objects, new `{style}` objects.

**Warning signs:** All inventory bottles show as missing in recommender after migration.

### Pitfall 7: Levenshtein on Long Strings is Slow

**What goes wrong:** `CanonicalNames.suggest()` is called on every `oninput` keystroke. If the canonical name list has 200+ entries and Levenshtein runs O(mn) on each, the UI stutters on slow devices.

**Why it happens:** Edit-distance is O(m×n) per pair; naively iterating all candidates multiplies this.

**How to avoid:** Apply a fast pre-filter before running Levenshtein: (a) skip candidates whose length differs from input by more than the threshold, (b) debounce `oninput` by one rAF frame (or 100ms), (c) curated lookup table is checked first (hash lookup — O(1)), Levenshtein only runs if curated lookup misses.

---

## Code Examples

### Pattern 1: Extending lc() for New bottleEntry Shape (D-25)

```js
// Source: recommender-engine.js (current) — update this line
// Before (BUG-01 fix, handles {name} only):
const lc = s => (typeof s === 'string' ? s : (s?.name ?? String(s ?? ''))).toLowerCase();

// After (handles strings, {name} objects, AND new {style, brand} objects):
const lc = s => (typeof s === 'string' ? s : (s?.style ?? s?.name ?? String(s ?? ''))).toLowerCase();
```
[VERIFIED: recommender-engine.js line 5]

### Pattern 2: Sequential State.save() — Migration Write (D-06)

```js
// Source: settings.js lines 337–363 (the canonical reference)
// Migration write triggered on first State.save('inventory') after Phase 4 deploy:
// In the saveInventory() function, before calling State.save, check if migration is needed.

async function saveInventory() {
  const inv = State.get('inventory');
  // Normalize.inventory() already coerces old shapes on load via State._normalize()
  // The migration write happens automatically because normalize.js coerces on every
  // State.set() and State._normalize() call. The first save after deploy writes the
  // coerced data to GitHub, completing the migration.
  inv.last_updated = Utils.today();
  try {
    await State.save('inventory', 'Update inventory via Barkeeper Bjorn web UI');
    // ... success handling
  } catch (err) {
    Utils.showToast(`Save failed: ${err.message}`, 'error');
  }
}
```
[VERIFIED: inventory.js:208–220, settings.js:337–363]

### Pattern 3: Inline Edit Form Snapshot Pattern (D-09, D-10)

```js
// Capture snapshot when form opens
function openEditForm(grid, bottle, idx, sectionKey, inv) {
  // Close any open form first (one-at-a-time rule)
  closeOpenForm();

  const snapshot = JSON.parse(JSON.stringify(bottle)); // deep copy

  const form = document.createElement('div');
  form.className = 'bottle-edit-form';
  // ... build form HTML

  form.querySelector('.save-btn').addEventListener('click', () => {
    // Apply edits to bottle object in inv array
    bottle.style = form.querySelector('[name=style]').value.trim();
    bottle.updated_at = new Date().toISOString();
    // ... other fields
    markDirty(); // shows #inv-save-bar
    closeOpenForm();
    renderBottleChips(grid, getNestedArr(inv, sectionKey), sectionKey, inv);
  });

  form.querySelector('.revert-btn').addEventListener('click', () => {
    // Restore snapshot — replace bottle contents with snapshot
    Object.assign(bottle, snapshot);
    closeOpenForm();
    renderBottleChips(grid, getNestedArr(inv, sectionKey), sectionKey, inv);
  });

  grid.insertAdjacentElement('afterend', form);
  _openEditForm = form;
}
```
[ASSUMED — pattern derived from D-07/D-09/D-10 decisions and existing inventory.js structure]

### Pattern 4: Recommender Scope — Cumulative Section Render (D-17)

```js
// Source: recommender.js — replaces tab-swap logic
// _scopeLevel: 0 | 1 | 2
let _scopeLevel = 0;

function _rerender(container) {
  const listEl = container.querySelector('#rec-list');
  if (!listEl || !_results) return;

  let html = '';

  // Level 0: always shown
  html += _renderSection('You Can Make These', _results.buildable, false, 0);

  if (_scopeLevel >= 1) {
    html += _renderSection('One Bottle Away', _results.oneAway, 'oneaway', 1);
  }
  if (_scopeLevel >= 2) {
    html += _renderSection('Two Bottles Away', _results.twoAway, 'twoaway', 2);
  }

  listEl.innerHTML = html;
}
```
[ASSUMED — derived from D-17 decision and existing recommender.js render pattern]

### Pattern 5: CanonicalNames Module Skeleton (D-22, D-23, D-24)

```js
// Source: new file app/js/canonical-names.js
const CanonicalNames = (() => {
  // Curated lookup: lowercased variant → canonical form
  const CURATED = {
    'angostura': 'Angostura Bitters',
    'angosutra': 'Angostura Bitters', // common typo
    'cointreau':  'Cointreau',
    'triple sec': 'Cointreau',         // approximate
    // ... seeded from classics-db ingredient names
  };

  function levenshtein(a, b) { /* standard DP implementation */ }

  function suggest(input) {
    if (!input || input.length < 3) return null;
    const lc = input.toLowerCase();

    // 1. Curated lookup (O(1))
    if (CURATED[lc]) return CURATED[lc];

    // 2. Levenshtein fallback against curated values
    const threshold = lc.length <= 6 ? 2 : 3;
    let best = null, bestDist = Infinity;
    for (const [variant, canonical] of Object.entries(CURATED)) {
      const d = levenshtein(lc, variant);
      if (d < bestDist && d <= threshold) { bestDist = d; best = canonical; }
    }
    return best;
  }

  return { suggest };
})();
```
[ASSUMED — derived from D-22/D-23/D-24 decisions]

### Pattern 6: Existing Tab Pattern (for Equipment Tab, D-12)

```js
// Source: inventory.js lines 303–336 (existing tab setup)
// Equipment tab follows this exact pattern — add to tabs array:
const tabs = [
  { id: 'tab-spirits',   label: 'Spirits & Bottles' },
  { id: 'tab-pantry',    label: 'Pantry & Perishables' },
  { id: 'tab-vetoes',    label: 'Vetoes & Substitutes' },
  { id: 'tab-equipment', label: 'Equipment' },  // ADD THIS
];
// renderTabContent() switch gains a new case: 'tab-equipment' → renderEquipmentSection()
```
[VERIFIED: inventory.js:303–336]

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact on Phase 4 |
|--------------|------------------|--------------|-------------------|
| Flat string bottles `["Bourbon"]` | Object bottles `{name: "Bourbon"}` | Phase 2/3 (BUG-04 hotfix) | D-01 adds more fields to the object; migration is incremental |
| 4-tier enum in schema | 6-tier enum (D-05) | Phase 4 | Old tier CSS classes kept as backward compat stubs |
| Two-tab recommender (Buildable / One Away) | Cumulative scope sections (D-17) | Phase 4 | Recommender view render logic restructured |
| `.lc()` extracts `s?.name` | `.lc()` must extract `s?.style ?? s?.name` | Phase 4 | Critical for D-25 backward compat |
| `Normalize.coerceBottle` → `{name}` shape | Must coerce to `{style, type, ...}` shape | Phase 4 | normalize.js update required |

**Deprecated/outdated after this phase:**
- Old `TIERS` array and `TIER_COLORS` map in `inventory.js` — replaced by 6-tier versions. Keep old CSS classes (`.tier-industrial`, etc.) in app.css as stubs for any residual data during migration window.
- Old recommender `.rec-tabs` / `.rec-tab` pattern — replaced by `.rec-scope-toggle` + cumulative sections. Old tab CSS (`.rec-tabs`, `.rec-tab`) can be removed or repurposed as the scope toggle.

---

## Runtime State Inventory

> Phase 4 involves a schema migration — this section is required.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data (GitHub) | `data/inventory.json` — 13 bottle entries as `{name}` objects; 2 legacy top-level keys (`pantry: {}`, `barware: {}`) still present in on-disk JSON despite BUG-04 fix | `Normalize.inventory()` already strips `pantry`/`barware` on load; `coerceBottle` migration from `{name}` → `{style}` happens via normalize.js update + first State.save() write |
| Stored data (GitHub) | `schema/inventory.schema.json` — `bottleEntry` definition uses `name` as required field | Must be updated to require `style` instead; add `type`, `brand`, `tier`, `best_for`, `notes`, `created_at`, `updated_at` properties; update tier enum to 6 values; add `equipment.strainers` |
| Live service config | GitHub Pages / Netlify — static file serving only | No config change needed |
| OS-registered state | None | None |
| Secrets/env vars | `bb_token`, `bb_owner`, `bb_repo`, `bb_branch` in localStorage — no rename involved | None |
| Build artifacts | None — no build step | None |

**Specific inventory.json issues (VERIFIED: data/inventory.json):**
- `pantry: {}` and `barware: {}` are still present in the on-disk file (legacy keys). Normalize.inventory() will drop them on next load — but they persist in GitHub until next write.
- `unassigned: ["Bourbon"]` contains a duplicate of a whiskey entry — not a Phase 4 concern but worth noting.
- Bottles have old `tier: "premium-accessible"` (Cognac) — will be cleared to `null` by migration.

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — all Phase 4 code is vanilla JS running in the browser; GitHub API access is already wired via existing `github-api.js`; no CLI tools, no runtimes, no databases beyond GitHub).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Manual browser testing (no automated test framework detected) |
| Config file | `.planning/phases/04-inventory-recommender-depth/TEST-CHECKLIST.md` (to be created in Wave 0) |
| Quick run command | Open `http://localhost:8000/app/` and execute checklist items |
| Full suite command | Full checklist + cross-browser (Chrome + Firefox) |

No automated test framework (Jest, Vitest, etc.) exists in this project. [VERIFIED: directory listing — no test config files, no `tests/` directory, no `package.json`]. All validation is manual checklist-based, consistent with prior phases.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INV-03 | Click chip → inline edit form opens below grid | Manual UI | — | ❌ Wave 0 checklist |
| INV-03 | Save Bottle → State updated, dirty bar appears | Manual UI | — | ❌ Wave 0 checklist |
| INV-03 | Revert Changes → snapshot restored, form closes | Manual UI | — | ❌ Wave 0 checklist |
| INV-03 | Click 2nd chip while form open → first form closes, second opens | Manual UI | — | ❌ Wave 0 checklist |
| INV-04 | 6 tiers shown in tier select (Well/Standard/Premium/Craft/Boutique/Rare) | Manual UI | — | ❌ Wave 0 checklist |
| INV-04 | Old tier data (industrial, premium-accessible) cleared after first save | Manual UI | — | ❌ Wave 0 checklist |
| INV-05 | Equipment tab renders 4 strainer checkboxes | Manual UI | — | ❌ Wave 0 checklist |
| INV-05 | Checking strainer → marks dirty → Save persists to GitHub | Manual UI | — | ❌ Wave 0 checklist |
| INV-06 | Bottle `{name: "Bourbon"}` object still matches `'bourbon'` keyword in engine | Manual UI / console | — | ❌ Wave 0 checklist |
| INV-07 | Typing "angostura" → suggestion banner appears | Manual UI | — | ❌ Wave 0 checklist |
| INV-07 | "Use it" → fills input field with canonical name | Manual UI | — | ❌ Wave 0 checklist |
| REC-01 | Sliders pre-loaded from profile on Recommender page load | Manual UI | — | ❌ Wave 0 checklist |
| REC-01 | Slider drag-release → results re-rank | Manual UI | — | ❌ Wave 0 checklist |
| REC-01 | Navigate away and back → sliders reset to saved profile | Manual UI | — | ❌ Wave 0 checklist |
| REC-02 | Scope "Only what I have" shows buildable section only | Manual UI | — | ❌ Wave 0 checklist |
| REC-02 | Scope "Allow 1 missing" adds One Bottle Away section below | Manual UI | — | ❌ Wave 0 checklist |
| REC-02 | Scope "Allow 2 missing" adds Two Bottles Away section below | Manual UI | — | ❌ Wave 0 checklist |
| REC-03 | Occasion filter chips derived from DB data | Manual UI | — | ❌ Wave 0 checklist |
| REC-03 | Multi-select: two occasion chips active → OR logic | Manual UI | — | ❌ Wave 0 checklist |
| BUG-01 | `{name: "Bourbon"}` object matches Rob Roy Bourbon ingredient (regression) | Manual UI | — | ❌ Wave 0 checklist |
| BUG-02 | `{name: "Japanese Whisky"}` does NOT satisfy Rob Roy Scotch requirement | Manual UI | — | ❌ Wave 0 checklist |
| BUG-02 | `{name: "Japanese Whisky"}` DOES satisfy Japanese Whisky Highball requirement | Manual UI | — | ❌ Wave 0 checklist |
| BUG-03 | Stale SHA: manually clear `_shas['inventory']` in console → save still succeeds | Manual console | — | ❌ Wave 0 checklist |

### Sampling Rate

- **Per task commit:** Verify the specific behavior the task implements (1-3 checklist items)
- **Per wave merge:** Full checklist for that wave's requirements
- **Phase gate:** Complete checklist green + BUG-01/02/03 regressions verified before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `TEST-CHECKLIST.md` — all requirements above + bug regression items

---

## Project Constraints (from CLAUDE.md)

| Directive | Enforcement in Phase 4 |
|-----------|------------------------|
| Vanilla ES6+ only — no framework, no bundler, no npm | `canonical-names.js` Levenshtein is hand-rolled; no library imports anywhere |
| No build step — serve `app/` directly | All new JS files added via `<script>` tag in `app/index.html`; no compile step |
| All JS modules must follow IIFE pattern | `canonical-names.js` → `const CanonicalNames = (() => { ... return { ... }; })();` |
| normalize.js MUST be updated for any schema changes | Phase 4 schema changes (new bottleEntry fields, equipment.strainers) require normalize.js update |
| Sequential State.save() — never parallel | All multi-save operations (migration, mood-slider profile save) must be sequenced with await |
| SHA conflict prevention: follow stale-SHA retry pattern in state.js | Already implemented (BUG-03 fix); no new code needed — just don't bypass it |
| All user-supplied strings through Utils.escapeHtml() | Every new innerHTML that includes bottle names, brands, canonical suggestions must escape |
| `State.patch()` / `markDirty()` / `State.save()` three-step flow | Inline edit Save Bottle: patch + markDirty only; sticky bar handles save |
| CSS: extend `app/css/app.css` only; use existing custom properties | 18 new CSS classes (see UI-SPEC table); all use existing `--amber`, `--bg2`, etc. tokens |
| New views follow existing `render(container)` function signature | Not applicable — no new view routes in Phase 4; existing views extended |

---

## Open Questions

1. **Occasion filter chip labels (REC-03 critical blocker)**
   - What we know: `recipe.occasion` in classics-db.js is a prose description (VERIFIED), not a short tag
   - What's unclear: The UI-SPEC and CONTEXT.md D-19 say "derived at runtime from the classics DB `recipe.occasion` strings" — but the strings are too long and not de-duplicatable as chip labels
   - Recommendation: Planner should add a Wave 1 task to add a `tags` array to each classics-db recipe (e.g., `["aperitif", "after-dinner", "party", "refreshing", "cozy"]`). The occasion filter chips then derive from `recipe.tags` instead of `recipe.occasion`. This aligns with D-19's intent while being implementable.

2. **Type enum seed list**
   - What we know: D-02 calls for a dropdown of "standard categories" baked into inventory.js as a const array
   - What's unclear: The exact list is marked as Claude's Discretion in CONTEXT.md
   - Recommendation: Seed with — Bourbon, Rye, Scotch, Irish Whiskey, Japanese Whisky, Canadian Whisky, Cognac, Armagnac, Brandy, White Rum, Dark Rum, Aged Rum, Rhum Agricole, Blanco Tequila, Reposado Tequila, Añejo Tequila, Mezcal, Gin, Vodka, Aquavit, Calvados, Pisco, Vermouth (Sweet), Vermouth (Dry), Amaro, Campari, Aperol, Triple Sec, Maraschino, Falernum, Orgeat, Simple Syrup, Honey Syrup, Ginger Syrup. Approximately 35 items.

3. **`coerceBottle()` backward-compat during migration window**
   - What we know: Some users may have `{name: "X"}` entries (Phase 3 shape) and some may have new `{style: "X", type: "Y"}` entries (Phase 4 shape) in the same array simultaneously (during the transition after Phase 4 deploy but before first save)
   - What's unclear: How should `coerceBottle()` distinguish between "old {name} entry not yet migrated" vs "new {style} entry created by Phase 4 UI"?
   - Recommendation: If `style` is present → already migrated (preserve as-is). If only `name` is present → old format, set `style = name`. This is unambiguous because the new schema never writes a `name` field.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `CanonicalNames.suggest()` pattern with curated lookup + Levenshtein fallback | Code Examples §5 | Low — pattern is well-established; implementation detail only |
| A2 | Inline edit form snapshot + one-at-a-time close pattern | Code Examples §3 | Low — derived directly from D-07/D-09/D-10 decisions |
| A3 | Scope cumulative section render pattern | Code Examples §4 | Low — derived directly from D-17 decision |
| A4 | Type enum seed list of ~35 items | Open Questions §2 | Low — marked as Claude's Discretion; user can adjust |
| A5 | `recipe.tags` array is the right resolution for REC-03 occasion blocker | Open Questions §1 | Medium — if user prefers keyword-extracting the prose instead, plan changes slightly |

---

## Sources

### Primary (HIGH confidence — VERIFIED against codebase)

- `app/js/views/inventory.js` — full inventory view; TIERS, TIER_COLORS, tab pattern, renderBottleChips, dirty-state flow
- `app/js/recommender-engine.js` — full engine; lc(), _hasIngredient(), _buildLookup(), SECTION_MAP, recommend()
- `app/js/views/recommender.js` — full recommender view; tab-swap pattern, filter chips, _rerender(), _matchesFilter()
- `app/js/normalize.js` — full normalizer; coerceBottle(), INVENTORY_KEYS, equipment stub at line 126
- `app/js/state.js` — State.save() SHA retry (BUG-03 fix), State.patch(), State.set(), State._normalize()
- `app/js/views/settings.js:337–363` — canonical sequential save pattern
- `app/js/classics-db.js` — 75-recipe DB; occasion field is prose (not tags); whisky/whiskey keyword over-breadth for Rob Roy, Penicillin, Japanese Whisky Highball
- `app/css/app.css` — all existing CSS classes; .axis-slider already defined; .rec-filter-chip already defined; .tier-* classes
- `data/inventory.json` — current data shape; {name} objects; legacy pantry/barware keys still present
- `schema/inventory.schema.json` — current bottleEntry definition; 4-tier enum

### Secondary (MEDIUM confidence — from planning documents)

- `04-CONTEXT.md` — all 25 locked decisions D-01 through D-25
- `04-UI-SPEC.md` — complete component contracts, CSS class table, breakpoints, typography, color palette
- `.planning/STATE.md` — phase history, prior key decisions

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all files read directly; no external dependencies
- Architecture: HIGH — patterns verified in existing codebase
- BUG-02 analysis: HIGH — root cause traced to specific lines in classics-db.js and recommender-engine.js
- Pitfalls: HIGH — derived from verified code patterns and hotfix history
- Occasion field issue: HIGH — verified by reading all 62 occasion strings in classics-db.js
- CanonicalNames implementation: MEDIUM — shape is clear from decisions; exact implementation details are Claude's Discretion

**Research date:** 2026-05-14
**Valid until:** 2026-06-14 (stable vanilla JS codebase; no moving dependencies)
