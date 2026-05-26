## PATTERN MAPPING COMPLETE

# Phase 7: AI Integration - Pattern Map

**Mapped:** 2026-05-21
**Files analyzed:** 24 (6 new + 18 modified/extended)
**Analogs found:** 22 / 24 (2 greenfield: classroom-content.js shape is config-derived, library.js storage TBD)

> All code is vanilla ES6 IIFE — no build, no npm, no imports (CLAUDE.md). Globals via `window`. Mandatory: `Utils.escapeHtml()` on ALL model/user text before `innerHTML`. New `<script>` tags go in `app/index.html` after `claude-api.js` (line 102), before `app.js` (line 105).

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `app/js/claude-api.js` (MOD) | service / API client | streaming + request-response | itself (`claude-api.js:69-118`) + `github-api.js:26-37` | exact (extend) |
| `app/js/views/chat.js` (NEW) | view | streaming (SSE) | `recommender.js` (IIFE+render+_attach), `settings.js:41-59` (overlay/drawer) | role-match |
| `app/js/views/classroom.js` (NEW) | view | request-response | `recommender.js` render shell + `dashboard.js` menu-grid | role-match |
| `app/js/views/library.js` (NEW) | view | CRUD | `recommender.js` (chip CRUD + State.patch/save) | role-match |
| `app/js/data/classroom-content.js` (NEW) | config / static data | (static) | `classics-db.js` (const array IIFE-free global) + `config.js` accessors | partial (greenfield shape) |
| `data/drafts.json` (NEW) | data file | file-I/O | `data/recipes.json` | role-match |
| `schema/drafts.schema.json` (NEW) | config / schema | (validation) | `schema/recipes.schema.json` (`savedRecipe`/`madeEntry` defs, `_source`) | exact |
| `app/js/state.js` (MOD) | store | pub-sub + file-I/O | itself (`state.js:4-9`, 4-file pattern) | exact (extend) |
| `app/js/normalize.js` (MOD) | utility | transform | `normalize.js` `recipes()` (`normalize.js:233-248`) | exact (extend) |
| `app/js/app.js` (MOD) | route | event-driven | `app.js:71-104` switch | exact (extend) |
| `app/index.html` (MOD) | config / markup | (markup) | `index.html:24-52` nav, `:70-105` scripts | exact (extend) |
| `app/css/app.css` (MOD) | config / styles | (styles) | existing single stylesheet | exact (extend) |
| `app/js/views/settings.js` (MOD) | view | CRUD | `settings.js:150-166,272-299` (AI-key section) | exact (extend) |
| `app/js/views/recipes.js` (MOD) | view | CRUD + request-response | `recipes.js:18-79` (tabs), `:76-155` (generate), `:231-287` (chips) | exact (extend) |
| `app/js/views/recommender.js` (MOD) | view | request-response | `recommender.js:85-89` (card-actions) | exact (extend) |
| `app/js/views/inventory.js` (MOD) | view | transform | `inventory.js:77-113` (parseBottleEntry) | exact (extend) |
| `app/js/views/dashboard.js` (MOD) | view | event-driven | `dashboard.js:128-152` (disabled cards + toast) | exact (extend) |
| `app/js/views/bartender-wizard.js` (MOD) | view | request-response | `bartender-wizard.js:236-246,300-302` (personality textarea) | exact (extend) |
| `app/js/recommender-engine.js` (MOD) | service | transform | `recommender-engine.js:103-137` (DERIVATIONS) | exact (extend) |
| `app/js/write-gate.js` (NEW, planner discretion) | utility / guard | transform → confirm → write | `export.js:264-328` (preview rows + confirm + sequential State.set/save) | role-match |
| `context-builder` / `deriveContextMarkdown()` (NEW, may fold into claude-api.js) | utility | transform (JSON→MD) | `export.js:56-145` (`exportAIContext`) | role-match |
| `tests/phase-07-ai.test.js` (NEW) | test | (assertion) | `tests/phase-06-engine.test.js` | exact |
| `data/library.json` (NEW, IF chosen — A2 open question) | data file | file-I/O | `data/recipes.json` | role-match (conditional) |

---

## Pattern Assignments

### `app/js/claude-api.js` (service, streaming + request-response) — EXTEND

