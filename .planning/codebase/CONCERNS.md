# CONCERNS.md — Barkeeper Bjorn Web UI
> Technical debt, security gaps, fragile areas, and known issues.
> Audience: development team. Date: 2026-05-04.
> Severity scale: LOW / MEDIUM / HIGH / CRITICAL

---

## 1. Security Concerns

### 1.1 — GitHub PAT stored in localStorage with no expiry or rotation mechanism
**Severity: HIGH**
`localStorage` is accessible to any JavaScript running on the same origin. If a user ever hosts this on a shared domain or if a third-party script is injected (e.g. via a browser extension, a compromised CDN), the token is exposed. There is no session timeout, token expiry check, or revocation workflow. The token is a `repo`-scoped PAT — full read/write access to the repository. The setup page tells users it "is never sent anywhere except directly to the GitHub API," which is accurate but understates the localStorage risk.

**Specific location:** `github-api.js:9`, `views/setup.js:83–86`

**Missing:** token expiry validation, warning if token has been stored for >N days, guidance to use fine-grained PATs instead of classic `repo`-scope.

---

### 1.2 — `onerror` attribute injected into recipe detail image tags without full URL sanitization
**Severity: MEDIUM**
In `views/recipes.js:232–234`, recipe images are rendered by constructing a raw GitHub URL from `img.filename` and injecting it into an `<img src="...">` tag. `Utils.escapeHtml()` is applied, which prevents `"` injection. However, the `filename` field comes from JSON written by an LLM agent — there is no validation that the filename is a safe path string (no `../`, no protocol-relative URLs, no encoded sequences). If the LLM writes a malicious filename like `../../.env` or `data:text/html,...`, `escapeHtml` will encode the `<>` but a carefully crafted URL could still cause unexpected behavior depending on browser handling.

**Specific location:** `views/recipes.js:230–235`

**Missing:** filename validation (allowlist: alphanumeric, dash, underscore, dot, image extensions only).

---

### 1.3 — Anthropic API key planned for localStorage storage (to-do 3.1.6)
**Severity: HIGH** (pre-emptive, not yet implemented)
The roadmap explicitly plans to store an Anthropic API key in `localStorage` as `bb_anthropic_key` (to-do.md line 396–398). Anthropic API keys have billing implications — exposure of a key is financially exploitable by any script that can read `localStorage`. This concern should be addressed in the design phase before implementing 3.1.6, not after.

---

### 1.4 — No Content Security Policy header
**Severity: MEDIUM**
`app/index.html` has no `<meta http-equiv="Content-Security-Policy">` tag and `netlify.toml` does not set CSP headers. Since the app makes direct cross-origin API calls to `api.github.com` and potentially `api.anthropic.com`, a CSP could prevent XSS escalation by restricting script sources and `connect-src`. Currently any injected script can make arbitrary API calls using the stored tokens.

---

### 1.5 — No CSRF protection on GitHub API writes
**Severity: LOW** (mitigated by CORS — browser blocks cross-origin GETs that would leak the token)
The app relies on GitHub's CORS policy to block cross-origin credential theft. This is adequate for the current single-user localhost/GitHub Pages model but should be documented as a known constraint.

---

## 2. Race Conditions and State Management

### 2.1 — `loadAll()` guard does not handle concurrent navigation during load
**Severity: MEDIUM**
`state.js:26–48`: `_loading` flag prevents a second `loadAll()` call from starting, but if a user navigates to a different route while loading is in progress, the route resolves before `_loading` completes. When `loadAll()` finally resolves, `_loaded = true` is set but the current view is already rendered (or failed). The `_dataLoaded` flag in `app.js` is a local module variable — it does not subscribe to state events. If load fails and the user tries again by navigating, `_dataLoaded` remains `false` but `_loading` may still be `true` in State, causing the guard to silently return without triggering a new load.

**Specific location:** `state.js:26–30`, `app.js:31–47`

**Missing:** retry mechanism after failure that resets `_loading`; subscriber in `app.js` that re-renders after `loaded` event fires.

---

### 2.2 — `patch()` and `set()` mutate in-memory state without any undo history
**Severity: MEDIUM**
`State.patch(key, fn)` passes the live data object directly to `fn`, which mutates it in place. There is no copy-on-write, no undo stack, and no way to revert an in-progress edit without re-rendering from the same (already mutated) state. The "Discard" button in `InventoryView` calls `render(container)` which re-reads from `State.get('inventory')` — but by that point `inv` has already been mutated during the current edit session. **Discard does not actually discard changes; it re-renders from the mutated state.** Changes are only lost if the user navigates away without saving, triggering a re-read from GitHub on next load.

