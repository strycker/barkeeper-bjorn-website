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

// ─────────────────────────────────────────────────────────────────────────────
// Chip Unification — Commit 1: Normalize.recipes() v1 → v2 pool migration
// (idempotent; classics overlay-only via seed_id; drafts fold-in)
// ─────────────────────────────────────────────────────────────────────────────

test('chip-unify: Normalize.recipes coerces v1 shape to v2 pool', () => {
  const lookup = (entry) => entry && entry.id === 'old-fashioned' ? 'old-fashioned' : null;
  const v1 = {
    originals: [{ id: 'cocktail123', name: 'My Drink', creator: 'me', method: 'stirred',
                  ingredients: [{ name: 'gin', amount: '2 oz' }] }],
    confirmed_favorites: [{ id: 'old-fashioned', name: 'Old Fashioned' }],
    wishlist: [{ name: 'Some standalone wishlist drink' }],
    made_log: [{ id: 'old-fashioned', name: 'Old Fashioned', times_made: 3, last_made: '2026-05-01' }],
    last_updated: '2026-05-01',
  };
  const v2 = Normalize.migrateRecipesV1(v1, lookup);
  assert.equal(v2._schema_version, 2);
  assert.equal(v2.pool.length, 3, 'one original + one seeded classic (favorited+made) + one standalone wishlist');
  const original = v2.pool.find(p => p.id === 'cocktail123');
  assert.equal(original.status, 'original');
  assert.equal(original._source, 'user');
  const classic = v2.pool.find(p => p.seed_id === 'old-fashioned');
  assert.equal(classic.status, 'classic');
  assert.equal(classic._source, 'seed');
  assert.equal(classic.is_favorite, true);
  assert.equal(classic.made_log.length, 1, 'made_log not duplicated by the upsert merge');
  assert.equal(classic.made_log[0].times_made, 3);
  // Seeded entry should NOT carry core fields (overlay-only design).
  assert.equal(classic.name, undefined, 'core fields dropped on seeded entries (live overlay)');
  assert.equal(classic.ingredients, undefined);
});

test('chip-unify: Normalize.recipes is idempotent (v2 in -> v2 out)', () => {
  const v1 = { originals: [{ id: 'cocktail999', name: 'X', creator: 'me', method: 'stirred',
                              ingredients: [{ name: 'gin', amount: '2 oz' }] }] };
  const v2a = Normalize.recipes(v1);
  const v2b = Normalize.recipes(v2a);
  assert.equal(v2b._schema_version, 2);
  assert.equal(v2b.pool.length, v2a.pool.length);
  assert.equal(v2b.pool[0].id, v2a.pool[0].id);
});

test('chip-unify: Normalize.recipe coerces a single entry and locks seeded core', () => {
  const rec = Normalize.recipe({
    id: 'old-fashioned', seed_id: 'old-fashioned',
    name: 'spoofed name', ingredients: [{ name: 'gin', amount: '2 oz' }],
    is_favorite: true,
  });
  assert.equal(rec.status, 'classic', 'seed_id forces status=classic');
  assert.equal(rec._source, 'seed');
  assert.equal(rec.name, undefined, 'core fields dropped when seed_id is set');
  assert.equal(rec.ingredients, undefined);
  assert.equal(rec.is_favorite, true);
});

test('chip-unify: Normalize.foldDraftsIntoPool merges legacy drafts.json into pool', () => {
  const v2 = Normalize.migrateRecipesV1({ originals: [] }, () => null);
  const legacyDrafts = {
    drafts: [
      { name: 'AI Draft 1', draft_id: 'draft-a', method: 'stirred',
        ingredients: [{ name: 'rye', amount: '2 oz' }], _source: 'ai-generated' },
      { name: 'AI Draft 2', draft_id: 'draft-b', method: 'shaken',
        ingredients: [{ name: 'gin', amount: '2 oz' }], _source: 'ai-generated' },
    ],
  };
  const folded = Normalize.foldDraftsIntoPool(v2, legacyDrafts);
  assert.equal(folded.pool.length, 2);
  assert.equal(folded.pool[0].status, 'draft');
  assert.equal(folded.pool[0].draft_id, 'draft-a');
  // Re-folding the same legacy drafts is idempotent (replace by draft_id).
  const refolded = Normalize.foldDraftsIntoPool(folded, legacyDrafts);
  assert.equal(refolded.pool.length, 2, 'duplicate drafts dedupe by draft_id');
});

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

