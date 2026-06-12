---
phase: 7
phase_name: "ai-integration"
project: "Barkeeper Bjorn"
generated: "2026-06-12"
counts:
  decisions: 14
  lessons: 10
  patterns: 11
  surprises: 9
missing_artifacts:
  - "07-VERIFICATION.md"
---

# Phase 7 Learnings: AI Integration

Phase 7 shipped Claude integration across every user-facing surface — persisted #chat thread + ephemeral quick-ask drawer (CHAT-01..09, AI-02), AI-03 generate→draft→refine→promote flow, AI-04 Ask-Bjorn entry points on cards and chips (REC-04), AI-05 best-bottle advice, AI-06/AI-07 Classroom + lesson-scoped Q&A, LIB-01 Library CRUD, AI-08 legacy-MD import, AI-09 call-log panel, AI-10 JSON repair, AI-11 paste-a-line Claude fallback, AI-12 wizard persona drafter, AI-13 recommender derivation fallback. The phase spanned 6 atomic plan commits (07-01..07-06), a 3-commit chip-unification mini-phase that emerged mid-UAT, and ~30 in-flight UAT fixes. 18/18 live-key UAT tests pass.

## Decisions

### Direct Anthropic Messages API via browser fetch — no SDK
The framework selector recommended direct Messages API (`POST https://api.anthropic.com/v1/messages`) over the `@anthropic-ai/sdk` package because the project is a static vanilla-JS SPA with no build step. Single chokepoint module `app/js/claude-api.js` exposes `streamMessage / requestJSON / callMessages / buildContext / deriveContextMarkdown / extractJSON / appendLog`. Header block reused verbatim across every call: `content-type`, `x-api-key`, `anthropic-version: 2023-06-01`, `anthropic-dangerous-direct-browser-access: true`.

**Rationale:** Avoid an npm dependency in a no-build app. Concentrates auth, header hygiene, streaming SSE parsing, and structured-output retry logic in one IIFE module. AI-SPEC § 3-4 made the contract authoritative for every consumer plan.
**Source:** 07-AI-SPEC.md § 3, § 4, § 4b; 07-01-PLAN.md Task 1; 07-01-SUMMARY.md

---

### Three-tier model selection: Haiku / Sonnet (default) / Opus
Three valid model IDs hard-coded: `claude-haiku-4-5` (summarization, paste-a-line, fast cheap reads), `claude-sonnet-4-6` (default — chat, generate, repair), `claude-opus-4-7` (user-elected for max quality). Bare aliases only — no date suffixes. SET-05 model selector writes `localStorage.bb_chat_model`; defensive `currentChatModel()` rejects unknown IDs and falls back to sonnet (handles a lingering stale `claude-sonnet-4-5-20250929`).

**Rationale:** Bare aliases let Anthropic rotate the underlying model without code change. Locking to a date risks the app silently breaking when the alias expires. Tiered selection lets the user trade cost for quality per personal taste.
**Source:** 07-AI-SPEC.md § 4; 07-02-PLAN.md SET-05; 07-02-SUMMARY.md

---

### D-01: Single shared quick-ask drawer (no bespoke chat panels)
All ten Ask-Bjorn entry points (recommender cards, recipes chips, inventory toolbar, dashboard, bartender wizard, classroom lessons, library links, etc.) route to a single `ChatView.openDrawer({seed})` helper. Each call seeds a fresh ephemeral drawer with context-appropriate prompt text. The drawer self-gates on `ClaudeAPI.getKey()`.

**Rationale:** One streaming code path, one abort controller, one no-key affordance, one SSE parser. Cuts maintenance N-fold vs. per-view panels and ensures consistent UX across surfaces.
**Source:** 07-CONTEXT.md D-01; 07-03-PLAN.md; 07-04-PLAN.md; 07-05-PLAN.md

---

### D-02 / D-03: Two surfaces with different persistence semantics
Persisted `#chat` page uses `localStorage.bb_chat_history` with manual "Save conversation to GitHub" → `data/conversations/chat-<ts>-<rand>.json` (write-only from the app, not registered in State.FILES, not reloaded, not in exportAIContext — Phase 8 may revisit round-trip). Ephemeral quick-ask drawer never persists — closing it discards the transcript.

**Rationale:** Drawer is a question-and-go surface — persistence would clutter localStorage. The #chat page is a deliberate conversation — persistence is expected. Manual GitHub save (not auto) avoids per-message commit floods.
**Source:** 07-CONTEXT.md D-02 / D-03; 07-03-PLAN.md; 07-03-SUMMARY.md; M-3 fix in 07-PLAN-CHECK.md

