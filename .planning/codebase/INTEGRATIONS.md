# External Integrations

## GitHub Contents API (Primary Data Backend)

This is the only external API the application uses. GitHub acts as both the version-controlled data store and the backend database.

### Endpoints Used

All calls go through `app/js/github-api.js`:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `https://api.github.com/repos/{owner}/{repo}/contents/{path}?ref={branch}` | Read a JSON data file |
| `PUT` | `https://api.github.com/repos/{owner}/{repo}/contents/{path}` | Write (create or update) a JSON data file |
| `GET` | `https://api.github.com/repos/{owner}/{repo}` | Validate config / test token access |
| `GET` | `https://api.github.com/rate_limit` | Check remaining API rate limit |

### Authentication

- **Method**: Bearer token (GitHub Personal Access Token)
- **Required scope**: `repo`
- **Header sent**: `Authorization: Bearer {token}`
- **Additional headers**:
  ```
  Accept: application/vnd.github+json
  X-GitHub-Api-Version: 2022-11-28
  ```

### Credential Storage

The PAT and repo coordinates are stored **only in the browser's `localStorage`** under these keys:

| Key | Value |
|-----|-------|
| `bb_token` | GitHub PAT (e.g. `ghp_xxxx...`) |
| `bb_owner` | Repository owner username |
| `bb_repo` | Repository name |
| `bb_branch` | Branch name (default: `main`) |

The token is never sent to any server other than `api.github.com`. There is no backend proxy, no server-side secret store. The user enters credentials in the Setup view (`app/js/views/setup.js`).

### Data Flow

**Read path:**
1. `GitHubAPI.readJSON(filePath)` calls `GET /contents/{path}?ref={branch}`
2. GitHub returns file content as base64 + a SHA
3. `atob()` decodes the content; SHA is stored in `State._shas` for later writes

**Write path:**
1. View calls `State.patch(key, fn)` or `State.set(key, data)` to mutate in-memory state
2. View calls `State.save(key)` which calls `GitHubAPI.writeJSON(path, data, sha, message)`
3. Data is re-encoded with `btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))))`
4. `PUT /contents/{path}` is called with the base64 body, current SHA (required for updates), and a commit message
5. On success, `_shas[key]` is updated to the new SHA returned in `result.content.sha`

### Rate Limits

- 5,000 requests/hour for authenticated requests
- `GitHubAPI.getRateLimit()` is available to check remaining quota
- Displayed in the Setup view after connection validation

### Files Read/Written

All four data files live in `data/` in the user's configured repository:

| State key | File path | Contents |
|-----------|-----------|---------|
| `barkeeper` | `data/barkeeper.json` | Bartender persona config, active preset, model attribution |
| `profile` | `data/bar-owner-profile.json` | User flavor preferences, taste profile axes |
| `inventory` | `data/inventory.json` | Spirits, liqueurs, bitters, syrups, vetoes, shopping list |
| `recipes` | `data/recipes.json` | Original recipes and saved favorites |

## Databases and Storage

**No external database.** The GitHub repository itself is the data store:
- JSON files in `data/` are the runtime data
- Git history provides audit trail and version history for all changes
- Each write creates a git commit with message `"Update {filePath} via Barkeeper Bjorn web UI"`

Browser `localStorage` holds only configuration (token + repo coordinates), not application data.

## Auth Providers

**No dedicated auth provider.** Authentication is handled entirely via GitHub PAT:
- No OAuth flow
- No session cookies
- No JWT tokens
- No third-party auth service (Auth0, Firebase Auth, Clerk, etc.)

The user is considered "configured" if `localStorage` contains a non-empty `bb_token`, `bb_owner`, and `bb_repo`. The app validates the token by calling `GET /repos/{owner}/{repo}` — if this 200s, the token is valid and has repo access.

```js
// app/js/github-api.js
function isConfigured() {
  const { token, owner, repo } = cfg();
  return !!(token && owner && repo);
}
```

## CDN and Asset Hosting

**No external CDN.** All assets are self-hosted:
- `app/css/app.css` — single stylesheet, no external fonts, no CSS framework CDN
- `app/js/` — all JavaScript served from same origin
- `images/` — local PNG images (barkeeper photos, equipment photo)
- No Google Fonts, no font CDN, no icon library CDN
- SVG icons are inline in `app/index.html`

The app is served as a static site from either GitHub Pages or Netlify (see `STACK.md`).

## Webhooks and Event Systems

**No webhooks or external event systems.**

Internal event system is purely in-browser:
- `State.subscribe(fn)` — pub/sub for data load/save events
- `document.addEventListener('bb:reset-data', ...)` — custom DOM event to reset data load state after reconfiguration
- `window.addEventListener('hashchange', ...)` — hash-based routing

## Third-Party Services

| Service | Role | Notes |
|---------|------|-------|
| **GitHub** | Data storage + hosting | Both the API backend and the deployment host (GitHub Pages) |
| **Netlify** | Alternative hosting | Static file hosting only, no Netlify Functions or Forms used |
| **Claude (Anthropic)** | AI persona | Referenced in `data/barkeeper.json` as `"foundation_model": "Claude Opus 4.7"` — the barkeeper persona is designed to run on Claude but the web UI itself makes no API calls to Anthropic |

No analytics service (no Google Analytics, Plausible, Fathom, etc.).
No error monitoring (no Sentry, Datadog, etc.).
No feature flags service.
No email service.
No payment processor.

## JSON ↔ Markdown Sync Protocol

A secondary integration pattern exists between the web UI's JSON files and the LLM agent's Markdown files. This is not an external API but a documented sync contract:

- **JSON is the system of record** for the web UI (`data/*.json`)
- **Markdown is the system of record** for LLM agent sessions (`inventory.md`, `bar-owner-profile.md`, etc.)
- Each JSON file has a `_sync` metadata block tracking source MD file and hash:
  ```json
  "_sync": {
    "source_md": "inventory.md",
    "last_synced": null,
    "md_hash": null
  }
  ```
- The LLM agent detects which file is newer and resolves conflicts; the web UI does not handle this automatically

## How Credentials and Config Are Managed

| Secret | Where stored | How entered | Scope |
|--------|-------------|-------------|-------|
| GitHub PAT | Browser `localStorage` key `bb_token` | Setup view form (password input) | Client-side only, never logged or proxied |
| Repo owner | Browser `localStorage` key `bb_owner` | Setup view form | Client-side only |
| Repo name | Browser `localStorage` key `bb_repo` | Setup view form | Client-side only |
| Branch | Browser `localStorage` key `bb_branch` | Setup view form (default: `main`) | Client-side only |

There are **no server-side environment variables**, no `.env` files, no CI/CD secrets required for the app's runtime. The GitHub Actions workflow (`.github/workflows/pages.yml`) uses only the built-in `GITHUB_TOKEN` for Pages deployment permissions — no custom secrets are needed.
