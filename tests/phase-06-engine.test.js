// Phase 6 (Recipe & Recommender UX) engine/pure-function tests.
// Covers: D-08 (Utils.sameRecipe), D-07 (Originals normalization + scoring,
// empty exclusion, crash guard), and two regression fixes in this session
// (lc() reads bottle `type`; bare 'amaro' keyword removed from Amaro Nonino).
// Run with: node tests/phase-06-engine.test.js

'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Stub browser globals (utils.js / engine only touch these INSIDE functions)
global.window = {};
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
global.document = { getElementById: () => null };

// Load order: classics-db first (engine reads CLASSICS_DB global at call time),
// then the engine, then utils. Each lands its const on globalThis.
vm.runInThisContext(fs.readFileSync(path.resolve(__dirname, '../app/js/classics-db.js'), 'utf8'));
vm.runInThisContext(fs.readFileSync(path.resolve(__dirname, '../app/js/recommender-engine.js'), 'utf8'));
vm.runInThisContext(fs.readFileSync(path.resolve(__dirname, '../app/js/utils.js'), 'utf8'));

// Empty inventory skeleton matching the real nested structure (see phase-05-engine.test.js).
function emptyInventory() {
  return {
    base_spirits: {
      white_spirits: [], whiskey: [], rum: [], agave: [], brandy: [], other: [],
    },
    fortified_wines_and_aperitif_wines: [],
    liqueurs_and_cordials: {
      fruit_forward: [], nut_coffee: [], herbal: [], specialty_regional: [],
    },
    bitters: {
      anchors: [], aromatic_smoke: [], nut_earth: [], fruit_botanical: [], other: [],
    },
    syrups: [],
    mixers_bottles: [], non_alcoholic_spirits: [],
    mixers: [], refrigerator_perishables: [], pantry_spice_rack: [],
    fresh_produce: [], specialty_ingredients: [], garnish_and_service: [],
    vetoes: { disliked_ingredients: [], substitute_for_now: [] },
    shopping_list: [], unassigned: [],
  };
}

// Search every result bucket for a recipe name. Returns the bucket name or null.
function bucketOf(result, name) {
  for (const bucket of ['buildable', 'oneAway', 'twoAway']) {
    if ((result[bucket] || []).some(i => i.recipe && i.recipe.name === name)) return bucket;
  }
  return null;
}

// ------------------------------------------------------------------
// D-08: Utils.sameRecipe(a, b)
// ------------------------------------------------------------------

test('D-08: sameRecipe true for same name + base, case-insensitive', () => {
  assert.equal(
    Utils.sameRecipe({ name: 'Negroni', base: 'Gin' }, { name: 'negroni', base: 'gin' }),
    true
  );
});

test('D-08: sameRecipe false for same name but different base', () => {
  assert.equal(
    Utils.sameRecipe({ name: 'Martini', base: 'Gin' }, { name: 'Martini', base: 'Vodka' }),
    false
  );
});

test('D-08: sameRecipe is null-safe and treats missing fields as empty', () => {
  assert.doesNotThrow(() => Utils.sameRecipe(null, {}));
  assert.doesNotThrow(() => Utils.sameRecipe({}, {}));
  // null normalizes to {}, so both sides have name='' base='' -> equal.
  assert.equal(Utils.sameRecipe(null, {}), true);
  assert.equal(Utils.sameRecipe({}, {}), true);
});

// ------------------------------------------------------------------
// D-07: normalizeOriginal synthesizes engine-shaped matching metadata
// ------------------------------------------------------------------

test('D-07: normalizeOriginal synthesizes _source, keywords, searchIn, base', () => {
  const raw = {
    id: 'x', name: 'Test',
    ingredients: [{ name: 'Bourbon' }, { name: 'Lemon Juice' }],
  };
  const norm = RecommenderEngine.normalizeOriginal(raw);

  assert.equal(norm._source, 'originals');
  // base falls back to first ingredient name when absent
  assert.equal(norm.base, 'Bourbon');
  assert.equal(norm.ingredients.length, 2);
  for (const ing of norm.ingredients) {
    assert.ok(Array.isArray(ing.keywords) && ing.keywords.length > 0,
      `ingredient "${ing.name}" must have a non-empty keywords array`);
    assert.ok(Array.isArray(ing.searchIn) && ing.searchIn.length > 0,
      `ingredient "${ing.name}" must have a non-empty searchIn array`);
  }
});

// ------------------------------------------------------------------
// D-07: a matching Original is scored into the recommend() pool
// ------------------------------------------------------------------

