---
status: pending
phase: 06-recipe-recommender-ux
source: [06-01-SUMMARY.md, 06-02-SUMMARY.md, 06-03-SUMMARY.md, 06-04-SUMMARY.md]
started: 2026-05-20T00:00:00Z
updated: 2026-05-20T00:00:00Z
---

## Current Test

[awaiting user]

## Tests

### 1. Recipe Card Action Buttons in Header Row (REC-10)
expected: Serve the app (`python3 -m http.server 8000`, open `http://localhost:8000/app/`) and go to the Recommender page. On any recipe card, the ♥ (heart) and ☆ (star) buttons should sit in the top card-header row alongside the recipe name — not floating in an absolutely-positioned corner. Resizing the window keeps them inline in the header.
result: pending

### 2. Heart/Star Filled vs. Open Toggle (REC-11)
expected: On a Recommender card, click the ♥ — it should fill (♥) and the recipe should appear under Recipes → Favorites. Click the now-filled ♥ again on the same card — it should revert to open (♡) and the recipe should leave Favorites. The ☆/★ star behaves identically for the Wishlist.
result: pending

### 3. "I Made This" Button Adds to made_log (RECIPE-MADE-01)
expected: On a Recommender card, click the ○ "I Made This" button — it should turn into a filled ✓ and a "Marked as made" toast appears. Go to Recipes → Made tab; the recipe should be listed there. Back on the Recommender, click the ✓ again — it removes the entry and the Made tab no longer shows it.
result: pending

### 4. Made Tab Shows made_log Most-Recent-First (RECIPE-MADE-02)
expected: Mark two different recipes as made from the Recommender (e.g. one, then another). Go to Recipes → Made. Both appear as rec-card chips, the most-recently-made on top (sorted by last_made descending). Each chip shows a green ×N times-made badge and has an × remove button that removes it from the list.
result: pending

### 5. Favorites and Wishlist Render as rec-card Chips (RECIPE-VIEW-01)
expected: Add a recipe to Favorites and another to Wishlist (via the ♥/☆ buttons on the Recommender). Go to Recipes → Favorites, then Recipes → Wishlist. Each tab shows its entries as rec-card chips (matching the Recommender card style), each with an × remove button in the corner. Ingredient chips show the first 5 then a "+N more" overflow span.
result: pending

### 6. Favorites/Wishlist Chip Opens Detail Modal (RECIPE-VIEW-02)
expected: On Recipes → Favorites, click anywhere on a chip EXCEPT the × button. The universal detail modal opens showing the recipe name, base · method · glassware meta, an ingredients table, garnish, a Times Made tally, and a Notes textarea. Clicking the ✕, the Close button, or the dark overlay outside the modal closes it.
result: pending

### 7. Recipes Page Search Filters Active Tab and Clears on Switch (RECIPE-SEARCH-01)
expected: On Recipes → Favorites, type "gin" in the search input above the tabs. Only chips whose name, base spirit, or an ingredient name contains "gin" (case-insensitive) remain visible. Click the Wishlist tab — the search input clears automatically and the Wishlist shows all its entries unfiltered.
result: pending

### 8. Recommender Page Search Filters Visible Cards (REC-SEARCH-01)
expected: On the Recommender page, type "negroni" into the search input inside the results area (above the cards). Only cards whose name, base, or an ingredient name contains "negroni" (case-insensitive) remain; non-matching cards are hidden. Clearing the box restores all cards in the current scope.
result: pending

### 9. Originals Editable in the Modal (D-06)
expected: First ensure an Original is reachable as a saved chip with `_source:'originals'` — favorite one of your Originals from the Recommender (see Test 13), then go to Recipes → Favorites and click that Original's chip. In the detail modal, the name, method, glassware, garnish, and each ingredient row should be editable `<input>` fields, with an "add ingredient" control and remove buttons per row, plus a "Save Recipe" button.
result: pending

### 10. Classics-db Chip Stays Read-Only in the Modal (D-06)
expected: Favorite a regular classics-db recipe from the Recommender, then open it from Recipes → Favorites. The detail modal shows name, method, glassware, garnish, and the ingredients table as STATIC TEXT — no input fields and no "Save Recipe" button (only Save Notes / Close in the footer). This confirms editability is gated on `_source==='originals'`.
result: pending

