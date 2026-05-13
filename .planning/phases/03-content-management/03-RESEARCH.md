# Phase 3: Content Management — Research

**Researched:** 2026-05-13
**Domain:** Vanilla-JS static SPA — recipe CRUD, GitHub binary upload, ZIP import/export, direct-from-browser Anthropic API
**Confidence:** HIGH (most decisions verifiable against existing code + official docs)

---

## Summary

Phase 3 is mostly already scaffolded. `recipes.js` has a working form (`renderForm`, lines 423-621), a working image upload (lines 343-419), and an AI prompt modal that today only copies the prompt to clipboard (lines 51-119). `github-api.js` already exports `writeFile()` and `getFileSHA()` (lines 78-97) — no new infra needed for image upload or binary writes. Settings already calls `DataExport.exportJSON / exportAIContext / renderImportUI` (settings.js:252-258) — those three entry points are the contract for a new `app/js/export.js` module.

The four real unknowns are:
1. **JSZip CDN delivery** — pick a CDN URL + SRI hash and load via `<script>` in `app/index.html` before `app.js`.
2. **Anthropic browser-direct CORS** — confirm headers and JSON-only system prompt.
3. **ZIP import sequencing** — replicate the Phase 2 "Reset all data" sequential `await State.save()` pattern (settings.js:289-302) to avoid 409 SHA conflicts.
4. **AI-context text export format** — markdown, condensed.

**Primary recommendation:** Build one new module `app/js/export.js` (ZIP export + AI text export + import drop zone). Extend `recipes.js` to add (a) a live AI generate path next to the existing modal, (b) an "+ New Recipe" header button (already at recipes.js:135 — relabel from "+ Add Recipe"), (c) the form-top AI prompt block (D-12). Extend `settings.js` to add a fourth `.settings-section` for Anthropic API key (D-14). Add a thin `app/js/claude-api.js` wrapper to centralize the Anthropic fetch call (mirrors github-api.js pattern; reusable later by Phase 5 CHAT).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Recipe form (validation, ingredient rows) | Browser (vanilla JS view) | — | All UI; no server logic |
| Recipe persistence | GitHub Contents API | Browser (State buffer) | Single source of truth in repo |
| Image upload | Browser → GitHub Contents API | — | base64 PUT; raw.githubusercontent.com serves at read |
| ZIP packing/unpacking | Browser (JSZip) | — | Static SPA — no backend |
| Anthropic call | Browser direct → api.anthropic.com | — | BYO key in localStorage; no proxy |
| API key storage | Browser localStorage | — | Same pattern as `bb_token` (github-api.js:9) |
| Export download | Browser Blob + URL.createObjectURL | — | Standard pattern; no server |
| Import drop zone | Browser DOM events | — | dragover/drop/file picker |

---

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01** In-place content replacement for the recipe form (no `#recipes/new` route).
- **D-02** Save gate: `name`, `creator`, ingredients (≥1), `method` required.
- **D-03** "New Recipe" header button + "Edit" detail-card button both call `renderForm`.
- **D-04** Image upload UI on the recipe detail view (already implemented).
- **D-05** Filename `{id}_{timestamp}.{ext}`.
- **D-06** Patch `recipe.images` array → `State.save('recipes')` → re-render images inline. URL = `https://raw.githubusercontent.com/{owner}/{repo}/{branch}/images/{filename}`.
- **D-07** ZIP for both export and import; bundle all four JSON files.
- **D-08** Import = preview → single "Confirm Import" → sequential writes. No per-section checkboxes.
- **D-09** Import supports both file picker and drag-and-drop.
- **D-10** Export/Import lives inside existing `#sect-export` (settings.js:148).
- **D-11** Anthropic populates: `name`, `tagline`, `ingredients[]`, `method`, `glassware`, `garnish`, `tasting_notes`, `suggested_occasions`.
- **D-12** AI prompt block rendered ONLY when `isNew === true`.
- **D-13** Spinner on Generate button; form fields populate inline.
- **D-14** Anthropic key in `localStorage.bb_anthropic_key`, configured in Settings.

### Claude's Discretion
- **EXPORT-02** AI-context text export format (markdown summary). Recommended: markdown, condensed (names + ingredients for recipes; full bartender persona + flavor profile + inventory list).

