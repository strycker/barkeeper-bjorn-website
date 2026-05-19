// Tests for REC-09: Army & Navy appears as buildable with gin, lemon juice, orgeat in inventory
// Run with: node tests/phase-05-engine.test.js

'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Stub browser globals
global.window = {};
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
global.document = { getElementById: () => null };

// Load classics-db.js first (engine references CLASSICS_DB at call time via the global)
vm.runInThisContext(fs.readFileSync(path.resolve(__dirname, '../app/js/classics-db.js'), 'utf8'));

// Load recommender-engine.js after classics-db.js
vm.runInThisContext(fs.readFileSync(path.resolve(__dirname, '../app/js/recommender-engine.js'), 'utf8'));

// ------------------------------------------------------------------
// REC-09: Army & Navy appears as buildable given gin + lemon + orgeat
// ------------------------------------------------------------------

test('REC-09: Army & Navy is buildable with gin, lemon, and orgeat in inventory', () => {
  const inventory = {
    base_spirits: {
      white_spirits: [{ style: 'Gin' }],
      whiskey: [], rum: [], agave: [], brandy: [], other: [],
    },
    fortified_wines_and_aperitif_wines: [],
    liqueurs_and_cordials: {
      fruit_forward: [], nut_coffee: [], herbal: [], specialty_regional: [],
    },
    bitters: {
      anchors: [], aromatic_smoke: [], nut_earth: [], fruit_botanical: [], other: [],
    },
    syrups: [{ style: 'Orgeat' }],
    mixers_bottles: [], non_alcoholic_spirits: [],
    mixers: [], refrigerator_perishables: [], pantry_spice_rack: [],
    fresh_produce: ['Lemon'], specialty_ingredients: [], garnish_and_service: [],
    vetoes: { disliked_ingredients: [], substitute_for_now: [] },
    shopping_list: [], unassigned: [],
  };

  const profile = { flavor_profile: { axes: {} } };

  // RecommenderEngine.recommend(inventory, rawProfile, opts)
  const result = RecommenderEngine.recommend(inventory, profile, { scope: 0 });

  assert.ok(result && Array.isArray(result.buildable),
    'recommend() must return an object with a buildable array');

  const armyAndNavy = result.buildable.find(item => item.recipe && item.recipe.name === 'Army & Navy');

  assert.ok(
    armyAndNavy !== undefined,
    `"Army & Navy" must appear in buildable list. Got buildable recipes: [${result.buildable.map(i => i.recipe.name).join(', ')}]`
  );
});
