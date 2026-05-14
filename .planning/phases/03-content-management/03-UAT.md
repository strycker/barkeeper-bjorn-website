---
status: testing
phase: 03-content-management
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md]
started: 2026-05-14T00:00:00Z
updated: 2026-05-14T01:00:00Z
---

## Current Test

number: 8
name: Edit Recipe Form
expected: |
  From a recipe detail card, click "Edit" → form opens pre-filled with all existing
  values. Edit a field and click "Save Changes" → recipe detail re-renders with updated
  values. No page reload required.
awaiting: user response

## Tests

### 1. ZIP Export
expected: Settings → click "Export All Data (ZIP)" → browser downloads a .zip file. Open the ZIP — it contains 4 JSON files: barkeeper.json, bar-owner-profile.json, inventory.json, recipes.json.
result: pass

### 2. AI-Context Text Export
expected: Settings → click "Export for AI (text)" → browser downloads a .txt file named barkeeper-bjorn-ai-context-YYYY-MM-DD.txt. File contains a readable markdown summary of persona, inventory, and recipes.
result: issue
reported: "similar text export says [object Object] for the slider bar flavor profile choices"
severity: minor

### 3. ZIP Import — File Picker
expected: Settings → (drag zone visible) → click to pick a file → select the ZIP just exported → a preview panel appears listing the 4 file names with an overwrite warning → click "Confirm Import" → progress messages appear → toast "Import complete." Data is written (verify by reloading the page).
result: pass

### 4. ZIP Import — Drag-and-Drop
expected: Drag the ZIP file onto the drop zone in Settings → drop zone border turns amber during hover → preview panel appears with the same 4-file listing as the file picker flow. Confirm Import writes data normally.
result: pass

### 5. Invalid File Rejection
expected: Drag a non-ZIP file (e.g. a .jpg or .txt) onto the import drop zone → red error message appears in the import area ("Invalid file…" or similar) → no data is written, no writes appear in the network tab.
result: pass

### 6. New Recipe Form — In-Place
expected: Recipes → Originals tab → click "+ New Recipe" → an empty recipe form appears in the main content area. The URL hash stays at #recipes (no route change). A "← Back to Recipes" button appears at the top.
result: pass

### 7. Required Field Validation
expected: In the New Recipe form, click "Create Recipe" without filling anything in → toast "Name is required." appears and the form stays open. Fill only the name and try again → toast "Creator is required." Fill name + creator but no ingredients → toast "At least one ingredient is required." Add an ingredient but leave Method blank → toast "Method is required." Form stays open throughout.
result: pass

### 8. Edit Recipe Form
expected: From a recipe detail card, click "Edit" → the same form opens pre-filled with all existing values (name, ingredients, method, glassware, etc.). Edit a field and click "Save Changes" → the recipe detail re-renders with the updated values. No page reload required.
result: [pending]

### 9. AI Integration Section in Settings
expected: Settings page has an "AI Integration" section with a label "Anthropic API Key", a password input (shows ••• not raw text), a "Show" toggle button, and a "Save API key" button. Clicking Show reveals the key text; clicking Hide re-masks it. Entering a key and clicking Save shows "Saved ✓" status text and a toast "Anthropic API key saved."
result: [pending]

### 10. Generate Button — Disabled Without Key
expected: Open Settings → AI Integration → clear the API key (save empty) → navigate to Recipes → click "+ New Recipe" → the Generate button in the AI section is greyed out / disabled. Hovering shows a tooltip about needing an API key in Settings.
result: [pending]

### 11. Generate Button — Enabled With Key
expected: Add an Anthropic API key in Settings → New Recipe form → Generate button is enabled. Enter a cocktail description in the prompt field (e.g. "a smoky mezcal sour with honey"), click Generate → button shows "Generating…" and form fields are disabled. On success, name, tagline, method, glassware, garnish, profile, and ingredient rows are all populated. Toast "AI draft loaded — review and save." On error (bad key), red toast "Generation failed: Invalid API key…" and button re-enables.
result: [pending]

## Summary

total: 11
passed: 6
issues: 1
pending: 4
skipped: 0
blocked: 0

## Gaps

- truth: "AI-context text export contains readable flavor profile values (e.g. '- sweet_tart: 0.7')"
  status: failed
  reason: "User reported: similar text export says [object Object] for the slider bar flavor profile choices"
  severity: minor
  test: 2
  root_cause: "axes values stored as {position: N, _skipped: bool} objects; export.js does `- ${k}: ${v}` which stringifies the object"
  artifacts:
    - path: "app/js/export.js"
      issue: "line ~109: `lines.push(`- ${k}: ${v}`)` — v is an object, not a scalar"
  missing:
    - "Extract v.position (or render 'skipped') before interpolating into the line string"
  debug_session: ""