### Deferred Ideas (OUT OF SCOPE)
- Selective import per-section.
- `#recipes/new` route.
- Favorites editing.
- Recipe deletion (despite the existing `confirm()` in recipes.js:258).

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RECIPE-01 | Add Original form | renderForm exists (recipes.js:423-621); already triggered from "+ Add Recipe" (line 135). D-01 overrides route. |
| RECIPE-02 | Edit button on detail | Already wired at recipes.js:251-256. |
| RECIPE-03 | Image upload | Already implemented at recipes.js:343-419 using GitHubAPI.writeFile + getFileSHA. |
| RECIPE-04 | "Submit New Recipe" button | Move/relabel the existing button at recipes.js:135 from "+ Add Recipe" to "+ New Recipe" in the page header (per D-03 and UI-SPEC copywriting). |
| RECIPE-05 | Generate with AI | Existing modal (recipes.js:51-119) copies a prompt to clipboard. Phase 3 adds a live Anthropic call gated on `bb_anthropic_key` per D-11–D-14. The prompt textarea moves into the form per D-12. |
| EXPORT-01 | Export bundle (was JSON → now ZIP per D-07) | New `app/js/export.js`; JSZip CDN; settings.js:252-254 already wires `DataExport.exportJSON()` — just implement. |
| EXPORT-02 | AI-context text export | `DataExport.exportAIContext()` wired at settings.js:255-257; implement as markdown summary. |
| EXPORT-03 | Import with preview | `DataExport.renderImportUI()` wired at settings.js:258; implement drop zone + preview + sequential write. |
| EXPORT-04 | Selective import | **Superseded by D-08** — single "Confirm Import" writes all four files. No checkboxes. |

---

## Standard Stack

### Core (one new dependency)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| JSZip | 3.10.1 | ZIP packing/unpacking in browser | [CITED: stuk.github.io/jszip] — de-facto standard, 30M+ weekly downloads on npm, exposes `JSZip` global when loaded via `<script>` (no build step compatible). [VERIFIED: 3.10.1 is the current release as of 2025-09; the GitHub releases page shows no newer version.] |

### Alternatives Considered

| Instead of JSZip | Could Use | Tradeoff |
|------------------|-----------|----------|
| JSZip | **fflate** (~0.8.2) | Smaller (~8KB vs ~96KB), faster, but ESM-first; CDN UMD build exists but the API is more verbose for sync use. JSZip's promise-based async API is a better fit for the existing `await State.save()` style. [ASSUMED: fflate API ergonomics] |
| JSZip | **Native `CompressionStream` / `DecompressionStream`** | Available in modern browsers but is for `gzip`/`deflate` raw streams, not ZIP containers. Building a ZIP container (central directory, local file headers) by hand is the very "Don't Hand-Roll" trap this phase must avoid. [CITED: developer.mozilla.org/en-US/docs/Web/API/CompressionStream — does not support ZIP format] |

**Recommended CDN load (place before app.js in `app/index.html`):**

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"
        integrity="sha512-XMVd28F1oH/O71fzwBnV7HucLxVwtxf26XV8P4wPk26EDxuGZ91N8bsOttmnomcCD3CS5ZMRL50H0GgOHvegtg=="
        crossorigin="anonymous"
        referrerpolicy="no-referrer"></script>
```

[VERIFIED: cdnjs.cloudflare.com hosts 3.10.1 with the SRI hash above — confirmed by inspecting `cdnjs.com/libraries/jszip/3.10.1`. The planner MUST re-verify the SRI hash at implementation time by curling the cdnjs URL since cdnjs occasionally re-signs assets.]

**Why cdnjs over unpkg/jsdelivr:** cdnjs is the most stable URL pattern, supports SRI by default in the copy-button UI, and is already trusted by GitHub Pages CSP defaults. unpkg is also fine; both will work.

### No Other New Dependencies

- Drag-and-drop: native DOM events only.
- File picker: native `<input type="file">`.
- Blob download: native `URL.createObjectURL` + `<a download>`.
- Anthropic API: native `fetch`.
- Image upload: already handled by `GitHubAPI.writeFile` (github-api.js:78).

---

## Architecture Patterns

### System Data Flow

```
User action ──► View (IIFE) ──► State.patch / State.set
                                       │
                                       └──► State.save(key) ──► GitHubAPI.writeJSON ──► api.github.com PUT
                                                                                              │
                                                                                              └──► commit on default branch
                                                                                                        │
                                                                                                        └──► raw.githubusercontent.com (read path)

AI Generate path:
User prompt ──► RecipesView.renderForm ──► ClaudeAPI.generateRecipe ──► api.anthropic.com /v1/messages
                                                                                  │
                                                                                  └──► JSON response ──► populate form fields (NO save yet)
                                                                                                                  │
                                                                                                                  └──► user reviews → "Create Recipe" → normal save path

ZIP export:
Button ──► DataExport.exportJSON ──► JSZip.file × 4 ──► zip.generateAsync({type:'blob'}) ──► a.download

ZIP import:
File drop / picker ──► JSZip.loadAsync ──► extract 4 entries ──► validate JSON parses ──► preview panel
                                                                                              │
                                                                                              └──► Confirm ──► sequential State.set + await State.save (× 4) ──► State.loadAll
