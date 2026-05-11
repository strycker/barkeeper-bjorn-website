# Requirements: Barkeeper Bjorn

**Defined:** 2026-05-04
**Core Value:** The user's real-world bar inventory and flavor profile should power both AI-driven conversation and rule-based recommendations — seamlessly, whether in a chat session or the web app.

---

## v1 Requirements

All open items from to-do.md v0.7, organized by category.

### Agent Instructions

- [ ] **AGENT-01**: Agent asks exactly one question at a time during onboarding; numbered-list question dumps are forbidden
- [ ] **AGENT-02**: On first user message with no clear task, agent immediately runs INIT_PROMPT flow — no options menu
- [ ] **AGENT-03**: After confirming a new original, agent suggests a specific image-generation prompt in two variants (photorealistic + illustrated)
- [ ] **AGENT-04**: `recipes.md` image template uses `<img>` tag with raw GitHub URL and fixed width (not backtick path string)
- [ ] **AGENT-05**: On session start with populated files, agent greets user by name and presents a ≤7-item numbered menu; no preamble or product pitch
- [ ] **AGENT-06**: Bartender personalization (name, voice, specialty) moved to step 2 of agent onboarding — immediately after user name and location

### Onboarding UX

- [ ] **ONB-01**: Every onboarding step has a "Skip for now →" link; skipped steps are left null and resumable from Dashboard "Revisit Onboarding"
- [ ] **ONB-02**: Flavor axes use slider bars (same component as Profile page) with explicit "Middle / Both / Depends on my mood" center label — not A/B choice cards
- [ ] **ONB-03**: Bartender name/voice/specialty step appears as step 2 in the web UI onboarding wizard (immediately after user name/location)
- [ ] **ONB-04**: After equipment step, user can paste a free-text inventory list (one per line or comma-separated); app categorizes and pre-populates with a review-and-edit step before saving

### Dashboard & Navigation

- [ ] **NAV-01**: Bjorn avatar image (`barkeeper_bjorn_002.png`) shown as small avatar next to "Barkeeper Bjorn" text in header
- [ ] **NAV-02**: Dashboard hero shows `bar_equipment_001.png` as muted background or welcome-section image
- [ ] **NAV-03**: Onboarding welcome step shows `barkeeper_bjorn_001.png` with caption — user meets Bjorn before answering questions
- [ ] **NAV-04**: Dashboard quick-action grid includes: "Revisit Onboarding", "Enhance Profile", "Recommend a Cocktail", "Classroom / Mixology 101", "Chat with [bartender name]" (grayed-out if no API key), "Feedback"
- [ ] **NAV-05**: Settings gear icon button in upper-right nav bar routes to `#settings`

### Settings

- [ ] **SETTINGS-01**: Settings view (`#settings`) allows bartender rename and voice/personality preset change (writes to `barkeeper.json`)
- [ ] **SETTINGS-02**: Settings view shows GitHub PAT + repo config (moved from Setup); Anthropic API key field with masked value and "Reveal" toggle
- [ ] **SETTINGS-03**: Settings view has Logout (clears all `bb_*` localStorage, redirects to Setup, shows confirmation dialog)
- [ ] **SETTINGS-04**: Settings view has "Reset all data" Danger Zone — overwrites all 4 data files with empty defaults after two-step confirmation

### Inventory

- [ ] **INV-01**: Inventory search input filters bottle chips across all categories in real-time
- [ ] **INV-02**: Category filter dropdown jump-scrolls to a section
- [ ] **INV-03**: Each spirit stored as object `{ type, brand, style, tier, notes }` instead of flat string
- [ ] **INV-04**: Clicking a bottle chip opens an inline edit popover — change any field and save without delete + re-add
- [ ] **INV-05**: Tier options expanded to 7 levels: Dirt Cheap → Well → Standard → Call → Premium → Ultra-Premium → Craft
- [ ] **INV-06**: Strainer field is a multi-select checkbox grid (Hawthorne, Julep, Fine Mesh, Conical) — not a dropdown
- [ ] **INV-07**: Ingredient name standardization: free-text inputs compared to `canonical-names.js`; inline "Did you mean: X?" tooltip on mismatch

