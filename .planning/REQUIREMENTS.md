# Requirements — Barkeeper Bjorn

_Milestone: Web UI completion + Claude AI integration (Tiers 3.1.x + 3.1.6)_
_Generated: 2026-05-11 from PROJECT.md + research synthesis_

---

## v1 Requirements

### SETTINGS — Settings Page & Navigation

- [ ] **SET-01**: User can open a Settings view (`#settings`) from a gear icon in the nav bar
- [ ] **SET-02**: User can rename the bartender (writes to `barkeeper.json` via State.save)
- [ ] **SET-03**: User can select a bartender personality preset (Professional / Warm / Terse / Theatrical)
- [ ] **SET-04**: User can enter and save an Anthropic API key (stored in `bb_anthropic_key` localStorage, masked display, never committed)
- [ ] **SET-05**: User can select the default chat model (Haiku / Sonnet / Opus) stored in `bb_chat_model` localStorage
- [ ] **SET-06**: User can log out (clears all `bb_*` localStorage keys, redirects to Setup)
- [ ] **SET-07**: User can trigger "Reset all data" with a two-step confirmation (overwrites all 4 data files with empty defaults)
- [ ] **SET-08**: Settings page is the single entry point for Export and Import actions

### EXPORT — Data Portability (Export)

- [ ] **EXP-01**: User can download a JSON bundle of all 4 data files (`barkeeper.json`, `bar-owner-profile.json`, `inventory.json`, `recipes.json`) as `barkeeper-bjorn-export-YYYY-MM-DD.json`
- [ ] **EXP-02**: Export bundle includes `export_version` and `exported_at` metadata fields
- [ ] **EXP-03**: User can download an AI-context text export (Markdown summary of inventory + profile + originals) formatted for pasting into Claude, ChatGPT, Gemini, or Grok
- [ ] **EXP-04**: Export triggers a browser file download (Blob + URL.createObjectURL) with no server involvement

### IMPORT — Data Portability (Import)

- [ ] **IMP-01**: User can import from a previously exported JSON bundle via a file picker
- [ ] **IMP-02**: Import shows a diff preview (what will be replaced) before writing anything
- [ ] **IMP-03**: User can selectively import only specific sections (inventory, recipes, profile, barkeeper) via checkboxes
- [ ] **IMP-04**: Import validates bundle completeness before any write — missing required keys abort with error, never partial-overwrite
- [ ] **IMP-05**: After import completes, app calls `State.loadAll()` to refresh all SHAs
- [ ] **IMP-06**: Import requires explicit typed confirmation ("type IMPORT to confirm") before overwriting

### INV — Inventory Structured Fields

- [ ] **INV-01**: Each bottle entry is stored as an object `{ name, brand, type, style, tier, notes }` rather than a flat string
- [ ] **INV-02**: App normalizes existing flat-string entries to object format on load (idempotent, checks `_schema_version`)
- [ ] **INV-03**: Clicking a bottle chip opens an in-place edit popover with individual fields (no delete-and-re-add required)
- [ ] **INV-04**: Tier options include: Dirt Cheap / Well / Standard / Call / Premium / Ultra-Premium / Craft
- [ ] **INV-05**: Barware strainers field uses multi-select checkboxes (Hawthorne / Julep / Fine Mesh / Conical) instead of a single dropdown
- [ ] **INV-06**: Recommender engine normalizes bottle entries before keyword matching (handles both string and object formats)

### ONBOARD — Onboarding UX Improvements

- [ ] **ONB-01**: Every onboarding step has a "Skip for now →" link that saves null for that step and advances
- [ ] **ONB-02**: Dashboard shows "Revisit Onboarding" menu item that resumes from first unanswered step
- [ ] **ONB-03**: Onboarding draft state (`_step`, `_answers`) persists in `sessionStorage` under `bb_onboarding_draft`; `render()` only resets on explicit "Start Over"
- [ ] **ONB-04**: Bartender name/voice/personality step appears at step 2, immediately after user name and location
- [ ] **ONB-05**: Flavor axis steps use slider bars (matching the Profile page) with an explicit "Middle / Both / Depends on mood" center position, replacing A/B choice cards
- [ ] **ONB-06**: Optional free-text inventory entry step: user can paste a list of bottles (one per line or comma-separated); app parses and pre-populates inventory with a review/edit step before saving

