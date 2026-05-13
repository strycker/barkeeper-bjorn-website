# Phase 3: Content Management — Context

**Gathered:** 2026-05-13
**Status:** Ready for planning
**Source:** /gsd:discuss-phase (03-DISCUSS-CHECKPOINT.json)

<domain>
## Phase Boundary

Phase 3 closes the read-only gap in the web UI. Users will be able to:
- Add and edit original cocktail recipes entirely in-browser
- Upload cocktail photos to GitHub via the Contents API
- Export all four data files as a ZIP bundle
- Import a ZIP bundle back (with preview before writing)
- Generate a recipe with AI from a freeform text prompt

What this phase does NOT include:
- Favorites management (read-only, no edit)
- Backend/auth changes — all storage stays in GitHub JSON via the existing Contents API
- Any new URL routes (all navigation is hash-based in-place replacement)

</domain>

<decisions>
## Implementation Decisions

### Recipe Form Integration

- **D-01** — Form appears via in-place content replacement. `renderForm(r, container)` replaces the view content. Back button returns to the recipe detail (when editing) or the recipe grid (when creating new). No new route added.
  > *Overrides RECIPE-01 (`#recipes/new` route) in ROADMAP.md — in-place replacement is the decided approach.*

- **D-02** — Save gate: `name`, `creator`, `ingredients`, and `method` are required. All other fields (tagline, glassware, garnish, profile, ratings, confirmed_built, suggested_occasions, tasting_notes) are optional and shown but not validated.

- **D-03** — Entry points: a "New Recipe" button in the Recipe Book page header triggers the blank form. An "Edit" button on the recipe detail card calls `renderForm(r)` pre-filled for editing.
  > *Covers RECIPE-02 and RECIPE-04.*

### Image Upload Placement

- **D-04** — Image upload UI lives on the recipe detail view, below the existing images section. It is not part of the edit form — no edit mode required to add an image.
  > *Covers RECIPE-03.*

- **D-05** — Filename pattern for uploaded images: `{id}_{timestamp}.{ext}` (e.g. `cocktail1234_1747000000000.jpg`). Uses recipe ID + Unix timestamp; no slugification needed.

- **D-06** — Post-upload behavior: patch `recipe.images` array in State, call `State.save('recipes')`, then re-render the images section inline to show the new photo immediately. URL uses the raw GitHub URL pattern (`https://raw.githubusercontent.com/{owner}/{repo}/{branch}/images/{filename}`).

### Export / Import UX

- **D-07** — Export and import both use ZIP format. All four data files (`barkeeper.json`, `bar-owner-profile.json`, `inventory.json`, `recipes.json`) are bundled. Format symmetry is required: export produces a ZIP, import reads a ZIP.
  > *Overrides EXPORT-01 (JSON bundle) in ROADMAP.md — ZIP is the decided format. Covers EXPORT-01 and EXPORT-03.*

- **D-08** — Import flow: select/drop a ZIP → show preview listing the four files and what will be overwritten → single "Confirm Import" click → write all four files to GitHub sequentially (to avoid SHA conflicts). No selective import per-section.
  > *Overrides EXPORT-04 (per-section checkboxes) in ROADMAP.md — preview + single confirm is the decided UX.*

- **D-09** — Export is triggered by a button click. Import supports both a file picker (`<input type="file">`) and drag-and-drop onto a drop zone in the Settings section.

- **D-10** — Export/Import UI lives as a new section in the existing Settings page. No new route, no new nav item.
  > *Covers EXPORT-03.*

### Generate with AI Behavior

- **D-11** — Input: a freeform text prompt (e.g. "smoky mezcal sour with honey and citrus"). The Anthropic API populates: `name`, `tagline`, `ingredients` (array), `method`, `glassware`, `garnish`, `tasting_notes`, and `suggested_occasions`.

- **D-12** — Generate UI lives inside the recipe form. A prompt text field appears at the top of `renderForm()` when `isNew === true`. Not available on the edit form (the recipe already exists).