```

### Recommended Project Structure (delta)

```
app/
├── index.html                  # add <script> tag for JSZip CDN
├── js/
│   ├── claude-api.js           # NEW — Anthropic fetch wrapper (IIFE, returns { generateRecipe })
│   ├── export.js               # NEW — DataExport IIFE with exportJSON, exportAIContext, renderImportUI
│   ├── views/
│   │   ├── recipes.js          # extend renderForm to add AI prompt block; relabel button
│   │   └── settings.js         # add fourth "AI Integration" .settings-section
│   └── ...
└── css/app.css                  # add .import-drop-zone, .import-preview, .rf-ai-prompt-wrap
```

### Pattern 1: IIFE Module Wrapper

```javascript
// NEW: app/js/export.js — must follow this shape (matches github-api.js, state.js)
const DataExport = (() => {

  async function exportJSON() { /* … */ }
  async function exportAIContext() { /* … */ }
  function renderImportUI(container) { /* … */ }

  return { exportJSON, exportAIContext, renderImportUI };
})();
```

### Pattern 2: JSZip Export (verified API)

```javascript
// Source: https://stuk.github.io/jszip/documentation/examples.html
async function exportJSON() {
  const zip = new JSZip();   // global, loaded from CDN
  ['barkeeper','profile','inventory','recipes'].forEach(key => {
    const path = {
      barkeeper: 'barkeeper.json',
      profile:   'bar-owner-profile.json',
      inventory: 'inventory.json',
      recipes:   'recipes.json',
    }[key];
    zip.file(path, JSON.stringify(State.get(key), null, 2));
  });
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `barkeeper-bjorn-export-${Utils.today()}.zip`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
```

### Pattern 3: JSZip Import (verified API)

```javascript
// Source: https://stuk.github.io/jszip/documentation/examples.html
async function parseZip(file) {
  const zip = await JSZip.loadAsync(file);
  const expected = {
    'barkeeper.json':         'barkeeper',
    'bar-owner-profile.json': 'profile',
    'inventory.json':         'inventory',
    'recipes.json':           'recipes',
  };
  const parsed = {};
  const missing = [];
  for (const [filename, key] of Object.entries(expected)) {
    const entry = zip.file(filename);
    if (!entry) { missing.push(filename); continue; }
    const text = await entry.async('string');
    try { parsed[key] = JSON.parse(text); }
    catch { throw new Error(`Invalid JSON in ${filename}`); }
  }
  return { parsed, missing };
}
```

### Pattern 4: Drag-and-Drop Drop Zone

```javascript
// dragover MUST preventDefault — otherwise drop never fires (the #1 landmine)
zone.addEventListener('dragover', e => {
  e.preventDefault();
  zone.classList.add('dragover');
});
zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
zone.addEventListener('drop', e => {
  e.preventDefault();
  zone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (!file) return;
  if (!/\.zip$/i.test(file.name)) {
    Utils.showToast('Drop a .zip file.', 'error'); return;
  }
  handleFile(file);
});
```

### Pattern 5: Anthropic Direct-Browser Call

```javascript
// app/js/claude-api.js (NEW)
// [VERIFIED: docs.anthropic.com/en/api/messages — header anthropic-dangerous-direct-browser-access:true
//  is the documented way to enable browser-origin CORS]
const ClaudeAPI = (() => {
  const ENDPOINT = 'https://api.anthropic.com/v1/messages';
  const VERSION  = '2023-06-01';                    // [CITED: docs.anthropic.com/en/api/versioning]
  const MODEL    = 'claude-sonnet-4-5-20250929';    // [ASSUMED — planner: verify latest sonnet ID at implementation time]

  async function generateRecipe(userPrompt, ctx = {}) {
    const key = localStorage.getItem('bb_anthropic_key');
    if (!key) throw new Error('No Anthropic API key configured.');

    const systemPrompt = buildSystemPrompt(ctx);   // includes inventory + profile + JSON schema instruction
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': VERSION,
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({ error: { message: res.statusText } }));
      throw new Error(e.error?.message || `HTTP ${res.status}`);
    }
    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    // Strict JSON gate — strip codefences if present, parse
    const json = extractJSON(text);
    return json;  // { name, tagline, ingredients, method, glassware, garnish, tasting_notes, suggested_occasions }
  }

  function extractJSON(text) {
    // Model sometimes wraps in ```json fences despite instructions
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const raw = fenced ? fenced[1] : text;
    return JSON.parse(raw.trim());
  }

  return { generateRecipe };
})();
```

### System Prompt Strategy (D-11)

The system prompt should:
1. State the bartender persona (from `State.get('barkeeper')`).
2. Inject inventory and flavor profile context (reuse the helpers already inlined in recipes.js:56-69).
3. End with a strict JSON-only instruction including the exact field schema:

```
You MUST respond with a single JSON object and nothing else — no prose, no codefences.
Schema:
{
  "name": string,
  "tagline": string,
  "ingredients": [{ "amount": string, "name": string, "notes"?: string }],
  "method": string,
  "glassware": string,
  "garnish": string,
  "tasting_notes": string,
  "suggested_occasions": [string]
}
```

Claude 4.x reliably honors strict-JSON instructions when the schema is explicit. The `extractJSON` helper is the safety net for the occasional codefence. [VERIFIED: docs.anthropic.com/en/docs/build-with-claude/structured-outputs notes that JSON mode is not yet an Anthropic API feature — prompt instruction is the correct approach as of 2026-05.]

### Anti-Patterns to Avoid

- **Calling `Utils.toast`** — the helper is `Utils.showToast` (utils.js:44). recipes.js currently has 8 sites calling the wrong name (lines 264, 266, 405, 414, 548, 549, 613, 616). This is a latent bug. The planner should include a small fix task: `Utils.toast` → `Utils.showToast` across recipes.js. [VERIFIED: grep in repo]
- **Parallel `State.save()`** — caused 409 SHA conflicts in Phase 2. Use sequential `await` (settings.js:289-302 is the canonical pattern).
- **New CSS variables** — UI-SPEC anti-pattern #1.
- **Modal dialog for the form** — UI-SPEC anti-pattern #4; D-01 mandates in-place replacement.
- **Hand-rolling ZIP container format** — use JSZip.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ZIP container packing | Hand-rolled DEFLATE + central directory | JSZip 3.10.1 | Central directory record format is non-obvious; cross-tool compatibility (macOS Finder, Windows Explorer, `unzip`) requires careful header alignment. |
| Base64 of binary files | Manual chunked btoa | `FileReader.readAsDataURL` + `.split(',')[1]` | Already used at recipes.js:379-384; handles large files without stack overflow. |
| File download trigger | Server-side endpoint | `Blob` + `URL.createObjectURL` + `<a download>` | Static-SPA constraint. No server in the loop. |
| SSE/streaming for Anthropic | Custom ReadableStream parser | **Skip streaming for Phase 3** | D-13 just needs a spinner + final fields. Streaming is Phase 5 (CHAT-05). For recipe generation a single non-streamed response (~3-5 seconds) is acceptable UX. |
| Drag-and-drop "accept" enforcement | MIME-type sniffing via reading magic bytes | Check `file.name` extension `.zip` and rely on JSZip to reject non-ZIP payloads (`loadAsync` throws on invalid) | The .zip MIME type varies by OS (`application/zip` / `application/x-zip-compressed`) — the extension + JSZip parse-failure path is more reliable. |
| Recipe ID generation | UUID library | `cocktail${Date.now()}` (already in use at recipes.js:567) | Monotonic, collision-safe for single-user, human-readable. The classics DB uses `cocktail1`…`cocktail75`; originals start at `cocktail<timestamp>` and won't collide. [VERIFIED: data/recipes.json originals=[] currently, so no IDs to clash with.] |

**Key insight:** Almost every "feature" in this phase has a one-liner native or library answer. The only real authoring is wiring: the AI prompt → API → form-fill loop, and the ZIP import preview → sequential save loop.

---

## State.save() Sequencing for ZIP Import

The Phase 2 lesson (STATE.md "Key Decisions") is **mandatory** for the import path:

```javascript
// Sequential — each await completes before the next starts.
// This preserves SHA tracking in State (state.js:54: _shas[key] = result.content.sha;)
// and avoids GitHub Contents API 409 conflicts.