### PARSER — Inventory Text Parser

- [ ] **PAR-01**: `inventory-parser.js` accepts a freeform text string and returns a structured result with categorized bottle entries and a REVIEW bucket for unknowns
- [ ] **PAR-02**: Parser matches against a keyword dictionary to classify entries by spirit category (whiskey / rum / agave / gin / etc.)
- [ ] **PAR-03**: Parser extracts tier cues from parenthetical content (e.g., "(premium)", "(bottom shelf)")
- [ ] **PAR-04**: Parser results display as a confirmation checklist with manual section-picker before any State write
- [ ] **PAR-05**: Unknown entries land in a REVIEW bucket; user can drag them to the correct section in the confirmation UI

### CHAT — Claude API Chat Panel

- [ ] **CHAT-01**: `#chat` route renders an "Ask Bjorn" chat panel accessible from the nav and dashboard
- [ ] **CHAT-02**: `claude-api.js` IIFE wraps all Anthropic API calls with `anthropic-dangerous-direct-browser-access: true` header required for browser CORS
- [ ] **CHAT-03**: Chat panel shows a "No API key" message with a link to Settings when `bb_anthropic_key` is absent
- [ ] **CHAT-04**: System prompt is built from bartender persona + flavor profile + compact inventory + vetoes (target 1500–2500 tokens total)
- [ ] **CHAT-05**: Responses stream token-by-token using `fetch` + `ReadableStream` + `TextDecoder` SSE parser
- [ ] **CHAT-06**: An AbortController is tied to the view lifecycle; `cleanup()` aborts any in-flight stream on navigation
- [ ] **CHAT-07**: Conversation history is held in-memory as a 10-turn sliding window (not persisted to GitHub)
- [ ] **CHAT-08**: Mid-stream SSE error events are caught and displayed as user-readable messages (not swallowed)
- [ ] **CHAT-09**: Rate-limit responses (429) surface the `retry-after` value to the user

### REC — Recommender Enhancements

- [ ] **REC-01**: Recommender view shows 6 per-session mood sliders (pre-filled from saved profile, adjustable without saving) that re-score results in real time
- [ ] **REC-02**: Scope control replaces fixed two-tab layout: segmented control for 0 / 1 / 2 missing ingredients
- [ ] **REC-03**: Occasion tag chips (After dinner / Aperitif / Party / Refreshing / Cozy) filter results by `occasion` field
- [ ] **REC-04**: When Claude API key is present, each recipe card shows an "Ask Bjorn about this" button that opens chat with a pre-seeded prompt

### DASH — Dashboard & Navigation Enhancements

- [ ] **DASH-01**: Header title bar shows `barkeeper_bjorn_002.png` as a small avatar next to "Barkeeper Bjorn" text
- [ ] **DASH-02**: Dashboard welcome section shows `bar_equipment_001.png` as a muted hero image
- [ ] **DASH-03**: Onboarding welcome step shows `barkeeper_bjorn_001.png` portrait
- [ ] **DASH-04**: Dashboard quick-action menu includes: "Revisit Onboarding", "Enhance Profile", "Recommend a Cocktail", "Chat with [bartender name]" (locked if no API key), "Feedback"
- [ ] **DASH-05**: Gear icon in nav bar links to `#settings`

---

## v2 Requirements (deferred)

- Recipe add/edit form (inline editor for originals)
- Image upload via GitHub API
- Inventory search + category filter
- Name standardization / spell-check suggestions
- Classroom / Mixology 101
- Supabase backend + multi-user accounts
- Community recipe sharing + discussion forum
- REST API + multi-agent system

---

## Out of Scope

- Backend / server-side code — GitHub API is the data layer for this milestone
- Multi-user authentication — single-user (PAT per fork) until Supabase milestone
- Community features (recipe sharing, ratings, forum) — Phase 3.7–3.8
- Enterprise / POS integration — separate product spec
- Native mobile app — web responsive only

---

## Traceability

_Updated: 2026-05-11_

