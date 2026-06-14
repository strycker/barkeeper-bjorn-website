# Roadmap: Barkeeper Bjorn

**Created:** 2026-05-04
**Phases:** 10 | **Requirements:** 80+ | **Granularity:** Coarse

---

## Summary

| # | Phase | Goal | Requirements | Status |
|---|-------|------|--------------|--------|
| 1 | Agent Instructions Polish | Fix all open Tier 1 agent instruction issues | AGENT-01–06 | Complete |
| 2 | Web UI UX & Settings | Onboarding overhaul, dashboard images, settings page, inventory search | ONB-01–04, NAV-01–05, SETTINGS-01–04, INV-01–02 | Complete |
| 3 | Content Management | Recipe add/edit, image upload, export/import | RECIPE-01–05, EXPORT-01–04 | Complete |
| 4 | Inventory & Recommender Depth | Structured bottle objects, in-place editing, mood sliders, scope toggle, name standardization | INV-03–07, REC-01–03 | Complete |
| 5 | Polish, Depth & UX Tidy | Recommender UX fixes, vetoes filter panel, ingredient derivation, inventory field depth, data model tidy, Bartender Customization Wizard | REC-05–09, INV-08–10, DATA-01–03, CUST-01–02 | Complete |
| 6 | Recipe & Recommender UX | "I Made This" tracking, chip-style Favorites/Wishlist/Made tabs, text search on Recipes + Recommender, card layout polish | REC-10–11, RECIPE-MADE-01–02, RECIPE-VIEW-01–02, RECIPE-SEARCH-01, REC-SEARCH-01 | Complete |
| 7 | AI Integration | Claude API chat, classroom, AI design, AI recommendations, AI import, Library | AI-01–13, LIB-01, REC-04, SET-05, CHAT-01–09 | Complete (live-key UAT deferred) |
| 7.1 | Recipes & UI Consistency Cleanup *(inserted)* | Chip-shim removal, Originals chip parity, unify AI-generate entry points, type/spacing tokens | CHIP-03–04, RECIPE-GEN-01, UI-TOKEN-01–02 | Pending |
| 8 | Portability | Markdown round-trip, per-page export/import, append/overwrite import mode | PORT-01–05 | Pending |
| 9 | Backend & Multi-User | Supabase, auth, per-user isolation, account settings | BACKEND-01–08 | Pending |
| 10 | Community, API & Multi-Agent | Community feed, forum, REST API, Bjorn sub-agents | COMMUNITY-01–08, API-01–06, AGENT-SYS-01–04 | Pending |

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

**Status: Complete**

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

**Status: Complete**

---

## Phase 3: Content Management

**Goal:** Close the read-only gap in the web UI — users can add and edit original recipes entirely in-browser, upload cocktail images to GitHub, export their full bar data as a portable JSON bundle or AI-context text, and import back selectively.

**Requirements:**
- RECIPE-01: Add Original form (`#recipes/new`) — all fields, appends to `recipes.originals`
- RECIPE-02: Edit button on recipe detail — opens same form pre-filled
- RECIPE-03: Image upload on recipe detail — file picker → base64 → GitHub API PUT to `images/`
- RECIPE-04: "Submit New Recipe" button in Recipe Book header
- RECIPE-05: "Generate with AI" button in Recipe Book (live with API key / copyable prompt without)
- EXPORT-01: "Export All Data" ZIP bundle — triggers browser download
- EXPORT-02: AI-context text export — markdown/text summary for pasting into any AI session
- EXPORT-03: "Import Data" — file picker, diff preview, batch write to GitHub
- EXPORT-04: Selective import — per-section checkboxes (inventory, recipes, profile, barkeeper)

**Status: Complete**

---

## Phase 4: Inventory & Recommender Depth

**Goal:** Upgrade inventory from flat strings to structured objects with in-place editing and an expanded tier system; make the recommender session-aware via per-session mood sliders, a configurable missing-ingredient scope, and occasion tag filters; add canonical name suggestions to prevent inventory drift.

