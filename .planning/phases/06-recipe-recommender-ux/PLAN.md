---
phase: 06-recipe-recommender-ux
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/js/views/recipes.js
  - schema/recipes.schema.json
autonomous: true
requirements:
  - REC-10
  - REC-11
  - RECIPE-MADE-01
  - RECIPE-MADE-02
  - RECIPE-VIEW-01
  - RECIPE-VIEW-02
  - RECIPE-SEARCH-01
  - REC-SEARCH-01

must_haves:
  truths:
    - "Typing in the Recipes search box while on the Originals tab filters the card grid by name, base, or ingredient"
    - "schema/recipes.schema.json accurately describes the made_log array that is actually stored at runtime"
    - "schema/recipes.schema.json wishlist items match the full inline recipe object shape stored at runtime"
    - "Clicking [+ Made It Again] in the detail modal increments times_made and updates the tally count in the open modal without closing it"
  artifacts:
    - path: "app/js/views/recipes.js"
      provides: "renderOriginalsGrid filters via _filterRecipes(_searchQuery)"
      contains: "_filterRecipes(originals"
    - path: "schema/recipes.schema.json"
      provides: "made_log array schema"
      contains: "made_log"
  key_links:
    - from: "renderOriginalsGrid()"
      to: "_filterRecipes()"
      via: "direct call before forEach loop"
      pattern: "_filterRecipes\\(originals"
    - from: ".rdm-made-btn click handler"
      to: ".rdm-tally-count span"
      via: "DOM update after State.patch"
      pattern: "rdm-tally-count"
---

<objective>
Close three remaining behavioral gaps in the Phase 6 implementation.

All eight Phase 6 ROADMAP requirements (REC-10, REC-11, RECIPE-MADE-01, RECIPE-MADE-02,
RECIPE-VIEW-01, RECIPE-VIEW-02, RECIPE-SEARCH-01, REC-SEARCH-01) are already implemented
and verified in the codebase. This plan documents those as DONE and delivers the three
remaining fixes discovered during the retroactive research pass.

Purpose: Phase 6 cannot close until (a) the Originals tab search gap is wired, (b) the
schema matches the live data shape, and (c) the Made It Again button does not force a
close/reopen cycle.

Output: Updated recipes.js (search fix + modal tally fix), updated schema/recipes.schema.json
</objective>

<execution_context>
@/home/user/barkeeper-bjorn-website/.claude/get-shit-done/workflows/execute-plan.md
@/home/user/barkeeper-bjorn-website/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@/home/user/barkeeper-bjorn-website/.planning/ROADMAP.md
@/home/user/barkeeper-bjorn-website/.planning/STATE.md
@/home/user/barkeeper-bjorn-website/.planning/phases/06-recipe-recommender-ux/06-CONTEXT.md
@/home/user/barkeeper-bjorn-website/.planning/phases/06-recipe-recommender-ux/06-RESEARCH.md

<interfaces>
<!-- Key contracts extracted from the live codebase. Use directly — no exploration needed. -->

From app/js/views/recipes.js:

```javascript
// Module-level search state (resets to '' on each render() call)
let _searchQuery = '';

// Filter function — takes a list and a query string, returns filtered list.
// Matches on: r.name, r.base, r.ingredients[].name (case-insensitive substring)
function _filterRecipes(list, q) {
  if (!q) return list;
  const lq = q.toLowerCase();
  return list.filter(r => {
    if ((r.name || '').toLowerCase().includes(lq)) return true;
    if ((r.base || '').toLowerCase().includes(lq)) return true;
    if ((r.ingredients || []).some(i => (i.name || '').toLowerCase().includes(lq))) return true;
    return false;
  });
}

// renderOriginalsGrid(originals, container) — currently iterates originals directly.
// TASK 1 fix: apply _filterRecipes before the forEach.
// Call site in renderTab: renderOriginalsGrid(recipes.originals || [], container)
// — the full originals array is passed in; filtered subset must be derived inside.

// showRecipeDetail(recipe, listKey, mainContainer)
// Reads made_log once at open time (line 344-346):
//   const madeEntry = madeLog.find(m => m.name === recipe.name);
//   const timesMade = madeEntry?.times_made || 0;
// TASK 3 fix: after State.patch in .rdm-made-btn click handler,
//   re-read the updated count from State and update the span:
//   overlay.querySelector('.rdm-tally-count').textContent = newCount;
//   Also update button label if it was 'Mark as Made' (first click).

// DOM anchor for tally:
//   <span class="rdm-tally-count">${timesMade}</span>
//   <button class="btn btn-secondary btn-sm rdm-made-btn">
//     ${timesMade > 0 ? '+ Made It Again' : 'Mark as Made'}
//   </button>
```

