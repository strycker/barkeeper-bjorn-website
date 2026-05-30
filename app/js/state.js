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
      _loaded = true;
      notify({ type: 'loaded' });
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
      // Stale-SHA conflict: refetch and retry up to twice with brief backoff,
      // covering GitHub's brief eventual-consistency window after a write from
      // another tab / client. Falls back to readJSON if getFileSHA fails
      // (e.g. transient network hiccup).
      let lastErr = err;
      for (let attempt = 0; attempt < 2; attempt++) {
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
          // brief backoff before next attempt: 200ms, then 400ms
          await new Promise(r => setTimeout(r, 200 * (attempt + 1)));
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

  function get(key) { return _data[key]; }

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
