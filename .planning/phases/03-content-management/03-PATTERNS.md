# Phase 3: Content Management — Pattern Map

**Mapped:** 2026-05-13
**Files analyzed:** 5 new/modified artifacts
**Analogs found:** 5 / 5

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `app/js/claude-api.js` | service/wrapper | request-response | `app/js/github-api.js` lines 1–100 | exact (same IIFE wrapper + fetch-or-throw shape) |
| `app/js/export.js` | service | file-I/O + CRUD | `app/js/export.js` lines 1–287 (already exists; needs upgrade to ZIP) | self — extend in-place |
| `app/js/views/recipes.js` | view | CRUD | `app/js/views/recipes.js` lines 423–643 (renderForm, validation, save) | self — extend in-place |
| `app/js/views/settings.js` | view | CRUD | `app/js/views/settings.js` lines 105–184 (GitHub section = PAT input + save + status `<p>`) | self — extend in-place |
| `app/index.html` | config | — | `app/index.html` lines 68–92 (`<script>` block) | self — extend in-place |

---

## Pattern Assignments

### `app/js/claude-api.js` (NEW — service, request-response)

**Analog:** `app/js/github-api.js` (entire file, 100 lines)

**IIFE module wrapper** (github-api.js:4, 99–100):
```javascript
const GitHubAPI = (() => {
  const BASE = 'https://api.github.com';
  // ... private helpers ...
  return { readJSON, writeJSON, writeFile, getFileSHA, validateConfig, getRateLimit, isConfigured, cfg };
})();
```
Copy this exact shape. `ClaudeAPI` replaces `GitHubAPI`, `ENDPOINT` replaces `BASE`.

**Credential lookup from localStorage** (github-api.js:7–14):
```javascript
function cfg() {
  return {
    token: localStorage.getItem('bb_token'),
    // ...
  };
}
```
For `ClaudeAPI`, the equivalent is:
```javascript
function getKey() {
  return localStorage.getItem('bb_anthropic_key');
}
```
Same pattern: read from `localStorage` at call time (not cached), throw if absent.

**Fetch-or-throw core** (github-api.js:26–37):
```javascript
async function request(method, path, body = null) {
  const url = `${BASE}/repos/${owner}/${repo}${path}`;
  const opts = { method, headers: headers() };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}
```
`ClaudeAPI.generateRecipe` follows this pattern: `fetch → if (!res.ok) throw → return parsed`. The only difference is the extra Anthropic-specific headers and the JSON extraction step after the response.

**Gotchas for `claude-api.js` vs the analog:**
- Add `'anthropic-dangerous-direct-browser-access': 'true'` and `'anthropic-version': '2023-06-01'` headers — not present in the GitHub analog.
- The response body shape differs: `data.content[0].text` not `data` directly.
- Add `extractJSON(text)` to strip codefences before `JSON.parse` — the GitHub analog never needs this.
- Model ID (`claude-sonnet-4-5-20250929` or current) must be re-verified at implementation time against `docs.anthropic.com/en/docs/about-claude/models`.
- Status code 401 / 429 / 529 need specific error messages (see RESEARCH.md Anthropic Error Handling section).

---

### `app/js/export.js` (EXTEND — service, file-I/O)

**Status: already exists at `app/js/export.js` lines 1–287.** The current implementation uses JSON export (not ZIP) and JSON import (not ZIP). Phase 3 upgrades both to ZIP format per D-07.

**Existing IIFE wrapper + triggerDownload helper** (export.js:4–20) — keep unchanged:
```javascript
const DataExport = (() => {
  const EXPORT_VERSION = '1.0';
  const SECTIONS = ['inventory', 'recipes', 'profile', 'barkeeper'];

  function triggerDownload(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  // ...
})();
```
For ZIP export, `triggerDownload` can still be used — `zip.generateAsync({type:'blob'})` returns a `Blob` directly. Pass that blob to `triggerDownload` or inline the `<a>` trigger.

