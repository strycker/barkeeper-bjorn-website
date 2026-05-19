# Project State: Barkeeper Bjorn

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-05-04)

**Core value:** The user's real-world bar inventory and flavor profile should power both AI-driven conversation and rule-based recommendations — seamlessly, whether in a chat session or the web app.

**Current focus:** Phase 5 — Polish, Depth & UX Tidy

---

## Phase Status

| Phase | Name | Status | Plans | Progress |
|-------|------|--------|-------|----------|
| 1 | Agent Instructions Polish | Shipped | 5 | 100% |
| 2 | Web UI UX & Settings | Shipped | 5 | 100% |
| 3 | Content Management | Shipped | 4 | 100% |
| 4 | Inventory & Recommender Depth | Shipped | 3 | 100% |
| 5 | Polish, Depth & UX Tidy | In Progress | 05-04 done | 100% |
| 6 | AI Integration | Pending | — | 0% |
| 7 | Portability | Pending | — | 0% |
| 8 | Backend & Multi-User | Pending | — | 0% |
| 9 | Community, API & Multi-Agent | Pending | — | 0% |

---

## What's Already Shipped

The following capabilities exist in the codebase as of Phase 4 completion:

- Full vanilla JS SPA (`app/`): Setup, Dashboard, Onboarding, Inventory, Recipes, Profile, Shopping, Recommender views
- GitHub Pages deployment (auto on push to `main`)
- 75-recipe classics DB with inventory matching, flavor scoring, cumulative scope sections, mood sliders, occasion filters
- Structured bottle objects `{style, type, brand, tier, best_for, notes}` with inline edit form and 6-tier system
- Equipment tab (Strainers) with multi-select checkboxes
- Canonical name suggestions (`canonical-names.js`) on inventory input
- JSON schemas (`schema/`) and modular agent prompts (`instructions/`)
- Session-state template and analytics mode
- `claude-api.js` (Phase 3) — basic Anthropic API call wrapper; key stored in `bb_anthropic_key`
- ZIP export/import with drag-and-drop; AI-context text export
- Recipe add/edit form; image upload to GitHub

---

## Phase 5 Plan Index

*(Plans to be created during plan-phase)*

| Plan | Wave | Objective | Requirements |
|------|------|-----------|--------------|
| 05-00 | 0 | Test checklist | All Phase 5 |
| 05-01 | 1 | Recommender UX — cumulative highlight, Unconstrained, Vetoes panel, Favorites/Wishlist, derivation map | REC-05–09 |
| 05-02 | 1 | Inventory depth — field rename + tooltips, nationality field, paste-a-line parser | INV-08–10 |
| 05-03 | 2 | Data model tidy — equipment consolidation, axis migration, rich profile fields | DATA-01–03 |
| 05-04 | 2 | Bartender Customization Wizard | CUST-01–02 |

Wave 1 plans (05-01, 05-02) are independent and can execute in parallel.
Wave 2 plans (05-03, 05-04) can also run in parallel with each other; 05-03 should follow 05-02 (schema settled first).

---

## Phase 2 Plan Index

| Plan | Wave | Objective | Requirements | Files |
|------|------|-----------|--------------|-------|
| 02-00 | 0 | Create TEST-CHECKLIST.md | All 15 | .planning/phases/02-web-ui-ux-and-settings/TEST-CHECKLIST.md |
| 02-01 | 1 | Onboarding overhaul (17 steps, sliders, skip, inventory paste) | ONB-01–04, NAV-03 | app/js/views/onboarding.js, app/css/app.css |
| 02-02 | 1 | Dashboard hero + avatar + 7-item grid + nav gating | NAV-01–02, NAV-04–05 | app/js/views/dashboard.js, app/js/app.js, app/index.html, app/css/app.css |
| 02-03 | 2 | Settings page (4 sections, logout, reset) | SETTINGS-01–04, NAV-05 | app/js/views/settings.js |
| 02-04 | 2 | Inventory search + category filter | INV-01–02 | app/js/views/inventory.js, app/css/app.css |

---

## Phase 3 Plan Index

