---
phase: 2
slug: web-ui-ux-and-settings
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-11
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — no test framework in this vanilla JS SPA |
| **Config file** | none |
| **Quick run command** | `python3 -m http.server 8000` then open `http://localhost:8000/app/` |
| **Full suite command** | Manual checklist — see `.planning/phases/02-web-ui-ux-and-settings/TEST-CHECKLIST.md` |
| **Estimated runtime** | ~5–10 minutes manual walkthrough |

---

## Sampling Rate

- **After every task commit:** Serve `app/` locally and smoke-test the specific changed view
- **After every plan wave:** Manual walkthrough of all Phase 2 success criteria
- **Before `/gsd-verify-work`:** All 5 ROADMAP success criteria must pass
- **Max feedback latency:** One browser-serve cycle per task

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| ONB-01 | 01 | 1 | ONB-01 | — | Skip saves `_skipped: true`, no data loss | manual | — | ❌ | ⬜ pending |
| ONB-02 | 01 | 1 | ONB-02 | — | Slider float 0–1, "Middle" label at 0.5 | manual | — | ❌ | ⬜ pending |
| ONB-03 | 01 | 1 | ONB-03 | — | Bartender steps at positions 2–4 | manual | — | ❌ | ⬜ pending |
| ONB-04 | 01 | 1 | ONB-04 | T-2-01 | Comma-parse → chip preview → save | manual | — | ❌ | ⬜ pending |
| NAV-01 | 02 | 1 | NAV-01 | — | Avatar img with fallback to SVG on error | manual | — | ❌ | ⬜ pending |
| NAV-02 | 02 | 1 | NAV-02 | — | Hero image above greeting; collapses on 404 | manual | — | ❌ | ⬜ pending |
| NAV-03 | 02 | 1 | NAV-03 | — | Bjorn avatar on welcome step with caption | manual | — | ❌ | ⬜ pending |
| NAV-04 | 02 | 2 | NAV-04 | — | 7-item grid; disabled cards show toast | manual | — | ❌ | ⬜ pending |
| NAV-05 | 02 | 2 | NAV-05 | — | Gear icon replaces Setup post-config | manual | — | ❌ | ⬜ pending |
| SET-01 | 03 | 2 | SETTINGS-01 | T-2-02 | Bartender rename saves to barkeeper.json | manual | — | ❌ | ⬜ pending |
| SET-02 | 03 | 2 | SETTINGS-02 | T-2-03 | GitHub fields save to localStorage, masked | manual | — | ❌ | ⬜ pending |
| SET-03 | 03 | 2 | SETTINGS-03 | T-2-04 | Logout clears ALL bb_* keys, redirects #setup | manual | — | ❌ | ⬜ pending |
| SET-04 | 03 | 2 | SETTINGS-04 | T-2-05 | Two-click reveal; creds preserved after reset | manual | — | ❌ | ⬜ pending |
| INV-01 | 04 | 2 | INV-01 | — | Search filters chips in real-time, no reload | manual | — | ❌ | ⬜ pending |
| INV-02 | 04 | 2 | INV-02 | — | Category select smooth-scrolls to section | manual | — | ❌ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `TEST-CHECKLIST.md` — manual checklist covering all 5 ROADMAP Phase 2 success criteria
- [ ] Per-requirement smoke-test steps for each of the 15 requirements

*No framework install needed — vanilla JS SPA with no npm. Manual checklist is the validation artifact.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Skip link saves `_skipped: true` and resumes from first skipped step | ONB-01 | No test framework; requires localStorage inspection | Navigate onboarding, skip step 5, complete to done, click "Revisit Onboarding" on dashboard — should land on step 5 |
| Slider values persist and pre-fill on return | ONB-02 | Requires GitHub API write + re-read | Complete onboarding with slider at 0.7, reload app, re-open profile — value should be 0.7 |
| Logout clears ALL bb_* keys | SETTINGS-03 | Requires DevTools localStorage inspection | Open DevTools → Application → localStorage, click Logout, confirm all bb_* keys gone |
| Reset all data preserves GitHub credentials | SETTINGS-04 | Requires localStorage inspection pre/post | Note bb_token before reset, confirm present after reset, confirm profile/inventory/recipes/barkeeper reverted to defaults |
| SHA conflict prevention on sequential writes | (internal) | Race condition only visible on concurrent writes | Trigger "Reset all data" — all 4 writes must succeed without 409 errors in DevTools network tab |

---

## Validation Sign-Off

- [ ] All tasks have manual smoke-test steps in TEST-CHECKLIST.md
- [ ] Wave 0 TEST-CHECKLIST.md created before implementation begins
- [ ] All 5 ROADMAP success criteria pass in browser
- [ ] No console errors in DevTools during happy-path walkthrough
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