**Requirements:**
- INV-03: Spirits stored as objects `{ style, type, brand, tier, best_for, notes }`; display as formatted chip with tooltip
- INV-04: Clicking a chip opens an inline edit form — edit any field and save without delete + re-add
- INV-05: 6-level tier system: Well → Standard → Premium → Craft → Boutique → Rare/Exceptional
- INV-06: Strainer field is multi-select checkbox grid (Hawthorne, Julep, Fine Mesh, Conical)
- INV-07: `canonical-names.js` — "Did you mean: X?" inline banner on inventory input mismatch
- REC-01: Mood sliders at top of Recommender — 6-axis, pre-loaded from profile, re-scores live without saving
- REC-02: Scope toggle: "Only what I have" → "Allow 1 missing" → "Allow 2 missing"; missing items link to shopping list
- REC-03: Occasion tag filter chips on Recommender

**Status: Complete**

---

## Phase 5: Polish, Depth & UX Tidy

**Goal:** Sharpen what's already shipped with no new AI dependency — data model hygiene, recommender UX correctness, inventory usability improvements, and the new Bartender Customization Wizard. Clean data model before AI sees it in Phase 6.

**Requirements:**

*Recommender UX:*
- REC-05: Scope buttons use **cumulative highlighting** — active state applies to all buttons at or below the current scope level (scope=2 highlights all three inventory-gating buttons; scope=3 highlights all four)
- REC-06: 4th scope button: **"Unconstrained"** — mood + occasion scoring only, zero inventory gating; vetoes still respected by default
- REC-07: **Vetoes filter panel** in Recommender sidebar — shown alongside mood sliders; each veto individually toggleable per-session (bypassing it for that session only, like a mood override); enforced by default
- REC-08: **Add-to-Favorites / Add-to-Wishlist** quick-action buttons on all recommender recipe cards; appends to `recipes.favorites` / `recipes.wishlist` and calls `State.save('recipes')`
- REC-09: **Ingredient derivation static map** in `recommender-engine.js` — lookup-expansion pass before matching; covers: limes→lime juice, lemons→lemon juice, sugar→simple syrup, eggs→egg white, mint→muddled mint, cream→heavy cream, honey→honey syrup

*Inventory Depth:*
- INV-08: **Field label rename in UI** — `style` field displays as "Category" (e.g. Bourbon, Gin, Mezcal); `type` field displays as "Specific Style/Type" (e.g. Single Barrel, Cask Strength, Espadin); add example placeholders and tooltip; underlying JSON keys unchanged
- INV-09: **Nationality** as optional `bottleEntry` field — schema update + edit form field (e.g. "Scotland", "Mexico", "Kentucky, USA")
- INV-10: **Free-text paste-a-line** input at top of Inventory — regex parser (no AI dependency; PAR series resurrected); parses a single descriptive line ("Montelobos Espadin Mezcal, Oaxaca, artesanal, premium-accessible") into a pre-populated chip editor for review before saving

*Data Model Tidy:*
- DATA-01: **Equipment consolidation** — `inventory.json` becomes sole source of truth for equipment; `normalize.js` strips equipment fields from `bar-owner-profile.json` / `barkeeper.json` on load; onboarding writes equipment to inventory only
- DATA-02: **Numeric axis migration** — profile flavor axes stored as `0.0–1.0` floats; `normalize.js` migrates legacy string labels ("Lean A", "Strong A", etc.) on load; Profile tab shows numeric slider bars only, no label headings
- DATA-03: **Rich profile fields surfaced** — onboarding and Profile tab expose `background.drinking_frequency`, `background.household_context`, `background.vocabulary_preference`, and `archetypes[]` (`{name, description}` objects)