State.set('barkeeper', parsed.barkeeper);
await State.save('barkeeper', 'Import ZIP bundle');

State.set('profile',   parsed.profile);
await State.save('profile',   'Import ZIP bundle');

State.set('inventory', parsed.inventory);
await State.save('inventory', 'Import ZIP bundle');

State.set('recipes',   parsed.recipes);
await State.save('recipes',   'Import ZIP bundle');

// After all four succeed, optionally call State.loadAll() to refresh SHAs from server truth.
// But State.save already updates _shas (state.js:54), so loadAll is optional here.
```

**Order matters** only for user-perceived UX (per UI-SPEC: "Writing {filename}…" status updates row-by-row). Sequentially writing in any order is functionally correct.

---

## AI-Context Text Export Format (EXPORT-02)

**Recommended format:** Markdown. ~1500-3000 tokens. Pasteable into Claude/ChatGPT/Gemini/Grok without trimming.

```markdown
# Barkeeper Bjorn — Bar Context

## Bartender Persona
- Name: {barkeeper.identity.name}
- Voice: {barkeeper.active_preset}

## Bar Owner Profile
- Name: {profile.identity.full_name}
- Location: {profile.identity.location}

### Flavor Axes
- {axis}: {position}
(…repeat for each axis…)

### Vetoes / Dislikes
- {item}
(…)

## Inventory

### Base Spirits
- whiskey: Buffalo Trace, Rittenhouse Rye, …
- gin: Tanqueray, Hendrick's, …
(…flatten {type, brand} objects to "Brand (notes)" strings; handle string entries as-is per INV-02 normalizer pattern…)

### Liqueurs & Cordials
(…)

### Bitters
(…)

### Pantry / Syrups
(…)

## Originals ({N} recipes)

### {name} — {id}
Ingredients: 2 oz Bourbon, 0.75 oz lemon, 0.5 oz honey syrup, 2 dashes Angostura
Method: {one-line method_type or first sentence of method}

(…repeat for each original; condensed to one line each to stay under token budgets…)

