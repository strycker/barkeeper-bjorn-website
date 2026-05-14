# Phase 4: Inventory & Recommender Depth — Context

**Gathered:** 2026-05-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Upgrade inventory bottles from simple objects to fully structured entries with in-place editing and an expanded tier system; add bar equipment tracking (strainers); make the recommender session-aware via per-session mood sliders, configurable missing-ingredient scope, and occasion tag filters; and introduce canonical name suggestions to prevent inventory drift.

**In scope:** INV-03–07 (bottle schema upgrade, edit popover, tier system, strainer field, canonical names), REC-01–03 (mood sliders, scope toggle, occasion filter)
**Out of scope:** AI-powered features, Supabase migration, community features, Phase 5+ full undo history

</domain>

<decisions>
## Implementation Decisions

### Bottle Object Schema (INV-03, INV-05)

- **D-01: New bottleEntry shape** — `{ type, brand, style, tier, best_for, notes, created_at, updated_at }`. Minimum to add a bottle is `style` + `type`; all other fields optional. The chip displays `style` (e.g. "Bourbon") with `brand` as secondary info.
- **D-02: Type field** — Appendable enum with a dropdown of standard categories (Bourbon, Rye, Scotch, Gin, Vodka, Rum, Tequila, Mezcal, etc.) plus an "Add new category type" option that lets users define their own. Presented as a single input with a dropdown — not two separate fields.
- **D-03: `best_for` retained** — Keep `best_for` (sipping/mixing/both) in the schema as an optional field shown in the edit form expand section. Null/empty is acceptable.
- **D-04: Timestamps** — Every `bottleEntry` gets `created_at` and `updated_at` ISO timestamps. Set on add; `updated_at` refreshed on every edit save.
- **D-05: Tier system** — 6 tiers replacing old 4: `Well → Standard → Premium → Craft → Boutique → Rare/Exceptional`. Old tier values (`industrial`, `premium-accessible`, `boutique`, `rare/exceptional`) are cleared on migration write; user re-tags manually via edit form.
- **D-06: One-time migration write** — On first `State.save('inventory')` after the upgrade, all entries are normalized to the new shape: old `{ name }` → `{ style: name }`, old tier values cleared. Planner must follow the sequential `State.save()` pattern from `settings.js:289–302` to avoid SHA conflicts.

### Edit Form UX (INV-04)

- **D-07: Inline expand below chip grid** — Clicking a bottle chip expands an edit form inline below the chip grid for that section. No modal, no overlay, no z-index issues.
- **D-08: Default visible fields** — `style` and `type` only. An "Expand" toggle reveals `brand`, `tier`, `best_for`, and `notes`.
- **D-09: Save + Revert buttons** — Explicit Save button (patches State, marks dirty; the existing sticky "Save to GitHub" bar handles the GitHub write). Revert button restores a snapshot of the entry values captured when the form was opened.
- **D-10: Revert scope** — Revert restores to the snapshot at form-open time (not full undo history). Full multi-level undo is deferred to backlog.

### Strainer Field (INV-06)

- **D-11: Data location** — New top-level `equipment` object in `inventory.json`: `{ strainers: ['Hawthorne', 'Fine Mesh'] }`. Four canonical options: Hawthorne, Julep, Fine Mesh, Conical.
- **D-12: UI location** — New "Equipment" tab in the Inventory view alongside Spirits, Pantry, Vetoes. Strainer multi-select checkbox grid lives there. Tab is extensible for future equipment fields.

### Recommender Session State (REC-01, REC-02, REC-03)

- **D-13: Mood sliders** — 6-axis sliders (sweetness, acid, strength, complexity, season, risk) at the top of the Recommender page. Pre-loaded from saved profile on page load.
- **D-14: Slider re-ranking** — Results re-rank on `onchange` (slider release), not on every `oninput` drag.
- **D-15: Slider persistence** — Sliders reset to saved profile values when the user navigates away and returns. No sessionStorage persistence.
- **D-16: "Save changes to profile" button** — A button on the Recommender page saves current slider positions to the user's profile (calls `State.save('profile')`).
- **D-17: Scope toggle (cumulative)** — Three levels: "Only what I have" shows buildable only; "Allow 1 missing" adds a one-away section below; "Allow 2 missing" adds a two-away section below that. Each level adds a section cumulatively — not a tab swap.
- **D-18: Two-away cards** — Each two-away recipe card shows both missing ingredients with individual "Add to shopping list" links for each.
- **D-19: Occasion filter** — Multi-select chip bar above results (same pattern as existing base-spirit filter). Occasion values are derived at runtime from the classics DB `recipe.occasion` strings.

### Recommender Page Layout

