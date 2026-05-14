// Central app state — loaded from GitHub, mutated by views, flushed back on save.

const State = (() => {
  const FILES = {
    barkeeper:  'data/barkeeper.json',
    profile:    'data/bar-owner-profile.json',
    inventory:  'data/inventory.json',
    recipes:    'data/recipes.json',
  };

  let _data = {};    // { barkeeper, profile, inventory, recipes }
  let _shas = {};    // { barkeeper, profile, inventory, recipes }
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
          const { data, sha } = await GitHubAPI.readJSON(path);
          return { key, data, sha };
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
  function _isShaConflict(err) {
    if (!err || !err.message) return false;
    const m = err.message.toLowerCase();
    return m.includes('does not match') || m.includes('sha') || m.includes('409');
  }

  async function save(key, message) {
    const path = FILES[key];
    try {
      const result = await GitHubAPI.writeJSON(path, _data[key], _shas[key], message);
      _shas[key] = result.content.sha;
      notify({ type: 'saved', key });
    } catch (err) {
      // BUG-03 mitigation: on stale-SHA conflict, refetch the current SHA and retry once.
      // Stale SHAs occur after partial imports, multi-tab edits, or external file changes.
      if (_isShaConflict(err)) {
        const freshSha = await GitHubAPI.getFileSHA(path);
        if (freshSha && freshSha !== _shas[key]) {
          _shas[key] = freshSha;
          const retry = await GitHubAPI.writeJSON(path, _data[key], _shas[key], message);
          _shas[key] = retry.content.sha;
          notify({ type: 'saved', key });
          return;
        }
      }
      throw err;
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
