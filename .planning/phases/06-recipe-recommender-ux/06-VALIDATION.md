---
phase: 06
slug: 06-recipe-recommender-ux
status: partial
nyquist_compliant: false
wave_0_complete: true
created: 2026-05-21
---

# Phase 06 — Validation Strategy

> Per-phase validation contract for Nyquist coverage of Phase 6: Recipe & Recommender UX.

This is a vanilla ES6+ static SPA — no build step, no npm, no DOM test framework
(CLAUDE.md). Automatable surface = pure functions and the recommender engine,
covered by `node:test`. DOM/visual behaviors are validated manually via the
22-test `06-UAT.md` (all resolved: 20 pass, 2 issues deferred to future phases).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `node:test` + `node:assert/strict` (no install required) |
| **Config file** | none — modules loaded via `vm.runInThisContext` with stubbed browser globals |
| **Quick run command** | `node tests/phase-06-engine.test.js` |
| **Full suite command** | `for f in tests/*.test.js; do node "$f" || exit 1; done` |
| **Estimated runtime** | <1 second |

---

## Sampling Rate

- **After every task commit:** Run `node tests/phase-06-engine.test.js`
- **After every plan wave:** Run the full suite (`tests/*.test.js`)
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~1 second

---

## Per-Task Verification Map

| Requirement | Plan | Decision | Test Type | Automated Command / Test name | Status |
|-------------|------|----------|-----------|-------------------------------|--------|
| D-08 recipe identity = name+base, case-insensitive | 06-01 | D-08 | unit | `node tests/phase-06-engine.test.js` → `D-08: sameRecipe true for same name + base...` | ✅ green |
| D-08 same name / different base = distinct | 06-01 | D-08 | unit | → `D-08: sameRecipe false for same name but different base` | ✅ green |
| D-08 null-safe comparator | 06-01 | D-08 | unit | → `D-08: sameRecipe is null-safe...` | ✅ green |
| D-07 normalizeOriginal synthesizes _source/keywords/searchIn/base | 06-03 | D-07 | unit | → `D-07: normalizeOriginal synthesizes...` | ✅ green |
| D-07 matching Original scored into recommend() pool | 06-03 | D-07 | unit | → `D-07: a matching Original appears...` | ✅ green |
| D-07 empty Original excluded before scoring | 06-03 | D-07 | unit | → `D-07: an empty Original... excluded` | ✅ green |
| D-07 / T-06-06 raw Original crash guard | 06-03 | D-07 | unit | → `D-07/T-06-06: raw Original... do not crash` | ✅ green |
| REGRESSION lc() matches bottle `type`, not just `style` | (UAT fix) | D-07 | unit | → `REGRESSION: object-shaped Bourbon...` | ✅ green |
| REGRESSION bare `amaro` keyword removed (no over-match) | (UAT fix) | — | unit | → `REGRESSION: a type:Amaro bottle...` | ✅ green |
| REC-10 action buttons in card-header row | 06-01 | — | manual | — visual layout, no DOM framework | ✅ (UAT #1) |
| REC-11 heart/star filled vs open toggle | 06-01 | — | manual | — DOM interaction | ✅ (UAT #2) |
| RECIPE-MADE-01 "I Made This" adds to made_log | 06-01 | — | manual | — DOM + State.save | ⚠️ (UAT #3 — stale-SHA save issue, deferred) |
| RECIPE-MADE-02 Made tab most-recent-first + ×N badge | 06-01/02 | — | manual | — DOM render/sort | ✅ (UAT #4) |
| RECIPE-VIEW-01 Favorites/Wishlist render as chips | 06-01 | — | manual | — visual | ✅ (UAT #5) |
| RECIPE-VIEW-02 chip opens universal detail modal | 06-02 | — | manual | — DOM | ✅ (UAT #6) |
| RECIPE-SEARCH-01 recipes page search + clear on tab switch | 06-01 | — | manual | — DOM filter | ✅ (UAT #7) |
| REC-SEARCH-01 recommender page card search | 06-01 | — | manual | — DOM filter | ✅ (UAT #8) |
| D-06 Originals editable in modal | 06-02 | D-06 | manual | — DOM editor | ✅ (UAT #9) |
| D-06 classics-db chip stays read-only | 06-02 | D-06 | manual | — DOM | ✅ (UAT #10) |
| D-06 editing an Original dual-writes both locations | 06-02 | D-06 | manual | — DOM + State | ✅ (UAT #11) |
| D-06 renaming an Original has no orphan/duplicate | 06-02 | D-06 | manual | — DOM + State | ⚠️ (UAT #12 — cross-list sync gap, deferred) |
| D-07 Originals appear with amber badge | 06-03 | D-07 | manual | — visual badge | ✅ (UAT #13) |
| D-07 Original lacking base+ingredients excluded | 06-03 | D-07 | manual + unit | UAT #14 + `D-07: an empty Original... excluded` | ✅ (UAT #14) |
| D-07 no console error rendering Originals | 06-03 | D-07 | manual + unit | UAT #15 + `D-07/T-06-06: raw Original... do not crash` | ✅ (UAT #15) |
| D-07 favoriting an Original preserves _source | 06-03 | D-07 | manual | — DOM + State | ✅ (UAT #16) |
| D-07 Strategy B inventory-aware Original matching | 06-03 | D-07 | manual + unit | UAT #17 + `D-07: a matching Original appears...` | ✅ (UAT #17) |
| D-08 filled state matches by name+base | 06-01 | D-08 | manual + unit | UAT #18 + `D-08: sameRecipe...` | ✅ (UAT #18) |
| D-08 same name diff base distinct | 06-01 | D-08 | manual + unit | UAT #19 + `D-08: sameRecipe false...` | ✅ (UAT #19) |
| D-08 toggle never creates a duplicate | 06-01 | D-08 | manual | — DOM | ✅ (UAT #20) |
| D-08 same recipe in Favorites AND Wishlist | 06-01 | D-08 | manual | — DOM | ✅ (UAT #21) |
| D-08 marking made again increments times_made | 06-01/02 | D-08 | manual | — DOM + State | ✅ (UAT #22) |

*Status: ⬜ pending · ✅ green/passed · ❌ red · ⚠️ deferred issue*

---

## Wave 0 Requirements

- [x] `tests/phase-06-engine.test.js` — 9 unit tests covering D-08 `Utils.sameRecipe`, D-07 Originals (normalization, pool scoring, empty exclusion, crash guard), and the two regression fixes from UAT (lc() type matching, amaro keyword tightening).

Existing infrastructure (`node:test` via `vm`) covers all automatable phase requirements; no framework install needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Action buttons in card-header row | REC-10 | Visual layout; no DOM framework | 06-UAT.md Test 1 |
| Heart/star filled vs open toggle | REC-11 | DOM event + visual state | 06-UAT.md Test 2 |
| "I Made This" adds to made_log | RECIPE-MADE-01 | DOM + GitHub save round-trip | 06-UAT.md Test 3 |
| Made tab order + ×N badge | RECIPE-MADE-02 | DOM render | 06-UAT.md Test 4 |
| Favorites/Wishlist chips + overflow | RECIPE-VIEW-01 | Visual | 06-UAT.md Test 5 |
| Chip opens detail modal + close paths | RECIPE-VIEW-02 | DOM | 06-UAT.md Test 6 |
| Recipes search + clear-on-switch | RECIPE-SEARCH-01 | DOM filter | 06-UAT.md Test 7 |
| Recommender card search | REC-SEARCH-01 | DOM filter | 06-UAT.md Test 8 |
| Editable Originals modal + dual-write + rename safety | D-06 | DOM editor + State + GitHub | 06-UAT.md Tests 9–12 |
| Amber badge / _source preservation / favoriting UI | D-07 (UI) | Visual + DOM | 06-UAT.md Tests 13, 16 |
| Filled-state UI / no-duplicate / both-lists / made-again UI | D-08 (UI) | DOM | 06-UAT.md Tests 18, 20, 21, 22 |

---

## Validation Sign-Off

- [x] All automatable behaviors (pure fn + engine) have `<automated>` verification
- [x] Wave 0 covers all MISSING automatable references (`tests/phase-06-engine.test.js`)
- [x] DOM/visual behaviors documented as Manual-Only with UAT cross-references
- [x] No watch-mode flags; suite runs and exits
- [x] Feedback latency < 1s
- [ ] `nyquist_compliant: true` — NOT set: DOM/visual requirements remain manual-only by necessity (no DOM test framework in this vanilla SPA). This is the accepted maximum coverage; `status: partial`.

**Approval:** approved 2026-05-21 (partial — automatable surface fully covered; DOM/visual manual via 06-UAT.md)
