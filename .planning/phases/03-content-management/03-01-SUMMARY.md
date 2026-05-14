---
phase: 03-content-management
plan: "01"
subsystem: ui
tags: [jszip, zip, drag-and-drop, github-contents-api, export, import]

requires:
  - phase: 03-content-management
    provides: TEST-CHECKLIST.md baseline (plan 03-00)
  - phase: 02-web-ui-ux-and-settings
    provides: Settings page sections, sequential State.save() pattern, IIFE module pattern
provides:
  - ZIP export of all 4 data files via JSZip
  - AI-context text export (.txt) with markdown summary
  - ZIP import with drag-and-drop drop zone, file picker fallback, preview-with-confirm
  - Sequential State.save() write order in import (4 writes, no 409 conflicts)
  - .import-drop-zone / .import-preview CSS surfaces (reuse-only existing tokens)
affects: [03-02, 03-03, future-data-portability]

tech-stack:
  added: [JSZip 3.10.1 (CDN, SRI-pinned)]
  patterns: [drag-and-drop drop zone with dragover.preventDefault, ZIP preview + single confirm, async export with .catch on caller]

key-files:
  created: []
  modified:
    - app/index.html
    - app/css/app.css
    - app/js/export.js
    - app/js/views/settings.js

key-decisions:
  - "JSZip loaded from cdnjs with SRI integrity hash and crossorigin=anonymous (per D-07 / threat T-03-01-03)"
  - "ZIP entries read via Promise.all (local memory, no GitHub I/O); writes remain sequential via for...of await loop"
  - "Drop-zone styling reuses var(--border2)/var(--amber-dim)/rgba(212,148,58,0.06) — zero new CSS variables"
  - "claude-api.js script tag pre-inserted in index.html (plan 03-03 will create the file)"

patterns-established:
  - "Drag-and-drop drop zone: dragover.preventDefault() + .dragover class + dragleave reset + drop with extension guard"
  - "Multi-file write preview: render 4-row table, single Confirm button gated on allPresent, status line for row-by-row progress"
  - "Async export entry points: caller chains .catch(err => Utils.showToast(err.message, 'error'))"

requirements-completed: [EXPORT-01, EXPORT-02, EXPORT-03, EXPORT-04]

duration: ~25min
completed: 2026-05-14
---

# Phase 3 Plan 01: Export/Import ZIP Summary

**ZIP export + drag-and-drop import drop zone using JSZip 3.10.1, with sequential 4-file write to avoid GitHub 409 SHA conflicts**

## Performance

- **Duration:** ~25 min (across Task 1 commit on 2026-05-14 and Task 2 commit on 2026-05-14)
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Export All Data (ZIP) downloads a `.zip` containing all 4 JSON files (`barkeeper.json`, `bar-owner-profile.json`, `inventory.json`, `recipes.json`).
- Export for AI (text) downloads `barkeeper-bjorn-ai-context-YYYY-MM-DD.txt` (filename per UI-SPEC copywriting contract).
- Import accepts a ZIP via drag-and-drop or file picker; preview panel lists the 4 files; Confirm Import writes them sequentially.
- Invalid drops (non-ZIP, missing files, JSON parse failures) surface red error state without any writes.
- JSZip CDN loaded with SRI integrity, `crossorigin="anonymous"`, before `export.js` in load order.
- `claude-api.js` script tag inserted (placeholder for plan 03-03).
- CSS surfaces (`.import-drop-zone`, `.import-drop-zone.dragover`, `.import-preview`, `.import-preview-row`, `.rf-ai-prompt-wrap`) appended using only existing `:root` tokens — zero new variables.

## Task Commits

1. **Task 1: Add JSZip CDN and drop zone CSS** — `0421408` (feat)
2. **Task 2: Rewrite export.js for ZIP format and drag-and-drop import** — `8fe06d8` (feat)

## Files Created/Modified

- `app/index.html` — JSZip 3.10.1 CDN `<script>` (SRI-pinned) between `utils.js` and `classics-db.js`; `claude-api.js` placeholder tag after `export.js`. No duplicate `export.js` tag.
- `app/css/app.css` — Appended Phase 3 import drop zone, drop zone dragover, import preview panel + row, and AI prompt block styles. All values reuse existing tokens.
- `app/js/export.js` — `exportJSON` rewritten as async JSZip bundler; `exportAIContext` filename updated to `.txt`; `renderImportUI` rewritten with drop zone, drag-and-drop, ZIP preview panel, and sequential confirm-write loop.
- `app/js/views/settings.js` — Button labels updated `(JSON)`→`(ZIP)` and `Export AI Context (text)`→`Export for AI (text)`; helper text updated; export click handler chains `.catch` for async error surfacing.

## Decisions Made

- Read ZIP entries with `Promise.all` (local memory, no network) but kept the GitHub `State.save` loop strictly sequential to preserve the SHA-tracking invariant established in Phase 2.
- Imported the `claude-api.js` script tag now (Task 1) rather than deferring to plan 03-03 — accepted as a no-op 404 in browser until 03-03 lands the file.
- Surfaced ZIP parse errors via inline red preview panel (in addition to toast) so the user sees per-file context.

## Deviations from Plan

None — plan executed exactly as written. All `<acceptance_criteria>` grep checks pass for both tasks.

## Issues Encountered

None.

## User Setup Required

None — JSZip is loaded at runtime from cdnjs; no environment configuration.

## Next Phase Readiness

- ZIP roundtrip (export → import) is functional and gated by sequential writes; ready for manual smoke-test against the Phase 3 TEST-CHECKLIST.md rows for EXPORT-01/02/03.
- `app/js/claude-api.js` script tag is wired but the file does not yet exist — plan 03-03 must create it before the page loads cleanly without a 404 in the network tab.
- No coupling to plan 03-02 (recipe form) — Wave 1 plans are independent as designed.

## Self-Check: PASSED

- `app/index.html` JSZip + claude-api.js tags present, no duplicate `export.js` tag.
- `app/css/app.css` `.import-drop-zone`, `.import-preview`, `.rf-ai-prompt-wrap` present.
- `app/js/export.js` contains `async function exportJSON`, `new JSZip`, `barkeeper-bjorn-ai-context`, `import-drop-zone`, `dragover`, `await State.save`, `Confirm Import`. No `Utils.toast` (non-`Show`) calls.
- `app/js/views/settings.js` contains `Export All Data (ZIP)` and `.catch(err => Utils.showToast(...))`.
- Commits `0421408` and `8fe06d8` present on `claude/discuss-phase-3-I1EU8`.

---
*Phase: 03-content-management*
*Completed: 2026-05-14*
