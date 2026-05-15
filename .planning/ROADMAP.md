# Roadmap: Barkeeper Bjorn

**Created:** 2026-05-04
**Phases:** 7 | **Requirements:** 57 | **Granularity:** Coarse

---

## Summary

| # | Phase | Goal | Requirements | Status |
|---|-------|------|--------------|--------|
| 1 | Agent Instructions Polish | Fix all open Tier 1 agent instruction issues | AGENT-01–06 | Complete |
| 2 | Web UI UX & Settings | Onboarding overhaul, dashboard images, settings page, inventory search | ONB-01–04, NAV-01–05, SETTINGS-01–04, INV-01–02 | Complete |
| 3 | Content Management | Recipe add/edit, image upload, export/import | RECIPE-01–05, EXPORT-01–04 | Pending |
| 4 | Inventory & Recommender Depth | Structured bottle objects, in-place editing, mood sliders, scope toggle, name standardization | INV-03–07, REC-01–03 | Pending |
| 5 | AI Integration | Claude API, Ask Bjorn chat, AI cocktail design, Classroom | AI-01–07 | Pending |
| 6 | Backend & Multi-User | Supabase, auth, per-user isolation, account settings | BACKEND-01–08 | Pending |
| 7 | Community, API & Multi-Agent | Community feed, forum, REST API, Bjorn sub-agents | COMMUNITY-01–08, API-01–06, AGENT-SYS-01–04 | Pending |

---

## Phase 1: Agent Instructions Polish

**Goal:** Fix all open Tier 1 issues in `barkeeper-instructions.md` and related agent files so the agent behaves consistently and professionally across ChatGPT, Claude, Gemini, and Grok.

**Requirements:**
- AGENT-01: One-question-at-a-time rule with explicit formatting ban
- AGENT-02: Auto-launch INIT_PROMPT on first message (no options menu)
- AGENT-03: Post-confirmation image-generation prompt (two variants: photorealistic + illustrated)
- AGENT-04: `recipes.md` image template updated to `<img>` tag format
- AGENT-05: Session-start returning-user menu (warm greeting + ≤7 items, no preamble)
- AGENT-06: Bartender personalization moved to step 2 of onboarding

**Files touched:** `barkeeper-instructions.md`, `instructions/onboarding.md`, `instructions/communication.md`, `recipes.md`, `INSTALL.md`

**Success criteria:**
1. Starting a fresh session produces INIT_PROMPT flow — not an options menu — on the first user message
2. Onboarding never presents more than one question per agent turn
3. After confirming a new original, agent offers two image-generation prompt variants unprompted
4. The `recipes.md` recipe template uses `<img>` tag with raw GitHub URL as the default
5. Session-start menu for a returning user is ≤7 numbered items with a single greeting line — no preamble

---

## Phase 2: Web UI UX & Settings

**Goal:** Transform the first-run and returning-user experience: redesigned onboarding (sliders, skip/return, barkeeper-first ordering, free-text inventory entry), Bjorn avatar images throughout, an expanded dashboard quick-action grid, and a full Settings page that consolidates all user-facing config.

**Requirements:**
- ONB-01: Skip-and-return on every onboarding step; resume from Dashboard
- ONB-02: Flavor axes as sliders with explicit "Middle" center label
- ONB-03: Bartender personalization at step 2 in web UI wizard
- ONB-04: Free-text inventory paste entry during onboarding
- NAV-01: Bjorn avatar in header title bar
- NAV-02: Dashboard hero background image
- NAV-03: Onboarding welcome shows Bjorn avatar with caption
- NAV-04: Expanded dashboard quick-action grid (6 actions including Classroom and Chat)
- NAV-05: Settings gear icon in nav bar
- SETTINGS-01: Bartender identity (rename + voice preset) in Settings
- SETTINGS-02: API keys view (GitHub PAT, Anthropic key) in Settings with masked reveal
- SETTINGS-03: Logout in Settings with confirmation dialog
- SETTINGS-04: "Reset all data" Danger Zone with two-step confirmation
- INV-01: Real-time inventory search input
- INV-02: Category filter dropdown with jump-scroll

