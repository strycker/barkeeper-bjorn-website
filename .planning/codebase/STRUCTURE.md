# Codebase Structure

_Last updated: 2026-05-04_

---

## Full Directory Tree

```
barkeeper-bjorn-website/
│
├── app/                          ← Static SPA (the deployable web UI)
│   ├── index.html                ← Single HTML file; script load order matters
│   ├── css/
│   │   └── app.css               ← All styles (single file, dark amber theme)
│   └── js/
│       ├── github-api.js         ← GitHub Contents API client (read/write JSON)
│       ├── state.js              ← Central data store + pub/sub
│       ├── utils.js              ← DOM helpers, toast, date, HTML escape
│       ├── classics-db.js        ← Embedded ~75 classic cocktail recipes (static data)
│       ├── recommender-engine.js ← Pure matching/scoring logic against classics-db
│       ├── app.js                ← Router + app lifecycle (entry point, loads last)
│       └── views/
│           ├── setup.js          ← GitHub PAT + repo config form
│           ├── dashboard.js      ← Session start: stats bar + menu grid
│           ├── onboarding.js     ← Multi-step wizard for first-time profile setup
│           ├── inventory.js      ← Bottle/ingredient CRUD; 3 tabs (spirits/pantry/vetoes)
│           ├── recipes.js        ← Originals + favorites browse/detail
│           ├── profile.js        ← Flavor profile review + edit (6-axis)
│           ├── recommender.js    ← Cocktail recommendations (buildable + one-away)
│           └── shopping.js       ← Shopping list manager
│
├── data/                         ← User data JSON files (read/written by web UI via GitHub API)
│   ├── barkeeper.json            ← Bartender persona config
│   ├── bar-owner-profile.json   ← User identity + flavor preferences
│   ├── inventory.json            ← Spirits, liqueurs, bitters, syrups, vetoes, shopping list
│   └── recipes.json              ← Original recipes + confirmed favorites
│
├── schema/                       ← JSON Schema files (validation reference, not runtime)
│   ├── barkeeper.schema.json
│   ├── bar-owner-profile.schema.json
│   ├── inventory.schema.json
│   └── recipes.schema.json
│
├── images/                       ← Static image assets (not referenced by app directly)
│   ├── barkeeper_bjorn_001.png
│   ├── barkeeper_bjorn_002.png
│   ├── barkeeper_bjorn_icon.png
│   └── bar_equipment_001.png
│
├── instructions/                 ← Modular LLM agent prompt files (Claude Projects)
│   ├── core.md
│   ├── onboarding.md
│   ├── behavioral-rules.md
│   ├── communication.md
│   ├── analytics.md
│   ├── re-evaluation.md
│   └── safety.md
│
├── .github/
│   └── workflows/
│       └── pages.yml             ← GitHub Pages deploy (publishes app/ on push to main)
│
├── .planning/                    ← Planning/documentation (not deployed)
│   └── codebase/
│       ├── ARCHITECTURE.md
│       ├── STRUCTURE.md          ← this file
│       └── STACK.md
│
├── .claude/                      ← Claude Code agent configuration
│   ├── agents/                   ← Sub-agent prompt templates (gsd-* series)
│   └── commands/gsd/             ← Claude slash command definitions
│
│   ── Root-level LLM agent files (not part of web UI) ──
├── barkeeper-instructions.md     ← Single-file agent prompt (ChatGPT / Grok)
├── barkeeper.md                  ← Customizable persona (name, voice, model)
├── INIT_PROMPT.md                ← Literal paste text to start an agent session
├── bar-owner-profile.md          ← Human-readable mirror of bar-owner-profile.json
├── inventory.md                  ← Human-readable mirror of inventory.json
├── recipes.md                    ← Human-readable mirror of recipes.json
├── session-state.md              ← LLM agent session scratch pad
│
├── CLAUDE.md                     ← Claude Code project instructions
├── README.md
├── INSTALL.md
├── netlify.toml                  ← Netlify deploy config (alternative to GitHub Pages)
├── to-do.md                      ← Project task list
└── LICENSE
```

---

## Key File Locations

| Purpose | File |
|---|---|
| App entry point | `app/index.html` + `app/js/app.js` |
| Router | `app/js/app.js` — `navigate()` switch statement |
| All styles | `app/css/app.css` |
| GitHub API client | `app/js/github-api.js` |
| State management | `app/js/state.js` |
| DOM / utility helpers | `app/js/utils.js` |
| Built-in recipe data | `app/js/classics-db.js` |
| Recommendation logic | `app/js/recommender-engine.js` |
| Views directory | `app/js/views/` |
| User data files | `data/*.json` |
| JSON schemas | `schema/*.json` |
| Deployment config | `netlify.toml`, `.github/workflows/pages.yml` |
| Project guidance for Claude | `CLAUDE.md` |

---

## Naming Conventions

### JavaScript files

- **Core modules**: lowercase, hyphenated — `github-api.js`, `recommender-engine.js`, `classics-db.js`
- **Views**: lowercase, single word — `dashboard.js`, `inventory.js`, `onboarding.js`
- **Global name**: PascalCase with `View` suffix for views (`DashboardView`, `InventoryView`), plain PascalCase for core modules (`State`, `GitHubAPI`, `Utils`), SCREAMING_SNAKE for pure data (`CLASSICS_DB`)

