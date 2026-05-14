---
plan: "03-03"
phase: "03-content-management"
status: complete
commits:
  - d0e028c  # feat(03-03): add ClaudeAPI wrapper and AI Integration settings section
  - b787278  # feat(03-03): wire handleGenerate to ClaudeAPI for live AI recipe fill
---

# Plan 03-03 Complete — AI Integration

## What Was Done

**Task 1 — `app/js/claude-api.js` (new file)**
- IIFE module `ClaudeAPI` mirroring github-api.js shape
- `generateRecipe(userPrompt, ctx)` → POST to `api.anthropic.com/v1/messages`
- Mandatory `anthropic-dangerous-direct-browser-access: true` CORS header
- Model from `localStorage.bb_chat_model` || `DEFAULT_MODEL` constant
- Specific error handling: 401 (bad key), 429 (rate limit + retry-after), 529 (overload)
- `extractJSON()` strips codefences before `JSON.parse` (safety net for model non-compliance)
- System prompt built from bar inventory + flavor profile context (D-11)

**Task 1 — `app/js/views/settings.js` (new section)**
- `#sect-ai-key` inserted between Account and Export & Import (per UI-SPEC)
- Masked `type="password"` input for `sk-ant-…` key; Show/Hide toggle
- Save button stores key in `localStorage.bb_anthropic_key`; Clear on empty save
- `autocomplete="off"` prevents browser leakage
- `doLogout()` auto-clears `bb_anthropic_key` via `bb_` prefix sweep (no change needed)

**Task 2 — `app/js/views/recipes.js` (handleGenerate wired)**
- `handleGenerate(wrap)` defined before `renderForm` (in scope for click handler)
- Reads `#rf-ai-prompt`, calls `ClaudeAPI.generateRecipe(prompt, ctx)`
- In-flight: Generate button → "Generating…", all form fields disabled
- On success: populates name, tagline, method, glassware, garnish, profile (tasting_notes), ingredients inline; toast "AI draft loaded — review and save."
- Ingredient rows rebuilt via `ingredientRowHtml` + `bindIngredientRemove` re-attach
- On error: red toast "Generation failed: {message}"; Generate re-enables
- Edge case: re-disables Generate if key removed during in-flight call
- Zero `Utils.toast()` regressions — all calls use `Utils.showToast()`

## Acceptance Criteria — All Passed

- [x] `app/js/claude-api.js` exists as valid IIFE
- [x] `anthropic-dangerous-direct-browser-access` header present
- [x] `generateRecipe` exported; `extractJSON` defined
- [x] 401/429/529 error handling present
- [x] `#sect-ai-key` in settings.js; `bb_anthropic_key` stored; toggle wired
- [x] `claude-api.js` script tag in index.html (added in 03-01)
- [x] `ClaudeAPI.generateRecipe` called in recipes.js handleGenerate
- [x] "AI draft loaded" and "Generation failed" toasts present
- [x] `bindIngredientRemove` called after ingredient rebuild
- [x] Zero `Utils.toast()` calls in recipes.js or export.js
- [x] `const RecipesView = ` IIFE structure intact