**Existing `exportJSON()` — replace with ZIP version** (export.js:28–35):
```javascript
function exportJSON() {
  const bundle = {
    _export: { version: EXPORT_VERSION, app: 'barkeeper-bjorn', date: new Date().toISOString() },
  };
  SECTIONS.forEach(k => { bundle[k] = State.get(k) || {}; });
  const filename = `barkeeper-bjorn-export-${today()}.json`;
  triggerDownload(JSON.stringify(bundle, null, 2), filename, 'application/json');
}
```
Replace body with JSZip calls. File name changes to `.zip`. The `SECTIONS` constant and `today()` helper remain unchanged.

**Existing sequential-save import pattern** (export.js:247–261 — the `for...of` loop):
```javascript
try {
  for (const key of selected) {
    State.set(key, bundle[key]);
    await State.save(key, `Import ${key} from bundle via Settings`);
  }
  // ...
}
```
This is the canonical sequential pattern. ZIP import copies it exactly, substituting the parsed-ZIP values for `bundle[key]`. Do NOT convert to `Promise.all` — that causes 409 SHA conflicts.

**Existing `renderImportUI` — extend for ZIP + drag-and-drop** (export.js:158–193):
```javascript
function renderImportUI(container) {
  container.innerHTML = `
    ...
    <button class="btn btn-secondary btn-sm" id="imp-choose">Choose File</button>
    <span id="imp-filename" ...>No file chosen</span>
    <div id="imp-preview" style="display:none;..."></div>`;

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json,application/json';
  fileInput.style.display = 'none';
  container.appendChild(fileInput);
  container.querySelector('#imp-choose').addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    // ...
    const reader = new FileReader();
    reader.onload = e => { try { const bundle = JSON.parse(e.target.result); ... } catch { ... } };
    reader.readAsText(file);
  });
}
```
For ZIP: change `fileInput.accept` to `'.zip'`; replace `FileReader + JSON.parse` with `JSZip.loadAsync(file)` then `entry.async('string')` for each of the four named entries. The drop zone is a sibling `<div>` added to the same `container.innerHTML` block, wired with `dragover`/`drop` events (Pattern 4 in RESEARCH.md). The `handleFile(file)` function is called from both the file picker `change` handler and the `drop` handler.

**Existing `renderImportPreview` — replace checkbox UX with single Confirm button** (export.js:196–263):

Current implementation renders per-section checkboxes (EXPORT-04 old approach). Per D-08, replace with a preview table listing all four files + a single "Confirm Import" button. The sequential-save loop (export.js:247–261) stays structurally identical — remove the checkbox filtering; always write all four keys.

**`exportAIContext()` — already implemented** (export.js:39–154). No changes needed for Phase 3.

**Gotchas for `export.js` vs current code:**
- `JSZip` is a CDN global — it must be loaded in `index.html` before `export.js`. Verify load order.
- `zip.generateAsync({type:'blob'})` is async; `exportJSON` must become `async function exportJSON()`. The button click handler in `settings.js` (`container.querySelector('#st-export-json').addEventListener('click', () => DataExport.exportJSON())`) does not `await` — that is fine because the async rejection will be unhandled. Add `.catch(err => Utils.showToast(err.message, 'error'))` in the handler.
- The existing settings.js button label says "Export All Data (JSON)" (settings.js:155). Relabel to "Export All Data (ZIP)" to match D-07.
- `dragover` MUST call `e.preventDefault()` or `drop` never fires — the single most common landmine.

---

### `app/js/views/recipes.js` — `renderForm` extension (EXTEND — view, CRUD)

**Analog:** self — `renderForm` at recipes.js:423–621

