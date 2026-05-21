---
status: testing
phase: 06-recipe-recommender-ux
source: [06-01-SUMMARY.md, 06-02-SUMMARY.md, 06-03-SUMMARY.md, 06-04-SUMMARY.md]
started: 2026-05-20T00:00:00Z
updated: 2026-05-20T12:00:00Z
---

## Current Test

number: 16
name: Favoriting an Original Preserves _source:'originals' (D-07)
expected: |
  On a Recommender card showing an Original (amber badge), click the ♥. Inspect `data/recipes.json` → `confirmed_favorites`: the new entry's `_source` field should be `"originals"` (NOT `"classics-db"`). Then open that entry from Recipes → Favorites — it should open in the editable modal (confirming the D-06 ↔ D-07 coupling).
awaiting: user response

## Tests

### 1. Recipe Card Action Buttons in Header Row (REC-10)
expected: Serve the app (`python3 -m http.server 8000`, open `http://localhost:8000/app/`) and go to the Recommender page. On any recipe card, the ♥ (heart) and ☆ (star) buttons should sit in the top card-header row alongside the recipe name — not floating in an absolutely-positioned corner. Resizing the window keeps them inline in the header.
result: pass
note: Buttons sit inline in the header row as expected. Cosmetic follow-up logged in Gaps (heart/star icon shape + ellipse).

### 2. Heart/Star Filled vs. Open Toggle (REC-11)
expected: On a Recommender card, click the ♥ — it should fill (♥) and the recipe should appear under Recipes → Favorites. Click the now-filled ♥ again on the same card — it should revert to open (♡) and the recipe should leave Favorites. The ☆/★ star behaves identically for the Wishlist.
result: pass

### 3. "I Made This" Button Adds to made_log (RECIPE-MADE-01)
expected: On a Recommender card, click the ○ "I Made This" button — it should turn into a filled ✓ and a "Marked as made" toast appears. Go to Recipes → Made tab; the recipe should be listed there. Back on the Recommender, click the ✓ again — it removes the entry and the Made tab no longer shows it.
result: issue
reported: "Almost works. I'm able to mark as made, but I cannot seem to un-check it. I cannot remove it from the Made list, either. I get an error 'Save failed: data/recipes.json does not match <sha> — reload the page to refresh file state, then try again.' Refreshing the page does seem to help, but things are slow."
severity: major

### 4. Made Tab Shows made_log Most-Recent-First (RECIPE-MADE-02)
expected: Mark two different recipes as made from the Recommender (e.g. one, then another). Go to Recipes → Made. Both appear as rec-card chips, the most-recently-made on top (sorted by last_made descending). Each chip shows a green ×N times-made badge and has an × remove button that removes it from the list.
result: pass

### 5. Favorites and Wishlist Render as rec-card Chips (RECIPE-VIEW-01)
expected: Add a recipe to Favorites and another to Wishlist (via the ♥/☆ buttons on the Recommender). Go to Recipes → Favorites, then Recipes → Wishlist. Each tab shows its entries as rec-card chips (matching the Recommender card style), each with an × remove button in the corner. Ingredient chips show the first 5 then a "+N more" overflow span.
result: pass
note: Chips render correctly with × remove and ingredient overflow. Gap logged: Recipes-page chips are missing the ♥/☆/✓ action buttons present on Recommender cards — no way to move a recipe between lists (e.g. Favorites → Wishlist) from the Recipes page. Chip standardization deferred to future phase.

### 6. Favorites/Wishlist Chip Opens Detail Modal (RECIPE-VIEW-02)
expected: On Recipes → Favorites, click anywhere on a chip EXCEPT the × button. The universal detail modal opens showing the recipe name, base · method · glassware meta, an ingredients table, garnish, a Times Made tally, and a Notes textarea. Clicking the ✕, the Close button, or the dark overlay outside the modal closes it.
result: pass

### 7. Recipes Page Search Filters Active Tab and Clears on Switch (RECIPE-SEARCH-01)
expected: On Recipes → Favorites, type "gin" in the search input above the tabs. Only chips whose name, base spirit, or an ingredient name contains "gin" (case-insensitive) remain visible. Click the Wishlist tab — the search input clears automatically and the Wishlist shows all its entries unfiltered.
result: pass

### 8. Recommender Page Search Filters Visible Cards (REC-SEARCH-01)
expected: On the Recommender page, type "negroni" into the search input inside the results area (above the cards). Only cards whose name, base, or an ingredient name contains "negroni" (case-insensitive) remain; non-matching cards are hidden. Clearing the box restores all cards in the current scope.
result: pass
note: Search filter works. User reiterated that owned Campari recipes still show as "missing 1 bottle" — already covered by the deferred inventory synonym/lookup item (Test 5 feedback).