From schema/recipes.schema.json (current — stale):

```json
// wishlist items currently defined as minimal shape:
{
  "type": "object",
  "required": ["name"],
  "properties": {
    "name": { "type": "string" },
    "ingredients_summary": { "type": "string" },
    "pending": { "type": "string" }
  }
}
// made_log: NOT DEFINED (property missing entirely)
```

Live D-04 shape written by recommender.js and recipes.js (target for schema):

```json
{
  "_source": "string (e.g. 'classics-db' | 'originals')",
  "name": "string",
  "base": "string",
  "method": "string",
  "glassware": "string",
  "garnish": "string",
  "ingredients": [{ "name": "string", "amount": "string", "notes?": "string" }],
  "times_made": "integer >= 1",
  "first_made": "YYYY-MM-DD",
  "last_made": "YYYY-MM-DD",
  "notes": "string"
}
```

Live wishlist shape written by recommender.js (target for schema):
Full recipe object with _source — same shape as D-04 minus the tracking fields
(times_made, first_made, last_made). At minimum: _source, name, base, method, glassware,
garnish, ingredients[], notes.
</interfaces>
</context>

---

## Requirements → Implementation Map

The following ROADMAP requirements are IMPLEMENTED. No code changes needed.

| Req ID | Description | Status | Evidence |
|--------|-------------|--------|----------|
| REC-10 | ♥ ☆ buttons moved into `rec-card-header` flex row | DONE | recommender.js lines 84–88: `.rec-card-actions` div inside `.rec-card-header` |
| REC-11 | Heart/star filled when in Favorites/Wishlist; clicking filled removes | DONE | recommender.js lines 63–65, 307–355: `isFav`/`isWish` boolean drives `active` class and entity |
| RECIPE-MADE-01 | ✓ / ○ "I Made This" button on every Recommender card; toggles made_log entry | DONE | recommender.js lines 65, 87, 357–381 |
| RECIPE-MADE-02 | "Made" tab in Recipes view shows made_log chips most-recent-first with × | DONE | recipes.js lines 40–43, 166, 281–341 |
| RECIPE-VIEW-01 | Favorites and Wishlist tabs render as rec-card chips with × button | DONE | recipes.js lines 162–164, 223–279 |
| RECIPE-VIEW-02 | Favorites/Wishlist chips open universal detail panel on click | DONE | recipes.js lines 263–278, 343–446 |
| RECIPE-SEARCH-01 | Search input above Recipes tabs; filters active tab; clears on tab switch | DONE* | recipes.js lines 35–63 — *gap: Originals tab not wired (Task 1) |
| REC-SEARCH-01 | Search input on Recommender page; filters visible cards by name/base/ingredient | DONE | recommender.js lines 35, 241–253, 487–493, 638–640 |

---

<tasks>

<task type="auto">
  <name>Task 1: Wire _filterRecipes into renderOriginalsGrid</name>
  <files>app/js/views/recipes.js</files>
  <action>
In `renderOriginalsGrid(originals, container)` (line 170), apply `_filterRecipes` to the
`originals` array before the `forEach` loop, matching the pattern used by `renderRecipeChips`
(line 227) and `renderMadeList` (line 282).

Exact change — inside `renderOriginalsGrid`, after the `container.appendChild(addBtn)` call
(line 177) and before the `if (originals.length === 0)` empty-state check, add:

```javascript
const filtered = _filterRecipes(originals, _searchQuery);
```

Then replace the empty-state check and the `originals.forEach` loop to use `filtered`:
- Change `if (originals.length === 0)` → `if (filtered.length === 0)`
- Inside the empty-state branch, also handle the "no search results" vs "no originals" case:
  - If `_searchQuery` is truthy and `originals.length > 0`: show "No originals match your search."
  - Otherwise: show the existing "No original cocktails yet." message
- Change `originals.forEach(r => {` → `filtered.forEach(r => {`

The `+ New Recipe` button div is appended before the filter, so it always appears above
the (possibly empty) grid — this is correct; do not move it.

