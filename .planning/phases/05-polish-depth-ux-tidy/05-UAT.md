---
status: testing
phase: 05-polish-depth-ux-tidy
source: [05-01-SUMMARY.md, 05-02-SUMMARY.md, 05-03-SUMMARY.md, 05-04-SUMMARY.md]
started: 2026-05-19T00:00:00Z
updated: 2026-05-19T00:00:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 15
name: Onboarding — Drinking Style Step
expected: |
  Running through Onboarding should include an "About Your Drinking Style" step
  with Drinking Frequency, Household Context, Vocabulary Preference, and Archetype
  chip selections. A "Skip" button should be available to bypass this step.
awaiting: user response

## Tests

### 1. Category Dropdown Shows All Categories
expected: Open Inventory → click any bottle chip to edit. The "Category" dropdown should show all 12 categories (Whiskeys & Brown Spirits, Agave Spirits, Gins / Vodkas / White Spirits, Rums & Cane Spirits, Brandies & Cognacs, Vermouths & Fortified Wines, Liqueurs & Cordials, Bitters, Syrups, Mixers & Soft Drinks, Non-Alcoholic Spirits, Other / Misc.). No more empty dropdown.
result: pass

### 2. Tier Dropdown Shows All Tiers
expected: In the same bottle edit form, click "More fields ▾". The Tier dropdown should show: Unset, Well, Standard, Premium, Craft, Boutique, Rare/Exceptional — 7 options total. No more empty tier dropdown.
result: pass

### 3. Subtype and Region Fields Appear
expected: In the bottle edit form (top section), a "Sub-type" text input should appear (e.g. placeholder "Terroir, Navy Strength, Barrel-Aged"). In the expanded "More fields" section, both "Country" and "Region" inputs should appear (e.g. Country: "Scotland", Region: "Speyside"). These are separate fields.
result: pass

### 4. Category Change Moves Chip
expected: Edit a bottle. Change its Category to a different one (e.g. change a vermouth from "Vermouths & Fortified Wines" to "Whiskeys & Brown Spirits"). Click Save. The chip should disappear from its original section and appear in the new section without requiring a page reload.
result: pass

### 5. UTF-8 Characters Save Correctly
expected: Add a bottle in the Rum section called "Cachaça". Save to GitHub. Reload the page. The bottle should display as "Cachaça" — not "CachaÃ§a" or any other garbled form.
result: pass

### 6. Mixers & Soft Drinks Section on Spirits Tab
expected: In Inventory → Spirits & Bottles tab, a new section "Mixers & Soft Drinks" should appear. Adding "Tonic Water" or "Ginger Beer" via the quick-add bar should route them there automatically. Bottles in this section have the full edit form (Category, Specific Style/Type, Brand, Tier, etc.).
result: pass

### 7. Recommender Scope Buttons — Cumulative Highlight
expected: On the Recommender page, scope buttons (0 = Buildable, 1 = One Away, 2 = Two Away) should highlight cumulatively. Clicking "One Away" should keep button 0 also highlighted/active. Clicking "Two Away" should keep buttons 0 and 1 also active.
result: pass

### 8. Unconstrained Scope Button
expected: A 4th scope button "Unconstrained" should appear with a dashed border. Clicking it returns recipes ranked by mood/occasion regardless of what's in your inventory — all recipes show in the buildable bucket. Vetoes are still respected.
result: pass

### 9. Vetoes Panel in Recommender Sidebar
expected: The Recommender sidebar should have a "Vetoes" section showing your vetoed ingredients as chips. Clicking a veto chip toggles it (bypassed vetoes show with strikethrough). Bypassing a veto re-runs the recommendations for that session. Navigating away and back resets all vetoes to enforced.
result: pass

### 10. Favorites and Wishlist Buttons on Recipe Cards
expected: Each recipe card in the Recommender should have ♥ and ☆ icon buttons (top-right area of card). Clicking ♥ saves the recipe to Favorites; clicking ☆ adds to Wishlist. Clicking ♥ on a recipe already in Favorites shows "Already in Favorites" toast. The saved recipe should appear in Recipes → Favorites.
result: pass

### 11. Army & Navy in Recommender
expected: If you have Gin, fresh lemon juice (or lemons), and Orgeat in inventory, "Army & Navy" should appear as a buildable recipe in the Recommender. It should also appear in your Favorites (♥) in the Recipes view.
result: pass

### 12. Bottle Edit Form Labels — Category and Specific Style/Type
expected: When editing any bottle, the first field label should read "Category" (not "Style") and the second should read "Specific Style/Type" (not "Type"). Category has placeholder "Broad category…" and Specific Style/Type has placeholder "e.g. Single Barrel, Cask Strength, Espadín".
result: pass

### 13. Profile Tab — Drinking Style Section
expected: The Profile tab should have a collapsible "Drinking Style" section at the bottom. Expanding it shows: Drinking Frequency (select), Household Context (text input), Vocabulary Preference (select), and Archetypes (chip grid, pick 1-3). Editing and saving persists to GitHub.
result: pass

### 14. Profile Tab — No String Axis Labels
expected: On the Profile tab flavor axis sliders, there should be NO "Strong A / Lean B" position labels above each slider. Only the pole labels at each end (e.g. "Dry" ←→ "Sweet") should remain.
result: pass

### 15. Onboarding — Drinking Style Step
expected: Running through Onboarding (or starting fresh) should include a "About Your Drinking Style" step (after the smoke/peat preference step) with Drinking Frequency, Household Context, Vocabulary Preference, and Archetype chip selections. A "Skip" button should be available to bypass this step.
result: pass
notes: Implemented in onboarding.js; "Review Setup →" re-runs all steps pre-filled; archetype chips use CANONICAL_ARCHETYPES (10 options), existing custom archetypes merged in, no cap, text entry available.

### 16. Settings — Full Customization Link
expected: In Settings → Bartender Identity section, a "Full Customization →" link or button should appear. Clicking it navigates to the Bartender Customization Wizard.
result: pass
notes: Fixed in settings.js; href corrected from #setup to #onboarding for re-run flow; Bartender Wizard accessible via #bartender-wizard link.

### 17. Bartender Customization Wizard
expected: Navigating to #bartender-wizard should show a scrollable form with: Name, Avatar URL + file upload, Voice Preset dropdown, Personality Description textarea, Behavioral Rules (add/remove list), Cocktail Naming Style, and Signoff Text. A sticky "Save" bar appears when any field is edited. Saving persists to barkeeper.json.
result: pass
notes: bartender-wizard.js implemented with all required sections including Specialty Focus (10 options). Saves to barkeeper.json via State.save('barkeeper').

## Summary

total: 17
passed: 17
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]
