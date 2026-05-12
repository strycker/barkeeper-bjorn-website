# Project State: Barkeeper Bjorn

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-05-04)

**Core value:** The user's real-world bar inventory and flavor profile should power both AI-driven conversation and rule-based recommendations — seamlessly, whether in a chat session or the web app.

**Current focus:** Phase 2 — Web UI UX & Settings

---

## Phase Status

| Phase | Name | Status | Plans | Progress |
|-------|------|--------|-------|----------|
| 1 | Agent Instructions Polish | Verified | 5 | 100% |
| 2 | Web UI UX & Settings | Executed | 5 | 100% |
| 3 | Content Management | Pending | — | 0% |
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

## Key Decisions (Phase 2)

- **inventory.unassigned** — inventory paste items from onboarding go to `inventory.unassigned` (new top-level array), NOT `inventory.spirits` (which does not exist as a flat array in the schema)
- **Sequential State.save()** — "Reset all data" in Settings must await each of the 4 saves sequentially to avoid GitHub API 409 SHA conflicts
- **No window.confirm()** — logout confirmation uses existing `.confirm-dialog` / `.confirm-dialog-overlay` CSS classes (lines 575–591 in app.css)
- **Image URLs at runtime** — all Bjorn avatar URLs constructed from `GitHubAPI.cfg()` at render time; never hardcoded
- **IIFE module pattern** — settings.js must follow `const SettingsView = (() => { function render(container) {…} return { render }; })();`
- **Search scope** — inventory search queries `.bottle-chip` scoped to `#tab-content`, not `document`

---

## Notes

- `gsd-sdk` is not installed; use `git commit` directly for doc commits
- CLAUDE.md preserved as-is (existing developer guidance)
- Phases 1–5 are sequential by preference but can overlap; Phases 6–7 are hard-sequenced

---
*State initialized: 2026-05-04*
*Last activity: 2026-05-12 — Phase 1 status corrected to Verified (5/5 plans executed, VERIFICATION.md exists, human_needed for SC1+SC2); Phase 2 validation complete (55/55 static checks passing; 14/15 automated, 1 manual-only)*
