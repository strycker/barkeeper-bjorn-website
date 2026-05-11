# Pitfalls Research
**Project:** Barkeeper Bjorn Web UI
**Researched:** 2026-05-11
**Scope:** Features being added in the active milestone

---

## Claude API from Browser

### Pitfall 1: Missing `anthropic-dangerous-direct-browser-access` header
**Severity: CRITICAL**
**What goes wrong:** The Anthropic API blocks all browser-origin requests by default with a CORS error unless the request includes the header `anthropic-dangerous-direct-browser-access: true`. Without it, the first fetch call returns a CORS preflight failure and the user sees nothing but "Failed to fetch."
**Why it happens:** Anthropic deliberately added this friction point because embedding an API key in client-side code is an anti-pattern that exposes the key to anyone who opens DevTools.
**Prevention:** Every fetch to `api.anthropic.com` must include this header. It signals to Anthropic (and to code reviewers) that you know what you are doing and accept the exposure risk. Document this in the implementation comment.

### Pitfall 2: Mid-stream error arrives with HTTP 200 status
**Severity: HIGH**
**What goes wrong:** When streaming via SSE, the API returns HTTP 200 immediately when the stream opens. If a rate limit or overload error occurs mid-stream, it arrives as an SSE error event in the body — not as an HTTP error status. Standard `if (!res.ok)` guards do not catch it. The stream silently ends or delivers a truncated response. The user sees a half-finished message with no error indication.
**Why it happens:** HTTP status codes are determined at the start of a streaming response. Errors that occur during generation can only be signaled in-band via SSE events.
**Prevention:** Parse each SSE chunk and check for `event: error` or `"type":"error"` in the data. Maintain a `streamError` flag in the reader loop. Show an error toast when a mid-stream error is detected, not just when the fetch itself fails.
**Detection:** Test with intentionally long prompts that exhaust context windows or trigger overload.

### Pitfall 3: Rate limit 429 with no retry-after handling
**Severity: MEDIUM**
**What goes wrong:** Anthropic enforces per-minute request and token limits. A user who sends rapid follow-up messages will hit a 429 before seeing any streaming begin. The `retry-after` header indicates the wait duration, but if the implementation only shows "Request failed" the user does not know to wait.
**Prevention:** Check for 429 status before reading the stream body. Parse the `retry-after` header. Show the user a specific message: "Rate limit reached — try again in N seconds." Do not auto-retry silently (it will just hit the limit again).
**Rate limit tiers:** Tier 1 accounts (default) allow roughly 50 RPM and 50K tokens/minute for Claude Haiku, lower for Sonnet/Opus. A verbose cocktail design prompt can be 2K–5K tokens on its own.

### Pitfall 4: API key billing exposure
**Severity: HIGH**
**What goes wrong:** The Anthropic API key stored in localStorage grants full billing access. Any JavaScript on the same origin — including browser extensions injected into the page — can read `localStorage.getItem('bb_anthropic_key')` and use the key for arbitrary requests. The user bears the cost.
**Why it happens:** There is no server-side proxy to validate or restrict request types. The key is directly readable from the page context.
**Prevention:** This is an accepted tradeoff for a single-user bring-your-own-key pattern (same as the existing GitHub PAT). The mitigation is: (1) document the risk clearly in the settings UI, (2) never log or display the key, (3) ensure a Content Security Policy restricts `connect-src` to only `api.anthropic.com` and `api.github.com`, (4) recommend the user create a usage-capped Anthropic key.
**What NOT to do:** Do not store the key in any cookie, URL parameter, or ship it to any endpoint other than `api.anthropic.com`.

### Pitfall 5: Streaming stall with no timeout
**Severity: MEDIUM**
**What goes wrong:** The fetch stream can hang mid-response — Anthropic's infrastructure can silently stop sending chunks, leaving the ReadableStream reader in an `await reader.read()` that never resolves. The UI appears to be loading forever.
**Prevention:** Implement a per-chunk idle timeout using `Promise.race([reader.read(), timeout(15000)])`. If no chunk arrives in 15 seconds, abort the controller and show an error. Send the AbortController signal to the fetch call so the connection is cleaned up.

