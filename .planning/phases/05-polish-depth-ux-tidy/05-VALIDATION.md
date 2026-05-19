---
phase: 05
slug: 05-polish-depth-ux-tidy
status: partial
nyquist_compliant: false
wave_0_complete: true
created: 2026-05-19
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for Nyquist coverage of Phase 5: Polish, Depth & UX Tidy.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `node:test` + `node:assert` (no install required) |
| **Config file** | none — scripts run directly via `node` |
| **Quick run command** | `node tests/phase-05-normalize.test.js && node tests/phase-05-engine.test.js` |
| **Full suite command** | `node tests/phase-05-normalize.test.js && node tests/phase-05-engine.test.js` |
| **Estimated runtime** | ~1 second |

**Note:** UI-interaction requirements (scope buttons, form labels, wizard, vetoes panel) are browser-only and cannot be automated without a headless driver. They are covered by the UAT record (17/17 passed — `05-UAT.md`).

---

## Sampling Rate

- **After any change to normalize.js:** `node tests/phase-05-normalize.test.js`
- **After any change to recommender-engine.js or classics-db.js:** `node tests/phase-05-engine.test.js`
- **Before `/gsd-verify-work`:** full suite must be green

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-03-01 | 05-03 | 2 | DATA-01: equipment stripped from barkeeper + profile; preserved in inventory | unit | `node tests/phase-05-normalize.test.js` | ✅ | ✅ green |
| 05-03-02 | 05-03 | 2 | DATA-02: string axis positions migrate to floats via POS_MAP | unit | `node tests/phase-05-normalize.test.js` | ✅ | ✅ green |
| 05-01-09 | 05-01 | 1 | REC-09: Army & Navy buildable with gin + lemon + orgeat | integration | `node tests/phase-05-engine.test.js` | ✅ | ✅ green |
| 05-02-10 | 05-02 | 1 | INV-10: quick-add routing regression | manual | — see Manual-Only section | — | ✅ (UAT #6) |
| 05-01-05 | 05-01 | 1 | REC-05: scope buttons cumulative highlight | manual | — | — | ✅ (UAT #7) |
| 05-01-06 | 05-01 | 1 | REC-06: unconstrained scope button (dashed border) | manual | — | — | ✅ (UAT #8) |
| 05-01-07 | 05-01 | 1 | REC-07: vetoes panel in sidebar | manual | — | — | ✅ (UAT #9) |
| 05-01-08 | 05-01 | 1 | REC-08: favorites/wishlist buttons on rec cards | manual | — | — | ✅ (UAT #10) |
| 05-02-08 | 05-02 | 1 | INV-08: label renames Category / Specific Style/Type | manual | — | — | ✅ (UAT #12) |
| 05-02-09 | 05-02 | 1 | INV-09: nationality field in expanded More fields | manual | — | — | ✅ (UAT #3) |
| 05-03-03 | 05-03 | 2 | DATA-03: drinking-style fields in onboarding + profile | manual | — | — | ✅ (UAT #13, #15) |
| 05-04-01 | 05-04 | 2 | CUST-01: bartender wizard at #bartender-wizard | manual | — | — | ✅ (UAT #17) |
| 05-04-02 | 05-04 | 2 | CUST-02: "Full Customization →" link in Settings | manual | — | — | ✅ (UAT #16) |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Evidence |
|----------|-------------|------------|----------|
| Scope buttons highlight cumulatively | REC-05 | DOM/CSS state requires browser | UAT #7 pass |
| Unconstrained button has dashed border | REC-06 | Visual CSS, browser only | UAT #8 pass |
| Vetoes panel shows + toggles per-session | REC-07 | DOM interaction, session state | UAT #9 pass |
| ♥ / ☆ buttons on rec cards save + persist | REC-08 | GitHub API + re-render, browser | UAT #10 pass |
| Label reads "Category" not "Style" | INV-08 | DOM text node, browser | UAT #12 pass |
| Nationality field present + saves | INV-09 | Form interaction + GitHub write | UAT #3 pass |
| Quick-add routes Mixers to Mixers section | INV-10 | Config.quickAddRules() is browser-only (reads GitHub JSON) | UAT #6 pass |
| Drinking-style fields in onboarding step 7 | DATA-03 | Multi-step browser UI | UAT #15 pass |
| Drinking-style section in Profile tab | DATA-03 | Browser collapsible section + save | UAT #13 pass |
| Bartender wizard form at #bartender-wizard | CUST-01 | Multi-section form, GitHub save | UAT #17 pass |
| "Full Customization →" link in Settings | CUST-02 | DOM navigation, browser | UAT #16 pass |

---

## Validation Audit 2026-05-19

| Metric | Count |
|--------|-------|
| Requirements | 13 |
| Automated (green) | 3 |
| Manual-only (UAT evidence) | 10 |
| Gaps resolved | 3 |
| Escalated | 0 |
| Nyquist compliant | no (browser-only features cannot be automated without headless driver) |
