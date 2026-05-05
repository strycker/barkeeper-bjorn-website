# Architecture

_Last updated: 2026-05-04_

---

## Overall Pattern

**Static SPA — no build step, no framework, no bundler.**

The web UI (`app/`) is a pure vanilla ES6+ single-page application delivered as static files. There is no server-side rendering, no npm, no Webpack/Vite, and no runtime dependencies. The only external service is the GitHub Contents API, which doubles as both backend storage and deployment host.

The project is dual-purpose:

1. **Web UI** (`app/`) — browser-based bar management interface
2. **Markdown agent templates** (root-level `.md` files) — portable LLM prompt files for any AI assistant

---

## Layers and Their Responsibilities

```
┌─────────────────────────────────────────────────┐
│  Views (app/js/views/*.js)                      │  Presentation / interaction
│  Each exports render(container) — pure DOM      │
├─────────────────────────────────────────────────┤
│  app.js                                         │  Router + app lifecycle
│  Hash-based routing, State.loadAll() gating     │
├─────────────────────────────────────────────────┤
│  state.js                                       │  In-memory data store + pub/sub
│  Holds 4 JSON files; patch/set/save/subscribe   │
├─────────────────────────────────────────────────┤
│  github-api.js                                  │  Network I/O
│  readJSON / writeJSON via GitHub Contents API   │
├─────────────────────────────────────────────────┤
│  GitHub repo data/ directory                    │  Persistent storage
│  inventory.json, recipes.json, etc.             │
└─────────────────────────────────────────────────┘
```

**Support modules** that cut across layers:

| Module | Role |
|---|---|
| `utils.js` | DOM helpers, toasts, date formatting, HTML escaping |
| `classics-db.js` | Static embedded dataset (~75 canonical cocktail recipes) |
| `recommender-engine.js` | Pure computation: matches classics-db against inventory + flavor profile |

---

## Data Flow

### Read path (app boot)

```
Browser loads app/index.html
  → scripts load in order (github-api, state, utils, classics-db, recommender-engine, views…, app.js)
  → app.js IIFE runs
  → GitHubAPI.isConfigured() checks localStorage for bb_token / bb_owner / bb_repo / bb_branch
  → if not configured → redirect to #setup
  → if configured → navigate(route)
      → State.loadAll()
          → Promise.all([GitHubAPI.readJSON(path) × 4])
              → fetch GET /repos/{owner}/{repo}/contents/{path}?ref={branch}
              → atob(resp.content) → JSON.parse
          → stores parsed objects in State._data, SHAs in State._shas
          → notify({ type: 'loaded' })
      → ViewX.render(container)
          → State.get('key') to read data
          → build DOM into container
```

### Write path (user edits)

```
User interaction in a View
  → mutates in-memory copy via State.patch(key, fn) or State.set(key, data)
  → notify({ type: 'updated', key }) → any subscribed views re-render
  → user clicks "Save to GitHub"
      → State.save(key, commitMessage)
          → GitHubAPI.writeJSON(path, data, sha)
              → JSON.stringify → btoa → PUT /repos/.../contents/{path}
              → response includes new sha
          → State._shas[key] = newSha  (prevents write conflicts)
          → notify({ type: 'saved', key })
      → Utils.showToast('Saved ✓')
```

### Recommender data flow

```
RecommenderView.render()
  → State.get('inventory') + State.get('profile')
  → RecommenderEngine.recommend(inventory, profile)
      → builds flat lookup from inventory sections (SECTION_MAP)
      → iterates CLASSICS_DB
          → for each recipe: checks required ingredients (_hasIngredient)
          → scores against flavor profile axes (_flavorScore)
          → classifies as buildable / one-away / unavailable
      → returns { buildable: [...], oneAway: [...] }
  → renders recipe cards with match % score bars
```

---

## Key Abstractions

### `GitHubAPI` (IIFE module, global `GitHubAPI`)

```js
// All config from localStorage
GitHubAPI.cfg()          // → { token, owner, repo, branch }
GitHubAPI.readJSON(path) // → { data: Object, sha: string }
GitHubAPI.writeJSON(path, data, sha, message) // → GitHub API response
GitHubAPI.isConfigured() // → boolean
GitHubAPI.validateConfig() // throws on auth failure
```

The SHA is required for all updates. `readJSON` returns it; `writeJSON` requires it. After a successful write, `State` updates its stored SHA to stay in sync. This is the conflict-prevention mechanism — concurrent writes from two browsers will fail with a 409.

### `State` (IIFE module, global `State`)

```js
State.loadAll()            // loads all 4 JSON files from GitHub; sets _loaded
State.get(key)             // returns live object reference (barkeeper|profile|inventory|recipes)
State.set(key, data)       // replaces entire data object + notifies
State.patch(key, fn)       // fn receives the live object for mutation + notifies
State.save(key, message)   // writes key's data to GitHub; updates stored SHA
State.subscribe(fn)        // fn(event) — returns unsubscribe fn
State.isLoaded()           // boolean
State.isNewUser()          // true if profile.identity.full_name is absent
```

Event types emitted: `loading`, `loaded`, `error`, `updated`, `saved`.

### Views (IIFE modules, global `XxxView`)

Each view follows the same contract:

```js
const XxxView = (() => {
  // private state / helpers

  function render(container) {
    // 1. Read from State
    const data = State.get('key');
    // 2. Clear and rebuild container DOM
    container.innerHTML = '';
    // 3. Attach event listeners for mutations
    // 4. Call State.patch() / State.save() on user action
  }

  return { render };
})();
```

Views are stateless with respect to persisted data — all truth lives in `State`. Views may have local UI state (e.g., InventoryView's `_dirty` flag, RecommenderView's `_activeFilter`).