---

## localStorage API Key Risks

### Pitfall 1: Incognito / private browsing clears credentials on tab close
**Severity: MEDIUM**
**What goes wrong:** In private browsing mode, `localStorage` behaves like `sessionStorage` — all data is wiped when the private window is closed. A user who sets up the app in an incognito tab loses all credentials (GitHub PAT, Anthropic key, repo config) the moment they close the window. They must re-enter everything on next visit.
**Why it happens:** Browser security model treats private sessions as isolated ephemeral storage.
**Prevention:** No prevention is possible — this is correct browser behavior. The mitigation is clear UX: on the Setup view, add a notice "Your credentials are stored locally and will be lost if you use private browsing." Provide a way to export credentials or at least copy them from a visible read-only field.
**Extra risk — Safari:** Old Safari (pre-15) throws a `QuotaExceededError` when `localStorage.setItem()` is called in private mode, crashing any code that calls it without a try/catch. Wrap all `localStorage.setItem()` calls with try/catch.

### Pitfall 2: XSS can read all localStorage keys
**Severity: HIGH** (pre-existing, worsens with Anthropic key addition)
**What goes wrong:** localStorage is fully accessible to any JavaScript running on the same origin. With both `bb_token` (GitHub PAT) and `bb_anthropic_key` stored, a successful XSS attack yields both a repo write credential and a billing credential simultaneously. This is worse than either alone.
**Prevention:** The CONCERNS.md (1.4) already flagged the missing Content Security Policy. Adding a `<meta>` CSP tag in `index.html` that restricts `connect-src` to `api.github.com` and `api.anthropic.com` (and blocks `eval`, restricts script sources) materially reduces XSS exploitability. This must happen before the Anthropic key is added to the app.

### Pitfall 3: Key visible in dev tools / browser sync
**Severity: LOW**
**What goes wrong:** localStorage contents are visible in plain text in browser DevTools (Application tab) and may be synced via browser account sync to other devices if the user has Chrome/Firefox sync enabled for site data. This is not configurable by the app.
**Prevention:** Document that the key should be a dedicated limited-use key, not a shared or primary Anthropic account key. Recommend users check their browser sync settings.

### Pitfall 4: No expiry or rotation workflow
**Severity: MEDIUM** (pre-existing from CONCERNS.md 1.1)
**What goes wrong:** Both keys sit in localStorage with no expiry date, rotation prompt, or revocation check. A key compromised months ago could still be active. The app has no mechanism to detect a revoked key until a request fails.
**Prevention:** On each successful API call, update a `bb_anthropic_key_last_used` timestamp. On startup, if the key hasn't been rotated in >90 days, surface a non-blocking advisory. For revoked keys, catch 401 responses and prompt the user to re-enter the key rather than showing a generic error.

---

## Import/Overwrite Data Loss

### Pitfall 1: Partial import bundle missing one or more files
**Severity: CRITICAL**
**What goes wrong:** If the user imports a bundle that is missing, say, `inventory.json` (because it was exported from an older version that did not include it, or the file was manually deleted from the zip), and the import silently overwrites the GitHub repo, the user loses their live inventory permanently.
**Why it happens:** If the import logic iterates over present keys in the bundle and overwrites without checking for absent keys, missing keys are not overwritten — but if the logic first deletes all files then re-imports, missing ones are lost.
**Prevention:** Before any write, validate that the bundle contains all required keys (`barkeeper`, `profile`, `inventory`, `recipes`). If any key is missing, show a blocking error: "Import bundle is incomplete — missing [X]. No files were written." Never perform a partial overwrite.