**Files touched:** `app/js/views/onboarding.js`, `app/js/views/dashboard.js`, `app/js/views/settings.js` (new), `app/js/views/inventory.js`, `app/index.html`, `app/css/app.css`

**Plans:** 5 plans

Plans:
- [ ] 02-00-PLAN.md — Create manual smoke-test checklist for all 5 success criteria
- [ ] 02-01-PLAN.md — Onboarding overhaul: 17-step wizard, sliders, skip logic, inventory paste, Bjorn welcome avatar
- [ ] 02-02-PLAN.md — Dashboard hero image, progress banner, 7-item grid, header avatar, nav gating
- [ ] 02-03-PLAN.md — Settings page: bartender identity, GitHub connection, logout, reset all data
- [ ] 02-04-PLAN.md — Inventory real-time search and category jump-scroll filter

**Success criteria:**
1. A new user can skip any onboarding step and return later via "Revisit Onboarding" on the Dashboard
2. Flavor axes show as sliders with "Middle" center label; saved values pre-fill correctly
3. Bjorn avatar appears in the header and on the onboarding welcome step
4. Settings page accessible from nav gear icon; logout clears all `bb_*` localStorage and redirects to Setup
5. Typing in the inventory search box filters chips in real-time with no page reload

---

## Phase 3: Content Management

**Goal:** Close the read-only gap in the web UI — users can add and edit original recipes entirely in-browser, upload cocktail images to GitHub, export their full bar data as a portable JSON bundle or AI-context text, and import back selectively.

**Requirements:**
- RECIPE-01: Add Original form (`#recipes/new`) — all fields, appends to `recipes.originals`
- RECIPE-02: Edit button on recipe detail — opens same form pre-filled
- RECIPE-03: Image upload on recipe detail — file picker → base64 → GitHub API PUT to `images/`
- RECIPE-04: "Submit New Recipe" button in Recipe Book header
- RECIPE-05: "Generate with AI" button in Recipe Book (live with API key / copyable prompt without)
- EXPORT-01: "Export All Data" JSON bundle — triggers browser download, includes version header
- EXPORT-02: AI-context text export — markdown/text summary for pasting into any AI session
- EXPORT-03: "Import Data" — file picker, diff preview, batch write to GitHub
- EXPORT-04: Selective import — per-section checkboxes (inventory, recipes, profile, barkeeper)

**Files touched:** `app/js/views/recipes.js`, `app/js/export.js`, `app/js/claude-api.js` (new), `app/js/views/settings.js`, `app/css/app.css`, `app/index.html`

**Plans:** 4 plans

Plans:
- [ ] 03-00-PLAN.md — Create manual smoke-test checklist
- [ ] 03-01-PLAN.md — Export/Import ZIP upgrade: drop zone, drag-and-drop, sequential writes, AI-context text export
- [x] 03-02-PLAN.md — Recipe form: Utils.toast fixes, New Recipe button, D-02 validation, AI prompt block scaffold
- [ ] 03-03-PLAN.md — AI integration: claude-api.js, AI Integration settings section, live Generate wiring

**Success criteria:**
1. User can create a new original recipe from within the web app and it persists to GitHub
2. User can edit an existing recipe without deleting and re-adding it
3. Uploading an image via the browser writes it to `images/` and displays the raw GitHub URL
4. "Export All Data (ZIP)" downloads a ZIP bundle containing all 4 data files
5. Importing a previously exported ZIP shows a 4-file preview before any writes; Confirm Import writes all four sequentially

---

## Phase 4: Inventory & Recommender Depth

**Goal:** Upgrade inventory from flat strings to structured objects with in-place editing and an expanded tier system; make the recommender session-aware via per-session mood sliders, a configurable missing-ingredient scope, and occasion tag filters; add canonical name suggestions to prevent inventory drift.

**Requirements:**
- INV-03: Spirits stored as objects `{ type, brand, style, tier, notes }`; display as formatted chip with tooltip
- INV-04: Clicking a chip opens an inline edit popover — edit any field and save without delete + re-add
- INV-05: 6-level tier system: Well → Standard → Premium → Craft → Boutique → Rare/Exceptional (refined from original 7-tier spec during discuss-phase; CONTEXT.md D-05 is authoritative)
- INV-06: Strainer field is multi-select checkbox grid (Hawthorne, Julep, Fine Mesh, Conical)
- INV-07: `canonical-names.js` — "Did you mean: X?" inline tooltip on inventory input mismatch
- REC-01: Mood sliders at top of Recommender — 6-axis, pre-loaded from profile, re-scores live without saving
- REC-02: Scope toggle: "Only what I have" → "Allow 1 missing" → "Allow 2 missing"; missing items link to shopping list
- REC-03: Occasion tag filter chips on Recommender

