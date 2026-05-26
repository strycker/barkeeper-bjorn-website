---
phase: 07-ai-integration
plan: 04
subsystem: ai-integration
tags: [classroom, library, ai-07, ai-06, lib-01, d-13, shared-drawer, 6th-state-file]
requires:
  - "07-01: drafts pattern (5th tolerant State file) — copied for library (6th)"
  - "07-01: ClaudeAPI.getKey() — key-gating for both views"
  - "07-03: ChatView.openDrawer({seed}) — sole AI surface for both views (D-01)"
provides:
  - "Classroom view (#classroom) — static D-13 lessons that render without a key (AI-06)"
  - "Lesson-scoped Ask-Bjorn via the shared drawer (AI-07)"
  - "Library view (#library) — sanitized-href CRUD over user-curated external links (LIB-01)"
  - "library 6th State data file with schema, committed seed, tolerant load, idempotent Normalize.library"
  - "Routes + nav links + script registration for both views"
affects:
  - "app/js/state.js — FILES now 6 entries; TOLERANT_FILES/EMPTY now {drafts, library}"
  - "app/js/normalize.js — byKey dispatches 'library'; new Normalize.library exported"
  - "app/js/app.js — router switch handles 'classroom' and 'library'"
  - "app/index.html — 2 new nav links + 3 new <script> tags"
  - "app/css/app.css — appended .classroom-* and .library-* style blocks"
tech-stack:
  added: []
  patterns:
    - "Static const array module (classics-db shape) for classroom-content"
    - "IIFE view contract (ClassroomView / LibraryView)"
    - "Tolerant-load 6th State file (mirrors drafts treatment from 07-01)"
    - "Shared-drawer reuse (no bespoke chat panel) per D-01"
    - "Defensive XSS sanitization: Utils.escapeHtml on all dynamic strings + _safeHref scheme allowlist on URLs"
key-files:
  created:
    - "app/js/data/classroom-content.js"
    - "app/js/views/classroom.js"
    - "app/js/views/library.js"
    - "schema/library.schema.json"
    - "data/library.json"
  modified:
    - "app/js/state.js"
    - "app/js/normalize.js"
    - "app/js/app.js"
    - "app/index.html"
    - "app/css/app.css"
decisions:
  - "Library nav placed between #recipes and #profile (knowledge-adjacent grouping); meets plan-check L-3 (after #recipes, before #settings)."
  - "Classroom lesson Ask-Bjorn seed truncates body to first sentence, capped at 200 chars (per plan-check M-6) — keeps the auto-sent prompt focused."
  - "Library URL sanitization uses a strict /^https?:\\/\\//i scheme allowlist (T-07-17). Anything else (javascript:, data:, vbscript:, mailto:, ftp:) renders as escaped plain text in a .library-link--unsafe span, never as an anchor."
  - "Both new views explicitly delegate ALL AI traffic to ChatView.openDrawer — zero direct streamMessage/callMessages calls (D-01, gate-enforced)."
  - "Library writes are pure user-typed CRUD (no AI payload), so WriteGate is not required; Normalize.library coerces shape on load and set."
metrics:
  duration_minutes: 18
  completed: "2026-05-26"
---

# Phase 7 Plan 4: Classroom + Library Summary