| Plan | Wave | Objective | Requirements | Files |
|------|------|-----------|--------------|-------|
| 03-00 | 0 | Create TEST-CHECKLIST.md | RECIPE-01–05, EXPORT-01–04 | .planning/phases/03-content-management/TEST-CHECKLIST.md |
| 03-01 | 1 | Export/Import ZIP: drop zone, drag-and-drop, sequential writes, AI-context text | EXPORT-01–04 | app/js/export.js, app/js/views/settings.js, app/index.html, app/css/app.css |
| 03-02 | 1 | Recipe form: Utils.toast fixes, New Recipe button, D-02 validation, AI prompt scaffold | RECIPE-01–05 | app/js/views/recipes.js |
| 03-03 | 2 | AI integration: claude-api.js, AI Integration settings section, live Generate wiring | RECIPE-05 | app/js/claude-api.js, app/js/views/settings.js, app/js/views/recipes.js |

---

## Phase 4 Plan Index

| Plan | Wave | Objective | Requirements | Files |
|------|------|-----------|--------------|-------|
| 04-01 | 1 | Engine & schema foundation: normalize.js coerceBottle, recommender-engine lc()+subtype guard+twoAway, classics-db tags, schema update | INV-03, INV-04, INV-05, BUG-02 | app/js/normalize.js, app/js/recommender-engine.js, app/js/classics-db.js, schema/inventory.schema.json |
| 04-02 | 2 | Inventory UI: chip rendering for {style} shape, inline edit form, 6-tier system, Equipment tab, canonical-names module | INV-03, INV-04, INV-05, INV-06, INV-07 | app/js/views/inventory.js, app/js/canonical-names.js, app/css/app.css, app/index.html |
| 04-03 | 2 | Recommender UI: sidebar layout, mood sliders, scope toggle (cumulative sections + two-away cards), occasion filter chips | REC-01, REC-02, REC-03 | app/js/views/recommender.js, app/css/app.css |

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

## Key Decisions (Roadmap Restructure — 2026-05-18)

- **Phase split** — original Phase 5 "AI Integration" split into: Phase 5 "Polish, Depth & UX Tidy" (no AI dependency), Phase 6 "AI Integration" (expanded), Phase 7 "Portability" (new); old Phases 6/7 become 8/9
- **Library ≠ Classroom** — Library (`#library`) is user-curated external links (videos, sites, Wikipedia); Classroom (`#classroom`) is Bjorn's hosted tutorials. Two distinct views introduced together in Phase 6
- **Export strict, import loose** — Markdown export follows a canonical field map with no ambiguity; import accepts JSON (any version), MD files, or mixed ZIP, with AI-assisted natural language parsing as fallback when parse/version errors occur and `bb_anthropic_key` is present
- **Vetoes as session filter** — Vetoes are exposed in the Recommender sidebar as a filter panel (like mood sliders), enforced by default, but each veto individually toggleable per-session without modifying saved data
- **Bartender Customization Wizard** — new `#bartender-wizard` view for full-depth persona editing; Settings → Bartender keeps Name + Preset dropdown and adds a link to the Wizard; Wizard gains AI-assist button in Phase 6
- **Append vs overwrite per-section** — on import: barkeeper/persona always overwrites; inventory + recipes user chooses; profile sliders overwrite, background fields merge
- **Scope button highlighting** — cumulative: selecting scope level N highlights all buttons 0..N; "Unconstrained" (level 3) ignores inventory entirely but still respects vetoes by default
- **Paste-a-line parser** — Phase 5 delivers regex-based parser (no AI); Phase 6 upgrades with Claude fallback for ambiguous entries; unknown tokens land in a REVIEW bucket for user correction

---

## Notes

- `gsd-sdk` is not installed; use `git commit` directly for doc commits
- CLAUDE.md preserved as-is (existing developer guidance)
- Phases 5–7 are sequential by preference but 5 has no hard dependencies; Phase 8 depends on Phases 3–5 being stable; Phase 9 depends on Phase 8

---
*State initialized: 2026-05-04*
*Last activity: 2026-05-18 — Phase 5 plan 05-00 executed. TEST-CHECKLIST.md created and committed (996a371). All 13 REQ IDs covered. Wave 1 plans (05-01, 05-02) ready to execute.*