**Analog:** itself. Keep `generateRecipe` working; add `callMessages`, `streamMessage`, `requestJSON`, `buildContext`, harden `appendLog`, fix stale model.

**IIFE + return surface** (`claude-api.js:5,120-121`): module is `const ClaudeAPI = (() => { ... return { generateRecipe }; })();`. Add new functions to the return object.

**Header block to REUSE verbatim** for every new call (`claude-api.js:87-93`):
```javascript
headers: {
  'content-type': 'application/json',
  'x-api-key': key,
  'anthropic-version': API_VERSION,                       // '2023-06-01'
  'anthropic-dangerous-direct-browser-access': 'true',    // CHAT-02 — mandatory in browser
},
```

**Model + key accessors already exist** (`claude-api.js:13-19`) — `getKey()` returns `''` when absent (CHAT-03 gate); `getModel()` reads `bb_chat_model` (SET-05 wiring is free):
```javascript
function getKey()   { return localStorage.getItem('bb_anthropic_key') || ''; }
function getModel() { return localStorage.getItem('bb_chat_model') || DEFAULT_MODEL; }
```
> ⚠️ FIX: `DEFAULT_MODEL = 'claude-sonnet-4-5-20250929'` (`claude-api.js:11`) is stale → `'claude-sonnet-4-6'` (RESEARCH State-of-the-Art).

**Error/429 handling to REPLICATE in the stream path** (`claude-api.js:96-105`):
```javascript
if (!res.ok) {
  const msg =
    res.status === 401 ? 'Invalid API key. Check Settings.' :
    res.status === 429 ? `Rate limited — retry after ${res.headers.get('retry-after') || '?'}s.` :  // CHAT-09
    res.status === 529 ? 'Anthropic API overloaded. Try again in a moment.' :
    errBody.error?.message || `HTTP ${res.status}`;
  appendLog({ type: 'error', status: res.status, message: msg });
  throw new Error(msg);
}
```

