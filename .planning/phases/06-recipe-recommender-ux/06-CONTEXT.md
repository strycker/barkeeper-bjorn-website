# Phase 6: Recipe & Recommender UX - Context

**Gathered:** 2026-05-20
**Status:** Ready for planning
**Source:** Session Q&A (retroactive — code already implemented)

<domain>
## Phase Boundary

Elevate the Recipes and Recommender views from read-only display to a fully interactive
experience: chip-style cards everywhere, "I Made This" tracking, text search on both pages,
and action-button polish. Code was implemented before this CONTEXT.md was written; this
document records the locked decisions made during the pre-implementation Q&A.

Already shipped as Phase 5 close bugfixes (not re-planned here):
- REC-10: Heart/star buttons moved into rec-card-header (no longer position:absolute)
- REC-11: Heart/star filled/open toggle state

</domain>

<decisions>
## Implementation Decisions

### D-01: Universal Detail Panel
Every chip click — Favorites, Wishlist, Made, any recipe — opens the same universal
detail panel. The panel contains:
- Full recipe info: name, base, method, glassware, garnish, ingredients table
- Editable notes textarea (saves back to the correct list entry)
- Times Made tally section: current count, [Mark as Made / + Made It Again] button, [Reset] link

The panel is a modal overlay (`.recipe-detail-modal-overlay`) — not a route change.
Clicking outside or the ✕ button closes it.

### D-02: Universal Recipe JSON Format
All recipe sources (classics-db, originals, AI-generated, Favorites, Wishlist, Made)
use the same JSON schema fields. Each entry carries a `_source` field tracking provenance:
- `_source: 'classics-db'` — from the CLASSICS_DB dataset
- `_source: 'originals'` — user-created in Recipe Book
- `_source: 'ai-generated'` — produced by AI in Phase 7+

The `_source` field enables the detail panel to display provenance and enables future
lookup routing. All saved entries store `_source` at write time.

### D-03: Full Recipe Inline at Save Time
When a recipe is added to Favorites (`confirmed_favorites`), Wishlist (`wishlist`), or
Made (`made_log`), the **full recipe JSON is stored inline** — all fields present at save
time are copied into the list entry. No pointer-only references. No secondary lookup at
read time.

Rationale: works offline, survives classics-db updates without breaking saved entries,
and enables the universal detail panel to render without async fetch.

### D-04: made_log Schema
`made_log` is a new top-level array in `recipes.json`. Each entry is the full recipe
object plus tracking metadata:
```json
{
  "_source": "classics-db",
  "name": "...",
  "base": "...",
  "method": "...",
  "glassware": "...",
  "garnish": "...",
  "ingredients": [...],
  "times_made": 1,
  "first_made": "YYYY-MM-DD",
  "last_made": "YYYY-MM-DD",
  "notes": ""
}
```
Toggle behavior: ✓ on Recommender card — adds (times_made:1) if absent, removes if present.
From detail panel: [+ Made It Again] increments times_made; [Reset] removes entry entirely.

### D-05: Search Scope
- **Recipes page search** — filters the active tab only; clears on tab switch
- **Recommender search** — filters within current scope's visible cards (not the full DB)
Both searches match: name, base spirit, ingredient names. Case-insensitive substring.

### Claude's Discretion
- Tab ordering: Originals / Favorites / Wishlist / Made
- Made tab sort: most-recent-first by `last_made`
- Ingredient overflow: show first 5 chips, "+N more" for the rest
- Search input placement: above tabs (Recipes), above cards inside `.rec-main` (Recommender)
- Made badge styling: green `×N` badge on chip name
- Detail panel scroll behavior: max-height 90vh, overflow-y auto

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Data & Schema
- `data/recipes.json` — live data file; made_log added as empty array
- `schema/recipes.schema.json` — extend with made_log array schema

### Implementation Files
- `app/js/views/recipes.js` — Recipes view (already updated)
- `app/js/views/recommender.js` — Recommender view (already updated)
- `app/css/app.css` — stylesheet (Phase 6 additions appended)

### Project Context
- `.planning/ROADMAP.md` — Phase 6 requirements: REC-10, REC-11, RECIPE-MADE-01, RECIPE-MADE-02, RECIPE-VIEW-01, RECIPE-VIEW-02, RECIPE-SEARCH-01, REC-SEARCH-01
- `.planning/STATE.md` — project decisions and phase history
- `CLAUDE.md` — IIFE module pattern, no build step, vanilla ES6+

</canonical_refs>

<specifics>
## Specific Ideas

From Q&A:
- "Even new recipes completely generated from scratch by AI chats should conform to this JSON
  format with the same fields so that the AI suggestions can be displayed as chips as well."
- "The dataset file will ALSO need to be recorded in the chip, and there may need to be
  look-up references by the web page to load all of the chips when clicked." → resolved by D-03
  (full inline) and D-02 (_source field).

</specifics>

<deferred>
## Deferred Ideas

- AI-generated recipe chips from chat sessions landing in made_log / favorites — delivery in Phase 7
- `_source: 'ai-generated'` routing beyond the _source field — Phase 7
- Tally reset confirmation dialog — skipped for simplicity; plain [Reset] link is sufficient
- Per-chip notes for Originals — not in Phase 6 scope (Originals have their own detail view)

</deferred>

---

*Phase: 06-recipe-recommender-ux*
*Context gathered: 2026-05-20 via retroactive session Q&A*