*Bartender Customization:*
- CUST-01: **Bartender Customization Wizard** (`#bartender-wizard`) — new full-depth view: name, avatar image URL, voice preset, long-form personality description (textarea), behavioral rules list (add/remove), cocktail naming style, image generation style preferences, signature signoff text. Accessible from Dashboard quick-actions and from Settings → Bartender
- CUST-02: Settings → Bartender section keeps Name + Preset dropdown; adds **"Full Customization →"** link/button that navigates to the wizard

**Files touched:** `app/js/views/recommender.js`, `app/js/recommender-engine.js`, `app/js/views/inventory.js`, `app/js/normalize.js`, `app/js/views/profile.js`, `app/js/views/onboarding.js`, `app/js/views/settings.js`, `app/js/views/dashboard.js`, `app/js/views/bartender-wizard.js` (new), `schema/inventory.schema.json`, `app/index.html`, `app/css/app.css`

**Plans:**
- [ ] 05-00-PLAN.md — Test checklist
- [ ] 05-01-PLAN.md — Recommender UX (cumulative highlight, Unconstrained, Vetoes panel, Favorites/Wishlist, derivation map)
- [ ] 05-02-PLAN.md — Inventory depth (field rename + tooltips, nationality, paste-a-line parser)
- [ ] 05-03-PLAN.md — Data model tidy (equipment consolidation, axis migration, rich profile fields)
- [ ] 05-04-PLAN.md — Bartender Customization Wizard

**Success criteria:**
1. Selecting "Allow 2 missing" in the Recommender shows all three inventory-gating buttons highlighted; selecting "Unconstrained" shows results ranked purely by mood/occasion with no inventory filtering
2. Vetoes appear in the Recommender sidebar; toggling one off temporarily includes that spirit in results for the session without modifying saved data
3. Typing "Montelobos Espadin Mezcal, Oaxaca" in the paste-a-line field opens a chip editor pre-filled with Category=Mezcal, Specific Style=Espadin, Nationality=Mexico
4. Profile flavor axes display as 0.0–1.0 numeric sliders only; old string-label data is migrated on load
5. Saving a recipe from the Bartender Customization Wizard persists to `barkeeper.json` and is reflected in the Settings → Bartender name/preset display

---

## Phase 6: Recipe & Recommender UX

**Goal:** Elevate the Recipes and Recommender views from read-only display to a fully interactive experience — chip-style cards everywhere, "I Made This" tracking, text search on both pages, and action-button polish discovered during Phase 5 UAT.

**Requirements:**

*Card Layout & Toggle State (shipped as Phase 5 close bugfixes):*
- REC-10: Recipe card action buttons (♥ ☆) moved into the `rec-card-header` flex row — no longer `position:absolute`, no longer overlap the Match score bar
- REC-11: Heart and star buttons show filled (♥ ★) when the recipe is in Favorites / Wishlist, open (♡ ☆) when not; clicking a filled button removes it (toggle, not "already in" guard)

*"I Made This" Tracking:*
- RECIPE-MADE-01: ✓ / ○ "I Made This" third action button on every Recommender card — adds to `recipes.made_log[]` (`{name, date_made, notes?}`); toggle removes. Icon fills when made.
- RECIPE-MADE-02: New "Made" tab in Recipes view — shows `made_log` as rec-card chips, most-recent first, each with a remove (×) button

*Recipe Tab Chip Upgrade:*
- RECIPE-VIEW-01: Favorites and Wishlist tabs render entries as `rec-card` style chips (identical to Recommender layout); each card has a remove (×) button; replaces current plain `.card` list
- RECIPE-VIEW-02: Favorites/Wishlist rec-card chips are clickable to show full classics-db detail (ingredients, method, glassware)

*Text Search:*
- RECIPE-SEARCH-01: Search input above Recipes page tabs — instant filter across active tab by name, ingredient, or base spirit; clears on tab switch
- REC-SEARCH-01: Search input on Recommendations page (below scope/filter row) — instant filter across all sections by name, base spirit, or ingredient keyword

**Files touched:** `app/js/views/recommender.js`, `app/js/views/recipes.js`, `app/css/app.css`, `data/recipes.json` (schema: `made_log[]`)

