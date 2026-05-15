---
status: testing
phase: 04-inventory-recommender-depth
source: [04-01-SUMMARY.md, 04-02-SUMMARY.md, 04-03-SUMMARY.md]
started: 2026-05-15T00:00:00Z
updated: 2026-05-15T00:00:00Z
---

## Current Test

number: 1
name: Structured Bottle Chips Display
expected: |
  Open the Inventory page. Bottle entries show as clickable chips with the spirit name as primary text. If a brand is set, it appears below the name in smaller muted text. A small colored dot on the chip indicates tier (well=gray, standard=green, premium=blue, craft=amber, boutique=purple, rare/exceptional=bright amber-gold). Unset tier shows a hollow/transparent dot. Old string-only entries still display without errors.
awaiting: user response

## Tests

### 1. Structured Bottle Chips Display
expected: Open the Inventory page. Bottle entries show as clickable chips with the spirit name as primary text. If a brand is set, it appears below the name in smaller muted text. A small colored dot on the chip indicates tier (well=gray, standard=green, premium=blue, craft=amber, boutique=purple, rare/exceptional=bright amber-gold). Unset tier shows a hollow/transparent dot. Old string-only entries still display without errors.
result: pass
note: chip click was broken (container ReferenceError) — fixed before pass

### 2. Inline Edit Form — Open & Fields
expected: Click a bottle chip body (not the × button). An edit form expands below the chip grid. The form shows Style (text input) and Type (text input with datalist) by default. Clicking "More fields ▾" reveals Brand, Tier (dropdown with 6 options + Unset), Best for, and Notes textarea. The toggle label changes to "Fewer fields ▴".
result: pass

### 3. Save Bottle & Revert Changes
expected: With an edit form open, change the style or tier, then click "Save Bottle". The chip updates in place (no delete/re-add). Dirty indicator appears. Open the form again and change something, then click "Revert Changes". The field snaps back to its value from when you first opened the form. No dirty state is triggered on revert.
result: pass

### 4. Canonical Name Suggestion Banner
expected: In an inventory section's add-bottle input, type a near-miss name (e.g., "Camprai" instead of "Campari", or "Apretol" for "Aperol"). A banner appears below the input reading "Did you mean: [Canonical Name]? [Use it]". Clicking "Use it" fills the input with the canonical name. Typing the exact canonical name shows no banner.
result: [pending]

### 5. Equipment Tab — Strainer Grid
expected: Navigate to the Inventory page and click the "Equipment" tab (4th tab). The tab shows a 2-column grid with 4 checkboxes: Hawthorne, Julep, Fine Mesh, Conical. Checking or unchecking one marks the inventory as dirty (save bar appears). After saving, the checked state persists on next load.
result: [pending]

### 6. BUG-02 Fix — Scotch Recipes Don't Match Japanese Whisky
expected: In Recommender, if your only whisky is a Japanese Whisky (e.g., Suntory Toki), recipes like Rob Roy and Penicillin (which require Scotch) should NOT appear in "You Can Make These". Recipes that accept any whisky (Old Fashioned, Whiskey Sour, Manhattan) should still appear. Verify by checking what shows up with only Japanese Whisky in your inventory.
result: [pending]

### 7. Recommender Two-Column Layout
expected: Navigate to the Recommender page. On a wide screen (>860px), the page shows a sidebar on the left (~280px) containing mood controls, and the recipe cards in a wider column on the right. On a narrow screen (<860px), the sidebar stacks above the cards in a single column.
result: [pending]

### 8. Mood Sliders — Ephemeral Re-Ranking
expected: The Recommender sidebar shows 6 sliders: Sweetness, Acid, Strength, Complexity, Season, Risk — pre-loaded from your saved profile. Drag a slider to a new position and release. The recipe cards re-rank immediately. Your saved profile is NOT changed (verified by navigating away and back — sliders reset to saved values).
result: [pending]

### 9. Scope Toggle — Cumulative Sections
expected: The sidebar has three scope buttons: "You Can Make These", "One Bottle Away", "Two Bottles Away". Initially only "You Can Make These" recipes show. Click "One Bottle Away" — a second section appears below showing recipes missing exactly one ingredient, with a badge count and the missing bottle name on each card. Click "Two Bottles Away" — a third section appears below showing recipes missing exactly two ingredients, each with two missing-ingredient rows and shopping list links. Clicking "You Can Make These" again collapses back to buildable-only.
result: [pending]

### 10. Occasion Filter Chips
expected: Below the scope toggle in the sidebar, occasion chips appear (e.g., "Classic", "Sour", "Refreshing", "After-Dinner", "Party"). Clicking a chip filters the recipe cards to only recipes tagged with that occasion. Multiple chips can be active at once (OR logic). Clicking "All" resets the filter.
result: [pending]

### 11. Save to Profile & Reset to Saved
expected: In the Recommender, move one or more mood sliders. Click "Save to Profile". A success toast appears and the new slider values are now the saved baseline. Navigate away and back — sliders initialize to the new saved values. Alternatively, after moving sliders, click "Reset to saved" — sliders snap back to the baseline without a page reload.
result: [pending]

### 12. Two-Away Shopping List Links
expected: With the scope set to "Two Bottles Away", find a recipe card in that section. Each missing ingredient row has a "+ Add to shopping list" link. Clicking one appends that ingredient to your Shopping tab list (check the Shopping tab to confirm). The link works for both missing ingredient rows on the same card.
result: [pending]

## Summary

total: 12
passed: 0
issues: 0
pending: 12
skipped: 0
blocked: 0

## Gaps

[none yet]