### 9. Originals Editable in the Modal (D-06)
expected: First ensure an Original is reachable as a saved chip with `_source:'originals'` — favorite one of your Originals from the Recommender (see Test 13), then go to Recipes → Favorites and click that Original's chip. In the detail modal, the name, method, glassware, garnish, and each ingredient row should be editable `<input>` fields, with an "add ingredient" control and remove buttons per row, plus a "Save Recipe" button.
result: pass
note: Editable Originals modal works from a Favorites chip. User notes the Originals-tab chip shows different fields than the Favorites-tab chip — reinforces the deferred unified-schema requirement (one JSON shape + one chip render everywhere).

### 10. Classics-db Chip Stays Read-Only in the Modal (D-06)
expected: Favorite a regular classics-db recipe from the Recommender, then open it from Recipes → Favorites. The detail modal shows name, method, glassware, garnish, and the ingredients table as STATIC TEXT — no input fields and no "Save Recipe" button (only Save Notes / Close in the footer). This confirms editability is gated on `_source==='originals'`.
result: pass

### 11. Editing an Original Dual-Writes Both Locations (D-06)
expected: Open an Original via a Favorites/Wishlist/Made chip (per Test 9), change a field (e.g. the method text or an ingredient amount), and click "Save Recipe". A success toast appears. Then inspect `data/recipes.json`: BOTH the matching entry in the `originals` array AND the inline copy in the list you opened it from (e.g. `confirmed_favorites`) should show the new value.
result: pass

### 12. Renaming an Original Has No Orphan/Duplicate (D-06)
expected: Open an Original via a chip, change its NAME in the modal, and Save Recipe. After saving, inspect `data/recipes.json`: the `originals` entry and the inline list copy should both carry the NEW name, and there should be NO leftover entry under the OLD name in either location (no orphaned or duplicated record).
result: issue
reported: "Partially -- the name change works for the Original tab, but it does not update the cocktail name if that chip was also a Favorite or Wishlist. Please keep everything in sync and update ALL locations for this cocktail."
severity: major
note: User deferred the fix to a future phase — do not fix during Phase 6 verification.

### 13. Originals Appear in Recommender with Amber Badge (D-07)
expected: Ensure you have at least one Original saved (Recipes → Originals tab) whose ingredients exist in your inventory. Go to the Recommender. The Original should appear mixed in with the classics-db results, carrying an amber "Your original" badge on its card.
result: pass

### 14. Original Lacking Base and Ingredients Is Excluded (D-07)
expected: Create (or note) an Original that has neither a derivable base spirit nor any ingredients. Open the Recommender — that Original should NOT appear anywhere in the results (it is filtered out before scoring). Originals that DO have a base or ingredients still appear.
result: pass
note: Exact precondition (an ingredient-free Original) is impossible to create — save validation correctly rejects an Original with no ingredients, enforcing the constraint at the save layer (equivalent protection to engine-side filtering). User ran the related check: an Original with a nonsensical ingredient does NOT appear under "You Can Make These" and correctly appears under the missing-1-ingredient scope. Intent satisfied.

### 15. No Console Error When Recommender Renders Originals (D-07)
expected: Open browser devtools → Console. With at least one Original present, navigate to the Recommender and exercise the scope buttons. There should be NO `TypeError: cannot read 'map' of undefined` (or any uncaught error) — the `ing.keywords.map` crash on un-normalized Originals is guarded.
result: pass

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
passed: 13
issues: 2
pending: 7
skipped: 0

## Gaps

- truth: "Toggling 'I Made This' on/off and removing from Made tab works without SHA conflict errors"
  status: open
  reason: "User (Test 3): marking as made works, but un-toggling and removing from Made tab fails with 'Save failed: data/recipes.json does not match <sha>' — stale SHA after rapid successive saves. Page reload fixes it but is slow."
  severity: major
  test: 3
  artifacts: []
  missing: ["State.save() SHA conflict handling — stale SHA after back-to-back saves not fully resolved by BUG-03 retry-on-409"]

- truth: "Renaming an Original updates the name in EVERY location it appears — originals array AND all inline list copies (confirmed_favorites, wishlist, made_log)"
  status: open
  reason: "User (Test 12): renaming an Original updates the originals entry and the list it was opened from, but a copy of that same recipe living in OTHER lists (e.g. it was both a Favorite and a Wishlist item) keeps the OLD name. Dual-write only touches the single list the modal was opened from, not all lists containing the recipe."
  severity: major
  test: 12
  artifacts: []
  missing: ["Save-Recipe rename propagation across ALL inline list copies (confirmed_favorites + wishlist + made_log), matched by old name+base probe"]