**Plans:** 4 plans (all executed — code verified, awaiting user UAT)
- [x] 06-01-PLAN.md — D-08 dedup by name+base via Utils.sameRecipe (foundational); 8 ROADMAP reqs + 3 gap tasks already DONE
- [x] 06-02-PLAN.md — D-06 editable Originals in universal modal (dual-write)
- [x] 06-03-PLAN.md — D-07 Originals in Recommender, inventory-aware (Strategy B) + 'Your original' badge
- [x] 06-04-PLAN.md — D-09 phase completion: 06-TEST-CHECKLIST.md + 06-UAT.md

> The 8 ROADMAP requirements and the 3 prior gap tasks (Originals-tab search, schema, modal tally) are already implemented and committed. This replan adds discuss-phase decisions D-06/D-07/D-08 plus D-09 completion deliverables. Files also touched: `app/js/recommender-engine.js`, `app/js/utils.js`.

**Success criteria:**
1. On a Recommender card, ♡ heart fills to ♥ on click and the recipe appears in Recipes → Favorites; clicking ♥ again removes it from both
2. Clicking ✓ on a Recommender card adds it to Recipes → Made tab with today's date; clicking again removes it
3. Favorites and Wishlist tabs show full rec-card chips (name, base, method, ingredients) with a × to remove
4. Typing "honey" in the Recipes search box filters to only recipes containing that word in name or ingredients
5. Typing "Negroni" in the Recommender search box hides all non-matching cards while preserving section headers

---

## Phase 7: AI Integration

**Goal:** Connect the web UI to the Claude API (bring-your-own Anthropic key) to unlock "Ask Bjorn" natural-language chat, AI cocktail design, AI-powered recommendations, inventory advice, the Classroom tutorial view, and the Library link collection — all browser-side with no backend. Also upgrades Phase 5's rule-based features (paste-a-line parser, ingredient derivation) with Claude fallbacks.

**Requirements:**

*Settings & Infrastructure:*
- AI-01: Anthropic API key field in Settings (`bb_anthropic_key` localStorage; masked with Reveal toggle); unlocks all AI features
- SET-05: Model selector (Haiku / Sonnet / Opus) stored in `bb_chat_model` localStorage
- AI-09: **Anthropic API log** — every call recorded in `bb_api_log` (50-entry cap, localStorage); Settings panel shows timestamp/type/model/token usage; copy raw JSON; clear log

*Chat:*
- AI-02: "Ask Bjorn" chat panel (`#chat`) — unlocked with API key
- CHAT-01: `#chat` route renders chat panel accessible from nav and dashboard
- CHAT-02: `claude-api.js` IIFE wraps all Anthropic calls with `anthropic-dangerous-direct-browser-access: true` header
- CHAT-03: Chat panel shows "No API key" message with Settings link when key absent
- CHAT-04: System prompt built from bartender persona + flavor profile + compact inventory + vetoes (target 1500–2500 tokens)
- CHAT-05: Responses stream token-by-token using `fetch` + `ReadableStream` + `TextDecoder` SSE parser
- CHAT-06: AbortController tied to view lifecycle; `cleanup()` aborts in-flight stream on navigation
- CHAT-07: Conversation history held in-memory as 10-turn sliding window (not persisted to GitHub)
- CHAT-08: Mid-stream SSE error events caught and displayed as user-readable messages
- CHAT-09: Rate-limit responses (429) surface the `retry-after` value to the user

*AI-Powered Features:*
- AI-03: AI cocktail design — generate new original with rationale and attribution; integrates with Recipe Book
- AI-04: AI-powered recommendations — Bjorn explains fit and suggests variations for Recommender results
- REC-04: "Ask Bjorn about this" button on every recipe card → opens chat with pre-seeded prompt
- AI-05: AI inventory advice — "best single bottle to add" with explanation; entry point on Inventory + Dashboard

