# Requirements — Barkeeper Bjorn

_Restructured: 2026-05-18 to reflect Phases 1–4 shipped; Phases 5–9 active roadmap_

---

## Phases 1–4: Shipped (all requirements validated)

All requirements from Phases 1–4 are complete and validated. See phase SUMMARY and VERIFICATION files in `.planning/phases/` for details. Key shipped capabilities:

- Agent instructions polish (AGENT-01–06)
- Web UI UX & Settings: onboarding, dashboard, settings page, inventory search (ONB-01–04, NAV-01–05, SETTINGS-01–04, INV-01–02)
- Content management: recipe add/edit, image upload, ZIP export/import (RECIPE-01–05, EXPORT-01–04)
- Inventory & Recommender Depth: structured bottle objects, inline edit, mood sliders, scope toggle, canonical names (INV-03–07, REC-01–03)

---

## Phase 5: Polish, Depth & UX Tidy

### REC — Recommender UX

- [ ] **REC-05**: Scope buttons use cumulative highlighting — the active state applies to all buttons at or below the current scope level (scope=1 highlights buttons 0+1; scope=2 highlights 0+1+2; scope=3 "Unconstrained" highlights all four)
- [ ] **REC-06**: 4th scope button "Unconstrained" — mood + occasion scoring only, zero inventory gating; vetoes still respected by default
- [ ] **REC-07**: Vetoes filter panel in Recommender sidebar — shown alongside mood sliders; each veto individually toggleable per-session (bypass for that session only, like a mood override); enforced by default; session state resets on navigation away from Recommender
- [ ] **REC-08**: Add-to-Favorites and Add-to-Wishlist quick-action buttons on all recommender recipe cards; appends to `recipes.favorites` / `recipes.wishlist` and calls `State.save('recipes')`
- [ ] **REC-09**: Ingredient derivation static map in `recommender-engine.js` — lookup-expansion pass before matching covers: limes→lime juice, lemons→lemon juice, sugar→simple syrup, eggs→egg white, mint→muddled mint, cream→heavy cream, honey→honey syrup

### INV — Inventory Depth

- [ ] **INV-08**: `style` field displays as "Category" in UI (e.g. Bourbon, Gin, Mezcal); `type` field displays as "Specific Style/Type" (e.g. Single Barrel, Cask Strength, Espadin); example placeholders and tooltip added; underlying JSON keys unchanged
- [ ] **INV-09**: Nationality as optional field in `bottleEntry` schema + edit form (e.g. "Scotland", "Mexico", "Kentucky, USA")
- [ ] **INV-10**: Free-text paste-a-line input at top of Inventory — regex parser (no AI dependency); parses a single descriptive line into a pre-populated chip editor for review before saving; unknown tokens land in a REVIEW bucket the user can correct

### DATA — Data Model Tidy

- [ ] **DATA-01**: Equipment consolidation — `inventory.json` becomes sole source of truth for equipment; `normalize.js` strips equipment fields from `bar-owner-profile.json` / `barkeeper.json` on load; onboarding writes equipment to inventory only
- [ ] **DATA-02**: Numeric axis migration — profile flavor axes stored as `0.0–1.0` floats; `normalize.js` migrates legacy string labels ("Lean A", "Strong A", etc.) on load; Profile tab shows numeric slider bars only, no label headings
- [ ] **DATA-03**: Rich profile fields surfaced — onboarding and Profile tab expose `background.drinking_frequency`, `background.household_context`, `background.vocabulary_preference`, and `archetypes[]` (`{name, description}` objects)

### CUST — Bartender Customization

- [x] **CUST-01**: Bartender Customization Wizard (`#bartender-wizard`) — new full-depth view with: name, avatar image URL, voice preset, long-form personality description (textarea), behavioral rules list (add/remove), cocktail naming style, image generation style preferences, signature signoff text
- [x] **CUST-02**: Settings → Bartender section keeps Name + Preset dropdown and adds "Full Customization →" link/button that navigates to the Wizard

**Phase 5 status: SHIPPED — all 17 UAT tests passed 2026-05-19**

---

## Phase 6: Recipe & Recommender UX