**Back button + in-place replacement pattern** (recipes.js:427–434):
```javascript
function renderForm(r, container) {
  const isEdit = !!r;
  container.innerHTML = '';

  const back = document.createElement('button');
  back.className = 'back-btn';
  back.textContent = isEdit ? '← Back to Recipe' : '← Back to Recipes';
  back.addEventListener('click', () => {
    if (isEdit) renderDetail(r, container);
    else render(container);
  });
  container.appendChild(back);
  // ...
}
```
The AI prompt block inserts before `wrap.innerHTML +=` (line 448) when `!isEdit`. It renders a `<textarea id="rf-ai-prompt">` + `<button id="rf-generate">` + a spinner `<div>` inside a wrapping div. The "Generate" button calls `ClaudeAPI.generateRecipe(prompt, ctx)` then populates form fields in-place.

**Form field IDs for AI auto-populate** (recipes.js:450–527 — the innerHTML block):

The existing field IDs are the contract for AI auto-fill:
```
#rf-name        → input[type=text]
#rf-tagline     → input[type=text]
#rf-creator     → input[type=text]
#rf-method      → textarea
#rf-glassware   → input[type=text]
#rf-garnish     → input[type=text]
#rf-profile     → textarea  (maps to tasting_notes from AI)
#rf-ingredients → div containing .rf-ing-row rows
```
After `ClaudeAPI.generateRecipe` resolves, set `.value` on each input. For ingredients, rebuild `#rf-ingredients` using `ingredientRowHtml` (recipes.js:623–631) and re-call `bindIngredientRemove(wrap)` (recipes.js:633–639).

**`ingredientRowHtml` helper** (recipes.js:623–631):
```javascript
function ingredientRowHtml(ing, i) {
  return `
    <div class="rf-ing-row form-row" style="align-items:center;margin-bottom:6px;">
      <input class="rf-ing-amount" type="text" value="${Utils.escapeHtml(ing.amount || '')}" placeholder="2 oz" style="flex:0 0 90px;">
      <input class="rf-ing-name"   type="text" value="${Utils.escapeHtml(ing.name  || '')}" placeholder="Ingredient">
      <input class="rf-ing-notes"  type="text" value="${Utils.escapeHtml(ing.notes || '')}" placeholder="Notes (opt)" style="flex:0 0 160px;">
      <button type="button" class="btn-icon rf-ing-remove" title="Remove" style="flex:none;">✕</button>
    </div>`;
}
```
Call this for each `ing` in the AI response's `ingredients` array to rebuild `#rf-ingredients`.

**Existing validation gate** (recipes.js:545–549):
```javascript
wrap.querySelector('#rf-save').addEventListener('click', () => {
  const name = wrap.querySelector('#rf-name').value.trim();
  const creator = wrap.querySelector('#rf-creator').value.trim();
  if (!name) { Utils.toast('Name is required.', 'error'); return; }
  if (!creator) { Utils.toast('Creator is required.', 'error'); return; }
  // ...
```
Extend this gate per D-02: add checks for `ingredients.length === 0` and `method === ''` before the save proceeds. The ingredient array is already collected at lines 551–559.

**Existing "Add Recipe" button in `renderOriginalsGrid`** (recipes.js:133–139):
```javascript
const addBtn = document.createElement('div');
addBtn.style.cssText = 'display:flex;justify-content:flex-end;margin-bottom:12px;';
addBtn.innerHTML = `<button class="btn btn-secondary btn-sm">+ Add Recipe</button>`;
addBtn.querySelector('button').addEventListener('click', () => {
  renderForm(null, document.getElementById('main-content'));
});
container.appendChild(addBtn);
```
Per D-03 and D-04, relabel to `"+ New Recipe"`. Optionally move into the page header (lines 11–18) alongside the existing "✨ Generate with AI" button, per the UI-SPEC.