### Data files

- `data/` files: kebab-case `.json` mirroring their schema names — `bar-owner-profile.json`
- Schema files: same stem + `.schema.json` — `bar-owner-profile.schema.json`
- Markdown mirrors: same stem `.md` at root level — `bar-owner-profile.md`

### CSS

- BEM-ish, kebab-case class names — `.bottle-chip`, `.rec-card--oneaway`, `.tab.active`
- CSS custom properties in `:root` block, `--` prefixed — `--amber`, `--bg2`, `--radius`

---

## Module Pattern

All JS modules use the **IIFE (Immediately Invoked Function Expression)** pattern to avoid globals while exposing a named public API:

```js
const ModuleName = (() => {
  // private variables and functions

  function publicMethod() { ... }

  return { publicMethod };
})();
```

This applies to every file: `GitHubAPI`, `State`, `Utils`, `RecommenderEngine`, and all `XxxView` modules. `CLASSICS_DB` is the only exception — it is a plain `const` array, not an IIFE.

---

## How New Views Should Be Added

Follow the steps from `CLAUDE.md`:

1. **Create** `app/js/views/myfeature.js` using the IIFE + `render(container)` pattern:

```js
const MyFeatureView = (() => {

  function render(container) {
    const data = State.get('relevant-key'); // read from State
    container.innerHTML = `...`;            // replace content
    // attach event listeners, call State.patch() / State.save() as needed
  }

  return { render };
})();
```

2. **Register the route** in `app.js` inside the `navigate()` switch:

```js
case 'myfeature':
  MyFeatureView.render(content);
  break;
```

3. **Add a nav link** in `app/index.html` inside `<nav id="main-nav">`:

```html
<a href="#myfeature" data-route="myfeature">
  <svg ...></svg>
  <span>My Feature</span>
</a>
```

4. **Load the script** in `app/index.html` before `app.js` (order among views doesn't matter):

```html
<script src="js/views/myfeature.js"></script>
```

5. **Add styles** to `app/css/app.css` — use existing CSS custom properties for theming.

6. **Extend schemas** in `schema/*.json` if new data fields are needed. There is no runtime schema enforcement — schemas are documentation and used by the LLM agent.

---

## What Is Auto-Generated vs Hand-Written

### Auto-generated (by LLM agent at session time)

- `data/*.json` — written by both the web UI (via GitHub API) and the LLM agent
- `session-state.md` — agent session scratch pad, overwritten each session
- `_sync` blocks inside JSON files — updated when agent syncs JSON ↔ Markdown

### Hand-written (never auto-generated)

- All `app/js/*.js` files including `classics-db.js`
- `app/index.html`
- `app/css/app.css`
- `schema/*.json`
- `instructions/*.md`
- `barkeeper.md`, `INIT_PROMPT.md`
- `netlify.toml`, `.github/workflows/pages.yml`

### Human-authored but LLM-maintainable

- `bar-owner-profile.md`, `inventory.md`, `recipes.md` — users edit these directly in agent sessions; the web UI writes the JSON counterparts

### Committed but not deployed

- `data/*.json` — deployed in the repo but read/written at runtime via GitHub API, not served as static assets
- `.planning/` — documentation only
- `.claude/` — Claude Code tooling only

---

## Special Cases and Exceptions

### Script load order is load-bearing

`app/index.html` loads scripts as plain `<script>` tags with no module system. Execution order is the dependency order. `github-api.js` and `state.js` must precede views; `app.js` must be last. Adding a module in the wrong position causes a "XxxView is not defined" runtime error.

### SHA tracking prevents write conflicts

`State._shas[key]` is updated after every successful `State.save()`. If a user has the app open in two tabs and saves from both, the second save will get a GitHub 409 (SHA mismatch). There is no resolution UI — the error surfaces as a toast.

### `data/*.json` files carry `_comment` and `_sync` metadata

These are non-standard fields the app ignores at runtime but the LLM agent reads. Do not strip them when editing JSON files directly.

### Recommender works entirely client-side

`RecommenderEngine` and `CLASSICS_DB` run in the browser with zero server calls. The classics database is embedded in `classics-db.js` (754 lines). Adding new classic recipes means editing that file directly.

### `inventory.js` mutates State data in place before saving

The inventory view calls `State.get('inventory')` to get the live object reference, then mutates arrays directly (push/splice) within the view's render scope. It tracks dirtiness with a module-level `_dirty` flag and shows a sticky "Save" bar. This is a deliberate pattern — the view is the editing surface for a complex nested structure. Other views use `State.patch()` more formally.

### `onboarding.js` mirrors the LLM agent's onboarding flow

The step sequence (`welcome → track → name → location → background → equipment → axis_* × 6 → smoke → done`) deliberately parallels the questions in `instructions/onboarding.md`. If the agent onboarding questions change, the wizard steps should be kept in sync manually.

### Netlify redirect catches all routes

`netlify.toml` includes a catch-all `/* → /index.html` redirect. GitHub Pages does not need this because hash-based routing never requires server-side route handling.

### CSS is mobile-first, single file

There are no CSS preprocessors, no component scoping, and no CSS modules. All styles live in `app/css/app.css`. The `:root` block defines all design tokens. New component styles should use existing `--` custom properties and be appended to the file in a clearly commented section.