_Inserted between Phases 5 and AI Integration to address recipe list depth, search, and action-button UX — all discovered during Phase 5 UAT._

### REC-CARD — Recipe Card Polish (Bugfixes, shipped with Phase 5 close)

- [x] **REC-10**: Recipe card layout fix — `rec-card-actions` (♥ ☆) moved into the `rec-card-header` flex row (no longer absolute-positioned); no longer covers the Match score bar. CSS: removed `position:absolute`, added `flex-shrink:0; align-self:flex-start`.
- [x] **REC-11**: Toggle state for ♥ / ★ action buttons — heart shows ♡ (open, U+2661) when not in Favorites, ♥ (filled, U+2665) when favorited; star shows ☆ when not wishlisted, ★ when wishlisted. Clicking a filled button removes the recipe from that list (toggle, not "already in" guard). Buttons update instantly after GitHub save.

### RECIPE-MADE — "I Made This" Tracking

- [ ] **RECIPE-MADE-01**: "I Made This" (✓ / ○) button on every Recommender recipe card — third action button alongside ♥ and ★. Clicking marks the recipe as made and adds it to `recipes.made_log[]` (each entry: `{name, date_made, notes?}`). Icon shows ○ (not made) or a filled ✓ (made). Clicking a made recipe removes it from the log (toggle).
- [ ] **RECIPE-MADE-02**: New "Made" tab in the Recipes view — shows `recipes.made_log` entries as rec-card style chips (same layout as Favorites/Wishlist tabs after RECIPE-VIEW-01). Sorted most-recent first. Each entry has a remove (×) button.

### RECIPE-VIEW — Recipe Tab Chip Upgrade

- [ ] **RECIPE-VIEW-01**: Favorites and Wishlist tabs in the Recipes view render entries as `rec-card` style chips — identical layout to Recommender cards (name, base, method, difficulty, occasion sentence, ingredient chips, glassware). Each card has a remove (×) button to remove the entry from that list without navigating to Recommender. Replaces the current plain `.card` list layout.
- [ ] **RECIPE-VIEW-02**: Originals tab recipe cards are clickable chips — clicking opens the full recipe detail view (already implemented for Originals, but Favorites/Wishlist entries from classics-db should also be clickable to see full detail including method steps from the classics-db entry).

### RECIPE-SEARCH — Text Search

- [ ] **RECIPE-SEARCH-01**: Text search input at the top of the Recipes page (above tabs) — filters entries across whichever tab is active (Originals, Favorites, Wishlist, Made) by recipe name, ingredient name, or base spirit. Clears on tab switch. Instant filter (no submit button).
- [ ] **REC-SEARCH-01**: Text search input at the top of the Recommendations page (above the cards area, below scope/filter controls) — filters visible cards by recipe name, base spirit, or ingredient keyword. Works across all sections (Buildable, One Away, Two Away). Instant filter.

---

## Phase 7: AI Integration

### AI — Core Infrastructure

- [ ] **AI-01**: Anthropic API key field in Settings (`bb_anthropic_key` localStorage; masked display with Reveal toggle); key presence unlocks all AI features
- [ ] **SET-05**: Model selector (Haiku / Sonnet / Opus) stored in `bb_chat_model` localStorage
- [ ] **AI-09**: Anthropic API log — every call recorded in `bb_api_log` (50-entry cap, localStorage); Settings panel shows timestamp/type/model/token usage; copy raw JSON; clear log

### CHAT — Chat Panel

- [ ] **AI-02**: "Ask Bjorn" chat panel (`#chat`) — unlocked with API key; full system prompt + inventory + profile injected
- [ ] **CHAT-01**: `#chat` route renders chat panel accessible from nav and Dashboard
- [ ] **CHAT-02**: `claude-api.js` IIFE wraps all Anthropic calls with `anthropic-dangerous-direct-browser-access: true` header required for browser CORS
- [ ] **CHAT-03**: Chat panel shows "No API key" message with link to Settings when `bb_anthropic_key` absent
- [ ] **CHAT-04**: System prompt built from bartender persona + flavor profile + compact inventory + vetoes (target 1500–2500 tokens total)
- [ ] **CHAT-05**: Responses stream token-by-token using `fetch` + `ReadableStream` + `TextDecoder` SSE parser
- [ ] **CHAT-06**: AbortController tied to view lifecycle; `cleanup()` aborts any in-flight stream on navigation
- [ ] **CHAT-07**: Conversation history held in-memory as 10-turn sliding window (not persisted to GitHub)
- [ ] **CHAT-08**: Mid-stream SSE error events caught and displayed as user-readable messages (not swallowed)
- [ ] **CHAT-09**: Rate-limit responses (429) surface the `retry-after` value to the user

