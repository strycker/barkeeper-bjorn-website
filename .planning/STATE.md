# Project State: Barkeeper Bjorn

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-05-04)

**Core value:** The user's real-world bar inventory and flavor profile should power both AI-driven conversation and rule-based recommendations — seamlessly, whether in a chat session or the web app.

**Current focus:** Phase 4 — Inventory & Recommender Depth

---

## Phase Status

| Phase | Name | Status | Plans | Progress |
|-------|------|--------|-------|----------|
| 1 | Agent Instructions Polish | Shipped | 5 | 100% |
| 2 | Web UI UX & Settings | Shipped | 5 | 100% |
| 3 | Content Management | Shipped | 4 | 100% |
| 4 | Inventory & Recommender Depth | In Progress | 3 | 100% |
| 5 | AI Integration | Pending | — | 0% |
| 6 | Backend & Multi-User | Pending | — | 0% |
| 7 | Community, API & Multi-Agent | Pending | — | 0% |

---

## What's Already Shipped

The following capabilities exist in the codebase as of initialization and are tracked as Validated requirements in PROJECT.md:

- Full vanilla JS SPA (`app/`): Setup, Dashboard, Onboarding, Inventory, Recipes, Profile, Shopping, Recommender views
- GitHub Pages deployment (auto on push to `main`)
- 75-recipe classics DB with inventory matching and flavor scoring
- JSON schemas (`schema/`) and modular agent prompts (`instructions/`)
- Session-state template and analytics mode

---

## Phase 2 Plan Index

| Plan | Wave | Objective | Requirements | Files |
|------|------|-----------|--------------|-------|
| 02-00 | 0 | Create TEST-CHECKLIST.md | All 15 | .planning/phases/02-web-ui-ux-and-settings/TEST-CHECKLIST.md |
| 02-01 | 1 | Onboarding overhaul (17 steps, sliders, skip, inventory paste) | ONB-01–04, NAV-03 | app/js/views/onboarding.js, app/css/app.css |
| 02-02 | 1 | Dashboard hero + avatar + 7-item grid + nav gating | NAV-01–02, NAV-04–05 | app/js/views/dashboard.js, app/js/app.js, app/index.html, app/css/app.css |
| 02-03 | 2 | Settings page (4 sections, logout, reset) | SETTINGS-01–04, NAV-05 | app/js/views/settings.js |
| 02-04 | 2 | Inventory search + category filter | INV-01–02 | app/js/views/inventory.js, app/css/app.css |

Wave 1 plans (02-01, 02-02) are independent and can execute in parallel.
Wave 2 plans (02-03, 02-04) depend on Wave 1 completing first.

---

## Phase 3 Plan Index

| Plan | Wave | Objective | Requirements | Files |
|------|------|-----------|--------------|-------|
| 03-00 | 0 | Create TEST-CHECKLIST.md | RECIPE-01–05, EXPORT-01–04 | .planning/phases/03-content-management/TEST-CHECKLIST.md |
| 03-01 | 1 | Export/Import ZIP: drop zone, drag-and-drop, sequential writes, AI-context text | EXPORT-01–04 | app/js/export.js, app/js/views/settings.js, app/index.html, app/css/app.css |
| 03-02 | 1 | Recipe form: Utils.toast fixes, New Recipe button, D-02 validation, AI prompt scaffold | RECIPE-01–05 | app/js/views/recipes.js |
| 03-03 | 2 | AI integration: claude-api.js, AI Integration settings section, live Generate wiring | RECIPE-05 | app/js/claude-api.js, app/js/views/settings.js, app/js/views/recipes.js |

Wave 1 plans (03-01, 03-02) are independent and can execute in parallel.
Wave 2 plan (03-03) depends on both Wave 1 plans completing first (claude-api.js must exist; recipe form AI scaffold must be in place).

---

## Phase 4 Plan Index

| Plan | Wave | Objective | Requirements | Files |
|------|------|-----------|--------------|-------|
| 04-01 | 1 | Engine & schema foundation: normalize.js coerceBottle, recommender-engine lc()+subtype guard+twoAway, classics-db tags, schema update | INV-03, INV-04, INV-05, BUG-02 | app/js/normalize.js, app/js/recommender-engine.js, app/js/classics-db.js, schema/inventory.schema.json |
| 04-02 | 2 | Inventory UI: chip rendering for {style} shape, inline edit form, 6-tier system, Equipment tab, canonical-names module | INV-03, INV-04, INV-05, INV-06, INV-07 | app/js/views/inventory.js, app/js/canonical-names.js, app/css/app.css, app/index.html |
| 04-03 | 2 | Recommender UI: sidebar layout, mood sliders, scope toggle (cumulative sections + two-away cards), occasion filter chips | REC-01, REC-02, REC-03 | app/js/views/recommender.js, app/css/app.css |

Wave 1 plan (04-01) must complete before Wave 2.
Wave 2 plans (04-02, 04-03) are independent and can execute in parallel — they touch different files.

---

## Key Decisions (Phase 2)

- **inventory.unassigned** — inventory paste items from onboarding go to `inventory.unassigned` (new top-level array), NOT `inventory.spirits` (which does not exist as a flat array in the schema)
- **Sequential State.save()** — "Reset all data" in Settings must await each of the 4 saves sequentially to avoid GitHub API 409 SHA conflicts
- **No window.confirm()** — logout confirmation uses existing `.confirm-dialog` / `.confirm-dialog-overlay` CSS classes (lines 575–591 in app.css)
- **Image URLs at runtime** — all Bjorn avatar URLs constructed from `GitHubAPI.cfg()` at render time; never hardcoded
- **IIFE module pattern** — settings.js must follow `const SettingsView = (() => { function render(container) {…} return { render }; })();`
- **Search scope** — inventory search queries `.bottle-chip` scoped to `#tab-content`, not `document`