### 11. Editing an Original Dual-Writes Both Locations (D-06)
expected: Open an Original via a Favorites/Wishlist/Made chip (per Test 9), change a field (e.g. the method text or an ingredient amount), and click "Save Recipe". A success toast appears. Then inspect `data/recipes.json`: BOTH the matching entry in the `originals` array AND the inline copy in the list you opened it from (e.g. `confirmed_favorites`) should show the new value.
result: pending

### 12. Renaming an Original Has No Orphan/Duplicate (D-06)
expected: Open an Original via a chip, change its NAME in the modal, and Save Recipe. After saving, inspect `data/recipes.json`: the `originals` entry and the inline list copy should both carry the NEW name, and there should be NO leftover entry under the OLD name in either location (no orphaned or duplicated record).
result: pending

### 13. Originals Appear in Recommender with Amber Badge (D-07)
expected: Ensure you have at least one Original saved (Recipes → Originals tab) whose ingredients exist in your inventory. Go to the Recommender. The Original should appear mixed in with the classics-db results, carrying an amber "Your original" badge on its card.
result: pending

### 14. Original Lacking Base and Ingredients Is Excluded (D-07)
expected: Create (or note) an Original that has neither a derivable base spirit nor any ingredients. Open the Recommender — that Original should NOT appear anywhere in the results (it is filtered out before scoring). Originals that DO have a base or ingredients still appear.
result: pending

### 15. No Console Error When Recommender Renders Originals (D-07)
expected: Open browser devtools → Console. With at least one Original present, navigate to the Recommender and exercise the scope buttons. There should be NO `TypeError: cannot read 'map' of undefined` (or any uncaught error) — the `ing.keywords.map` crash on un-normalized Originals is guarded.
result: pending

### 16. Favoriting an Original Preserves _source:'originals' (D-07)
expected: On a Recommender card showing an Original (amber badge), click the ♥. Inspect `data/recipes.json` → `confirmed_favorites`: the new entry's `_source` field should be `"originals"` (NOT `"classics-db"`). Then open that entry from Recipes → Favorites — it should open in the editable modal (confirming the D-06 ↔ D-07 coupling).
result: pending

### 17. Strategy B — Inventory-Aware Original Matching (D-07)
expected: Take an Original whose ingredient names match bottles you actually own (normalize to inventory tokens) — it should appear in the buildable "You Can Make These" bucket of the Recommender. An Original whose ingredient names do NOT normalize to your inventory may not appear as buildable — this is the accepted Strategy-B tradeoff (not a bug).
result: pending

### 18. Filled State Matches by Name + Base (D-08)
expected: Favorite a recipe from the Recommender, then re-open or re-render the Recommender. That recipe's ♥ should render FILLED because the name+base match (case-insensitive) is detected via the shared comparator. The ☆ and ✓ buttons reflect Wishlist/Made membership the same way.
result: pending

### 19. Same Name, Different Base Treated as Distinct (D-08)
expected: If two recipes share the same name but have different base spirits, adding one to Favorites should NOT mark the other as already-favorited. Each can be added independently and both appear as separate entries in Recipes → Favorites.
result: pending

### 20. Toggle Never Creates a Duplicate (D-08)
expected: On a Recommender card, click ♥ to add, then click the filled ♥ to remove, then click again to re-add. Check Recipes → Favorites: the recipe appears exactly once — repeated toggling never accumulates duplicate entries.
result: pending

### 21. Same Recipe in Favorites AND Wishlist Simultaneously (D-08)
expected: On a single Recommender card, click both the ♥ and the ☆. The recipe should appear under BOTH Recipes → Favorites and Recipes → Wishlist at the same time — the two lists are independent and one does not remove from the other.
result: pending

### 22. Marking Made Again Increments times_made (D-08)
expected: Mark a recipe as made (it appears in Recipes → Made with ×1). Open that Made chip's detail modal and click [+ Made It Again]. The Times Made tally increments to ×2 (the `.rdm-tally-count` updates live without closing the modal), and inspecting `data/recipes.json` → `made_log` shows a SINGLE entry with `times_made: 2` — not a duplicated row.
result: pending

## Summary

total: 22
passed: 0
issues: 0
pending: 22
skipped: 0

## Gaps

[none yet]