**Specific location:** `views/inventory.js:247–251`, `state.js:61–68`

**Impact:** The Discard button is effectively a no-op for in-session mutations. This is a silent data integrity bug — users who click Discard believe they're reverting, but are not.

---

### 2.3 — No optimistic locking or conflict detection for concurrent sessions
**Severity: MEDIUM**
The app uses GitHub SHAs to prevent stale-write conflicts (correct design), but only for sequential reads within a session. If a user has two browser tabs open, or if an LLM agent writes to a file while the web UI has it loaded, the second writer will fail with a `409 Conflict` from GitHub. The error is surfaced as a toast (`Save failed: <message>`), but there is no merge UI, no reload-and-retry flow, and no explanation that the SHA is stale. The user would need to reload the page and re-enter their changes.

**Specific location:** `github-api.js:48–57`, `state.js:51–56`

---

### 2.4 — Module-level `_dirty` flags are not reset on navigation
**Severity: LOW**
`InventoryView`, `ShoppingView`, and `ProfileView` each maintain a module-level `_dirty` boolean. If a user makes changes, navigates away without saving, and returns, `_dirty` is reset by `render()` which is correct. However, the save bar visibility check uses `document.getElementById('inv-save-bar')` — if the DOM was replaced during navigation, the reference is stale and `markDirty()` silently fails to show the save bar.

---

## 3. Error Handling Gaps

### 3.1 — `GitHub.getRateLimit()` response not checked for error status
**Severity: LOW**
`github-api.js:66–69`: `getRateLimit()` does not use the `request()` wrapper — it calls `fetch` directly without checking `res.ok`. If the call fails (network error, bad token), it silently returns `undefined` and callers get an unhandled exception on `.rate`.

---

### 3.2 — `readJSON()` does not handle malformed base64 or invalid JSON
**Severity: MEDIUM**
`github-api.js:43–44`: `atob(resp.content.replace(/\n/g, ''))` followed by `JSON.parse(text)` — neither call has a try/catch. If GitHub returns a file with corrupted content (partial upload, encoding issue), or if someone manually edits a data file with invalid JSON, the entire `loadAll()` call fails and the user sees only a generic error. There is no way to identify which file failed or recover gracefully.

**Specific location:** `github-api.js:43–44`

---

### 3.3 — `State.save()` SHA update assumes `result.content.sha` always exists
**Severity: MEDIUM**
`state.js:55`: `_shas[key] = result.content.sha;` — if the PUT response is unexpected (e.g. GitHub returns a 200 with a different body shape, or a redirect), `result.content` is undefined and this throws. The error propagates to the view's catch block, which shows a toast, but the SHA is now out of sync — subsequent saves for this key will fail with a 409 until the user reloads.

---

### 3.4 — Onboarding `saveAnswers()` fails silently for partial data
**Severity: LOW**
`views/onboarding.js:398–439`: If a user skips multiple steps, `_answers` may have very sparse data. `saveAnswers()` merges sparse answers onto whatever `State.get('profile')` currently holds (which may be an empty object `{}`). No validation occurs — a profile can be saved with only `last_updated` set, which is a valid (but useless) state that doesn't trigger `isNewUser()` returning `true` correctly, since `isNewUser()` only checks `profile.identity.full_name`.

---

### 3.5 — Shopping view "Got It" assumes `base_spirits.other` always exists
**Severity: LOW**
`views/shopping.js:154–155`: The "Got It" button does `if (!Array.isArray(current.base_spirits.other)) current.base_spirits.other = [];` — but does not check if `current.base_spirits` itself exists. If the inventory JSON is fresh and has no `base_spirits` key at all, this throws `Cannot set properties of undefined`.

---

## 4. Data Integrity Concerns

### 4.1 — Inventory items can be added as empty strings through the veto section
**Severity: LOW**
The veto add buttons check `if (!v) return;` after `.trim()` — correct. However, `renderStringItems` renders `Utils.escapeHtml(item)` for items already in the array. If the LLM agent writes a veto with an empty string or whitespace-only value, the UI renders an invisible list item with a remove button, which is confusing.

---

