# Technology Stack

## Languages

- **HTML5** — single page entry point at `app/index.html`
- **CSS3** — all styles in one file `app/css/app.css`, using CSS custom properties (variables)
- **JavaScript (ES6+)** — vanilla, no transpilation; uses `async/await`, IIFEs, `const`/`let`, template literals, arrow functions, destructuring, `Promise.all`
- **JSON** — data files in `data/`, schemas in `schema/`
- **Markdown** — agent prompt templates at repo root and in `instructions/`

No TypeScript. No JSX. No compiled language.

## Runtime Environment

- **Browser** — the entire application runs client-side. There is no server-side code.
- No Node.js runtime requirement for the app itself.
- Dev server (local only): `python3 -m http.server 8000` serving the `app/` directory. See `CLAUDE.md`.

## Frameworks and Libraries

**None.** The project is explicitly zero-dependency:

> "Vanilla ES6+ — no framework, no bundler, no dependencies." — `CLAUDE.md`

No React, Vue, Angular, jQuery, or any npm package is imported into the application. All UI rendering is done with native DOM APIs via the helper in `app/js/utils.js`:

```js
// app/js/utils.js
function el(tag, attrs = {}, ...children) {
  const elem = document.createElement(tag);
  // ...
}
```

## Build Tools and Bundlers

**None.** There is no build step, no bundler (Webpack, Vite, Rollup, esbuild), and no transpiler (Babel, TypeScript compiler).

Scripts are loaded directly via `<script src="...">` tags in `app/index.html` in dependency order:

```html
<script src="js/github-api.js"></script>
<script src="js/state.js"></script>
<script src="js/utils.js"></script>
<script src="js/classics-db.js"></script>
<script src="js/recommender-engine.js"></script>
<!-- views/ ... -->
<script src="js/app.js"></script>
```

## Package Managers

- **None** for the app itself.
- `.claude/package.json` exists for the Claude Code GSD tooling hooks (development meta-tooling), not for the web application.

## Configuration Files

| File | Purpose |
|------|---------|
| `netlify.toml` | Netlify deploy config: sets `publish = "app"`, adds SPA catch-all redirect (`/* → /index.html`, status 200) |
| `.github/workflows/pages.yml` | GitHub Actions workflow: deploys `app/` to GitHub Pages on push to `main` |
| `schema/*.json` | JSON Schema (draft-07) files validating the structure of each `data/*.json` file |
| `data/*.json` | Runtime data files — barkeeper persona, bar-owner profile, inventory, recipes |
| `.claude/settings.json` | Claude Code harness configuration (agent tooling, not app config) |
| `CLAUDE.md` | Developer guidance for Claude Code working in this repo |

### `netlify.toml` key settings:
```toml
[build]
  publish = "app"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### `.github/workflows/pages.yml` key settings:
- Triggers on push to `main` and `workflow_dispatch`
- Uploads `app/` as the Pages artifact (no build step)
- Uses `actions/checkout@v4`, `actions/configure-pages@v5`, `actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4`

## Deployment Infrastructure

Two supported deployment targets (both serve the static `app/` directory):

1. **GitHub Pages** (primary)
   - Automated via `.github/workflows/pages.yml`
   - Deploys on every push to `main`
   - No build step — raw files served directly

2. **Netlify** (alternative)
   - Config in `netlify.toml`
   - Connect repo at app.netlify.com, settings picked up automatically
   - SPA redirect rule ensures hash-based routing works on direct URL loads

## Application Architecture

- **Router**: Hash-based (`window.location.hash`). Routes: `#setup`, `#dashboard`, `#inventory`, `#recipes`, `#profile`, `#shopping`, `#recommender`. Implemented in `app/js/app.js`.
- **State management**: IIFE module pattern in `app/js/state.js`. Subscription model with `State.subscribe(fn)`. Holds 4 JSON files in memory plus their GitHub SHAs.
- **View pattern**: Each view in `app/js/views/` is an IIFE that exports a single `render(container)` function. Views are stateless — they read from `State` and call `State.patch()` / `State.save()`.

## Dev Tooling

- **Claude Code** (`.claude/` directory) — GSD (Get Shit Done) agent framework with hooks for prompt guarding, session state, workflow enforcement, and update checking.
- **Git** — version control; `.git/hooks/` contains sample hooks only (none active).
- **JSON Schema** (`schema/*.json`) — structural validation for data files; not enforced at runtime, used as documentation and for editor tooling.
- **Python http.server** — local dev server (no install required).

No linter, no formatter, no test runner is configured.