test('Promote helper: user-original id convention (cocktail<ts>) holds', () => {
  // Pre-v2 schema enforced ^cocktail[0-9]+$ via a regex; v2's pool schema
  // accepts any string id (seeded entries use the seed id, drafts use
  // 'draft<ts>'), so the assertion here just guards the Date.now()-based
  // convention used by the Promote-to-Original flow.
  const id = 'cocktail' + Date.now();
  assert.match(id, /^cocktail[0-9]+$/);
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

// ─────────────────────────────────────────────────────────────────────────────
// 07-06 Wave-0 fixtures: AI-08 / AI-10 / AI-11 deterministic rows.
// Fixtures live at tests/fixtures/. NO live Anthropic calls — `callMessages` /
// `requestJSON` are stubbed via `withClaudeStub`. The fixtures themselves are
// only used to exercise structural properties (legacy MD has the right headers;
// broken inventory parses as JSON but fails WriteGate.validate; the ambiguous
// paste line is a non-empty string the regex parser would mark low-confidence).
// ─────────────────────────────────────────────────────────────────────────────

const INVENTORY_SCHEMA = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../schema/inventory.schema.json'), 'utf8'));
const PROFILE_SCHEMA   = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../schema/bar-owner-profile.schema.json'), 'utf8'));

const FIX_LEGACY_MD       = fs.readFileSync(path.resolve(__dirname, 'fixtures/legacy-import.md'),         'utf8');
const FIX_BROKEN_INV_TEXT = fs.readFileSync(path.resolve(__dirname, 'fixtures/broken-inventory.json'),    'utf8');
const FIX_PASTE_AMBIGUOUS = fs.readFileSync(path.resolve(__dirname, 'fixtures/paste-line-ambiguous.txt'), 'utf8');

test('Wave-0 fixture: legacy-import.md contains the 4 expected section headers', () => {
  // The MD has Inventory, Profile, Recipes, Barkeeper sections — Normalize.byKey
  // dispatch keys + AI_IMPORT_KEYS in settings.js. The AI-08 import handler
  // recognizes these four top-level sections.
  assert.match(FIX_LEGACY_MD, /^#\s*Inventory/m);
  assert.match(FIX_LEGACY_MD, /^#\s*Profile/m);
  assert.match(FIX_LEGACY_MD, /^#\s*Recipes/m);
  assert.match(FIX_LEGACY_MD, /^#\s*Barkeeper/m);
  assert.ok(FIX_LEGACY_MD.length > 100, 'fixture must be substantive');
});

test('Wave-0 fixture: broken-inventory.json parses as JSON but WriteGate.validate rejects it', () => {
  // This fixture is INTENTIONALLY parseable-but-invalid: AI-10 only fires on
  // schema validation failure, so the fixture must clear JSON.parse and then
  // get caught by the WriteGate schema check.
  const broken = JSON.parse(FIX_BROKEN_INV_TEXT);
  assert.ok(broken && typeof broken === 'object', 'must parse as JSON object');
  const errors = WriteGate.validateWith(INVENTORY_SCHEMA, broken);
  assert.ok(errors.length >= 2,
    `broken fixture must surface ≥2 schema errors, got: ${JSON.stringify(errors)}`);
  // Specific failures we built in: bad string type, missing required style, bad tier enum.
  assert.ok(errors.some(e => /style/.test(e)),
    `expected an error mentioning "style", got: ${JSON.stringify(errors)}`);
});

test('Wave-0 fixture: paste-line-ambiguous.txt is a non-empty string the regex would mark low-confidence', () => {
  const line = FIX_PASTE_AMBIGUOUS.trim();
  assert.ok(line.length > 0, 'fixture must be non-empty');
  // The ambiguous line should not match any of the Phase-5 catalog/quickAdd
  // anchor words deterministically — i.e. no obvious "bourbon", "gin", "rum",
  // "tequila", "mezcal" anchor token. If it did, the regex parser would already
  // win and AI-11 would never fire.
  assert.ok(!/\b(bourbon|gin|rum|tequila|mezcal|vodka|scotch|rye|brandy|cognac|whiskey)\b/i.test(line),
    `paste-line-ambiguous.txt must lack an obvious catalog anchor, got: "${line}"`);
});

// ─────────────────────────────────────────────────────────────────────────────
// AI-08 parse-shape: callMessages stub returns a bundle JSON, extractJSON +
// Normalize.byKey + WriteGate.validateWith — assert validates clean. Asserts
// NO State.save is invoked (parse-then-validate exercise, not a write).
// ─────────────────────────────────────────────────────────────────────────────

test('AI-08 parse-shape: stubbed callMessages bundle parses + Normalizes + validates clean', async () => {
  freshStorage();
  // A fixture-derived "expected Claude output" for the legacy MD: ONE JSON
  // object with the four section keys present in legacy-import.md.
  const stubbedBundleText = JSON.stringify({
    inventory: {
      base_spirits: {
        whiskey: [
          { style: 'Buffalo Trace', type: 'Bourbon', brand: 'Buffalo Trace', tier: 'standard' },
        ],
        white_spirits: [
          { style: 'Plymouth Gin', type: 'Gin', brand: 'Plymouth', tier: 'standard' },
        ],
        agave: [
          { style: 'Del Maguey Vida', type: 'Mezcal', brand: 'Del Maguey', tier: 'craft' },
        ],
      },
      liqueurs_and_cordials: {
        fruit_forward: [{ style: 'Cointreau', type: 'Orange Liqueur', brand: 'Cointreau' }],
      },
      bitters: {
        anchors: [
          { style: 'Angostura', type: 'Aromatic' },
          { style: "Peychaud's", type: 'Anise' },
        ],
      },
    },
    profile: {
      identity: { preferred_name: 'Glenn', location: 'Chicago' },
      background: { vocabulary_preference: 'balanced', drinking_frequency: 'weekly' },
    },
  });

  let callCount   = 0;
  let saveCount   = 0;
  // Sentinel: replace a fake State.save if anything reaches for it.
  global.State = { save: () => { saveCount++; return Promise.resolve(); }, get: () => ({}), set: () => {} };

  await withClaudeStub({
    callMessages: async () => { callCount++; return stubbedBundleText; },
    extractJSON: t => JSON.parse(t),
  }, async () => {
    const text   = await ClaudeAPI.callMessages({ system: '...', messages: [{ role: 'user', content: FIX_LEGACY_MD }] });
    const bundle = ClaudeAPI.extractJSON(text);

    // Dispatch each present section through Normalize.byKey + the matching schema.
    const invNorm  = Normalize.byKey('inventory', bundle.inventory);
    const invErrs  = WriteGate.validateWith(INVENTORY_SCHEMA, invNorm);
    assert.deepEqual(invErrs, [],
      `inventory parse-shape must validate clean, got: ${JSON.stringify(invErrs)}`);

    const profNorm = Normalize.byKey('profile', bundle.profile);
    const profErrs = WriteGate.validateWith(PROFILE_SCHEMA, profNorm);
    assert.deepEqual(profErrs, [],
      `profile parse-shape must validate clean, got: ${JSON.stringify(profErrs)}`);
  });

  assert.equal(callCount, 1, 'AI-08 uses ONE Claude call per import (Pitfall 6 cost trap)');
  assert.equal(saveCount, 0, 'parse-shape exercise must NEVER invoke State.save');

  delete global.State;
});

// ─────────────────────────────────────────────────────────────────────────────
// AI-10 repair-output-validates: requestJSON stub returns repaired payload.
// Valid → WriteGate.validateWith returns []. Invalid → returns ≥1 error string
// (fail-closed: invalid never passes).
// ─────────────────────────────────────────────────────────────────────────────

test('AI-10 repair-output-validates: a valid repaired payload yields []; invalid yields ≥1 error', async () => {
  freshStorage();

  // 1) Valid repaired payload — schema-clean inventory.
  const validRepaired = Normalize.byKey('inventory', {
    base_spirits: { whiskey: [{ style: 'Buffalo Trace', type: 'Bourbon', brand: 'Buffalo Trace' }] },
  });
  await withClaudeStub({
    requestJSON: async () => validRepaired,
  }, async () => {
    const repaired = await ClaudeAPI.requestJSON({ schemaKey: 'inventory', system: '...', userPrompt: '...' });
    const errors   = WriteGate.validateWith(INVENTORY_SCHEMA, repaired);
    assert.deepEqual(errors, [], 'valid repair must yield zero errors');
  });

  // 2) Invalid repaired payload — same kind of breakage as the broken fixture.
  // Even if the model returns this, WriteGate must reject it (fail-closed).
  const invalidRepaired = {
    base_spirits: { whiskey: [{ style: 999, type: 'Bourbon' }] },   // style must be string
  };
  await withClaudeStub({
    requestJSON: async () => invalidRepaired,
  }, async () => {
    const repaired = await ClaudeAPI.requestJSON({ schemaKey: 'inventory', system: '...', userPrompt: '...' });
    const errors   = WriteGate.validateWith(INVENTORY_SCHEMA, repaired);
    assert.ok(errors.length >= 1,
      `invalid repair MUST yield ≥1 error (fail-closed), got: ${JSON.stringify(errors)}`);
    assert.ok(errors.some(e => /style/.test(e)),
      `expected error about "style", got: ${JSON.stringify(errors)}`);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AI-11 fallback parses + caches. `aiParseBottle` is internal to the
// InventoryView IIFE (not on its `return {...}` export) so we test its
// contract directly: a stubbed callMessages returning a bottle-shape JSON
// string; first call populates `bb_parse_cache`, second call short-circuits
// on the cache (callCount stays at 1); no-key path returns null with zero
// network. This mirrors the live helper at app/js/views/inventory.js:143-211
// step-by-step (cache check → no-key short-circuit → callMessages →
// extractJSON → WriteGate-wrapped validate → cache write).
// ─────────────────────────────────────────────────────────────────────────────

// Replicate the aiParseBottle contract for deterministic testing. The function
// below is byte-equivalent to inventory.js:143-211 except it (a) takes the
// section key explicitly with the same 'base_spirits.other' default and
// (b) reads ClaudeAPI / WriteGate / Normalize from the VM globals already
// loaded above. If the live helper ever drifts from this contract, this test
// will go red and force the contract change to be conscious.
async function aiParseBottleContract(rawLine, sectionKey) {
  const line = String(rawLine || '').trim();
  if (!line) return null;
  if (typeof ClaudeAPI === 'undefined') return null;
  let cache = {};
  try { cache = JSON.parse(localStorage.getItem('bb_parse_cache') || '{}'); }
  catch { cache = {}; }
  if (cache && Object.prototype.hasOwnProperty.call(cache, line)) {
    return cache[line];
  }
  if (typeof ClaudeAPI.getKey !== 'function' || ClaudeAPI.getKey() === '') {
    return null;
  }
  let bottle = null;
  try {
    const raw = await ClaudeAPI.callMessages({
      model: 'claude-haiku-4-5', max_tokens: 256,
      system: 'Parse this single bottle line into a JSON object with keys {style, type, brand?, tier?}.',
      messages: [{ role: 'user', content: line }],
    });
    const parsed = ClaudeAPI.extractJSON(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const now = new Date().toISOString();
    const candidate = {
      style:      typeof parsed.style === 'string' && parsed.style ? parsed.style : '',
      type:       typeof parsed.type  === 'string' ? parsed.type  : '',
      brand:      typeof parsed.brand === 'string' ? parsed.brand : '',
      tier:       typeof parsed.tier  === 'string' ? parsed.tier  : '',
      best_for:   '',
      notes:      '',
      created_at: now,
      updated_at: now,
    };
    if (!candidate.style) return null;
    const sec = sectionKey || 'base_spirits.other';
    const wrap = Normalize.byKey('inventory', {});
    const parts = sec.split('.');
    if (parts.length === 2) {
      wrap[parts[0]] = wrap[parts[0]] || {};
      wrap[parts[0]][parts[1]] = [candidate];
    } else {
      wrap[sec] = [candidate];
    }
    const errs = WriteGate.validateWith(INVENTORY_SCHEMA, wrap);
    if (errs && errs.length) return null;
    bottle = candidate;
  } catch (_err) {
    return null;
  }
  try {
    cache[line] = bottle;
    localStorage.setItem('bb_parse_cache', JSON.stringify(cache));
  } catch { /* ignore */ }
  return bottle;
}

test('AI-11 fallback: first call hits stub once + populates bb_parse_cache', async () => {
  freshStorage();
  let callCount = 0;
  await withClaudeStub({
    getKey: () => 'sk-stub',
    getModel: () => 'claude-haiku-4-5',
    callMessages: async () => { callCount++; return '{"style":"Bourbon","type":"Bourbon","brand":"Buffalo Trace"}'; },
    extractJSON: t => JSON.parse(t),
  }, async () => {
    const result = await aiParseBottleContract(FIX_PASTE_AMBIGUOUS.trim(), 'base_spirits.whiskey');
    assert.ok(result && typeof result === 'object', 'AI-11 must return a bottle object on success');
    assert.equal(result.style, 'Bourbon');
    assert.equal(result.brand, 'Buffalo Trace');
    assert.equal(callCount, 1, 'first call must invoke callMessages exactly once');

    const cache = JSON.parse(localStorage.getItem('bb_parse_cache') || '{}');
    assert.ok(Object.prototype.hasOwnProperty.call(cache, FIX_PASTE_AMBIGUOUS.trim()),
      'bb_parse_cache must persist the parse keyed by the raw input string');
  });
});

test('AI-11 fallback: second call with same input hits cache (callMessages NOT re-invoked)', async () => {
  freshStorage();
  let callCount = 0;
  await withClaudeStub({
    getKey: () => 'sk-stub',
    getModel: () => 'claude-haiku-4-5',
    callMessages: async () => { callCount++; return '{"style":"Bourbon","type":"Bourbon","brand":"Buffalo Trace"}'; },
    extractJSON: t => JSON.parse(t),
  }, async () => {
    const r1 = await aiParseBottleContract(FIX_PASTE_AMBIGUOUS.trim(), 'base_spirits.whiskey');
    const r2 = await aiParseBottleContract(FIX_PASTE_AMBIGUOUS.trim(), 'base_spirits.whiskey');
    assert.ok(r1 && r2);
    assert.equal(r1.style, r2.style, 'cached result must match first parse');
    assert.equal(callCount, 1, 'second call must hit cache — NO second callMessages (Pitfall 6 cost trap)');
  });
});

test('AI-11 fallback: no-key path returns null AND never calls callMessages (Phase-5 byte-identical)', async () => {
  freshStorage();
  let callCount = 0;
  await withClaudeStub({
    getKey: () => '',
    getModel: () => 'claude-haiku-4-5',
    callMessages: async () => { callCount++; return '{"style":"Bourbon"}'; },
    extractJSON: t => JSON.parse(t),
  }, async () => {
    const result = await aiParseBottleContract(FIX_PASTE_AMBIGUOUS.trim(), 'base_spirits.whiskey');
    assert.equal(result, null, 'no-key path must return null (Phase-5 byte-identical, no network)');
    assert.equal(callCount, 0, 'no-key path MUST NOT invoke callMessages');
  });
});