### 4.2 — Bottle objects and plain strings can coexist in the same inventory array
**Severity: MEDIUM**
The inventory schema expects bottle arrays (e.g. `base_spirits.whiskey`) to contain objects `{ name, tier? }`. The recommender engine maps these with `.map(s => s.toLowerCase())` — but inventory items are objects, so `s.toLowerCase()` would throw `TypeError: s.toLowerCase is not a function` on any object entry. The engine assumes string arrays (see `SECTION_MAP` in `recommender-engine.js:10–38`).

However, `InventoryView` writes objects with `{ name, tier }` to these arrays. The engine reads them with `.map(s => s.toLowerCase())` — this will fail when the inventory contains the structured objects the UI writes. **This is a mismatch between what the UI writes and what the engine reads.**

The engine works correctly only when inventory items are plain strings (as the LLM agent writes them to the markdown-sourced JSON). The web UI writes objects. If a user uses the web UI to add inventory items and then uses the recommender, every structured bottle will produce `TypeError` or return `false` from all keyword checks.

**Specific locations:** `recommender-engine.js:10–38`, `views/inventory.js:108–109`

---

### 4.3 — `classics-db.js` ingredient keyword matching is case-insensitive but not stemmed
**Severity: LOW**
The keyword matching in `recommender-engine.js:54–58` uses `.includes(kw)` on lowercased strings. This means "rum" matches "dark rum", "light rum", "rum punch mixer", and also "drummond" or "crumble" if such items appear in pantry. False positives are possible for short keywords like `'gin'` matching `'ginger beer'` or `'ginger syrup'` in the `white_spirits` section — though the `searchIn` field mitigates this by restricting which sections are searched. The `syrups` section keyword `'sugar'` would match both "simple syrup" and "sugar snap peas" if produce were searched, but `searchIn` prevents that specific case. Still, no word-boundary matching is used.

---

### 4.4 — Flavor score defaults to 0.5 when profile is incomplete — not a neutral score
**Severity: LOW**
`recommender-engine.js:65–77`: `_flavorScore` returns `0.5` when no profile exists, and also when axes have no data. Since recipes are sorted by `flavorScore` descending, recipes with 0.5 default score rank identically, and their relative order is determined only by insertion order in `CLASSICS_DB`, which is not meaningful. Users with no flavor profile see a ranked list that implies preference ordering it cannot actually compute.

---

### 4.5 — No deduplication check when adding bottles
**Severity: LOW**
`views/inventory.js:104–116`: Adding a bottle appends to the array without checking for duplicates. A user can add "Angostura Bitters" multiple times; the UI will show multiple chips and the JSON will have duplicate entries. The recommender will still work (it just finds the keyword once), but the inventory display and bottle count will be inflated.

---

## 5. Performance Issues

### 5.1 — All four JSON files loaded on every first navigation, even to read-only views
**Severity: LOW**
`app.js:31–47`: `State.loadAll()` fetches all four data files in parallel on the first non-setup navigation, regardless of which view was requested. A user navigating directly to `#recommender` loads `barkeeper.json` and `recipes.json` even though the recommender only needs inventory and profile. On slow connections or with large recipe files, this adds unnecessary latency.

---

### 5.2 — `classics-db.js` is a 755-line static JS file loaded synchronously on every page load
**Severity: LOW**
The classics database is always loaded, even on the Setup view where it's irrelevant. At current size (~75 recipes) this is negligible, but if the database grows to 500+ recipes (plausible given the roadmap), it becomes a meaningful parse-time cost. There is no lazy loading mechanism.

---

### 5.3 — SVG radar chart re-draws entirely on every slider `input` event
**Severity: LOW**
`views/profile.js:184–207`: `updateRadarPolygon()` queries and updates DOM elements on every `input` event from a range slider. While the implementation is efficient (updates only the polygon and dots, not full redraw), rapid slider movement will fire dozens of DOM updates per second. On lower-end mobile devices this could produce jank. No debounce is applied.

---

### 5.4 — No pagination or virtualization in recipe grid
**Severity: LOW** (now), **MEDIUM** (at scale)
`views/recipes.js:55–95`: All originals are rendered as DOM nodes at once. At 10–50 recipes this is fine. The roadmap anticipates community recipe sharing (3.7) which could surface thousands of recipes. No pagination, infinite scroll, or virtualization is planned in the current implementation.

---

## 6. Fragile Code Areas