**Existing AI modal build context helpers** (recipes.js:52–71):
```javascript
const spirits = Object.entries(inventory.base_spirits || {})
  .flatMap(([cat, items]) => items.map(i => (typeof i === 'string' ? i : i.name) + ` (${cat})`));
const pantry  = Object.values(inventory.pantry || {}).flat()
  .map(i => typeof i === 'string' ? i : i.name);
const axes    = profile.flavor_profile?.axes || {};

const inventoryText = [
  spirits.length ? `Spirits: ${spirits.join(', ')}` : '',
  pantry.length  ? `Pantry: ${pantry.join(', ')}` : '',
].filter(Boolean).join('\n') || 'Not set yet.';

const profileText = Object.entries(axes)
  .map(([k, v]) => `${k}: ${v}`)
  .join(', ') || 'Not set yet.';
```
Extract this into a private `buildPromptContext()` helper inside `RecipesView`. Reuse it in both the existing `showAIPromptModal` (fallback, no API key) and the new in-form generate path (D-12).

**`State.save` pattern in renderForm** (recipes.js:608–619):
```javascript
State.save('recipes').then(() => {
  Utils.toast(isEdit ? 'Recipe updated.' : 'Recipe created.');
  renderDetail(updated, container);
}).catch(err => {
  Utils.toast('Save failed: ' + err.message, 'error');
  saveBtn.disabled = false;
  saveBtn.textContent = isEdit ? 'Save Changes' : 'Create Recipe';
});
```
The Generate button uses the same disable/re-enable pattern during the async API call, just calling `ClaudeAPI.generateRecipe` instead of `State.save`.

**Gotchas for `recipes.js` extensions:**
- `Utils.toast` does NOT exist — the correct function is `Utils.showToast` (utils.js:44). recipes.js has 8 broken call sites: lines 264, 266, 405, 414, 548, 549, 613, 616. Phase 3 plan must include a fix task (add alias `toast: showToast` to utils.js:111 return statement, or bulk rename).
- The existing `showAIPromptModal` is the **no-key fallback**. When `bb_anthropic_key` is present, the in-form generate block (D-12) is the primary path. When key is absent, hide the Generate button with a tooltip or retain the modal — do not remove the modal entirely.
- AI auto-populate must escape all field values through `Utils.escapeHtml` before setting `.value` — the source is Claude's output, not the user's own data, but the same XSS rule applies.
- `suggested_occasions` from AI is an array of strings. There is no existing form field for it; either add `#rf-occasions` textarea (join with commas) or drop it from the auto-fill (the field is optional per D-02).

---

### `app/js/views/settings.js` — AI Key section (EXTEND — view, CRUD)

**Analog:** `app/js/views/settings.js` lines 105–136 (the GitHub PAT `<input type="password">` section)

**Section HTML pattern to clone** (settings.js:105–136):
```html
<!-- ── Section 2: GitHub Connection (SETTINGS-02) ───────────────── -->
<div class="settings-section" id="sect-github">
  <div class="settings-section__heading">GitHub Connection</div>
  <div class="form-group">
    <label for="st-gh-token">Personal Access Token</label>
    <input type="password" id="st-gh-token"
           value="${Utils.escapeHtml(cfg.token || '')}"
           placeholder="ghp_…" autocomplete="off">
  </div>
  ...
  <button class="btn btn-primary btn-sm" id="st-save-github">Update GitHub connection</button>
  <p id="st-github-status" style="min-height:1.2em;margin-top:8px;font-size:0.82rem;"></p>
</div>
```
New section `#sect-ai-key` follows the identical structure: `<div class="settings-section">` > `<div class="settings-section__heading">` > `<div class="form-group">` > `<input type="password">` > save button > `<p>` status line.

