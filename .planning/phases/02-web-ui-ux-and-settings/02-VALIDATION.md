---
phase: 2
slug: web-ui-ux-and-settings
status: validated
nyquist_compliant: false
wave_0_complete: true
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
| **Quick run command** | `bash app/tests/phase-02-checks.sh` (55 static analysis checks) |
| **Full suite command** | Manual checklist — see `.planning/phases/02-web-ui-ux-and-settings/TEST-CHECKLIST.md` |
| **Estimated runtime** | < 5 seconds (static analysis script); ~5–10 minutes (manual browser walkthrough) |

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
| ONB-01 | 01 | 1 | ONB-01 | — | Skip saves `_skipped: true`, no data loss | manual | — | — | ⬜ pending |
| ONB-02 | 01 | 1 | ONB-02 | — | Slider float 0–1, "Middle" label at 0.5 | automated | `bash app/tests/phase-02-checks.sh 2>&1 \| grep ONB-02` | ✅ | ✅ green |
| ONB-03 | 01 | 1 | ONB-03 | — | Bartender steps at positions 2–4 | automated | `bash app/tests/phase-02-checks.sh 2>&1 \| grep ONB-03` | ✅ | ✅ green |
| ONB-04 | 01 | 1 | ONB-04 | T-2-01 | Comma-parse → chip preview → save to unassigned | automated | `bash app/tests/phase-02-checks.sh 2>&1 \| grep ONB-04` | ✅ | ✅ green |
| NAV-01 | 02 | 1 | NAV-01 | — | Avatar img with fallback to SVG on error | automated | `bash app/tests/phase-02-checks.sh 2>&1 \| grep NAV-01` | ✅ | ✅ green |
| NAV-02 | 02 | 1 | NAV-02 | — | Hero image above greeting; collapses on 404 | automated | `bash app/tests/phase-02-checks.sh 2>&1 \| grep NAV-02` | ✅ | ✅ green |
| NAV-03 | 02 | 1 | NAV-03 | — | Bjorn avatar on welcome step with caption | automated | `bash app/tests/phase-02-checks.sh 2>&1 \| grep NAV-03` | ✅ | ✅ green |
| NAV-04 | 02 | 2 | NAV-04 | — | 7-item grid; disabled cards show toast | automated | `bash app/tests/phase-02-checks.sh 2>&1 \| grep NAV-04` | ✅ | ✅ green |
| NAV-05 | 02 | 2 | NAV-05 | — | Gear icon replaces Setup post-config | automated | `bash app/tests/phase-02-checks.sh 2>&1 \| grep NAV-05` | ✅ | ✅ green |
| SET-01 | 03 | 2 | SETTINGS-01 | T-2-02 | Bartender rename saves to barkeeper.json | automated | `bash app/tests/phase-02-checks.sh 2>&1 \| grep SETTINGS-01` | ✅ | ✅ green |
| SET-02 | 03 | 2 | SETTINGS-02 | T-2-03 | GitHub fields save to localStorage, masked | automated | `bash app/tests/phase-02-checks.sh 2>&1 \| grep SETTINGS-02` | ✅ | ✅ green |
| SET-03 | 03 | 2 | SETTINGS-03 | T-2-04 | Logout clears ALL bb_* keys, redirects #setup | automated | `bash app/tests/phase-02-checks.sh 2>&1 \| grep SETTINGS-03` | ✅ | ✅ green |
| SET-04 | 03 | 2 | SETTINGS-04 | T-2-05 | Two-click reveal; creds preserved after reset | automated | `bash app/tests/phase-02-checks.sh 2>&1 \| grep SETTINGS-04` | ✅ | ✅ green |
| INV-01 | 04 | 2 | INV-01 | — | Search filters chips in real-time, no reload | automated | `bash app/tests/phase-02-checks.sh 2>&1 \| grep INV-01` | ✅ | ✅ green |
| INV-02 | 04 | 2 | INV-02 | — | Category select smooth-scrolls to section | automated | `bash app/tests/phase-02-checks.sh 2>&1 \| grep INV-02` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `TEST-CHECKLIST.md` — manual checklist covering all 5 ROADMAP Phase 2 success criteria
- [x] Per-requirement smoke-test steps for each of the 15 requirements

*No framework install needed — vanilla JS SPA with no npm. Static analysis script + manual checklist are the validation artifacts.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Skip link saves `_skipped: true` and resumes from first skipped step | ONB-01 | Requires browser + localStorage DevTools inspection; not automatable without a browser test runner | Navigate onboarding, skip step 2 (bartender_name), complete to done, navigate to #dashboard — click "Finish setup →" and verify it lands on bartender_name step, not welcome |
| Slider values persist and pre-fill on return | ONB-02 (supplemental) | Requires GitHub API write + re-read | Complete onboarding with sweetness slider at 0.7, reload app, re-open profile — float value should be 0.7 |
| Logout clears ALL bb_* keys (runtime check) | SETTINGS-03 (supplemental) | Requires DevTools localStorage inspection during live session | Open DevTools → Application → Local Storage, click Log out, confirm all bb_* keys gone |
| Reset all data preserves GitHub credentials | SETTINGS-04 (supplemental) | Requires localStorage inspection pre/post | Note bb_token before reset, confirm present after reset, confirm profile/inventory/recipes/barkeeper reverted to defaults |
| SHA conflict prevention on sequential writes | (internal) | Race condition only visible on concurrent writes | Trigger "Reset all data" — all 4 writes must succeed without 409 errors in DevTools network tab |

---

## Validation Sign-Off

- [x] All tasks have manual smoke-test steps in TEST-CHECKLIST.md
- [x] Wave 0 TEST-CHECKLIST.md created before implementation begins
- [ ] All 5 ROADMAP success criteria pass in browser (manual — pending browser test)
- [ ] No console errors in DevTools during happy-path walkthrough
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** partial — 14/15 requirements have automated static analysis checks (55/55 passing); ONB-01 manual only

---

## Validation Audit 2026-05-12

| Metric | Count |
|--------|-------|
| Gaps found | 15 |
| Resolved (automated) | 14 |
| Escalated (manual-only) | 1 |
| Static analysis checks | 55 |
| Checks passing | 55 |
