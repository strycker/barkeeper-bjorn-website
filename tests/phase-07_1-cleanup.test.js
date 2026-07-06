// Phase 7.1 (Recipes & UI Consistency Cleanup) deterministic regression tests.
// Guards CHIP-03: the legacy `State.get('recipes')` compat shim
// (_withRecipesShim / _resolveSeededForShim + the get('recipes') branch) was
// DELETED. get('recipes') must now return the raw canonical pool object with
// NO synthesized v1 getter arrays. This test fails if the shim is reintroduced.
//
// Run with: node tests/phase-07_1-cleanup.test.js
'use strict';

const { test } = require('node:test');
const assert   = require('node:assert/strict');
const fs       = require('node:fs');
const path     = require('node:path');
const vm       = require('node:vm');

// ── Stubbed browser globals (IIFE modules touch these inside functions only) ──
global.window = {};
global.localStorage = {
  _s: {},
  getItem(k)    { return Object.prototype.hasOwnProperty.call(this._s, k) ? this._s[k] : null; },
  setItem(k, v) { this._s[k] = String(v); },
  removeItem(k) { delete this._s[k]; },
  clear()       { this._s = {}; },
};
global.document = { getElementById: () => null, createElement: () => ({ addEventListener: () => {}, appendChild: () => {} }) };
globalThis.CLASSICS_DB = [];

// Load order mirrors index.html: normalize before state (state._normalize → Normalize.byKey).
vm.runInThisContext(fs.readFileSync(path.resolve(__dirname, '../app/js/normalize.js'), 'utf8'));
vm.runInThisContext(fs.readFileSync(path.resolve(__dirname, '../app/js/state.js'),     'utf8'));

const LEGACY_V1 = {
  originals: [
    { id: 'orig-1', name: 'Smokey the Pear', base: 'Mezcal', method: 'shaken',
      ingredients: [{ name: 'Mezcal', amount: '1 oz' }] },
  ],
  confirmed_favorites: [
    { id: 'fav-1', name: 'My Fav Sour', base: 'Whiskey', method: 'shaken',
      ingredients: [{ name: 'Whiskey', amount: '2 oz' }] },
  ],
  wishlist: [
    { id: 'wish-1', name: 'Someday Spritz', base: 'Aperol', method: 'built',
      ingredients: [{ name: 'Aperol', amount: '3 oz' }] },
  ],
  made_log: [
    { id: 'made-1', name: 'Last Night Negroni', base: 'Gin', method: 'stirred',
      date: '2026-06-01', ingredients: [{ name: 'Gin', amount: '1 oz' }] },
  ],
};

const V1_KEYS = ['originals', 'confirmed_favorites', 'wishlist', 'made_log'];

test('CHIP-03: legacy v1 recipes shape normalizes to the canonical pool', () => {
  State.set('recipes', LEGACY_V1);
  const r = State.get('recipes');
  assert.equal(r._schema_version, 2, 'schema bumped to v2 pool');
  assert.ok(Array.isArray(r.pool), 'pool is an array');
  assert.ok(r.pool.length >= 4, 'all four v1 buckets folded into the pool');
});

test('CHIP-03: get(\'recipes\') exposes NO synthesized v1 getter arrays (shim gone)', () => {
  State.set('recipes', LEGACY_V1);
  const r = State.get('recipes');
  for (const k of V1_KEYS) {
    assert.equal(r[k], undefined,
      `legacy getter '${k}' must not be synthesized on get('recipes') — the shim was removed`);
    assert.equal(Object.getOwnPropertyDescriptor(r, k), undefined,
      `no own property/getter '${k}' on the pool object`);
  }
});

test('CHIP-03: get(\'recipes\') returns the raw stored reference (no per-call wrapper)', () => {
  State.set('recipes', LEGACY_V1);
  const a = State.get('recipes');
  const b = State.get('recipes');
  assert.strictEqual(a, b, 'two reads return the same object — get() is not wrapping the pool per call');
});

test('CHIP-03: v1 buckets map to the correct pool status / overlay flags', () => {
  State.set('recipes', LEGACY_V1);
  const pool = State.get('recipes').pool;
  const byName = (n) => pool.find(p => p.name === n);
  assert.equal(byName('Smokey the Pear').status, 'original', 'originals → status:original');
  assert.equal(byName('My Fav Sour').is_favorite, true, 'confirmed_favorites → is_favorite');
  assert.equal(byName('Someday Spritz').is_wishlist, true, 'wishlist → is_wishlist');
  assert.ok((byName('Last Night Negroni').made_log || []).length > 0, 'made_log → made_log entry');
});

test('CHIP-03: an already-v2 pool object passes through as a pool (idempotent)', () => {
  const v2 = { _schema_version: 2, pool: [
    { id: 'x', status: 'original', name: 'Keep Me', base: 'Rum', method: 'shaken', ingredients: [] },
  ] };
  State.set('recipes', v2);
  const r = State.get('recipes');
  assert.ok(Array.isArray(r.pool), 'stays a pool');
  for (const k of V1_KEYS) assert.equal(r[k], undefined, `no synthesized '${k}'`);
});