**Event handler pattern for a localStorage-only save** (settings.js:186–209 — identity section, which does NOT call GitHubAPI):
```javascript
container.querySelector('#st-save-identity').addEventListener('click', async () => {
  const name   = container.querySelector('#st-bk-name').value.trim() || 'Barkeeper Bjorn';
  const preset = container.querySelector('#st-bk-voice').value;
  const statusEl = container.querySelector('#st-identity-status');
  statusEl.textContent = 'Saving…';
  statusEl.style.color = 'var(--text-muted)';
  try {
    State.patch('barkeeper', bk => { ... });
    await State.save('barkeeper', '...');
    statusEl.textContent = 'Saved ✓';
    statusEl.style.color = 'var(--green)';
    Utils.showToast('Bartender settings updated.');
  } catch (err) {
    statusEl.textContent = `Save failed: ${Utils.escapeHtml(err.message)}`;
    statusEl.style.color = 'var(--red)';
    Utils.showToast(`Save failed: ${err.message}`, 'error');
  }
});
```
The AI key save is simpler — it's localStorage only, no `State.save()`:
```javascript
container.querySelector('#st-save-ai-key').addEventListener('click', () => {
  const key = container.querySelector('#st-ai-key').value.trim();
  const statusEl = container.querySelector('#st-ai-key-status');
  if (key) {
    localStorage.setItem('bb_anthropic_key', key);
    statusEl.textContent = 'Key saved ✓';
    statusEl.style.color = 'var(--green)';
    Utils.showToast('Anthropic API key saved.');
  } else {
    localStorage.removeItem('bb_anthropic_key');
    statusEl.textContent = 'Key removed.';
    statusEl.style.color = 'var(--text-muted)';
  }
});
```

**Show/hide password toggle** — pattern not yet in codebase. Use `btn-icon` class (app/css/app.css:298):
```javascript
// css/app.css:298 — .btn-icon already styled; add next to the <input>
const toggleBtn = document.createElement('button');
toggleBtn.className = 'btn-icon';
toggleBtn.type = 'button';
toggleBtn.title = 'Show/hide key';
toggleBtn.textContent = '👁';
toggleBtn.addEventListener('click', () => {
  const inp = container.querySelector('#st-ai-key');
  inp.type = inp.type === 'password' ? 'text' : 'password';
});
```

**Insertion point in the settings page:** Add `#sect-ai-key` inside `.settings-wrap` (settings.js:82–184), between `#sect-account` (line 138) and `#sect-export` (line 147). Render the section in the `container.innerHTML` template string alongside the others.

**`doLogout` cleanup** (settings.js:62–68):
```javascript
function doLogout() {
  Object.keys(localStorage)
    .filter(k => k.startsWith('bb_'))
    .forEach(k => localStorage.removeItem(k));
  window.location.hash = '#setup';
}
```
`bb_anthropic_key` uses the `bb_` prefix so it is automatically cleared on logout. No change needed.

**Gotchas for `settings.js` extensions:**
- The Export section button label currently reads "Export All Data (JSON)" (settings.js:155). Change to "Export All Data (ZIP)" per D-07.
- The Export section helper text mentions "JSON bundle" (settings.js:150–153). Update to "ZIP bundle" per D-07.
- `DataExport.exportJSON()` is now async (ZIP generation). The click handler at settings.js:252 must chain `.catch(...)` to surface errors as toasts.
- `DataExport.renderImportUI` at settings.js:258 is called with `container.querySelector('#st-import-area')`. The existing div is already in the template — no change to the call site, only to `export.js`'s implementation.

---

### `app/index.html` — JSZip CDN script tag (EXTEND — config)

**Analog:** `app/index.html` lines 68–92 (the existing `<script>` block)

**Existing load order** (index.html:68–92):
```html
<!-- Core modules (order matters) -->
<script src="js/github-api.js"></script>
<script src="js/state.js"></script>
<script src="js/utils.js"></script>

<!-- Recommender data + engine -->
<script src="js/classics-db.js"></script>
<script src="js/recommender-engine.js"></script>

<!-- Views -->
<script src="js/views/setup.js"></script>
...
<script src="js/views/settings.js"></script>
<script src="js/export.js"></script>

<!-- App entry point (must be last) -->
<script src="js/app.js"></script>
```
Note: `export.js` already has a `<script>` tag at line 88. `claude-api.js` does NOT yet have one.

