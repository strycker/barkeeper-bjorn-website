# Phase 6: Recipe & Recommender UX - Research

**Researched:** 2026-05-20
**Domain:** Vanilla ES6+ SPA — recipes.js / recommender.js view layer, CSS additions, data/recipes.json schema
**Confidence:** HIGH (retroactive — all findings from reading live implementation files)

> **RETROACTIVE RESEARCH PASS.** The code for Phase 6 has already been implemented and
> committed. This document records what was actually built, gaps against the ROADMAP spec,
> and deviations from the CONTEXT.md decisions. The planner uses this to write accurate
> PLAN.md files that either verify the shipped work or identify remaining gaps.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01: Universal Detail Panel**
Every chip click — Favorites, Wishlist, Made, any recipe — opens the same universal
detail panel (`.recipe-detail-modal-overlay`). Contains: full recipe info, editable notes
textarea (saves back to the correct list entry), and a Times Made tally with
[Mark as Made / + Made It Again] and [Reset] buttons. Modal overlay — not a route
change. Click outside or ✕ to close.

**D-02: Universal Recipe JSON Format**
All recipe sources carry a `_source` field: `'classics-db'`, `'originals'`, or
`'ai-generated'`. Stored at write time.

**D-03: Full Recipe Inline at Save Time**
Favorites, Wishlist, and Made entries store the full recipe JSON inline at save time —
no pointer-only references. Enables offline rendering without secondary fetch.

**D-04: made_log Schema**
`made_log` is a new top-level array in `recipes.json`. Each entry is the full recipe
object plus: `_source`, `times_made` (integer), `first_made` (YYYY-MM-DD),
`last_made` (YYYY-MM-DD), `notes` (string). Toggle on Recommender: adds (times_made:1)
if absent, removes if present. Detail panel: [+ Made It Again] increments; [Reset]
removes entirely.

**D-05: Search Scope**
- Recipes page search — filters active tab only; clears on tab switch
- Recommender search — filters within current scope's visible cards
Both match: name, base spirit, ingredient names. Case-insensitive substring.

### Claude's Discretion

- Tab ordering: Originals / Favorites / Wishlist / Made
- Made tab sort: most-recent-first by `last_made`
- Ingredient overflow: show first 5 chips, "+N more" for the rest
- Search input placement: above tabs (Recipes), above cards inside `.rec-main` (Recommender)
- Made badge styling: green `×N` badge on chip name
- Detail panel scroll behavior: max-height 90vh, overflow-y auto

### Deferred Ideas (OUT OF SCOPE)

- AI-generated recipe chips from chat sessions landing in made_log / favorites — delivery in Phase 7
- `_source: 'ai-generated'` routing beyond the _source field — Phase 7
- Tally reset confirmation dialog — skipped for simplicity; plain [Reset] link is sufficient
- Per-chip notes for Originals — not in Phase 6 scope (Originals have their own detail view)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Implementation Status |
|----|-------------|----------------------|
| REC-10 | Recipe card action buttons (♥ ☆) moved into `rec-card-header` flex row | IMPLEMENTED (shipped as Phase 5 bugfix) |
| REC-11 | Heart/star filled/open based on Favorites/Wishlist status; toggle removes | IMPLEMENTED (shipped as Phase 5 bugfix) |
| RECIPE-MADE-01 | ✓ / ○ "I Made This" third action button on every Recommender card — adds to `made_log[]`; toggle removes | IMPLEMENTED |
| RECIPE-MADE-02 | New "Made" tab in Recipes view — shows `made_log` as rec-card chips, most-recent first, each with × button | IMPLEMENTED |
| RECIPE-VIEW-01 | Favorites and Wishlist tabs render as `rec-card` chips with × button | IMPLEMENTED |
| RECIPE-VIEW-02 | Favorites/Wishlist chips clickable to show full detail (ingredients, method, glassware) | IMPLEMENTED (via universal detail panel) |
| RECIPE-SEARCH-01 | Search input above Recipes page tabs — instant filter across active tab | IMPLEMENTED |
| REC-SEARCH-01 | Search input on Recommendations page — instant filter across all sections | IMPLEMENTED |
</phase_requirements>

---

## Summary

Phase 6 was implemented before the formal research/plan cycle. All eight requirements from
the ROADMAP are present in the live code. The core architectural pattern is:

1. `recipes.js` — adds a fourth "Made" tab, upgrades Favorites/Wishlist tabs to `rec-card`
   chip rendering, implements a universal detail modal (`showRecipeDetail`), and adds a
   search input above the tab row that clears on tab switch.
2. `recommender.js` — adds a third action button (`.rec-made-btn`) alongside the existing
   heart/star buttons, wires it to toggle `made_log` entries, and places a search input
   (`#rec-search`) inside `.rec-main` above `.rec-cards`.
3. `app/css/app.css` — Phase 6 additions at the end of the file: `.rec-made-btn`,
   `.recipe-detail-modal-overlay`, `.recipe-detail-modal`, `.rdm-*`, `.recipe-search-wrap`,
   `.recipe-search-input`, `.rec-search-wrap`, `.rec-search-input`, `.rec-times-made-badge`.

**Primary recommendation:** No missing features require new implementation. One schema gap
exists (`schema/recipes.schema.json` does not yet declare `made_log` or the enriched
`wishlist` shape). One behavioral deviation from CONTEXT.md D-04 exists in the detail panel
(Reset removes the entry from `made_log` via the [Reset] button, which matches D-04; this
is correct). Planner should write verification-only PLAN.md files plus a single schema-gap
fix plan.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| "I Made This" toggle state | Browser / Client | — | Pure client-side read/write to State; no server roundtrip beyond GitHub API save |
| made_log persistence | Browser / Client (GitHub API) | — | State.patch + State.save writes to GitHub JSON file |
| Recipe chip rendering (Favorites/Wishlist/Made) | Browser / Client | — | IIFE view renders from State.get('recipes') |
| Universal detail modal | Browser / Client | — | DOM overlay appended to document.body; reads/writes State |
| Text search filtering | Browser / Client | — | In-memory filter over State arrays; no server query |
| CSS for new components | CDN / Static | — | Single app.css served as static file |
| JSON schema validation | Build-time / Dev tooling | — | schema/ files are reference docs; no runtime enforcement |

---

## Standard Stack

### Already in Use (no new dependencies)

| Component | Pattern | Notes |
|-----------|---------|-------|
| IIFE modules | `const View = (() => { ... return { render }; })();` | Unchanged — recipes.js and recommender.js both follow this |
| State API | `State.get()`, `State.patch()`, `State.save()` | Used correctly throughout Phase 6 additions |
| Utils | `Utils.escapeHtml()`, `Utils.showToast()` | Used in all new DOM output |
| GitHubAPI | Invoked transitively by `State.save('recipes')` | No direct calls added in Phase 6 |

**No new npm packages. No new `<script>` tags. No new files.**
[VERIFIED: reading app/js/views/recipes.js and recommender.js]

---

## Implementation Findings (Per Requirement)

### REC-10 + REC-11: Card Layout & Toggle State