*Views:*
- AI-06: **Classroom** view (`#classroom`) — static reference: Techniques, Glassware, Ratios, Ingredients; loads without API key
- AI-07: Classroom becomes AI-interactive when API key present — ask Bjorn questions in lesson context; responses scoped to current lesson
- LIB-01: **Library** view (`#library`) — user-curated collection of external links (URL, title, description, tags); distinct from Classroom (Classroom = Bjorn's hosted tutorials; Library = user's external bookmarks/videos/sites); "Ask Bjorn about this" available with key

*AI-Enhanced Data:*
- AI-08: **Legacy markdown import** — paste or upload old `.md` session notes → Claude parses into structured JSON fields (inventory, profile, recipes, barkeeper) → diff preview → confirm write to GitHub
- AI-10: **AI-assisted JSON error correction** — on save/import failure, offer to send broken section to Claude; Claude proposes corrected version; diff preview before any write; user confirms
- AI-11: **Paste-a-line AI upgrade** — Phase 5 regex parser gains Claude as fallback for ambiguous or complex entries the regex cannot classify
- AI-12: **Bartender Wizard AI assist** — "Help me write this with Claude" button in the Bartender Customization Wizard drafts long-form persona text from user's short preference inputs
- AI-13: **Ingredient derivation AI inference** — Claude suggests derivations for ingredients not covered by the Phase 5 static map; results cached to avoid repeated API calls

**Files touched:** `app/js/claude-api.js`, `app/js/views/chat.js` (new), `app/js/views/classroom.js` (new), `app/js/data/classroom-content.js` (new), `app/js/views/library.js` (new), `app/js/views/settings.js`, `app/js/views/bartender-wizard.js`, `app/js/views/inventory.js`, `app/js/views/recommender.js`, `app/js/views/recipes.js`, `app/index.html`, `app/css/app.css`

**Plans:**
- [ ] 06-00-PLAN.md — Test checklist
- [ ] 06-01-PLAN.md — Settings: API key, model selector, Anthropic log UI
- [ ] 06-02-PLAN.md — Chat panel (streaming SSE, system prompt, error/rate-limit handling)
- [ ] 06-03-PLAN.md — Classroom + Library views
- [ ] 06-04-PLAN.md — AI cocktail design, AI recommendations, AI inventory advice, REC-04
- [ ] 06-05-PLAN.md — AI-enhanced import (legacy MD, JSON repair, paste-a-line upgrade, Bartender Wizard AI assist, derivation inference)

**Success criteria:**
1. Entering an Anthropic API key in Settings unlocks Chat, AI design, and AI advice features across the app
2. "Ask Bjorn" chat panel streams a response in Bjorn's voice with full inventory + profile context injected
3. Classroom loads statically without an API key; with a key, submitting a question returns a lesson-scoped AI response
4. Library view allows adding, tagging, and browsing external links independently of Classroom
5. "Generate with AI" in Recipe Book produces a new original recipe with full attribution string

---

### Phase 07.1: Recipes & UI Consistency Cleanup (INSERTED)

**Goal:** Pay down the highest-friction debt accumulated through Phase 7 before building Portability on top of it — finish the chip-unification migration, bring Originals chips to full visual/behavioral parity, collapse the two AI recipe-generation entry points into one, and replace the worst ad-hoc CSS with a real type + spacing token scale. No new user-facing features; this is a consolidation pass so Phase 8 (Portability) reads a clean recipe pool and a consistent UI.

**Depends on:** Phase 7 (chip-unification mini-phase, AI generation, UI surfaces all shipped)