- truth: "Recipes-page chips show the same action buttons (♥/☆/✓) as Recommender cards, allowing cross-list moves from the Recipes page"
  status: open
  reason: "User (Test 5): no heart/star/checkmark on Recipes-page chips — can't move a recipe from Favorites to Wishlist without going back to the Recommender. Chip render is split across two code paths; needs a single shared chip routine."
  severity: major
  test: 5
  artifacts: []
  missing: ["Shared chip render function used by both Recommender and Recipes views", "Action buttons (♥/☆/✓) on Recipes-page chips with toggle/move behavior"]

- truth: "Heart and star action-button icons are visually balanced (1:1 aspect ratio, similar size, no ellipse/circle background)"
  status: cosmetic
  reason: "User (Test 1): dislikes the ellipse around the heart/star; heart is elongated. Wants ~1:1 aspect ratio and size matched to the star."
  severity: cosmetic
  test: 1
  artifacts: []
  missing: []

## Deferred (future phases)

- Recipes should be uniformly chip-based across all views, and chips should surface tally counts and other stats (times-made, etc.) beyond just the Made tab. Noted during Test 1; aligns with Phase 6 mental model "chips are the interface" — carry into a later phase.
- Originals schema parity (noted Test 2, reinforced Test 9): clicking "Confirmed Built"/mark-made on an Original (via its edit/detail modal) does NOT add it to the Made tab and shows no tally. Likely root cause: Originals don't carry the same JSON fields as classics/saved chips (e.g. _source, base, made-tracking fields). User confirmed at Test 9 that the Originals-tab chip displays different fields than the same recipe's Favorites-tab chip. CAPABILITY REQUIREMENT for a future phase: define ONE canonical recipe-chip JSON schema and use it EVERYWHERE — Originals, Favorites, Wishlist, Made, and Recommendations — so every chip carries identical fields, renders through one shared routine, and made-tracking/tally works uniformly across all views. Audit all current recipe sources and backfill missing fields on both Originals and non-Originals. User explicitly deferred — do not fix during Phase 6 verification.
- DB access/update UX smoothness (noted Test 3): State.save() SHA conflicts cause save failures when saves happen in rapid succession — the in-memory SHA goes stale. User requests a future phase revisit of how databases are accessed and updated to make the UX smoother (less stale-SHA errors, faster saves). Do not fix during Phase 6 verification.
- Unified chip render + cross-list actions (noted Test 5): Recipes-page chips (Favorites/Wishlist/Made) and Recommender cards share no render code and diverge in capability. Future phase: extract a single shared chip component used by both views, with ♥/☆/✓ action buttons that allow toggling and moving recipes between lists without returning to the Recommender.
- Inventory synonym/alias lookups (noted Test 5 feedback): Recommender treats ingredient names too literally. Future phase: add a synonym/alias layer so that owning "limes" implies "lime juice", owning "Cointreau", "Grand Marnier", or "Triple Sec" implies "Orange Liqueur", etc. Also fix Campari and Rye (and similar spirits the user owns) not being matched correctly — appearing as "One Bottle Away" or missing when they are in the inventory.
- Bartender specialty as ranking weight, not filter (noted Test 5 feedback): The Bartender Specialty setting currently narrows results too aggressively, acting as a filter. Future phase: convert it to a scoring weight that reorders recommendations rather than excluding recipes. Add a Specialty selector panel to the Recommender sidebar (alongside Mood and Occasion sliders) with options: "Equal Weight" (default) + each specialty; selected specialty boosts score but does not exclude.
- Full cross-list rename/edit sync (noted Test 12): When an Original (or any recipe) is edited/renamed, the change must propagate to EVERY location the recipe appears — the originals array plus all inline copies in confirmed_favorites, wishlist, and made_log — not just the single list the modal was opened from. Future phase: make Save-Recipe update all matching copies (by old name+base probe) and avoid orphans/duplicates everywhere. Related to the unified-schema requirement.
- Recipe image upload (noted Test 13): Allow uploading an image per recipe. Display full-size when a chip is clicked (in the detail modal) and as a thumbnail on the chip otherwise. Images live in a `data/recipe_images/` subdirectory; recipe chip JSON references only the filename. On upload, auto-rename the file to the recipe's unique id (e.g. `cocktail1778776984398.png`) preserving the original extension (.png/.jpg/etc), not the display name. Future phase.
- AI recipe discovery ("Use AI to get more recipes") (noted Test 5 feedback): Add a button near the top of the Recommender page that queries the Claude API using the user's current preference state (sweetness, acidity, complexity, season, risk tolerance, base spirit, occasion, specialty). New recipes returned by the AI are merged into the shared classics-db recipe library so they are discoverable by all users and persist across sessions. This feature becomes more important as the platform grows to multiple users sharing a common recipe library.