- **D-20: Responsive layout** — Desktop (wide viewport): sidebar layout with all controls (sliders, scope toggle, base-spirit chips, occasion chips) in a left column, recipe cards filling the right. Mobile: stacked controls above results. Implemented via CSS (media query breakpoint consistent with existing app patterns).
- **D-21: Mood sliders visibility** — Desktop: sliders always visible in sidebar. Mobile: sliders collapsed behind a "Adjust Mood" toggle button for a cleaner initial view.

### Canonical Name Matching (INV-07)

- **D-22: Matching strategy** — Curated lookup table + fuzzy edit-distance fallback. Curated entries take priority; fuzzy kicks in for unrecognized inputs.
- **D-23: Canonical name seed** — Seeded from classics DB ingredient names + hand-curated additions for common brands.
- **D-24: Suggestion UX** — Inline suggestion banner below the inventory input: "Did you mean: Angostura Bitters? [Use it]". Clicking "Use it" fills the input field with the canonical name.

### Recommender Engine Compatibility (INV-03 + recommender-engine.js)

- **D-25: Ingredient matching string** — For each `bottleEntry` object, the engine extracts `style` as the primary match string, `brand` as secondary. The `_buildLookup` extractor functions must be updated to handle both old strings (backward compat during transition) and new objects.

### Known Bugs

- **BUG-01 (hotfixed 2026-05-14):** The recommender engine's `lc` helper in `recommender-engine.js` was converting bottle objects to `"[object object]"` instead of extracting their `.name` field. This caused all object-format bottles (Bourbon, Gin, Japanese Whisky, etc.) to appear as missing in the one-away tab even when present in inventory. **Fix applied:** `lc` now extracts `s?.name` from objects before lowercasing. Planner must include a regression test in the Phase 4 test checklist verifying that bottles stored as `{name: "X"}` objects match correctly against the classics DB.