**Requirements:**
- CHIP-03: **Compat-shim removal** — migrate the remaining legacy `State.get('recipes')` callers (`export.js`, `claude-api.js` context builder, `profile.js` count) to read the canonical pool directly, then delete the derived `originals`/`confirmed_favorites`/`wishlist`/`made_log` getters shim from `normalize.js` (chip-unification Commit 3 final step)
- CHIP-04 (BL-2): **Originals visual + behavioral parity** — route Originals chips through the single `RecipeChip.render()` path used by Favorites/Wishlist/Made/Classics so they share layout, status badges, ♥/☆/✓ actions, and the AI-04 "Ask Bjorn about this" entry; verify renaming a recipe syncs across every derived view (closes Phase 6 Test 12 symptom at the render layer)
- RECIPE-GEN-01 (BL-4): **Unify the two "Generate with AI" entry points** — converge the legacy New-Recipe-form generator (`ClaudeAPI.generateRecipe` → fills form → "Create Recipe") and the Drafts-tab generator (`requestJSON` → WriteGate draft → refine card) on one pipeline (redirect the legacy entry to the drafts flow, or share the generation core); rename the ambiguous "Create Recipe" CTA to reflect the actual outcome (e.g. "Save to Originals")
- UI-TOKEN-01: **Type-scale tokens** — add `--fs-xs` … `--fs-2xl` (six steps) to `:root`; migrate the 30+ ad-hoc `font-size` values (chip system, lesson tiles, status badges, chat bubbles) onto the scale so vertical rhythm is auditable and the accessibility floor lifts off `0.68rem`
- UI-TOKEN-02: **Spacing tokens + inline-style extraction** — add `--space-*` tokens; promote the bulk of the 87 inline `style=` blocks in `recipes.js` and 38 in `settings.js` into named utility/section classes (`.form-section-card`, `.form-actions-row`, `.muted-help`, `.input-disabled`)

**Files touched:** `app/js/recipe-chip.js`, `app/js/views/recipes.js`, `app/js/views/recommender.js`, `app/js/recommender-engine.js`, `app/js/normalize.js`, `app/js/export.js`, `app/js/claude-api.js`, `app/js/views/profile.js`, `app/js/views/settings.js`, `app/js/views/dashboard.js`, `app/css/app.css`, `app/index.html`, `tests/*.test.js`

**Out of scope (stays in backlog):** BL-1, BL-3, BL-5, BL-6; chat streaming "thinking…"/Stop affordances; live-key UAT.

**Plans:**
- [ ] TBD (run /gsd-plan-phase 07.1 to break down)

**Success criteria:**
1. No source file calls the legacy `State.get('recipes')` getters shim; the shim is deleted from `normalize.js`; `node tests/*.test.js` is fully green
2. Originals chips render through the same `RecipeChip.render()` call site as the other tabs (badges, ♥/☆/✓, Ask-Bjorn identical); renaming an Original updates Favorites/Wishlist/Made/Recommender wherever it appears
3. A single AI recipe-generation pipeline backs both entry surfaces; no CTA reads the ambiguous "Create Recipe"
4. `:root` defines a six-step type scale and a spacing scale; chip/lesson/badge/chat selectors reference the scale variables instead of raw `rem`/`px`
5. Inline `style=` attribute counts in `recipes.js` and `settings.js` drop substantially, with form sections and action rows rendered via shared utility classes

## Phase 8: Portability

**Goal:** Full round-trip data portability — strict Markdown export (canonical, human-readable), AI-assisted flexible import (accepts JSON bundles, older versions, or `.md` files), per-page single-file operations, and append-vs-overwrite import control per section. Uses Phase 6's Claude API as the import backstop for unrecognized formats.

**Key decisions:**
- **Export is strict:** Each JSON file maps to a canonical `.md` template with defined section headings; no ambiguity
- **Import is loose:** Accepts JSON (any version), ZIP bundle, or `.md` files; version mismatches and parse errors fall back to AI-assisted natural language interpretation; AI fallback requires `bb_anthropic_key`
- **Append vs overwrite is per-section:** barkeeper/persona always overwrites (no merge semantics); inventory + recipes user chooses append or overwrite; profile sliders overwrite, background fields merge

