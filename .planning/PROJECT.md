# Barkeeper Bjorn

## What This Is

Barkeeper Bjorn is a dual-purpose home bar management system: a set of portable Markdown agent templates that configure any LLM (Claude, ChatGPT, Gemini, Grok) as a personalized bartender assistant, and a companion static web UI (vanilla JS SPA) that manages bar data stored as JSON in GitHub. No build step, no backend, deployable to GitHub Pages or Netlify in minutes.

## Core Value

The user's real-world bar inventory and flavor profile should power both AI-driven conversation and rule-based recommendations — seamlessly, whether the user is in a chat session or the web app.

## Requirements

### Validated

- ✓ GitHub PAT authentication + repo config (Setup view) — existing
- ✓ Dashboard: stat bar, returning-user greeting, new-user CTA, recent originals — existing
- ✓ Onboarding wizard: full step-by-step flow, all 6 flavor axes (A/B cards), save to GitHub — existing
- ✓ Inventory manager: tabbed (Spirits / Pantry / Vetoes), bottle chips, add/remove, inline save — existing
- ✓ Recipe browser: card grid, originals + favorites + wishlist tabs, full recipe detail view — existing
- ✓ Profile dashboard: SVG hexagonal radar chart, live sliders, supplemental prefs, evolution log — existing
- ✓ Shopping list: priority-ranked list, add manually, "Got It" flow, ROI context — existing
- ✓ Recommender: 75-recipe classics DB, inventory matching, flavor-score ranking, buildable + one-away tabs — existing
- ✓ GitHub Pages deployment (pages.yml) — existing
- ✓ Netlify support (netlify.toml) — existing
- ✓ JSON schemas (schema/) — existing
- ✓ Modular agent prompt architecture (instructions/) — existing
- ✓ Session-state template — existing
- ✓ Analytics mode in agent instructions — existing
- ✓ JSON ↔ Markdown bidirectional sync spec — existing

### Active

**Agent Instructions (Tier 1):**
- [ ] Enforce one-question-at-a-time rule in agent onboarding
- [ ] Auto-launch INIT_PROMPT for fresh installs (no options-menu on first message)
- [ ] Cocktail image workflow: suggest Midjourney/DALL-E prompts, two variants
- [ ] Update recipes.md image template to use `<img>` tag format
- [ ] Session-start menu for returning users (warm greeting + 7-item numbered menu)
- [ ] Move bartender personalization to step 2 of agent onboarding

**Web UI — UX & Settings (Tier 3.1 mid-priority):**
- [ ] Onboarding: skip-and-return, slider axes replacing A/B cards, open-text inventory entry, barkeeper-first ordering
- [ ] Dashboard enhancements: Bjorn avatar images, expanded quick-action menu, settings button in nav
- [ ] Settings page: bartender identity, API keys (GitHub PAT + Anthropic), export/import entry, logout, danger zone
- [ ] Inventory search: real-time filter input + category dropdown

**Web UI — Content Management:**
- [ ] Recipe add/edit form (new original, full fields, append to recipes.originals)
- [ ] Image upload via GitHub API (file picker → base64 → PUT /contents/images/)
- [ ] Export/Import: JSON bundle + AI-context text export; selective import per section
- [ ] Recipe Book enhancements: "Submit New Recipe" button, "Generate with AI" button

**Web UI — Data Depth:**
- [ ] Inventory structured fields: bottle as object {type, brand, style, tier, notes}, in-place edit popover
- [ ] Expanded tier options (Dirt Cheap → Well → Standard → Call → Premium → Ultra-Premium → Craft)
- [ ] Strainer field: multi-select checkboxes instead of dropdown
- [ ] Recommender mood sliders: per-session axis overrides without saving
- [ ] Recommender scope toggle: "Only what I have" → "Allow 1 missing" → "Allow 2 missing"
- [ ] Occasion tag filter on recommender
- [ ] Ingredient name standardization / spell-check suggestions vs. canonical-names.js

**AI Integration:**
- [ ] Claude API integration (bring-your-own Anthropic key): "Ask Bjorn" chat panel, AI cocktail design, AI recommendations, inventory advice
- [ ] Classroom / Mixology 101: techniques, glassware, ratios, ingredients reference; AI-interactive with Claude API

**Backend & Multi-User (Tier 3.5-3.6):**
- [ ] Supabase backend: managed Postgres + Auth + Storage; replaces GitHub API for multi-user mode
- [ ] Solo mode preserved (PAT-based) alongside hosted mode (Supabase)
- [ ] Email/password + GitHub OAuth authentication
- [ ] Per-user data isolation (row-level security)
- [ ] Multi-user accounts: sign up, login, session persistence, account settings

**Community (Tier 3.7-3.8):**
- [ ] Per-recipe visibility toggle (private / public)
- [ ] Community feed: paginated card grid of public originals, filter by spirit/method/flavor
- [ ] "Save to my collection" one-click copy from community
- [ ] Recipe ratings (star or thumbs)
- [ ] Discussion forum: recipe-attached comments + stand-alone topics, markdown support, moderation

**API & Multi-Agent (Tier 3.2-3.3):**
- [ ] REST API (FastAPI): buildable cocktails, recommendations, cocktail design, inventory gaps, flavor axes, session log
- [ ] Multi-agent system: Sommelier, Analytics Brain, Archivist, Shopper sub-agents orchestrated by Bjorn

### Out of Scope

- Enterprise / POS integration — Tier 3.4 (separate product spec, not this roadmap)
- Tier 4 ideas parking lot — captured in to-do.md but not planned; revisit after Tier 3 is shipped

## Context

- Stack: vanilla ES6+ SPA, GitHub Contents API as backend, IIFE module pattern, no build step
- Data: 4 JSON files in `data/` (barkeeper, profile, inventory, recipes); schemas in `schema/`
- Auth: GitHub PAT in localStorage; SHA-based write conflict prevention
- Deployment: GitHub Pages (primary) + Netlify (alternative), both auto from `app/`
- Agent templates: single-file (`barkeeper-instructions.md`) + multi-file (`instructions/`) for platforms that support knowledge files
- Glenn has a PhD in physics and runs a Decision Sciences team — analytical framing and data-driven features are a natural fit

## Constraints

- **Tech stack**: Vanilla JS only for the web UI until Phase 6 (Supabase introduces supabase-js)
- **No build step**: All new views follow the IIFE module pattern; no bundler introduced until explicitly decided
- **Data compatibility**: Inventory schema changes (Phase 4) must handle both old string[] and new object[] formats during migration
- **CORS**: Anthropic API allows direct browser calls; verify before assuming a Cloudflare Worker proxy is needed for Claude API integration

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| GitHub API as backend (solo mode) | Zero infrastructure, free, PAT-authenticated, repo = storage | ✓ Good — works well for single user |
| Supabase for multi-user backend | Managed Postgres + Auth + Storage; frontend stays static | — Pending |
| Vanilla JS / no framework | No build step, no dependencies, directly deployable | ✓ Good — maintained cleanly |
| JSON is system-of-record; MD is human-readable view | Bidirectional sync handled by agent | ✓ Good |
| Coarse phase granularity | 7 broad phases covers all 4 tiers without over-fragmenting | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-04 after initialization*
