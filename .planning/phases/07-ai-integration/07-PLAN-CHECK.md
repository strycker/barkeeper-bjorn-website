# Phase 7 Plan Check — Pre-Execution Verification

**Date:** 2026-05-26
**Plans verified:** 07-01 through 07-06 (6 plans, 5 waves)
**Method:** Goal-backward — start from ROADMAP §Phase 7 deliverables + REQUIREMENTS.md AI/CHAT/SET/LIB/REC-04 IDs + 07-CONTEXT.md D-01..D-15 → trace to tasks → spot-check codebase anchors.

---

## Verdict: PASS-WITH-CONCERNS

The plan set covers 24 of the 25 ROADMAP requirements with concrete, schema-validated, write-gated tasks. Cross-plan function signatures (`streamMessage`, `requestJSON`, `callMessages`, `buildContext`, `deriveContextMarkdown`, `WriteGate.validate/gate/inventoryFidelity`, `ChatView.openDrawer`) line up between producer (07-01 / 07-03) and consumers (07-02..06). Codebase anchors spot-checked — `claude-api.js DEFAULT_MODEL` is in fact stale `claude-sonnet-4-5-20250929` (07-01 fix needed and planned), `Normalize.byKey` exists with the documented dispatch shape, `Utils.sameRecipe` exists, `recipes.js` tabs/`buildPromptContext`/`showAIPromptModal` exist, `parseBottleEntry` at inventory.js:77-113 exists with the documented fallback at :110, `bartender-wizard.js #bw-personality` at :240 exists, `dashboard.js` disabled cards at :128-152 exist, `export.js exportAIContext` and `renderPreview` exist at the cited lines, `settings.js #st-ai-key-toggle` Reveal exists. The `cleanup-on-leave` router hook does NOT currently exist (07-03 plans to add it — correctly identified).

One real coverage gap (AI-13) and several mid-severity wiring / scope concerns are listed below. The phase goal is achievable, but the AI-13 gap means a ROADMAP requirement will not ship without a fix.

---

## HIGH — Will fail to achieve the phase goal as scoped

