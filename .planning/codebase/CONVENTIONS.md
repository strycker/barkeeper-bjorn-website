# Codebase Conventions

**Project:** Barkeeper Bjorn Web UI
**Stack:** Vanilla ES6+, no build step, no framework, no npm
**Last mapped:** 2026-05-04

---

## Code Style Rules

### Indentation
- 2 spaces throughout all JavaScript and HTML files.
- CSS uses 2-space indentation for multi-line rules; short rules are written on a single line.

### Quoting
- JavaScript: single quotes for string literals (`'dashboard'`, `'loaded'`).
- HTML attributes: double quotes (`class="btn btn-primary"`).
- Template literals (`\`...\``) used for multi-line HTML strings injected via `innerHTML` or `btoa`/`encodeURIComponent` calls.

### Semicolons
- Semicolons are used at the end of all statements in JavaScript.

### Line length / wrapping
- No enforced column limit, but long `innerHTML` template strings are broken across lines with consistent 6-space or 8-space interior indentation.

### Blank lines
- Single blank line between top-level function declarations inside an IIFE.
- No blank lines between closely related one-liners (e.g., simple `get`/`set` helpers in `state.js`).

---

## Naming Conventions

### Files
- Lowercase, hyphenated: `github-api.js`, `recommender-engine.js`, `bar-owner-profile.json`.
- View files live in `app/js/views/` and are named after the route they serve: `inventory.js`, `dashboard.js`, `setup.js`.
- The single stylesheet is `app/css/app.css`.

### JavaScript Variables and Functions
- `camelCase` for variables and functions: `parseHash`, `showToast`, `loadAll`, `_dataLoaded`.
- Private/internal module variables are prefixed with `_`: `_data`, `_shas`, `_loading`, `_dirty`, `_results`, `_currentRoute`.
- Module-level constants (lookup tables, config arrays) use `UPPER_SNAKE_CASE`: `FILES`, `BOTTLE_SECTIONS`, `STRING_SECTIONS`, `TIER_COLORS`, `TIERS`, `BASE_FILTERS`, `SECTION_MAP`.

### CSS Classes
- Lowercase, hyphenated (BEM-influenced but not strict BEM): `.bottle-chip`, `.bottle-tier-dot`, `.inventory-section-title`, `.menu-item`, `.rec-card`, `.btn-primary`, `.btn-sm`.
- Modifier classes suffix with `--` for variants: `.rec-card--oneaway`, `.menu-item--featured`.
- State classes are plain adjectives: `.active`, `.toast-visible`.
- Tier indicator classes follow a `tier-` prefix: `.tier-industrial`, `.tier-premium-accessible`, `.tier-boutique`, `.tier-rare`.

### CSS Custom Properties
- All defined in `:root` at the top of `app.css`.
- Named by semantic role: `--bg`, `--bg2`, `--bg3`, `--bg4`, `--border`, `--border2`, `--amber`, `--amber-dim`, `--amber-glow`, `--text`, `--text-dim`, `--text-muted`, `--green`, `--red`, `--blue`, `--radius`, `--radius-sm`, `--shadow`, `--transition`.

### Data Keys
- JSON data keys use `snake_case` throughout all four data files and their schemas.

---

## Module Pattern

All JavaScript modules use the **Revealing Module Pattern via IIFE (Immediately Invoked Function Expression)**:

```js
const ModuleName = (() => {
  // private state and helpers
  let _private = ...;

  function privateHelper() { ... }

  function publicMethod() { ... }

  return { publicMethod };
})();
```

- Core modules (`GitHubAPI`, `State`, `Utils`, `RecommenderEngine`) expose named method objects.
- View modules (`SetupView`, `DashboardView`, etc.) expose a single `{ render }` object.
- **No ES module `import`/`export` syntax is used.** Script loading order in `index.html` replaces module resolution — core modules must be loaded before views, and `app.js` must be last.
- There is no bundler, transpiler, or package manager for the `app/` directory.

---

## How New Modules/Views Must Be Structured

Per `CLAUDE.md`, adding a new view requires five steps:

1. **Create** `app/js/views/myfeature.js` using the IIFE pattern:
   ```js
   const MyFeatureView = (() => {
     function render(container) {
       // Read from State, build DOM, attach event listeners
     }
     return { render };
   })();
   ```
2. **Register the route** in the `switch` block in `app.js`.
3. **Add a nav link** in `app/index.html` with a `data-route` attribute.
4. **Add styles** to `app/css/app.css` (the single stylesheet — no separate per-view files).
5. **Extend a schema** in `schema/*.json` if new data fields are needed.