### Pitfall 2: Importing an old-format bundle
**Severity: HIGH**
**What goes wrong:** A user exports from the current version (inventory as objects), then later imports a bundle from an older session where inventory items were plain strings. The import overwrites the structured inventory with a flat string array, breaking the recommender engine and inventory UI until data is re-entered.
**Prevention:** Check for a version field or schema fingerprint in the bundle (add `_version: "3.2"` or similar to each exported file). On import, if the bundle version differs from the current schema version, run a migration or block with a clear warning. Never silently downgrade schema.

### Pitfall 3: Import overwrites with no confirmation or backup
**Severity: HIGH**
**What goes wrong:** If import is a single-click destructive overwrite, a user who imports the wrong file (e.g. an older export) instantly loses all current data. GitHub commit history provides recovery, but most users do not know this.
**Prevention:** Before writing, show a confirmation modal that summarizes what will be overwritten: "This will replace your current inventory (47 items) and profile. Your data can be recovered from GitHub commit history, but not through this app. Continue?" Require explicit confirmation.

### Pitfall 4: SHA becomes stale after import writes
**Severity: HIGH**
**What goes wrong:** The import process writes to GitHub (updating the SHA for each file). If the in-memory `_shas` in `State` is not updated after each import write, the next user-triggered save will fail with a 409 conflict because the in-memory SHA predates the import commit.
**Prevention:** After each import write completes successfully, call `State.loadAll()` to reload all files from GitHub and refresh all SHAs. Alternatively, capture the new SHA from each import write response and update `_shas` directly. Do not let the import flow leave `State` in a stale-SHA condition.

### Pitfall 5: Import of a bundle exported from a different user's repo
**Severity: MEDIUM**
**What goes wrong:** A user imports a bundle from a friend's repo (or their own old fork). The bundle may contain barkeeper config referencing a different persona name, or inventory items calibrated to different preferences. Importing silently overwrites their personalized data.
**Prevention:** This is a feature (sharing), but it needs a preview step. Show the user the barkeeper name and a sample of inventory items before committing the import. Label clearly: "This will replace your barkeeper '[current name]' with '[imported name]'."

---

## Inventory Migration Mixed-Format

### Pitfall 1: Recommender engine crashes on object entries in string-expected arrays
**Severity: CRITICAL** (pre-existing, flagged in CONCERNS.md 4.2)
**What goes wrong:** `recommender-engine.js` does `.map(s => s.toLowerCase())` on inventory arrays expecting plain strings. After the structured-fields migration, those arrays contain `{ name, tier, brand, style }` objects. `undefined.toLowerCase()` or `({}).toLowerCase()` throws `TypeError`. Every structured bottle silently fails matching — the recommender returns zero buildable cocktails for users who have a full bar.
**Why it happens:** The UI was updated to write objects before the engine was updated to read them. The migration exacerbated an existing mismatch.
**Prevention:** The migration MUST include updating the recommender engine simultaneously. The engine should normalize entries at read time: `const name = (typeof s === 'string') ? s : s.name; name.toLowerCase()`. This defensive normalization handles mixed-format arrays during the transition period.

### Pitfall 2: Migration runs on every load, not once
**Severity: MEDIUM**
**What goes wrong:** If the migration helper runs on every `loadAll()` call (converting strings to objects each time), it is harmless but wasteful. However, if the migration is not idempotent — if it converts an already-converted object and wraps it as `{ name: { name: 'Angostura', tier: 'industrial' }, tier: undefined }` — each load corrupts the data further.
**Prevention:** Make the migration idempotent: `if (typeof item === 'string') return { name: item }; return item;`. Add a schema version flag to `inventory.json` (e.g. `"_schema_version": 2`) and only run the migration when the version is absent or 1. Set the flag after migration and save. Never run the migration on already-migrated data.

### Pitfall 3: Null or undefined entries in partially-migrated arrays
**Severity: MEDIUM**
**What goes wrong:** If an import or LLM-written file contains `null` entries in an inventory array (e.g. `["Angostura", null, "Peychaud's"]`), the migration helper must handle them. `null.name` throws. The recommender's `.filter()` or `.map()` will crash on null entries without a guard.
**Prevention:** Filter out null and non-string/non-object entries at migration time: `items.filter(item => item != null && (typeof item === 'string' || typeof item === 'object'))`. Add this filter in `getNestedArr()` in `inventory.js`.