**Files touched:** `app/js/views/inventory.js`, `app/js/views/recommender.js`, `app/js/recommender-engine.js`, `app/js/canonical-names.js` (new), `app/css/app.css`, `schema/inventory.json`

**Success criteria:**
1. Adding a new bottle via the structured form stores it as a JSON object; existing string entries display without breaking
2. Clicking a bottle chip opens an edit popover; changes save without deleting and re-adding the entry
3. Recommender mood sliders re-rank recipes live as axes are adjusted — saved profile is unchanged
4. Scope toggle changes results without page reload; one-away items link to shopping list
5. Typing "angostura" in an inventory input shows "Did you mean: Angostura Bitters?" inline tooltip

---

## Phase 5: AI Integration

**Goal:** Connect the web UI to the Claude API (bring-your-own Anthropic key) to unlock "Ask Bjorn" natural-language chat, AI cocktail design, AI-powered recommendations, and inventory advice — all browser-side with no backend. Add the Classroom static reference section, interactive with Claude API when a key is present.

**Requirements:**
- AI-01: Anthropic API key field in Settings (localStorage `bb_anthropic_key`; masked with Reveal toggle)
- AI-02: "Ask Bjorn" chat panel — unlocked with API key; full system prompt + inventory + profile injected
- AI-03: AI cocktail design — generate new original with rationale and attribution
- AI-04: AI-powered recommendations — Bjorn explains fit and suggests variations
- AI-05: AI inventory advice — "best single bottle to add" with explanation
- AI-06: Classroom view (`#classroom`) — static reference: Techniques, Glassware, Ratios, Ingredients
- AI-07: Classroom becomes interactive with Claude API key — ask Bjorn questions in lesson context
- AI-08: AI-powered legacy import — user pastes or uploads a legacy markdown file (e.g. old chat session notes) and Claude parses it into structured JSON fields (inventory, profile, recipes, barkeeper), presenting a preview before confirming the write to GitHub. Bridges the gap between freeform markdown notes and the structured data store.

**Files touched:** `app/js/claude-api.js` (new), `app/js/views/chat.js` (new), `app/js/views/classroom.js` (new), `app/js/data/classroom-content.js` (new), `app/js/views/settings.js`, `app/index.html`, `app/css/app.css`

**Success criteria:**
1. Entering an Anthropic API key in Settings unlocks the "Chat with Bjorn" nav item (no longer grayed-out)
2. "Ask Bjorn" chat panel sends a message with inventory + profile context and returns a response in Bjorn's voice
3. Classroom view loads statically (Techniques, Glassware, Ratios, Ingredients) with no API key required
4. With API key, submitting a question in Classroom receives an AI response in the current lesson's context
5. "Generate with AI" in Recipe Book produces a new original recipe with full attribution string

---

## Phase 6: Backend & Multi-User

**Goal:** Introduce an optional Supabase-backed "hosted mode" alongside the preserved solo PAT-based mode, adding email/GitHub OAuth auth, per-user data isolation, and account settings — without breaking any existing single-user workflows.

**Requirements:**
- BACKEND-01: `solo` / `hosted` mode flag; solo mode fully preserved; hosted mode uses Supabase
- BACKEND-02: Supabase project: Postgres, Auth (email + GitHub OAuth), Storage for images
- BACKEND-03: `supabase-api.js` mirrors `github-api.js` interface; router selects correct implementation at runtime
- BACKEND-04: Email/password signup and login; "Continue with GitHub" OAuth
- BACKEND-05: Auth token in localStorage; no re-login on refresh
- BACKEND-06: Row-level security: `user_id = auth.uid()` on all data tables
- BACKEND-07: Account settings: change email, password, display name, delete account
- BACKEND-08: DB schema: inventory, recipes, profile, barkeeper tables with user_id FK; migration from JSON export