**Requirements:**
- PORT-01: **Markdown export** — strict field map; each of the 4 data files exports to a canonical `.md`; ZIP bundle includes both `.json` and `.md` versions of each file
- PORT-02: **Flexible import** — accepts JSON bundle (any version), individual `.md` files, or mixed ZIP; on version mismatch or parse error, falls back to Claude-assisted natural language parse if `bb_anthropic_key` is present; else shows detailed error
- PORT-03: **Append vs overwrite toggle** per section on import — barkeeper: always overwrite; inventory + recipes: user selects; profile: sliders overwrite, background fields merge
- PORT-04: **Per-page single-file export/import** — Inventory page: export/import inventory as `.json` or `.md`; Recipes page: same for recipes; Profile page: same for profile; each shows diff preview before any write
- PORT-05: **AI import error recovery** — if any field fails schema validation mid-import, offer to send the broken section to Claude for repair/interpretation; diff preview before write

**Files touched:** `app/js/export.js`, `app/js/views/settings.js`, `app/js/views/inventory.js`, `app/js/views/recipes.js`, `app/js/views/profile.js`, `app/js/md-converter.js` (new), `app/css/app.css`

**Plans:**
- [ ] 07-00-PLAN.md — Test checklist
- [ ] 07-01-PLAN.md — Markdown export engine + strict field map (`md-converter.js`)
- [ ] 07-02-PLAN.md — Flexible import parser (JSON + MD, version tolerance, AI fallback)
- [ ] 07-03-PLAN.md — Per-page export/import UI + append/overwrite controls

**Success criteria:**
1. "Export All Data (ZIP)" produces a ZIP with both `.json` and `.md` versions of all 4 data files
2. Importing the exported `.md` files on a fresh install produces identical data to importing the `.json` files
3. Importing an older-version JSON bundle either auto-migrates fields or offers an AI-assisted repair flow
4. Inventory page "Export Inventory" downloads just `inventory.json` (and optionally `inventory.md`); re-importing it appends or overwrites per user selection
5. Attempting to import a malformed file surfaces an AI repair offer when a key is present, or a clear error when not

---

## Phase 9: Backend & Multi-User

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

## Phase 10: Community, API & Multi-Agent

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

## Dependencies

```
Phase 1  — no dependencies (standalone agent files)
Phase 2  — no hard dependencies (web UI; builds on existing app/)
Phase 3  — recommends Phase 2 (Settings page needed for export/import entry point)
Phase 4  — recommends Phase 2 (inventory view refactor; recommender view exists)
Phase 5  — depends on Phases 1–4 being stable (data model tidy requires settled schema)
Phase 6  — depends on Phase 5 (recipe card structure + favorites/wishlist schema must be settled)
Phase 7  — recommends Phase 6 (clean data model + rec-card chips improve AI context quality; Settings page needed for API key)
Phase 7.1 — depends on Phase 7 (consolidates the chip-unification pool, AI generation, and UI surfaces shipped in Phase 7)
Phase 8  — recommends Phase 7; benefits from Phase 7.1 (a clean recipe pool with the compat shim removed simplifies MD export/import mapping)
Phase 9  — depends on Phases 3–5 being stable (data model must be settled before Supabase migration)
Phase 10 — depends on Phase 9 (community requires multi-user accounts)
```

---

## Backlog / Future Enhancements

Items still unscheduled — triage at next milestone boundary.

### Derivation / Recommender (pre-Phase-7 backlog)

- **AI-assisted onboarding** — With an API key present, onboarding steps could offer AI-generated suggestions based on partial answers ("based on your love of smoky spirits, here are common pairings to consider for your veto list"). Low-priority polish for Phase 6+.
- **Recommender user-overridable substitution rules** — Allow users to define their own derivation/substitution rules (e.g. "I always have fresh citrus so treat limes as lime juice"). Extends Phase 5 static map + Phase 6 AI inference. Design TBD.
- **Transitive derivations** — Multi-hop inference: lemons → lemon juice → sour mix; sugar + water → simple syrup. Extend Phase 5/6 derivation map. Design: static DAG vs. AI-inferred graph.
- **Recommender card detail expansion** — Click a card in the recommender to expand full recipe inline (ingredients, method, glassware) without navigating away. Phase 5 or 6 quality-of-life.
- **Ingredient hierarchy UX** — Show the user which ingredients were matched via derivation (e.g. "✓ lime juice (from fresh limes)") so they understand why a recipe is included.