**Fence-tolerant JSON extractor already exists — REUSE in `requestJSON`** (`claude-api.js:62-67`): `extractJSON(text)` strips ```` ```json ```` fences then `JSON.parse`.

**Log hardening (AI-09)** — current `appendLog` is cap-correct (`claude-api.js:53-60`, 50-entry splice) BUT current call sites log `prompt`/`system`/`raw` text (`claude-api.js:83,111`). New entries log `{ ts, type, model, usage }` only — NEVER the key (FM #4). Stream path: emit on `message_delta.usage`. Streaming SSE parser + `requestJSON` bodies are pre-written in `07-AI-SPEC.md §3` and `07-RESEARCH.md Pattern 1 / Code Examples` — copy those, not invented code.

---

### `app/js/views/chat.js` (view, streaming SSE) — NEW

**Analog:** `recommender.js` for the IIFE/render/_attach/_rerender skeleton; `settings.js:41-59` for the overlay/drawer DOM pattern.

**IIFE + single render export** (`recommender.js:2,515,660`):
```javascript
const RecommenderView = (() => {
  function render(container) { container.innerHTML = ''; /* build, then */ _attach(container); _rerender(container); }
  return { render };
})();
```
Chat must additionally export `openDrawer({ seed })` for D-01 entry points (seeded ephemeral surface) and a `cleanup()` for CHAT-06 abort.

**Overlay/drawer construction + dismiss** (`settings.js:41-59`, also `recipes.js:129-154`):
```javascript
const overlay = document.createElement('div');
overlay.className = 'confirm-dialog-overlay';
overlay.innerHTML = `...`;
document.body.appendChild(overlay);
overlay.querySelector('#dlg-cancel').addEventListener('click', () => overlay.remove());
overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });  // backdrop close
```

**Live-render tokens SAFELY** — model text MUST pass `Utils.escapeHtml()` (`utils.js:26-32`) before any `innerHTML`, or append as text nodes (Pitfall 3). Reuse `Utils.showToast` (`utils.js:44-55`) for transient errors.

**Persistence (D-03)** — `bb_chat_history` in `localStorage` (NOT GitHub per-message); manual "Save conversation to GitHub" uses `GitHubAPI.writeJSON` (see shared pattern). Drawer is in-memory only; `cleanup()` abort must NOT touch `bb_chat_history` (Pitfall 5).

---

### `app/js/views/classroom.js` (view, request-response) — NEW

**Analog:** `recommender.js` render shell + `dashboard.js:99-126` menu-grid for the lesson-tile layout.

Loads static `classroom-content.js` WITHOUT a key (AI-06). With a key, lesson-scoped Q&A opens the shared drawer seeded with lesson context (AI-07) — reuse `ChatView.openDrawer({ seed })`. No-key affordance: same toast/link pattern as `dashboard.js:146-152`.

---

### `app/js/views/library.js` (view, CRUD) — NEW

**Analog:** `recommender.js` chip CRUD via `State.patch` + `State.save`. Add/remove/edit external links (url, title, description, tags).

**CRUD-via-State pattern** (`recommender.js:206-217`):
```javascript
function addToShoppingList(itemName) {
  State.patch('inventory', inv => {
    if (!Array.isArray(inv.shopping_list)) inv.shopping_list = [];
    inv.shopping_list.push({ item: itemName, rationale: '…' });
  });
  State.save('inventory').then(() => Utils.showToast('Added to shopping list'));
}
```
> Open Question A2: if Library persists to `data/library.json` it becomes a 6th State file (register in `FILES`, add `Normalize.library`, commit a seed file). localStorage is the simpler v1 alternative. Planner decides.

---

### `app/js/data/classroom-content.js` (config / static data) — NEW (greenfield shape)

**Analog:** `classics-db.js` (large global const array module — confirmed via `index.html:83`, loaded as a plain `<script>` exposing a global). `config.js` for the accessor-wrapper style if interactive lookups are needed.

Shape: a global `const CLASSROOM_CONTENT = [ { topic, lessons:[{title, body, ...}] } ]` read by `classroom.js`. No API, no fetch — static. (No exact analog for the lesson taxonomy content; the *module shape* is `classics-db.js`.)

---

### `data/drafts.json` + `schema/drafts.schema.json` (data file + schema) — NEW

**Analog:** `data/recipes.json` + `schema/recipes.schema.json`.

**Reuse the `savedRecipe` definition** (`recipes.schema.json:134-152`) as the draft item base — it already carries `_source` (`"classics-db | originals | ai-generated"`):
```json
"savedRecipe": {
  "type": "object", "required": ["name"],
  "properties": {
    "_source": { "type": "string", "description": "Provenance: classics-db | originals | ai-generated" },
    "name": {...}, "base": {...}, "method": {...}, "glassware": {...},
    "garnish": {...}, "occasion": {...}, "ingredients": { "items": { "$ref": "#/definitions/ingredient" } }, "notes": {...}
  }
}
```
Draft items extend this with `draft_id`, `created_at`, `updated_at`, `source_prompt`, `_source:'ai-generated'`. **Seed `data/drafts.json`** as `{ "drafts": [], "last_updated": "2026-05-21" }` and COMMIT it (Pitfall 1: `loadAll` 404s on a missing 5th file unless made tolerant — see state.js below).

---

### `app/js/state.js` (store) — EXTEND (add 5th file)

**Analog:** itself — the 4-file pattern at `state.js:4-9`:
```javascript
const FILES = {
  barkeeper:  'data/barkeeper.json',
  profile:    'data/bar-owner-profile.json',
  inventory:  'data/inventory.json',
  recipes:    'data/recipes.json',
  // ADD: drafts: 'data/drafts.json',
};
```
`loadAll()` iterates `FILES` so it picks up `drafts` automatically (`state.js:41-50`); `save('drafts')` and the 409-retry (`state.js:71-99`) work unchanged; `set('drafts')` calls `_normalize('drafts', …)` (`state.js:103-107`). **Pitfall 1:** make `loadAll` tolerant of a 404 on `drafts` (treat as `{drafts:[]}`) so existing user repos don't break on upgrade.

---

### `app/js/normalize.js` (utility, transform) — EXTEND

**Analog:** `recipes()` (`normalize.js:233-248`) — idempotent, array-coercing, drops `favorites` legacy key. Add a `drafts(data)` normalizer in the same shape and register it in `byKey` (`normalize.js:251-257`):
```javascript
function byKey(key, data) {
  if (key === 'inventory') return inventory(data);
  if (key === 'barkeeper') return barkeeper(data);
  if (key === 'profile')   return profile(data);
  if (key === 'recipes')   return recipes(data);
  // ADD: if (key === 'drafts') return drafts(data);
  return data;
}
```
`Normalize.drafts` must: ensure `{ drafts:[…], last_updated }`, tag each `_source:'ai-generated'`, drop unknown keys, be idempotent. Reuse helpers `ensureObject/ensureArray/ensureString/isoToday` (`normalize.js:7-10`).

---

### `app/js/app.js` (route, event-driven) — EXTEND

**Analog:** the switch at `app.js:71-104`:
```javascript
switch (route) {
  case 'recommender': RecommenderView.render(content); break;
  // ADD: case 'chat':      ChatView.render(content); break;
  // ADD: case 'classroom': ClassroomView.render(content); break;
  // ADD: case 'library':   LibraryView.render(content); break;
  default: DashboardView.render(content);
}
```
For CHAT-06: call the leaving view's `cleanup()` before rendering the next route (new — no current view defines cleanup; chat introduces it). `params` parsing already exists (`app.js:36-40`).

---

### `app/index.html` (markup) — EXTEND

**Nav links** (`index.html:24-52`): each is `<a href="#route" data-route="route">…</a>`; `app.js:29-31` toggles `.active`. Add `#chat`, `#classroom`, `#library`.