Do NOT modify the function signature. Do NOT remove or relocate the `+ New Recipe` button.
Do NOT modify `renderTab`, `render`, or any other function.
  </action>
  <verify>
Serve `app/` locally (`python3 -m http.server 8000`), navigate to `#recipes`, ensure the
Originals tab is active, type "bourbon" (or any base spirit present in originals) in the
search input — the card grid must filter to show only matching originals.
Clearing the search input must restore the full grid.

Static check (no comment lines):
```bash
grep -v '^\s*//' /home/user/barkeeper-bjorn-website/app/js/views/recipes.js | grep -c '_filterRecipes(originals'
```
Must return `1`.
  </verify>
  <done>
- `renderOriginalsGrid` calls `_filterRecipes(originals, _searchQuery)` and iterates the
  filtered result, not the raw input array.
- Empty state message distinguishes "no originals" from "no search results".
- All other tab behaviors unchanged (Favorites, Wishlist, Made already correct).
  </done>
</task>

<task type="auto">
  <name>Task 2: Update schema/recipes.schema.json — add made_log, fix wishlist shape</name>
  <files>schema/recipes.schema.json</files>
  <action>
Two changes to `schema/recipes.schema.json`:

**Change A — Add `made_log` as a top-level property** (alongside `originals`,
`confirmed_favorites`, `wishlist`):

```json
"made_log": {
  "type": "array",
  "description": "Recipes the bar owner has made, with tracking metadata. Full recipe object stored inline at write time (D-03).",
  "items": {
    "type": "object",
    "required": ["name", "times_made", "first_made", "last_made"],
    "properties": {
      "_source": {
        "type": "string",
        "enum": ["classics-db", "originals", "ai-generated"],
        "description": "Provenance of the recipe (D-02)."
      },
      "name": { "type": "string" },
      "base": { "type": "string" },
      "method": { "type": "string" },
      "glassware": { "type": "string" },
      "garnish": { "type": "string" },
      "ingredients": {
        "type": "array",
        "items": { "$ref": "#/definitions/ingredient" }
      },
      "times_made": {
        "type": "integer",
        "minimum": 1,
        "description": "Incremented each time [+ Made It Again] is clicked."
      },
      "first_made": {
        "type": "string",
        "format": "date",
        "description": "YYYY-MM-DD date of first make."
      },
      "last_made": {
        "type": "string",
        "format": "date",
        "description": "YYYY-MM-DD date of most recent make."
      },
      "notes": { "type": "string" }
    }
  }
}
```

**Change B — Replace the inline `wishlist` items definition** (currently the stale minimal
shape) with the full inline recipe object shape that is actually stored at runtime (per D-03):

```json
"wishlist": {
  "type": "array",
  "description": "Recipes the bar owner wants to try. Full recipe object stored inline at write time (D-03).",
  "items": {
    "type": "object",
    "required": ["name"],
    "properties": {
      "_source": {
        "type": "string",
        "enum": ["classics-db", "originals", "ai-generated"],
        "description": "Provenance of the recipe (D-02)."
      },
      "name": { "type": "string" },
      "base": { "type": "string" },
      "method": { "type": "string" },
      "glassware": { "type": "string" },
      "garnish": { "type": "string" },
      "ingredients": {
        "type": "array",
        "items": { "$ref": "#/definitions/ingredient" }
      },
      "notes": { "type": "string" }
    }
  }
}
```

Do NOT change `originals`, `confirmed_favorites`, `definitions`, `$schema`, `$id`,
`title`, `description`, or any other field.
  </action>
  <verify>
```bash
python3 -c "import json; d=json.load(open('/home/user/barkeeper-bjorn-website/schema/recipes.schema.json')); print('made_log' in d['properties'], '_source' in d['properties']['made_log']['items']['properties'], '_source' in d['properties']['wishlist']['items']['properties'])"
```
Must print: `True True True`
  </verify>
  <done>
- `schema/recipes.schema.json` declares `made_log` as a top-level array with required
  fields `name`, `times_made`, `first_made`, `last_made`.
- `wishlist` items definition replaced with full recipe object shape including `_source`,
  `ingredients[]`, `method`, `glassware`, `garnish`, `notes`.
- File is valid JSON (no parse errors).
- No other schema sections changed.
  </done>
</task>

