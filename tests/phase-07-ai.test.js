// Phase 7 (AI Integration) Wave-0 deterministic tests.
// Covers: ClaudeAPI defaults + log hygiene + extractJSON; Normalize.drafts
// idempotency and _source tagging; WriteGate.validate fail-closed behavior;
// inventory-fidelity phantom/veto detection. NO live Anthropic API calls.
//
// Run with: node tests/phase-07-ai.test.js
//
// NOTE: fixtures used here are inline-minimal. Larger reference fixtures for
// AI-08 (legacy MD import), AI-10 (JSON repair), and AI-11 (paste-a-line)
// will live in tests/fixtures/ once their plans land; this Wave-0 suite only
// needs schema-shape + parse + write-safety assertions.

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

// Load order: normalize first (claude-api.js + write-gate.js reference it),
// then claude-api, then write-gate. vm.runInThisContext lands each const on
// globalThis so the next file can see it. Browser load order (index.html)
// is normalize -> state -> ... -> claude-api -> write-gate -> app.
vm.runInThisContext(fs.readFileSync(path.resolve(__dirname, '../app/js/normalize.js'),   'utf8'));
vm.runInThisContext(fs.readFileSync(path.resolve(__dirname, '../app/js/claude-api.js'),  'utf8'));
vm.runInThisContext(fs.readFileSync(path.resolve(__dirname, '../app/js/write-gate.js'),  'utf8'));

const DRAFTS_SCHEMA   = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../schema/drafts.schema.json'),  'utf8'));
const RECIPES_SCHEMA  = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../schema/recipes.schema.json'), 'utf8'));

// ── Per-test isolation helper ─────────────────────────────────────────────────
function freshStorage() { global.localStorage.clear(); }

// ─────────────────────────────────────────────────────────────────────────────
// SET-05 / AI-09: model selector + log hygiene
// ─────────────────────────────────────────────────────────────────────────────

test('SET-05: getModel() returns claude-sonnet-4-6 when no override', () => {
  freshStorage();
  assert.equal(ClaudeAPI.getModel(), 'claude-sonnet-4-6');
});

test('SET-05: getModel() honors bb_chat_model override', () => {
  freshStorage();
  localStorage.setItem('bb_chat_model', 'claude-haiku-4-5');
  assert.equal(ClaudeAPI.getModel(), 'claude-haiku-4-5');
});

test('AI-09: appendLog caps bb_api_log at 50 entries (oldest dropped)', () => {
  freshStorage();
  for (let i = 0; i < 60; i++) ClaudeAPI.appendLog({ type: 'chat', model: 'm', usage: { i } });
  const log = JSON.parse(localStorage.getItem('bb_api_log'));
  assert.equal(log.length, 50);
  // Oldest 10 dropped: first surviving entry has i=10.
  assert.equal(log[0].usage.i, 10);
  assert.equal(log[49].usage.i, 59);
});

