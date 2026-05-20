---
phase: 06
slug: 06-recipe-recommender-ux
status: pending
created: 2026-05-20
---

# Phase 6 — Manual Test Checklist

> Single source-of-truth manual checklist for verifying Phase 6 (Recipe & Recommender UX)
> before `/gsd-verify-work`. There is **no automated test framework** in this project
> (vanilla ES6+ static SPA — no build step, no npm, no Jest/Vitest/Playwright). All
> behavioral validation is manual browser UAT. Items are grouped by source artifact.
> Each `- [ ]` is a discrete behavior; tick it once verified in the browser at
> `python3 -m http.server 8000` → `http://localhost:8000/app/`.
>
> For the unambiguous, step-by-step browser procedures behind these items, see
> `06-UAT.md` in this directory.

---

## 0. Pre-UAT Automated Gate (run before any manual UAT)

These are the only mechanical checks available for a no-framework SPA: ES module
syntax validation plus the inline engine smoke test from 06-03. Run them from the repo
root. All must pass before starting the manual UAT below.

- [ ] `node --check app/js/utils.js` exits 0 (syntax valid — `Utils.sameRecipe` added in 06-01)
- [ ] `node --check app/js/views/recipes.js` exits 0 (editable modal + dual-write, 06-02)
- [ ] `node --check app/js/views/recommender.js` exits 0 (badge + opts.originals call sites, 06-03)
- [ ] `node --check app/js/recommender-engine.js` exits 0 (`normalizeOriginal` + crash guard, 06-03)
- [ ] Inline engine smoke test (06-03 Task 1): a normalized Original with synthesized
      `keywords`/`searchIn` is scored by `RecommenderEngine.recommend(..., {originals:[...]})`
      WITHOUT throwing `TypeError: cannot read 'map' of undefined` (the `ing.keywords.map`
      crash, RESEARCH Pitfall A / T-06-06 is guarded with `|| []`).

---

## A. ROADMAP Requirements (8) — DONE, shipped with file:line evidence

These eight requirements were implemented and committed before the Phase 6 plan cycle
(verified live in RESEARCH.md). Tick each after confirming the behavior in-browser; the
evidence column is the implementation site.

- [ ] **REC-10** — ♥ ☆ action buttons live in the `rec-card-header` flex row (not `position:absolute`). Evidence: `recommender.js:84-88`.
- [ ] **REC-11** — ♥/☆ render filled vs. open based on Favorites/Wishlist membership; clicking a filled icon removes. Evidence: `recommender.js:84-88` / `recommender.js:307-355`.
- [ ] **RECIPE-MADE-01** — ✓/○ "I Made This" third action button on every Recommender card adds to `made_log[]`; toggling removes. Evidence: `recommender.js:87` / `recommender.js:357-381`.
- [ ] **RECIPE-MADE-02** — "Made" tab in Recipes view lists `made_log` as rec-card chips, most-recent-first by `last_made`, each with a × remove button. Evidence: `recipes.js:289-349`.
- [ ] **RECIPE-VIEW-01** — Favorites and Wishlist tabs render as `rec-card` chips with × remove. Evidence: `recipes.js:231-287`.
- [ ] **RECIPE-VIEW-02** — Favorites/Wishlist chips are clickable and open the universal detail modal (ingredients table, method, glassware). Evidence: `recipes.js:271-273` / `recipes.js:351-473`.
- [ ] **RECIPE-SEARCH-01** — Search input above the Recipes tabs filters the active tab (name/base/ingredient, case-insensitive) and clears on tab switch. Evidence: `recipes.js:49-63`.
- [ ] **REC-SEARCH-01** — Search input on the Recommender page filters within the current scope's visible cards. Evidence: `recommender.js:487-493`.

---

## B. Prior Gap Tasks (3) — DONE

The three "Open Questions" from the original research pass are resolved in committed
code (RESEARCH addendum correction note).

- [ ] **Originals-tab search works** — typing in the Recipes search box filters the Originals tab via `_filterRecipes`. Evidence: `recipes.js:179`.
- [ ] **Schema updated** — `schema/recipes.schema.json` declares `made_log` and the full inline `savedRecipe`/`wishlist` shape. Evidence: `schema/recipes.schema.json:39-43,134-174`.
- [ ] **Modal live tally refresh** — `.rdm-tally-count` updates after [+ Made It Again] within a single open session (no close/reopen). Evidence: `recipes.js:437-447`.