<task type="auto">
  <name>Task 3: Live-refresh tally in detail modal after [+ Made It Again] click</name>
  <files>app/js/views/recipes.js</files>
  <action>
In `showRecipeDetail()` (line 343), modify the `.rdm-made-btn` click handler (currently
lines 415–432) so that after a successful save, instead of calling `close()` and
`render(mainContainer, ...)`, it updates the open modal in-place.

The handler currently does:
```javascript
State.save('recipes').then(() => {
  Utils.showToast('Marked as made ✓');
  close();
  render(mainContainer, { tab: 'made' });
}).catch(...);
```

Replace that `.then()` body with in-place DOM mutation:
```javascript
State.save('recipes').then(() => {
  Utils.showToast(wasAlreadyMade ? 'Made It Again! ✓' : 'Marked as made ✓');
  // Re-read the updated count from State
  const updatedLog = State.get('recipes')?.made_log || [];
  const updatedEntry = updatedLog.find(m => m.name === recipe.name);
  const newCount = updatedEntry?.times_made || 1;
  // Update the tally span in the open modal
  overlay.querySelector('.rdm-tally-count').textContent = newCount;
  // Update the button label (first made → made it again)
  madeBtn.textContent = '+ Made It Again';
  // Show the Reset button if it was not already present
  if (!overlay.querySelector('.rdm-unmade-btn')) {
    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn btn-ghost btn-sm rdm-unmade-btn';
    resetBtn.textContent = 'Reset';
    madeBtn.insertAdjacentElement('afterend', resetBtn);
    resetBtn.addEventListener('click', () => {
      State.patch('recipes', r => { r.made_log = (r.made_log || []).filter(m => m.name !== recipe.name); });
      State.save('recipes').then(() => {
        Utils.showToast('Removed from Made');
        close();
        const activeTab = listKey === 'made_log' ? 'made' : (listKey === 'confirmed_favorites' ? 'favorites' : 'wishlist');
        render(mainContainer, { tab: activeTab });
      }).catch(err => Utils.showToast('Save failed: ' + err.message, 'error'));
    });
  }
}).catch(...);
```

To do this cleanly:
1. Capture `const madeBtn = overlay.querySelector('.rdm-made-btn');` at the start of the
   handler setup block (after `overlay.innerHTML = ...`).
2. Determine `wasAlreadyMade` from the current tally value before the patch:
   `const wasAlreadyMade = (State.get('recipes')?.made_log || []).some(m => m.name === recipe.name);`
   (read this inside the click handler, just before the `State.patch` call, so it reflects
   the click moment, not the open moment.)
3. Keep the existing `State.patch` logic (lines 417–426) unchanged — only replace the
   `.then()` body.
4. The existing `.rdm-unmade-btn` handler (lines 434–444) is unchanged — it handles Reset
   correctly (close + re-render). The dynamically added Reset button uses the same logic.

Do NOT change the `[Reset]` / `.rdm-unmade-btn` handler that already exists in the
initial render for cases where `timesMade > 0` at modal open. Only the path that adds a
new Reset button after the first "Mark as Made" click is new.

Do NOT change any other function in recipes.js.
  </action>
  <verify>
Manual browser test:
1. Navigate to `#recommender`, find a card where the ✓ button is inactive (○).
2. Click the card's ○ button — adds to made_log (check toast).
3. Navigate to `#recipes` → Made tab, click that recipe's chip to open the detail modal.
4. Confirm the tally shows 1, button label is "+ Made It Again".
5. Click "+ Made It Again" — tally must update to 2 IN THE OPEN MODAL (no close/reopen).
6. Click "+ Made It Again" again — tally must update to 3.
7. Click Reset — modal closes, Made tab re-renders without that recipe.

Static presence check:
```bash
grep -c 'rdm-tally-count.*textContent' /home/user/barkeeper-bjorn-website/app/js/views/recipes.js
```
Must return `1` (the in-place DOM update line).
  </verify>
  <done>
- Clicking [+ Made It Again] updates `.rdm-tally-count` and `madeBtn.textContent` in the
  open modal without closing it.
- Multiple sequential clicks correctly increment the counter each time.
- [Reset] still closes modal and re-renders the correct tab.
- "Mark as Made" click (first-time case) also updates the modal in-place (shows 1, changes
  label to "+ Made It Again", injects Reset button).
- No regressions in other modal behaviors (notes save, overlay-click close, ✕ button).
  </done>
</task>

