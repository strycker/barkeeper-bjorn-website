---
phase: 03-content-management
plan: "00"
subsystem: docs
tags: [test-checklist, manual-verification, phase-3]
requires: []
provides:
  - .planning/phases/03-content-management/TEST-CHECKLIST.md
affects:
  - "Phase 3 verification gate (used before /gsd:verify-work)"
tech-stack:
  added: []
  patterns:
    - "Manual smoke-test checklist mirroring Phase 2 TEST-CHECKLIST.md structure"
key-files:
  created:
    - .planning/phases/03-content-management/TEST-CHECKLIST.md
  modified: []
decisions:
  - "Cloned Phase 2 checklist structure: setup → wave sections → manual-only table → sign-off"
  - "Organized rows by wave (Wave 1: 03-01 Export/Import + 03-02 Recipe Form; Wave 2: 03-03 AI) so testers verify Wave 1 before Wave 2"
  - "Included all 9 requirement IDs (RECIPE-01–05, EXPORT-01–04) as section headers for traceability"
metrics:
  duration_minutes: 2
  completed_date: 2026-05-14
  tasks_completed: 1
  files_created: 1
  files_modified: 0
requirements:
  - RECIPE-01
  - RECIPE-02
  - RECIPE-03
  - RECIPE-04
  - RECIPE-05
  - EXPORT-01
  - EXPORT-02
  - EXPORT-03
  - EXPORT-04
---

# Phase 3 Plan 00: Content Management Test Checklist Summary

**One-liner:** Phase 3 manual smoke-test checklist with 87 checkbox rows mapped to RECIPE-01–05 and EXPORT-01–04, covering Wave 1 (03-01 export/import, 03-02 recipe form) and Wave 2 (03-03 AI integration).

## What Was Built

Created `.planning/phases/03-content-management/TEST-CHECKLIST.md` — the manual verification gate for Phase 3. The checklist clones the proven Phase 2 structure and is organized by wave so testers verify Wave 1 plans before Wave 2:

- **Setup section** — dev server, PAT, prerequisite recipe
- **Wave 1 — Export/Import (plan 03-01)** — EXPORT-01 ZIP export, EXPORT-02 AI-context text, EXPORT-03 import via file picker/drag-and-drop/invalid rejection, EXPORT-04 single-confirm UX
- **Wave 1 — Recipe Form (plan 03-02)** — RECIPE-04 new button, RECIPE-01 create + D-02 required-field validation, RECIPE-02 edit + back-button behavior, RECIPE-03 image upload regression, RECIPE-05 AI prompt no-key state
- **Wave 2 — AI Integration (plan 03-03)** — Settings AI Integration section, RECIPE-05 generate happy-path, generate error handling
- **Manual-only verifications table** — 5 behaviors that require browser observation (route-stable form, raw GitHub URL, dragover border, key masking, 409-free sequential writes)
- **Sign-off section** — wave gating + 409 confirmation

## Verification

| Check | Expected | Actual |
|-------|----------|--------|
| File exists | yes | yes |
| Checkbox count (`- [ ]`) | ≥ 40 | 87 |
| Contains "EXPORT-01" | yes | yes |
| Contains "RECIPE-05" | yes | yes |
| Contains "Confirm Import" | yes | yes |
| Contains "sequential" | yes | yes |

## Deviations from Plan

None — plan executed exactly as written. The plan's `<action>` block contained the complete checklist content; it was written verbatim.

## Decisions Made

- Followed plan's prescribed content exactly (no creative edits) since checklist text is the contract
- Used Phase 2 TEST-CHECKLIST.md as the structural model (same heading levels, status key, sign-off block)

## Known Stubs

None.

## Commits

- `ae749b4` — docs(03-00): add Phase 3 manual smoke-test checklist

## Self-Check: PASSED

- FOUND: .planning/phases/03-content-management/TEST-CHECKLIST.md
- FOUND: commit ae749b4
- Acceptance criteria: 87 ≥ 40 checkboxes ✓; all required strings present ✓