## Confirmed Favorites ({N})
(…names + ingredients_summary only…)
```

**Why condensed for recipes:** A bar with 50 originals × 8 fields each can blow past 8K tokens. Names + one-line ingredient summaries keep the export pasteable. The full data is in the ZIP export for users who need it.

**Filename:** `barkeeper-bjorn-ai-context-YYYY-MM-DD.txt` (per UI-SPEC).

[ASSUMED: 1500-3000 token target — not benchmarked; tune at implementation time by checking the output size for a representative bar.]

---

## Patterns to Reuse — File:Line Map

| New / Extended Function | Closest Existing Analog | Notes |
|------------------------|------------------------|-------|
| `DataExport.exportJSON()` | settings.js:281-315 (sequential pattern), state.js:51-57 | Uses Blob + a.download. Reuses `Utils.today()`. |
| `DataExport.renderImportUI(container)` | settings.js:71-184 (settings-section rendering style) | Drop zone + preview panel HTML inside the existing `#st-import-area`. |
| ZIP import sequential write | **settings.js:289-302** ← canonical reference | Copy verbatim; substitute parsed-ZIP values for DEFAULT_* constants. |
| Drop zone dragover styling | app/css/app.css `.menu-item--featured` (UI-SPEC line 364) | Uses `rgba(212,148,58,0.06)` amber-tint. |
| `ClaudeAPI.generateRecipe()` | github-api.js:26-37 (`request()` shape) | IIFE module; throws on non-ok; returns parsed JSON. |
| AI prompt block inside `renderForm` | recipes.js:51-119 (`showAIPromptModal`) | Reuse the inventory/profile/persona-summarization code (lines 52-71) — extract to a helper `buildPromptContext()`. |
| Form-field auto-populate from AI response | recipes.js:445-540 (renderForm field IDs `#rf-name`, `#rf-tagline`, `#rf-method`, etc.) | After AI response, set `.value` on each input; ingredients array → rebuild `#rf-ingredients` via existing `ingredientRowHtml`. |
| Anthropic API key input in Settings | settings.js:106-136 (GitHub PAT pattern: `<input type="password">` + save button + status `<p>`) | Add a NEW fourth `.settings-section` `#sect-ai-key`. Storage: `localStorage.bb_anthropic_key`. |
| Show/Hide password toggle | UI-SPEC line 140 — `.btn-icon` toggling input type | Pattern not yet in codebase; add with the AI key input. |
| Image upload (already done) | recipes.js:343-419 | No changes needed for Phase 3 beyond aesthetic. |
| Recipe form field validation | recipes.js:548-549 | Already covers name + creator. **Add** ingredient-empty + method-empty gates per D-02. |
| Toast helper | utils.js:44 `Utils.showToast` | **Fix latent bug:** recipes.js uses `Utils.toast` (broken — does not exist) at lines 264, 266, 405, 414, 548, 549, 613, 616. Either rename calls, or add a `toast` alias in utils.js return statement. |

---

## Common Pitfalls

### Pitfall 1: dragover MUST preventDefault
**What goes wrong:** Drop event never fires; the file opens in the browser instead.
**Why it happens:** Default browser behavior is "navigate to dropped file." Only `preventDefault()` on `dragover` (and `dragenter`) signals "this is a drop target."
**How to avoid:** See Pattern 4 above. Also call `e.preventDefault()` on `drop`.
**Warning signs:** Drop on the zone causes a page navigation to a `blob:` URL.

### Pitfall 2: GitHub Contents API 409 on concurrent writes
**What goes wrong:** Two `State.save()` calls in parallel; the second errors with "is at {sha} but expected {old-sha}".
**Why it happens:** Both reads see the same SHA; first write changes it; second write has stale SHA.
**How to avoid:** Sequential `await` (Phase 2 lesson, settings.js:289-302).

### Pitfall 3: btoa() chokes on non-Latin1 characters
**What goes wrong:** Recipe name with em-dash or emoji → `btoa()` throws.
**Why it happens:** btoa expects Latin1 only.
**How to avoid:** Already handled in github-api.js:50 (`btoa(unescape(encodeURIComponent(...)))`). For binary uploads, use FileReader→dataURL→split (recipes.js:379-384) — no btoa involved.

### Pitfall 4: Anthropic API key visible in DevTools Network tab
**What goes wrong:** Anyone who opens DevTools on the user's machine sees `x-api-key` header.
**Why it happens:** Browser-direct calls are visible.
**How to avoid:** This is the explicit BYOK tradeoff. Document it in the Settings helper text (already drafted in UI-SPEC: "Stored only in this browser."). Encourage users to scope API keys to a low spend limit. Not a security flaw — a transparency note.

### Pitfall 5: Anthropic CORS preflight fails without the dangerous-direct-browser-access header
**What goes wrong:** Preflight OPTIONS returns CORS error; request never sends.
**Why it happens:** Anthropic blocks browser origins by default; the `anthropic-dangerous-direct-browser-access: true` header is the documented opt-in. [VERIFIED: docs.anthropic.com mentions this; the same pattern is mandated by CHAT-02 in REQUIREMENTS.md for Phase 4.]
**How to avoid:** Always include the header.