**Script load order** (`index.html:70-105`): add NEW files as plain `<script src="js/…">` AFTER `claude-api.js` (line 102) and BEFORE `app.js` (line 105). Views load with the other views (lines 89-100). `classics-db.js`-style data file loads early (line 83 region).

---

### `app/js/views/settings.js` (view, CRUD) — EXTEND

**Analog:** the existing AI section (`settings.js:150-166` markup, `:272-299` handlers). The masked field + Show/Hide toggle + save/clear are DONE:
```javascript
container.querySelector('#st-ai-key-toggle').addEventListener('click', () => {
  const inp = container.querySelector('#st-anthropic-key');
  inp.type = inp.type === 'password' ? 'text' : 'password';   // Reveal toggle (AI-01)
});
container.querySelector('#st-save-ai-key').addEventListener('click', () => {
  const key = container.querySelector('#st-anthropic-key').value.trim();
  if (key) localStorage.setItem('bb_anthropic_key', key); else localStorage.removeItem('bb_anthropic_key');
});
```
ADD into `#sect-ai-key`: a model `<select>` (Haiku/Sonnet/Opus → `bb_chat_model`) — copy the voice-preset `<select>` pattern (`settings.js:94-100`). ADD an AI-09 log panel (render `bb_api_log` entries with copy-raw-JSON + clear) — follow the section/status-line layout used throughout (`settings.js:104,137,165`). **Reset all data** already enumerates `bb_*` keys dynamically (`settings.js:62-68`) — it will clear the new keys automatically; verify.

---

### `app/js/views/recipes.js` (view, CRUD + request-response) — EXTEND

**Analog:** itself. Tabs (`recipes.js:38-63`) — ADD a "Drafts" tab the same way; chip render (`recipes.js:231-287`) — drafts render as chips since they conform to universal recipe JSON.

**Generate flow to UPGRADE** (`recipes.js:76-78,107-155`): today `showAIPromptModal` only copies a prompt. D-09/D-10/D-11 replace this with a real `ClaudeAPI`-driven design → auto-save draft → refine card. Reuse `buildPromptContext()` (`recipes.js:81-105`) as the seed.

**ID convention for Promote-to-Original** (`recipes.js` add path) — assign `id: 'cocktail' + Date.now()` (matches `^cocktail[0-9]+$` in `recipes.schema.json:59`); re-tag `_source:'originals'`; push to `recipes.originals`; remove from `drafts`; then **sequential** `State.save('recipes')` THEN `State.save('drafts')` (Pitfall 4 — avoid 409).

**REC-04 entry point** — add an "Ask Bjorn about this" button to chip render (`recipes.js:231-287`) that calls `ChatView.openDrawer({ seed })`.

---

### `app/js/views/recommender.js` (view, request-response) — EXTEND

**Analog:** card-actions block (`recommender.js:85-89`) — already a row of per-card `<button>`s wired in `_rerender` (`recommender.js:310-389`). ADD an "Ask Bjorn / Explain fit" button (REC-04/AI-04) to `_renderCard`/`_renderTwoAwayCard` and wire it in `_rerender` to `ChatView.openDrawer({ seed })` seeded with the recipe + the user's profile/mood (D-01). Mood/profile floats via `_getInitialSliderValues` (`recommender.js:170-183`).