Static D-13 reference lessons (#classroom) that load without an API key plus lesson-scoped Ask-Bjorn via the shared drawer; user-curated external-link CRUD (#library) backed by a new 6th State data file with sanitized hrefs and key-gated Ask-Bjorn.

## What Shipped

**Task 1 — Classroom view + static content (AI-06/AI-07)** — commit `615fe42`
- `app/js/data/classroom-content.js` — `CLASSROOM_CONTENT` global covering the four D-13 topics (Techniques, Glassware, Ratios, Ingredients), grounded in 07-AI-SPEC §1b (shake-vs-stir, dry shake, 2:1:1 sour, 1:1:1 Negroni, spirit-forward Old Fashioned, ~20–25% dilution, fresh citrus, big-cube vs. cracked ice).
- `app/js/views/classroom.js` — `ClassroomView` IIFE. Renders topic sections of lesson tiles (dashboard `.menu-item` analog). Every lesson title + body is `Utils.escapeHtml`'d before innerHTML (defensive even for static content). Each tile has an "Ask Bjorn about this" button.
- Click handler: no-key → toast affordance; with key → `ChatView.openDrawer({seed})` seeded with the lesson title + the first sentence of the body capped at 200 chars (per plan-check M-6).

**Task 2 — Library 6th State file (LIB-01)** — commit `4eca7d6`
- `schema/library.schema.json` — top-level `{links[], last_updated}` mirroring `recipes.schema.json`; `linkItem` requires `url`, optional `title`/`description`/`tags[]`.
- `data/library.json` — committed seed `{"links": [], "last_updated": "2026-05-21"}` so existing repos do not 404 on upgrade (Pitfall 1).
- `app/js/normalize.js` — new `Normalize.library` idempotent normalizer; `LIBRARY_ITEM_KEYS` allowlist drops unknown fields; tags coerced to non-empty string array; missing title falls back to URL; empty-URL entries dropped. Registered in `byKey` dispatch and exported.
- `app/js/state.js` — `library:'data/library.json'` added as 6th `FILES` entry; `TOLERANT_FILES` and `TOLERANT_EMPTY` extended to cover BOTH `drafts` (→ `{drafts:[]}`) AND `library` (→ `{links:[]}`); the original 4 files (barkeeper, profile, inventory, recipes) remain strict.

**Task 3 — Library view + routes/nav/CSS** — commit `c41b43f`
- `app/js/views/library.js` — `LibraryView` IIFE. CRUD over `State.get('library').links`: add form, per-card edit (inline form), remove (with confirm). Persisted via `State.patch('library',...)` + `State.save('library')`. `_safeHref` enforces `/^https?:\/\//i` allowlist — anything else (`javascript:`, `data:`, `vbscript:`, etc.) renders as escaped plain text in a `.library-link--unsafe` span. All user fields (title, description, tags, displayed URL) are `Utils.escapeHtml`'d. Per-card "Ask Bjorn about this" is key-gated and seeds the drawer.
- `app/js/app.js` — router switch now handles `'classroom'` and `'library'` cases.
- `app/index.html` — nav links `#classroom` + `#library` (placed after Recipes, before Profile, per plan-check L-3); script tags `js/data/classroom-content.js` in the data region (before views/classroom.js); `js/views/classroom.js` and `js/views/library.js` after `js/views/chat.js` (so `ChatView` is defined) and before `js/app.js`.
- `app/css/app.css` — appended mobile-first `.classroom-page`, `.classroom-grid`, `.lesson-tile`, `.lesson-ask`, `.library-page`, `.library-form`, `.library-card`, `.library-link`, `.library-tag` style blocks using existing `:root` CSS custom properties.

**Task 4 — Human-verify checkpoint** — auto-approved per yolo mode (execute-phase orchestration). Live-key UAT (lesson Q&A scoping, library CRUD round-trip through GitHub, javascript: scheme rejection in the live DOM) deferred to `/gsd-verify-work`.

## Verification Gate Results

All grep/syntax/test gates pass:

| Gate | Result |
|------|--------|
| `node --check app/js/data/classroom-content.js` | ok |
| `node --check app/js/views/classroom.js` | ok |
| `node --check app/js/views/library.js` | ok |
| `node --check app/js/state.js` | ok |
| `node --check app/js/normalize.js` | ok |
| `node --check app/js/app.js` | ok |
| `data/library.json` parses, `links` is array | ok |
| `schema/library.schema.json` parses | ok |
| `grep -c CLASSROOM_CONTENT app/js/data/classroom-content.js` | 1 (≥1 required) |
| 4 topics present (Techniques\|Glassware\|Ratios\|Ingredients) | 5 hits (≥4 required) |
| `grep -c openDrawer app/js/views/classroom.js` | 3 (≥1) |
| `grep -c getKey app/js/views/classroom.js` | 1 (≥1) |
| `grep -c "streamMessage\|callMessages" app/js/views/classroom.js` | 0 (==0 required) |
| `grep -c escapeHtml app/js/views/classroom.js` | 4 (≥1) |
| `grep -c "library:" app/js/state.js` | 2 (≥1) |
| `grep -c "function library" app/js/normalize.js` | 1 (==1) |
| `grep -c "key === 'library'" app/js/normalize.js` | 1 (==1) |
| `grep -nE "drafts\|library" app/js/state.js` — tolerant block covers both | confirmed (lines 13–23 + 60–66) |
| `grep -c "case 'classroom'" app/js/app.js` | 1 (==1) |
| `grep -c "case 'library'" app/js/app.js` | 1 (==1) |
| `grep -c "views/classroom.js" app/index.html` | 2 (1 script + 1 comment ref) |
| `grep -c "views/library.js" app/index.html` | 1 (==1) |
| `grep -c "classroom-content.js" app/index.html` | 1 (==1) |
| `href="#classroom"` and `href="#library"` in nav | 1 each (≥1) |
| `_safeHref` / `https` in library.js | 6 hits (≥1) |
| `State.save('library')` in library.js | 4 hits (≥1) |
| `openDrawer` in library.js | 3 (≥1) |
| `streamMessage|callMessages` in library.js | 0 (==0) |
| `escapeHtml` in library.js | 10 (≥1) |
| Full test suite (`tests/*.test.js`) | all 4 pass (phase-05-engine, phase-05-normalize, phase-06-engine, phase-07-ai) |
| Script ordering: classroom-content.js (102) before views/classroom.js (121); both views after chat.js (120); all before app.js (125) | confirmed |

## Deviations from Plan

**1. [Rule 1 — Lint] Removed accidental gate-violation comment in library.js**
- **Found during:** Task 3 gate check
- **Issue:** A comment line literally contained "streamMessage\|callMessages" describing the gate, which tripped the gate (`grep -c` returned 1, required 0).
- **Fix:** Rewrote the comment to describe the constraint without using the forbidden tokens.
- **Files modified:** `app/js/views/library.js`
- **Commit:** rolled into Task 3 commit `c41b43f` (single-task commit, fix applied before commit).

No architectural deviations. All 3 auto tasks executed exactly per plan; the human-verify checkpoint was auto-approved per yolo mode.

## Authentication Gates

None encountered. (Library write path uses the existing GitHub PAT via `State.save`; no new auth surface introduced.)

## Threat Surface Scan

No new threat surfaces beyond those already in the plan's `<threat_model>` (T-07-17 through T-07-21). All five mitigations are in place:
- T-07-17 (XSS via library URL/title/tags) — `_safeHref` http(s) allowlist + `Utils.escapeHtml` on every user field.
- T-07-18 (XSS via classroom body) — defensive `Utils.escapeHtml` on every static lesson title/body before innerHTML.
- T-07-19 (library write tampering) — `Normalize.library` coerces + drops unknown keys on both load and `set`.
- T-07-20 (no-key bypass) — `_noKey()` check before `openDrawer`; the drawer also self-gates (07-03).
- T-07-21 (loadAll DoS on missing library.json) — committed seed `data/library.json` + tolerant-404 branch in `state.js` (both `drafts` and `library` covered).

## Self-Check: PASSED

Files exist:
- FOUND: `app/js/data/classroom-content.js`
- FOUND: `app/js/views/classroom.js`
- FOUND: `app/js/views/library.js`
- FOUND: `schema/library.schema.json`
- FOUND: `data/library.json`

Commits exist (in branch `claude/phase-7-gsd-7yYKL`):
- FOUND: `615fe42` (Task 1 — Classroom)
- FOUND: `4eca7d6` (Task 2 — Library State file)
- FOUND: `c41b43f` (Task 3 — Library view + routes/nav/CSS)
