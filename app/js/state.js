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

  // Per-key save mutex: serialize concurrent save() calls for the same key so
  // only one outbound write is in flight at a time. Rapid CRUD (Library add →
  // edit → remove in quick succession) used to fire overlapping saves that
  // raced on the cached SHA; the single-retry path could not absorb the
  // cascade, surfacing "does not match … reload the page" errors. With this
  // queue, save(N+1) for the same key awaits save(N) before starting and so
  // sees the SHA save(N) just wrote. Different keys still save in parallel.
  const _saveQueue = {};

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
    const prev = _saveQueue[key] || Promise.resolve();
    // Chain off prev regardless of whether it resolved or rejected — a prior
    // save's error must not abort this save's attempt.
    const next = prev.catch(() => {}).then(() => _doSave(key, message));
    _saveQueue[key] = next;
    try {
      return await next;
    } finally {
      // Only clear the slot if no newer save has queued behind us; otherwise
      // the next save is still chained and the slot must remain.
      if (_saveQueue[key] === next) delete _saveQueue[key];
    }
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