test('D-07: a matching Original appears in recommend() results (added to pool)', () => {
  const inventory = emptyInventory();
  inventory.base_spirits.whiskey = [{ style: 'Whiskeys & Brown Spirits', type: 'Bourbon' }];
  inventory.fresh_produce = ['Lemon'];

  const original = {
    id: 'orig-1', name: 'My Bourbon Sour',
    ingredients: [{ name: 'Bourbon' }, { name: 'Lemon' }],
  };

  const result = RecommenderEngine.recommend(inventory, null, { scope: 3, originals: [original] });
  assert.ok(bucketOf(result, 'My Bourbon Sour'),
    'matching Original must appear in some results bucket (it was added to the scoring pool)');
});

// ------------------------------------------------------------------
// D-07: an empty Original (no base, no ingredients) is excluded
// ------------------------------------------------------------------

test('D-07: an empty Original (no base, no ingredients) is excluded from all buckets', () => {
  const inventory = emptyInventory();
  const empty = { id: 'e', name: 'Empty', ingredients: [] };

  const result = RecommenderEngine.recommend(inventory, null, { scope: 3, originals: [empty] });
  assert.equal(bucketOf(result, 'Empty'), null,
    'an Original with no base and no ingredients must NOT appear in any bucket');
});

// ------------------------------------------------------------------
// D-07 / T-06-06: raw (un-normalized) Original must not crash recommend()
// ------------------------------------------------------------------

test('D-07/T-06-06: raw Original ingredients lacking keywords/searchIn do not crash recommend()', () => {
  const inventory = emptyInventory();
  inventory.base_spirits.whiskey = [{ style: 'Whiskeys & Brown Spirits', type: 'Bourbon' }];

  // Ingredient objects with NO keywords and NO searchIn (raw shape).
  const rawish = {
    id: 'raw', name: 'Rawish Original', base: 'Bourbon',
    ingredients: [{ name: 'Bourbon' }],
  };

  let result;
  assert.doesNotThrow(() => {
    result = RecommenderEngine.recommend(inventory, null, { scope: 0, originals: [rawish] });
  }, 'recommend() must not throw on raw Original ingredients');
  assert.ok(result && Array.isArray(result.buildable),
    'recommend() must still return a well-formed result object');
});

// ------------------------------------------------------------------
// REGRESSION: lc() matches bottle `type`, not just `style`.
// Old Fashioned needs Bourbon + Simple Syrup + Angostura Bitters.
// Bourbon stored object-shaped with the specific spirit in `type`.
// ------------------------------------------------------------------

test('REGRESSION: object-shaped Bourbon bottle (spirit in `type`) makes Old Fashioned buildable', () => {
  const inventory = emptyInventory();
  // Specific spirit in `type`, broad category in `style` — the bug read only `style`.
  inventory.base_spirits.whiskey = [{ style: 'Whiskeys & Brown Spirits', type: 'Bourbon' }];
  inventory.syrups = [{ style: 'Simple Syrup' }];
  inventory.bitters.anchors = [{ style: 'Angostura' }];

  const result = RecommenderEngine.recommend(inventory, null, { scope: 0 });
  const oldFashioned = (result.buildable || []).find(i => i.recipe && i.recipe.name === 'Old Fashioned');

  assert.ok(oldFashioned !== undefined,
    `"Old Fashioned" must be buildable with object-shaped Bourbon (type='Bourbon'). ` +
    `Found in bucket: ${bucketOf(result, 'Old Fashioned')}`);
});

// ------------------------------------------------------------------
// REGRESSION: bare 'amaro' keyword removed from Amaro Nonino, so a
// type:'Amaro' bottle (Campari) does NOT satisfy Paper Plane's
// Amaro Nonino ingredient. Paper Plane must be one/two-away, NOT buildable.
// ------------------------------------------------------------------

test('REGRESSION: a type:Amaro bottle does NOT make Paper Plane buildable (no over-match)', () => {
  const inventory = emptyInventory();
  // Provide everything EXCEPT a real Amaro Nonino/Averna/Ramazzotti.
  inventory.base_spirits.whiskey = [{ style: 'Whiskeys & Brown Spirits', type: 'Bourbon' }];
  inventory.fresh_produce = ['Lemon'];
  inventory.liqueurs_and_cordials.herbal = [
    { style: 'Liqueurs & Cordials', type: 'Aperol', brand: 'Aperol' },
    { style: 'Liqueurs & Cordials', type: 'Amaro', brand: 'Campari' },
  ];

  const result = RecommenderEngine.recommend(inventory, null, { scope: 0 });
  const inBuildable = (result.buildable || []).some(i => i.recipe && i.recipe.name === 'Paper Plane');

  assert.equal(inBuildable, false,
    'Paper Plane must NOT be buildable — a type:Amaro bottle (Campari) must not satisfy "Amaro Nonino"');
  // Sanity: it should still surface as missing exactly the Amaro Nonino (one-away).
  assert.equal(bucketOf(result, 'Paper Plane'), 'oneAway',
    'Paper Plane should be one-away (only the real Amaro Nonino missing)');
});