test('AI-09 / FM #4: appendLog NEVER records key/prompt/system/raw fields', () => {
  freshStorage();
  // Caller tries to log forbidden fields — appendLog must strip them.
  ClaudeAPI.appendLog({
    type: 'request',
    model: 'claude-sonnet-4-6',
    usage: { input_tokens: 10 },
    key: 'sk-ant-LEAK',
    'x-api-key': 'sk-ant-LEAK',
    prompt: 'system prompt text',
    system: 'cached system context',
    raw: 'raw response body',
    content: 'reply text',
  });
  const log = JSON.parse(localStorage.getItem('bb_api_log'));
  assert.equal(log.length, 1);
  const entry = log[0];
  // Hardened allowlist:
  assert.equal(entry.type, 'request');
  assert.equal(entry.model, 'claude-sonnet-4-6');
  assert.deepEqual(entry.usage, { input_tokens: 10 });
  assert.ok(entry.ts && typeof entry.ts === 'string');
  // Forbidden fields stripped:
  for (const forbidden of ['key', 'x-api-key', 'prompt', 'system', 'raw', 'content', 'text']) {
    assert.ok(!(forbidden in entry), `appendLog leaked forbidden field: ${forbidden}`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// extractJSON: fence-tolerant + clean + throws on garbage
// ─────────────────────────────────────────────────────────────────────────────

test('extractJSON: parses ```json-fenced object', () => {
  const text = '```json\n{"name":"Negroni","base":"gin"}\n```';
  assert.deepEqual(ClaudeAPI.extractJSON(text), { name: 'Negroni', base: 'gin' });
});

test('extractJSON: parses clean (unfenced) JSON', () => {
  assert.deepEqual(ClaudeAPI.extractJSON('{"name":"Martini"}'), { name: 'Martini' });
});

test('extractJSON: throws on non-JSON garbage', () => {
  assert.throws(() => ClaudeAPI.extractJSON('not json at all'));
});

// ─────────────────────────────────────────────────────────────────────────────
// Normalize.drafts: idempotency + _source tagging + field allowlist
// ─────────────────────────────────────────────────────────────────────────────

test('Normalize.byKey("drafts", {}) returns {drafts:[], last_updated:isoToday}', () => {
  const result = Normalize.byKey('drafts', {});
  assert.ok(Array.isArray(result.drafts));
  assert.equal(result.drafts.length, 0);
  assert.match(result.last_updated, /^\d{4}-\d{2}-\d{2}$/);
});

test('Normalize.drafts is idempotent', () => {
  const raw = {
    drafts: [
      { name: 'AI Drink #1', base: 'gin', tagline: 't', ingredients: [{ name: 'gin', amount: '2 oz' }] },
      { name: 'AI Drink #2', _source: 'wrong-tag', junk: 'drop-me', source_prompt: 'make me something' },
    ],
    last_updated: '2026-05-21',
  };
  const a = Normalize.byKey('drafts', raw);
  const b = Normalize.byKey('drafts', a);
  assert.deepEqual(a, b, 'second pass must equal first pass');
});

test('Normalize.drafts tags every entry _source:"ai-generated"', () => {
  const norm = Normalize.byKey('drafts', {
    drafts: [
      { name: 'A', _source: 'wrong' },
      { name: 'B' },
      { /* nameless — should drop */ },
    ],
  });
  assert.equal(norm.drafts.length, 2, 'nameless entry must be dropped');
  norm.drafts.forEach(d => assert.equal(d._source, 'ai-generated'));
});

test('Normalize.drafts drops keys not in draftItem allowlist', () => {
  const norm = Normalize.byKey('drafts', {
    drafts: [{ name: 'A', junk: 'x', evil_eval: 'y' }],
  });
  assert.ok(!('junk' in norm.drafts[0]));
  assert.ok(!('evil_eval' in norm.drafts[0]));
});

// ─────────────────────────────────────────────────────────────────────────────
// Recipes promote-to-original re-tag: id matches ^cocktail[0-9]+$
// (Wave-1 helper-level — full promote flow lands in 07-02; this is the id shape.)
// ─────────────────────────────────────────────────────────────────────────────

test('Promote helper: cocktail id pattern (Date.now-based) matches schema regex', () => {
  const id = 'cocktail' + Date.now();
  assert.match(id, /^cocktail[0-9]+$/);
  // And matches the recipes schema's documented pattern explicitly:
  const pat = RECIPES_SCHEMA.definitions.original.properties.id.pattern;
  assert.match(id, new RegExp(pat));
});

// ─────────────────────────────────────────────────────────────────────────────
// WriteGate.validate / validateWith: fail-closed on invalid drafts payload
// ─────────────────────────────────────────────────────────────────────────────

test('WriteGate.validateWith: valid drafts payload returns []', () => {
  const valid = {
    drafts: [{
      _source: 'ai-generated',
      name: 'Phantom Sour',
      base: 'gin',
      ingredients: [{ name: 'gin', amount: '2 oz' }],
    }],
    last_updated: '2026-05-21',
  };
  const errors = WriteGate.validateWith(DRAFTS_SCHEMA, valid);
  assert.deepEqual(errors, [], `expected no errors, got: ${JSON.stringify(errors)}`);
});

test('WriteGate.validateWith: drafts payload missing required `name` returns errors', () => {
  const invalid = {
    drafts: [{ _source: 'ai-generated', base: 'gin' /* no name */ }],
    last_updated: '2026-05-21',
  };
  const errors = WriteGate.validateWith(DRAFTS_SCHEMA, invalid);
  assert.ok(errors.length >= 1, 'must surface ≥1 validation error');
  assert.ok(errors.some(e => /name/.test(e)), `expected an error mentioning "name", got: ${JSON.stringify(errors)}`);
});

test('WriteGate.validateWith: top-level drafts not an array returns errors', () => {
  const errors = WriteGate.validateWith(DRAFTS_SCHEMA, { drafts: 'oops' });
  assert.ok(errors.length >= 1);
});

// ─────────────────────────────────────────────────────────────────────────────
// WriteGate.inventoryFidelity: phantom + veto detection (FM #3)
// ─────────────────────────────────────────────────────────────────────────────

test('WriteGate.inventoryFidelity: flags ingredient absent from inventory token set as phantom', () => {
  const recipe = {
    name: 'Phantom Sour',
    ingredients: [
      { name: 'Bourbon', amount: '2 oz' },     // present
      { name: 'Mezcal',  amount: '1/2 oz' },   // phantom (not in inventory)
      { name: 'Lemon',   amount: '3/4 oz' },   // present
    ],
  };
  const inventoryTokens = ['bourbon', 'lemon', 'simple', 'syrup'];
  const result = WriteGate.inventoryFidelity(recipe, inventoryTokens, []);
  assert.deepEqual(result.phantoms, ['Mezcal']);
  assert.deepEqual(result.vetoed, []);
});

test('WriteGate.inventoryFidelity: flags veto\'d ingredients', () => {
  const recipe = {
    name: 'Veto Test',
    ingredients: [
      { name: 'Gin',     amount: '2 oz' },
      { name: 'Campari', amount: '1 oz' },
    ],
  };
  const result = WriteGate.inventoryFidelity(recipe, ['gin', 'campari'], ['campari']);
  assert.deepEqual(result.vetoed, ['Campari']);
  assert.deepEqual(result.phantoms, []);
});

test('WriteGate.inventoryFidelity: substitution-noted ingredients are NOT phantoms', () => {
  const recipe = {
    name: 'Sub Test',
    ingredients: [
      { name: 'Mezcal', amount: '2 oz', notes: 'substitute for the unavailable bottle' },
    ],
  };
  const result = WriteGate.inventoryFidelity(recipe, ['bourbon'], []);
  assert.deepEqual(result.phantoms, [], 'explicit substitution must not be a phantom');
});

// ─────────────────────────────────────────────────────────────────────────────
// AI-13: RecommenderEngine.deriveWithAI — key-gated, cached, fail-soft
// ─────────────────────────────────────────────────────────────────────────────

// Load the recommender engine into this VM context. CLASSICS_DB is referenced
// only inside `recommend()`, never at module load, so no stub is required for
// the deriveWithAI surface tests below.
vm.runInThisContext(fs.readFileSync(path.resolve(__dirname, '../app/js/recommender-engine.js'), 'utf8'));

// Helper: temporarily monkey-patch the real ClaudeAPI object's methods for a
// single test, restoring them afterward. We patch in-place (rather than swap
// the `const ClaudeAPI` binding) because `const` declarations under
// vm.runInThisContext create lexical bindings — the engine module captures the
// real ClaudeAPI by lexical reference, so a globalThis.ClaudeAPI swap is
// invisible to it. Mutating the live object's methods is what the engine sees.
//
// MUST `await fn()` inside the try (not `return fn()`) — try/finally with a
// returned promise fires `finally` synchronously, restoring methods BEFORE
// the async test body completes. That race causes spurious cache misses.
async function withClaudeStub(stub, fn) {
  const target = ClaudeAPI;
  const saved = {};
  for (const k of Object.keys(stub)) {
    saved[k] = target[k];
    target[k] = stub[k];
  }
  try { return await fn(); }
  finally {
    for (const k of Object.keys(stub)) target[k] = saved[k];
  }
}

test('AI-13: deriveWithAI is exported on RecommenderEngine', () => {
  assert.equal(typeof RecommenderEngine.deriveWithAI, 'function',
    'deriveWithAI must be added to the IIFE return without dropping existing exports');
  assert.equal(typeof RecommenderEngine.recommend, 'function',
    'recommend() must still be exported (preserve every Phase-5 export)');
  assert.equal(typeof RecommenderEngine.normalizeOriginal, 'function',
    'normalizeOriginal must still be exported (preserve every Phase-5 export)');
});

test('AI-13: deriveWithAI returns false when no API key (Phase-5 byte-identical path)', async () => {
  freshStorage();
  let callCount = 0;
  await withClaudeStub({
    getKey: () => '',
    getModel: () => 'claude-sonnet-4-6',
    callMessages: async () => { callCount++; return '{"derived":true}'; },
    extractJSON: t => JSON.parse(t),
  }, async () => {
    const result = await RecommenderEngine.deriveWithAI('lemon juice', new Set(['lemons']));
    assert.equal(result, false, 'no key must return false');
    assert.equal(callCount, 0, 'no-key path must NOT call callMessages');
  });
});

test('AI-13: deriveWithAI caches positive answer in bb_derivation_cache (no second network call)', async () => {
  freshStorage();
  let callCount = 0;
  await withClaudeStub({
    getKey: () => 'sk-stub',
    getModel: () => 'claude-sonnet-4-6',
    callMessages: async () => { callCount++; return '{"derived":true}'; },
    extractJSON: t => JSON.parse(t),
  }, async () => {
    const r1 = await RecommenderEngine.deriveWithAI('lemon juice', new Set(['lemons']));
    const r2 = await RecommenderEngine.deriveWithAI('lemon juice', new Set(['lemons']));
    assert.equal(r1, true);
    assert.equal(r2, true);
    assert.equal(callCount, 1, 'second call must hit cache (Pitfall 6 - cost trap)');
    const cache = JSON.parse(localStorage.getItem('bb_derivation_cache') || '{}');
    assert.ok(Object.keys(cache).length >= 1, 'cache must persist the decision');
  });
});

test('AI-13: deriveWithAI is fail-soft on errors (never blocks the recommender)', async () => {
  freshStorage();
  await withClaudeStub({
    getKey: () => 'sk-stub',
    getModel: () => 'claude-sonnet-4-6',
    callMessages: async () => { throw new Error('429 rate limited'); },
    extractJSON: t => JSON.parse(t),
  }, async () => {
    const result = await RecommenderEngine.deriveWithAI('lime juice', new Set(['limes']));
    assert.equal(result, false, 'on any error the helper must resolve to false, not throw');
  });
});