### H-1. AI-13 (ingredient derivation AI inference) is unimplemented despite frontmatter claim
- **Plan / task:** 07-01 frontmatter `requirements: [..., AI-13]` — but no task in 07-01 (or any plan) extends `app/js/recommender-engine.js` to add a Claude fallback after the existing `DERIVATIONS` lookup, and no plan adds a derivation cache.
- **Evidence:** Phase 5 `DERIVATIONS` lives in `app/js/recommender-engine.js:103-133` (confirmed by grep). 07-01's `deriveContextMarkdown` is the D-06 context derivation (markdown from JSON for prompt assembly) — a different concept from AI-13. The names overlap; the implementations do not. No plan modifies `recommender-engine.js`.
- **Why it fails the goal:** ROADMAP Phase 7 explicitly lists AI-13 in the Requirements line; REQUIREMENTS.md §Phase 7 also lists it. Marking it covered in 07-01's frontmatter while implementing only context derivation is exactly the scope-reduction failure mode (Dimension 7b).
- **Fix:** Either (a) add a Task 4 to 07-05 (or a new short plan 07-07) that wires `ClaudeAPI.requestJSON({schemaKey:'inventory'-ish or freeform, ...})` into `recommender-engine.js` after the static `DERIVATIONS` lookup misses, cached by ingredient name in `localStorage.bb_derivation_cache` (mirrors 07-06's `bb_parse_cache` pattern), key-gated, no-key → static-map-only; OR (b) strike AI-13 from 07-01's `requirements:` and explicitly defer it in CONTEXT.md (which it is not — D-14 lists AI-13 as in-scope). The honest path is (a).

---

## MEDIUM — Likely rework if executed as written

### M-1. 07-06 `depends_on` missing 07-02 despite both editing `app/js/views/settings.js`
- **Plan:** 07-06 frontmatter — `depends_on: [01, 05]`.
- **Issue:** 07-02 also modifies `settings.js`. Wave ordering (07-06 in wave 5, 07-02 in wave 2) makes this sequential in practice, but the dependency graph does not document the file-level dependency, so a reorder or partial execution could silently lose 07-02's #sect-ai-key edits.
- **Fix:** Add `02` to 07-06 `depends_on`.

### M-2. 07-05 Task 1 scope — 5 view files modified inside a single task
- **Plan / task:** 07-05 Task 1 modifies `recommender.js`, `recipes.js`, `inventory.js`, `dashboard.js`, `bartender-wizard.js`, `app.css` in one task description.
- **Issue:** Five file edits + one CSS file in one task description risks the "context degrades, action gets vague" failure mode. The grep gates are loose ("`openDrawer` ≥1 in each file") and don't enforce the per-file behavior contract.
- **Fix:** Either split Task 1 into 1a (cards: recommender + recipes Ask-Bjorn buttons) and 1b (toolbars: inventory AI-05 + dashboard un-disable + wizard AI-12), or tighten the acceptance criteria with per-file behavior assertions (e.g. `recommender.js` must wire `data-ask-recipe` delegation in `_rerender`).

### M-3. 07-03 manual GitHub save path bypasses State.FILES — undocumented data location
- **Plan / task:** 07-03 Task 2 step 2 — writes `data/conversations/chat-*.json` via `GitHubAPI.writeJSON` directly, with the explicit instruction "do not register it in State.FILES".
- **Issue:** This creates an under-the-radar data directory the rest of the app does not know about. Phase 8 (Portability) will not see it in `export.js exportAIContext` or in any per-page export. The plan note "outside the 5 State files" is honest but the consequence is silent: a user "Save conversation to GitHub" lands a file the app cannot reload or export.
- **Fix:** Either (a) commit to making it an unmanaged write and add a one-line note in 07-03 SUMMARY flagging "transcripts in data/conversations/ are write-only from the app — Phase 8 will need to decide round-trip", or (b) register `conversations` as a 7th State file with an array-of-conversation schema. Option (a) is acceptable for v1 but must be explicit.

### M-4. 07-04 promises "tolerant 404 for library" but 07-01 only built the tolerant wrapper for `drafts`
- **Plan / task:** 07-04 Task 2 step 4 — "Apply the SAME tolerant-404 wrapper used for `drafts`".
- **Issue:** 07-01 Task 2 implements the tolerant load specifically for the `drafts` key ("wrap the `drafts` read so a 404/Not Found resolves to {data:{drafts:[]}, sha:null}"). 07-04 then has to either (a) extend that branch to also cover `library`, or (b) generalize 07-01's wrapper to all "optional" files. Neither plan explicitly states which approach 07-04 should take, and 07-01's action wording ("wrap the `drafts` read") is narrow.
- **Fix:** Update 07-04 Task 2 step 4 to be explicit: "extend the per-file tolerant-404 branch from 07-01 so it also covers `library`" — and make the grep gate confirm both keys are tolerated (e.g. `grep -c "drafts\\|library" inside the catch path`).

### M-5. 07-06 Task 1 AI-08 import — per-schema loop sends ALL of `mdText` to each schema extractor
- **Plan / task:** 07-06 Task 1 step 2 — "for each schema target, `requestJSON({ ... userPrompt: mdText, schemaKey:<key>, ...})`".
- **Issue:** Sending the whole markdown blob 4 times (one per schema file) — once per inventory / profile / recipes / barkeeper — multiplies cost by 4× (Pitfall 6: cost trap) and produces redundant interpretations. The plan doesn't say "parse once, route by section heading" or "ask Claude in one call which sections are present, then dispatch".
- **Fix:** Either (a) one Claude call that returns `{ inventory?, profile?, recipes?, barkeeper? }` keyed structured output (requestJSON over a top-level "bundle" schema), then per-key WriteGate; or (b) a cheap Haiku pre-pass to classify which sections are present and only call the expensive extractors on those.

### M-6. 07-04 Task 1 — Ask-Bjorn-about-lesson uses a `data-lesson` index but the seeded prompt is built from "lesson title + a one-line summary"
- **Plan / task:** 07-04 Task 1 step 3 — "ChatView.openDrawer({ seed: 'In the context of this lesson — "<lesson.title>": <short lesson summary>'...})".
- **Issue:** "<short lesson summary>" is not specified. Either it's the first sentence of the lesson body, a separate field on each lesson, or the whole body. CLASSROOM_CONTENT shape in Task 1 step 1 is `{ title, body }` only — no `summary`. The seed will silently default to either the full body (large, expensive) or empty string (low quality).
- **Fix:** Either add `summary` (≤200 chars) as a required field of each lesson in `classroom-content.js`, or specify "first sentence of body, capped at 200 chars".

---

## LOW — Polish, not blockers

### L-1. 07-03 `_buildMessages` window size (`N≈8`) and summarization threshold (`>12`) are inline comments, not constants with names — fine, but make them named constants per CLAUDE.md style.

### L-2. 07-02 — the SET-05 selector pre-selects sonnet by reading `localStorage.bb_chat_model || 'claude-sonnet-4-6'`. If a stale `bb_chat_model = 'claude-sonnet-4-5-20250929'` lingers in a returning user's browser, the selector will fail to find a matching option and select nothing. Add a defensive "if the saved value is not one of the three known IDs, clear it and use sonnet" branch.

### L-3. 07-03 nav link insertion adds `<a href="#chat" data-route="chat">` to `#main-nav` (index.html line 23) — but 07-04 also inserts `#classroom` and `#library` into the same nav. The plans don't specify ordering, so two parallel-eligible tasks (07-03 and 07-04, technically waves 2 and 3 — sequential, fine) could still produce inconsistent nav order. Specify nav order in 07-04 (e.g. "after #recipes, before #settings").

### L-4. 07-03 manual save filename is `chat-${Date.now()}.json` — millisecond precision is fine, but a user clicking Save twice in the same millisecond would clobber. Add `+ '-' + Math.random().toString(36).slice(2,6)` or use the SHA-based 409-retry path.

### L-5. 07-05 acceptance criterion `grep -c "escapeHtml" app/js/views/recipes.js increased vs. baseline` is non-deterministic — capture the baseline count explicitly in the plan so the executor can confirm.

### L-6. 07-04 library `_safeHref` regex `/^https?:\/\//i` is correct, but the test fixtures in 07-06 do not include a `javascript:`/`data:`-URL fixture to assert the sanitization at test time. Consider adding `tests/fixtures/library-bad-url.txt` and a deterministic row to 07-06 Task 3.

---

## Coverage Matrix (25/25 in frontmatter; 24/25 actually delivered by tasks)

| Req | Plan | Task delivers behavior? |
|-----|------|-------------------------|
| AI-01 | 07-02 | Yes (confirm-existing + Reset sweep) |
| SET-05 | 07-02 | Yes |
| AI-09 | 07-02 | Yes |
| AI-02 | 07-03 | Yes |
| CHAT-01 | 07-03 | Yes |
| CHAT-02 | 07-01 | Yes (header in streamMessage + callMessages) |
| CHAT-03 | 07-03 | Yes |
| CHAT-04 | 07-03 (via 07-01 buildContext) | Yes (superseded by D-04 richer context) |
| CHAT-05 | 07-01 | Yes |
| CHAT-06 | 07-03 | Yes |
| CHAT-07 | 07-03 (superseded by D-03/D-07) | Yes |
| CHAT-08 | 07-01 | Yes |
| CHAT-09 | 07-01 | Yes |
| AI-03 | 07-05 | Yes |
| AI-04 | 07-05 | Yes |
| REC-04 | 07-05 | Yes |
| AI-05 | 07-05 | Yes |
| AI-06 | 07-04 | Yes |
| AI-07 | 07-04 | Yes |
| LIB-01 | 07-04 | Yes |
| AI-08 | 07-06 | Yes |
| AI-10 | 07-06 | Yes |
| AI-11 | 07-06 | Yes |
| AI-12 | 07-05 | Yes |
| **AI-13** | 07-01 (claimed) | **NO — see H-1** |

## Cross-Plan Signature Soundness

| Producer (07-01 / 07-03 / 07-04) | Signature | Consumer | Calls match? |
|---|---|---|---|
| `ClaudeAPI.streamMessage(body, {onText, signal})` | 07-01 | 07-03 chat.js | ✅ |
| `ClaudeAPI.callMessages(body) -> text` | 07-01 | 07-03 summarization (Haiku) | ✅ |
| `ClaudeAPI.requestJSON({system,userPrompt,schemaKey,model,maxTokens})` | 07-01 | 07-05 recipes.js, 07-05 bartender-wizard.js, 07-06 settings.js, 07-06 inventory.js | ✅ |
| `ClaudeAPI.buildContext() -> system blocks w/ cache_control` | 07-01 | 07-03 chat.js | ✅ |
| `WriteGate.validate(schemaKey, payload) -> string[]` | 07-01 | 07-05 recipes.js, 07-06 settings.js, 07-06 tests | ✅ |
| `WriteGate.gate({schemaKey,oldData,newPayload,message,onConfirm})` | 07-01 | 07-05, 07-06 | ✅ |
| `WriteGate.inventoryFidelity(recipe, tokens, vetoes)` | 07-01 | 07-05 recipes.js draft preview | ✅ |
| `ChatView.openDrawer({seed})` | 07-03 | 07-04 classroom + library, 07-05 recommender/recipes/inventory/dashboard | ✅ |
| `ChatView.cleanup()` | 07-03 | 07-03 app.js router (cleanup-on-leave) | ✅ |
| Normalize byKey adds `drafts`, `library` | 07-01 (drafts), 07-04 (library) | State.set/loadAll | ✅ |
| drafts as 5th State file | 07-01 | 07-05 (Drafts tab + promote) | ✅ |
| library as 6th State file | 07-04 | 07-04 library.js CRUD | ✅ |

No signature drift detected. No invented anchors.

## D-01..D-15 Compliance

| Decision | Honored by | Note |
|---|---|---|
| D-01 entry points open shared drawer | 07-04, 07-05 | ✅ no bespoke chat panels (grep gates assert `streamMessage` not used in views) |
| D-02 two surfaces | 07-03 | ✅ |
| D-03 persisted history + Save | 07-03 | ✅ (CHAT-07 explicitly superseded) |
| D-04 rich context | 07-01 deriveContextMarkdown | ✅ |
| D-05 prompt caching | 07-01 buildContext cache_control | ✅ |
| D-06 markdown-derived context | 07-01 deriveContextMarkdown | ✅ (reuses export.js walk, NOT a new Phase-8 converter) |
| D-07 windowing + summarization | 07-03 _maybeSummarize | ✅ |
| D-08 streaming + abort + errors | 07-01 + 07-03 | ✅ |
| D-09 auto-save draft + card open | 07-05 Task 2 | ✅ |
| D-10 refinement write-back | 07-05 Task 2 | ✅ (same-draft tweak, new-draft generate, fork-before-refine) |
| D-11 drafts.json + Drafts tab + promote | 07-01 + 07-05 Task 3 | ✅ |
| D-12 model selector + log | 07-02 | ✅ |
| D-13 Classroom + Library | 07-04 | ✅ |
| D-14 AI-enhanced data | 07-05 + 07-06 | ⚠️ AI-13 portion missing — see H-1 |
| D-15 phase completion | scoped to UAT/VALIDATION, not in plans | ✅ (`autonomous: false` checkpoints present in 07-03/04/05/06) |

## Scope / File-Collision

| Wave | Plans | Shared files | Risk |
|---|---|---|---|
| 1 | 07-01 | — | none |
| 2 | 07-02, 07-03 | none (settings.js vs chat+app+index+css) | ✅ |
| 3 | 07-04 | state.js, normalize.js, app.js, index.html, app.css | extends 07-01/07-03 outputs — ✅ sequential |
| 4 | 07-05 | 5 view files + app.css | ⚠️ wide scope — see M-2 |
| 5 | 07-06 | settings.js (also 07-02), inventory.js (also 07-05) | ⚠️ undeclared dep on 02 — see M-1 |

## Validation / Nyquist

VALIDATION.md exists. Wave 0 fixtures planned in 07-06 Task 3 (correctly deferred from 07-01 with a documented TODO link). Every deterministic task has an `<automated>` `<verify>` block (`node --check` + grep gates + `node tests/phase-07-ai.test.js`). Subjective AI-quality behaviors are correctly routed to `checkpoint:human-verify` checkpoints in 07-03/04/05/06. No watch flags. Sampling continuity holds (no 3-in-a-row without automated verify).

---

VERDICT: PASS-WITH-CONCERNS | HIGH: 1 | MEDIUM: 6 | LOW: 6

---

## Revision Log (2026-05-26)

| Finding | Severity | Disposition | Where |
|---|---|---|---|
| **H-1** AI-13 unimplemented | HIGH | **Fixed** — removed AI-13 from 07-01 `requirements`; added to 07-05 `requirements` + `files_modified` (`app/js/recommender-engine.js`) + truths/artifacts/key_links; inserted **Task 4** in 07-05 implementing `RecommenderEngine.deriveWithAI` (key-gated, cached in `bb_derivation_cache`, fail-soft, additive — Phase 5 sync path unchanged); checkpoint `<what-built>` updated. | 07-01-PLAN.md, 07-05-PLAN.md |
| M-1 07-06 missing dep on 07-02 | MEDIUM | **Fixed** — `depends_on: [01, 02, 05]`. | 07-06-PLAN.md |
| M-2 07-05 Task 1 5-file scope | MEDIUM | **Deferred to executor** — the planner already partitioned each view with per-file `<action>` bullets; if executor context degrades, executor may split into 1a (cards) + 1b (toolbars) per the checker's suggested boundary. No plan edit. | — |
| M-3 `data/conversations/` unmanaged | MEDIUM | **Fixed** — strengthened the parenthetical: explicitly write-only-from-app, not registered in State.FILES, not reloaded, not in exportAIContext. | 07-03-PLAN.md |
| M-4 tolerant-load extension underspecified | MEDIUM | **Fixed** — 07-04 Task 2 step 4 now says "extend the per-file tolerant-404 branch from 07-01 so it covers BOTH `drafts` AND `library`"; acceptance criterion adds a `grep -nE "drafts\|library"` gate over the loadAll catch block. | 07-04-PLAN.md |
| M-5 AI-08 4× cost loop | MEDIUM | **Fixed** — 07-06 Task 1 step 2 rewritten: ONE `callMessages` call that returns a single JSON object whose keys are only the sections present; each section then runs through `Normalize.byKey` + `WriteGate.validate` + `WriteGate.gate` sequentially. AI-10 plugs into the `errors.length` branch. | 07-06-PLAN.md |
| M-6 lesson summary unspecified | MEDIUM | **Fixed** — Task 1 behavior + action now specify "first sentence of `lesson.body`, capped at 200 chars" with the exact JS expression `(lesson.body.split(/(?<=[.!?])\s/)[0] || lesson.body).slice(0, 200)`. | 07-04-PLAN.md |
| L-1..L-6 polish | LOW | **Deferred to execution** — executors may apply at the point of edit (named constants, defensive stale-model-ID guard, nav ordering, save-collision token, baseline grep counts, bad-URL test fixture). No plan edit; this log records them as known. | — |

### Post-Revision Verdict

All HIGH findings resolved with concrete plan edits. 5 of 6 MEDIUM resolved with surgical edits; 1 (M-2) deferred to executor with explicit rationale. 6 LOW deferred to execution time. Coverage remains 25/25 (each ID in exactly one plan).

VERDICT (post-revision): PASS | HIGH: 0 | MEDIUM (open): 1 deferred-to-executor | LOW (open): 6 deferred-to-execution