</tasks>

---

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| User input → DOM | Search query text and recipe notes are user-controlled strings written to innerHTML |
| GitHub API response → State | JSON data from GitHub is deserialized into State; schema mismatch is a data integrity risk |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-06-01 | Spoofing | `_filterRecipes` input | accept | Pure client-side filter; no auth boundary crossed. User filters their own data. |
| T-06-02 | Information Disclosure | `showRecipeDetail` notes textarea | accept | Notes are user's own data; no cross-user exposure in solo PAT mode |
| T-06-03 | Tampering | Schema update changes validation contract | accept | `schema/recipes.schema.json` is a dev reference doc, not enforced at runtime; no security implication |
| T-06-04 | XSS | `overlay.querySelector('.rdm-tally-count').textContent` | mitigate | Task 3 uses `.textContent` (not `.innerHTML`) for the count — no injection vector. `Utils.escapeHtml()` already applied to all other modal innerHTML sites. |
</threat_model>

<validation_architecture>
## Validation Architecture

**Test framework:** None (vanilla JS SPA, no Jest/Vitest/Playwright). All validation is
manual UAT via `python3 -m http.server 8000`.

### Per-Task Smoke Test Matrix

| Task | Smoke Test | Pass Signal |
|------|------------|-------------|
| Task 1 | Navigate to `#recipes` → Originals tab → type "bourbon" in search | Card grid filters to matching originals |
| Task 1 | Clear search | Full grid restores |
| Task 1 | Tab switch resets search | Correct — existing behavior preserved |
| Task 2 | `python3 -c "import json; d=json.load(open('schema/recipes.schema.json')); print('made_log' in d['properties'])"` | `True` |
| Task 2 | `python3 -m json.tool schema/recipes.schema.json > /dev/null` | No parse errors |
| Task 3 | Open detail modal for a Made recipe → click "+ Made It Again" | Count increments in-place (no close/reopen) |
| Task 3 | Click Reset in modal | Modal closes, Made tab re-renders |

### Nyquist Sampling

- Per-task commit: smoke test that specific feature in browser before committing.
- Phase gate: full UAT checklist (RECIPE-SEARCH-01 on all 4 tabs, made_log tally, schema
  parse check) before marking Phase 6 Complete.

### Static Verification Commands

```bash
# Task 1: _filterRecipes wired in renderOriginalsGrid (not a comment line)
grep -v '^\s*//' app/js/views/recipes.js | grep -c '_filterRecipes(originals'

# Task 2: made_log declared in schema
python3 -c "import json; d=json.load(open('schema/recipes.schema.json')); print('made_log' in d['properties'], '_source' in d['properties']['made_log']['items']['properties'])"

# Task 3: in-place tally DOM update present
grep -c 'rdm-tally-count.*textContent' app/js/views/recipes.js
```

Each command must return `1` / `True True` / `1`.
</validation_architecture>

<verification>
Phase 6 is complete when:

1. Originals tab search wired: typing any term on the Originals tab filters the card grid
2. Schema accurate: `schema/recipes.schema.json` declares `made_log` with full shape and
   `wishlist` items with full inline recipe shape
3. Modal tally live: clicking [+ Made It Again] updates the count span in the open modal
   without closing and reopening

All 8 ROADMAP requirements (REC-10, REC-11, RECIPE-MADE-01, RECIPE-MADE-02,
RECIPE-VIEW-01, RECIPE-VIEW-02, RECIPE-SEARCH-01, REC-SEARCH-01) are verified DONE.
</verification>

<success_criteria>
1. `grep -v '^\s*//' app/js/views/recipes.js | grep -c '_filterRecipes(originals'` returns `1`
2. `python3 -c "import json; d=json.load(open('schema/recipes.schema.json')); print('made_log' in d['properties'], '_source' in d['properties']['wishlist']['items']['properties'])"` prints `True True`
3. `grep -c 'rdm-tally-count.*textContent' app/js/views/recipes.js` returns `1`
4. Manual UAT: all 10 items in Validation Architecture smoke test matrix pass
5. No regressions: Favorites/Wishlist/Made tabs, Recommender search, and detail modal
   close/notes-save behaviors unchanged
</success_criteria>

<output>
After completion, create `.planning/phases/06-recipe-recommender-ux/06-01-SUMMARY.md`
following the template at `.claude/get-shit-done/templates/summary.md`.
</output>