### AI-FEAT — AI-Powered Features

- [ ] **AI-03**: AI cocktail design — generate new original with rationale and attribution; integrates with Recipe Book
- [ ] **AI-04**: AI-powered recommendations — Bjorn explains fit and suggests variations for Recommender results
- [ ] **REC-04**: "Ask Bjorn about this" button on every recipe card → opens chat with pre-seeded prompt
- [ ] **AI-05**: AI inventory advice — "best single bottle to add" with explanation; accessible from Inventory view and Dashboard

### VIEW — New Views

- [ ] **AI-06**: Classroom view (`#classroom`) — static reference: Techniques, Glassware, Ratios, Ingredients; loads without API key
- [ ] **AI-07**: Classroom becomes AI-interactive when API key present — ask Bjorn questions in lesson context; responses scoped to current lesson topic
- [ ] **LIB-01**: Library view (`#library`) — user-curated collection of external links (URL, title, description, tags); distinct from Classroom (Classroom = Bjorn's hosted tutorials; Library = user's external bookmarks/videos/sites); "Ask Bjorn about this" available with key

### AI-DATA — AI-Enhanced Data Operations

- [ ] **AI-08**: Legacy markdown import — paste or upload old `.md` session notes → Claude parses into structured JSON fields → diff preview → confirm write to GitHub
- [ ] **AI-10**: AI-assisted JSON error correction — on save/import failure, offer to send broken section to Claude; Claude proposes corrected version; diff preview before any write; user confirms
- [ ] **AI-11**: Paste-a-line AI upgrade — Phase 5 regex parser gains Claude as fallback for ambiguous or complex entries the regex cannot classify
- [ ] **AI-12**: Bartender Wizard AI assist — "Help me write this with Claude" button drafts long-form persona text from user's short preference inputs
- [ ] **AI-13**: Ingredient derivation AI inference — Claude suggests derivations for ingredients not in the Phase 5 static map; results cached per session

---

## Phase 8: Portability

### PORT — Data Portability

- [ ] **PORT-01**: Markdown export (strict) — each of the 4 data files exports to a canonical `.md` with defined section headings; ZIP bundle includes both `.json` and `.md` versions of each file
- [ ] **PORT-02**: Flexible import (loose) — accepts JSON bundle (any version), individual `.md` files, or mixed ZIP; version mismatch or parse failure falls back to Claude-assisted natural language parse if `bb_anthropic_key` present; else shows detailed structured error
- [ ] **PORT-03**: Append vs overwrite toggle per section on import — barkeeper: always overwrite; inventory + recipes: user selects append or overwrite; profile: sliders overwrite, background fields merge
- [ ] **PORT-04**: Per-page single-file export/import — Inventory page exports/imports inventory as `.json` or `.md`; Recipes page same for recipes; Profile page same for profile; each shows diff preview before any write
- [ ] **PORT-05**: AI import error recovery — if any field fails schema validation mid-import, offer to send the broken section to Claude for repair/interpretation; diff preview before write

---

## Phases 9–10: Future (Backend & Community)

