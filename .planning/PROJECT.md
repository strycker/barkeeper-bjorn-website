# Barkeeper Bjorn Web UI

## What This Is

A personal home-bar management web app — no backend, no build step — that runs entirely as a static SPA deployed on GitHub Pages. It reads and writes JSON data files stored in the user's own GitHub repo via the GitHub Contents API. The app lets you manage your inventory, track recipes, get cocktail recommendations from your current bar stock, and (soon) chat with an AI bartender powered by a bring-your-own Anthropic API key.

## Core Value

Given what's in your bar right now, tell me what I can make — and make it personal to my taste.

## Requirements

### Validated

- ✓ GitHub PAT auth + repo config → stored in localStorage, no backend — Phase 3.1
- ✓ Setup view: PAT + owner/repo/branch form with connection validation — Phase 3.1
- ✓ Dashboard: returning-user greeting, stat bar, new-user CTA — Phase 3.1
- ✓ Onboarding wizard: 15-step flow covering name, track, flavor axes (A/B), equipment, smoke pref — Phase 3.1
- ✓ Inventory manager: tabbed (Spirits/Pantry/Vetoes), bottle chips, add/remove, save to GitHub — Phase 3.1
- ✓ Recipe browser: card grid + detail drill-down (Originals/Favorites/Wishlist tabs) — Phase 3.1
- ✓ Profile dashboard: SVG radar chart, live slider updates, supplemental prefs, evolution log — Phase 3.1
- ✓ Shopping list: priority-ranked, "Got It" flow, add-item form — Phase 3.1
- ✓ GitHub Pages deployment via Actions workflow — Phase 3.1.1
- ✓ Cocktail recommender: 75-recipe classics DB, inventory matching, flavor scoring, buildable + one-away tabs — Phase 3.1.2

### Active

- [ ] Settings page: logout, bartender rename/personality, API keys, export/import entry point
- [ ] Export / Import: JSON bundle download + AI-context text export + selective import
- [ ] Onboarding UX: skip/return, slider bars for flavor axes + Middle option, barkeeper-first step, open-text inventory paste
- [ ] Dashboard & nav enhancements: images (header avatar, welcome hero, onboarding portrait), expanded menu items
- [ ] Inventory structured fields: brand/type/style/tier objects, in-place editing, new tiers (Standard, Dirt Cheap), strainer checkboxes
- [ ] Claude API integration: bring-your-own Anthropic key, chat panel, AI cocktail design, AI recommendations
- [ ] Recommender enhancements: per-session mood sliders, scope toggle (0/1/2 missing), occasion tags
- [ ] Recipe add/edit form: inline editor for originals with all fields
- [ ] Recipe Book buttons: Submit New Recipe, Generate with AI

### Out of Scope

- Backend / server — no server-side code this milestone; GitHub API is the data layer
- Multi-user / auth system — single-user (PAT per fork) until Phase 3.5 (Supabase)
- Community recipe sharing / forum — Phase 3.7–3.8, not this milestone
- Automated test suite — no test framework; manual + CI pipeline only (acknowledged debt)
- Mobile native app — web responsive only

## Context

### Codebase state
- Vanilla ES6+ SPA in `app/` — no framework, no bundler, no npm dependencies
- IIFE module pattern throughout; views export a single `render(container)` function
- State module holds 4 JSON data files in memory with SHA-tracked GitHub writes
- Hash-based router (`#dashboard`, `#inventory`, `#recipes`, `#profile`, `#shopping`, `#recommender`)
- Dark amber/bourbon theme; single CSS file with custom properties
- GitHub Actions deploys `app/` to GitHub Pages on push to main

### User context
- Primary user (Glenn) has a PhD in physics, runs a Decision Sciences team — appreciates analytics depth
- Has existing Barkeeper Bjorn data from Claude Projects / ChatGPT sessions — wants import path
- Real inventory already populated via onboarding; recommender live but untested against real inventory
- Wants to share with a few non-technical friends/family — setup must be accessible

### Key friction points (from user feedback)
- Onboarding is tedious — needs paste-in capability for existing data
- Inventory uses freeform strings — needs structured fields (brand, style, tier)
- Recommender exists but mood/occasion targeting is missing
- AI chat is the most-wanted feature; no LLM inference runs in the browser yet

### Technical decisions already made
- No backend this milestone — GitHub Contents API remains the data layer
- Bring-your-own API key pattern for Claude integration (stored in localStorage, browser-only)
- JSON schema in `schema/` validated; `data/*.json` are system of record
- `classics-db.js` uses keyword+searchIn matching strategy for inventory-to-recipe matching

## Constraints

- **Tech stack**: Vanilla JS only — no framework, no bundler, no npm. Every new module follows the IIFE pattern.
- **No backend**: All data lives in the user's GitHub repo. No server, no database, no auth service this milestone.
- **Backward compatibility**: Existing `data/*.json` files and localStorage keys must not break. Schema changes require migration helpers.
- **Deployment**: Static files only — must deploy cleanly to GitHub Pages and Netlify with zero config.
- **API key security**: Anthropic key stored in localStorage only, never sent anywhere except `api.anthropic.com`. Never logged, never committed.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| GitHub Contents API as sole data layer | No backend required; user owns data in their own repo; trivial fork-to-deploy | ✓ Good |
| PAT in localStorage (not OAuth) | OAuth needs a backend callback; PAT is sufficient for single-user; acceptable tradeoff | ✓ Good |
| IIFE module pattern (not ES modules) | Works without a bundler; GitHub Pages serves without MIME-type issues; no build step | ✓ Good |
| Vanilla JS, no framework | Zero dependencies, zero build surface; trivial to deploy and audit | ✓ Good |
| Bring-your-own Anthropic API key | No server needed for AI; user controls cost; same pattern as GitHub PAT | — Pending |
| JSON as system of record (not Markdown) | Web UI writes JSON; agent sessions use Markdown; bidirectional sync via `_sync` metadata | ✓ Good |
| 75-recipe classics database in browser | No API call needed for recommendations; instant results; easily extended | ✓ Good |

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