**Status: IMPLEMENTED** [VERIFIED: recommender.js lines 84–88, 143–146]

Both `_renderCard()` and `_renderTwoAwayCard()` produce a `.rec-card-actions` div inside
`.rec-card-header`. The heart (`.rec-fav-btn`) and star (`.rec-wish-btn`) buttons carry
`class="rec-fav-btn active"` when the recipe is in the corresponding list, and render
filled HTML entities (&#9829; / &#9733;) vs. open (&#9825; / &#9734;) accordingly.
Clicking wires through `_rerender()` toggle logic (lines 307–355 in recommender.js).

These were shipped as Phase 5 close bugfixes per CONTEXT.md and STATE.md. They are fully
present in the codebase.

---

### RECIPE-MADE-01: "I Made This" Button on Recommender Cards

**Status: IMPLEMENTED** [VERIFIED: recommender.js lines 87, 144–145, 357–381]

A third button `.rec-made-btn` is present in both `_renderCard()` and
`_renderTwoAwayCard()`. State:
- `isMade = (savedRecipes.made_log || []).some(r => r.name === recipe.name)`
- Active: renders `&#10003;` (✓) with class `active`; inactive: `&#9675;` (○)

Toggle logic (lines 357–381):
- **Remove:** filters `made_log` by name, saves, re-renders
- **Add:** unshifts `{ ...item.recipe, _source: 'classics-db', times_made: 1, first_made: today, last_made: today, notes: '' }` — matches D-04 schema exactly

CSS: `.rec-made-btn`, `.rec-made-btn:hover`, `.rec-made-btn.active` — green color scheme.

**Deviation from ROADMAP spec:** ROADMAP RECIPE-MADE-01 says schema `{name, date_made, notes?}`.
The actual implementation stores the full recipe object plus tracking metadata (D-03/D-04
from CONTEXT.md). This is an intentional upgrade locked in CONTEXT.md — not a gap.

---

### RECIPE-MADE-02: "Made" Tab in Recipes View

**Status: IMPLEMENTED** [VERIFIED: recipes.js lines 40–43, 165–167, 281–341]

Fourth tab "Made (N)" added to the tab bar. `renderMadeList()` function (lines 281–341):
- Filters `made_log` by `_searchQuery` via `_filterRecipes()`
- Sorts by `last_made` descending (most-recent first) — matches Claude's Discretion
- Renders each entry as `.rec-card` with:
  - `.rec-times-made-badge` showing `×N` — green badge, matches Claude's Discretion
  - Last-made date in meta row
  - × remove button (filters by name, saves, re-renders to `made` tab)
- Empty state guides user to the Recommender's ○ button

**Tab ordering implemented:** Originals / Favorites / Wishlist / Made — matches Claude's
Discretion.

---

### RECIPE-VIEW-01: Favorites and Wishlist as rec-card Chips

**Status: IMPLEMENTED** [VERIFIED: recipes.js lines 223–279]

`renderRecipeChips()` renders both `confirmed_favorites` and `wishlist` as `.rec-card`
elements, replacing the former plain `.card` list. Features:
- Ingredient chips: first 5, then `+N more` span — matches Claude's Discretion
- × remove button per card, de-duplicates by `.name`
- Search filter applied via `_filterRecipes()`
- Empty states for both no-data and no-search-match cases

---

### RECIPE-VIEW-02: Favorites/Wishlist Chips Clickable for Full Detail

**Status: IMPLEMENTED** [VERIFIED: recipes.js lines 263–278]

`card.addEventListener('click', ...)` delegates to `showRecipeDetail(recipe, listKey, mainContainer)` — skipping the click if the event target is the remove button. The universal detail modal opens with full ingredients table, garnish, Times Made tally, and editable notes textarea.

**Deviation from ROADMAP spec:** ROADMAP says "full classics-db detail". The implementation
uses inline-stored full recipe data (D-03) — no secondary classics-db lookup at read time.
This is intentional per CONTEXT.md D-03 and actually more robust (works for any `_source`).

---

### RECIPE-SEARCH-01: Search on Recipes Page

**Status: IMPLEMENTED** [VERIFIED: recipes.js lines 5–15, 35–37, 49–63]

- Module-level `_searchQuery` variable (resets to `''` on each `render()` call)
- `.recipe-search-wrap` / `#recipe-search` input rendered above the tab row (lines 35–37)
- `input` event listener: updates `_searchQuery`, calls `renderTab()` with current active tab
- Tab click listener: resets `_searchQuery = ''` and `searchInput.value = ''` before
  switching tab — clears on tab switch as specified in D-05
- `_filterRecipes()` matches: `name`, `base`, ingredient `name` — case-insensitive substring

**Note:** Originals tab does NOT filter via `_filterRecipes()` — `renderOriginalsGrid()`
does not call `_filterRecipes()`. This is a partial gap: search input exists above the
Originals tab but has no effect on that tab's content.

---

### REC-SEARCH-01: Search on Recommendations Page

**Status: IMPLEMENTED** [VERIFIED: recommender.js lines 35, 241–253, 487–493, 638–640]

- Module-level `_searchQuery` (does NOT reset on `render()` — intentionally persists within
  session per the "preserve between re-renders" approach)
- `#rec-search` input rendered inside `.rec-main` above `.rec-cards` (line 638–640)
- `_attach()` wires `input` event (lines 487–493): updates `_searchQuery`, calls `_rerender()`
- `applyFilters()` in `_rerender()` (lines 241–253) applies `_searchQuery` alongside
  base-spirit and occasion filters
- Matches: `recipe.name`, `recipe.base`, ingredient `name` — case-insensitive substring

---

### D-01: Universal Detail Panel

**Status: IMPLEMENTED** [VERIFIED: recipes.js lines 343–446]

`showRecipeDetail(recipe, listKey, mainContainer)` creates a `.recipe-detail-modal-overlay`
and appends it to `document.body`. Contents per D-01:
- Name, base, method, glassware, garnish (ingredients table)
- Times Made tally with count display and [Mark as Made / + Made It Again] button
- [Reset] button shown when `timesMade > 0` — removes from `made_log` (not a confirmation
  dialog, per Deferred)
- Editable notes textarea that `State.patch()`es the correct list entry by name

**Close behavior:** ✕ button, close-btn button, and overlay click all invoke `close()`.

**Gap:** The `showRecipeDetail` function looks up the existing `madeEntry` once at open
time (line 344–346). If the user clicks "Mark as Made" and the modal re-opens via a
subsequent flow, the count will be correct (re-queried from State at next open). But the
modal does NOT live-update the tally count within a single open session after clicking
[+ Made It Again] — the modal closes on [Mark as Made] (line 429) but does NOT close on
[+ Made It Again] clicks. If a user clicks [+ Made It Again] twice without closing, the
tally display will be stale. This is an edge case, not a blocking bug.

---

### D-04: made_log Schema in recipes.json

**Status: PARTIALLY IMPLEMENTED** [VERIFIED: data/recipes.json line 334]

`"made_log": []` exists as a top-level array in `data/recipes.json`. Entries written by
both recommender.js and recipes.js include: full recipe object fields, `_source`,
`times_made`, `first_made`, `last_made`, `notes`.

**Schema gap:** `schema/recipes.schema.json` does NOT declare `made_log` as a property,
and the `wishlist` definition still uses the old minimal shape
`{name, ingredients_summary?, pending?}` rather than the full recipe object shape that
is actually stored. This is a documentation gap — runtime behavior is correct.

---

## Architecture Patterns

### Pattern 1: rec-card Chip Rendering (reused across views)

Both `recipes.js` (`renderRecipeChips`, `renderMadeList`) and `recommender.js`
(`_renderCard`, `_renderTwoAwayCard`) produce the same `.rec-card` structure:

```
.rec-card
  .rec-card-header
    div (name + meta)
    .rec-card-actions (buttons)
  .rec-occasion (optional)
  .rec-ingredients (chip row)
```

The pattern is consistent. The planner does not need to create any new card structures.

### Pattern 2: State.patch + State.save + re-render

Every write in Phase 6 follows:
```javascript
State.patch('recipes', r => { /* mutate */ });
State.save('recipes').then(() => {
  Utils.showToast('...');
  _rerender(container); // or render(mainContainer, { tab: ... });
});
```

Errors are caught with `.catch(err => Utils.showToast('Save failed: ' + err.message, 'error'))`.

### Pattern 3: Module-level filter state

Both views use module-level `let _searchQuery = ''` variables. In `recipes.js` this resets
on `render()`. In `recommender.js` this persists across `_rerender()` calls (intentional —
preserves search state when scope/filter changes).

### Anti-Patterns to Avoid

- **Deduplication by `.name` only:** Both `renderRecipeChips` and the Made toggle logic
  identify entries by `.name` (not by `.id`). This is consistent but could cause issues
  if two recipes share a name. Acceptable for current scope — flagged for awareness.
- **No live tally refresh in modal:** The detail modal does not re-read `made_log` after
  [+ Made It Again] clicks. See gap note in RECIPE-VIEW-02 section.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal overlay | custom modal system | existing `.confirm-dialog-overlay` CSS pattern + `recipe-detail-modal` CSS | already in app.css; Phase 6 adds modal-specific classes on the same z-index/backdrop pattern |
| Toast notifications | custom notification | `Utils.showToast(msg, type)` | used across all views |
| State persistence | direct GitHub API calls | `State.patch()` + `State.save()` | handles SHA conflicts, sequential saves, subscriptions |

---

## Common Pitfalls

### Pitfall 1: Tab-cleared search state on render()

**What goes wrong:** `_searchQuery` is reset to `''` at the top of `recipes.js`'s `render()`.
If a PLAN calls `render(container)` after a save instead of `render(container, { tab: X })`,
the user is returned to the Originals tab with search cleared — even if they were on the
Favorites tab.
**How to avoid:** Always pass `{ tab: activeTabName }` when re-rendering after a save that
was triggered from a non-Originals tab.
**Evidence:** `renderRecipeChips` remove handler (line 272) correctly passes
`{ tab: 'favorites' }` or `{ tab: 'wishlist' }`.

### Pitfall 2: Deduplication key is recipe.name (not recipe.id)

**What goes wrong:** `made_log.find(m => m.name === recipe.name)` — if two classics-db
entries share a name, one write would overwrite both. The classics-db uses unique IDs
but they are not transferred to the action buttons' `data-name` attribute.
**How to avoid:** Acceptable for Phase 6 scope. No fix required unless classics-db grows
duplicate names.

### Pitfall 3: Schema does not match runtime data

**What goes wrong:** `schema/recipes.schema.json` defines `wishlist` items as
`{name, ingredients_summary?, pending?}` but the live data stores full recipe objects.
The `made_log` array has no schema entry at all.
**How to avoid:** Update the schema in the plan that addresses this gap (see Open Questions).

### Pitfall 4: Originals tab search has no effect

**What goes wrong:** The search input is rendered above all tabs, but `renderOriginalsGrid()`
does not call `_filterRecipes()`. Typing in the search box while on the Originals tab does
nothing.
**Resolution options:** (a) Wire `_filterRecipes` into `renderOriginalsGrid` — simple fix;
(b) Accept as out-of-scope for Phase 6.

---

## Code Examples

### rec-card structure (recipes.js renderRecipeChips)

```javascript
// Source: app/js/views/recipes.js lines 238–262
card.innerHTML = `
  <div class="rec-card-header">
    <div style="flex:1;min-width:0;">
      <div class="rec-card-name">${Utils.escapeHtml(recipe.name)}</div>
      <div class="rec-card-meta">
        ${recipe.base ? `<span class="rec-base">...</span>` : ''}
        ...
      </div>
    </div>
    <button class="btn-icon" data-remove title="Remove" style="flex-shrink:0;">✕</button>
  </div>
  <div class="rec-ingredients">${ingChips}${overflow}</div>`;
```

### made_log write (recommender.js _rerender)

```javascript
// Source: app/js/views/recommender.js lines 372–379
const today = new Date().toISOString().slice(0, 10);
State.patch('recipes', r => {
  r.made_log = r.made_log || [];
  r.made_log.unshift({
    ...item.recipe, _source: 'classics-db',
    times_made: 1, first_made: today, last_made: today, notes: ''
  });
});
State.save('recipes').then(() => { Utils.showToast('Marked as made ✓'); _rerender(container); });
```

---

## State of the Art

| Old Shape | Phase 6 Shape | Impact |
|-----------|--------------|--------|
| Favorites tab: plain `.card` list | Favorites tab: `.rec-card` chips matching Recommender style | Visual consistency achieved |
| Wishlist tab: plain `.card` list | Wishlist tab: `.rec-card` chips | Ditto |
| No Made tab | Made tab with `rec-card` chips + `×N` badge + `last_made` date | RECIPE-MADE-02 satisfied |
| rec-card: 2 action buttons (♥ ☆) | rec-card: 3 action buttons (♥ ☆ ✓) | RECIPE-MADE-01 satisfied |
| No search on Recipes page | Search input above tab bar | RECIPE-SEARCH-01 satisfied |
| No search on Recommender page | Search input in `.rec-main` above cards | REC-SEARCH-01 satisfied |

**Deprecated/outdated:**
- `wishlist` schema definition in `recipes.schema.json`: old shape `{name, ingredients_summary?, pending?}` — superseded by full recipe object inline storage

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Originals tab search gap (no `_filterRecipes` call) is not yet fixed | RECIPE-SEARCH-01 findings | If it was fixed after the files I read, the plan would add duplicate logic |
| A2 | The `schema/recipes.schema.json` gap has not been addressed elsewhere | Schema gap | Low — confirmed by reading the file |

---

## Open Questions

1. **Originals tab search gap**
   - What we know: Search input exists above all tabs; `renderOriginalsGrid()` does not
     call `_filterRecipes()`; other three tabs do filter.
   - What's unclear: Was this intentional (Originals has its own card-grid pattern), or
     an oversight?
   - Recommendation: Planner should include a task to wire `_filterRecipes` into
     `renderOriginalsGrid`, or explicitly mark it as out of scope with a ROADMAP note.

2. **`schema/recipes.schema.json` needs made_log + updated wishlist shape**
   - What we know: Runtime data is correct; schema is stale.
   - Recommendation: One-task fix — add `made_log` array definition and update `wishlist`
     items to the full recipe object shape.

3. **Detail modal tally not live-refreshed on repeat [+ Made It Again] clicks**
   - What we know: The count shown is read once at modal open time. The modal does NOT
     close after [+ Made It Again].
   - Recommendation: Either close the modal after [+ Made It Again] (simpler, matches
     [Mark as Made] behavior), or re-read the tally count from State on each click and
     update the DOM span. The planner should pick one.

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — vanilla JS SPA with no build step, no
package manager, no CLI tooling. Only `python3 -m http.server` needed to serve locally.)

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None (vanilla JS SPA — no Jest, Vitest, or Playwright configured) |
| Config file | None |
| Quick run command | Manual browser smoke test via `python3 -m http.server 8000` |
| Full suite command | Manual UAT checklist (see Phase 5 VALIDATION.md pattern) |

