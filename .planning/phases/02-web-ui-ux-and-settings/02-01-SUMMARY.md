---
phase: 02-web-ui-ux-and-settings
plan: 01
subsystem: onboarding
tags: [onboarding, wizard, sliders, skip-logic, inventory-paste]

# Dependency graph
requires:
  - phase: 02-web-ui-ux-and-settings
    provides: TEST-CHECKLIST.md (plan 00)
provides:
  - 17-step onboarding wizard (welcome, 3 bartender steps, 4 identity steps, inventory_paste, 6 axes, smoke, done)
  - Skip-and-return logic persisting skip flags to profile.identity, barkeeper._skipped, profile.flavor_profile.axes
  - Flavor axis steps rendering range sliders with pole labels and "Middle" center label
  - Bjorn avatar on welcome step (barkeeper_bjorn_001.png, 120×120 circle with amber border)
  - inventory_paste step writing items to inventory.unassigned (not inventory.spirits)
  - onboarding_complete: true written to profile on done step

key-files:
  created:
    - ".planning/phases/02-web-ui-ux-and-settings/02-01-SUMMARY.md"
  modified:
    - "app/js/views/onboarding.js"
    - "app/css/app.css"

requirements-completed: [ONB-01, ONB-02, ONB-03, ONB-04, NAV-03]
---

# Phase 02 Plan 01: Onboarding Wizard Overhaul

**Restructured the onboarding wizard from 14 steps to 17 steps: added bartender personalization steps, replaced A/B axis option cards with range sliders, wired skip-and-return behavior, and added the Bjorn avatar to the welcome step.**

## Accomplishments

- Expanded STEPS array to 17: welcome → bartender_name/voice/specialty → your_name/location/background/equipment → inventory_paste → 6 axis steps → smoke → done
- Skip-and-return (ONB-01): every non-welcome/non-done step shows "Skip for now →"; resume-from-skipped scans all three skip-flag locations on render(); skip flags persisted to State and State.save() so they survive navigation
- Flavor axis sliders (ONB-02): renderAxisStep() replaced A/B cards with `<input type="range">` sliders; pole labels (.axis-pole-label--left/.right) and "Middle" center label (.axis-slider-center-label) added
- Bartender name step (ONB-03): "What should I call myself?" at position 2 with text input
- Inventory paste step (ONB-04): textarea on step 9; comma-split on blur produces bottle-chip preview; writes to inventory.unassigned via State.patch + State.save
- Bjorn avatar (NAV-03): welcome step renders barkeeper_bjorn_001.png (120×120px, amber border circle) with caption from UI-SPEC copywriting contract
- saveAnswers() extended to write bartender fields to barkeeper.json and set onboarding_complete: true
- New CSS classes: .wizard-avatar-wrap, .wizard-avatar, .wizard-avatar-caption, .axis-slider-group, .axis-slider-poles, .axis-pole-label--left/right, .axis-slider-center-label, .wizard-paste-wrap, .wizard-paste-hint, .wizard-chip-preview

## Key Decisions

- inventory.unassigned (not inventory.spirits) — canonical per Phase 2 research decision
- Skip flags persisted via State.save() (not just in-memory) so resume-from-skipped works after navigation
- parseFloat() always used for axis values — never strings
- `_track_deprecated` guard in renderStepBody() skips any step key starting with `_`; track step removed from STEPS array but renderTrack() kept for backward compat

---

*Phase: 02-web-ui-ux-and-settings*
*Completed: 2026-05-12*
