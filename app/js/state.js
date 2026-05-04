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
        _data[key] = data;
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

  async function save(key, message) {
    const path = FILES[key];
    const result = await GitHubAPI.writeJSON(path, _data[key], _shas[key], message);
    // Update SHA after successful write
    _shas[key] = result.content.sha;
    notify({ type: 'saved', key });
  }

  function get(key) { return _data[key]; }

  function set(key, data) {
    _data[key] = data;
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
