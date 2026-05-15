---
phase: 04-inventory-recommender-depth
plan: 01
subsystem: data-layer
tags: [inventory, schema, recommender-engine, migration, bug-fix, normalize, classics-db]
dependency_graph:
  requires: []
  provides: [normalize-v2, engine-subtype-guard, engine-twoaway, classics-tags, schema-v2]
  affects: [04-02-inventory-ui, 04-03-recommender-ui]
tech_stack:
  added: []
  patterns:
    - coerceBottle migration strategy (normalize-on-save, idempotent)
    - spirit subtype guard in _hasIngredient
    - twoAway cumulative scope tier
    - fixed 10-tag taxonomy for recipe classification
key_files:
  created: []
  modified:
    - app/js/normalize.js
    - app/js/recommender-engine.js
    - app/js/classics-db.js
    - schema/inventory.schema.json
decisions:
  - "Kept coerceBottleArray as separate helper (distinct from coerceBottle); grep -c 'function coerceBottle' returns 2 due to substring match — not a duplicate definition"
  - "Japanese Whisky Highball keywords tightened to ['japanese whisky', 'japanese whiskey', 'japanese'] based on recipe name/occasion clearly indicating Japanese-specific"
  - "62 recipes tagged (not 75 as plan stated); plan appears to have overcounted — no recipes were added or removed"
  - "Penicillin: removed 'whisky' from both Scotch ingredient entries (main and Islay float)"
metrics:
  duration: ~45 minutes
  completed_date: "2026-05-15"
  tasks_completed: 4
  tasks_total: 4
  files_modified: 4
---

# Phase 4 Plan 01: Wave 1 Foundation — normalize, engine, classics-db, schema

One-liner: Migrated bottle schema to {style} shape, fixed BUG-02 Scotch false positives via subtype guard, added twoAway tier to recommender, tagged all 62 classics-db recipes with fixed taxonomy, updated JSON schema.

## Tasks Completed

### Task 1: normalize.js coerceBottle update (already committed prior to execution start)

Changes in `app/js/normalize.js`:
- `coerceBottle()` rewritten to produce `{style, created_at, updated_at}` shape
- Migration path: `string → {style}`, `{name} → {style}` (deletes `name` key), `{style} → unchanged`
- `OLD_TIER_VALUES` set (`industrial`, `premium-accessible`, `boutique`, `rare/exceptional`) — clears tier to `''` on migration
- `VALID_STRAINERS` set (`Hawthorne`, `Julep`, `Fine Mesh`, `Conical`) — filters equipment.strainers allow-list
- Equipment block always emitted (unconditional), with filtered strainers
- Commit: `72f8c39` (pre-existing)

### Task 2: recommender-engine.js — lc(), subtype guard, twoAway

Changes in `app/js/recommender-engine.js`:
- `lc()` updated: `s?.style ?? s?.name ?? String(s ?? '')` — handles both old `{name}` and new `{style}` bottle shapes
- `SUBTYPE_TOKENS` constant added: `['scotch', 'bourbon', 'rye', 'japanese', 'irish', 'canadian']`
- `_hasIngredient()` rewritten: pre-computes `ingredientSubtypes` from keyword list; if ingredient has subtype keywords (e.g. `scotch`), matched inventory item MUST contain at least one of those subtypes — prevents `'whisky'` substring matching Japanese Whisky against Scotch recipes (BUG-02)
- `recommend()` extended: added `const twoAway = []`; `missing.length === 2` branch pushes to twoAway with `missingIngredients: missing`; sorts by flavorScore desc; return changed to `{ buildable, oneAway, twoAway }`
- oneAway entries now also include `missingIngredients: missing` for uniform UI rendering
- Commit: `321e3b7`

### Task 3: classics-db.js — tags array + BUG-02 keyword tightening

Changes in `app/js/classics-db.js`:
- Added `tags: [...]` after `occasion` field on all 62 recipes
- All tags drawn from fixed 10-tag taxonomy: `aperitif`, `after-dinner`, `cozy`, `refreshing`, `brunch`, `party`, `spirit-forward`, `sour`, `tropical`, `classic`
- Rob Roy (`id: 'rob-roy'`): removed `'whisky'` from Scotch ingredient keywords; retained `['scotch', 'islay', 'speyside', 'highland', 'blended']`
- Penicillin (`id: 'penicillin'`): removed `'whisky'` from both Scotch ingredient entries (main blended Scotch and optional Islay float)
- Japanese Whisky Highball (`id: 'whiskey-highball'`): tightened to `['japanese whisky', 'japanese whiskey', 'japanese']` — recipe name and occasion clearly Japanese-specific
- Old Fashioned, Manhattan, Boulevardier, Whiskey Sour, Gold Rush, Whiskey Smash: broad whiskey keywords retained unchanged
- Commit: `dd2087a`

### Task 4: schema/inventory.schema.json — bottleEntry update + equipment