---

### D-04 / D-05: Rich cached system context (not a token budget)
`ClaudeAPI.buildContext()` returns system blocks with the last block tagged `cache_control: {type: 'ephemeral'}`. That cached block contains a markdown derivation of barkeeper persona + flavor profile + inventory + vetoes + originals + drafts + made-log (via `deriveContextMarkdown()`, which reuses `export.js exportAIContext` style). Volatile content (question, timestamp) NEVER lands in the cached block.

**Rationale:** Anthropic prompt caching only kicks in if the cached block is byte-identical across requests. Putting the question or any volatile in the cached block defeats caching entirely. Pitfall 5 (volatile cache content) was a documented planning concern that prevented the bug.
**Source:** 07-CONTEXT.md D-04 / D-05; 07-AI-SPEC.md § 3; 07-RESEARCH.md "Pitfall 5"; 07-01-PLAN.md Task 1 action step 6

---

### D-06: Markdown-derived context, NOT round-trippable export
Context derivation reuses the `export.js exportAIContext` markdown walk style: it's intentionally lossy (drops timestamps, internal ids, etc.) because it goes to the model as plain text, not back into the app. Phase 8 owns the strict round-trippable export contract — `deriveContextMarkdown` is explicitly NOT it.

**Rationale:** Conflating context-for-LLM with portable-export would have leaked Phase 8 scope into Phase 7. Inline comment in `deriveContextMarkdown` documents the boundary for future readers: "context derivation, lossy-OK — NOT the Phase 8 round-trippable export contract."
**Source:** 07-CONTEXT.md D-06; 07-RESEARCH.md; 07-01-PLAN.md Task 1 action step 5

---

### D-11 + chip-unification: drafts collapse into a unified pool
Originally planned as a 5th State file (`data/drafts.json`). The chip-unification mini-phase (Tests 12-flagged friction) collapsed drafts INTO `recipes.pool` as `status: 'draft'` entries. The separate drafts file became deprecated; the file remains as an empty stub for compat. Promote-to-Original mutates `status: 'draft' → 'original'` in place — no array-move between separate storage locations.

**Rationale:** The original 5-file design had drafts and originals as physically separate storage but logically the same "user-edited recipe in some lifecycle phase." Collapsing eliminated dual-storage write paths and the entire class of "draft saved but Original promote raced the drafts SHA" bugs.
**Source:** 07-CONTEXT.md D-11; chip-unification-plan.md; commit 946e3c9 (1/3); 07-UAT.md Test 12 fix attribution

---

### Hybrid C1 (chip-unification): seeded core uneditable but NOT visually grayed
Classics in the pool are stored overlay-only — they carry `seed_id`, `is_favorite`, `is_wishlist`, `made_log`, etc., but NO core fields (`name`, `ingredients`, `method`). Core is read live from `CLASSICS_DB` at render time via `RecipeChip.resolveCore(recipe)`. The edit form makes core fields `readonly` (functional uneditability) without applying a visual gray treatment.