Views must be **stateless** — they read from `State`, mutate via `State.patch()` or `State.set()`, and call `State.save(key)` to persist. They do not hold canonical data internally.

---

## Error Handling Patterns

- **Async operations** (`State.loadAll`, `State.save`, API calls) are wrapped in `try/catch`.
- On load failure, `Utils.showError(container, message)` renders an in-page error state (not a thrown exception that propagates to the user).
- On save failure, `Utils.showToast(message, 'error')` displays a non-blocking toast notification.
- The `State` module emits `{ type: 'error', error }` events via its subscriber system; `app.js` subscribes and converts them to error toasts.
- HTTP errors from the GitHub API are thrown as `Error(message)` where `message` comes from the API JSON body, falling back to the HTTP status text.
- Guard clauses are used in render functions: if required data is missing, `Utils.showError` is called and the function returns early.

---

## Comment Style

- **File-level comment**: first line of every JS file is a single-line description of the module's responsibility, e.g. `// Shared utilities` or `// GitHub Contents API wrapper — reads/writes JSON data files via PAT auth.`
- **Section dividers**: ASCII box-drawing separators inside IIFEs label logical groups:
  ```js
  // ─── Router ───────────────────────────────────────────────────────
  ```
- **Inline comments**: single-line `//` on the line above or end of the relevant line. Used sparingly for non-obvious logic (e.g., SHA update after write, base64 encoding details).
- **No JSDoc** annotations anywhere in the codebase.
- **CSS comments**: same ASCII divider style at the start of each section:
  ```css
  /* ─── Buttons ────────────────────────────────────────────────────── */
  ```

---

## CSS Conventions

### Custom Properties (Design Tokens)
All colors, spacing radii, and transitions are CSS custom properties defined in `:root`. Raw color values are never repeated inline — always reference `var(--token-name)`.

### Single Stylesheet
All styles live in `app/css/app.css`. There are no component stylesheets, no CSS modules, and no preprocessor. The stylesheet is organized top-to-bottom as:
1. Reset & Base
2. Layout
3. Headings
4. Component sections (Cards, Inventory, Forms, Buttons, Tabs, Toasts, Loading/Error states, etc.)
5. Responsive / mobile overrides (media queries at the end)

### Inline Styles
Inline `style` attributes are used in view JS for one-off positional or dynamic values that do not warrant a dedicated class (e.g., sticky save bars, visibility toggling). This is an accepted practice in this codebase.

### Theme
Dark amber/bourbon aesthetic. Background levels: `--bg` (darkest) through `--bg4` (lightest dark). Accent is amber (`--amber`). No light mode.

### Mobile-First
Base styles target small screens; media queries at the end of `app.css` adjust for wider viewports (e.g., `@media (max-width: 600px)`).

---

## HTML Conventions

- Single `index.html` file with a minimal shell: `<div id="app">` containing `<header>`, `<nav id="main-nav">`, and `<main id="main-content">`.
- Views render entirely into `#main-content` via JavaScript; no server-side rendering.
- Nav links use `href="#route"` hash anchors and a `data-route` attribute for JS routing.
- `<script>` tags at the bottom of `<body>`, in dependency order — no `defer`/`async` needed.
- SVG icons are inlined in HTML (not sprite sheets or icon fonts).
- `lang="en"`, `charset="UTF-8"`, and a `viewport` meta tag are present.
- `Utils.escapeHtml()` is called on all user-supplied values before insertion into `innerHTML` to prevent XSS.

---

## Git Commit Message Style

Based on `git log --oneline`:

- Conventional Commits format: `type(scope): description`
- **Types observed:** `feat`, `docs`, `fix` (inferred)
- **Scopes observed:** `recommender`, `deploy`, `app`, `roadmap`
- Description starts lowercase after the colon
- Feature version numbers sometimes appended after an em-dash: `feat(recommender): Add cocktail recommender — 3.1.2`
- Automated data-write commits use a fixed message (no conventional prefix): `Update inventory via Barkeeper Bjorn web UI`
- Merge commits follow GitHub's default: `Merge pull request #N from owner/branch`

---

## Linting and Formatting Config

**None.** There is no ESLint, Prettier, Stylelint, or any other linter/formatter configuration in the `app/` directory. The `.claude/package.json` is for the Claude Code agent framework only and is unrelated to application code. Code style is maintained by convention only.