- **BUG-02 (open, to fix in Phase 4):** Recommender false positives — drinks are sometimes listed as buildable or one-away when the user is actually 2+ bottles away. Example reported 2026-05-14: a Scotch-based recipe appeared in "one bottle away" claiming the only missing ingredient was "Honey-Ginger Syrup," even though the user had no Scotch in inventory. Likely cause: overly broad keyword matching in `_hasIngredient` (e.g., keyword `"whisky"` matching a user's `"Japanese Whisky"` against a recipe that specifically needs Scotch). The substring `.includes()` match in `_hasIngredient` does not distinguish between spirit subtypes (Bourbon vs Rye vs Scotch vs Japanese Whisky are all "whiskey" but not interchangeable for many classic recipes). Planner must: (1) audit the classics DB ingredient keywords for over-broad terms, (2) decide whether to tighten keyword specificity, add a spirit-subtype guard in the engine, or both, (3) include false-positive regression tests in the Phase 4 test checklist.

- **BUG-03 (hotfixed 2026-05-14):** "Save failed: data/inventory.json does not match [sha]" after performing an import. Root cause was more nuanced than first noted: `State.save()` already updated `_shas[key]` correctly on success, but if an import threw mid-loop (network blip, partial response), the in-memory SHA was left stale while GitHub had already advanced its SHA, producing a permanent 409 trap. Same trap can occur with multi-tab edits or external file changes. **Fix applied:** `State.save()` now catches SHA-mismatch errors, calls `GitHubAPI.getFileSHA()` to refresh the cached SHA, and retries the write once. This makes saves resilient to any stale-SHA scenario, not just import-induced ones. Planner: include a regression test that simulates a stale SHA (e.g., manually clear `_shas[key]` and verify save still succeeds).

- **BUG-04 (hotfixed 2026-05-14):** Imports were writing data to GitHub without validating it against the schema, allowing legacy fields (`pantry: {}`, `barware: {}`) and renamed fields (`favorites` instead of canonical `confirmed_favorites`) to corrupt the canonical files. This caused multiple downstream issues: (1) `recipes.confirmed_favorites` was always empty in the UI because the data lived in `recipes.favorites`; (2) inventory sections expected by the schema and engine were missing entirely; (3) bottle entries lost timestamps the Phase 4 schema requires. **Fix applied:** new `app/js/normalize.js` module with idempotent normalizers per data file. Wired into `State.loadAll()` (normalizes data read from GitHub) and `State.set()` (normalizes data before persisting from imports). Drops unknown top-level keys, coerces strings → bottle objects, ensures all schema sections exist as the right type, migrates `recipes.favorites` → `confirmed_favorites`. Also re-aligned the on-disk `data/*.json` files to match canonical schema as a one-time repair. Planner: any further schema additions in Phase 4 (e.g., `equipment.strainers`, new bottle fields, 6-tier remap) MUST be reflected in `normalize.js` and accompanied by regression tests for legacy-shape inputs.

### Claude's Discretion

- Exact edit-distance threshold for fuzzy canonical name matching (recommend Levenshtein ≤ 2 for short tokens, ≤ 3 for longer ones)
- CSS breakpoint for desktop/mobile layout switch (follow existing app.css patterns)
- Type enum seed list composition (standard spirits + common liqueur categories)
- Animation/transition on inline edit form expand/collapse

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schema & Data Model
- `schema/inventory.schema.json` — Current bottleEntry definition; must be updated to the new shape with D-01 fields. The `spiritCategory` and `bottleEntry` definitions are the migration targets.

### Core Application Files
- `app/js/views/inventory.js` — Full inventory view; `renderBottleChips`, `renderBottleSection`, `TIERS`, `TIER_COLORS` constants all need updating for D-01, D-05, D-07, D-08.
- `app/js/recommender-engine.js` — `_buildLookup` extractors must handle new object shape per D-25; `_flavorScore` remains unchanged; `recommend()` needs two-away pass for D-17.
- `app/js/views/recommender.js` — Needs mood sliders, scope toggle, occasion filter chips, sidebar layout per D-13–D-21.

### Existing Patterns to Follow
- `app/js/views/settings.js:289–302` — Sequential `State.save()` pattern for migration write (D-06). **Must not use parallel saves.**
- `app/js/views/settings.js` — IIFE module pattern; dirty-state flow with sticky save bar (D-09 must follow the same pattern as `inv-save-bar`).

### New File to Create
- `app/js/canonical-names.js` — New IIFE module; curated lookup + fuzzy fallback (D-22, D-23, D-24).

### Project Constraints
- `.planning/PROJECT.md` §Constraints — Vanilla JS only, no build step, data compatibility (old string[] + new object[] must coexist during transition).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `renderBottleChips` / `renderBottleSection` in `inventory.js` — Extend rather than replace; chip click handler is the hook point for D-07 inline expand.
- `_scoreBar` + `_matchesFilter` in `recommender.js` — Reuse as-is; only the data pipeline and controls panel change.
- `inv-save-bar` sticky bar pattern — Reuse for all dirty-state handling in inventory edits (D-09).
- `Utils.showToast` — Existing toast for save confirmation; no new notification system needed.

### Established Patterns
- **IIFE module pattern** — All new files (`canonical-names.js`) must follow `const ModuleName = (() => { … return { … }; })();`
- **`State.patch()` + `markDirty()` + `State.save()`** — All inventory edits follow this three-step flow; never write directly to the JSON.
- **`getNestedArr` / `setNestedArr`** — Dot-notation helpers in `inventory.js`; reuse for new `equipment.strainers` path.
- **Tab pattern** — `tabs` + `tab-content` div swap; the new Equipment tab follows the exact same pattern as Spirits/Pantry/Vetoes.

### Integration Points
- `recommender-engine.js` `recommend()` → `recommender.js` render — Mood slider overrides pass a modified profile object into `recommend()`; engine is not aware of sliders directly.
- `State.get('inventory')` → `inventory.equipment.strainers` — New Equipment tab reads from and writes to this new path.
- `canonical-names.js` → `inventory.js` add-bottle input — `oninput` on the name/style field calls `CanonicalNames.suggest(value)` and renders the banner or clears it.

</code_context>

<specifics>
## Specific Ideas

- Mood slider "Save changes to profile" should call `State.save('profile')` and show a toast confirmation — same pattern as inventory save.
- Tier display on chips: a colored dot (existing `.bottle-tier-dot` CSS class + `TIER_COLORS` map) needs new entries for the 6 replacement tiers.
- The appendable type enum: seed list should be baked into `inventory.js` as a const array; when user adds a new type via "Add new category type", append it to the array and persist in `localStorage` (not GitHub — it's a UI preference, not bar data).
- Two-away section heading suggestion: "Two bottles away" to distinguish from "One bottle away."
- Inline edit form should have a subtle amber left-border accent (consistent with the app's amber theme) to visually anchor it to the chip it's editing.

</specifics>

<deferred>
## Deferred Ideas

- **Full multi-level undo history** — User requested this as a future capability. Add to roadmap backlog as Phase 5+ item. The timestamp fields (D-04) lay groundwork but full undo requires an in-memory or localStorage change stack.
- **Page-level inventory import** — Inventory page with its own targeted JSON import (captured in roadmap backlog from Phase 3 UAT).
- **Type enum persistence to GitHub** — For now, custom-added type categories live in localStorage only. Persisting them to `barkeeper.json` or a new config file is a future consideration.
- **Ingredient hierarchy / automatic derivations** — When the user has a base ingredient, the recommender should infer derived ingredients automatically: limes → lime juice, lemons → lemon juice, sugar → simple syrup, mint → muddled mint, eggs → egg white, etc. Currently the engine matches strictly by keyword, so having "limes" in produce does not satisfy a recipe calling for "lime juice." Requires a derivation map (base → set of derivable products) and engine pass that expands the lookup before matching. Captured 2026-05-14; deferred to Phase 5+ for discussion and design.

</deferred>

---

*Phase: 4-Inventory & Recommender Depth*
*Context gathered: 2026-05-14*
