---
status: testing
phase: 07-ai-integration
source:
  - 07-01-SUMMARY.md
  - 07-02-SUMMARY.md
  - 07-03-SUMMARY.md
  - 07-04-SUMMARY.md
  - 07-05-SUMMARY.md
  - 07-06-SUMMARY.md
started: 2026-05-26T22:30:00.000Z
updated: 2026-05-26T22:30:00.000Z
---

## Current Test

number: 18
name: AI-11 — paste-a-line Claude fallback (cached, key-gated, fail-soft)
expected: |
  In Inventory's paste-a-line entry, enter an ambiguous bottle line the regex parser cannot classify cleanly — try the canned `tests/fixtures/paste-line-ambiguous.txt` content, or something like "Mariposa Plata 38% 750ml" (made-up brand, real-looking spec). Expected: Claude parses it into a reviewable chip (style/type filled in). Re-enter the EXACT same line → NO second `/v1/messages` request fires (cache hit on `bb_parse_cache`). Then clear your Anthropic key in Settings and re-enter the same line — the regex falls back to its REVIEW-bucket behavior (Phase-5 byte-identical, zero network calls).
awaiting: user response

chip_unification_summary:
  - Commit 946e3c9 (1/3): v2 pool schema + Normalize.recipe / migrateRecipesV1 / foldDraftsIntoPool + State.get read shim.
  - Commit 9527dce (2/3): RecipeChip.render / resolveCore / filterPool + drop-in across recipes.js + CSS + index.html script tag.
  - Commit cc5df53 (3/3): RecipeChip.bindActions + per-chip Tweak panel + click-to-render via body handler + seeded-core lock in renderForm + pool-aware writes in recipes.js.
  - Post-ship fixes (3129e81 / 5646147 / 4044db5 / d2adef0 / 2754c2b / 506854d): reclassify v1->v2 follow-up, tolerant lookup (& / and / -), autosave persistence, version flag bump, manual pool migration on data/recipes.json, CLASSICS_DB lexical lookup (bare const + globalThis fallback), shim resolves seeded entries, recommender ♥/☆/✓ writes the pool (was silently no-op via getter assignments), WeakMap-based per-tab handler swap (was firing wrong tab's toast + navigating wrong), optimistic UI (instant toast + rerender, save in background), 3-retry save backoff (300/600/1000ms).
  - User UAT confirmed working 2026-05-27: chips uniform across all tabs, classics render with seed-resolved metadata, Recommender toggles update instantly, per-tab remove fires the right toast and stays on the right tab, save reliability holds under rapid actions.

verified_tests_during_chip_unification:
  - "12: AI-03 unified chip flow + click-to-render + tweak + promote + heart/star/check toggles — PASS."

## Tests

### Deterministic (auto-verified in container — no live key required)

#### D-1. Full deterministic test suite
expected: 49/49 tests pass across phase-05 + phase-06 + phase-07 files
result: pass
evidence: |
  `for f in tests/*.test.js; do node "$f"; done`
  → phase-05-engine: 1/1, phase-05-normalize: 9/9, phase-06-engine: 9/9, phase-07-ai: 30/30. Total 49/49.

#### D-2. Phase 7 source files syntax-clean
expected: `node --check` passes on all 16 phase-7-touched JS files
result: pass
evidence: |
  Verified on: claude-api.js, write-gate.js, state.js, normalize.js, app.js, recommender-engine.js,
  views/{settings,chat,classroom,library,inventory,dashboard,bartender-wizard,recommender,recipes}.js,
  data/classroom-content.js.

#### D-3. ClaudeAPI primitives exported
expected: streamMessage / requestJSON / callMessages / buildContext / deriveContextMarkdown all present
result: pass
evidence: |
  Plan 07-01 acceptance gates passed at commit time; full test suite re-verifies the exports
  via vm.runInThisContext loading claude-api.js into the test harness.

#### D-4. Default model is claude-sonnet-4-6 (no stale 4-5 ID)
expected: `grep -c "claude-sonnet-4-5-20250929" app/js/claude-api.js` returns 0; `grep -c "claude-sonnet-4-6"` returns ≥1
result: pass
evidence: 0 stale matches; default-model fix verified in plan 07-01 Task 1.

#### D-5. drafts is the 5th State data file
expected: state.js FILES has `drafts: 'data/drafts.json'`; schema/drafts.schema.json parses; data/drafts.json parses with `drafts` array; Normalize.byKey handles 'drafts'
result: pass
evidence: plan 07-01 Task 2 acceptance gates + deterministic test rows.

#### D-6. library is the 6th State data file
expected: state.js FILES has `library: 'data/library.json'`; schema/library.schema.json parses; data/library.json parses with `links` array; Normalize.byKey handles 'library'; tolerant-404 covers BOTH drafts AND library
result: pass
evidence: plan 07-04 Task 2 acceptance gates; M-4 plan-check fix verified.

#### D-7. WriteGate exposes validate / gate / inventoryFidelity
expected: write-gate.js IIFE exports the three functions; script loaded AFTER claude-api.js and BEFORE app.js in index.html
result: pass
evidence: plan 07-01 Task 3 acceptance gates + index.html load order.

#### D-8. bb_api_log entries never contain key/prompt/system/raw
expected: appendLog hardened; test rows assert no such fields in stored entries
result: pass
evidence: plan 07-01 Task 1 acceptance + plan 07-02 Task 2 grep gate (no `.key/.prompt/.system` reads in settings.js log renderer).

#### D-9. Drawer-only AI surface (no streamMessage outside chat.js)
expected: `grep -c "streamMessage"` is 0 in classroom.js / library.js / recommender.js / inventory.js / dashboard.js / recommender-engine.js
result: pass
evidence: plan 07-04 + 07-05 acceptance gates; D-01 invariant honored.

#### D-10. AI-13 RecommenderEngine.deriveWithAI is exported
expected: `grep -c "deriveWithAI" app/js/recommender-engine.js` returns ≥2 (definition + return-export); bb_derivation_cache referenced; ClaudeAPI present; streamMessage absent
result: pass
evidence: plan 07-05 Task 4 acceptance gates + 4 new AI-13 test rows in phase-07-ai.test.js.

#### D-11. AI-11 bb_parse_cache + key-gate + fail-soft in inventory.js
expected: `bb_parse_cache` present; `ClaudeAPI.getKey()` check; try/catch with fallback to null
result: pass
evidence: commit f1ed4be diff inspection; AI-11 contract test rows in phase-07-ai.test.js.

#### D-12. AI-08 importLegacy + AI-10 repairSection wired in settings.js
expected: both function names present; both flow through WriteGate.gate
result: pass
evidence: plan 07-06 Task 1 acceptance gates + AI-08/AI-10 test rows.

#### D-13. Wave-0 fixtures committed
expected: tests/fixtures/legacy-import.md, broken-inventory.json, paste-line-ambiguous.txt all present
result: pass
evidence: commit b9d0aef adds all three.

#### D-14. Dashboard `#chat` / `#classroom` / `#library` un-disabled
expected: `grep -c 'href="#chat"' app/js/views/dashboard.js` ≥1 and same for #classroom + #library
result: pass
evidence: plan 07-05 Task 1 acceptance gates.

#### D-15. data/conversations/ documented as write-only
expected: 07-03 plan + SUMMARY explicitly note transcripts are not registered in State.FILES, not reloaded, not in exportAIContext
result: pass
evidence: M-3 plan-check fix verified in 07-03-PLAN.md.

---

### Live-key UAT (requires BYOK Anthropic key + browser — user-driven)

#### 1. Settings — Reveal toggle + model selector + call-log panel + Reset sweep
expected: |
  Settings → AI section. (a) The key field's Reveal toggle flips between dotted/visible. (b) The model `<select>` shows Haiku / Sonnet (recommended) / Opus; changing it persists across reload via `bb_chat_model`. (c) AI-09 log panel renders entries from `bb_api_log` showing only `ts/type/model/usage` — never the key/prompt/system. After making at least one API call (e.g. ask Bjorn anything in #chat), the entry appears in the log. (d) "Reset all data" wipes the data files AND clears `bb_chat_model` + `bb_api_log` from localStorage.
result: issue
severity: minor
reported: "Reset all data clears bb_api_log but bb_chat_model stays set; I think bb_chat_model should be preserved (UI preference, not data)."
findings: |
  Three real gaps in the Reset sweep:
  1. bb_chat_model is currently CLEARED on Reset (settings.js:699) — should be PRESERVED (it's a UI preference like dark mode; reset shouldn't touch it). Persist user's chosen model across both "Reset all data" and the AI-09 "Clear log" button.
  2. bb_chat_history (the actual chat thread — real user data) is NOT cleared on Reset — should clear (alongside the other user data files).
  3. drafts (5th State file) and library (6th State file) are NOT reset to defaults on Reset — should reset (they hold user data: AI-generated drafts + saved external links).
  Audit/debug data (bb_api_log) clearing is correct. API key + GitHub credentials preservation is correct.
disposition: deferred to single fix-up plan at end of UAT


#### 2. Chat — no-key gate
expected: |
  WITHOUT an Anthropic key set, open `#chat`. A no-key message appears with a link to Settings. No network call is made (DevTools Network tab confirms zero `api.anthropic.com` requests). Trigger the quick-ask drawer (e.g. from Recommender → Ask Bjorn): same gate, no call.
result: pass

#### 3. Chat — streaming + bar context fidelity
expected: |
  With your key set, open `#chat` → ask "What should I make tonight?". The answer STREAMS token-by-token (not a single blob at the end). The reply references YOUR real inventory and your taste/mood (e.g. mentions a bottle you actually own, hits your sweetness/strength preference).
result: pass

#### 4. Chat — persistence + summarization
expected: |
  Reload the browser → `#chat` resumes the prior conversation from `bb_chat_history`. Send several more messages until the thread exceeds the summarization threshold (~12 turns). Older turns continue to render, and the AI-09 log now shows a `claude-haiku-4-5` summarization call.
result: pass

#### 5. Chat — abort-on-navigation + save + clear
expected: |
  Start a long response, then navigate away from `#chat` mid-stream → the stream aborts (CHAT-06); returning to `#chat` shows the persisted transcript intact. Click "Save conversation to GitHub" → toast confirms, and a new `data/conversations/chat-*.json` commit appears in the repo. Click "Clear conversation" → transcript empties and `bb_chat_history` is gone from localStorage.
result: pass

#### 6. Classroom — renders without a key (AI-06)
expected: |
  WITHOUT a key, open `#classroom`. All four topics render — Techniques, Glassware, Ratios, Ingredients — with lesson tiles. Click "Ask Bjorn about this" on any lesson → no-key affordance toast/link, no network call.
result: pass

#### 7. Classroom — lesson-scoped Q&A (AI-07)
expected: |
  With your key set, on the "why do we stir a Manhattan?" lesson (or similar Technique lesson), click "Ask Bjorn about this". The drawer opens seeded with the lesson context; the streamed answer stays SCOPED to that lesson (it talks about stirring/spirit-forward, not about something unrelated).
result: pass

#### 8. Library — CRUD + sanitized hrefs + Ask-Bjorn
expected: |
  Open `#library` → add a link (url + title + description + tags) → reload the page → the link persists from `data/library.json` and the title renders as a clickable http(s) link. Try adding a link with url `javascript:alert(1)` → it renders as plain escaped text, NOT as a clickable/executable href. Edit and remove a link → both persist across reload. With your key set, click a link's "Ask Bjorn about this" → seeded drawer opens.
result: pass
caveat: "Initial save-failure / data-corruption issues under rapid CRUD; four targeted fixes landed during this test (per-key save mutex 6f385cd, delegated-listener stacking 14f79f4, render-on-patch TOCTOU 84d2311, coalesce concurrent saves 35e916b). User confirmed 'good enough' to move on; URL-sanitization + Ask-Bjorn drawer + persistence across reload all verified."
follow_up: "Watch for any remaining save-reliability complaints across future UAT tests / sessions — if recurring, escalate to a focused storage-layer fix-up plan (move to localStorage primary + debounced GitHub sync)."

#### 9. Ask-Bjorn entry points on cards + chips (REC-04 / AI-04)
expected: |
  In Recommender, click "Ask Bjorn about this" on a recipe card → drawer opens seeded with that recipe and references your taste/mood. In Recipes, click "Ask Bjorn about this" on a recipe chip → same behavior.
result: pass
caveat: "Recommender cards (part a) work completely. Recipes chips (part b) work on most tabs, but Originals chips remain styled/structured differently from other chip surfaces. AI-04 entry point is functional — flagged for the existing BL-2 unified-chip schema work, not a Phase-7 fix."
backlog_ref: BL-2

#### 10. Best-bottle advice (AI-05)
expected: |
  In Inventory, click "Best bottle to add (AI)" → drawer answers with a single-bottle recommendation grounded in your inventory and vetoes. Same from Dashboard. Confirm the Dashboard cards "Chat with Bjorn" / "Classroom" / "Library" are now real links (no longer disabled).
result: pass

#### 11. Bartender Wizard — Help-me-write (AI-12)
expected: |
  Open the Bartender Wizard, enter a short preference (e.g. "playful surfer"), click "Help me write this with Claude". The personality textarea fills with drafted long-form persona text; you can edit it before the existing save.
result: pass

#### 13. AI-03 — fail-closed path on invalid / near-duplicate generation
expected: |
  Nonsense prompt → no draft written; near-duplicate of an existing recipe → no draft written.
result: pass-with-fix
reported: "Nonsense prompt didn't throw — model returned the source recipe back essentially unchanged, producing two identical draft chips."
fix: |
  Commit landing now adds `_isNearDuplicateOfPool` in recipes.js: candidate drafts are compared to every pool entry (seeded classics resolved through CLASSICS_DB) by normalized name + sorted ingredient-name key. If a match is found the runAIDesign + handleDraftTweak save paths throw before the pool.push / State.patch, so the duplicate never reaches the pool. Error toast tells the user where the duplicate lives ("a classic", "an existing draft", "one of your originals") and to try a more specific tweak.

#### 14. Drafts → Promote to Original
expected: |
  Promote via chip button or "Save and Promote to Original" from the edit form → WriteGate diff/confirm → pool entry mutates in place (status flips 'draft' → 'original', draft fields cleared). Drafts tab loses entry; Originals tab gains it.
result: pass
fix: |
  Schema commit 372ad05 dropped 'name' from the recipe required list — seeded classics are overlay-only by design and were tripping validation on every WriteGate-gated write. Promote was the first path to actually exercise WriteGate.gate so it surfaced there.

#### 15. AI-13 — ingredient derivation fallback in Recommender
expected: |
  Inventory state where Phase-5 static DERIVATIONS misses but Claude can reason it out → recipe becomes buildable; cache hit on second probe; no-key reverts to Phase-5 only.
result: pass-cheap-path
reported: "A Paloma was automatically shown as buildable — no AI call needed from the Recommender page."
note: |
  User's inventory + the static DERIVATIONS map covered grapefruit→grapefruit juice without engaging AI-13. The AI-13 fallback exists and is unit-tested deterministically in phase-07-ai.test.js; it just stayed dormant for this inventory state (correct cheap path — no spurious API calls). Test counted as pass on behavior grounds (the recipe surfaced as buildable as expected); the AI-13 path wasn't user-exercised but is functionally verified.

#### 16. AI-08 — legacy markdown import
expected: |
  Paste legacy markdown notes → "Import with Claude" → diff preview → confirm → data lands; gibberish → fail-closed.
result: pass
fix: |
  Commit bcb7d2c added a _SCHEMA_FILENAME map inside write-gate.js so the
  'profile' schemaKey resolves to schema/bar-owner-profile.schema.json instead
  of the non-existent schema/profile.schema.json. Before that, AI-08 import
  + AI-10 repair both failed for the profile section with "Structured output
  failed validation: no schema" because _loadSchema returned null on all
  three probe paths.

#### 17. AI-10 — JSON repair
expected: |
  Trigger a validation failure → "Ask Claude to repair this" → repaired JSON shown as diff → only written after confirm. Still-invalid repair fails closed.
result: pass-by-attribution
note: |
  Implicitly exercised during Test 16's profile-section flow. After the
  bcb7d2c schema-filename fix, the "Ask Claude to Repair This" button
  worked as designed — user confirmed Test 16 passes, which includes the
  repair path.

#### 12. AI-03 — Generate → draft → refine → promote
expected: |
  Recipes → "Generate with AI". Enter "design me a spirit-forward whiskey drink". A draft is generated, is schema-valid, AUTO-SAVED to the Drafts tab (D-09). If it used a bottle you don't own, a phantom-ingredient flag is surfaced in the draft preview. The refine card supports both "make it less sweet" (tweak SAME draft) and "generate new" (new draft, fork-before-refine on a 2nd refine).
result: pending

#### 13. AI-03 — fail-closed path
expected: |
  Force an invalid generation (e.g. nonsense prompt that the model can't return schema-valid JSON for). After requestJSON's ONE retry it throws → an error toast surfaces and NOTHING is written to drafts.
result: pending

#### 14. Drafts tab — Promote to Original
expected: |
  Drafts tab → "Promote to Original" on a draft. A WriteGate diff/confirm dialog appears. On confirm, the recipe moves to Originals with a `cocktail<ts>` id, disappears from Drafts, and the saves go through sequentially (recipes then drafts) — no 409 conflict.
result: pending

#### 15. AI-13 — ingredient derivation fallback in Recommender
expected: |
  In Inventory, have "lemons" but NOT "lemon juice". A recipe that requires lemon juice should now be marked buildable thanks to the AI-13 fallback (with key + first call). Re-rank or refresh → no second API call to derive the same pair (cache hit in `bb_derivation_cache`). Remove the key → the engine reverts to Phase-5 static DERIVATIONS only (still finds "lemons → lemon juice" via the hardcoded map, but no new derivations beyond it).
result: pending

#### 16. AI-08 — legacy markdown import
expected: |
  Settings → AI Import. Paste a few lines of legacy markdown notes (e.g. a list of bottles + a taste note + a recipe). Click "Import with Claude" → a DIFF preview appears, nothing is written until you confirm. Confirm → the parsed data lands in inventory/profile/recipes. Now paste gibberish that has no parseable sections → fails closed with an error, no write.
result: pending

#### 17. AI-10 — JSON repair
expected: |
  Trigger a validation failure (e.g. import a broken section, OR craft a `data/inventory.json` with a deliberately malformed entry). Click "Ask Claude to repair this" → repaired JSON is shown as a diff, only written after confirm. If the repair output is itself still invalid after one retry, fails closed (no write).
result: pending

#### 18. AI-11 — paste-a-line Claude fallback (cached)
expected: |
  Inventory paste-a-line, enter an ambiguous bottle line the regex parser cannot classify (e.g. the line from `tests/fixtures/paste-line-ambiguous.txt`) → Claude parses it into a reviewable chip. Re-enter the EXACT same line → no second API call (cache hit on `bb_parse_cache`). With the key removed, the same line falls back to the plain regex/REVIEW behavior (Phase-5 byte-identical).
result: pending

## Summary

15 deterministic auto-checks: all PASS in container.
18 live-key UAT items: PENDING (require BYOK Anthropic key + browser).

## Gaps

None identified yet. Run live-key UAT to surface any.

---

## Deferred / Backlog (future phases)

### BL-1 — Classroom V2: structured lessons + adaptive progression
*Surfaced during Test 6, 2026-05-26.*

**Current state (Phase 7):** Classroom ships with ~4 static topics (Techniques / Glassware / Ratios / Ingredients) hard-coded in `app/js/data/classroom-content.js`. Each lesson is a `{title, body}` pair rendered as a tile. Renders fully without a key; with a key, "Ask Bjorn about this" seeds the drawer with the lesson context.

**Requested enhancements (deferred):**

1. **Formalize lessons as structured cards/chips with a JSON schema** — same treatment as recipes and ingredients (`schema/classroom.schema.json`). Fields per lesson: `id`, `topic`, `level` (`101 | 201 | advanced`), `title`, `body`, `prereqs` (lesson IDs), `tags`, `_source` (`built-in | user | ai-generated`). Move the static content into a versioned data file users can extend/curate, matching the GitHub-JSON storage ethos. Pre-load a foundational set (the "100 recipes equivalent" for education — comprehensive 101-level coverage of bartending fundamentals) so the basics never require an API key.

2. **Adaptive progression** — track which lessons the user has completed (`bb_classroom_progress` or a State file). When all 101-level lessons in a topic are marked complete, automatically surface 201-level lessons; same step up to advanced. The static foundation handles 101; AI fills the gap for personalized 201+ when a key is present (RAG-style — Claude proposes a next-lesson card grounded in what the user already learned).

3. **Lesson card actions** — alongside "Ask Bjorn about this," add "Mark complete," "Save to Library link" (cross-link into the Library view), and an "Add to my classroom" button on AI-suggested lessons.

**Scope:** new phase (likely Phase 11+ after the current ROADMAP). Bundles cleanly with a possible "personalized learning loop" theme alongside future AI-driven recommendations.

**Related to:** D-13 (Classroom + Library), AI-06/AI-07 (current Phase 7 reqs), AI-13 derivation pattern (the caching + key-gate + fail-soft pattern would apply to the 201+ AI-suggested lessons).

### BL-2 — Unified recipe-chip schema + shared render (Originals visual parity)
*Surfaced during Test 9, 2026-05-26 (re-surfacing a Phase 6 deferred item).*

**Current state:** Originals chips render via a different code path than Favorites / Wishlist / Made / Classics chips. User-visible result: Originals look and feel different from other chip surfaces (different layout, possibly different actions exposed). Already captured in the Phase 6 close-out note in STATE.md as part of the enhancement backlog.

**Requested fix (deferred):** Normalize all recipe storage so each recipe is stored once and referenced by id across confirmed_favorites / wishlist / made_log / originals / drafts. Build one `renderRecipeChip(recipe, options)` function used everywhere so chips look identical (♥/☆/✓ badges, cross-list move actions, AI-04 Ask-Bjorn button — currently all consistent on non-Originals but missing or different on Originals). Also fixes Phase 6 Test 12 (rename doesn't sync across all lists holding a recipe — a symptom of duplicated storage).

**Scope:** small/medium phase. Could be a focused mini-phase or rolled into a future "Recipes UX consistency" pass.

**Related to:** Phase 6 deferred enhancements (already captured), REC-04 / AI-04 (Phase 7), drafts → Originals promote flow (AI-03 / D-11).

### BL-3 — "Non-Alcoholic Only Tonight" mode (Recommender + AI-03 generate)
*Surfaced during Test 11, 2026-05-26.*

**Requested feature (deferred):** A first-class "NA-only" mode the user can toggle on both:

1. **`#recommender` page** — a button/toggle near the existing scope/mood/occasion filters. When active, the recommender either:
   - Filters to recipes flagged as NA (the simple path), OR
   - Surfaces NA-friendly substitutions for marginal recipes (e.g. "this Old Fashioned works with bitters + soda + a touch of demerara — alcohol-free analog"). The substitution path is the more interesting one; Claude can generate per-recipe NA reframings when a key is present.

2. **Recipes tab → "Generate with AI"** — a "NA only" toggle alongside the prompt input. When active, the AI-03 prompt is augmented to request a non-alcoholic build (or a near-zero-ABV one: bitters + soda + acidic + bittersweet aromatic — the "phantom cocktail" pattern).

**Schema change required:** add an `na` (boolean) field to the recipe JSON schema (`schema/recipes.schema.json` + classics-db entries + drafts). Possibly also `near_na` (boolean) for very-low-ABV builds (Angostura + soda, vermouth-only spritzes, etc.). Normalize handles legacy entries with `na: undefined` as `false`.

**UI:** chips/cards rendered with `na: true` get a visible badge (e.g. "🚫 NA" or "AF") in the chip — uses the same render path as the existing buildable / favorite badges. Filter-to-NA driven by the toggle.

**Scope:** modest. Schema bump + recommender filter + chip-badge render + AI-03 prompt augmentation + a one-pass tagging sweep over the 169 classics. Could be its own small phase or rolled into a "Recommender filters V2" phase alongside other deferred recommender items.

**Related to:** REC-01..REC-09 (existing recommender filters), AI-03 (drafts), BL-2 (unified chip render — adding the NA badge would benefit from consistent chip rendering across surfaces).

### BL-4 — Unify the two "Generate with AI" entry points + clarify labels
*Surfaced during Test 12, 2026-05-26.*

**Current state:** Two entry points to AI recipe generation coexist:

1. **Drafts tab → "Generate with AI"** (new, Phase 7 / 07-05 Task 2): `ClaudeAPI.requestJSON({schemaKey:'drafts'})` → WriteGate-validated draft → auto-saved to Drafts tab → refine card stays open for tweak ("make it less sweet") and "generate new" (D-09 / D-10).
2. **"+ New Recipe" form → "Generate with AI"** (pre-Phase-7, from Phase 3 / 03-03): `ClaudeAPI.generateRecipe(prompt, ctx)` → fills the form inline → user clicks "Create Recipe" to save directly to Originals. No draft persistence, no refine card.

User confusion (Test 12 feedback): "Create Recipe" label is unclear (does it save as draft?); the New-Recipe path produces a working recipe but lacks the refine feature the user wants; the Drafts-tab path was failing (now fixed in commits 97b6c6c + 352f78c) and is where the wanted features actually live.

**Requested fix (deferred):**

1. **Label clarity:** rename "Create Recipe" (after Generate-with-AI fills the form) to something more descriptive — e.g. "Save to Originals" or "Save as Final" — so the contrast with the Drafts path is obvious.

2. **Add refine box to the New-Recipe entry point** *OR* redirect the New-Recipe "Generate with AI" button to the Drafts-tab flow (where refine already exists). The redirect is the simpler unification: one generation pipeline, two entry surfaces that converge on it.

3. **Cross-link from Drafts:** add a "Promote to Originals" (already exists per D-11) and ensure the "Create Recipe from this draft" verb is consistent with the legacy form's verbiage.

**Scope:** small. Could be done as a focused PR — recipes.js UX consolidation + label rename + one redirect. The hard work (AI-03 + WriteGate + drafts auto-save + refine card) is already shipped.

**Related to:** AI-03 (drafts), D-09 / D-10 / D-11 (auto-save, refine, promote), AI-12 wizard "Help me write" pattern (also a "fill the form, then save" surface — same label-ambiguity question may apply there).

### BL-5 — "Use the real recipe" option when AI-tweak matches an existing classic
*Surfaced during Test 13, 2026-05-27.*

**Background:** Test 13's fix-up landed `_isNearDuplicateOfPool` which blocks duplicate-draft writes via an error toast. Better UX: instead of just failing, offer the user a one-click action.

**Requested feature (deferred to a future GSD phase):** When the AI-generated draft matches a real recipe — either an existing classic in `classics-db*.js` or one of the user's own originals — instead of an error, show a small interstitial dialog with two options:

1. **"Use this real recipe"** — favorite / wishlist / mark-as-made the existing entry directly (the AI essentially confirmed the user already has what they want), and DO NOT create a draft. For classics not yet in the pool, this creates the overlay-only seeded entry with the chosen flag set.
2. **"Save as draft anyway"** — proceed with the duplicate write (current bypass; lets the user keep both for comparison).

**Extension:** if the AI-generated draft is close to a real recipe NOT yet in `classics-db*.js`, the dialog can also offer:

3. **"Add to classics database"** — write the recipe shape into a user-side `data/extra-classics.json` (new tolerant file like drafts) or surface a PR-builder that opens GitHub with a pre-filled classics entry against `classics-db-extra-N.js`. This grows the seeded library through real-world usage.

**Scope:** modest. New helper that scores match strength (already partially there in `_isNearDuplicateOfPool`); new interstitial dialog component; possible new tolerant data file. Could fit as one task in a future phase focused on AI UX polish or recipe library growth.

**Related to:** AI-03 (drafts), BL-1 (Classroom V2 — lessons backed by structured data, same pattern), BL-3 (NA-only mode — similar "AI suggests a real recipe instead" surface), the `_isNearDuplicateOfPool` helper landed in this phase.