### Recipes & Content

- [ ] **RECIPE-01**: "Add Original" button routes to `#recipes/new` — form with all fields (id, name, tagline, creator, date, ingredients, method, glassware, garnish, profile, why-it-works, variations)
- [ ] **RECIPE-02**: Recipe detail view has "Edit" button — opens same form pre-filled
- [ ] **RECIPE-03**: "Upload Image" button on recipe detail — file picker → base64 → PUT to `images/{filename}` via GitHub API; displays confirmation with raw URL
- [ ] **RECIPE-04**: "Submit New Recipe" button in Recipe Book header routes to `#recipes/new`
- [ ] **RECIPE-05**: "Generate New Recipe with AI" button in Recipe Book — opens chat with pre-seeded prompt if Claude API key exists; shows copyable prompt otherwise

### Export / Import

- [ ] **EXPORT-01**: "Export All Data" in Settings bundles all 4 data files into `barkeeper-bjorn-export-YYYY-MM-DD.json` with version header; triggers browser download
- [ ] **EXPORT-02**: Secondary export: AI-context text (markdown/text summary of inventory + profile + originals for pasting into any AI session)
- [ ] **EXPORT-03**: "Import Data" in Settings — file picker accepts export JSON; shows diff preview before confirming; writes to GitHub in one batch
- [ ] **EXPORT-04**: Selective import: per-section checkboxes (import only inventory, only recipes, etc.)

### Recommender

- [ ] **REC-01**: "What are you in the mood for?" mood sliders at top of Recommender — 6-axis pre-loaded from saved profile, adjustable per-session without saving; recommendations re-score live
- [ ] **REC-02**: Inventory scope control: "Only what I have" → "Allow 1 missing" → "Allow 2 missing" — all results in one ranked list, missing items link to shopping list
- [ ] **REC-03**: Occasion tag filter chips on Recommender: "After dinner", "Aperitif", "Party / batch", "Refreshing / warm weather", "Cozy / winter"

### AI Integration

- [ ] **AI-01**: Anthropic API key field in Settings (stored in localStorage as `bb_anthropic_key`; masked with Reveal toggle)
- [ ] **AI-02**: "Ask Bjorn" chat panel unlocked when API key present — natural language input, full system prompt + inventory + profile injected as context
- [ ] **AI-03**: AI cocktail design mode — generate new original from scratch with rationale and attribution string
- [ ] **AI-04**: AI-powered recommendations — Bjorn explains why a recipe fits current mood, suggests variations
- [ ] **AI-05**: AI inventory advice — "best single bottle to add given what I have" with explanation
- [ ] **AI-06**: Classroom view (`#classroom`) — static reference pages: Techniques, Glassware, Ratios, Ingredients
- [ ] **AI-07**: With Claude API key: Classroom becomes interactive — user can ask Bjorn questions in context of current lesson

### Backend & Auth

- [ ] **BACKEND-01**: App supports two modes: `solo` (current PAT-based GitHub API) and `hosted` (Supabase); mode flag in config; solo mode fully preserved
- [ ] **BACKEND-02**: Supabase project setup: Postgres DB, Auth (email/password + GitHub OAuth), Storage bucket for images
- [ ] **BACKEND-03**: `supabase-api.js` replaces `github-api.js` reads/writes in hosted mode
- [ ] **BACKEND-04**: Email/password signup and login; "Continue with GitHub" OAuth option
- [ ] **BACKEND-05**: Auth token persisted in localStorage; no re-login on refresh
- [ ] **BACKEND-06**: Per-user data isolation via row-level security: `user_id = auth.uid()` on all reads/writes
- [ ] **BACKEND-07**: Account settings view: change email, password, display name, delete account
- [ ] **BACKEND-08**: DB tables: users (managed by Supabase Auth), inventory, recipes, profile, barkeeper — all with user_id FK

### Community

