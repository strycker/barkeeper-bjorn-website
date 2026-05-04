# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

Two things in one repo:

1. **Markdown agent templates** — portable prompt files that configure any LLM (Claude, ChatGPT, Gemini, Grok) as a personalized home-bar assistant
2. **Web UI** (`app/`) — a static SPA that manages bar data stored as JSON files in GitHub, with no build step or backend

## Running the App

No build step. No npm. Serve the `app/` directory directly:

```bash
python3 -m http.server 8000
# then open http://localhost:8000/app/
```

GitHub Pages deploys automatically on push to `main` via `.github/workflows/pages.yml` (publishes the `app/` directory). Netlify is also supported via `netlify.toml`.

## Architecture

### Web UI (`app/`)

Vanilla ES6+ — no framework, no bundler, no dependencies. Four JS modules wire everything together:

- **`github-api.js`** — GitHub Contents API client. All reads/writes go through `readJSON()` and `writeJSON()`. Files are base64-encoded; SHAs are required for updates (to avoid conflicts). Auth token stored only in `localStorage`.
- **`state.js`** — Central data store with a subscription model. Holds 4 JSON data files in memory (`_data`) plus their SHAs (`_shas`). Views call `State.patch()` / `State.set()` then `State.save(key)` to commit to GitHub. `State.subscribe()` triggers re-renders.
- **`app.js`** — Hash-based router (`#setup`, `#dashboard`, `#inventory`, `#recipes`, `#profile`, `#shopping`). Calls `State.loadAll()` once on first authenticated navigation.
- **`utils.js`** — DOM helpers, toast notifications, date formatting.

Each view in `app/js/views/` exports a single `render(container)` function. Views are stateless — they read from `State`, mutate via `State.patch()`, and subscribe to re-render. Views are IIFE modules; no globals.

### Data Storage

All user data lives in `data/` in the GitHub repo as JSON files:

- `barkeeper.json` — bartender persona config
- `bar-owner-profile.json` — user flavor preferences
- `inventory.json` — spirits, vetoes, shopping list
- `recipes.json` — originals and favorites

JSON schemas in `schema/` validate the structure.

### JSON ↔ Markdown Sync

The agent templates use human-readable `.md` files (`inventory.md`, `bar-owner-profile.md`, etc.). The web UI writes `.json` files. These are kept in sync bidirectionally:

- **JSON is the system of record** for the web UI
- **Markdown is the system of record** for agent sessions
- Each JSON file has a `_sync` metadata field tracking the source `.md` file hash and last sync timestamp
- The LLM agent handles sync when both exist: detects which is newer, prompts user to resolve conflicts

### Agent Templates

The root-level `.md` files are the LLM agent system:

- **Single-file** platforms (ChatGPT, Grok): use `barkeeper-instructions.md`
- **Multi-file** platforms (Claude Projects): use files in `instructions/` (modular split of the same content)
- **`barkeeper.md`** — customizable persona (name, voice, model attribution)
- **`INIT_PROMPT.md`** — literal text users paste to start a session

## Adding a New View

1. Create `app/js/views/myfeature.js` following the IIFE pattern of existing views
2. Add the route to the switch in `app.js`
3. Add a nav link in `app/index.html`
4. Add styles to `app/css/app.css` (single stylesheet, CSS custom properties for theming)
5. If new data is needed, extend the relevant `schema/*.json`

## Styling

Dark amber/bourbon theme. All styles in `app/css/app.css`. CSS custom properties defined in `:root` for colors and spacing. Mobile-first, no CSS framework.

## GitHub API Notes

- PAT requires `repo` scope
- Reads: `GET /repos/{owner}/{repo}/contents/{path}?ref={branch}`
- Writes: `PUT /repos/{owner}/{repo}/contents/{path}` with base64 body + SHA
- Rate limit: 5000 req/hour authenticated
- Config stored in `localStorage` keys: `bb_token`, `bb_owner`, `bb_repo`, `bb_branch`
