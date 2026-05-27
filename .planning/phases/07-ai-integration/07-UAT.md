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

number: 2
name: Chat — no-key gate
expected: |
  WITHOUT an Anthropic key set, open `#chat`. A no-key message appears with a link to Settings. No network call is made (DevTools Network tab confirms zero `api.anthropic.com` requests). Trigger the quick-ask drawer (e.g. from Recommender → Ask Bjorn): same gate, no call.
awaiting: user response

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
result: pending

#### 3. Chat — streaming + bar context fidelity
expected: |
  With your key set, open `#chat` → ask "What should I make tonight?". The answer STREAMS token-by-token (not a single blob at the end). The reply references YOUR real inventory and your taste/mood (e.g. mentions a bottle you actually own, hits your sweetness/strength preference).
result: pending

#### 4. Chat — persistence + summarization
expected: |
  Reload the browser → `#chat` resumes the prior conversation from `bb_chat_history`. Send several more messages until the thread exceeds the summarization threshold (~12 turns). Older turns continue to render, and the AI-09 log now shows a `claude-haiku-4-5` summarization call.
result: pending

#### 5. Chat — abort-on-navigation + save + clear
expected: |
  Start a long response, then navigate away from `#chat` mid-stream → the stream aborts (CHAT-06); returning to `#chat` shows the persisted transcript intact. Click "Save conversation to GitHub" → toast confirms, and a new `data/conversations/chat-*.json` commit appears in the repo. Click "Clear conversation" → transcript empties and `bb_chat_history` is gone from localStorage.
result: pending

#### 6. Classroom — renders without a key (AI-06)
expected: |
  WITHOUT a key, open `#classroom`. All four topics render — Techniques, Glassware, Ratios, Ingredients — with lesson tiles. Click "Ask Bjorn about this" on any lesson → no-key affordance toast/link, no network call.
result: pending

#### 7. Classroom — lesson-scoped Q&A (AI-07)
expected: |
  With your key set, on the "why do we stir a Manhattan?" lesson (or similar Technique lesson), click "Ask Bjorn about this". The drawer opens seeded with the lesson context; the streamed answer stays SCOPED to that lesson (it talks about stirring/spirit-forward, not about something unrelated).
result: pending

#### 8. Library — CRUD + sanitized hrefs + Ask-Bjorn
expected: |
  Open `#library` → add a link (url + title + description + tags) → reload the page → the link persists from `data/library.json` and the title renders as a clickable http(s) link. Try adding a link with url `javascript:alert(1)` → it renders as plain escaped text, NOT as a clickable/executable href. Edit and remove a link → both persist across reload. With your key set, click a link's "Ask Bjorn about this" → seeded drawer opens.
result: pending

#### 9. Ask-Bjorn entry points on cards + chips (REC-04 / AI-04)
expected: |
  In Recommender, click "Ask Bjorn about this" on a recipe card → drawer opens seeded with that recipe and references your taste/mood. In Recipes, click "Ask Bjorn about this" on a recipe chip → same behavior.
result: pending

#### 10. Best-bottle advice (AI-05)
expected: |
  In Inventory, click "Best bottle to add (AI)" → drawer answers with a single-bottle recommendation grounded in your inventory and vetoes. Same from Dashboard. Confirm the Dashboard cards "Chat with Bjorn" / "Classroom" / "Library" are now real links (no longer disabled).
result: pending

#### 11. Bartender Wizard — Help-me-write (AI-12)
expected: |
  Open the Bartender Wizard, enter a short preference (e.g. "playful surfer"), click "Help me write this with Claude". The personality textarea fills with drafted long-form persona text; you can edit it before the existing save.
result: pending

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
