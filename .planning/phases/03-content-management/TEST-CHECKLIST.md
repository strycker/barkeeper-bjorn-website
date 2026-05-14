# Phase 3: Content Management — Test Checklist

## Setup
- [ ] Dev server running: `python3 -m http.server 8000` → open http://localhost:8000/app/
- [ ] GitHub PAT configured in Settings with repo-scoped access
- [ ] At least one recipe in the originals tab (create one during testing or use an existing one)

## Wave 1 — Export / Import (plan 03-01)

### EXPORT-01: ZIP Export
- [ ] Settings page → Export & Import section
- [ ] Click "Export All Data (ZIP)"
- [ ] Verify: a file named `barkeeper-bjorn-export-YYYY-MM-DD.zip` downloads to the browser
- [ ] Verify: unzip the file — it contains exactly 4 files: barkeeper.json, bar-owner-profile.json, inventory.json, recipes.json
- [ ] Verify: each JSON file is valid (parseable) and non-empty

### EXPORT-02: AI-Context Text Export
- [ ] Click "Export for AI (text)" in Settings → Export & Import
- [ ] Verify: a file named `barkeeper-bjorn-ai-context-YYYY-MM-DD.txt` (or `.md`) downloads
- [ ] Verify: file contains sections for Bartender Persona, Flavor Profile, Inventory, and Originals
- [ ] Verify: file is human-readable markdown/text suitable for pasting into Claude or ChatGPT

### EXPORT-03: ZIP Import — File Picker
- [ ] Settings → Export & Import → drop zone renders with "Drop a ZIP export file here" text
- [ ] Click "Choose File…" button → file picker opens; select the ZIP exported above
- [ ] Verify: preview panel appears listing all 4 file names with ✓ checkmarks
- [ ] Verify: "ZIP must contain all 4 data files." warning does NOT appear (all 4 present)
- [ ] Click "Confirm Import"
- [ ] Verify: row-by-row status updates appear ("Writing barkeeper.json…" etc.)
- [ ] Verify: green toast "Import complete." appears when done
- [ ] Reload the page — verify data is intact (no data loss)

### EXPORT-03: ZIP Import — Drag and Drop
- [ ] Drag the ZIP file over the drop zone
- [ ] Verify: drop zone border turns amber (var(--amber)) during drag
- [ ] Drop the file → same preview panel appears as file picker path

### EXPORT-03: ZIP Import — Invalid File Rejection
- [ ] Try dropping a non-ZIP file (e.g. a .json or .txt file)
- [ ] Verify: error toast appears; no writes are made
- [ ] Try dropping a ZIP that is missing one or more of the 4 required JSON files
- [ ] Verify: preview shows ✕ for missing files and "Confirm Import" is disabled

### EXPORT-04 (via D-08 — single confirm, no checkboxes)
- [ ] Verify import preview shows all 4 files (not per-section checkboxes)
- [ ] Verify single "Confirm Import" button writes all 4 files

## Wave 1 — Recipe Form (plan 03-02)