### 6.1 — `State.loadAll()` failure leaves `_loading = false` but `_loaded = false`
**Severity: MEDIUM**
See also 2.1. After a failed `loadAll()`, `_loading` is reset to `false` by the `finally` block, but `_loaded` stays `false`. If the user navigates again, `app.js` will call `State.loadAll()` again — this is correct retry behavior. However, partial state from the failed load (e.g. two of four files succeeded before the error) may have been written to `_data` before the failure. The next successful load overwrites them, but the window between partial load and re-load could cause a view render from inconsistent state if a `loaded` event is fired prematurely.

---

### 6.2 — `renderBottleChips` closure captures `idx` from `forEach` — splice invalidates indices
**Severity: MEDIUM**
`views/inventory.js:136–138`: The remove button stores `data-idx` and uses `current.splice(idx, 1)`. After a splice, the array indices of all subsequent chips are invalidated, but the DOM chips still carry their original `data-idx` values. However, since `renderBottleChips` is called again immediately after each splice (re-rendering the entire grid), this is self-correcting in practice. The fragility is that any code path that calls `renderBottleChips` without also resetting event listeners after a mutation could produce off-by-one deletions.

---

### 6.3 — Onboarding resets `_step = 0` and `_answers = {}` on every `render()` call
**Severity: MEDIUM**
`views/onboarding.js:62–65`: If a user is mid-onboarding and navigates away (intentionally or accidentally via back button), all progress is lost. `_step` and `_answers` are module-level IIFE variables, but `render()` unconditionally resets them. The to-do list acknowledges this (item 3.1.7 — "Skip and return: Resume picks up from the first unanswered step"), but it is not implemented. Currently, any navigation away from onboarding destroys all progress with no warning.

---

### 6.4 — `_values` array in `ProfileView` is module-level and persists between renders
**Severity: LOW**
`views/profile.js:15`: `let _values = AXES.map(() => null)` is initialized at module load time. `render()` re-populates it from State, but if `render()` is called on a profile with fewer axes than expected (e.g. missing keys), stale values from a prior render could persist in the unfilled positions. `updateRadarPolygon()` uses `_values` directly — stale values would render incorrect radar polygon positions until the user moves a slider.

---

### 6.5 — `recommender.js` module-level `_results`, `_activeFilter`, `_activeTab` are not reset on navigation
**Severity: LOW**
`views/recommender.js:15–17`: These module-level variables persist across navigations. If a user runs the recommender, navigates away, updates inventory, and returns, `render()` will correctly re-run the engine and overwrite `_results`. But `_activeFilter` and `_activeTab` will retain the previous session's filter state, which may be surprising. More critically, if `render()` is called while `_results` is being computed (not a risk today since computation is synchronous, but would be a risk if the engine becomes async), stale results could be displayed.

---

### 6.6 — No validation that required data files exist before rendering views
**Severity: MEDIUM**
`views/inventory.js:224–226`: `if (!inv) { Utils.showError(container, 'Inventory data not loaded.'); return; }` — similar guards exist in other views. However, these guards only check for `null`/`undefined` top-level objects. They do not validate that the expected nested structure exists (e.g. `inv.base_spirits`, `inv.vetoes`). Many render functions access nested properties without null-checks (e.g. `views/shopping.js:154` accessing `current.base_spirits.other` without confirming `base_spirits` exists).

---

## 7. Architecture and Convention Violations

### 7.1 — Views directly mutate State data objects obtained via `State.get()`
**Severity: MEDIUM**
`State.get(key)` returns a direct reference to the internal `_data[key]` object. Views (inventory, profile, shopping) mutate this object in-place without going through `State.patch()` in all cases. This bypasses the subscriber notification system — mutations from direct reference edits do not fire `notify()`, so other subscribers to the same key won't see the change until `State.set()` or `State.patch()` is explicitly called. The architecture doc says "Views mutate via `State.patch()`" but the actual code frequently does `const inv = State.get('inventory'); inv.someField = ...;` directly.

**Specific examples:** `views/inventory.js:109–113`, `views/shopping.js:89–94`, `views/onboarding.js:403–438`

---

### 7.2 — `views/recipes.js` uses `document.getElementById('main-content')` as a hardcoded selector
**Severity: LOW**
`views/recipes.js:91`: `renderDetail(r, document.getElementById('main-content'))` — the recipe detail renderer reaches outside its container argument and directly references the global `main-content` element. This breaks the view isolation contract (views should only render within the `container` argument passed to `render()`). If the app's HTML structure changes or the id is renamed, this silently breaks recipe detail navigation.