---

### `app/js/views/inventory.js` (view, transform) — EXTEND

**Analog:** `parseBottleEntry(rawName, sectionKey)` (`inventory.js:77-113`) — the regex/catalog parser. AI-11 adds a Claude fallback ONLY when confidence is low (e.g. `type` fell back to the raw name at `inventory.js:110`). Cache results to avoid repeat calls (Pitfall 6). Use `ClaudeAPI.requestJSON` with the inventory schema.

---

### `app/js/views/dashboard.js` (view, event-driven) — EXTEND

**Analog:** the two disabled "coming soon" cards + gating toast (`dashboard.js:128-152`):
```javascript
menuEl.insertAdjacentHTML('beforeend', `
  <div class="menu-item menu-item--disabled" data-coming-soon ...>
    <span class="menu-item-title">Chat with Bjorn</span> ...
  </div> ...`);
menuEl.addEventListener('click', e => {
  if (e.target.closest('[data-coming-soon]')) {
    Utils.showToast('Unlock by adding your Anthropic API key in Settings.');  // reuse as CHAT-03 affordance
    e.preventDefault(); e.stopPropagation();
  }
});
```
UN-DISABLE these → real `<a href="#chat">` / `<a href="#classroom">` menu items (copy a live card e.g. `dashboard.js:117-121`). ADD a Library card + AI-05 inventory-advice entry (seeds the drawer). Keep the toast/gating as the no-key affordance.

---

### `app/js/views/bartender-wizard.js` (view, request-response) — EXTEND

**Analog:** the long-form personality textarea (`bartender-wizard.js:236-246`) + its input handler (`:300-302`):
```javascript
document.getElementById('bw-personality')?.addEventListener('input', e => {
  State.patch('barkeeper', bk2 => { bk2.personality_description = e.target.value; });
});
```
AI-12 adds a "Help me write this with Claude" button next to the textarea → `ClaudeAPI.requestJSON`/free-text draft from short inputs → fill the textarea (user edits before the existing State.patch save).

---

### `app/js/recommender-engine.js` (service, transform) — EXTEND

**Analog:** the static `DERIVATIONS` map (`recommender-engine.js:103-114`) + `_expandLookup` (`:127-137`). AI-13 adds a Claude fallback ONLY on a derivation miss, with the result cached (localStorage). The static map stays authoritative; Claude fills gaps.

---

### `tests/phase-07-ai.test.js` (test) — NEW

**Analog:** `tests/phase-06-engine.test.js` — `node:test` + `node:assert/strict`, loading IIFE modules via `vm.runInThisContext` with stubbed browser globals. THIS is the test harness the planner copies.

**Harness boilerplate to COPY** (`tests/phase-06-engine.test.js:9-24`):
```javascript
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
global.window = {};
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
global.document = { getElementById: () => null };
vm.runInThisContext(fs.readFileSync(path.resolve(__dirname, '../app/js/normalize.js'), 'utf8'));
// then assert against the loaded global (Normalize, ClaudeAPI, etc.)
```
Run: `node tests/phase-07-ai.test.js`. Coverage (RESEARCH Validation Architecture): schema-shape, Normalize.drafts idempotency + promote re-tag, requestJSON parse/one-retry, getModel default `claude-sonnet-4-6`, appendLog 50-cap + no-key, write-gate structural, inventory-fidelity. No live Anthropic calls in CI.

---

## Shared Patterns

### Conflict-safe GitHub write (drafts, conversation save, AI-08/AI-10 confirmed writes)
**Source:** `state.js:71-99` (`save` + 409 refetch-retry) over `github-api.js:50-59` (`writeJSON` base64+SHA).
**Apply to:** every persisted write — chat.js (Save conversation), recipes.js (drafts/promote), write-gate.js, library.js.
```javascript
const result = await GitHubAPI.writeJSON(path, _data[key], _shas[key], message);
_shas[key] = result.content.sha;
// on SHA conflict: getFileSHA → retry once (state.js:80-95)
```
**Multi-file writes MUST be sequential** (`export.js:309-315`, `settings.js:342-352`) — parallel `State.save` causes 409.

