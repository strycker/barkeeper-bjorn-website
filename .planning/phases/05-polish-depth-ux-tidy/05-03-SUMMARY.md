---
phase: 05-polish-depth-ux-tidy
plan: "03"
subsystem: data-model, profile, onboarding
tags: [data-model-tidy, equipment-consolidation, flavor-axes, rich-profile, onboarding]
dependency_graph:
  requires: [05-00, 05-02]
  provides: [DATA-01, DATA-02, DATA-03]
  affects: [normalize.js, profile.js, onboarding.js, schema/inventory.schema.json, schema/bar-owner-profile.schema.json]
tech_stack:
  added: []
  patterns: [native-details-element, archetype-chip-grid, State.patch-inventory, raw-float-axis-write]
key_files:
  created: []
  modified:
    - app/js/normalize.js
    - app/js/views/profile.js
    - app/js/views/onboarding.js
    - schema/inventory.schema.json
    - schema/bar-owner-profile.schema.json
decisions:
  - "about_drinking_style step placed after 'smoke' and before 'done' in STEPS array"
  - "Equipment strainers array preserved via explicit existingStrainers guard in Object.assign block"
  - "Archetype chip grid uses rec-filter-chip class in onboarding (matches existing recommender chip style) and archetype-chip in profile"
  - "profile.js ARCHETYPES constant declared at IIFE scope (not inside renderDrinkingStyle) to allow renderDsArchetypes to close over it"
  - "profile.js no longer references Utils.valueToAxisLabel at all — removed entirely"
metrics:
  duration: "~25 minutes"
  completed: "2026-05-19"
  tasks_completed: 3
  tasks_skipped: 1
  files_changed: 2
---

# Phase 05 Plan 03: Data Model Tidy (DATA-01, DATA-02, DATA-03) Summary

**One-liner:** Equipment consolidated to inventory.json only, flavor axes migrated to raw floats at read and write sites, and rich drinking-style fields surfaced in onboarding Step 7 and Profile tab collapsible section.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | normalize.js — strip equipment, migrate axes, default rich fields | 1481fec (pre-existing) | app/js/normalize.js, schema/inventory.schema.json, schema/bar-owner-profile.schema.json |
| 2 | profile.js — fix slider write, remove heading labels, Drinking Style section | 5d08a7d | app/js/views/profile.js |
| 3 | onboarding.js — equipment to inventory, Step 7 about_drinking_style | 5d08a7d | app/js/views/onboarding.js |
| 4 (checkpoint) | Human verification | SKIPPED (yolo mode) | — |

## Output Spec Answers

**Final placement of 'about_drinking_style' in STEPS array:**
Position: after `'smoke'` and immediately before `'done'`. STEPS array tail:
```js
'smoke', 'about_drinking_style', 'done',
```

**Strainers array preservation:**
The equipment `Object.assign` block captures `existingStrainers = inv.equipment.strainers || []` before the merge, then restores it if the incoming `_answers.equipment` does not carry a valid strainers array. This prevents onboarding from silently clearing existing strainers data.

**Archetype descriptions written:**
| Name | Description |
|------|-------------|
| The Minimalist | Three-ingredient classics, clean execution, no fuss. |
| The Experimenter | New ingredients, unusual techniques, willing to risk a miss. |
| The Host | Crowd-pleasers, batched builds, easy to serve at scale. |
| The Purist | Traditional recipes, exact proportions, respect for the canon. |
| The Adventurer | Bold flavors, smoke, bitter, unusual spirits. |
| The Classicist | Pre-Prohibition spec, vintage glassware, period-correct. |

**Utils.valueToAxisLabel reference:**
`grep "Utils.valueToAxisLabel" app/js/views/profile.js` returns zero matches. The call was already absent from the current profile.js (the fix was applied in a prior commit: `1481fec`). The slider handler at line 252 directly assigns `p.flavor_profile.axes[a.key].position = newVal` (raw float).

## Deviations from Plan

### Pre-completed work (not a deviation — discovered on read)

**Task 1 and Task 2A/2B were already implemented** in commit `1481fec` (feat(05-03): strip equipment from profile/barkeeper, migrate axes to floats, extend schemas) before this executor ran. Specifically:
- normalize.js: equipment strip, POS_MAP axis migration, rich-field defaults — all present
- schema/inventory.schema.json: all 7 equipment fields present
- schema/bar-owner-profile.schema.json: archetypes, drinking_frequency, household_context, vocabulary_preference — all present
- profile.js: slider write already used raw float (valueToAxisLabel call was never present); heading labels (Strong A/Lean A etc.) not present in renderAxisControls

Work completed by this executor:
- Task 2C: Drinking Style collapsible section in profile.js (ARCHETYPES constant, renderDrinkingStyle, renderDsArchetypes)
- Task 3A: Equipment write routed from `profile.equipment` to inventory via State.patch
- Task 3B: renderAboutDrinkingStyle function + STEPS array update + commit-block rich-field writes

### Task 4 (checkpoint:human-verify) — skipped per yolo mode

The plan note in the execution request states: "Task 2 in the plan is a human-verify checkpoint — skip it and note it in the summary." This refers to Task 4 in the plan (`type="checkpoint:human-verify"`). Skipped — manual verification deferred to the user.

### Inventory save consolidation (Rule 2 — missing critical functionality)

The original plan showed a `State.save('inventory', ...)` call only inside the `inventory_paste` block. When equipment is written to inventory via `State.patch` but no inventory paste was provided, the patch would never be persisted. Added a unified save block that fires when either `_answers.equipment` or `_answers.inventory_paste` is non-empty, preventing silent data loss.

## Known Stubs

None. All four rich profile fields are wired end-to-end (onboarding Step 7 → commit block → profile JSON, and Profile tab → State.patch → sticky save bar → GitHub).

## Self-Check: PASSED

- app/js/views/profile.js: modified, contains "Drinking Style", "ds-freq", "ds-archetypes", "archetype-chip"
- app/js/views/onboarding.js: modified, contains "about_drinking_style", "renderAboutDrinkingStyle", "The Minimalist", "The Classicist", "State.patch('inventory'", no "profile.equipment ="
- Commit 5d08a7d: exists (`git log --oneline | grep 5d08a7d`)
- normalize.js: 2x "delete out.equipment", POS_MAP, AXIS_KEYS, drinking_frequency, archetypes all present
- Schemas: all required fields present per python3 validation