---

### 7.3 — All JS modules are globals on `window` — no module isolation
**Severity: MEDIUM**
All JS files declare top-level `const` IIFEs (`GitHubAPI`, `State`, `Utils`, `RecommenderEngine`, `CLASSICS_DB`, and all `*View` objects) that attach to the global scope. Script load order in `index.html` is manually managed and order-dependent. Any naming collision with a browser API, third-party script, or future module would silently override behavior. This is an intentional "no build step" design choice, but it carries real fragility as the codebase grows.

---

### 7.4 — `classics-db.js` references `bitters_nut` in one recipe that doesn't exist in `SECTION_MAP`
**Severity: LOW**
`classics-db.js:439`: The Oaxacan Old Fashioned ingredient `searchIn: ['bitters_anchors', 'bitters_nut', 'bitters_other']` references `bitters_nut`, but `recommender-engine.js:SECTION_MAP` has no `bitters_nut` key — only `bitters_anchors` and `bitters_other`. When the engine looks up `lookup['bitters_nut']`, it gets `undefined`, falls back to an empty array `|| []`, and silently misses any mole bitters in the user's inventory. The recipe will show as unbuildable even when the user has mole bitters.

**Specific location:** `classics-db.js:439`, `recommender-engine.js:SECTION_MAP` (missing key)

---

### 7.5 — `Adonis` recipe references `bitters_fruit` section key that doesn't exist in `SECTION_MAP`
**Severity: LOW**
`classics-db.js:547`: `searchIn: ['bitters_fruit', 'bitters_other']` — `bitters_fruit` does not appear in `SECTION_MAP`. The engine will silently miss orange bitters entries. This is the same class of bug as 7.4.

---

### 7.6 — Tier system in `InventoryView` does not match schema documentation
**Severity: LOW**
`views/inventory.js:38–44`: TIERS defined as `['industrial', 'premium-accessible', 'boutique', 'rare/exceptional']`. The roadmap (to-do item 3.1.11) specifies a different expanded tier set: `Dirt Cheap → Well → Standard → Call → Premium → Ultra-Premium → Craft`. The schema files in `schema/` define yet another set. These are out of sync across three locations (code, roadmap, schema). Any tier-based filtering or display logic will behave inconsistently.

---

## 8. Scalability Limits

### 8.1 — Single GitHub repo, single user — fundamental architectural ceiling
**Severity: HIGH** (by design for now, but roadmap-critical)
The entire persistence layer is one user's GitHub repo accessed via a PAT. There is no multi-user support, no access control, and no shared state. The roadmap acknowledges this (item 3.5) and recommends Supabase. Until that migration happens, any feature that implies shared data (community recipes, forum, public profiles) is architecturally blocked.

---

### 8.2 — `recipes.json` grows unboundedly with no pagination support in the API layer
**Severity: MEDIUM**
`GitHubAPI.readJSON()` fetches the entire file on every load. GitHub's Contents API has a 1MB file size limit for the base64-encoded content response. A highly active user with hundreds of detailed recipes (including `why_it_works`, `variations`, `images` arrays) could hit this limit. No chunking or pagination mechanism exists. At that point, `readJSON()` will fail silently (GitHub returns a download URL instead of inline content for large files) and `loadAll()` will throw.

---

## 9. Browser Compatibility

### 9.1 — No polyfills for `atob`/`btoa`, optional chaining (`?.`), or nullish coalescing (`??`)
**Severity: LOW**
`atob`/`btoa` are available in all modern browsers but not in Node.js without polyfills (relevant if any tests are ever written). Optional chaining (`?.`) and nullish coalescing (`??`) are used extensively throughout — these require Chrome 80+, Firefox 74+, Safari 13.1+. No transpilation or polyfill layer exists by design. This is acceptable for the target audience (tech-savvy home bar hobbyists) but should be documented.

---

### 9.2 — `type="range"` slider styling uses `accent-color` (CSS) — not supported in Safari < 15.4
**Severity: LOW**
`views/onboarding.js:274`: `style="...accent-color:var(--amber);"` — Safari added `accent-color` support in 15.4. On older Safari, checkboxes render in default blue. The flavor axis sliders use standard `<input type="range">` which are styled via CSS in `app.css` — if cross-track styling relies on `accent-color` without a webkit fallback, sliders may not match the amber theme on older iOS.

---

## 10. Dependency Risks