Changes in `schema/inventory.schema.json`:
- `bottleEntry.required` changed from `["name"]` to `["style"]`
- Added properties: `style`, `type`, `brand`, `tier`, `best_for`, `notes`, `created_at`, `updated_at`
- `tier` enum: `["", "well", "standard", "premium", "craft", "boutique", "rare/exceptional"]`
- `best_for` enum: `["", "sipping", "mixing", "both"]` — empty string for unset
- `name` property retained as optional for backward compatibility during migration window
- Added top-level `equipment` property with `strainers` array constrained to `["Hawthorne", "Julep", "Fine Mesh", "Conical"]`
- Commit: `a876dd1`

## Tag Distribution Table

| Tag | Count | Sample Recipes |
|-----|-------|----------------|
| classic | 38 | Old Fashioned, Manhattan, Negroni, Daiquiri, Margarita |
| sour | 24 | Whiskey Sour, Gimlet, Daiquiri, Cosmopolitan, Paper Plane |
| refreshing | 21 | Tom Collins, Mojito, Paloma, Whiskey Smash, Moscow Mule |
| after-dinner | 13 | Old Fashioned, Manhattan, Boulevardier, Espresso Martini |
| spirit-forward | 11 | Old Fashioned, Negroni, Gin Martini, Adonis, Toronto |
| party | 14 | Tom Collins, Mojito, Margarita, Dark & Stormy, Aperol Spritz |
| aperitif | 8 | Negroni, Gin Martini, Americano, Aperol Spritz, Adonis |
| tropical | 3 | Jungle Bird, Mai Tai, Dark & Stormy |
| cozy | 5 | Boulevardier, Mezcal Old Fashioned, Cognac Old Fashioned, Oaxacan Old Fashioned |
| brunch | 5 | French 75, Ramos Gin Fizz, Corpse Reviver #2, Clover Club, Tequila Sunrise |

## Tag Judgment Calls

- **Cynar Spritz**: Tagged `aperitif` + `refreshing` — more unusual/bitter than Aperol Spritz but same pre-dinner role
- **Siesta**: Tagged `sour` + `refreshing` — Campari presence makes it borderline aperitif, but citrus-driven shaken profile tips to sour
- **El Diablo**: Tagged `refreshing` + `party` — casual highball, tiki-adjacent but not tropical enough for `tropical`
- **Stinger**: Tagged `after-dinner` + `classic` — digestif role, spirit-forward but crème de menthe makes it non-standard
- **Vermouth Cassis**: Tagged `aperitif` + `refreshing` — classic French café low-ABV opener
- **Toronto**: Tagged `after-dinner` + `spirit-forward` — Fernet-Branca defines the digestif register

## BUG-02 Verification

After keyword tightening and subtype guard:
- Rob Roy keywords: `['scotch', 'islay', 'speyside', 'highland', 'blended']` — no bare `'whisky'`
- Penicillin keywords (main): `['scotch', 'blended']` — no bare `'whisky'`
- Penicillin keywords (Islay float): `['islay', 'scotch', 'laphroaig', 'ardbeg', 'lagavulin']` — no bare `'whisky'`
- Engine subtype guard: when ingredient has `scotch` in keywords, inventory item must also contain `scotch` — Japanese Whisky cannot match Scotch-keyed ingredients

## Deviations from Plan

### Minor: coerceBottle grep count

**Found during:** Task 1 acceptance criteria check
**Issue:** `grep -c "function coerceBottle"` returns `2` because `coerceBottleArray` also contains the substring. Plan expected `1`.
**Resolution:** This is a grep pattern issue in the acceptance criteria — there is exactly ONE `coerceBottle(entry)` function definition. `coerceBottleArray` is a separate helper. No code change needed.
**Impact:** None — code is correct.

### Minor: Recipe count is 62, not 75

**Found during:** Task 3 — counting recipes in classics-db.js
**Issue:** Plan says "all 75 classics-db.js recipes" but the file contains exactly 62 recipes.
**Resolution:** Tagged all 62 present recipes. Plan appears to have overestimated the database size. No recipes were added or removed.
**Impact:** None — all present recipes tagged, count is consistent before and after.

## Known Stubs

None. All data transformations wire to real data; no UI rendering in this plan.

## Self-Check: PASSED

Files verified:
- app/js/normalize.js — exists, contains OLD_TIER_VALUES, VALID_STRAINERS, coerceBottle with {style} migration, equipment strainer filter
- app/js/recommender-engine.js — exists, contains s?.style ?? s?.name, SUBTYPE_TOKENS, ingredientSubtypes guard, twoAway array, return { buildable, oneAway, twoAway }
- app/js/classics-db.js — exists, 62 ids = 62 tags, Rob Roy and Penicillin have no bare 'whisky'
- schema/inventory.schema.json — exists, valid JSON, style in required, tier enum has 6 new values + empty, equipment.strainers present

Commits verified:
- 72f8c39 feat(normalize): update coerceBottle for new bottle schema
- 321e3b7 fix(engine): update lc() for style field + add subtype guard + twoAway
- dd2087a feat(classics-db): add tags array to all 62 recipes + tighten Scotch keywords
- a876dd1 feat(schema): update inventory schema for new bottle fields and equipment