**JSZip CDN tag placement:** Insert before `export.js` (which calls `JSZip`). Insert after `utils.js` but before any view scripts. The CDN script must resolve before `export.js` runs. Recommended insertion point: between `utils.js` and `classics-db.js`:
```html
<script src="js/utils.js"></script>

<!-- Third-party CDN (must load before export.js) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"
        integrity="sha512-XMVd28F1oH/O71fzwBnV7HucLxVwtxf26XV8P4wPk26EDxuGZ91N8bsOttmnomcCD3CS5ZMRL50H0GgOHvegtg=="
        crossorigin="anonymous"
        referrerpolicy="no-referrer"></script>
```
Re-verify the SRI hash at implementation time: `curl -sI https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js` and check the `digest` or use the cdnjs.com copy button.

**`claude-api.js` tag placement:** Insert after `export.js`, before `app.js`:
```html
<script src="js/export.js"></script>
<script src="js/claude-api.js"></script>

<!-- App entry point (must be last) -->
<script src="js/app.js"></script>
```

**Gotchas for `index.html`:**
- `export.js` already has a `<script>` tag (line 88) — do NOT add a second one.
- If JSZip CDN is unavailable (user offline), `export.js` will throw on `new JSZip()`. Guard with: `if (typeof JSZip === 'undefined') { Utils.showToast('ZIP library not loaded. Check your internet connection.', 'error'); return; }` at the top of `exportJSON`.

---

## Shared Patterns

### IIFE Module Wrapper
**Source:** `app/js/github-api.js` lines 4, 99–100
**Apply to:** `app/js/claude-api.js`
```javascript
const ModuleName = (() => {
  // private vars and functions
  return { publicFn1, publicFn2 };
})();
```

### Toast Notifications
**Source:** `app/js/utils.js` lines 44–55
**Apply to:** All new event handlers in `export.js`, `recipes.js`, `settings.js`
```javascript
Utils.showToast('Message here.');            // success (default)
Utils.showToast('Error message.', 'error');  // error
```
**Critical:** `Utils.toast` does NOT exist. Only `Utils.showToast`. Fix the 8 broken calls in `recipes.js` (lines 264, 266, 405, 414, 548, 549, 613, 616) as part of Phase 3.

### Sequential State.save for Multi-File Writes
**Source:** `app/js/views/settings.js` lines 289–302 (Reset all data handler)
**Apply to:** `app/js/export.js` ZIP import confirm handler
```javascript
// Sequential — each await completes before next starts.
// Parallel saves cause GitHub Contents API 409 SHA conflicts.
State.set('barkeeper', parsed.barkeeper);
await State.save('barkeeper', 'Import ZIP bundle');

State.set('profile',   parsed.profile);
await State.save('profile',   'Import ZIP bundle');

State.set('inventory', parsed.inventory);
await State.save('inventory', 'Import ZIP bundle');

State.set('recipes',   parsed.recipes);
await State.save('recipes',   'Import ZIP bundle');
```

### Save Button Disable During Async
**Source:** `app/js/views/settings.js` lines 232–234, 242–244; `app/js/views/recipes.js` lines 608–619
**Apply to:** Generate button in `renderForm`, Export button in settings, Import confirm button
```javascript
saveBtn.disabled = true;
saveBtn.textContent = 'Saving…';   // or 'Generating…' / 'Importing…'
// ... await async work ...
// on success:
saveBtn.disabled = false;
saveBtn.textContent = 'Original label';
```

