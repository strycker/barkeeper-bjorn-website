# Testing

**Project:** Barkeeper Bjorn Web UI
**Last mapped:** 2026-05-04

---

## Testing Framework

**None.** There is no testing framework installed or configured anywhere in this repository. No Jest, Vitest, Mocha, Jasmine, Playwright, Cypress, or any other test runner is present.

---

## Test Files

**None exist.** A search of the entire repository found zero files matching:
- `*.test.js`
- `*.spec.js`
- Any `test/`, `tests/`, `spec/`, or `__tests__/` directories

---

## What Is Tested

**Nothing is tested automatically.** There are no unit tests, integration tests, end-to-end tests, or snapshot tests of any kind.

---

## What Is Not Tested

Everything, including:
- `GitHubAPI` module (fetch calls, base64 encoding/decoding, SHA handling, error parsing)
- `State` module (loadAll, save, patch, subscribe/notify lifecycle)
- `Utils` module (DOM helpers, escapeHtml, axisToValue/valueToAxisLabel, date formatting)
- `RecommenderEngine` (ingredient matching, flavor scoring, one-away logic)
- All view render functions (SetupView, DashboardView, InventoryView, RecipesView, ProfileView, RecommenderView, ShoppingView, OnboardingView)
- Hash-based router in `app.js`
- JSON schema validation (schemas in `schema/` are documentation only — no validation library is wired up)

---

## How to Run Tests

Not applicable. There is no test command.

---

## Current Test Coverage

**0%.** No automated coverage tooling exists and no tests have been written.

---

## Manual Testing Approach

No formal manual testing process is documented anywhere in the codebase. Based on the project's structure, the implied manual testing workflow is:

1. Serve the `app/` directory locally:
   ```bash
   python3 -m http.server 8000
   # open http://localhost:8000/app/
   ```
2. Connect a real GitHub repository via the Setup view (requires a valid PAT with `repo` scope).
3. Exercise each view manually — inventory add/remove, recipe creation, profile editing, recommender output, shopping list management.
4. Confirm data writes appear in the GitHub repository's `data/` directory as JSON commits.

This is the only testing approach referenced anywhere (in `CLAUDE.md` and `INSTALL.md`).

---

## CI/CD Pipeline

One GitHub Actions workflow exists: `.github/workflows/pages.yml`

**What it does:**
- Triggers on every push to `main` and on manual `workflow_dispatch`.
- Checks out the repository.
- Uploads the `app/` directory as a GitHub Pages artifact.
- Deploys to GitHub Pages.

**What it does NOT do:**
- It runs no tests.
- It runs no linting.
- It runs no build step (none is needed — the app is static vanilla JS).
- It has no quality gate of any kind.

In effect, CI is deploy-only. Any push to `main` goes live immediately.

**Alternative deploy:** `netlify.toml` is present with `publish = "app"` and no build command. Netlify can be used as an alternative to GitHub Pages with the same zero-test, direct-deploy approach.

---

## Recommendations (if tests are added in future)

Given the stack (vanilla ES6+ browser JS, no bundler), testing would require either:

1. **Vitest or Jest with jsdom** — extract pure logic (RecommenderEngine, Utils helpers, State mutation functions) into testable units. The IIFE/module pattern would need to be adapted or mocked.
2. **Playwright or Cypress** — browser-level end-to-end tests that exercise the full UI against a mocked or real GitHub API. The GitHub API calls would need to be intercepted (e.g., via `page.route()` in Playwright) to avoid requiring a live PAT in CI.
3. **JSON Schema validation tests** — validate that `data/*.json` files conform to `schema/*.json` using a library like `ajv`. This is the lowest-effort starting point since schemas already exist.