### `RecommenderEngine` (IIFE module, global `RecommenderEngine`)

```js
RecommenderEngine.recommend(inventory, profile)
// → { buildable: Array<{recipe, flavorScore, matchedIngredients}>,
//     oneAway:   Array<{recipe, flavorScore, missingIngredient}> }
```

Pure function — no side effects, no I/O. Consumes `CLASSICS_DB` (a module-level constant) plus the live inventory and profile objects from State.

### `CLASSICS_DB` (module-level constant in `classics-db.js`)

An array of ~75 hand-authored recipe objects, each with:

```js
{
  id: 'old-fashioned',
  name: 'Old Fashioned',
  base: 'Bourbon',
  method: 'stirred',
  glassware: 'Rocks glass',
  difficulty: 1,           // 1=easy, 2=medium, 3=advanced
  profile: {               // all 0..1 floats
    sweetness, acid, strength, complexity, season, risk
  },
  occasion: '...',
  ingredients: [
    {
      name: 'Bourbon or Rye',
      amount: '2 oz',
      keywords: ['bourbon', 'rye', 'whiskey', 'whisky'],
      searchIn: ['whiskey'],  // maps to RecommenderEngine.SECTION_MAP keys
      optional: false,        // if true, absence doesn't block recipe
    }
  ],
  garnish: 'Orange twist or cherry'
}
```

---

## Entry Points

### App boot (`app/index.html` + `app/js/app.js`)

`app/index.html` is the sole HTML file. Scripts are loaded as plain `<script>` tags in dependency order:

```html
<script src="js/github-api.js"></script>   <!-- must be first -->
<script src="js/state.js"></script>
<script src="js/utils.js"></script>
<script src="js/classics-db.js"></script>
<script src="js/recommender-engine.js"></script>
<!-- views (any order among themselves) -->
<script src="js/views/setup.js"></script>
...
<script src="js/app.js"></script>           <!-- must be last -->
```

`app.js` runs as an async IIFE that immediately fires the router:

```js
(async function App() {
  // ...router setup, hashchange listener, State.subscribe...
  const { route, params } = parseHash();
  if (!GitHubAPI.isConfigured()) {
    window.location.hash = '#setup';
    SetupView.render(content);
  } else {
    navigate(route, params);
  }
})();
```

### Deployment

- **GitHub Pages**: `.github/workflows/pages.yml` uploads `app/` directory on push to `main`
- **Netlify**: `netlify.toml` sets `publish = "app"` with a catch-all redirect to `index.html`
- **Local**: `python3 -m http.server 8000` then open `http://localhost:8000/app/`

---

## Module Communication Patterns

All inter-module communication goes through:

1. **Direct global calls** — views call `State.get()`, `State.patch()`, `State.save()`; `State` calls `GitHubAPI.readJSON()` / `writeJSON()`
2. **Pub/sub via `State.subscribe()`** — `app.js` subscribes once at boot to handle `error` events globally; views may subscribe for reactive re-renders
3. **Custom DOM events** — `document.dispatchEvent(new CustomEvent('bb:reset-data'))` is fired after setup to reset `_dataLoaded` in `app.js`, triggering a fresh `State.loadAll()` on next navigation

There is no framework event bus, no module imports, and no shared mutable globals except the IIFE-exposed module objects (`GitHubAPI`, `State`, `Utils`, `CLASSICS_DB`, `RecommenderEngine`, `XxxView`).

---

## State Management Approach

**Single source of truth in `State._data`**, a plain object with four keys: `barkeeper`, `profile`, `inventory`, `recipes`.

- State is loaded once per session (guarded by `_loaded` flag); resets on `bb:reset-data` event
- Mutations are synchronous (`patch` / `set`); persistence is explicit (`save`)
- No optimistic locking beyond the SHA mechanism
- No offline queue — failed saves surface as toast errors; the user must retry
- No reactive framework — views re-render by being called again via `render(container)` or by explicit `State.subscribe` callbacks that call `render`

The typical view save pattern:

```js
// Mutate in place
State.patch('inventory', inv => {
  inv.last_updated = Utils.today();
});
// Persist to GitHub
await State.save('inventory', 'Update inventory via Barkeeper Bjorn web UI');
```

---

## How Views Are Rendered and Swapped

The router in `app.js` controls which view occupies `<main id="main-content">`:

```js
async function navigate(route, params = '') {
  // ...auth + data loading guards...
  content.scrollTop = 0;
  switch (route) {
    case 'dashboard':   DashboardView.render(content);   break;
    case 'inventory':   InventoryView.render(content);   break;
    case 'recipes':     RecipesView.render(content, params ? { id: params } : {}); break;
    // ...
  }
}
```

View swapping works by replacing `container.innerHTML` entirely — there is no virtual DOM, no diffing, and no keep-alive. Each `render()` call tears down and rebuilds the view from scratch using the current State snapshot.

Navigation is driven by `window.location.hash` changes. The `<nav>` links use `href="#route"` anchors; `hashchange` events invoke `navigate()`. The `data-route` attribute on nav `<a>` tags is used only for active-class highlighting.

Sub-routes (e.g. `#recipes/my-recipe-id`) are supported: `parseHash()` splits on `/` and passes the remainder as `params`.

---

## JSON ↔ Markdown Sync

The project maintains a **dual-representation** of user data:

| Format | Used by | System of record |
|---|---|---|
| `data/*.json` | Web UI (`State`) | Web UI writes |
| `*.md` (root) | LLM agent sessions | Agent writes |

Each JSON file carries a `_sync` metadata block:

```json
{
  "_sync": {
    "source_md": "inventory.md",
    "last_synced": null,
    "md_hash": null
  }
}
```

The web UI does not implement sync logic — sync is handled by the LLM agent at the start of sessions when both representations exist and have diverged.
