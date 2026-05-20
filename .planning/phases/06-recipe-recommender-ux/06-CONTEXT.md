# Phase 6: Recipe & Recommender UX - Context

**Gathered:** 2026-05-20 (updated 2026-05-20)
**Status:** Ready for planning

<domain>
## Phase Boundary

Elevate the Recipes and Recommender views from read-only display to a fully interactive
experience: chip-style cards everywhere, "I Made This" tracking, text search on both pages,
action-button polish, editable Originals from any context, and Originals discoverable in
Recommendations.

Core mental model (locked): **Pages are organizational views; chips are the interface.**
Clicking a chip from any page (Favorites, Wishlist, Made, Recommender) opens the same
universal modal. Behavior is driven by `_source`, not by which page the chip lives on.

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
From detail panel: [+ Made It Again] increments times_made and updates tally DOM inline (no close/reopen); [Reset] removes entry entirely.

### D-05: Search Scope
- **Recipes page search** — filters the active tab only (including Originals tab); clears on tab switch
- **Recommender search** — filters within current scope's visible cards (not the full DB)
Both searches match: name, base spirit, ingredient names. Case-insensitive substring.

### D-06: Originals Editable in Universal Modal
The modal detects `_source` and conditionally unlocks recipe fields:

**When `_source: 'originals'`:**
- All recipe fields are editable inputs: name, ingredients (add/remove rows), method, glassware, garnish
- Notes and tally remain editable as always
- Save writes **dual-write**: to `recipes.originals` (source of truth for the canonical record) AND patches the inline copy in whichever list (confirmed_favorites / wishlist / made_log) the chip came from

**When `_source: 'classics-db'` or `_source: 'ai-generated'`:**
- Recipe fields (name, ingredients, method, glassware, garnish) are **read-only**
- Only notes and tally are editable

This keeps the universal modal consistent while respecting provenance.

### D-07: Originals in Recommender
Originals are added to the Recommender scoring pool alongside CLASSICS_DB:
- Scored using existing `base`, `ingredients`, `method`, `occasion`/`tags` fields
- Mood axis weights default to 0.5 (neutral) if not set on the original (Originals store `profile` as prose text, not the axis object; prose yields neutral 0.5)
- Originals appear **mixed into regular results** (not a separate section) with a small `'Your original'` badge to distinguish them
- Originals that lack `base` or `ingredients` are excluded from scoring (cannot be matched)

**Matching strategy: Strategy B — inventory-aware matching (locked 2026-05-20).**
Originals are matched against the user's actual inventory like classics, NOT treated as
always-buildable. This requires the planner to:
- Normalize each Original into the engine's expected shape: synthesize `keywords`/`searchIn`
  per ingredient (reuse the Phase 5 REC-09 ingredient-derivation map where possible),
  derive `base` from the first ingredient or `base` field, default missing `tags` to `[]`,
  default missing mood axes to 0.5
- Guard `_hasIngredient` against missing `keywords` (engine currently calls
  `ingredient.keywords.map(...)` at recommender-engine.js:109 — will throw on raw Originals)
- Accept the known tradeoff: an Original whose ingredient names don't normalize to inventory
  tokens may not appear as buildable. This is expected behavior, not a bug.

### D-08: Duplicate Guard
- **Unique key:** name + base spirit (case-insensitive). Two recipes with the same name but different bases are treated as distinct.
- **Toggle behavior:** ♥/★/✓ buttons show filled when the recipe is already in the list; clicking a filled button **removes** it. Adding is blocked when already present — no duplicates possible.
- **Favorites and Wishlist are independent** — the same recipe can be in both simultaneously. They serve different intents (loved it vs. want to try it).
- **Made log** deduplicates by name+base: if already present, increments `times_made` instead of creating a new entry.

### D-09: Phase Completion
- Full UAT + VALIDATION.md (same pattern as Phases 3–5)
- UAT scope covers: all 8 original ROADMAP requirements (REC-10, REC-11, RECIPE-MADE-01/02, RECIPE-VIEW-01/02, RECIPE-SEARCH-01, REC-SEARCH-01) + 3 gap tasks (Originals search, schema, modal tally) + new additions (D-06 editable modal, D-07 Originals in Recommender, D-08 dedup guard)
- UAT and verification initiated by user via GSD commands — no auto-advance