**Rationale:** User wanted clear interactivity signals without visual nagging. Grayed-out fields are noisy; `readonly` honors the no-modify intent without screaming about it. Three defense layers: schema description, normalize.recipe drops core when seed_id set, save handler routes to overlay only.
**Source:** chip-unification-plan.md; 07-UAT.md (user's C1 selection mid-phase); recipes.js renderForm isSeededClassic branch

---

### C2 (chip-unification): overlay-only references to seeds, not copies
Pool entries with `seed_id` set DO NOT copy the seed's core into the pool — the seed is the source of truth and `resolveCore` overlays the user's flags on top at render time. Trade-off: classic recipes inherit any future classics-db edits automatically (efficiency win, automatic updates).

**Rationale:** Storing copies would mean each user's data file balloons by ~169 classic recipes × N favorites, and a typo fix to a classic's recipe wouldn't propagate. Live overlay keeps the storage minimal and the source-of-truth singular.
**Source:** chip-unification-plan.md; commit 946e3c9 design notes; user's C2 selection

---

### "Tweak with AI" panel on EVERY chip, not just drafts
`RecipeChip.render()` includes a collapsible `<details class="recipe-chip-tweak">` panel on every chip (classics, originals, drafts). Tweaking ANY chip forks into a new draft with `parent_id` pointing back. User picks a chip from any source and refines it without leaving the chip context.

**Rationale:** The original design had a separate "Generate with AI" entry point per surface. The unified chip + per-chip tweak eliminated the "where's the AI thing on this view?" navigation problem.
**Source:** chip-unification-plan.md; commit cc5df53 (3/3); 07-UAT.md Test 12

---

### Fail-closed AI writes: schema-validate + diff preview + explicit confirm
Every AI-driven write to GitHub goes through `WriteGate.gate({schemaKey, oldData, newPayload, message, onConfirm})`: coerce via Normalize → validate against schema → render an old-vs-new diff preview → wait for explicit user confirm → only THEN run `onConfirm()` (which does State.set + State.save). Invalid payloads NEVER offered for write. Used by AI-03 (drafts), AI-08 (legacy-MD import), AI-10 (JSON repair). AI-11 (paste-a-line) and AI-13 (derivation) use `callMessages` + `extractJSON` directly because they're read-style helpers, not writes.

**Rationale:** Schema-validate alone catches structural errors; diff preview gives the user agency over what's actually written; explicit confirm prevents silent overwrites; the fail-closed default ensures bugs default to "don't write anything," not "write garbage."
**Source:** 07-AI-SPEC.md § 6; 07-01-PLAN.md Task 3; 07-06-PLAN.md Task 1; 07-RESEARCH.md Pattern 3

---

### Auto-approve `checkpoint:human-verify` in yolo mode
Each of the four user-facing plan checkpoints (07-03 chat, 07-04 classroom+library, 07-05 AI-into-views, 07-06 data-ops) defines a `checkpoint:human-verify` task. The execute-phase workflow auto-approves these in yolo mode and proceeds. Actual UAT happens later via `/gsd-verify-work` once a BYOK key + browser are available.

**Rationale:** Mid-execution human pauses don't make sense in an unattended container without a live key. The checkpoint becomes a marker for "this task can't be unit-tested; queue for UAT." UAT then becomes the real human-in-the-loop verification.
**Source:** 07-CONTEXT.md D-15; all 07-{03,04,05,06}-PLAN.md checkpoint tasks; execute-phase workflow auto-approval rule

---

### AI-13 uses `callMessages` directly, NOT `requestJSON`
The derivation helper (`RecommenderEngine.deriveWithAI`) bypasses `requestJSON` because requestJSON would dispatch `Normalize.byKey('inventory', singleBottle)` which collapses a single-bottle payload into an empty inventory (the bottle fields are dropped because they don't match the top-level inventory schema). Instead AI-13 calls `callMessages` + `extractJSON` directly and wraps the result.

**Rationale:** Documented as a Rule 3 deviation from the plan during execution. AI-13's output isn't a top-level schema-keyed payload; it's a `{derived: boolean, from?: string}` decision. Forcing it through requestJSON's schema-key dispatch would have lost the answer.
**Source:** 07-05-SUMMARY.md (Task 4 deviation); recommender-engine.js inline comment; AI-11 (commit f1ed4be) for the analogous pattern in inventory.js

---

### Reset-sweep semantics (Test 1 → end-of-UAT fix-up)
"Reset all data" now: clears the original 4 data files + drafts + library + `bb_chat_history` + `bb_api_log` + `bb_parse_cache` + `bb_derivation_cache`. PRESERVES `bb_chat_model` (UI preference, not data), `bb_anthropic_key`, and GitHub credentials. Originally had this inverted — was clearing the model preference and leaving the chat thread intact.

**Rationale:** UI preferences (which model to use) are like dark-mode — they should survive a data reset. The chat thread IS user data — it should be cleared alongside inventory/recipes. The original design was over-eager because the developer thought "clear everything Phase-7-related" rather than distinguishing data from preference.
**Source:** 07-UAT.md Test 1 disposition (RESOLVED 2026-06-12); commit 5ec4a2a

---

## Lessons

### Browser top-level `const` does NOT attach to `globalThis`
`const CLASSICS_DB = [...]` declared at the top of `app/js/classics-db.js` is accessible to other top-level scripts via the bare identifier `CLASSICS_DB`, but `globalThis.CLASSICS_DB` is `undefined`. Code in `recipe-chip.js` and `normalize.js` that probed via `globalThis.CLASSICS_DB` silently returned null, causing seeded chips to render blank and v1→v2 migration's seed lookup to miss every classic. Required commit 2754c2b to add a `(CLASSICS_DB || globalThis.CLASSICS_DB)` fallback pattern.

**Context:** Surfaced post-chip-unification when seeded entries (overlay-only, no name in pool) couldn't resolve their core fields. Browser script-level `const` lives in the global lexical environment, not on the global object. Tests stubbed `globalThis.CLASSICS_DB = [...]` so the bug never showed up in node:test.
**Source:** 07-UAT.md chip-unification follow-up; commit 2754c2b

---

### Save-storm patterns are SEVERAL stacked bugs, not one
Library save reliability under rapid CRUD required FOUR sequential targeted fixes: (1) per-key save mutex `6f385cd` for concurrent save() race, (2) WeakMap-based listener-stacking fix `14f79f4` for "remove 1 = remove 2" via duplicate handlers, (3) TOCTOU index-staleness `84d2311` because DOM kept stale `data-index` attrs until save's `.then(render)` fired ~500ms later, (4) per-key save coalescing `35e916b` to collapse rapid actions into ≤1 in-flight + ≤1 pending. Each fix individually wasn't enough — the user had to push back four times.

**Context:** The mental model "one save mutex fixes everything" was wrong. The actual problem was a stack: race in async save chain, race in event handlers, race in DOM-vs-state freshness, queue buildup under rapid clicks. Each fix addressed a different layer. Optimistic UI (`506854d`) was the FIFTH lesson — show toast + rerender BEFORE awaiting GitHub round-trip so the user perceives the app as instant.
**Source:** 07-UAT.md Test 8 caveat; commits 6f385cd / 14f79f4 / 84d2311 / 35e916b / 506854d

---

### `WriteGate.validate` is async — missing `await` manifests as `errors.join is not a function`
`WriteGate.validate(schemaKey, payload)` lazy-fetches `schema/<key>.schema.json` on first use and is async. `requestJSON` in claude-api.js originally assigned the promise to `errors` without awaiting — `errors.length === 0` was always false (a Promise has no `length`), the retry path fired, and the next iteration tripped `errors.join('; ')` with "errors.join is not a function." Symptom hit during Test 12 AI-03 generate.

**Context:** Tests stubbed `WriteGate.validate` with a synchronous fixture so the missing-await gap was invisible to the deterministic test suite. Only the real browser path against the real lazy-schema-fetching `_loadSchema` exposed it.
**Source:** 07-UAT.md Test 12; commit 97b6c6c

---

### Schemas at `/schema/` aren't deployed by GitHub Pages publishing `app/`
The repo layout puts JSON schemas at `<repo-root>/schema/` (versioned with code, separate from `app/`). GitHub Pages publishes the `app/` directory as the site root. So `https://<user>.github.io/<repo>/schema/inventory.schema.json` is a 404. The `_loadSchema` three-path probe (`../schema/`, `schema/`, `GitHubAPI.readJSON`) handles local dev (served from repo root) but the GitHubAPI fallback was also failing for the user's setup (probably scope/path issue).

**Context:** AI-11 in commit 6dd0a74 had to gracefully degrade: treat `['no schema']` as benign when the candidate has the right shape constructed (style/type/brand/tier explicitly populated from the model output). The fail-closed contract still holds for AI-08 / AI-10 / AI-03 — those use richer payloads where the schema actually matters.
**Source:** 07-UAT.md Test 18; commit 6dd0a74

---

### State keys ≠ schema filenames (the `profile` exception)
`State.FILES.profile` points to `data/bar-owner-profile.json` (historical name). The schema file is `schema/bar-owner-profile.schema.json` matching. But the `schemaKey` passed to `requestJSON` is `'profile'`, and the `_loadSchema` lookup used `${schemaKey}.schema.json` — yielding `schema/profile.schema.json` which doesn't exist. AI-08 import + AI-10 repair both failed with "no schema" for the profile section. Fixed by adding a `_SCHEMA_FILENAME = { profile: 'bar-owner-profile' }` map.

**Context:** All other State keys (inventory, recipes, barkeeper, drafts, library) match their schema filenames 1:1. Profile is the lone exception due to legacy file naming. The map preserves backward compat without a rename.
**Source:** 07-UAT.md Test 16; commit bcb7d2c

---

### Pre-existing data shapes have inertia — migration flags need versioning
Original chip-unification commit `3129e81` ran a reclassify pass with a broken lookup ("& vs and" mismatch). The pass matched nothing but still set `_reclassified_v2_1: true` on the pool. That flag got persisted to GitHub on the next save. When commit `5646147` shipped the corrected lookup, the early-return guard at the top of `reclassifyExistingPool` saw the stale `_v2_1` flag and skipped the rerun entirely. Required `4044db5` to bump the flag to `_v2_2` so corrected logic runs again on already-flagged pools.

**Context:** Idempotency flags are inviting to set early as a "won't rerun" guard, but they need a version coupled to the implementation. Bug fixes to migration logic itself force a flag bump. Generalize: any one-time-migration flag pattern should include a version that bumps WITH the logic.
**Source:** 07-UAT.md commits 3129e81 / 5646147 / 4044db5

---

### Search for ALL add paths when retro-fitting a feature
AI-11 was wired into `addBtn.addEventListener('click', ...)` (line 305) but NOT into `commitQuickAdd` (line 676) — a SECOND add-bottle handler used by the Quick Add picker. Test 18 surfaced "no API hits whatsoever" because the user's flow used the Quick Add path. Required `97c80e1` to mirror the AI-11 fallback in `commitQuickAdd`.

**Context:** Inventory.js has two add-bottle UIs (per-section input + global Quick Add picker), each with their own handler. The planner's Pattern Mapping (07-PATTERNS.md) called out `parseBottleEntry` as the seam but didn't enumerate every call site. Lesson: when retro-fitting a feature on top of an existing helper, grep for EVERY call site and verify each carries the new behavior.
**Source:** 07-UAT.md Test 18; commit 97c80e1

---

### Listener-stacking guards need replace-semantics, not skip-semantics
`RecipeChip.bindActions` used a WeakSet to skip-rebind on the same container. But recipes.js reuses the SAME tab-content container across Originals / Favorites / Wishlist / Made / Drafts. The first tab to mount won — its closure-captured handlers kept firing for every subsequent tab. Wishlist remove fired "Removed from Favorites" + navigated to Favorites; Made remove fired "Removed from Wishlist" + navigated to Wishlist.

**Context:** The original library.js / classroom.js fix used WeakSet "bind once" semantics because those views genuinely had one container. Recipes is different — the tab content area persists. Required `506854d` to switch to a WeakMap<container, {handlers, options}> so each `bindActions` call swaps the active handlers without re-binding the listener.
**Source:** 07-UAT.md Test 12 cluster; commit 506854d

---

### "Generate with AI" can produce a near-duplicate without throwing
Test 13 (AI-03 fail-closed path on nonsense prompt) failed: instead of throwing, the model returned essentially the same recipe back with no tweaks. The user accumulated identical draft chips. The plan assumed "nonsense prompt → schema validation fails" but the model is actually quite robust — it just gives you something that passes validation but is useless. Required `587d502` to add `_isNearDuplicateOfPool` (compare normalized name + sorted ingredient-name key against existing pool; throw if match).

**Context:** Defensive-against-AI design has TWO surfaces: structural (schema validation, catches malformed output) AND semantic (duplicate detection, catches "valid but useless"). The original plan thought about structural; semantic surfaced in UAT.
**Source:** 07-UAT.md Test 13; commit 587d502

---

### Save fail attribution can be misleading across surfaces
User clicked Add-to-Favorites on Recommender; save started; user navigated to Recipes; THE TOAST appeared on the Recipes page. Looked like "Recipes broke save." Actually the in-flight save from Recommender's optimistic UI was completing AFTER navigation. The error attribution UI shows where the user IS, not where the save originated.

**Context:** Optimistic UI + fire-and-forget save patterns need either (a) toast that explicitly names the action ("Save failed: 'Add to Favorites — Army & Navy'") or (b) a save-status indicator persisted across navigation. Current behavior is good-enough but the UX can be confusing during debugging.
**Source:** 07-UAT.md Test 8 follow-up; commit 506854d

---

## Patterns

### Read-only compat shim via `Object.defineProperties` getters
During chip-unification's data-shape migration, `State.get('recipes')` returns a shim object that spreads the raw pool object AND defines synthetic getters for legacy keys (`.originals`, `.confirmed_favorites`, `.wishlist`, `.made_log`). Each getter filters `pool` by status / boolean flag at access time AND resolves seeded entries via `CLASSICS_DB` so downstream `Utils.sameRecipe` checks work.

**When to use:** Migrating a data shape when MANY readers exist but you can only afford to rewrite a few writers in the first commit. Reads keep working via the shim; writes get rewritten one caller at a time. Schedule shim removal after all readers are migrated.
**Source:** 07-01-SUMMARY.md; commit 946e3c9 + 2754c2b (shim with resolution)

---

### Per-key save coalescing: at most 1 active + 1 pending
`state.js` keeps two parallel maps `_activeSave` and `_pendingSave` per key. New `save(key)` calls either start (if no active) or REPLACE the pending slot (if active in-flight). When the active save finishes, the pending slot drains as a single save with the current `_data[key]` — capturing every State.patch that landed during the active save. Net effect: N rapid mutations → at most 2 GitHub writes.

**When to use:** Any high-frequency-mutation flow where each mutation triggers a save to a single backing file. Library CRUD, heart/star/check toggles, inventory rapid-add. Drop-in replacement for a chained-promise queue.
**Source:** 07-RESEARCH.md Pattern 3; state.js _doSave coalescing; commit 35e916b

---

### Optimistic UI: instant patch + toast + rerender; await save in background
`State.patch` is synchronous; render after patch is synchronous; toast fires immediately. `State.save` runs async with the user no longer waiting — error toast `.catch(err => Utils.showToast('Save failed: …', 'error', 5000))` surfaces if all retries are exhausted. User perceives the app as instant; reliability layer handles the network round-trip in the background.

**When to use:** Any user-facing toggle / add / remove where the in-memory state is the source of truth for rendering and the GitHub save is an eventual-consistency operation. Combines with save coalescing — the user can rapid-fire and the save layer collapses.
**Source:** Recommender ♥/☆/✓ toggles; commit 506854d

---

### Version-flagged one-time migration with auto-persist
Pool migration flags: `_schema_version: 2`, `_reclassified_v2_2: true`, `_autosaved_v2_2: true`. State.loadAll checks these flags and short-circuits the migration / autosave if all are set. When fixing migration logic itself, BUMP THE VERSION (e.g., `_v2_1` → `_v2_2`) so corrected logic re-runs on flagged-but-broken pools.

**When to use:** Data migrations that need to run once per file lifetime. The flag prevents repeat work; the version bump handles bug fixes to the migration code without requiring users to manually re-run anything.
**Source:** state.js loadAll migration block; commits 4044db5 (v2_2 bump) + d2adef0 (manual migration as escape hatch)

---

### Overlay-only references vs. copies for seeded data
Pool entries with `seed_id` set carry ONLY the user's overlay (flags, ratings, notes) — no core fields. Core is read live from `classics-db.js` at render time via `RecipeChip.resolveCore(recipe)`. Trade: efficiency (pool stays small) + automatic seed updates (core fixes propagate) for one layer of indirection at render.

**When to use:** Reference-style data where users add overlay information to canonical entities. Library books with user notes, classic recipes with favorite flags, etc. Avoid when the canonical entity changes frequently enough that the implicit "snapshot" expectation matters.
**Source:** chip-unification-plan.md C2 design decision; commit 946e3c9 (1/3)

---

### Per-tab handler swap via WeakMap<container, slot>
A delegated click listener is bound ONCE per container (no listener stacking). The handler dispatches via a WeakMap slot that holds the LATEST handlers + options. Each `bindActions` call overwrites the slot. Tab switches that reuse the same container correctly swap behavior without rebinding listeners.

**When to use:** Tabbed UIs where the same container hosts different filter views with different per-view handlers. Replaces both naive multi-bind (stacks listeners) and skip-bind (locks in first tab's handlers).
**Source:** commit 506854d; recipe-chip.js `_BOUND` WeakMap

---

### Fail-soft AI helpers that never block the synchronous main path
AI-11 paste-a-line, AI-13 derivation: returns `null` on no-key, returns `null` on any error, caches successful results in localStorage. The synchronous Phase 5 regex path runs FIRST; the AI helper is only consulted on low-confidence flag (Pitfall 6 cost avoidance) AND opt-in via the helper's signature. Any error path falls back to the regex result.

**When to use:** Adding AI augmentation to a flow that must remain robust without the AI. Lets the AI improve quality on hard cases while leaving the easy/no-key paths untouched.
**Source:** inventory.js aiParseBottle; recommender-engine.js deriveWithAI; 07-05-PLAN.md Task 4; 07-06-PLAN.md Task 2

---

### Cache AI calls by raw input string (Pitfall 6)
Both AI-11 (`bb_parse_cache`) and AI-13 (`bb_derivation_cache`) use `localStorage` JSON object keyed by the exact raw input string. Reading is O(1); writing is fire-and-forget catch-and-ignore. No cache invalidation logic — cached results are permanent.

**When to use:** AI calls where the input → output mapping is stable and the user retries the same input often. Reduces cost AND latency. Skip when output depends on dynamic context (avatar generation, time-of-day prompts, etc.).
**Source:** 07-RESEARCH.md Pitfall 6; AI-11 + AI-13 implementations

---

### Single-bundle Claude call vs. per-schema loop
AI-08 legacy-MD import originally planned to loop N times per import (one Claude call per schema target). Rewritten to ONE call returning `{inventory?: …, profile?: …, recipes?: …, barkeeper?: …}` and dispatch per-section through Normalize + WriteGate.validate + WriteGate.gate. Net: 1 Claude call instead of 4, single user-facing diff preview workflow.

**When to use:** When the AI needs to consider the full input context to decide which sub-extractions are present. Cheaper, gives the model the full picture, and the output structure naturally encodes "section present or absent."
**Source:** plan-check M-5; commit fde3a08 import bundle rewrite in 07-06-PLAN.md

---

### Three-path schema probe: relative-up, in-app, GitHub-API
`WriteGate._loadSchema` tries `../schema/<key>.schema.json` (local dev served from repo root) → `schema/<key>.schema.json` (if schemas were copied into app/) → `GitHubAPI.readJSON('schema/<key>.schema.json')` (production fallback via the same auth path data/* uses). First non-empty response wins; cached for subsequent calls.

**When to use:** Static assets that may live at repo root (not deployed) AND need to be reachable in both local dev and production. The GitHub-API fallback uses an auth token the user already has configured. Requires graceful degradation when all three fail (treat `['no schema']` as benign in non-write contexts).
**Source:** write-gate.js _loadSchema; commit 352f78c + bcb7d2c filename map + 6dd0a74 graceful degrade

---

### Near-duplicate detection by normalized name + sorted ingredient set
`_isNearDuplicateOfPool(candidate, pool, excludeId)`: lowercase + strip non-alphanumeric for name; sorted-and-joined ingredient names as a single key. Compare against every pool entry (with seeded entries first resolved through CLASSICS_DB). Match → throw with attribution (which list the duplicate lives in). Cheap, deterministic, language-agnostic.

**When to use:** Preventing AI from generating "essentially the same thing" as something the user already has. The candidate has structurally valid fields but semantically duplicates existing content.
**Source:** 07-UAT.md Test 13; commit 587d502

---

## Surprises

### UAT exercised muscles the deterministic test suite couldn't
The Phase 7 plan was 6 commits over 5 waves with 30 phase-07 deterministic tests. UAT generated ~30 in-flight fixes — almost 1:1 with the original test suite. The deterministic tests stubbed `WriteGate.validate`, `CLASSICS_DB`, `localStorage`, `fetch` — and the bugs that surfaced in UAT were precisely the integration points those stubs hid. Lesson for future phases: budget UAT time as a real fraction of execution time, not as a sign-off step.

**Impact:** Doubled the total elapsed phase time (Mar-21 plan → Jun-12 UAT close-out). Without UAT, many user-facing bugs would have shipped. The deterministic test suite remained 100% green throughout — it validated what it covered correctly but didn't cover everything.
**Source:** 07-UAT.md (30+ fix commits attributed to UAT); 07-VALIDATION.md (didn't test integration points)

---

### Chip-unification mini-phase emerged mid-UAT
Test 12 (AI-03 unified chip flow) surfaced architectural friction (two Generate-with-AI entry points, missing draft Edit affordance, save-storm bugs under rapid CRUD, Originals chips visually inconsistent with other chip surfaces) that traced to per-array recipe storage. The user agreed to a 3-commit mini-phase outside the GSD workflow to collapse the data model into a single canonical pool. The mini-phase + 7 follow-up fixes spanned ~6 days. Tests 12-15 were rewritten after the mini-phase shipped.

**Impact:** Significantly expanded the phase scope. Worth it — without the unification, the legacy 5-storage-location model would have continued accumulating bug surface. But the original phase plan had no way to predict this discovery.
**Source:** chip-unification-plan.md; 07-UAT.md Test 12 cluster; commits 946e3c9 / 9527dce / cc5df53 + 7 follow-ups

---

### Auto-save-on-loadAll silently failed for the user's GitHub Pages setup
The chip-unification migration was designed to auto-persist via `state.js loadAll` firing a fire-and-forget `save('recipes')` when migration ran. For the user's specific repo (GitHub Pages publishing `app/` while data lives at root, GitHubAPI fallback issues), the save kept failing — autosave attempts piled up in the GitHub log as repeated `chip-unify: persist v2 pool migration + reclassify` commits without ever actually succeeding. Required commit `d2adef0` to do a manual one-shot migration and commit `data/recipes.json` directly.

**Impact:** Showed the limits of automatic data migrations in user-controlled environments. The escape hatch (manual migration directly in the developer's repo, then commit + push) was essential. For future phases: budget time for manual migrations of user-specific data when migration auto-persist could fail.
**Source:** 07-UAT.md chip-unification fix-up cluster; user's GitHub commit history showed 6+ repeated autosave attempts before manual intervention; commit d2adef0

---

### Two Generate-with-AI entry points coexisting (BL-4)
Phase 3 (pre-Phase-7) shipped a "Generate with AI" button on the New Recipe form that filled the form inline for the user to save to Originals. Phase 7's AI-03 added a SECOND "Generate with AI" entry point on the Drafts tab with the draft auto-save + refine card flow. Both surfaces still exist; the user didn't realize they were different until Test 12. The Drafts-tab path is the "right" one going forward but the New Recipe path wasn't deprecated.

**Impact:** UX confusion. Captured as BL-4 — unify the two entry points or redirect the legacy form to the modern flow. Lesson: when a new phase introduces a more sophisticated version of an existing feature, plan an explicit deprecation / redirect step for the old entry point.
**Source:** 07-UAT.md Test 12 BL-4; recipes.js renderForm has dual paths

---

### AI-13 derivation never fired during user UAT (Test 15)
User's inventory + the static Phase 5 `DERIVATIONS` map covered every case the user tried. The AI-13 fallback exists, is unit-tested deterministically, and is gated behind low-confidence checks — but the user never exercised it in UAT. Marked "pass-cheap-path" (correct cheap path — no spurious API calls).

**Impact:** Validates the design principle (only call Claude when the static path can't reason it out) but means the actual user-facing AI behavior is largely hypothetical until a harder edge case appears. Lesson: don't over-test AI fallback paths in UAT — the deterministic test suite is sufficient when the fallback's gate logic is sound.
**Source:** 07-UAT.md Test 15

---

### Schema validation became the AI safety net the planners didn't quite plan for
The plan emphasized WriteGate.validate as defense against malformed AI output. It surfaced as the central safety net not because the AI produced malformed JSON often, but because schema-validation failures gave the user a structured place to invoke AI-10 repair. Several Test 12 / 16 / 17 paths discovered that the validate → repair → diff → confirm loop is the right framing for AI write paths in general, not just legacy-MD imports.

**Impact:** AI-10 turned out to be more important than its plan signaled. Generalized: schema validation provides a natural error-correcting handle for ANY AI write flow, not just data import. Future AI-write features should ship with a "repair" affordance by default.
**Source:** 07-AI-SPEC.md § 6; 07-06-PLAN.md Task 1; 07-UAT.md Tests 16 + 17 cross-cutting

---

### The Phase 5 paste-a-line UI puts the category picker BEFORE AI parsing (BL-6)
Inventory Quick Add: `parseBottleSection(name)` (keyword-based section detector) runs first; if it can't infer a section from the name, a category picker pops up for the user to manually select; only THEN does `commitQuickAdd` run `parseBottleEntry` + the AI-11 Claude fallback. For ambiguous inputs the user has to manually pick the section before Claude gets to help — defeating the purpose. Captured as BL-6.

**Impact:** UX issue that didn't surface during planning. The AI was supposed to help with ambiguous parsing, but the picker comes first, so the user has to do the disambiguation Claude could have done. Future Inventory work should call Claude FIRST on `parseBottleSection` failure with a system prompt enumerating valid section keys.
**Source:** 07-UAT.md Test 18 BL-6

---

### Static `CLASSICS_DB` size growth from 4 files
The classics-db split into 4 files (`classics-db.js + extra-1.js + extra-2.js + extra-3.js`) totaling 169 recipes via `CLASSICS_DB.push(...[...])`. During UAT a new recipe (East India 75) was added by creating `extra-3.js` — the pattern lets the database grow without merge conflicts on a single file. Each `extra-N.js` is loaded sequentially via separate script tags.

**Impact:** Solved a tech-debt concern about classics-db growth without a heavyweight build step. Pattern is reusable for any append-only static dataset in a no-build SPA. Captured as BL-1's classroom equivalent (move lessons into a structured `data/classroom.json` so users can contribute lessons via the same pattern).
**Source:** classics-db-extra-3.js (commit d42b1c1); 07-UAT.md BL-1

---

### One bug fix cascade: the schema-name mismatch was hiding behind the schema-fetch 404
Test 16 AI-08 import failed with "no schema" for the profile section. Root cause looked like the schema fetch 404. Real root cause: the `_loadSchema` filename derivation used the State key (`profile`) but the schema file is `bar-owner-profile.schema.json`. The 404 was a SECONDARY symptom — even if the file had been at `schema/profile.schema.json`, the AI-08 import would still have hit the GitHub Pages app-only deploy issue. Both fixes (`bcb7d2c` filename map + `6dd0a74` graceful degrade) were needed.

**Impact:** Cumulative-bug pattern. When a fix surfaces ONE error, look for the SECOND error that the first was masking. Lesson: budget at least one follow-up cycle after every fix to surface latent dependencies.
**Source:** 07-UAT.md Test 16 + Test 18; commits bcb7d2c + 6dd0a74

---