There is no automated test infrastructure for this project. All validation is manual UAT.
The Nyquist sampling model maps to a manual checklist per wave, with a full UAT pass before
Phase 6 closure.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REC-10 | ♥ ☆ buttons are in header row, not position:absolute | manual-visual | — | N/A |
| REC-11 | Clicking filled ♥ removes from Favorites; fills on add | manual-interaction | — | N/A |
| RECIPE-MADE-01 | ○ button on Recommender card adds to made_log; ✓ button removes | manual-interaction | — | N/A |
| RECIPE-MADE-02 | Made tab shows made_log chips most-recent-first with × remove | manual-interaction | — | N/A |
| RECIPE-VIEW-01 | Favorites + Wishlist tabs render as rec-card chips with × | manual-visual | — | N/A |
| RECIPE-VIEW-02 | Clicking chip opens detail modal with ingredients table | manual-interaction | — | N/A |
| RECIPE-SEARCH-01 | Typing "gin" in Recipes search filters active tab; clears on tab switch | manual-interaction | — | N/A |
| REC-SEARCH-01 | Typing "negroni" in Recommender search hides non-matching cards | manual-interaction | — | N/A |
| D-04 | made_log entry has times_made, first_made, last_made, notes, _source | data inspection | — | N/A |
| D-01 | Detail modal shows tally, notes textarea, close-on-overlay-click | manual-interaction | — | N/A |

