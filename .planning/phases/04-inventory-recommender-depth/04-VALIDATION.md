---
phase: 4
slug: inventory-recommender-depth
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-14
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual browser smoke tests (no automated test runner — vanilla JS SPA, no build step) |
| **Config file** | none |
| **Quick run command** | `python3 -m http.server 8000` then open `http://localhost:8000/app/` |
| **Full suite command** | Full manual smoke test checklist below |
| **Estimated runtime** | ~10 minutes full suite |

---

## Sampling Rate

- **After every task commit:** Open app in browser, verify the changed surface
- **After every plan wave:** Run full manual smoke test for that wave's features
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~5 minutes per wave check

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Verification | Status |
|---------|------|------|-------------|-----------|--------------|--------|
| normalize-coerce | 01 | 1 | INV-03 | manual | Old `{name}` string entries display as chips without JS errors | ⬜ pending |
| bottle-schema | 01 | 1 | INV-03 | manual | New bottle stored as `{style, type, tier, ...}` object in inventory.json | ⬜ pending |
| bottle-chip-render | 01 | 1 | INV-03 | manual | Chip displays style prominently; brand as muted secondary | ⬜ pending |
| inline-edit-expand | 01 | 2 | INV-04 | manual | Click chip → edit form expands below grid row; other chips stay visible | ⬜ pending |
| inline-edit-save | 01 | 2 | INV-04 | manual | Save Bottle patches state, marks dirty; save bar appears | ⬜ pending |
| inline-edit-revert | 01 | 2 | INV-04 | manual | Revert Changes restores field values to pre-open snapshot | ⬜ pending |
| tier-system | 01 | 2 | INV-05 | manual | Tier dropdown shows all 6 options; tier dot renders correct color | ⬜ pending |
| equipment-tab | 01 | 2 | INV-06 | manual | Equipment tab renders strainer checkboxes; check → saves to `inventory.equipment.strainers` | ⬜ pending |
| canonical-suggest | 01 | 2 | INV-07 | manual | Typing "angostura" shows suggestion banner "Did you mean: Angostura Bitters?" | ⬜ pending |
| canonical-dismiss | 01 | 2 | INV-07 | manual | Clicking "Use it" fills the input with canonical name | ⬜ pending |
| classics-db-tags | 02 | 1 | REC-03 | manual | `classics-db.js` — all 75 recipes have a `tags` array with at least one occasion tag | ⬜ pending |
| bug02-subtype | 02 | 1 | BUG-02 | manual | Rob Roy and Penicillin do NOT appear in one-away when user has only Japanese Whisky | ⬜ pending |
| lc-style-field | 02 | 1 | INV-03+REC | manual | Recommender correctly matches new `{style}` bottle objects against classics DB | ⬜ pending |
| mood-sliders | 02 | 2 | REC-01 | manual | Sliders pre-load from saved profile; adjusting re-ranks results without page reload | ⬜ pending |
| save-to-profile | 02 | 2 | REC-01 | manual | "Save to Profile" button writes slider values to profile and shows toast | ⬜ pending |
| scope-toggle | 02 | 2 | REC-02 | manual | "Allow 1 missing" adds One Bottle Away section below buildable; "Allow 2" adds Two Bottles Away below that | ⬜ pending |
| two-away-links | 02 | 2 | REC-02 | manual | Two-away card shows both missing ingredients with "Add to shopping list" links | ⬜ pending |
| occasion-filter | 02 | 2 | REC-03 | manual | Occasion chips filter results; multiple selections are OR (not AND) | ⬜ pending |
| sidebar-layout | 02 | 2 | REC-01 | manual | Desktop: controls in left sidebar, cards fill right; Mobile: controls stack above cards | ⬜ pending |
| mobile-slider-toggle | 02 | 2 | REC-01 | manual | Mobile: "Adjust Mood" toggle shows/hides sliders | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

No automated test runner in this project (vanilla JS SPA with no build step). All verification is manual browser smoke testing.

- [ ] Dev server running: `python3 -m http.server 8000`
- [ ] App loads at `http://localhost:8000/app/` with no console errors
- [ ] GitHub PAT configured and data loads from GitHub

*Existing infrastructure (dev server) covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Inline edit expand/collapse | INV-04 | DOM interaction, no test runner | Click bottle chip; verify form expands below grid. Click again or press Escape; verify form collapses |
| One-time migration write | D-06 | Persistent state change | Load app with old-format inventory, edit any bottle, save; verify inventory.json on GitHub now has `{style, type, ...}` format |
| BUG-02 regression | BUG-02 | Requires real inventory data | Ensure only Japanese Whisky is in inventory (no Scotch); verify Rob Roy / Penicillin do NOT appear in buildable or one-away tabs |
| Mood slider re-ranking | REC-01 | Visual ordering check | Adjust sweetness slider; verify card order changes without page reload |
| Scope toggle cumulative | REC-02 | Section visibility | Toggle from "Only what I have" → "Allow 1 missing" → "Allow 2 missing"; verify each adds a new section below rather than replacing |
| Canonical name suggestion | INV-07 | Input field event | Type partial name ("angostura", "cointre") in bottle style field; verify suggestion banner appears |
| Strainer multi-select | INV-06 | Checkbox grid state | Check multiple strainers; save; reload; verify all checked items persist |

---

## Validation Sign-Off

- [ ] All tasks have manual verification steps defined above
- [ ] Wave 0: dev server running, app loads clean
- [ ] Wave 1: classics-db tags, BUG-02, lc() fix verified before Wave 2
- [ ] Wave 2: all UI interactions smoke-tested
- [ ] `nyquist_compliant: true` set in frontmatter after sign-off

**Approval:** pending