### 10.1 — Entire persistence layer depends on GitHub API availability and pricing policy
**Severity: MEDIUM**
GitHub has changed API rate limits, authentication methods, and free-tier policies before. The PAT-based auth model works today but GitHub has been migrating toward fine-grained PATs and has deprecated classic PATs in some contexts. If GitHub deprecates the `repo`-scope classic PAT or changes the Contents API endpoint behavior, the entire app stops working with no fallback.

---

### 10.2 — No `package.json` or dependency lockfile — no reproducible environment
**Severity: LOW**
By design (no build step), there are no npm dependencies. This is a strength for simplicity but means there is no automated audit for supply chain risks if dependencies are ever added, and no CI pipeline to catch regressions.

---

## 11. Missing Features That Create Active Risk

### 11.1 — No "unsaved changes" warning before navigation
**Severity: MEDIUM**
If a user has unsaved inventory or profile changes and clicks a nav link, the changes are silently lost (partially — see 2.2 above). No `beforeunload` event handler or navigation guard warns the user. The sticky save bar is visible but easy to miss.

---

### 11.2 — No data validation on `writeJSON()` — malformed data can be written to GitHub
**Severity: MEDIUM**
`GitHubAPI.writeJSON()` serializes whatever JavaScript object it receives. There is no schema validation before writing. If a bug in a view produces a structurally invalid profile or inventory object, it gets written to GitHub and becomes the new "truth." On next load, the app may behave erratically or show empty views. No backup or versioning mechanism exists beyond GitHub's own commit history.

---

### 11.3 — No logout flow exists
**Severity: MEDIUM**
The roadmap notes this is needed (to-do 3.1.9), but currently there is no way to clear credentials from the UI. A user who wants to switch GitHub accounts, revoke their PAT, or clear all data must manually open browser DevTools and delete `localStorage` keys. The Setup view re-saves keys on connect but has no "disconnect" option.

---

### 11.4 — Onboarding can be navigated backward into partially-saved state
**Severity: LOW**
The "Back" button in onboarding decrements `_step` and re-renders. If the user reaches the "Done" step (which auto-saves), then presses Back and re-advances to Done, `saveAnswers()` will fire again and write a second `State.save()` call with the same or slightly different data. This produces extra GitHub commits but is otherwise harmless. However, if the user modifies an earlier answer after the first save and then re-reaches Done, the second save correctly overwrites the first.

---

## Summary Table

| # | Area | Concern | Severity |
|---|------|---------|----------|
| 1.1 | Security | PAT in localStorage, no expiry | HIGH |
| 1.2 | Security | Image filename unsanitized in img src | MEDIUM |
| 1.3 | Security | Planned Anthropic key in localStorage | HIGH |
| 1.4 | Security | No Content Security Policy | MEDIUM |
| 2.1 | State | Concurrent navigation during load | MEDIUM |
| 2.2 | State | Discard button is effectively a no-op | MEDIUM |
| 2.3 | State | No conflict resolution for concurrent writes | MEDIUM |
| 3.1 | Error Handling | getRateLimit() unchecked | LOW |
| 3.2 | Error Handling | readJSON() no try/catch on atob/JSON.parse | MEDIUM |
| 3.3 | Error Handling | SHA update assumes result shape | MEDIUM |
| 4.2 | Data Integrity | Bottle objects vs strings: engine/UI mismatch | MEDIUM |
| 4.3 | Data Integrity | Keyword false-positive potential | LOW |
| 5.1 | Performance | All 4 files loaded on any navigation | LOW |
| 6.3 | Fragile | Onboarding progress lost on any navigation | MEDIUM |
| 7.1 | Architecture | Views bypass State.patch() notification system | MEDIUM |
| 7.2 | Architecture | recipes.js hardcodes #main-content | LOW |
| 7.3 | Architecture | All modules are window globals | MEDIUM |
| 7.4 | Data | bitters_nut key missing from SECTION_MAP | LOW |
| 7.5 | Data | bitters_fruit key missing from SECTION_MAP | LOW |
| 8.1 | Scalability | Single-user GitHub PAT ceiling | HIGH |
| 8.2 | Scalability | recipes.json unbounded, 1MB GitHub limit | MEDIUM |
| 11.2 | Missing | No schema validation before writeJSON() | MEDIUM |
| 11.3 | Missing | No logout/disconnect flow | MEDIUM |

---

*Generated by gsd-codebase-mapper on 2026-05-04.*
