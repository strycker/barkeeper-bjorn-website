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
| 4 | Inventory & Recommender Depth | Pending | — | 0% |
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

## Notes

- `gsd-sdk` is not installed; use `git commit` directly for doc commits
- CLAUDE.md preserved as-is (existing developer guidance)
- Phases 1–5 are sequential by preference but can overlap; Phases 6–7 are hard-sequenced

---
*State initialized: 2026-05-04*
*Last activity: 2026-05-14 — Phase 4 UI-SPEC written. Stopped at: UI design contract complete. Resume file: `.planning/phases/04-inventory-recommender-depth/04-UI-SPEC.md`. Prior: Phase 4 context gathered (04-CONTEXT.md). Phases 1–3 all marked Shipped. Phase 3 shipped via PR #23 (merged to main).*
