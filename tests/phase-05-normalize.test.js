// Tests for DATA-01 and DATA-02 requirements in normalize.js
// Run with: node tests/phase-05-normalize.test.js

'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Stub browser globals before eval
global.window = {};
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
global.document = { getElementById: () => null };

// Load normalize.js via vm.runInThisContext so `const Normalize` lands on globalThis
const vm = require('node:vm');
const normalizeSource = fs.readFileSync(
  path.resolve(__dirname, '../app/js/normalize.js'),
  'utf8'
);
vm.runInThisContext(normalizeSource);

// ------------------------------------------------------------------
// DATA-01: Equipment stripped from barkeeper (not inventory)
// ------------------------------------------------------------------

test('DATA-01: Normalize.barkeeper strips equipment key', () => {
  const input = { equipment: { strainers: ['Hawthorne'] }, identity: {} };
  const result = Normalize.barkeeper(input);
  assert.ok(!('equipment' in result), 'barkeeper result must NOT have .equipment key');
});

test('DATA-01: Normalize.profile strips equipment key', () => {
  const input = { equipment: { strainers: ['Hawthorne'] }, flavor_profile: {} };
  const result = Normalize.profile(input);
  assert.ok(!('equipment' in result), 'profile result must NOT have .equipment key');
});

test('DATA-01: Normalize.inventory preserves equipment.strainers with valid values', () => {
  const input = { equipment: { strainers: ['Hawthorne', 'Julep'] } };
  const result = Normalize.inventory(input);
  assert.ok('equipment' in result, 'inventory result MUST have .equipment key');
  assert.ok('strainers' in result.equipment, 'inventory result MUST have .equipment.strainers');
  assert.deepEqual(result.equipment.strainers, ['Hawthorne', 'Julep']);
});

test('DATA-01: Normalize.inventory strips unknown strainers from equipment', () => {
  const input = { equipment: { strainers: ['InvalidTool'] } };
  const result = Normalize.inventory(input);
  assert.ok('equipment' in result, 'inventory result MUST have .equipment key');
  assert.deepEqual(result.equipment.strainers, [], 'unknown strainers must be stripped to empty array');
});

// ------------------------------------------------------------------
// DATA-02: Flavor axis string positions migrate to floats
// ------------------------------------------------------------------

test('DATA-02: "Strong A" position migrates to 0', () => {
  const input = {
    flavor_profile: { axes: { sweetness: { position: 'Strong A' } } },
  };
  const result = Normalize.profile(input);
  assert.equal(result.flavor_profile.axes.sweetness.position, 0);
});

test('DATA-02: "Lean B" position migrates to 0.75', () => {
  const input = {
    flavor_profile: { axes: { sweetness: { position: 'Lean B' } } },
  };
  const result = Normalize.profile(input);
  assert.equal(result.flavor_profile.axes.sweetness.position, 0.75);
});

test('DATA-02: "Middle" position migrates to 0.5', () => {
  const input = {
    flavor_profile: { axes: { sweetness: { position: 'Middle' } } },
  };
  const result = Normalize.profile(input);
  assert.equal(result.flavor_profile.axes.sweetness.position, 0.5);
});

test('DATA-02: float position 0.4 passes through unchanged', () => {
  const input = {
    flavor_profile: { axes: { sweetness: { position: 0.4 } } },
  };
  const result = Normalize.profile(input);
  assert.equal(result.flavor_profile.axes.sweetness.position, 0.4);
});

test('DATA-02: all 6 axis keys with "Strong B" migrate to 1', () => {
  const axes = {};
  for (const k of ['sweetness', 'acid', 'strength', 'complexity', 'season', 'risk']) {
    axes[k] = { position: 'Strong B' };
  }
  const input = { flavor_profile: { axes } };
  const result = Normalize.profile(input);
  for (const k of ['sweetness', 'acid', 'strength', 'complexity', 'season', 'risk']) {
    assert.equal(result.flavor_profile.axes[k].position, 1,
      `axis "${k}" with "Strong B" must become 1`);
  }
});
