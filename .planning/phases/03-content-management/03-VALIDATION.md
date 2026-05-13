---
phase: 3
slug: content-management
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-13
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> This project is a no-build vanilla JS SPA — no automated test framework exists.
> All verification is manual (smoke-test checklist). Pattern mirrors Phase 2 (02-00-PLAN.md).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — vanilla JS, no build step |
| **Config file** | none |
| **Quick run command** | `python3 -m http.server 8000` then open http://localhost:8000/app/ |
| **Full suite command** | Manual smoke-test checklist (03-00-PLAN.md TEST-CHECKLIST.md) |
| **Estimated runtime** | ~15 minutes (manual browser walkthrough) |

---

## Sampling Rate

- **After every plan wave:** Manual browser smoke test for that wave's surfaces
- **Before `/gsd:verify-work`:** Full checklist must be green
- **Max feedback latency:** End of each wave

---

## Per-Task Verification Map

| Surface | Plan | Wave | Requirement | Test Type | Verification |
|---------|------|------|-------------|-----------|-------------|
| New Recipe button + form renders | 03-02 | 1 | RECIPE-01, RECIPE-04 | manual | Click "New Recipe" → form appears in-place; no route change |
| Required field gate | 03-02 | 1 | RECIPE-01 | manual | Submit with empty name → toast error; form stays open |
| Edit button + pre-filled form | 03-02 | 1 | RECIPE-02 | manual | Recipe detail → click Edit → form pre-filled; Save → detail re-renders |
| Image upload UI | 03-02 | 1 | RECIPE-03 | manual | Recipe detail → choose file → spinner → image appears below |
| AI prompt field (new recipe only) | 03-02 | 1 | RECIPE-05 | manual | New Recipe form has prompt field; Edit form does not |
| AI generate (key present) | 03-03 | 2 | RECIPE-05 | manual | Enter prompt → spinner → fields populate; key absent → button hidden |
| AI key field in Settings | 03-03 | 2 | RECIPE-05 | manual | Settings → AI Integration section → save key → persists across reload |
| ZIP export download | 03-01 | 1 | EXPORT-01 | manual | Export → ZIP file downloads; open ZIP → 4 JSON files present |
| AI-context text export | 03-01 | 1 | EXPORT-02 | manual | Export for AI → .md file downloads; contains persona + inventory + recipes |
| ZIP import file picker | 03-01 | 1 | EXPORT-03 | manual | Import → file picker → valid ZIP → preview panel shows 4 files |
| ZIP import drag-and-drop | 03-01 | 1 | EXPORT-03 | manual | Drag ZIP onto drop zone → same preview panel |
| Import confirm → writes to GitHub | 03-01 | 1 | EXPORT-03 | manual | Confirm Import → 4 API writes → toast success → State reloads |
| Import preview lists files | 03-01 | 1 | EXPORT-04 | manual | Preview panel lists each of the 4 file names with overwrite warning |
| Invalid ZIP rejected | 03-01 | 1 | EXPORT-03 | manual | Non-ZIP file → toast error; no writes |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Wave 0 creates the TEST-CHECKLIST.md before implementation begins.

- [ ] `03-00-PLAN.md` executed — TEST-CHECKLIST.md present at `.planning/phases/03-content-management/TEST-CHECKLIST.md`
- [ ] Checklist covers all 14 verification rows above
- [ ] Dev server confirmed reachable (`python3 -m http.server 8000`)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Recipe form in-place replacement (no route change) | RECIPE-01, D-01 | Browser URL bar / hash state; not scriptable without browser automation | Open Recipe Book → click New Recipe → confirm `#recipes` hash unchanged; form visible in content area |
| Image renders immediately post-upload | RECIPE-03, D-06 | Requires live GitHub API + raw.githubusercontent CDN propagation | Upload an image → confirm `<img>` src appears within ~2 seconds |
| Drag-and-drop drop zone visual feedback | EXPORT-03, D-09 | CSS dragover state only detectable during a real drag gesture | Drag a file over the drop zone → border turns amber (`var(--amber)`) |
| Anthropic API key masked in Settings | RECIPE-05, D-14 | Input type="password" not visually verifiable without rendering | Settings → AI Integration → key field shows ••• not raw text |
| ZIP import sequential write (no 409) | EXPORT-03, D-08 | Race condition — only reproducible with real GitHub API timing | Import a ZIP → open DevTools Network → confirm 4 PUT calls are sequential, each 200 |

---

## Validation Sign-Off

- [ ] TEST-CHECKLIST.md created in Wave 0 (plan 03-00)
- [ ] All Wave 1 surfaces manually smoke-tested before Wave 2 begins
- [ ] All 5 manual-only verifications walkthrough complete
- [ ] No 409 SHA conflict errors observed during import
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
