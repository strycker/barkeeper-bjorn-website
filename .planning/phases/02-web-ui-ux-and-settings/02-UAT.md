---
status: testing
phase: 02-web-ui-ux-and-settings
source: [TEST-CHECKLIST.md, 02-01-PLAN.md, 02-02-PLAN.md, 02-03-PLAN.md, 02-04-PLAN.md]
started: 2026-05-12T00:00:00Z
updated: 2026-05-12T00:00:00Z
---

## Current Test

number: 1
name: Skip-and-Return Onboarding Flow
expected: |
  Progress banner visible on dashboard after skipping a step; "Finish setup →" returns to the first skipped step, not the welcome step.
awaiting: user response

## Tests

### 1. Skip-and-Return Onboarding Flow

expected: Navigate to #onboarding, skip a step (e.g. bartender name on step 2). Continue through to "done". Navigate to #dashboard. A progress banner should be visible with "incomplete" or "Finish setup →" text. Clicking "Finish setup →" should land you on the bartender_name step — not back at the welcome step.
result: pass

### 2. Flavor Axis Sliders

expected: Steps 10–15 in onboarding (axis_sweetness through axis_risk) render a horizontal range slider — not radio buttons or A/B cards. Left and right pole labels are visible (e.g. "Dry / bone-dry" and "Sweet / balanced"). A "Middle" center label is visible below the slider track. After completing onboarding, the saved axis values in #profile are floats (0.0–1.0), not the string "Middle".
result: pass
note: axisToValue() bug fixed (TypeError on float positions) + user applied additional local fix. Profile now loads correctly.

### 3. Bjorn Avatar in Header and Onboarding Welcome

expected: With GitHub configured, the onboarding welcome step (step 1) shows a circular Bjorn avatar image with a caption below it. The app header shows a small circular avatar icon. If the image URL is broken (wrong repo), the header falls back to an SVG icon rather than showing a broken-image placeholder.
result: [pending]

### 4. Settings Page — Four Sections, Logout, and Reset

expected: The nav shows a gear icon (not "Setup") after GitHub is configured. Clicking it navigates to #settings with 4 sections: Bartender Identity, GitHub Connection, Account, Danger Zone. Renaming the bartender saves correctly with a toast. Logout shows a CSS confirmation dialog (not window.confirm()), clears all bb_* localStorage keys on confirm, and redirects to #setup. "Reset all data" requires two clicks (first click reveals confirmation); after confirm, profile/inventory/recipes/barkeeper revert to defaults but bb_token/bb_owner/bb_repo/bb_branch are preserved.
result: [pending]

### 5. Inventory Real-Time Search and Category Scroll

expected: On #inventory, a "Search inventory…" input and a category dropdown are visible above the content. Typing filters chips in real-time with no page reload — chips not matching disappear, sections with no visible chips hide their header. Clearing restores everything. Selecting a category from the dropdown smooth-scrolls to that section.
result: [pending]

### 6. Regression — No Console Errors on Any Route

expected: Navigating to #dashboard, #inventory, #recipes, #profile, #recommender, #shopping, #settings, and #onboarding produces no JS errors in the browser DevTools console.
result: [pending]

## Summary

total: 6
passed: 1
issues: 1
pending: 4
skipped: 0
blocked: 0

## Gaps

- truth: "After completing onboarding with slider-saved axis values, #profile renders with the flavor radar chart and axis sliders showing saved float values"
  status: failed
  reason: "User reported: profile menu selection broken / nothing visible. Root cause: Utils.axisToValue() called pos.toLowerCase() on a numeric float (onboarding saves raw floats, profile expects string labels). TypeError crashes render() before any HTML is set."
  severity: major
  test: 2
  fix: "utils.js axisToValue() — add typeof pos === 'number' guard before .toLowerCase() call. FIXED in this session."
  artifacts: [app/js/utils.js]