| REQ-ID | Phase | Status |
|--------|-------|--------|
| SET-01 | Phase 1: Settings & Navigation | Pending |
| SET-02 | Phase 1: Settings & Navigation | Pending |
| SET-03 | Phase 1: Settings & Navigation | Pending |
| SET-04 | Phase 1: Settings & Navigation | Pending |
| SET-05 | Phase 1: Settings & Navigation | Pending |
| SET-06 | Phase 1: Settings & Navigation | Pending |
| SET-07 | Phase 1: Settings & Navigation | Pending |
| SET-08 | Phase 1: Settings & Navigation | Pending |
| DASH-01 | Phase 1: Settings & Navigation | Pending |
| DASH-02 | Phase 1: Settings & Navigation | Pending |
| DASH-03 | Phase 1: Settings & Navigation | Pending |
| DASH-04 | Phase 1: Settings & Navigation | Pending |
| DASH-05 | Phase 1: Settings & Navigation | Pending |
| EXP-01 | Phase 2: Export, Import & Inventory Fields | Pending |
| EXP-02 | Phase 2: Export, Import & Inventory Fields | Pending |
| EXP-03 | Phase 2: Export, Import & Inventory Fields | Pending |
| EXP-04 | Phase 2: Export, Import & Inventory Fields | Pending |
| IMP-01 | Phase 2: Export, Import & Inventory Fields | Pending |
| IMP-02 | Phase 2: Export, Import & Inventory Fields | Pending |
| IMP-03 | Phase 2: Export, Import & Inventory Fields | Pending |
| IMP-04 | Phase 2: Export, Import & Inventory Fields | Pending |
| IMP-05 | Phase 2: Export, Import & Inventory Fields | Pending |
| IMP-06 | Phase 2: Export, Import & Inventory Fields | Pending |
| INV-01 | Phase 2: Export, Import & Inventory Fields | Pending |
| INV-02 | Phase 2: Export, Import & Inventory Fields | Pending |
| INV-03 | Phase 2: Export, Import & Inventory Fields | Pending |
| INV-04 | Phase 2: Export, Import & Inventory Fields | Pending |
| INV-05 | Phase 2: Export, Import & Inventory Fields | Pending |
| INV-06 | Phase 2: Export, Import & Inventory Fields | Pending |
| PAR-01 | Phase 3: Inventory Text Parser | Pending |
| PAR-02 | Phase 3: Inventory Text Parser | Pending |
| PAR-03 | Phase 3: Inventory Text Parser | Pending |
| PAR-04 | Phase 3: Inventory Text Parser | Pending |
| PAR-05 | Phase 3: Inventory Text Parser | Pending |
| CHAT-01 | Phase 4: Claude Chat & Recommender Enhancements | Pending |
| CHAT-02 | Phase 4: Claude Chat & Recommender Enhancements | Pending |
| CHAT-03 | Phase 4: Claude Chat & Recommender Enhancements | Pending |
| CHAT-04 | Phase 4: Claude Chat & Recommender Enhancements | Pending |
| CHAT-05 | Phase 4: Claude Chat & Recommender Enhancements | Pending |
| CHAT-06 | Phase 4: Claude Chat & Recommender Enhancements | Pending |
| CHAT-07 | Phase 4: Claude Chat & Recommender Enhancements | Pending |
| CHAT-08 | Phase 4: Claude Chat & Recommender Enhancements | Pending |
| CHAT-09 | Phase 4: Claude Chat & Recommender Enhancements | Pending |
| REC-01 | Phase 4: Claude Chat & Recommender Enhancements | Pending |
| REC-02 | Phase 4: Claude Chat & Recommender Enhancements | Pending |
| REC-03 | Phase 4: Claude Chat & Recommender Enhancements | Pending |
| REC-04 | Phase 4: Claude Chat & Recommender Enhancements | Pending |
| ONB-01 | Phase 5: Onboarding UX | Pending |
| ONB-02 | Phase 5: Onboarding UX | Pending |
| ONB-03 | Phase 5: Onboarding UX | Pending |
| ONB-04 | Phase 5: Onboarding UX | Pending |
| ONB-05 | Phase 5: Onboarding UX | Pending |
| ONB-06 | Phase 5: Onboarding UX | Pending |