### Claude's Discretion
- Tab ordering: Originals / Favorites / Wishlist / Made
- Made tab sort: most-recent-first by `last_made`
- Ingredient overflow: show first 5 chips, "+N more" for the rest
- Search input placement: above tabs (Recipes), above cards inside `.rec-main` (Recommender)
- Made badge styling: green `×N` badge on chip name
- Detail panel scroll behavior: max-height 90vh, overflow-y auto
- 'Your original' badge styling in Recommender: amber-colored, consistent with existing badge patterns

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Data & Schema
- `data/recipes.json` — live data file; `made_log` array present
- `schema/recipes.schema.json` — updated with `made_log` (madeEntry def) and full `wishlist`/`savedRecipe` shape

### Implementation Files
- `app/js/views/recipes.js` — Recipes view: universal modal (`showRecipeDetail`), all 4 tabs including Originals search fix, inline tally update
- `app/js/views/recommender.js` — Recommender view: ♥ ★ ✓ buttons, scoring, search
- `app/js/recommender-engine.js` — Engine: will need Originals pool as second input (D-07)
- `app/css/app.css` — stylesheet (Phase 6 additions appended)

### Project Context
- `.planning/ROADMAP.md` — Phase 6 requirements: REC-10, REC-11, RECIPE-MADE-01, RECIPE-MADE-02, RECIPE-VIEW-01, RECIPE-VIEW-02, RECIPE-SEARCH-01, REC-SEARCH-01
- `.planning/STATE.md` — project decisions and phase history
- `CLAUDE.md` — IIFE module pattern, no build step, vanilla ES6+

### Prior Phase Patterns
- `.planning/phases/05-polish-depth-ux-tidy/05-UAT.md` — UAT format to follow for Phase 6 UAT
- `.planning/phases/05-polish-depth-ux-tidy/05-VALIDATION.md` — Validation format to follow

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `showRecipeDetail(recipe, listKey, mainContainer)` in `recipes.js` — universal modal; extend to detect `_source` and conditionally render editable fields (D-06)
- `renderOriginalsGrid()` — already has `_filterRecipes()` wired; ingredient row HTML pattern reusable for editable modal ingredient rows
- `ingredientRowHtml(ing, i)` + `bindIngredientRemove(wrap)` — reusable for editable ingredient list inside modal
- `RecommenderEngine` in `recommender-engine.js` — pure scoring function; extend to accept `[...CLASSICS_DB, ...originals]` as input pool (D-07)
- `.rec-times-made-badge` CSS class — green `×N` badge pattern; reuse for 'Your original' badge with amber color variant

### Established Patterns
- **Dual-write pattern:** `State.patch('recipes', r => { ... })` + `State.save('recipes')` — used throughout; D-06 writes to two locations within a single patch
- **IIFE module:** all view code inside `const RecipesView = (() => { ... })()` — no globals
- **`Utils.escapeHtml()`** — mandatory on all user data before innerHTML insertion
- **Toggle state via array find:** `list.find(m => m.name === recipe.name && m.base === recipe.base)` — extend current name-only check to name+base (D-08)

### Integration Points
- `recommender.js` calls `RecommenderEngine.score(CLASSICS_DB, inventory, profile, filters)` — signature will need to accept originals as additional pool (D-07)
- `recipes.js` `showRecipeDetail()` currently builds static HTML via template literals — editable modal (D-06) will need conditional rendering based on `recipe._source`
- `State.get('recipes').originals` — the source of truth for Originals; D-06 dual-write patches this array

</code_context>

<specifics>
## Specific Ideas

From session Q&A:
- "Even new recipes completely generated from scratch by AI chats should conform to this JSON
  format with the same fields so that the AI suggestions can be displayed as chips as well."
- "Pages are simply ways of organizing chips. Being on the 'Originals' tab of 'Recipes' is
  one way to edit original recipes, but if an original recipe is accessed elsewhere (Favorites,
  Wishlist, or even Recommendations), then all editable fields should be editable."
- "Non-original recipes ought to have ingredient fields and instruction fields locked-down
  to PREVENT editing for these chips."
- "I would like Originals discoverable in the Recommend page, so please ensure that these
  recipes have the necessary components filled out to accommodate personalized, mood-based
  recommendations."

</specifics>

<deferred>
## Deferred Ideas

- AI-generated recipe chips from chat sessions landing in made_log / favorites — delivery in Phase 7
- `_source: 'ai-generated'` routing beyond the _source field — Phase 7
- Tally reset confirmation dialog — skipped for simplicity; plain [Reset] link is sufficient
- Per-chip notes for Originals — not needed; editable modal (D-06) covers notes for all sources
- 'Your original' badge hover tooltip showing creation date / creator — Phase 7 polish

</deferred>

---

*Phase: 06-recipe-recommender-ux*
*Context gathered: 2026-05-20 (updated 2026-05-20 via discuss-phase session)*