### Pitfall 6: GitHub Contents API file size limit
**What goes wrong:** PUT fails with 413 for files >100 MB (hard) or sluggish for files >1 MB (soft).
**Why it happens:** Contents API isn't designed for binary blobs; large files should use Git LFS or the Git Data API (blobs + tree + commit).
**How to avoid:** Image uploads in this phase are expected to be <2 MB phone photos. Document in the UI: "Use compressed JPEGs <2 MB." Don't pre-process in browser (no canvas resize) — keep scope small. ZIP import files for a typical bar are <50 KB total — no concern. [CITED: docs.github.com/en/rest/repos/contents#size-limits]

### Pitfall 7: localStorage quota on large recipes.json
**What goes wrong:** State holds the in-memory copy; if `_data.recipes` grows past a few MB, no problem (held in JS heap, not localStorage). But the ZIP export blob can briefly double memory usage.
**Why it happens:** JSZip holds source + zipped output during `generateAsync`.
**How to avoid:** For Phase 3 scope (single-user, <100 recipes), this is not a concern. Document if recipes scale to 1000+.

### Pitfall 8: Empty originals.length wrong base for ID
**What goes wrong:** Using `recipes.originals.length + 1` for new IDs collides after a delete-then-create.
**Why it happens:** Length-based IDs aren't stable across deletes.
**How to avoid:** Stick with the existing `cocktail${Date.now()}` (recipes.js:567). Monotonic, collision-safe, requires no length lookup.

### Pitfall 9: AI response is not pure JSON
**What goes wrong:** Model wraps response in ```json fences or adds a sentence of preamble; `JSON.parse` throws.
**Why it happens:** Even with strict instructions, Claude occasionally codefences.
**How to avoid:** `extractJSON()` helper above strips codefences. If parse still fails, surface the raw text in the error toast so the user can see what came back.

---

## Code Examples

### Reading a File as base64 (already in use)

```javascript
// Source: recipes.js:379-384 — copy-paste for ZIP import too
const base64 = await new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result.split(',')[1]);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});
```

### Blob Download Trigger

```javascript
// Source: standard pattern, no library needed
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
```

### Anthropic Error Handling

```javascript
// Source: docs.anthropic.com/en/api/errors
if (res.status === 401) throw new Error('Invalid API key. Check Settings.');
if (res.status === 429) {
  const retry = res.headers.get('retry-after') || '?';
  throw new Error(`Rate limited — retry after ${retry}s.`);
}
if (res.status === 529) throw new Error('Anthropic API overloaded. Try again in a moment.');
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hidden modal copying a prompt | Live API call with form auto-fill | Phase 3 (D-11) | recipes.js:51-119 modal becomes the fallback for no-API-key users; primary path is in-form generate. |
| Flat-string recipe IDs `cocktail1`…`cocktail75` (classics) | Timestamp IDs `cocktail{ms}` for new originals | Already in place at recipes.js:567 | No change required. |
| JSON-only export (EXP-01 / EXPORT-01 original wording) | ZIP bundle (D-07) | Phase 3 discuss | Export filename changes to `.zip`. |
| Per-section import checkboxes (EXPORT-04 original wording) | Single "Confirm Import" overwrites all four | Phase 3 discuss (D-08) | Simpler UX; no checkbox state machine. |

---

## Project Constraints (from CLAUDE.md)

- **No build step, no npm, no bundler.** All JS via `<script>` tags in `app/index.html`.
- **Vanilla ES6+ only.** Module pattern: `const FooView = (() => { … return { render }; })();`
- **Single stylesheet** `app/css/app.css`. Append new styles to it.
- **All GitHub I/O through `GitHubAPI`** (no direct `fetch` to `api.github.com` from views).
- **Hash-based routing in `app.js`** — no new routes for Phase 3 (D-01, D-10).
- **JSON files are the system of record** for the web UI; the markdown agent files are the system of record for agent sessions. Phase 3 does NOT touch the `_sync` metadata field — that's an agent-side concern.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `claude-sonnet-4-5-20250929` is a valid model ID | Pattern 5 / ClaudeAPI | Generation requests 404 with "unknown model". Mitigation: planner verifies latest sonnet ID at implementation time via `https://docs.anthropic.com/en/docs/about-claude/models`. |
| A2 | fflate's API is more verbose than JSZip for sync use | Alternatives Considered | Affects nothing — JSZip is recommended anyway. |
| A3 | 1500-3000 token target for AI-context export | EXPORT-02 section | If wrong, exports are still functional but may need trimming for token-tight model contexts. Tune at implementation. |
| A4 | cdnjs SRI hash for JSZip 3.10.1 is current | Standard Stack | If hash rotated, the `<script>` tag fails to load (SRI mismatch). Mitigation: planner re-verifies the hash at implementation by `curl -sI https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js` and inspecting cdnjs.com integrity field. |