### Captured during Phase 7 UAT (BL-1 .. BL-6)

Full detail in `.planning/phases/07-ai-integration/07-UAT.md` (Deferred / Backlog section).

- **BL-1: Classroom V2** — structured lesson schema (`schema/classroom.schema.json`) + adaptive 101→201→advanced progression + lesson card actions (mark complete, save to Library, add AI-suggested lesson). Scope: new phase (likely Phase 11+), "personalized learning loop" theme.
- **BL-2: Unified recipe-chip schema** — normalize recipe storage (store once, reference by id) + single `renderRecipeChip()` so Originals reach visual parity with other chip surfaces; also fixes Phase 6 Test 12 (rename sync). Partially addressed by the chip-unification mini-phase; Originals-parity remainder still open. Scope: small/medium.
- **BL-3: "Non-Alcoholic Only Tonight" mode** — `na` (and optional `near_na`) boolean on the recipe schema + Recommender toggle + AI-03 prompt augmentation + NA chip badge + one-pass tagging sweep over the 169 classics. Scope: modest.
- **BL-4: Unify the two "Generate with AI" entry points** — converge the legacy New-Recipe-form generator and the Drafts-tab generator on one pipeline; rename ambiguous "Create Recipe" CTA. Scope: small.
- **BL-5: "Use the real recipe" interstitial** — when an AI-tweak draft near-matches an existing classic/original, offer "use the real recipe" / "save as draft anyway" / "add to classics DB" instead of a bare error toast (builds on `_isNearDuplicateOfPool`). Scope: modest.
- **BL-6: AI-first category detection for Quick Add (Inventory)** — when `parseBottleSection` returns null, call Claude FIRST to return `{section, style, type, brand?, tier?}` and skip the manual category picker; fall back to picker on failure. Scope: modest.

### Tech debt / cleanup

- **Chip-unification compat-shim removal** — drop the legacy `State.get('recipes')` getters shim once the remaining non-recipes-view callers (`export.js`, `claude-api.js` context, `profile.js` count) are migrated to read the pool directly. Shipped mini-phase plan: `.planning/chip-unification-plan.md` (Commit 3 final step). Queued cleanup; non-blocking.
- **UI type-scale tokens** — add `--fs-xs`..`--fs-2xl` to `:root` and migrate the 30+ ad-hoc `font-size` values (chip system, lesson tiles, badges, chat bubbles) onto the scale. From Phase 7 UI Review (Typography 2/4).
- **UI spacing tokens + inline-style extraction** — add `--space-*` tokens; promote the 87 inline `style=` blocks in `recipes.js` and 38 in `settings.js` into named utility/section classes (`.form-section-card`, `.form-actions-row`, `.muted-help`, `.input-disabled`). From Phase 7 UI Review (Spacing 2/4).
- **Chat streaming affordances** — add a "thinking…" placeholder before the first token and a visible Stop button (wire to the existing `AbortController`) in both the `#chat` page and the quick-ask drawer. From Phase 7 UI Review (Visuals 3/4).

### Deferred verification

- **Phase 7 live-key UAT** — recipe-balance quality, persona voice, import quality, JSON-repair quality, drawer/abort/rate-limit UX, and lesson Q&A all require a real BYOK Anthropic key and could not be exercised in the build container. Run via `/gsd-verify-work` once a key is available.

---

*Roadmap created: 2026-05-04*
*Restructured: 2026-05-18 — Phases 5–9 reorganized; Phases 5 (Polish), 7 (Portability) added; backlog items triaged into phases; Library and Classroom clarified as distinct views; import/export decisions locked*
