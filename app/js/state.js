// Central app state — loaded from GitHub, mutated by views, flushed back on save.

const State = (() => {
  const FILES = {
    barkeeper:  'data/barkeeper.json',
    profile:    'data/bar-owner-profile.json',
    inventory:  'data/inventory.json',
    recipes:    'data/recipes.json',
    drafts:     'data/drafts.json',
    library:    'data/library.json',
  };

  // Phase 7 tolerant-load set: `drafts` (D-11, 5th file) and `library`
  // (LIB-01/D-13, 6th file) are both tolerant — a 404 on the file
  // (existing repos that pre-date Phase 7) resolves to an empty payload
  // instead of rejecting the whole loadAll (Pitfall 1). The original 4
  // files (barkeeper, profile, inventory, recipes) remain strict.
  const TOLERANT_FILES = new Set(['drafts', 'library']);
  const TOLERANT_EMPTY = {
    drafts:  { drafts: [] },
    library: { links:  [] },
  };

  let _data = {};    // { barkeeper, profile, inventory, recipes, drafts, library }
  let _shas = {};    // { barkeeper, profile, inventory, recipes, drafts, library }
  let _loading = false;
  let _loaded = false;
  let _listeners = [];

  function notify(event) {
    _listeners.forEach(fn => fn(event));
  }

  function subscribe(fn) {
    _listeners.push(fn);
    return () => { _listeners = _listeners.filter(f => f !== fn); };
  }

  // Normalize on read — coerces malformed/legacy data to canonical schema shape.
  // Safe to call on already-canonical data (idempotent).
  function _normalize(key, data) {
    if (typeof Normalize !== 'undefined' && Normalize.byKey) {
      try { return Normalize.byKey(key, data); }
      catch (err) { console.warn(`Normalize failed for ${key}:`, err); return data; }
    }
    return data;
  }

  async function loadAll() {
    if (_loading) return;
    _loading = true;
    notify({ type: 'loading' });
    try {
      const results = await Promise.all(
        Object.entries(FILES).map(async ([key, path]) => {
          try {
            const { data, sha } = await GitHubAPI.readJSON(path);
            return { key, data, sha };
          } catch (err) {
            // Tolerant 404: missing `drafts` or `library` files in existing
            // pre-Phase-7 repos resolve to empty payloads rather than
            // rejecting the whole Promise.all (Pitfall 1). Drafts → {drafts:[]},
            // library → {links:[]}. All other files (barkeeper, profile,
            // inventory, recipes) remain strict and reject on 404.
            const msg = (err && err.message ? err.message : '').toLowerCase();
            const is404 = msg.includes('not found') || msg.includes('404');
            if (TOLERANT_FILES.has(key) && is404) {
              return { key, data: TOLERANT_EMPTY[key] || {}, sha: null };
            }
            throw err;
          }
        })
      );
      results.forEach(({ key, data, sha }) => {
        _data[key] = _normalize(key, data);
        _shas[key] = sha;
      });
      // ── Chip Unification migration (one-time, idempotent) ────────────────
      // Normalize.recipes() always returns the v2 pool shape. If the file
      // we just loaded was already v1, the in-memory data is now v2 but
      // GitHub still holds v1 — a flag we use to flush a single migration
      // commit. Also fold any legacy data/drafts.json content into the pool
      // so drafts and recipes share one canonical store going forward.
      let migratedRecipes = false;
      if (_data.recipes && Array.isArray(_data.recipes.pool)) {
        // recipes() will have returned pool shape whether input was v1 or v2.
        // We detect "needs flush" only when the GitHub-served file did NOT
        // already declare _schema_version 2, which means the disk shape is v1.
        const rawSha = _shas.recipes;
        if (rawSha) {
          // Re-fetch raw text once via _data is awkward; simpler: trust the
          // recipes file is v1 unless we already have a pool flag *and* the
          // serialized result equals the loaded input. Pragmatic shortcut:
          // if _data.recipes._schema_version === 2 AND the legacy v1 keys are
          // gone, no migration is required. Otherwise flush.
          // (recipes() drops the legacy keys, so a clean v2 input round-trips.)
        }
        if (typeof Normalize !== 'undefined' && Normalize.foldDraftsIntoPool) {
          const folded = Normalize.foldDraftsIntoPool(_data.recipes, _data.drafts);
          if (folded && folded !== _data.recipes && (folded.pool || []).length !== (_data.recipes.pool || []).length) {
            _data.recipes = folded;
            migratedRecipes = true;
            // Empty out drafts in-memory; on first save the pool becomes
            // the source of truth and drafts.json drops to an empty stub.
            _data.drafts = { drafts: [], last_updated: new Date().toISOString().slice(0,10) };
          }
        }
        // Reclassify any phantom-original pool entries (Phase 7 follow-up:
        // confirmed_favorites/wishlist/made_log entries whose v1->v2 lookup
        // missed CLASSICS_DB land as status:'original' without a seed_id;
        // reclassifyExistingPool corrects them on a one-time pass, preserving
        // overlay flags).
        if (typeof Normalize !== 'undefined' && Normalize.reclassifyExistingPool) {
          const before = (_data.recipes.pool || []).length;
          const reclassified = Normalize.reclassifyExistingPool(_data.recipes);
          if (reclassified && reclassified !== _data.recipes && !_data.recipes._reclassified_v2_2) {
            _data.recipes = reclassified;
            if ((reclassified.pool || []).length !== before) migratedRecipes = true;
            // Flag a flush even if the entry count is unchanged — the
            // _reclassified_v2_2 marker itself needs to land on GitHub so
            // we don't re-run on every load.
            migratedRecipes = migratedRecipes || true;
          }
        }
        // Flag for any caller that wants to trigger a one-time flush save.
        if (migratedRecipes) notify({ type: 'migrated', key: 'recipes' });
      }
      _loaded = true;
      notify({ type: 'loaded' });
      // Auto-persist the migration / reclassify result. The corrected pool
      // sits in memory after loadAll; without an explicit save it never
      // reaches GitHub and the next reload re-runs the same correction
      // forever. Fire-and-forget save (no await) so loadAll resolves now;
      // errors surface via the existing 'error' notify (and the toast in
      // any save callsite that listens). Guarded by _reclassified_v2_2 so
      // it never fires twice on a single boot.
      if (migratedRecipes && _data.recipes && !_data.recipes._autosaved_v2_2) {
        _data.recipes._autosaved_v2_2 = true;
        try {
          save('recipes', 'chip-unify: persist v2 pool migration + reclassify')
            .catch(err => notify({ type: 'error', error: err }));
        } catch (err) { notify({ type: 'error', error: err }); }
      }
    } catch (err) {
      notify({ type: 'error', error: err });
      throw err;
    } finally {
      _loading = false;
    }
  }

  // Detect a 409 / SHA-mismatch error from the GitHub Contents API.
  // GitHub returns at least two different formats:
  //   "X does not match Y"  (PUT with wrong SHA)
  //   "is at X but expected Y"  (alternative conflict format)
  function _isShaConflict(err) {
    if (!err || !err.message) return false;
    const m = err.message.toLowerCase();
    return m.includes('does not match') || m.includes('but expected') || m.includes('409');
  }

  // Per-key save coalescing: at most ONE save in flight per key, with at
  // most ONE additional "drain" save pending behind it. Rapid CRUD (e.g.
  // Library add → edit → remove in quick succession) used to chain a
  // distinct GitHub Contents-API write for every State.patch call; the
  // queue piled up, latency stacked, and even short transient SHA conflicts
  // produced visible "does not match" errors. Coalescing instead lets the
  // user's UI feel instant (synchronous render after patch) while the
  // network catches up with a single final save that reflects the latest
  // _data. Each _doSave reads _data[key] / _shas[key] at execution time,
  // so the drain captures every patch that happened during the prior save.
  const _activeSave  = {};   // key -> Promise currently executing
  const _pendingSave = {};   // key -> { message } — at most one slot per key

  function _drain(key) {
    const pending = _pendingSave[key];
    if (!pending) return Promise.resolve();
    delete _pendingSave[key];
    const p = _doSave(key, pending.message).finally(() => {
      if (_activeSave[key] === p) delete _activeSave[key];
      return _drain(key);
    });
    _activeSave[key] = p;
    return p;
  }

  async function _doSave(key, message) {
    const path = FILES[key];
    try {
      const result = await GitHubAPI.writeJSON(path, _data[key], _shas[key], message);
      _shas[key] = result.content.sha;
      notify({ type: 'saved', key });
      return;
    } catch (err) {
      if (!_isShaConflict(err)) throw err;
      // Stale-SHA conflict: refetch and retry up to three times with growing
      // backoff, covering GitHub's eventual-consistency window after a write
      // from another tab / client. The previous 2-retry path was sometimes
      // exhausted when a user toggled favorites rapidly across surfaces and
      // GitHub was slow to settle. Total wait across retries: 300 + 600 +
      // 1000ms ≈ 1.9s before surfacing the error to the user. Falls back to
      // readJSON if getFileSHA fails (e.g. transient network hiccup).
      let lastErr = err;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          let freshSha = await GitHubAPI.getFileSHA(path);
          if (!freshSha) {
            const fresh = await GitHubAPI.readJSON(path);
            freshSha = fresh.sha;
          }
          _shas[key] = freshSha;
          const retry = await GitHubAPI.writeJSON(path, _data[key], freshSha, message);
          _shas[key] = retry.content.sha;
          notify({ type: 'saved', key });
          return;
        } catch (retryErr) {
          lastErr = retryErr;
          if (!_isShaConflict(retryErr)) break;
          await new Promise(r => setTimeout(r, [300, 600, 1000][attempt]));
        }
      }
      throw new Error(`${lastErr.message} — reload the page to refresh file state, then try again.`);
    }
  }

  async function save(key, message) {
    // If a save is already in flight for this key, mark a pending drain (or
    // refresh the pending message) and return a promise that resolves when
    // the drain — i.e. the final write — completes. Drops intermediate
    // payloads on the floor: every _doSave reads _data[key] anew, so the
    // drain write already reflects every State.patch that happened.
    if (_activeSave[key]) {
      _pendingSave[key] = { message };
      return _activeSave[key].catch(() => {}).then(() => _drain(key));
    }
    // No active save: start one immediately.
    const p = _doSave(key, message).finally(() => {
      if (_activeSave[key] === p) delete _activeSave[key];
      return _drain(key);
    });
    _activeSave[key] = p;
    return p;
  }

  // Read-only compat shim for legacy callers of State.get('recipes'). v2 stores
  // a single `pool` array; v1 callers (recipes.js / recommender.js / etc.) read
  // `.originals` / `.confirmed_favorites` / `.wishlist` / `.made_log` as direct
  // arrays. Until those callers are rewritten in Commit 2 of the chip
  // unification, expose synthetic getters that filter the pool. Mutations
  // through these getters do NOT propagate to the pool — legacy writes are
  // accepted to be temporarily broken until Commit 2 lands (chip unification
  // is shipped as 3 atomic commits in one session, all-or-nothing).
  // Seeded pool entries are overlay-only — they store seed_id + the user's
  // flags but no core fields (name, ingredients, …). Legacy code paths
  // (Utils.sameRecipe checks in recommender.js, export.js context builders,
  // etc.) compare by name + base; without resolution they see undefined
  // values and never match a seeded classic. Resolve at shim-read time by
  // merging the live CLASSICS_DB row over the pool entry.
  function _resolveSeededForShim(entry) {
    if (!entry || !entry.seed_id) return entry;
    const db = (typeof CLASSICS_DB !== 'undefined' && Array.isArray(CLASSICS_DB)) ? CLASSICS_DB
             : (typeof globalThis !== 'undefined' && Array.isArray(globalThis.CLASSICS_DB)) ? globalThis.CLASSICS_DB
             : null;
    if (!db) return entry;
    const seed = db.find(c => c && c.id === entry.seed_id);
    if (!seed) return entry;
    // Seed core first, pool entry's overlay/meta on top (so is_favorite etc. win).
    return { ...seed, ...entry };
  }

  function _withRecipesShim(rec) {
    if (!rec || !Array.isArray(rec.pool)) return rec;
    return Object.defineProperties({ ...rec }, {
      originals:           { enumerable: false, configurable: true, get() { return rec.pool.filter(r => r.status === 'original').map(_resolveSeededForShim); } },
      confirmed_favorites: { enumerable: false, configurable: true, get() { return rec.pool.filter(r => r.is_favorite).map(_resolveSeededForShim); } },
      wishlist:            { enumerable: false, configurable: true, get() { return rec.pool.filter(r => r.is_wishlist).map(_resolveSeededForShim); } },
      made_log:            { enumerable: false, configurable: true, get() { return rec.pool.filter(r => Array.isArray(r.made_log) && r.made_log.length > 0).map(_resolveSeededForShim); } },
    });
  }

  function get(key) {
    if (key === 'recipes') return _withRecipesShim(_data.recipes);
    return _data[key];
  }

  function set(key, data) {
    // Normalize on set so corrupted import payloads cannot be persisted unfixed.
    _data[key] = _normalize(key, data);
    notify({ type: 'updated', key });
  }

  function patch(key, fn) {
    fn(_data[key]);
    notify({ type: 'updated', key });
  }

  function isLoaded() { return _loaded; }
  function isLoading() { return _loading; }

  // Check if profile has been filled out
  function isNewUser() {
    const p = _data.profile;
    return !p || !p.identity || !p.identity.full_name;
  }

  return { loadAll, save, get, set, patch, subscribe, isLoaded, isLoading, isNewUser };
})();