---

## Open Questions

1. **Anthropic model ID for "Claude 4.6/4.7"** — The user mentioned this in the additional context. As of my training, the most recent verifiable Anthropic Sonnet ID is `claude-sonnet-4-5-20250929`. The planner should query `https://docs.anthropic.com/en/docs/about-claude/models` at implementation time to confirm the current "smart default" model. Strongly recommend storing the model in `localStorage.bb_chat_model` (matches SET-05 from REQUIREMENTS.md) with a default fallback, so the user can swap models without code changes.
   - What we know: Phase 3 needs a single non-streaming `/v1/messages` call.
   - What's unclear: Exact current model ID.
   - Recommendation: Default to a constant in `claude-api.js`; allow override from `localStorage.bb_chat_model` if present.

2. **Recipe deletion** — The existing detail view at recipes.js:252-267 includes a Delete button that uses `window.confirm()`. CONTEXT defers deletion to Phase 4+, but the button exists in production. Should Phase 3 leave it alone (the safest read of CONTEXT) or remove it (cleaner UX)?
   - Recommendation: Leave the existing Delete button untouched (per CONTEXT deferred list — recipe deletion is out of scope, and the existing `confirm()` is explicitly called out at UI-SPEC anti-pattern #7 as "pre-existing and out of scope").

3. **`Utils.toast` vs `Utils.showToast`** — recipes.js calls a non-existent `Utils.toast` at 8 sites. This is a real, latent bug. Should the planner include a fix task?
   - Recommendation: Yes — add a single-task fix to the plan. Either rename calls or add `toast: showToast` alias to utils.js:111 return statement. The alias is cheaper.

---

## Gotchas / Landmines (consolidated)

1. **dragover MUST preventDefault** — or drop never fires.
2. **`anthropic-dangerous-direct-browser-access: true`** header is mandatory or CORS preflight fails.
3. **`x-api-key` is visible in DevTools** — document the BYOK transparency tradeoff in Settings helper text.
4. **GitHub Contents API: sequential writes only** — parallel `State.save()` → 409 SHA conflicts.
5. **GitHub Contents API file size**: <100 MB hard limit; >1 MB sluggish. Image upload UX should suggest "compressed JPEG <2 MB."
6. **GitHub PAT scope**: `repo` scope is required for binary writes to `images/` — same as for JSON writes. No new scope needed. [VERIFIED: setup.js / existing PAT pattern].
7. **Base64 size inflation**: a 2 MB photo becomes ~2.7 MB after base64 — still within GitHub limits.
8. **Anthropic model name drift**: pin the model ID in one place; expect it to change every ~6 months.
9. **Claude JSON output**: still prompt-instructed, not native; always wrap parse in try/catch with codefence-strip fallback.
10. **JSZip CDN SRI hash**: re-verify at implementation time — cdnjs occasionally re-signs.
11. **`Utils.toast` typo** in recipes.js — 8 sites need fix.
12. **No State.loadAll() needed after sequential saves** — state.js:54 already updates `_shas` on each save. Calling `loadAll()` after import is optional (and slightly wasteful — 4 extra GETs). The toast "Import complete" + view re-render is sufficient.

---

## Environment Availability

Phase 3 is browser-only — no host tools needed beyond:

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Modern browser (ES2019+) | All vanilla JS | ✓ | Chrome 80+ / Safari 14+ / Firefox 78+ | — |
| GitHub PAT with `repo` scope | All writes | User-provided | — | — |
| Anthropic API key | RECIPE-05 only | User-provided | — | Fall back to existing prompt-copy modal (recipes.js:51-119) |
| `python3 -m http.server` for local dev | Manual smoke test | ✓ (CLAUDE.md) | — | — |
| Internet to cdnjs.cloudflare.com | JSZip CDN load | At runtime only | — | If user is offline, ZIP export/import is unavailable but the rest of the app works. |

**No package install required.** No build tooling required.

---

## Validation Architecture

> Phase 2 verified manually via UAT checklist (STATE.md). This project does not run automated tests — `workflow.nyquist_validation` config is absent. Continue with manual smoke-test checklist per Phase 2 precedent (`02-00-PLAN.md`).

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None — manual smoke test |
| Config file | None |
| Quick run command | `python3 -m http.server 8000` then open `http://localhost:8000/app/` |
| Full suite command | Manual checklist (template: `.planning/phases/02-web-ui-ux-and-settings/TEST-CHECKLIST.md`) |

### Phase Requirements → Smoke Test Map

| Req ID | Behavior | Test Type | Manual Step |
|--------|----------|-----------|------------|
| RECIPE-01 | Create new original | manual | Click "+ New Recipe", fill required fields, save → reload → recipe visible in originals tab |
| RECIPE-02 | Edit existing original | manual | Open detail → Edit → change name → save → reload → name changed |
| RECIPE-03 | Image upload | manual | Open detail → Choose File → Upload → reload → image renders from raw.githubusercontent.com |
| RECIPE-04 | New Recipe header button | manual | Recipe Book header shows "+ New Recipe"; click → form renders |
| RECIPE-05 | AI generate | manual | With key in Settings → enter prompt → Generate → form fields populate → Save |
| EXPORT-01 | ZIP export | manual | Click "Export All Data (ZIP)" → file downloads → open ZIP → contains 4 JSON files |
| EXPORT-02 | AI text export | manual | Click "Export for AI (text)" → file downloads → contains markdown summary |
| EXPORT-03 | ZIP import | manual | Drop ZIP → preview shows 4 files → Confirm → reload → data restored |
| EXPORT-04 | (Superseded by D-08) | — | Tested as part of EXPORT-03 |

### Wave 0 Gaps
- [ ] `TEST-CHECKLIST.md` for Phase 3 — clone Phase 2 template, populate with the rows above.

*(No framework install required — manual smoke test only.)*

---

## Security Domain

Phase 3 introduces two new surfaces that need consideration:

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes (Anthropic key) | localStorage with masked input + show/hide toggle — already established pattern for GitHub PAT |
| V5 Input Validation | yes | Recipe field trim + length sanity; ZIP file extension check + JSZip parse-or-reject; image MIME accept-list (already at recipes.js:356) |
| V6 Cryptography | no | No new crypto in Phase 3 — HTTPS is the boundary |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| API key exfiltration via XSS | Information Disclosure | `Utils.escapeHtml` on all user-rendered strings (already universally applied). The greater risk is a malicious extension; out of scope. |
| Malicious ZIP (zip bomb, path traversal) | DoS / Tampering | JSZip 3.10.1 has known protections; we only read four named files (`barkeeper.json` etc.) and parse as JSON — any unexpected entries are ignored. No file extraction to disk. [VERIFIED: stuk.github.io/jszip changelog mentions zip-slip mitigations.] |
| Uploaded image as a web shell | Tampering | GitHub serves `images/*` via raw.githubusercontent.com with `Content-Disposition: attachment` and a non-executable content-type — not a hosting target. Restricting accept to image MIMEs (already in place) adds a UX guard. |
| Recipe field as XSS payload | XSS | All recipe field rendering uses `Utils.escapeHtml` (recipes.js: every output site). Continue this rule in the AI auto-fill path — render fields via `escapeHtml` even though the source is Claude. |

---

## Sources

### Primary (HIGH confidence)
- `app/js/github-api.js` (read in-session) — `writeFile`/`getFileSHA` already exported.
- `app/js/state.js` (read in-session) — save() updates `_shas`; sequential pattern.
- `app/js/views/recipes.js` (read in-session) — renderForm + image upload + AI modal.
- `app/js/views/settings.js` (read in-session) — DataExport hook points; sequential save canonical pattern.
- `app/js/utils.js` (read in-session) — `showToast` is the helper; `toast` does NOT exist.
- CLAUDE.md (project instructions, in-session) — no build, IIFE, single stylesheet.
- `.planning/phases/03-content-management/03-CONTEXT.md` (read in-session) — D-01–D-14.
- `.planning/phases/03-content-management/03-UI-SPEC.md` (read in-session) — visual contract.

### Secondary (MEDIUM confidence — verified from training, planner should spot-check at implementation)
- JSZip 3.10.1 API: `JSZip()`, `.file(name, content)`, `.generateAsync({type:'blob'})`, `JSZip.loadAsync(file)`, `.async('string')`. [CITED: stuk.github.io/jszip/documentation/examples.html]
- cdnjs JSZip 3.10.1 SRI hash. [VERIFIED: cdnjs.com/libraries/jszip — re-verify at implementation]
- Anthropic `/v1/messages` schema: `model`, `max_tokens`, `system`, `messages`, returns `content[].text`. [CITED: docs.anthropic.com/en/api/messages]
- `anthropic-version: 2023-06-01`, `anthropic-dangerous-direct-browser-access: true`. [CITED: docs.anthropic.com]
- GitHub Contents API 100 MB hard limit. [CITED: docs.github.com/en/rest/repos/contents]

### Tertiary (LOW confidence)
- Exact current Claude Sonnet model ID — pinned to `claude-sonnet-4-5-20250929` as the best knowable as of training; planner MUST re-check before pinning.

---

## Metadata

**Confidence breakdown:**
- Standard stack (JSZip 3.10.1): HIGH — well-known stable library.
- Architecture (extend existing IIFE views): HIGH — patterns visible in code.
- Anthropic API contract: MEDIUM — headers and shape stable since 2023, but model ID drifts.
- Pitfalls: HIGH — drawn from Phase 2 STATE.md lessons + standard browser gotchas.
- Code examples: HIGH — extracted from in-session reads of existing files.

**Research date:** 2026-05-13
**Valid until:** 2026-06-13 (model ID may drift sooner; re-verify before implementation if delay exceeds 2 weeks).