**Files touched:** `app/js/supabase-api.js` (new), `app/js/auth.js` (new), `app/js/views/auth.js` (new), `app/js/views/account.js` (new), `app/js/app.js` (mode routing), Supabase project + DB migrations

**Success criteria:**
1. Solo mode (GitHub PAT) works exactly as before — no regressions
2. A new user in hosted mode can sign up with email/password and see an empty bar profile
3. "Continue with GitHub" OAuth completes and creates/logs in a Supabase user
4. Data written by User A is not readable by User B (row-level security enforced)
5. Importing a JSON export bundle from solo mode migrates all 4 data sections into Supabase tables

---

## Phase 7: Community, API & Multi-Agent

**Goal:** Build the social layer — a community recipe feed, recipe ratings, and a discussion forum — alongside a public REST API (FastAPI) and the Bjorn multi-agent system (Sommelier, Analytics Brain, Archivist, Shopper).

**Requirements:**
- COMMUNITY-01: Per-recipe visibility toggle (private / public)
- COMMUNITY-02: Community feed (`#community`) — paginated public originals, sort by date/rating
- COMMUNITY-03: Community feed filter by spirit, method, flavor profile
- COMMUNITY-04: "Save to my collection" one-click copy from community to own wishlist/favorites
- COMMUNITY-05: Recipe ratings (star or thumbs); aggregated average on cards
- COMMUNITY-06: Discussion forum (`#forum`) — stand-alone topics by category; markdown support
- COMMUNITY-07: Recipe-attached comment threads — threaded replies (one level); markdown
- COMMUNITY-08: Forum/comment moderation — soft delete, report, admin flag
- API-01: `GET /cocktails/buildable`
- API-02: `GET /cocktails/recommend`
- API-03: `POST /cocktails/design`
- API-04: `GET /inventory/gaps`
- API-05: `GET /profile/axes`
- API-06: `POST /session/log`
- AGENT-SYS-01: Sommelier sub-agent (fortified wines, vermouth, wine-adjacent)
- AGENT-SYS-02: Analytics Brain sub-agent (pure signal, structured recommendations + confidence scores)
- AGENT-SYS-03: Archivist sub-agent (recipe dedup, attribution validation, version history, export)
- AGENT-SYS-04: Shopper sub-agent (gap analysis, price checks, ranked shopping list)

**Files touched:** `app/js/views/community.js` (new), `app/js/views/forum.js` (new), `app/js/views/topic.js` (new), `app/js/views/recipe-comments.js` (new), `api/` directory (new — FastAPI), `agents/` directory (new — sub-agent prompts), DB migrations (community tables)

**Success criteria:**
1. A user can toggle a recipe from private to public; it appears in the community feed for other logged-in users
2. Another user can save a public community recipe to their own wishlist with one click
3. Recipe ratings aggregate and display on community cards
4. A user can create a forum topic in any category and reply to others' topics
5. `GET /cocktails/buildable` returns correct recipes given a test inventory fixture
6. Analytics Brain sub-agent produces a structured recommendation output with confidence scores

---

## Backlog / Future Enhancements

These items were captured during UAT and planning sessions but are not yet scheduled to a specific phase. They should be triaged into the appropriate phase during discuss-phase.