### Pitfall 4: Migration saves before SHA refresh, triggering 409 on next save
**Severity: HIGH**
**What goes wrong:** The migration runs after `loadAll()`, mutates the inventory in memory, then calls `State.save('inventory')` to persist the migrated structure. If `_shas['inventory']` was updated correctly from `loadAll()`, this succeeds and updates the SHA. But if the migration also triggers a re-render before the save completes (because `State.patch()` notifies subscribers), and the re-render triggers another save, the second save uses the pre-migration SHA and gets a 409.
**Prevention:** Run migration before notifying any subscribers. Use a synchronous migration helper that runs during data loading, not during rendering. Avoid triggering save more than once per migration pass. Consider a `_migrating` flag to suppress subscriber notifications during migration.

### Pitfall 5: Shopping view crashes when `base_spirits` key is absent post-migration
**Severity: MEDIUM** (pre-existing, flagged in CONCERNS.md 3.5)
**What goes wrong:** `shopping.js:154–155` accesses `current.base_spirits.other` without confirming `base_spirits` exists. A freshly migrated inventory that restructures `base_spirits` from a flat key to a nested object, or a partial migration that leaves `base_spirits` undefined, causes an immediate `Cannot set properties of undefined` crash in the shopping view.
**Prevention:** Fix the guard: `if (!current.base_spirits) current.base_spirits = {}; if (!Array.isArray(current.base_spirits.other)) current.base_spirits.other = [];` — this must be patched before shipping the migration.

---

## Streaming Chat Abort/Cleanup

### Pitfall 1: No AbortController means stream runs after navigation
**Severity: HIGH**
**What goes wrong:** If the user starts a chat, then navigates to `#inventory` while a Claude response is streaming, the fetch continues in the background. The stream reader holds a reference to the DOM container that no longer exists. If the stream reader tries to update the old container (`container.innerHTML += chunk`), it operates on a detached DOM node — silent and invisible, but the network request continues consuming tokens and quota until the full response arrives.
**Prevention:** Every streaming fetch must be tied to an `AbortController`. Store the controller reference at module scope in the chat view (e.g. `let _streamController = null`). In the chat view's cleanup path (which must be added), call `_streamController?.abort()`. In the hash-based router's navigation handler (`app.js`), call the current view's `cleanup()` method before rendering the new view. This requires adding a `cleanup()` convention to the view API.

### Pitfall 2: AbortError not distinguished from API errors
**Severity: LOW**
**What goes wrong:** When `AbortController.abort()` is called, the fetch throws a `DOMException` with `name === 'AbortError'`. If the error handler treats all exceptions as API failures and shows an error toast, the user sees "Chat failed" after they deliberately navigated away — confusing.
**Prevention:** In the catch block: `if (err.name === 'AbortError') return; // clean abort, no error shown`. Only show error UI for non-abort failures.

### Pitfall 3: ReadableStream reader not released on error
**Severity: MEDIUM**
**What goes wrong:** If an error occurs mid-stream and the `catch` block does not call `reader.cancel()`, the ReadableStream remains locked. The browser retains the underlying TCP connection and the response buffer. On lower-memory devices, this accumulates across multiple failed chats.
**Prevention:** Use a `try/finally` pattern in the streaming reader: `const reader = response.body.getReader(); try { while (true) { const { done, value } = await reader.read(); ... } } finally { reader.releaseLock(); }`. Call `reader.cancel()` in the abort/error path.