### Status `<p>` Element Pattern
**Source:** `app/js/views/settings.js` lines 102, 135, 181 + their event handlers
**Apply to:** All new section save/generate feedback in `settings.js`
```javascript
// HTML: <p id="st-FOO-status" style="min-height:1.2em;margin-top:8px;font-size:0.82rem;"></p>
const statusEl = container.querySelector('#st-FOO-status');
statusEl.textContent = 'Saving…';
statusEl.style.color = 'var(--text-muted)';
// on success:
statusEl.textContent = 'Saved ✓';
statusEl.style.color = 'var(--green)';
// on error:
statusEl.textContent = `Failed: ${Utils.escapeHtml(err.message)}`;
statusEl.style.color = 'var(--red)';
```

### Settings Section HTML Block
**Source:** `app/js/views/settings.js` lines 105–136 (GitHub section)
**Apply to:** New `#sect-ai-key` section in `settings.js`
```html
<div class="settings-section" id="sect-ai-key">
  <div class="settings-section__heading">AI Integration</div>
  <div class="form-group">
    <label for="st-ai-key">Anthropic API Key</label>
    <input type="password" id="st-ai-key"
           value="${Utils.escapeHtml(localStorage.getItem('bb_anthropic_key') || '')}"
           placeholder="sk-ant-…" autocomplete="off">
  </div>
  <p style="font-size:0.82rem;color:var(--text-dim);margin-bottom:12px;">
    Stored only in this browser. Used for AI recipe generation.
  </p>
  <button class="btn btn-primary btn-sm" id="st-save-ai-key">Save API key</button>
  <p id="st-ai-key-status" style="min-height:1.2em;margin-top:8px;font-size:0.82rem;"></p>
</div>
```

### Blob Download Trigger
**Source:** `app/js/export.js` lines 10–20 (`triggerDownload` — already exists)
**Apply to:** ZIP export in updated `exportJSON`
```javascript
function triggerDownload(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```
For ZIP: `zip.generateAsync({type:'blob'})` returns a `Blob` directly — pass it to `triggerDownload` as the first argument. `mimeType` is `'application/zip'`.

### Image Upload base64 via FileReader
**Source:** `app/js/views/recipes.js` lines 379–384 (already in production)
**Apply to:** Nothing new in Phase 3 — image upload already works. Reference only if ZIP import needs binary file reads (it does not: use `entry.async('string')` for JSON text files).
```javascript
const base64 = await new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result.split(',')[1]);
  reader.onerror = reject;
  reader.readAsDataURL(selectedFile);
});
```

### `escapeHtml` on All User-Visible Strings
**Source:** `app/js/utils.js` lines 26–32
**Apply to:** Every field set from AI response in `renderForm`; every string rendered in import preview
```javascript
Utils.escapeHtml(s)  // returns safe string for innerHTML insertion
// Also acceptable: set el.textContent = s  (no escaping needed)
// NOT acceptable:  el.innerHTML = s  without escaping
```

---

## No Analog Found

All Phase 3 files have close analogs in the codebase. No novel patterns required beyond the JSZip and Anthropic API calls, which are covered by RESEARCH.md Patterns 2–5.

The only structurally new UI concept is the **drag-and-drop drop zone**. There is no existing drop zone in the codebase. The pattern is:
```javascript
// dragover MUST preventDefault — or drop never fires
zone.addEventListener('dragover', e => {
  e.preventDefault();
  zone.classList.add('dragover');
});
zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
zone.addEventListener('drop', e => {
  e.preventDefault();
  zone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (!file || !/\.zip$/i.test(file.name)) {
    Utils.showToast('Drop a .zip file.', 'error'); return;
  }
  handleFile(file);
});
```
New CSS classes needed: `.import-drop-zone` (border-dashed, border amber, padding) and `.import-drop-zone.dragover` (background tint, e.g. `rgba(212,148,58,0.06)` matching the amber palette). Add to `app/css/app.css` in the Phase 3 section.

---

## Metadata

**Analog search scope:** `app/js/`, `app/js/views/`, `app/css/app.css`, `app/index.html`
**Files read:** 7 source files (github-api.js, state.js, utils.js, index.html, settings.js, recipes.js, export.js)
**Pattern extraction date:** 2026-05-13