Requirements for these phases are defined in ROADMAP.md. They are not yet broken into detailed requirement IDs — that happens during discuss-phase for each phase.

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| AGENT-01–06 | 1: Agent Instructions Polish | Shipped |
| ONB-01–04, NAV-01–05, SETTINGS-01–04, INV-01–02 | 2: Web UI UX & Settings | Shipped |
| RECIPE-01–05, EXPORT-01–04 | 3: Content Management | Shipped |
| INV-03–07, REC-01–03 | 4: Inventory & Recommender Depth | Shipped |
| REC-05–09, INV-08–10, DATA-01–03, CUST-01–02 | 5: Polish, Depth & UX Tidy | **Shipped** |
| REC-10–11 | 6: Recipe & Recommender UX | Shipped (bugfixes) |
| RECIPE-MADE-01–02, RECIPE-VIEW-01–02, RECIPE-SEARCH-01, REC-SEARCH-01 | 6: Recipe & Recommender UX | Pending |
| AI-01–13, SET-05, CHAT-01–09, REC-04, LIB-01 | 7: AI Integration | Pending |
| PORT-01–05 | 8: Portability | Pending |
| BACKEND-01–08 | 9: Backend & Multi-User | Pending |
| COMMUNITY-01–08, API-01–06, AGENT-SYS-01–04 | 10: Community, API & Multi-Agent | Pending |

---

## Backlog — Captured Ideas

> Items captured during UAT / user sessions. Not yet assigned to a phase.

- **REC-MUST-01**: Recommender sidebar "Must Have" text field — user types an ingredient (e.g. "crème de cacao", "pisco") and results filter to only recipes that call for that specific ingredient. Works alongside mood sliders and scope; complements the existing class-level occasion/base-spirit filters with ingredient-level precision. Captured 2026-05-19.
- **UI-FAV-01**: Add a favicon to the browser tab — a small icon representing Barkeeper Bjorn (e.g. a cocktail glass or amber/bourbon-themed icon) shown in Chrome and other browser tabs. Captured 2026-05-19.
- **REC-DB-01**: Expand classics-db.js to 1000+ cocktail recipes so that users with extensive bars still see meaningful "One Away" and "Two Away" results. Current DB is too small relative to a well-stocked bar. New recipes should span all major spirit categories and include obscure/craft classics, tiki, contemporary sours, highballs, stirred spirit-forward drinks, low-ABV, and non-alcoholic. Captured 2026-05-19.
- **RECIPE-FAV-01**: Remove buttons on Favorites and Wishlist tabs — user should be able to remove a recipe directly from the Favorites tab (without going back to Recommender), and similarly remove from Wishlist tab. Each chip/card should have an accessible remove/delete control inline. Captured 2026-05-19.
- **RECIPE-DETAIL-01**: Recipe chips should be clickable to open a full recipe detail view — showing name, background/description, full ingredient list with measurements, instructions, glassware, garnish, and any notes. Currently chips are not interactive and only show main ingredients. Should work for both Originals and Favorites tabs. Captured 2026-05-19.
- **VETO-UX-01**: Improve vetoes UX across the app — (1) autocomplete suggestions for common disliked ingredients and allergens (gluten, dairy, nuts, sulfites, etc.) when typing in the veto input; (2) veto management accessible from Settings page in addition to Profile and Inventory; (3) consistent veto UI (chips with remove buttons) wherever vetoes appear. Captured 2026-05-19.
- **ARCHETYPE-01**: Archetypes as earned preference badges — overhaul the archetype system: (1) **Profile page**: archetypes are removable (× on each chip) and addable via free-text entry, not just a fixed pick-grid; (2) **AI-generated badges**: after chat sessions, Bjorn can propose new archetypes earned from conversation, favorited/wishlisted drinks, and originals created (e.g. "Sweet Tooth", "Mad Men Martinis", "Tiki Explorer", "Smoke Chaser"); user confirms or dismisses proposed badges; (3) **Recommender sidebar**: archetypes shown alongside vetoes as per-session toggles — active archetypes bias recommendations toward matching mood/occasion tags; user can temporarily suppress one for that session (strikethrough, same pattern as vetoes); (4) **Data model**: `archetypes[]` entries gain an optional `earned_from` field (e.g. `"chat"`, `"favorites"`, `"originals"`) and `earned_at` timestamp so the AI can reference when/why a badge was awarded. Captured 2026-05-19.

---

*Created: 2026-05-11*
*Restructured: 2026-05-18 — Phases 1–4 marked shipped; Phases 5–9 rewritten to match restructured ROADMAP.md; stale PAR/ONB/DASH/SET traceability table replaced*