- **Anthropic API request/response log** — Every call to the Anthropic API should be recorded in localStorage (`bb_api_log`, capped at 50 entries). Each entry stores: timestamp, type (request/response/error), model, prompt, system prompt, raw response text, token usage, and HTTP status. A "View API Log" panel in Settings (or a dedicated `#api-log` route) lets the developer inspect entries, copy raw JSON, and clear the log. Useful for debugging AI prompts, verifying model outputs, and iterating on system prompts during development. Basic implementation (localStorage log) added to `claude-api.js` in Phase 3 gap-fix; UI panel is the remaining backlog item. (Captured 2026-05-14)
- **Page-level imports** — In addition to the all-data ZIP import in Settings, each data view should have its own targeted import: Recipes page accepts a multi-recipe JSON/ZIP file with a per-recipe select-or-save-all preview; Inventory page accepts an inventory JSON file; Profile page accepts a bar-owner-profile JSON. Each shows a diff preview before writing. (Captured 2026-05-14 during Phase 3 UAT)
- **AI-powered legacy import (AI-08)** — User pastes or uploads a legacy markdown file (e.g. old chat session notes) and Claude parses it into structured JSON fields, presenting a preview before writing. Scheduled under Phase 5 as AI-08. (Captured 2026-05-14)
- **Ingredient hierarchy / automatic derivations** — The recommender should treat base ingredients as implying their common derivatives: limes → lime juice, lemons → lemon juice, sugar → simple syrup, mint → muddled mint, eggs → egg white/yolk, etc. Currently the engine matches strictly by keyword, so having "limes" in produce does NOT satisfy a recipe calling for "lime juice." Needs a derivation map (base → set of derivable products) and a lookup-expansion pass in `recommender-engine.js` before matching. Target Phase 5+ or later — discuss design (static map vs. AI-assisted inference, user-overridable substitutions, transitive derivations) before implementing. (Captured 2026-05-14 during Phase 4 discussion)
- **Library tab** — A new top-level view (`#library`) for links, references, saved articles, technique videos, and other curated/saved items that don't fit Recipes, Inventory, or Classroom. Acts as the user's bookmarks / curation surface. Schema and view scope TBD — could include external URLs, internal recipe references, embedded notes. Discuss whether this overlaps with Classroom (Phase 5) or replaces it before scoping. (Captured 2026-05-14)
- **AI-assisted JSON error correction** — When a save or import fails due to a malformed or conflicting JSON file, the app should offer to send the broken data to the Anthropic API for automated repair suggestions. Claude diagnoses the issue (corrupt field, schema mismatch, SHA conflict, etc.), proposes a corrected version, presents a diff preview to the user, and only writes to GitHub after explicit confirmation. Requires Phase 5 Claude API integration (`bb_anthropic_key` in localStorage). Design questions for discuss-phase: which error types trigger the offer (parse errors, schema validation failures, SHA conflicts, import mismatches); whether the AI sees the full file or only the error context; how the diff preview is rendered. (Captured 2026-05-14)
- **"Add to Favorites" / "Add to Wishlist" buttons on Recommender cards** — Each recipe card in the Recommender (buildable, one-away, two-away sections) should have two quick-action buttons that copy the recipe into the user's Recipes → Favorites tab or Recipes → Wishlist tab, so the user can find it again later from the Recipes view. Currently a recommender card is read-only — there is no path from "I saw this recommendation" → "save it for later." Small scope: append the recipe (or its id reference) to `recipes.favorites` / `recipes.wishlist` and call `State.save('recipes')`. Could be folded into Phase 4 if scope allows, otherwise Phase 5. (Captured 2026-05-14)
- **Rich profile fields + equipment consolidation + numeric axis values** — Three related items to address together in Phase 5+ (captured 2026-05-14): (1) Surface rich `bar-owner-profile.json` fields in onboarding and Profile tab UI: `background.drinking_frequency`, `background.household_context`, `background.vocabulary_preference`, and `archetypes` array (`{name, description}` objects); (2) Consolidate equipment into `inventory.json` as the sole source of truth — remove from `bar-owner-profile.json` and `barkeeper.json`, update onboarding writes, update `normalize.js` to strip on load; (3) Replace string axis labels ("Lean A", "Strong A", etc.) in `bar-owner-profile.json` with `0.0–1.0` float values matching slider position — remove label headings from Profile tab UI, show numeric slider bars only. Migrate legacy strings in `normalize.js`.

---

## Dependencies

```
Phase 1 — no dependencies (standalone agent files)
Phase 2 — no hard dependencies (web UI; builds on existing app/)
Phase 3 — recommends Phase 2 (Settings page needed for export/import entry point)
Phase 4 — recommends Phase 2 (inventory view refactor; recommender view exists)
Phase 5 — recommends Phase 2 (Settings page needed for API key storage)
Phase 6 — depends on Phases 3 + 4 being stable (data model must be settled before migration)
Phase 7 — depends on Phase 6 (community requires multi-user accounts)
```

---
*Roadmap created: 2026-05-04*
*Source: to-do.md v0.7 + codebase map*