### Pitfall 4: Partial chunk boundaries in SSE parsing
**Severity: MEDIUM**
**What goes wrong:** ReadableStream delivers chunks at arbitrary byte boundaries. An SSE frame that says `data: {"type":"content_block_delta","delta":{"text":"hello"}}` may arrive split across two chunks. A naive parser that does `JSON.parse(chunk)` will throw a `SyntaxError` on the partial chunk and lose the rest of the message.
**Prevention:** Maintain a buffer string across reads. Accumulate chunks into the buffer, split on `\n\n` (SSE frame delimiter), parse complete frames only, leave incomplete frames in the buffer for the next chunk. Use a TextDecoder to decode Uint8Array chunks to strings.

### Pitfall 5: Module-level streaming state not reset between chats
**Severity: LOW**
**What goes wrong:** If the chat view stores the current streamed text in a module-level variable (e.g. `let _currentResponse = ''`), navigating away and back without resetting this variable causes the previous response to appear in the new chat view.
**Prevention:** Reset all module-level streaming state at the start of each `render()` call. Do not rely on the old view container being replaced — explicitly reset `_currentResponse = ''`, `_streamController = null`, etc.

---

## GitHub SHA Conflicts

### Pitfall 1: Import writes multiple files in sequence, SHAs diverge
**Severity: HIGH**
**What goes wrong:** An export bundle contains 4 files. The import writes them sequentially. After the first write, the in-memory SHA for file 1 is updated. But if writes 2, 3, and 4 all use SHAs read at `loadAll()` time (before the import), and the import's file 1 write committed a new tree SHA, the subsequent writes may fail depending on how GitHub internally handles SHA validation for independent files. In practice, each file's SHA is independent, so this is not a problem for concurrent independent-file writes — but the SHAs captured in `_shas` are now all stale for any subsequent save operation after import.
**Prevention:** After import completes all writes, call `State.loadAll()` to refresh all SHAs from GitHub. Do not attempt any user-triggered save until this reload completes.

### Pitfall 2: Two tabs open — tab 2 saves after tab 1, 409 on tab 1
**Severity: MEDIUM** (pre-existing, flagged in CONCERNS.md 2.3)
**What goes wrong:** User opens the app in two tabs (common when sharing the URL with a non-technical friend to walk them through setup). Tab 1 saves inventory. Tab 2, which loaded earlier, still has the old SHA. Tab 2's next save throws a 409 Conflict. The toast says "Save failed" with no explanation.
**Prevention:** On 409 errors from `writeJSON()`, show a specific message: "Another session saved changes before you. Reload the page to get the latest data, then re-apply your changes." Add a "Reload" button to the error toast. Do not silently lose the user's pending changes — before reload, serialize unsaved changes to sessionStorage so they can be partially recovered.

### Pitfall 3: `State.save()` SHA update assumes `result.content.sha` always exists
**Severity: MEDIUM** (pre-existing, flagged in CONCERNS.md 3.3)
**What goes wrong:** If GitHub returns an unexpected response shape (e.g. a 200 with an empty body, or a redirect to a CDN endpoint), `result.content.sha` is undefined. The assignment `_shas[key] = result.content.sha` throws `Cannot read properties of undefined`. The in-memory SHA is now corrupted (undefined). All subsequent saves for that key will send `sha: undefined` to GitHub's API, which treats it as "create new file" rather than "update existing file", causing a 422 "blob SHA does not match" error.
**Prevention:** Guard the SHA update: `if (result?.content?.sha) { _shas[key] = result.content.sha; } else { throw new Error('GitHub write response missing SHA — reload required'); }`. Force a reload if the SHA cannot be refreshed.

### Pitfall 4: Settings page writes to both localStorage and GitHub — partial completion
**Severity: MEDIUM**
**What goes wrong:** The settings page changes both localStorage values (e.g. `bb_anthropic_key`, `bb_barkeeper_name`) and GitHub data files (e.g. `barkeeper.json` persona config). If the localStorage write succeeds but the GitHub write fails (409, network error, rate limit), the app state is split: in-memory and localStorage reflect the new name, but GitHub still has the old name. On next reload, `loadAll()` pulls the old name from GitHub, overwriting the localStorage-only change.
**Prevention:** Write to GitHub first. Only update localStorage after the GitHub write succeeds. If GitHub write fails, revert in-memory state and show an error. Never let a successful localStorage write mask a failed GitHub write.