### Sampling Rate

- **Per task commit:** Smoke test the specific feature changed in browser
- **Per wave merge:** Full UAT checklist (all 10 items above)
- **Phase gate:** All UAT items pass before `/gsd-verify-work`

### Wave 0 Gaps

None — no test files to create (no test framework). Wave 0 for Phase 6 should produce a
`TEST-CHECKLIST.md` analogous to the Phase 5 VALIDATION.md, listing all 10 UAT items as
manual checkboxes.

---

## Security Domain

The application stores user data in GitHub via a PAT. No new attack surfaces are introduced
in Phase 6. XSS mitigations already in place via `Utils.escapeHtml()` — all new DOM
output in Phase 6 consistently uses it. No new network endpoints, auth flows, or secret
storage patterns are added.

ASVS V5 (Input Validation): `Utils.escapeHtml()` applied at all innerHTML injection sites.
[VERIFIED: recipes.js and recommender.js — every template literal uses escapeHtml()]

---

## Sources

### Primary (HIGH confidence)
- `app/js/views/recipes.js` — live implementation, read in full (962 lines)
- `app/js/views/recommender.js` — live implementation, read in full (653 lines)
- `app/css/app.css` — Phase 6 CSS additions verified (lines 1400–1464)
- `data/recipes.json` — live data file; `made_log: []` confirmed at line 334
- `schema/recipes.schema.json` — schema file; `made_log` absence confirmed
- `.planning/phases/06-recipe-recommender-ux/06-CONTEXT.md` — locked decisions
- `.planning/ROADMAP.md` — Phase 6 requirements text
- `.planning/STATE.md` — phase history and shipped status

### Secondary (MEDIUM confidence)
- None — all findings from direct file inspection

### Tertiary (LOW confidence)
- None

---

## Project Constraints (from CLAUDE.md)

- **Vanilla ES6+ only** — no framework, no bundler, no npm dependencies. All Phase 6 code
  is plain JS IIFE modules. [VERIFIED: compliant]
- **IIFE module pattern** — each view file exports `const ViewName = (() => { ... return { render }; })();`. [VERIFIED: compliant in both files]
- **Single `render(container)` entry point** — views are stateless; read from State, mutate
  via State.patch, subscribe to re-render. [VERIFIED: compliant]
- **No globals** — IIFEs prevent global namespace pollution. [VERIFIED: compliant]
- **CSS in app/css/app.css** — single stylesheet, CSS custom properties for theming.
  [VERIFIED: Phase 6 additions appended to end of app.css]
- **GitHub API only** — all reads/writes through `readJSON()`/`writeJSON()` (transitively
  via State.save). [VERIFIED: no direct GitHubAPI calls in Phase 6 additions]

---

## Metadata

**Confidence breakdown:**
- Requirement implementation status: HIGH — read live code directly
- Schema gap: HIGH — confirmed by reading schema file
- Originals tab search gap: HIGH — confirmed by reading renderOriginalsGrid (no _filterRecipes call)
- Detail modal tally refresh edge case: MEDIUM — behavioral inference from code reading; not tested

**Research date:** 2026-05-20
**Valid until:** 2026-06-20 (stable vanilla JS codebase; no moving dependencies)

---

# Research Addendum: New Decisions (D-06 – D-09)

**Researched:** 2026-05-20 (second pass — discuss-phase added D-06, D-07, D-08, D-09)
**Domain:** Editable universal modal, Originals scoring integration, name+base dedup
**Confidence:** HIGH (all findings from reading live implementation files this session)

> **CONTEXT.** The original 8 ROADMAP requirements + 3 gap tasks (Originals-tab search,
> schema update, modal tally live-refresh) are ALREADY IMPLEMENTED AND COMMITTED. This
> addendum researches ONLY the three NEW behavioral decisions (D-06, D-07, D-08) plus the
> phase-completion approach (D-09). The original audit sections above are retained as-is.
>
> **Correction to prior audit:** The three "Open Questions"/"gaps" in the original research
> pass are now RESOLVED in live code:
> - `renderOriginalsGrid()` calls `_filterRecipes(originals, _searchQuery)` (recipes.js:179) — Originals search works.
> - `schema/recipes.schema.json` now declares `made_log` (madeEntry def, lines 39–43, 153–174) and the full inline `savedRecipe`/`wishlist` shape (lines 134–152). Schema gap closed.
> - The detail modal live-updates `.rdm-tally-count` after [+ Made It Again] (recipes.js:437–447) without close/reopen. Tally gap closed.
> The planner should treat these as DONE, not re-plan them.