### Data-write safety gate (schema → diff preview → explicit confirm → write)
**Source:** `export.js:264-328` (`renderPreview` rows + `#imp-confirm` handler + sequential `State.set`/`State.save`).
**Apply to:** AI-03 (draft promote), AI-08 (MD import), AI-10 (JSON repair). Build ONCE as `write-gate.js` (RESEARCH Pattern 3 / A4). Add a schema-shape validator (the app has no JSON-Schema runtime) and an old-vs-new diff before the existing confirm-then-write skeleton:
```javascript
preview.querySelector('#imp-confirm').addEventListener('click', async () => {
  State.set(key, parsed[key]);          // already Normalized on set (state.js:104)
  await State.save(key, '…');           // only AFTER validate + confirm
});
```
Invalid payload → never offered for write (FM #1/#2, fail-closed).

### JSON→MD context derivation (D-06)
**Source:** `export.js:56-145` (`exportAIContext`) — already walks State `_data` and emits `# / ## / -` markdown for inventory, flavor profile, originals. Closest existing JSON→MD analog. `deriveContextMarkdown()` reuses this approach (context-only, lossy-OK; Phase 8 owns the strict round-trippable export — A2/Open Q2).

### XSS-safe rendering
**Source:** `Utils.escapeHtml` (`utils.js:26-32`), used everywhere (e.g. `recommender.js:70`, `recipes.js:211`).
**Apply to:** ALL model output + user input before `innerHTML` — especially streamed chat tokens (Pitfall 3 / Security V10).

### Recipe identity / dedup
**Source:** `Utils.sameRecipe(a,b)` (`utils.js:113-117`) — name+base, case-insensitive, null-safe.
**Apply to:** promote-to-Original dedup, drafts dedup (Phase 6 D-08; tested `phase-06-engine.test.js:60-80`).

### Toast + status-line feedback
**Source:** `Utils.showToast` (`utils.js:44-55`); inline `<p id="…-status">` color-coded var(--green)/var(--red) (`settings.js:222-228`).
**Apply to:** all AI surfaces (errors, 429 retry-after, save confirmations).

### IIFE view module contract
**Source:** every view, canonical = `recommender.js:2,515,660`. `const XView = (() => { … function render(container){…} return { render }; })();` no globals. Chat additionally exports `openDrawer` + `cleanup`.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `app/js/data/classroom-content.js` | config / static data | (static) | Module *shape* matches `classics-db.js`, but the lesson taxonomy/content (Techniques/Glassware/Ratios/Ingredients) is greenfield — no existing teaching content to copy. Planner authors content; copy the global-const-array shape only. |
| `data/library.json` + Library storage | data file | file-I/O | Conditional/greenfield — A2 open question. IF a JSON file, copy `recipes.json` + register as 6th State file; IF localStorage, no data-file analog needed. Planner decides storage location first. |

---

## Metadata

**Analog search scope:** `app/js/` (all 9 core modules + 10 views), `tests/`, `schema/`, `data/`, `app/index.html`.
**Files scanned:** 24 read in full or targeted (claude-api, state, github-api, app, normalize, utils, config, dashboard, settings, recommender, recipes, export, inventory§, bartender-wizard§, recommender-engine§, recipes.schema, phase-06 test, index.html§).
**Pattern extraction date:** 2026-05-21

### Key Patterns Identified
- **Single API chokepoint:** all Anthropic calls extend the existing `ClaudeAPI` IIFE; the browser-direct header (`claude-api.js:87-93`) and `appendLog` already exist — extend, don't rebuild.
- **5th State file is a 5-line change:** `FILES` map drives `loadAll`/`save`/`_normalize` (`state.js:4-9,41-50`); add `drafts`, a `Normalize.drafts`, and a committed seed (tolerant 404).
- **Write safety already has a template:** `export.js:264-328`'s preview→confirm→sequential-save IS the write-gate skeleton; AI writes generalize it (validate + diff added).
- **JSON→MD already exists:** `exportAIContext` (`export.js:56-145`) is the context-derivation precedent.
- **Tests:** `node:test` + `vm.runInThisContext` IIFE loading (`phase-06-engine.test.js`) is the exact harness for `phase-07-ai.test.js`.