- [ ] **COMMUNITY-01**: Per-recipe visibility toggle (private default / public) in recipe editor
- [ ] **COMMUNITY-02**: Community feed (`#community`): paginated card grid of public originals, sorted by date or rating
- [ ] **COMMUNITY-03**: Community feed filter by base spirit, method, flavor profile (nearest axis match)
- [ ] **COMMUNITY-04**: "Save to my collection" — one-click copy community recipe to own wishlist or favorites
- [ ] **COMMUNITY-05**: Recipe ratings: star or thumbs up/down; aggregated average on community cards
- [ ] **COMMUNITY-06**: Discussion forum (`#forum`): stand-alone topics by category (Techniques, Ingredients, Spirits, Recommendations, Off-Topic)
- [ ] **COMMUNITY-07**: Recipe-attached comment threads: threaded replies (one level deep); markdown support
- [ ] **COMMUNITY-08**: Forum/comment moderation: soft delete, report, admin flag

### API & Multi-Agent

- [ ] **API-01**: `GET /cocktails/buildable` — returns recipes buildable from current inventory
- [ ] **API-02**: `GET /cocktails/recommend` — top N recommendations ranked by flavor-profile fit
- [ ] **API-03**: `POST /cocktails/design` — takes flavor constraints, returns new original
- [ ] **API-04**: `GET /inventory/gaps` — prioritized shopping list with unlock counts
- [ ] **API-05**: `GET /profile/axes` — current flavor axis positions and confidence
- [ ] **API-06**: `POST /session/log` — records a cocktail-built event and feedback
- [ ] **AGENT-SYS-01**: Sommelier sub-agent for fortified wines / vermouth / wine-adjacent ingredients
- [ ] **AGENT-SYS-02**: Analytics Brain sub-agent: pure signal, structured recommendations with confidence scores
- [ ] **AGENT-SYS-03**: Archivist sub-agent: recipe deduplication, attribution validation, version history, export
- [ ] **AGENT-SYS-04**: Shopper sub-agent: gap analysis, price checks (web search), ranked prioritized list

---

## v2 Requirements

Deferred — captured in Tier 4 parking lot; revisit after Tier 3 ships.

### Tier 4 Parking Lot

- **PARK-01**: Cocktail comparison mode (side-by-side structure analysis)
- **PARK-02**: Seasonal menu generator (4-drink seasonal menu from inventory + month)
- **PARK-03**: Guest mode (simplified 3-question flow, host's inventory)
- **PARK-04**: "What's depleted?" session-start tracker
- **PARK-05**: Barkeeper persona gallery (multiple built-in personas)
- **PARK-06**: Drink history log (session history table or history.md)
- **PARK-07**: Halal / NA mode (full non-alcoholic track)
- **PARK-08**: Multiple bars per user (home bar, vacation house, consulting)
- **PARK-09**: Event mode (temporary cocktail menu, depletion tracking, report)
- **PARK-10**: Public bartender profile page (shareable URL)

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Enterprise / POS integration (Tier 3.4) | Separate product spec; not this roadmap |
| Multi-bar per user (Tier 4) | Requires multi-user backend (Phase 6) to be complete first |
| White-label / franchise support | Product decision, not engineering scope |
| Native mobile app | Web-first; mobile is a separate product after community launches |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AGENT-01 through AGENT-06 | Phase 1 | Pending |
| ONB-01 through ONB-04 | Phase 2 | Pending |
| NAV-01 through NAV-05 | Phase 2 | Pending |
| SETTINGS-01 through SETTINGS-04 | Phase 2 | Pending |
| INV-01 through INV-02 | Phase 2 | Pending |
| INV-03 through INV-07 | Phase 4 | Pending |
| RECIPE-01 through RECIPE-05 | Phase 3 | Pending |
| EXPORT-01 through EXPORT-04 | Phase 3 | Pending |
| REC-01 through REC-03 | Phase 4 | Pending |
| AI-01 through AI-07 | Phase 5 | Pending |
| BACKEND-01 through BACKEND-08 | Phase 6 | Pending |
| COMMUNITY-01 through COMMUNITY-08 | Phase 7 | Pending |
| API-01 through API-06 | Phase 7 | Pending |
| AGENT-SYS-01 through AGENT-SYS-04 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 57 total
- Mapped to phases: 57
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-04*
*Last updated: 2026-05-04 after initial definition*