---

## New-Decision Requirements Map

| Decision | Description | Files to touch | Net-new risk |
|----------|-------------|----------------|--------------|
| D-06 | Originals editable in universal modal (dual-write) | `recipes.js` (`showRecipeDetail`), `app/css/app.css` | MEDIUM — modal currently builds static HTML; needs conditional editable rendering + dual-write |
| D-07 | Originals scored in Recommender | `recommender-engine.js` (`recommend`), `recommender.js` (call sites + badge), `app/css/app.css` | HIGH — Originals shape does NOT match what the engine consumes; normalization layer required |
| D-08 | Duplicate guard: name+base case-insensitive | `recommender.js` (3 toggle handlers + 3 read checks), `recipes.js` (modal lookups + remove handlers) | MEDIUM — many `.name`-only `.find/.some/.filter` call sites; all must become name+base |
| D-09 | Full UAT + VALIDATION.md | new `06-UAT.md`, `06-VALIDATION.md` (plan deliverables) | LOW — follow Phase 5 pattern |

---

## D-06: Originals Editable in Universal Modal

### Current modal anatomy (`showRecipeDetail`, recipes.js:351–473)

The function signature is `showRecipeDetail(recipe, listKey, mainContainer)`. It is called from:
- `renderRecipeChips` remove-guarded click → `showRecipeDetail(recipe, listKey, mainContainer)` where `listKey` is `'confirmed_favorites'` or `'wishlist'` (recipes.js:273)
- `renderMadeList` click → `showRecipeDetail(recipe, 'made_log', mainContainer)` (recipes.js:335)
- NOTE: the Originals **tab** does NOT use this modal — it uses the full-page `renderDetail(r, container)` (recipes.js:475) with its own Edit→`renderForm` flow. D-06 is about reaching an Original **via Favorites/Wishlist/Made chips** (and, per D-07, eventually via the Recommender), where `_source: 'originals'`.

The modal body is built as one big template literal (recipes.js:365–404) with these sections:
1. Header: name + meta (base · method · glassware) — currently **static text** (lines 367–375)
2. Occasion paragraph (line 379) — static
3. Ingredients table (lines 381–386) — static `<tr>` rows from `ingRows` (built lines 361–363)
4. Garnish line (line 388) — static
5. Times Made tally (lines 390–395) — interactive
6. Notes textarea (lines 397–398) — editable
7. Footer buttons: Save Notes / Close (lines 400–403)

Wired handlers after append: `.rdm-close`, `.rdm-close-btn`, overlay click (close); `.rdm-save-notes` (line 413); `.rdm-made-btn` (line 423); `.rdm-unmade-btn` (line 461).

### What D-06 requires

When `recipe._source === 'originals'`, sections 1, 3, 4 (and the method shown in meta) become **editable inputs**; everything else stays. When `_source` is `'classics-db'`, `'ai-generated'`, or undefined → fields stay read-only (current behavior).

`_source` detection: read `recipe._source`. **CAVEAT:** inline copies in `confirmed_favorites`/`wishlist` written by the Recommender carry `_source: 'classics-db'` (recommender.js:325, 350, 376). For an Original to be editable from those lists, it must have been saved with `_source: 'originals'` — which only happens once D-07 adds Originals to the Recommender pool and the favorite/made write preserves the recipe's own `_source` (the Recommender currently HARDCODES `'classics-db'` — see D-07 §"Write-path _source" below). So D-06 and D-07 are coupled: the editable-modal path for Originals only fires for entries whose stored `_source` is `'originals'`.

### Recommended implementation approach

1. **Compute `const editable = recipe._source === 'originals';`** at the top of `showRecipeDetail`.
2. **Conditionally render each field.** For the header name, method, glassware, garnish, swap the static spans/divs for `<input>` elements when `editable`. Keep the same CSS classes for read-only; add input variants.
3. **Ingredients (editable case):** reuse the existing form helpers. `ingredientRowHtml(ing, i)` (recipes.js:969) produces a `.rf-ing-row` with `.rf-ing-amount`, `.rf-ing-name`, `.rf-ing-notes`, `.rf-ing-remove`. `bindIngredientRemove(wrap)` (recipes.js:979) wires removal (keeps at least one row). For an "add row" button, mirror recipes.js:873–878 (insert `ingredientRowHtml({amount:'',name:'',notes:''}, idx)` then re-bind). These helpers are in the SAME IIFE scope as `showRecipeDetail`, so they are directly callable — no refactor needed.
   - Read-only case keeps the current `<table class="ingredients-table">` (lines 381–386).
4. **Save button (editable case):** add a `Save Recipe` button (or repurpose the footer). Read the inputs the same way `renderForm`'s save does (recipes.js:897–905 for ingredients).

### Dual-write pattern (THE critical part of D-06)

A single `State.patch('recipes', r => { ... })` must update TWO locations:
1. **`recipes.originals`** — the canonical record. Match by **`id`** (Originals always have a stable `id` like `cocktail1778776984398`). The inline copy stored in a list also carries that `id` (it was `{...recipe}` spread at save time), so you can match `r.originals.find(o => o.id === recipe.id)`. If the inline copy lacks an `id` (older data), fall back to name+base.
2. **The inline copy in the source list** — `r[listKey].find(...)`. Per D-08, match by **name + base, case-insensitive**: `r[listKey].find(x => (x.name||'').toLowerCase() === (recipe.name||'').toLowerCase() && (x.base||'').toLowerCase() === (recipe.base||'').toLowerCase())`. CAVEAT: if the user EDITS the name in the modal, the OLD name is the lookup key, the NEW name is the value to write — capture the original `recipe.name`/`recipe.base` BEFORE applying edits, use those for the `.find`, then assign the new field values onto the found entry (and onto the originals entry).

Example skeleton (planner reference):
```javascript
const editable = recipe._source === 'originals';
// ... after collecting edited values into `edited` object:
const origId   = recipe.id;
const origName = (recipe.name || '').toLowerCase();
const origBase = (recipe.base || '').toLowerCase();
State.patch('recipes', r => {
  // 1. canonical originals record
  const canon = (r.originals || []).find(o => o.id === origId)
    || (r.originals || []).find(o => (o.name||'').toLowerCase() === origName);
  if (canon) Object.assign(canon, edited);
  // 2. inline copy in the list the chip came from (works for all listKeys incl. made_log)
  if (listKey) {
    const copy = (r[listKey] || []).find(x =>
      (x.name||'').toLowerCase() === origName && (x.base||'').toLowerCase() === origBase);
    if (copy) Object.assign(copy, edited); // preserves times_made/first_made/last_made on made_log
  }
});
State.save('recipes').then(() => { Utils.showToast('Recipe updated.'); /* re-render or refresh modal */ });
```
- Use `Object.assign(target, edited)` (not replace) so made_log tracking fields (`times_made`, `first_made`, `last_made`) and `_source` survive.
- After save, re-render the underlying tab so the chip reflects the new name/ingredients: `render(mainContainer, { tab })` where `tab` maps from `listKey` (same mapping used at recipes.js:453 and 468). Closing the modal first is acceptable and simplest.