- **D-13** — Generation UX: spinner on the Generate button while the API call is in-flight; form fields populate inline when the response arrives; user reviews, edits any field, then saves.

- **D-14** — Anthropic API key source: `localStorage` key `bb_anthropic_key`, configured in the Settings page alongside the GitHub PAT. If the key is absent, the Generate button is hidden (or shown as disabled with a tooltip: "Add your Anthropic API key in Settings to use AI generation").
  > *Partially covers RECIPE-05.*

### EXPORT-02 (AI-Context Text Export) — Claude's Discretion

ROADMAP requirement EXPORT-02 ("AI-context text export — markdown/text summary for pasting into any AI session") was not covered in discuss-phase. The planner should implement this as a secondary "Export for AI" button in the Export section of Settings: a plain-text/markdown download of the four data files summarized in a format suitable for pasting into a Claude/ChatGPT session. No user input required beyond the button click.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### App Architecture
- `app/js/github-api.js` — GitHub Contents API client; `readJSON()` / `writeJSON()` are the only read/write paths. Base64 encoding, SHA tracking, and auth token are all here.
- `app/js/state.js` — Central data store. `State.patch()`, `State.set()`, `State.save(key)` for commits. `State.subscribe()` for re-renders. `_data` and `_shas` hold the four JSON files in memory.
- `app/js/app.js` — Hash router. Add no new routes (D-01). Views render into `#app-content`.
- `app/js/views/recipes.js` — The view this phase extends most heavily. Study before planning.
- `app/js/views/settings.js` — The view that gains Export/Import (D-10) and API key config (D-14).
- `app/css/app.css` — Single stylesheet with CSS custom properties. All new styles go here.

### Schemas
- `schema/recipes.json` — Canonical recipe object shape. Fields used by D-02 (required gate) and D-11 (AI fill targets).
- `schema/inventory.json` — Referenced for export bundling.

### State of Record
- `.planning/STATE.md` — Phase status, key decisions from prior phases, wave structure.
- `.planning/ROADMAP.md` — Phase 3 requirements (RECIPE-01–05, EXPORT-01–04). Note: D-01, D-07, and D-08 intentionally diverge from the ROADMAP's original wording — discuss-phase decisions take precedence.

### Prior Phase Patterns
- `.planning/phases/02-web-ui-ux-and-settings/` — CONTEXT.md and SUMMARY.md from Phase 2. Reference for IIFE module pattern, CSS class naming, confirm-dialog usage, and `State.save()` sequential pattern.

</canonical_refs>

<specifics>
## Specific Ideas

- The existing `github-api.js` already has a `writeJSON(path, content, sha)` method. Image upload will need a new `writeFile(path, base64content, sha)` method (or reuse `writeJSON` with appropriate content-type — the GitHub Contents API PUT accepts any base64 blob).
- JSZip is the obvious choice for ZIP packing/unpacking in a no-build static SPA. Load from CDN in `index.html` (same pattern as no other deps currently — need to evaluate if this is acceptable, or inline a minimal ZIP implementation).
- For the Anthropic API call (D-11–D-14), the call goes direct from the browser to `https://api.anthropic.com/v1/messages`. No backend, no proxy. User accepts the CORS limitation (Anthropic allows browser calls with a valid key). The system prompt should instruct the model to return JSON only.
- Drag-and-drop (D-09): use `dragover` + `drop` events on the drop zone div. No external library needed.
- The "Export for AI" text (EXPORT-02) should include: bartender persona, bar owner profile (flavor axes, vetoes), inventory list, and recipe list (names + ingredient arrays only — condensed for token efficiency).

</specifics>

<deferred>
## Deferred Ideas

- Selective import per-section (EXPORT-04 original wording) — superseded by D-08 (ZIP preview + confirm writes all four files)
- `#recipes/new` route (RECIPE-01 original wording) — superseded by D-01 (in-place replacement)
- Favorites editing — not in Phase 3 scope
- Recipe deletion — not discussed; defer to Phase 4 or later

</deferred>

---

*Phase: 03-content-management*
*Context gathered: 2026-05-13 via /gsd:discuss-phase*