### RECIPE-04: New Recipe Button
- [ ] Navigate to Recipe Book (#recipes)
- [ ] Verify: "+ New Recipe" button appears in the page header (relabeled from "+ Add Recipe")
- [ ] Click it — form renders in-place (no URL hash change, stays on #recipes)

### RECIPE-01: Add Original Recipe
- [ ] Fill required fields: Name, Creator, at least one Ingredient (amount + name), Method
- [ ] Click "Create Recipe"
- [ ] Verify: green toast "Recipe created."
- [ ] Verify: navigates to the recipe detail view inline
- [ ] Reload the page → recipe appears in the Originals tab

### RECIPE-01: Required Field Validation (D-02)
- [ ] Open new recipe form
- [ ] Leave Name blank → click "Create Recipe"
- [ ] Verify: toast error "Name is required." — form stays open
- [ ] Fill Name, leave Creator blank → submit
- [ ] Verify: toast error "Creator is required."
- [ ] Fill Name + Creator, leave all ingredients blank → submit
- [ ] Verify: toast error "At least one ingredient is required."
- [ ] Fill Name + Creator + one ingredient, leave Method blank → submit
- [ ] Verify: toast error "Method is required."

### RECIPE-02: Edit Existing Recipe
- [ ] Navigate to a recipe detail view
- [ ] Click "Edit" button
- [ ] Verify: form pre-populated with existing recipe data
- [ ] Change the recipe name → click "Save Changes"
- [ ] Verify: toast "Recipe updated." → detail view re-renders with new name
- [ ] Reload → updated name persists

### RECIPE-02: Back Button Behavior
- [ ] From Edit form, click "← Back to Recipe" → returns to detail view (not the grid)
- [ ] From New Recipe form, click "← Back to Recipes" → returns to recipe grid

### RECIPE-03: Image Upload (already implemented — verify no regression)
- [ ] Open any recipe detail
- [ ] Click "Choose File" → select a JPEG/PNG under 2 MB
- [ ] Click "Upload to GitHub"
- [ ] Verify: status updates; toast "Image uploaded successfully."
- [ ] Verify: new image appears in the images section from raw.githubusercontent.com URL

### RECIPE-05: AI Prompt Field (no-key state)
- [ ] Remove Anthropic key from Settings (Settings → AI Integration → clear and save)
- [ ] Open New Recipe form
- [ ] Verify: AI prompt textarea is visible; Generate button is disabled (greyed out)
- [ ] Hover Generate button → tooltip reads "Add your Anthropic API key in Settings to use AI generation"
- [ ] Verify: no AI prompt block on the Edit Recipe form (D-12 — new only)

## Wave 2 — AI Integration (plan 03-03)

### Settings: AI Integration Section
- [ ] Navigate to Settings
- [ ] Verify: "AI Integration" section appears (between Account and Export & Import)
- [ ] Verify: Anthropic API Key input is masked (shows ••• not raw text)
- [ ] Click "Show" → input reveals the key; click "Hide" → masked again
- [ ] Enter a test key (sk-ant-…), click "Save API key"
- [ ] Verify: status text "Saved ✓" (green)
- [ ] Reload page → key persists (stored in localStorage bb_anthropic_key)
- [ ] Log out → bb_anthropic_key is cleared (automatic via bb_ prefix in doLogout)

### RECIPE-05: AI Generate (key present)
- [ ] Add a valid Anthropic API key in Settings
- [ ] Open New Recipe form
- [ ] Verify: Generate button is now enabled (not greyed out)
- [ ] Enter a prompt: "a smoky mezcal sour with honey and citrus"
- [ ] Click "Generate"
- [ ] Verify: button shows "Generating…" + spinner while in-flight; other form fields disabled
- [ ] Verify: on success, form fields (Name, Tagline, Method, Glassware, Garnish, Profile, Ingredients) populate inline
- [ ] Verify: toast "AI draft loaded — review and save."
- [ ] Edit any field, click "Create Recipe" → saves normally

### RECIPE-05: AI Generate Error Handling
- [ ] With an invalid API key, click Generate
- [ ] Verify: red toast "Generation failed: Invalid API key. Check Settings." (or similar)
- [ ] Verify: Generate button re-enables; form fields intact

## Manual-Only Verifications

| Behavior | How to Verify |
|----------|--------------|
| Recipe form in-place (no route change) | Click New Recipe → confirm browser address bar still shows #recipes |
| Image renders post-upload | After upload, the new <img> src starts with https://raw.githubusercontent.com |
| Drop zone amber border on dragover | Drag file over zone → border must turn amber (var(--amber)) |
| Anthropic key masked in Settings | Input shows ••• not raw sk-ant-... string |
| ZIP import sequential writes (no 409) | DevTools Network tab → confirm 4 PUT calls, each returning 200 OK, sequential |

## Status Key
- ⬜ Not yet tested
- ✅ Passed
- ❌ Failed (note details below)
- ⚠️ Flaky

## Sign-Off
- [ ] All Wave 1 rows green before Wave 2 plans execute
- [ ] All Wave 2 rows green before `/gsd:verify-work`
- [ ] No 409 SHA conflict errors observed during import