### CSS

Add input-variant styles inside `.recipe-detail-modal` so editable fields look intentional (the form already has `.rf-ing-row` styling reused). New classes likely needed: an editable-name input style and an editable meta-row. Append to `app/css/app.css` per CLAUDE.md (single stylesheet).

### Confidence: HIGH on mechanism, MEDIUM on coupling
The helper reuse and dual-write are straightforward. The MEDIUM is the D-06↔D-07 `_source` coupling: editable-Originals-from-a-list only manifests once a list entry actually stores `_source:'originals'`, which depends on D-07's write-path fix.

---

## D-07: Originals in the Recommender (the hard one)

### Exact engine contract

`RecommenderEngine.recommend(inventory, rawProfile, opts)` (recommender-engine.js:170):
- `db` is **hardcoded** to `CLASSICS_DB` (line 172): `const db = (typeof CLASSICS_DB !== 'undefined') ? CLASSICS_DB : [];`. There is **no parameter** for a second pool today. D-07 requires either a new param (e.g. `opts.extraRecipes` or a 4th arg) or concatenating inside.
- The loop `for (const recipe of db)` (line 196) reads, per recipe:
  - `recipe.base` (string) — used for veto check (line 198) and rendered.
  - `recipe.ingredients` (array) — REQUIRED. Each ingredient is accessed for:
    - `ing.optional` (line 204) — skip if true
    - `ing.name` (line 199) — veto check
    - `_hasIngredient(lookup, ing)` (line 205) which reads **`ing.keywords`** (array, line 109) and **`ing.searchIn`** (array of section keys, line 111). **If `ing.keywords` is undefined, `.map` throws** (line 109: `ingredient.keywords.map(...)`).
  - `recipe.profile` (line 132, `_flavorScore`) — must be an **OBJECT** of axis numbers `{sweetness, acid, strength, complexity, season, risk}` (0–1). If `recipe.profile` is falsy, score defaults to 0.5 (line 132). **If `recipe.profile` is a STRING (as Originals store it), `recipe.profile[axis]` is `undefined` for every axis → `recipeVal == null` → all axes skipped → score 0.5** (line 140). So a string profile does NOT crash, it just yields neutral 0.5 — acceptable per D-07 ("default 0.5 if not set").
  - `recipe.tags` / `recipe.specialties` (line 29, `_specialtyBoost`) — optional, safe if absent (`|| []`).
  - `recipe.difficulty` (rendered in recommender.js:60 `_difficultyLabel`) — `undefined` → falls through to "Advanced" label (engine doesn't require it, but the card renders it).

### Originals shape vs. engine needs — the gaps

From `data/recipes.json` originals[0] ("Smokey the Pear") and `recipes.originals` written by `renderForm` (recipes.js:912–939):

| Engine needs | Original has? | Gap / fix |
|--------------|---------------|-----------|
| `recipe.base` (string) | ❌ NO `base` field. Original has `ingredients[0].name` (the first spirit) | **Derive** `base` from `ingredients[0].name`, or exclude. Note recipes.js:208 already does `const base = r.ingredients?.[0]?.name` for the Originals card. |
| `recipe.ingredients[].keywords` | ❌ NO `keywords` | **Must synthesize.** Without keywords, `_hasIngredient` throws. Minimum: `keywords: [ing.name.toLowerCase()]`. |
| `recipe.ingredients[].searchIn` | ❌ NO `searchIn` | **Must synthesize** a section list, else `_hasIngredient` searches nothing → ingredient always "missing" → Original never buildable. Hard to map reliably (would need ingredient→section heuristics). |
| `recipe.ingredients[].optional` | partial (`notes:"Optional"` is free text, not the `optional:true` flag) | optional flag absent → all ingredients treated as required. |
| `recipe.profile` as axis object | ❌ It's a STRING description | Yields neutral 0.5 score (no crash). Per D-07, 0.5 default is acceptable. |
| `recipe.tags` | ❌ NO tags | `_specialtyBoost` + occasion filter both safe with `|| []`. Original won't match occasion chips. |
| `recipe.method` | ✅ has `method` (free text) and `method_type` | engine renders `recipe.method`; Originals have it. |
| `recipe.glassware`, `recipe.garnish`, `recipe.name`, `recipe.occasion` | name/glassware/garnish ✅; `occasion` ❌ (Originals use `profile`/`tagline`) | cosmetic. |

### Two viable normalization strategies (planner picks one)

**Strategy A — Score-only, scope-independent (RECOMMENDED, lowest risk).**
Because Originals lack `searchIn`/`keywords`, inventory matching is unreliable. Treat Originals as **always buildable** (the user owns the recipe) and skip the `_hasIngredient` gating for them. Concretely:
- Add `_source` tag to each Original when building the pool.
- In `recommend`, when `recipe._source === 'originals'`, push to `buildable` with `missing = []` (skip the `_hasIngredient` loop entirely). flavorScore uses `_flavorScore` which returns 0.5 for string profiles.
- This avoids synthesizing `keywords`/`searchIn` and avoids the `.map` crash. It honors D-07 "mixed into regular results."
- D-07 exclusion rule still applies: skip Originals with no `base` derivable AND no ingredients.

**Strategy B — Full normalization (higher fidelity, higher effort).**
Write a `normalizeOriginal(orig)` transformer that produces an engine-shaped recipe:
- `base`: `orig.base || orig.ingredients?.[0]?.name || ''`
- `ingredients`: map each to `{ name, amount, keywords: [name.toLowerCase(), ...tokenize(name)], searchIn: <ALL_SECTION_KEYS or heuristic>, optional: /optional/i.test(notes) }`
- `profile`: if string, omit (→0.5); if you later add an axis object to Originals, pass through.
- `tags`: `[]`.
This is fragile because `searchIn` mapping is a guess; wrong sections cause false "missing." Use ALL section keys to be permissive, accepting that subtype guards (recommender-engine.js:110) won't help.

**Recommendation:** Strategy A. It satisfies the stated decision ("scored alongside CLASSICS_DB", "0.5 if not set", "excluded if lacking base/ingredients", "mixed in with a badge") without the brittle `searchIn` synthesis. Document that Originals appear in "You Can Make These" (buildable) by design because the user authored them.

### Where Originals enter — pool construction

Option 1 (engine change): add a parameter. Change `recommend(inventory, rawProfile, opts)` to read `opts.originals` (array) and iterate `[...db, ...(opts.originals||[])]`. The recommender.js call sites (lines 401, 413, 443, 481, 533) all pass `opts` already — add `originals: State.get('recipes')?.originals || []` to each, OR (cleaner) read `State.get('recipes')?.originals` inside the engine. But the engine currently has NO `State` dependency and reads `CLASSICS_DB` as a global; reading `State` inside keeps symmetry but couples the engine to State. **Recommended:** pass via `opts.originals` from the view (5 call sites — see below), keeping the engine pure.

Option 2 (view change only): out of scope — engine owns scoring.

### Write-path `_source` (couples to D-06)

When an Original is favorited/wishlisted/made FROM the Recommender, the current code hardcodes `_source:'classics-db'` (recommender.js:325, 350, 376). For D-06 editability to work, these must preserve the recipe's own source: `_source: item.recipe._source || 'classics-db'`. The Original pushed into the pool must carry `_source:'originals'` so this propagates.

### Card rendering — 'Your original' badge

`_renderCard` (recommender.js:59) and `_renderTwoAwayCard` (recommender.js:115) build the card header. Add a badge when `recipe._source === 'originals'` (e.g. in `.rec-card-meta` after the difficulty span, or next to the name). Reuse the badge pattern; CONTEXT Claude's Discretion specifies **amber-colored**, consistent with existing badges. The existing `.rec-times-made-badge` (green) is the structural template; add `.rec-original-badge` (amber) in app.css.
- `recipe.difficulty` is undefined for Originals → `_difficultyLabel(undefined)` returns "Advanced" (recommender-engine.js:45-49). Consider suppressing the difficulty chip for Originals, or accept "Advanced" as a known cosmetic quirk (flag for UAT).
- `recipe.ingredients.map(i => ... i.amount ... i.name)` (recommender.js:92) — Originals HAVE amount+name, so chips render fine. `recipe.base` rendered at line 72 — must be the derived base or empty.

### Exclusion rule (D-07)

"Originals lacking `base` or `ingredients` are excluded." Implement as a filter when building the pool: `originals.filter(o => (o.base || o.ingredients?.[0]?.name) && (o.ingredients||[]).length > 0)`.

### Confidence: HIGH on the shape-mismatch diagnosis, MEDIUM on chosen strategy
The crash risk (`ing.keywords.map` on Originals) is VERIFIED by reading line 109. Strategy A vs B is a planner decision; A is strongly recommended.

---

## D-08: Duplicate Guard (name + base, case-insensitive)

### Current dedup is name-ONLY. Every call site that must change:

**recommender.js — read (button state):**
| Line | Current | Change to (name+base, case-insensitive) |
|------|---------|------------------------------------------|
| 63 | `confirmed_favorites.some(r => r.name === recipe.name)` | also compare base, `.toLowerCase()` |
| 64 | `wishlist.some(r => r.name === recipe.name)` | same |
| 65 | `made_log.some(r => r.name === recipe.name)` | same |
| 121 | `confirmed_favorites.some(r => r.name === recipe.name)` (twoaway) | same |
| 122 | `wishlist.some(...)` (twoaway) | same |
| 123 | `made_log.some(...)` (twoaway) | same |

**recommender.js — toggle write handlers:**
| Line | Current | Change |
|------|---------|--------|
| 317 | `isFav = ...some(r => r.name === recipeName)` | name+base |
| 319 | remove: `filter(f => f.name !== recipeName)` | filter by NOT(name+base) |
| 342 | `isWish = ...some(...)` | name+base |
| 344 | remove: `filter(w => w.name !== recipeName)` | name+base |
| 367 | `isMade = ...some(...)` | name+base |
| 369 | remove: `filter(m => m.name !== recipeName)` | name+base |

CAVEAT: the toggle handlers read `btn.dataset.name` (a NAME string only). To dedup by name+base they need the base too. Options: (a) add a `data-base` attribute on the buttons in `_renderCard`/`_renderTwoAwayCard` (lines 85–87, 143–145), then read both; or (b) look up the full `item` from `allItems` (already done at lines 311–316 etc. via `allItems.find(r => r.recipe.name === recipeName)`) and use `item.recipe.base`. Option (b) is cleaner — the `item` is already in scope; derive base from `item.recipe.base`. But the `allItems.find` itself is name-only (line 316, 341, 366) and would mis-match if two pooled recipes share a name with different bases → also upgrade that `.find` to name+base, which means the buttons DO need `data-base` (or data-id). **Recommended:** add `data-base` to all three buttons in both card renderers and read `btn.dataset.base` alongside `btn.dataset.name`.

**recipes.js — modal + chip lookups:**
| Line | Current | Change |
|------|---------|--------|
| 278 | favorites/wishlist remove: `filter(x => x.name !== recipe.name)` | name+base |
| 340 | made remove: `filter(x => x.name !== recipe.name)` | name+base |
| 353 | `madeLog.find(m => m.name === recipe.name)` (modal open tally) | name+base |
| 356 | `[listKey].find(r => r.name === recipe.name)` (notes load) | name+base |
| 416 | notes save: `[listKey].find(x => x.name === recipe.name)` | name+base |
| 427 | `made_log.find(m => m.name === recipe.name)` (made-again) | name+base |
| 437 | `made_log.find(m => m.name === recipe.name)` (tally refresh) | name+base |
| 449 | `made_log.filter(m => m.name !== recipe.name)` (reset) | name+base |
| 464 | `made_log.filter(m => m.name !== recipe.name)` (unmade) | name+base |

Note recipes.js:492 (`originals.filter(x => x.id !== r.id)`) and 944 (`findIndex(x => x.id === r.id)`) already use `id` — leave those.

### Recommended helper (DRY)

Add a small comparator, e.g. in `Utils` or as a module-local in each view:
```javascript
function _sameRecipe(a, b) {
  return (a.name || '').toLowerCase() === (b.name || '').toLowerCase()
      && (a.base || '').toLowerCase() === (b.base || '').toLowerCase();
}
```
Then `list.some(x => _sameRecipe(x, recipe))` / `list.filter(x => !_sameRecipe(x, recipe))`. Putting it in `Utils` (utils.js) lets both views share one definition (CLAUDE.md allows utils helpers). For the recommender toggle handlers that only have a name string + the looked-up `item`, compare against `item.recipe`.

### D-08 sub-rules confirmed against code

- **"Adding blocked when present; clicking filled removes"** — already the toggle pattern (recommender.js:318/343/368 branch on isFav/isWish/isMade). Just the equality must become name+base. No new "blocked add" logic needed; the toggle inherently prevents dupes.
- **"Favorites and Wishlist independent"** — already true: separate arrays, separate toggles, no cross-removal. No change.
- **"Made log increments instead of duplicating"** — already implemented in the MODAL path (recipes.js:427–433: `existing` found → `times_made++`). But the RECOMMENDER ✓ button (recommender.js:371–378) ALWAYS `unshift`s a fresh entry with `times_made:1` and the dedup is via the toggle (if already made, the click removes instead). So from the Recommender, a second "mark made" is impossible (button is already ✓/active → removes). Increment-on-repeat only happens via the modal. This matches D-04/D-08 as long as the made-check uses name+base. Confirm in UAT.

### Confidence: HIGH — all call sites enumerated from direct reads.

---

## D-09: Phase Completion

Plan deliverables (not code research): produce `06-UAT.md` and `06-VALIDATION.md` mirroring
`.planning/phases/05-polish-depth-ux-tidy/05-UAT.md` and `05-VALIDATION.md`. UAT scope per
CONTEXT D-09: all 8 ROADMAP requirements + 3 gap tasks (now done) + D-06/D-07/D-08. User
initiates UAT/verify via GSD commands — no auto-advance. See Validation Architecture below
for the checklist source-of-truth.

---

## Don't Hand-Roll (new-decision additions)

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Editable ingredient rows in modal | new row markup/handlers | `ingredientRowHtml()` + `bindIngredientRemove()` (recipes.js:969, 979) | same IIFE scope, already escapes, already battle-tested in renderForm |
| Recipe equality check | inline name+base everywhere | one `_sameRecipe(a,b)` helper (Utils or module-local) | 15+ call sites; one definition prevents drift |
| Originals→engine shape coercion | brittle searchIn synthesis | Strategy A (treat Originals as buildable, skip inventory gating) | avoids the `ing.keywords.map` crash and unreliable section mapping |
| Modal/overlay | custom modal | existing `.recipe-detail-modal-overlay` (already in app.css) | D-06 extends the existing modal, not a new one |

---

## Common Pitfalls (new-decision additions)

### Pitfall A: `ing.keywords.map` crashes on Originals
`_hasIngredient` (recommender-engine.js:109) does `ingredient.keywords.map(...)`. Originals
have NO `keywords`. Feeding a raw Original into the engine loop throws `TypeError: cannot
read 'map' of undefined`. **Avoid:** Strategy A (skip `_hasIngredient` for `_source==='originals'`)
OR synthesize `keywords` before scoring.

### Pitfall B: String `profile` silently scores 0.5
Originals store `profile` as a prose string; the engine expects an axis object. No crash, but
every Original gets a neutral 0.5 flavor match. Acceptable per D-07, but means Originals won't
rank by mood. Flag in UAT so it's not mistaken for a bug.

### Pitfall C: Editing an Original's name breaks the dual-write lookup
If the save uses the NEW name to find the inline copy, it finds nothing. **Avoid:** capture
original name+base (and `id`) BEFORE applying edits; use the OLD key for `.find`, write NEW values.

### Pitfall D: `_source` hardcoded to 'classics-db' on Recommender writes
recommender.js:325/350/376 hardcode `_source:'classics-db'`. An Original favorited from the
Recommender would be stored as classics-db → modal renders it read-only (D-06 fails). **Avoid:**
use `item.recipe._source || 'classics-db'`.

### Pitfall E: `data-name`-only buttons can't dedup by base
Toggle handlers read `btn.dataset.name` only (recommender.js:310 etc.). Add `data-base` to the
three buttons in both card renderers so name+base dedup works end-to-end.

### Pitfall F: difficulty chip shows "Advanced" for Originals
`_difficultyLabel(undefined)` → "Advanced" (recommender-engine.js:45-49). Suppress for Originals
or accept as cosmetic. Note for UAT.

---

## Validation Architecture (D-06 – D-09)

> No automated test framework exists (vanilla JS SPA, no Jest/Vitest/Playwright). Validation is
> manual UAT. `workflow.nyquist_validation` maps to a manual checklist per wave + full UAT at phase gate.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None — manual browser UAT |
| Config file | None |
| Quick run command | `python3 -m http.server 8000` then exercise the feature in-browser |
| Full suite command | Full `06-UAT.md` checklist (Phase 5 UAT format) |

### New-Decision Requirements → Test Map
| Decision | Behavior to verify | Test type | Command |
|----------|--------------------|-----------|---------|
| D-06 | Open an Original via Favorites/Wishlist/Made chip → name, ingredients (add/remove), method, glassware, garnish are EDITABLE inputs | manual-interaction | browser |
| D-06 | Open a classics-db chip → those fields are READ-ONLY (text, no inputs) | manual-interaction | browser |
| D-06 | Edit an Original in the modal + Save → `recipes.originals` updated AND the inline list copy updated (inspect data/recipes.json after save / re-open chip) | data-inspection | browser + JSON |
| D-06 | Edit the NAME of an Original and save → no orphaned/duplicate entry; inline copy renamed | manual-interaction | browser |
| D-07 | Originals appear in Recommender results mixed with classics, each with an amber 'Your original' badge | manual-visual | browser |
| D-07 | An Original with no base AND no ingredients does NOT appear in Recommender | manual-interaction | browser |
| D-07 | No console error when Recommender renders with Originals present (verifies no keywords.map crash) | manual-console | browser devtools |
| D-07 | Favoriting an Original from the Recommender stores `_source:'originals'` (then it opens editable per D-06) | data-inspection | browser + JSON |
| D-08 | ♥/★/✓ show filled when recipe already in list (name+base match) | manual-visual | browser |
| D-08 | Two recipes same name, different base → treated as distinct (both can be added) | manual-interaction | browser |
| D-08 | Clicking a filled button removes; clicking again re-adds — never duplicates | manual-interaction | browser |
| D-08 | Same recipe can be in Favorites AND Wishlist simultaneously | manual-interaction | browser |
| D-08 | Marking an already-made recipe again via modal increments times_made (no dup row) | manual-interaction | browser |
| D-09 | `06-UAT.md` + `06-VALIDATION.md` exist and all items pass | doc-review | n/a |

### Sampling Rate
- **Per task commit:** Smoke-test the specific changed behavior in browser; check devtools console for errors (esp. D-07 crash risk).
- **Per wave merge:** Run the relevant subset of the table above.
- **Phase gate:** Full `06-UAT.md` green before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `06-UAT.md` — full checklist (8 ROADMAP + 3 gap-done + D-06/D-07/D-08), Phase 5 format
- [ ] `06-VALIDATION.md` — Phase 5 format
- No test files to create (no framework).

---

## Assumptions Log (addendum)

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A3 | The 3 prior "gap" tasks (Originals search, schema, modal tally) are DONE in committed code | Correction note | Low — VERIFIED by reading recipes.js:179, schema:39-43/153-174, recipes.js:437-447 |
| A4 | Strategy A (Originals always-buildable) is acceptable to the user | D-07 | MEDIUM — user may expect inventory-aware matching for Originals; if so, Strategy B + searchIn synthesis needed. Confirm in discuss/plan. |
| A5 | Originals always carry a stable `id` for dual-write matching | D-06 | Low — renderForm always sets `id` (recipes.js:913); old inline copies also spread it |
| A6 | Suppressing/accepting the "Advanced" difficulty chip for Originals is fine | D-07 Pitfall F | Low — cosmetic |

---

## Metadata (addendum)

**Confidence breakdown:**
- D-06 dual-write mechanism: HIGH — helpers and patch pattern verified in code
- D-06↔D-07 `_source` coupling: HIGH — hardcoded 'classics-db' verified (recommender.js:325/350/376)
- D-07 shape mismatch + crash risk: HIGH — `ing.keywords.map` (line 109), string `profile` (line 132-140) verified
- D-07 chosen strategy: MEDIUM — Strategy A recommended; user confirmation advised (A4)
- D-08 call-site enumeration: HIGH — all sites read directly
- D-09: HIGH — follows established Phase 5 pattern

**Research date:** 2026-05-20 (addendum)
**Valid until:** 2026-06-20 (stable vanilla JS codebase)