---

## Onboarding Skip/Resume State

### Pitfall 1: `render()` resets `_step = 0` on every call — progress lost on any navigation
**Severity: HIGH** (pre-existing, flagged in CONCERNS.md 6.3)
**What goes wrong:** `OnboardingView.render()` unconditionally sets `_step = 0; _answers = {};` on line 63–64. If a user is on step 8 of 15 and clicks any nav link (accidentally or intentionally), all progress is destroyed with no warning. Returning to `#onboarding` starts over at step 1.
**Prevention:** Move `_step` and `_answers` initialization out of `render()`. Initialize them once when the module loads (`_step = 0; _answers = {};`). In `render()`, only reset if the user is explicitly starting fresh (e.g. a "Start Over" button). For the skip/return feature, persist `_step` and `_answers` to `sessionStorage` after each step advance, and restore from `sessionStorage` in `render()` if a partial session exists.
**State to persist:** `{ step: _step, answers: _answers }` under key `bb_onboarding_draft`.

### Pitfall 2: Skipping steps leaves `_answers` sparse — `saveAnswers()` writes incomplete profile
**Severity: MEDIUM** (pre-existing, flagged in CONCERNS.md 3.4)
**What goes wrong:** If a user skips the `name` step, `_answers.identity` is never set. `saveAnswers()` merges into `State.get('profile')` which may be `{}`. The resulting profile has `last_updated` but no `identity.full_name`. `State.isNewUser()` checks `profile.identity.full_name` — if absent, it returns `true` and the dashboard shows the new-user CTA forever, even though the user thinks they completed onboarding.
**Prevention:** On `saveAnswers()`, run a completeness check before saving. If required fields (`identity.full_name`) are absent, either (a) show a prompt: "You skipped the name step. Add a name now or continue with 'Anonymous'?" or (b) default required fields: `identity.full_name = 'Home Bartender'` as a named default. Do not silently save an incomplete profile that leaves the app in a perpetual new-user state.

### Pitfall 3: "Skip" to resume later, but `saveAnswers()` has already fired
**Severity: MEDIUM**
**What goes wrong:** The current onboarding auto-saves on the "done" step. If the user reaches "done", a profile is saved, then they press Back (the onboarding lets them), modify an axis answer, then reach "done" again — `saveAnswers()` fires a second time. Two GitHub commits are made for the same session. This is harmless in practice, but if the skip/return feature stores a draft in `sessionStorage`, there is now a conflict between the live GitHub profile and the in-progress `sessionStorage` draft. Which is authoritative?
**Prevention:** Define the rule explicitly: if `State.get('profile').identity.full_name` already exists (onboarding was completed at least once), the draft in `sessionStorage` should merge new answers onto the existing profile rather than replace it wholesale. Clear the `sessionStorage` draft immediately after `saveAnswers()` succeeds.

### Pitfall 4: Returning user forced through onboarding because `isNewUser()` returns true on edge case profile
**Severity: LOW**
**What goes wrong:** A user who completed onboarding but has a profile where `identity.full_name` is an empty string (set by an LLM agent, an old format, or a UI bug) will be treated as a new user on every dashboard load. The dashboard shows the onboarding CTA. If they click it, they start onboarding again, which resets their flavor profile if they complete it.
**Prevention:** `isNewUser()` should check `profile.identity.full_name?.trim()` not just `profile.identity.full_name`. Add a fallback: if the profile has `last_updated` set (any onboarding was completed), do not treat as new user even if name is empty.

### Pitfall 5: Onboarding state in sessionStorage survives cross-tab
**Severity: LOW**
**What goes wrong:** `sessionStorage` in most browsers is per-tab, not per-session. If the user opens the app in a new tab, the new tab does not have access to the onboarding draft from the original tab. This is fine. However, if the user somehow shares a sessionStorage key with a non-onboarding tab (a bug or naming collision), the draft could be loaded when unintended.
**Prevention:** Use a namespaced key (`bb_onboarding_draft`) and always confirm the draft belongs to the current user by checking that the GitHub config matches (same `bb_owner`/`bb_repo`) before restoring.

