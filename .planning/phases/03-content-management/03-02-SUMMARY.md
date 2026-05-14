---
phase: 03-content-management
plan: "02"
subsystem: recipes
tags: [recipes, forms, validation, ai-scaffold, bugfix]
requires: [03-00]
provides:
  - "Recipe CRUD form (create + edit) wired with D-02 validation"
  - "AI prompt block scaffold in renderForm (no-key disabled state)"
  - "buildPromptContext() helper for prompt-text generation"
affects:
  - app/js/views/recipes.js
tech_stack:
  added: []
  patterns:
    - "Synchronous client-side validation gate before State.save()"
    - "Feature-gate via typeof guard for not-yet-loaded module (ClaudeAPI)"
key_files:
  created: []
  modified:
    - app/js/views/recipes.js
decisions:
  - "D-01: renderForm uses in-place content replacement; no new route"
  - "D-02: required fields = name, creator, ≥1 ingredient, method"
  - "D-03: '+ New Recipe' button in Recipe Book header is the create entry point"
  - "D-12: AI prompt block only renders when !isEdit"
metrics:
  duration_minutes: 5
  completed: 2026-05-14
  tasks_completed: 2
  files_modified: 1
requirements:
  - RECIPE-01
  - RECIPE-02
  - RECIPE-03
  - RECIPE-04
  - RECIPE-05
---

# Phase 3 Plan 02: Recipe Form Hardening + AI Prompt Scaffold Summary

**One-liner:** Fixed 8 broken `Utils.toast` calls, relabeled "+ New Recipe", extended save gate to enforce D-02 (ingredient + method required), and added the AI prompt block + Generate button stub to `renderForm` so plan 03-03 can hook the live ClaudeAPI call.

## Tasks Completed

| Task | Name | Commit |
|------|------|--------|
| 1 | Fix Utils.toast bug and relabel New Recipe button | `2049d7f` |
| 2 | Extend validation gate and add AI prompt block to renderForm | `1f9a76c` |

## Changes Shipped

### Task 1 — Bugfix and label update
- Replaced all 8 broken `Utils.toast(...)` calls with `Utils.showToast(...)` (the only function that exists on Utils).
- Relabeled `+ Add Recipe` → `+ New Recipe` in `renderOriginalsGrid` (D-03).
- Updated originals empty-state subtitle to match UI-SPEC copywriting contract.

### Task 2 — D-02 validation + D-12 AI scaffold
- Extracted `buildPromptContext()` helper (inventory, profile, barkeeper name/preset). `showAIPromptModal` now consumes it.
- Inserted AI prompt block (`#rf-ai-wrap`) at the top of `renderForm` when `!isEdit` (D-12). Contains: section label, prompt textarea (`#rf-ai-prompt`), Generate button (`#rf-generate`), status span.
- Generate button is disabled with tooltip `"Add your Anthropic API key in Settings to use AI generation"` when `localStorage.bb_anthropic_key` is absent.
- Generate click handler is a stub guarded by `typeof ClaudeAPI === 'undefined' || typeof handleGenerate === 'undefined'` — safe to load before plan 03-03 introduces `claude-api.js` and `handleGenerate`.
- Extended save validation gate with two new synchronous checks BEFORE any State write:
  - At least one ingredient with a non-empty name → toast "At least one ingredient is required."
  - Method non-empty → toast "Method is required."

## Deviations from Plan

None — plan executed exactly as written. The AI block was inserted via `wrap.innerHTML +=` (rather than `appendChild` followed by `innerHTML +=`, which would have re-serialized and dropped event listeners). The Generate listener is bound after `container.appendChild(wrap)` to ensure the element is in the DOM and listeners attach cleanly. This is a style choice within the spec, not a deviation from contract.

## Acceptance Criteria Verification

```
grep -c "Utils\.toast(" app/js/views/recipes.js           → 0   PASS
grep -c "Utils\.showToast(" app/js/views/recipes.js       → 8   PASS
grep "New Recipe" app/js/views/recipes.js                 → match PASS
grep "Add Recipe" app/js/views/recipes.js                 → no match PASS
grep "buildPromptContext" app/js/views/recipes.js         → 2   PASS (definition + call)
grep "rf-ai-prompt-wrap" app/js/views/recipes.js          → 1   PASS
grep "rf-ai-prompt" app/js/views/recipes.js               → 3   PASS
grep "rf-generate" app/js/views/recipes.js                → 3   PASS
grep "At least one ingredient" app/js/views/recipes.js    → 1   PASS
grep "Method is required" app/js/views/recipes.js         → 1   PASS
grep "const RecipesView = " app/js/views/recipes.js       → 1   PASS (IIFE intact)
node --check app/js/views/recipes.js                      → OK  PASS
```

## Threat Surface Notes

All STRIDE mitigations from the plan's `<threat_model>` are honored:
- T-03-02-01 (XSS): no new output sites added that bypass `Utils.escapeHtml`. The AI prompt textarea has no `value=` interpolation; user-supplied prompt text is only read at click time, never reflected into HTML in this plan.
- T-03-02-02 (Tampering): the extended validation gate runs synchronously before any `State.set`/`State.save` — no partial writes.
- T-03-02-03 (Information Disclosure): `bb_anthropic_key` is only consulted as a truthy check; its value is never read, logged, or rendered.
- T-03-02-04 (Spoofing): all `Utils.toast` calls fixed to `Utils.showToast`; no silently-swallowed user feedback.

No new threat flags discovered.

## Handoff to Plan 03-03

Plan 03-03 (Wave 2) is now unblocked. It will:
1. Create `app/js/claude-api.js` exposing `ClaudeAPI.generateRecipe(...)`.
2. Add a `handleGenerate(wrap)` function in `recipes.js` that calls `ClaudeAPI.generateRecipe(buildPromptContext(), wrap.querySelector('#rf-ai-prompt').value)` and fills the form fields.
3. Add the AI Integration settings section that writes `localStorage.bb_anthropic_key`.

The DOM IDs the live wiring will need (`#rf-ai-prompt`, `#rf-generate`, `#rf-generate-status`) are all in place and stable.

## Self-Check: PASSED

- File `app/js/views/recipes.js` exists at expected path: FOUND
- Commit `2049d7f` present in git log: FOUND
- Commit `1f9a76c` present in git log: FOUND
- SUMMARY.md exists at `.planning/phases/03-content-management/03-02-SUMMARY.md`: FOUND (this file)