---

## C. D-06 — Originals Editable in the Universal Modal (dual-write)

Pulled from RESEARCH "New-Decision Requirements → Test Map" (4 D-06 rows). Implemented
in 06-02 (`showRecipeDetail` editable branch + `.rdm-save-recipe` dual-write).

- [ ] **D-06 editable inputs for Originals** — opening an Original via a Favorites/Wishlist/Made chip (an entry whose `_source === 'originals'`) renders name, ingredients (add/remove rows), method, glassware, and garnish as editable `<input>` fields.
- [ ] **D-06 read-only for non-Originals** — opening a `classics-db` (or undefined-source) chip shows those fields as static text with no inputs (existing behavior preserved byte-for-byte).
- [ ] **D-06 dual-write on Save Recipe** — editing an Original in the modal and clicking Save Recipe updates BOTH `recipes.originals` (canonical, matched by `id` with name+base fallback) AND the inline list copy. Inspect `data/recipes.json` (or re-open the chip) to confirm both locations changed.
- [ ] **D-06 rename safety** — editing the NAME of an Original and saving produces no orphaned or duplicate entry; the inline copy is renamed in place (old name+base captured before edits are applied, RESEARCH Pitfall C).

---

## D. D-07 — Originals in the Recommender (Strategy B, inventory-aware)

Pulled from RESEARCH "New-Decision Requirements → Test Map" (4 D-07 rows) plus a
Strategy-B-specific item. NOTE: 06-03 implemented **Strategy B (inventory-aware)** per the
locked D-07 decision — Originals are normalized (`normalizeOriginal`) and matched against
real inventory, NOT treated as always-buildable.

- [ ] **D-07 Originals appear with amber badge** — user-authored Originals are mixed into Recommender results, each carrying an amber "Your original" badge. Evidence: `recommender-engine.js` `normalizeOriginal` + `.rec-original-badge`.
- [ ] **D-07 exclusion rule** — an Original with no derivable base AND no ingredients is excluded from the Recommender (filtered before scoring).
- [ ] **D-07 no console crash** — rendering the Recommender with Originals present produces no `TypeError` (the `ing.keywords.map` crash is guarded; check devtools console).
- [ ] **D-07 favorite preserves provenance** — favoriting an Original from a Recommender card stores `_source:'originals'` (not the old hardcoded `'classics-db'`), so it subsequently opens editable per D-06. Inspect `data/recipes.json`.
- [ ] **D-07 / Strategy B inventory match** — an Original whose ingredient names normalize to owned inventory tokens appears in the buildable bucket; one whose ingredients don't normalize may NOT appear buildable (accepted Strategy-B tradeoff per 06-03).

---

## E. D-08 — Duplicate Guard (name + base, case-insensitive)

Pulled from RESEARCH "New-Decision Requirements → Test Map" (5 D-08 rows). Implemented in
06-01 via the shared `Utils.sameRecipe(a, b)` comparator.

- [ ] **D-08 filled state by name+base** — ♥/☆/✓ render filled when the recipe is already in the corresponding list, matched by name AND base case-insensitively (`Utils.sameRecipe`).
- [ ] **D-08 same-name/different-base distinct** — two recipes sharing a name but with different base spirits are treated as distinct; both can be added independently.
- [ ] **D-08 toggle never duplicates** — clicking a filled button removes the entry; clicking again re-adds it — the list never accumulates a duplicate.
- [ ] **D-08 Favorites AND Wishlist coexist** — the same recipe can be in Favorites and Wishlist simultaneously (the lists are independent; no cross-removal).
- [ ] **D-08 made-again increments** — marking an already-made recipe again via the modal increments `times_made` rather than creating a duplicate `made_log` row.

---

## F. Known Cosmetic Notes (accepted — verify they are present but harmless)

These are accepted tradeoffs flagged in RESEARCH; tick to confirm each behaves as the
documented (non-blocking) quirk, not a regression.

- [ ] **Pitfall F (accepted)** — Originals show an "Advanced" difficulty chip because `difficulty` is undefined (`_difficultyLabel(undefined)` → "Advanced"). Cosmetic only.
- [ ] **Pitfall B (accepted)** — an Original with a prose-string `profile` scores a neutral 0.5 in mood/occasion ranking (string profile yields 0.5, no crash). Originals therefore do not rank by mood.

---

*Phase 6 manual checklist — pair with `06-UAT.md` for executable browser procedures.*