---

## Phase Mapping

| Pitfall | Severity | Phase to Address |
|---------|----------|-----------------|
| Missing `anthropic-dangerous-direct-browser-access` header | CRITICAL | Claude API integration phase |
| Mid-stream error with HTTP 200 | HIGH | Claude API integration phase |
| Rate limit 429 with no retry-after | MEDIUM | Claude API integration phase |
| Streaming stall / no idle timeout | MEDIUM | Claude API integration phase |
| API key billing exposure | HIGH | Settings / Claude API phase (CSP before key storage) |
| Incognito localStorage cleared | MEDIUM | Settings page phase |
| XSS readable localStorage | HIGH | Settings page phase (add CSP before Anthropic key) |
| No key expiry/rotation | MEDIUM | Settings page phase |
| Partial import bundle missing files | CRITICAL | Export/Import phase |
| Importing old-format bundle | HIGH | Export/Import phase |
| Import with no confirmation or backup | HIGH | Export/Import phase |
| Import leaves stale SHAs | HIGH | Export/Import phase |
| Recommender crashes on object entries | CRITICAL | Inventory migration phase (must fix before shipping migration) |
| Migration not idempotent | MEDIUM | Inventory migration phase |
| Null entries in partially-migrated arrays | MEDIUM | Inventory migration phase |
| Migration save triggers 409 | HIGH | Inventory migration phase |
| `base_spirits` absent post-migration crash | MEDIUM | Inventory migration phase (fix shopping.js guard first) |
| No AbortController on stream | HIGH | Claude API integration phase |
| AbortError shown as API error | LOW | Claude API integration phase |
| ReadableStream not released on error | MEDIUM | Claude API integration phase |
| Partial chunk boundaries in SSE parsing | MEDIUM | Claude API integration phase |
| Import SHA stale after multiple file writes | HIGH | Export/Import phase |
| Two-tab 409 with unhelpful error | MEDIUM | Settings / core stability phase |
| SHA update assumes `result.content.sha` exists | MEDIUM | Core fix (pre-existing, any phase that does saves) |
| Settings partial completion (localStorage vs GitHub) | MEDIUM | Settings page phase |
| `render()` resets onboarding progress | HIGH | Onboarding UX phase |
| Sparse `_answers` leaves profile incomplete | MEDIUM | Onboarding UX phase |
| Draft conflicts with live GitHub profile | MEDIUM | Onboarding UX phase |
| `isNewUser()` false positive on empty name | LOW | Onboarding UX phase |

---

## Sources

- Anthropic CORS announcement and risks: https://simonwillison.net/2024/Aug/23/anthropic-dangerous-direct-browser-access/
- Anthropic SDK mid-stream SSE error issue: https://github.com/anthropics/anthropic-sdk-python/issues/1258
- Anthropic rate limit docs: https://docs.anthropic.com/en/api/rate-limits
- Anthropic streaming docs: https://platform.claude.com/docs/en/build-with-claude/streaming
- Anthropic error docs: https://platform.claude.com/docs/en/api/errors
- localStorage security risks: https://snyk.io/blog/is-localstorage-safe-to-use/
- localStorage incognito behavior: https://bugzilla.mozilla.org/show_bug.cgi?id=1526949
- GitHub 409 Conflict / SHA race condition: https://github.com/orgs/community/discussions/62198
- AbortController patterns: https://developer.mozilla.org/en-US/docs/Web/API/AbortController
- ReadableStream abort and memory leaks: https://github.com/anthropics/claude-code/issues/33380
- Multi-step form save/resume patterns: https://appmaster.io/blog/save-and-resume-multi-step-wizard
- Existing codebase analysis: /home/user/barkeeper-bjorn-website/.planning/codebase/CONCERNS.md