---

## Key Decisions (Phase 3)

- **D-01: In-place form replacement** — recipe form uses `renderForm(r, container)` replacing view content in-place; no `#recipes/new` route added
- **D-02: Save gate** — `name`, `creator`, ≥1 ingredient, and `method` are required; all other fields optional
- **D-03: Entry points** — "+ New Recipe" button in Recipe Book header; "Edit" button on recipe detail card
- **D-04: Image upload placement** — on recipe detail view below images section; not part of edit form
- **D-05: Image filename pattern** — `{id}_{timestamp}.{ext}` (e.g. `cocktail1234_1747000000000.jpg`)
- **D-06: Post-upload** — patch `recipe.images`, call `State.save('recipes')`, re-render images inline; raw GitHub URL
- **D-07: ZIP format** — export and import both use ZIP (overrides ROADMAP EXPORT-01 JSON bundle wording)
- **D-08: Import UX** — preview listing 4 files → single "Confirm Import" → sequential writes; no per-section checkboxes
- **D-09: Drop zone** — import supports file picker AND drag-and-drop; `dragover.preventDefault()` is mandatory
- **D-10: Settings placement** — Export/Import lives in existing `#sect-export` in settings.js; no new route
- **D-11: AI fields populated** — Anthropic populates: name, tagline, ingredients[], method, glassware, garnish, tasting_notes, suggested_occasions
- **D-12: AI prompt visibility** — AI prompt block rendered ONLY when `isNew === true`; not on edit form
- **D-13: Generate UX** — spinner on Generate button while in-flight; form fields populate inline on success; no streaming
- **D-14: Anthropic key storage** — `localStorage.bb_anthropic_key`; configured in new #sect-ai-key section in Settings
- **Utils.toast bug** — 8 broken call sites in recipes.js (lines ~264, 266, 405, 414, 548, 549, 613, 616) call non-existent `Utils.toast`; fixed in 03-02 → `Utils.showToast`
- **No duplicate script tag** — `app/js/export.js` already has a `<script>` tag in index.html at line 88; 03-01 adds JSZip CDN and claude-api.js tags only
- **Sequential State.save() for import** — canonical reference: settings.js:289–302 (Reset all data handler); ZIP import copies this pattern exactly

---

## Key Decisions (Phase 4)

- **D-01–D-06: Bottle schema** — new shape `{style, type, brand, tier, best_for, notes, created_at, updated_at}`; migration via normalize.js coerceBottle on next State.save('inventory'); old tier values cleared; sequential save pattern required
- **D-07–D-10: Edit form** — inline expand below chip grid (no modal); default-visible: style + type; expand toggle reveals brand/tier/best_for/notes; Save patches State + markDirty; Revert restores snapshot from form-open time
- **D-11–D-12: Strainer field** — `inventory.equipment.strainers` array; Equipment tab (4th) in inventory; 4 canonical options: Hawthorne, Julep, Fine Mesh, Conical
- **D-13–D-16: Mood sliders** — 6-axis (sweetness/acid/strength/complexity/season/risk) pre-loaded from profile; re-rank on onchange only; reset to saved on navigate; "Save to Profile" calls State.save('profile')
- **D-17–D-18: Scope toggle** — cumulative (not tab swap): level 0 = buildable only; level 1 adds one-away; level 2 adds two-away; two-away cards show both missing ingredients each with shopping-list link
- **D-19: Occasion filter** — multi-select OR logic; tags derived from CLASSICS_DB recipe.tags[] (fixed 10-tag taxonomy added by 04-01)
- **D-20–D-21: Recommender layout** — 280px sidebar + 1fr main at ≥860px; single column <860px; mobile sliders behind "Adjust Mood ▾" toggle
- **D-22–D-24: Canonical names** — new canonical-names.js IIFE; curated lookup + Levenshtein (≤2 for inputs ≤6 chars, ≤3 for longer); banner "Did you mean: X? [Use it]" below add-bottle input
- **D-25: Engine compat** — lc() extracts style first, name second; SUBTYPE_TOKENS guard prevents bare 'whisky' matching scotch-specific recipes
- **BUG-01 (hotfixed)** — lc() now extracts s?.name from objects; regression test required
- **BUG-02 (fix in 04-01)** — subtype guard in _hasIngredient; Rob Roy + Penicillin keywords tightened; broad-whiskey recipes left unchanged
- **BUG-03 (hotfixed)** — State.save() refreshes SHA on 409 and retries once
- **BUG-04 (hotfixed)** — normalize.js wired into State.loadAll() and State.set(); drops unknown keys, migrates favorites→confirmed_favorites

---

## Notes

- `gsd-sdk` is not installed; use `git commit` directly for doc commits
- CLAUDE.md preserved as-is (existing developer guidance)
- Phases 1–5 are sequential by preference but can overlap; Phases 6–7 are hard-sequenced

---
*State initialized: 2026-05-04*
*Last activity: 2026-05-15 — Phase 4 plan 04-03 complete. Recommender UI: two-column sidebar layout (280px + 1fr), 6-axis mood sliders pre-loading from profile with onchange re-ranking, cumulative scope toggle (0/1/2 missing bottles), two-away cards with dual shopping-list links, occasion chips multi-select from CLASSICS_DB tags. REC-01, REC-02, REC-03 all delivered. Phase 4 all 3 plans complete (04-01, 04-02, 04-03).*
