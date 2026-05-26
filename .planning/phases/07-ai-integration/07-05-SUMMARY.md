---
phase: 07-ai-integration
plan: 05
subsystem: ai-integration
tags: [ai-03, ai-04, ai-05, ai-12, ai-13, rec-04, drafts, write-gate, drawer, recommender-engine, derive-with-ai, shared-drawer, d-09, d-10, d-11, d-14]
requires:
  - "07-01: ClaudeAPI.requestJSON / callMessages / extractJSON / getKey / getModel"
  - "07-01: WriteGate.gate / validate / inventoryFidelity"
  - "07-01: drafts as 5th tolerant State file with Normalize.drafts"
  - "07-03: ChatView.openDrawer({seed}) — shared ephemeral drawer (D-01)"
  - "07-04: #classroom and #library route targets (un-disabled cards point at these)"
provides:
  - "Drawer-seeding 'Ask Bjorn about this' entry on every recommender card and Recipes-tab chip (REC-04/AI-04)"
  - "AI-05 'Best bottle to add' entry on Inventory toolbar and Dashboard"
  - "Un-disabled Dashboard Chat/Classroom cards + new Library card and AI-05 best-bottle action"
  - "Bartender Wizard 'Help me write this with Claude' persona drafter (AI-12)"
  - "AI-03 Generate-with-AI: requestJSON('drafts') -> auto-saved draft via WriteGate (D-09)"
  - "Refine card: same-draft tweak / generate-new / fork-before-refine (D-10), all gated"
  - "Drafts tab + Promote-to-Original (D-11) with sequential save (recipes then drafts)"
  - "RecommenderEngine.deriveWithAI — key-gated, cached, fail-soft Claude fallback (D-14 / AI-13)"
  - "Phantom + veto'd ingredient surfacing on draft preview (FM #3)"
affects:
  - "app/js/views/recommender.js — Ask-Bjorn button on _renderCard + _renderTwoAwayCard; delegation in _rerender"
  - "app/js/views/recipes.js — Ask-Bjorn on chips; AI-03 generate/refine flow; Drafts tab; Promote-to-Original"
  - "app/js/views/inventory.js — top-bar AI-05 best-bottle entry"
  - "app/js/views/dashboard.js — un-disabled Chat/Classroom into real links; Library card; AI-05 action"
  - "app/js/views/bartender-wizard.js — AI-12 persona drafter button next to #bw-personality"
  - "app/js/recommender-engine.js — additive deriveWithAI + cache helpers; existing exports preserved"
  - "app/css/app.css — appended .ai-ask-btn / .ai-advice-btn styles"
  - "tests/phase-07-ai.test.js — 4 new AI-13 deterministic rows (export, no-key, cache, fail-soft)"
tech-stack:
  added: []
  patterns:
    - "Drawer-as-single-AI-surface (D-01): every entry point calls ChatView.openDrawer({seed}); zero bespoke streaming panels in any view (verified: grep streamMessage in recommender/inventory/dashboard = 0)"
    - "Fail-closed AI write contract: ClaudeAPI.requestJSON -> WriteGate.gate -> onConfirm -> State.set/save. No drafts/recipes write outside an onConfirm callback"
    - "Sequential cross-file save: await State.save('recipes') THEN State.save('drafts') for Promote-to-Original (Pitfall 4 — never parallel)"
    - "Same-draft refine vs new-draft generate: draft_id tracks the open draft for in-place updates (D-10); fork mode preserves the original"
    - "Key-gated, cached, fail-soft additive helper pattern for AI-13 (deriveWithAI returns false on any error; no key = byte-identical Phase 5)"
    - "Free-text AI helper for non-schema use (AI-12): callMessages directly + fill textarea + dispatch 'input' so the existing State.patch handler saves (no direct AI->GitHub write — T-07-27)"
key-files:
  created: []
  modified:
    - "app/js/views/recommender.js"
    - "app/js/views/recipes.js"
    - "app/js/views/inventory.js"
    - "app/js/views/dashboard.js"
    - "app/js/views/bartender-wizard.js"
    - "app/js/recommender-engine.js"
    - "app/css/app.css"
    - "tests/phase-07-ai.test.js"
decisions:
  - "AI-12 wizard drafter uses ClaudeAPI.callMessages (free text) rather than requestJSON(schemaKey:'barkeeper') — the persona is a paragraph stored in a single field, and requesting the full barkeeper.json shape would force the model to fabricate identity/voice/etc that the user already set in earlier fields. The textarea-value assignment is XSS-safe (T-07-24); persistence still flows through the existing input handler (no direct AI->GitHub write)."
  - "Refine card supports three modes (D-10): 'Apply tweak' updates the SAME draft_id; 'Generate new' creates a fresh draft_id; 'Save copy then refine' (fork) clones the current draft into a new entry before refining so the original is preserved. All three go through WriteGate."
  - "Promote-to-Original drops draft-only metadata (draft_id, source_prompt, created_at, updated_at) when re-tagging; it adds 'creator' (defaulting to the barkeeper identity) and 'date_created' (today) so the promoted entry conforms to recipes.schema.json without further editing."
  - "Discard-draft path skips WriteGate by design: no AI-generated payload enters drafts.json on a deletion (the gate's purpose is fail-closed validation of MODEL output, not user-driven removals). This mirrors the existing remove-from-favorites/wishlist UX in the same view."
  - "AI-13 uses ClaudeAPI.callMessages directly (NOT requestJSON) because the derivation answer has no schemaKey — sidesteps WriteGate.validate's required schemaKey. Read-only query; never writes to State."
  - "Test helper withClaudeStub MUST `await fn()` inside try (not `return fn()`) — try/finally with a returned promise fires the `finally` block synchronously, restoring the patched methods BEFORE the async test body completes. This produced spurious cache-miss results in the AI-13 cache test until corrected. Documented inline in the helper."
metrics:
  duration_minutes: 8
  completed: "2026-05-26"
  tasks_total: 5
  tasks_complete: 5
  commits: 5
---

# Phase 7 Plan 5: AI Integration — User-visible AI Features Summary

Wires Phase 7's AI primitives into the five existing views: Ask-Bjorn drawer entries on every recommender card / Recipes-tab chip (REC-04/AI-04), AI-05 best-bottle advice on Inventory + Dashboard, AI-12 persona drafter on the Bartender Wizard, full AI-03 generate→draft→refine→promote flow (D-09/D-10/D-11) gated by WriteGate end-to-end, and the additive AI-13 RecommenderEngine.deriveWithAI fallback (key-gated, cached, fail-soft). Bjorn is now reachable from every surface.

## What Shipped

**Task 1 — Drawer-seeding AI entry points across 5 views (REC-04/AI-04/AI-05/AI-12)** — commit `32b2ef7`
- `recommender.js`: "Ask Bjorn" button added to `.rec-card-actions` in both `_renderCard` and `_renderTwoAwayCard`. Delegation in `_rerender` seeds `ChatView.openDrawer` with recipe name + base + current mood-slider floats.
- `recipes.js`: same "Ask Bjorn" button on every chip in `renderRecipeChips`, with click-stop so it doesn't open the detail modal.
- `inventory.js`: top-toolbar "✨ Best bottle to add (AI)" button seeds the drawer with the gap-analysis question.
- `dashboard.js`: replaced the two `data-coming-soon` cards with real `<a href="#chat">` / `<a href="#classroom">` links; added a `<a href="#library">` card and a fourth `data-ai-best-bottle` action that opens the drawer with the AI-05 seed. `data-coming-soon` count is now 0 (down from 2).
- `bartender-wizard.js`: "✨ Help me write this with Claude" button added next to `#bw-personality`. Click → `ClaudeAPI.callMessages` with a short-input → fills the textarea and dispatches `input` so the existing `State.patch('barkeeper', …)` handler saves through the normal path (T-07-27: no direct AI→GitHub write).
- `app.css`: appended `.ai-ask-btn` and `.ai-advice-btn` styling.

**Task 2 — AI-03 generate → draft → refine via requestJSON + WriteGate (D-09/D-10)** — commit `a72fdf8`
- Replaced the copy-prompt stub `showAIPromptModal` with a live design flow.
- `runAIDesign({mode, ...})` drives all three paths through one helper: `ClaudeAPI.requestJSON({schemaKey:'drafts', ...})` returns a Normalized `{drafts:[entry]}`; the candidate is wrapped with `_source:'ai-generated'`, `draft_id`, `created_at`, `updated_at`, `source_prompt`; `WriteGate.gate` auto-saves it (the single `State.save('drafts')` call is inside `onConfirm`).
- `WriteGate.inventoryFidelity(draft, tokens, vetoes)` surfaces phantom + veto'd ingredients as toasts before promote (FM #3). Tokens computed via new `_inventoryTokens` helper (lowercased name + sub-tokens from every bottle/perishable/produce section).
- Refine card (`renderRefineCard`) stays open after save with three actions: "Apply tweak (same draft)" updates the same `draft_id`; "Generate new" creates a fresh draft; "Save copy then refine" forks the current draft into a new entry, preserving the original.
- All rendered draft fields are escaped via `Utils.escapeHtml` (T-07-24 / Pitfall 3).

**Task 3 — Drafts tab + Promote-to-Original via WriteGate (D-11)** — commit `9675203`
- Added `<div class="tab" data-tab="drafts">Drafts (N)</div>` to the Recipes tab bar; header recipe counts now include draft count when nonzero.
- `renderDraftChips` renders each draft (universal recipe shape) with a "Promote to Original" + "Discard" button per chip; source-prompt audit-trail rendered (escaped).
- `promoteDraftToOriginal`: builds `promoted = {...draft, _source:'originals', id:'cocktail'+Date.now(), creator:<barkeeper.name>, date_created:<today>}`, drops draft-only metadata, runs `Utils.sameRecipe` against existing originals to flag a possible duplicate in the diff preview (informational; doesn't block), then routes through `WriteGate.gate({schemaKey:'recipes', ...})`. The `onConfirm` saves SEQUENTIALLY: `await State.save('recipes')` THEN `await State.save('drafts')` (Pitfall 4 — parallel saves cause 409).
- Discard path is a non-AI delete (no model output entering data), so it bypasses WriteGate — same pattern as existing remove-from-favorites handlers.

**Task 4 — AI-13 RecommenderEngine.deriveWithAI — key-gated, cached, fail-soft** — commits `d70613a` (RED) + `284dde6` (GREEN)
- RED gate: 4 new tests in `tests/phase-07-ai.test.js` covering export presence, no-key path (no network call), cache fall-through (callCount stays at 1), and fail-soft on any throw. `withClaudeStub` helper monkey-patches the real `ClaudeAPI` object in-place (necessary because `vm.runInThisContext` const declarations create lexical bindings; engine module captures `ClaudeAPI` by lexical reference — `globalThis.ClaudeAPI` swaps are invisible to it).
- GREEN gate: `DERIV_CACHE_KEY='bb_derivation_cache'` + `_loadDerivCache` / `_saveDerivCache` / `_derivKey(ingredient, tokens)` helpers added inside the IIFE after `DERIVATIONS`. `async function deriveWithAI(ingredient, inventoryTokens)`: key-gate FIRST (no key → return false, no cache touch, no network), cache hit → return cached boolean (Pitfall 6 cost trap), miss → `ClaudeAPI.callMessages` with a 64-token JSON-only prompt + `extractJSON` + cache + return; ANY throw → return false (fail-soft, FM #2). IIFE return extended to include `deriveWithAI` while preserving every existing export (`recommend`, `normalizeProfile`, `normalizeOriginal`).
- `_expandLookup` / `DERIVATIONS` / `_hasIngredient` paths UNCHANGED — AI-13 is purely additive; with no key the engine is byte-identical to Phase 5.

**Task 5 — Checkpoint: human-verify (auto-approved per yolo mode)** — no commit
- AUTO-APPROVED per `--auto-advance` / yolo orchestrator mode. Live-key UAT for AI-03 recipe balance / persona voice / AI-13 derivation quality / AI-05 advice quality / AI-12 persona quality / phantom-flag + fail-closed UI exercise is deferred to `/gsd-verify-work` (or manual UAT). The Phase-7 VALIDATION manual-only table covers these.

## Acceptance Gate Results

All grep / node-check / test gates pass:

| Gate | Expected | Result |
|------|----------|--------|
| `node --check` on all 5 modified view files | exit 0 | PASS |
| `node --check app/js/recommender-engine.js` | exit 0 | PASS |
| `grep -c openDrawer` per view (recommender/recipes/inventory/dashboard) | ≥1 each | 2 / 2 / 2 / 3 |
| `grep -c 'href="#chat"' app/js/views/dashboard.js` | ≥1 | 1 |
| `grep -c 'href="#classroom"' app/js/views/dashboard.js` | ≥1 | 1 |
| `grep -c 'href="#library"' app/js/views/dashboard.js` | ≥1 | 1 |
| `grep -c 'data-coming-soon' app/js/views/dashboard.js` | reduced from baseline | 0 (was 2) |
| `grep -c 'bw-ai-help\|requestJSON\|callMessages' app/js/views/bartender-wizard.js` | ≥1 | 7 |
| `grep -c streamMessage app/js/views/{recommender,inventory,dashboard}.js` | 0 (drawer reuse) | 0 / 0 / 0 |
| `grep -c requestJSON app/js/views/recipes.js` | ≥1 | 4 |
| `grep -c drafts app/js/views/recipes.js` | ≥1 | 15 |
| `grep -c WriteGate app/js/views/recipes.js` | ≥1 | 8 |
| `grep -c inventoryFidelity app/js/views/recipes.js` | ≥1 | 3 |
| `grep -c draft_id app/js/views/recipes.js` | ≥1 | 8 |
| Every `State.save('drafts')` inside `onConfirm` | manual confirm | PASS (single call, in onConfirm) |
| `grep -c 'data-tab="drafts"' app/js/views/recipes.js` | 1 | 1 |
| `grep -c Promote app/js/views/recipes.js` | ≥1 | 5 |
| `grep -c _source app/js/views/recipes.js` | ≥1 | 6 |
| `grep -c cocktail app/js/views/recipes.js` | ≥1 | 9 |
| Promote sequential: recipes save BEFORE drafts | manual confirm | PASS (lines 553→559) |
| `grep -c sameRecipe app/js/views/recipes.js` | ≥1 | 13 |
| `grep -c deriveWithAI app/js/recommender-engine.js` | ≥2 | 2 (definition + return-export) |
| `grep -c bb_derivation_cache app/js/recommender-engine.js` | ≥1 | 1 |
| `grep -c ClaudeAPI app/js/recommender-engine.js` | ≥1 | 4 |
| `grep -c streamMessage app/js/recommender-engine.js` | 0 | 0 |
| Phase-5 recommender tests pass (synchronous-path preserved) | green | PASS (phase-05-engine + phase-05-normalize) |
| Phase-7 AI-13 rows pass | green | PASS (22/22 in phase-07-ai.test.js) |

## Deviations from Plan

**1. [Rule 3 — pragmatic TDD split for Task 2]** — Task 2 was tagged `tdd="true"` but the AI-03 design flow is composed of two primitives that already have deterministic TDD coverage in `phase-07-ai.test.js` (WriteGate.validate fail-closed + WriteGate.inventoryFidelity phantom/veto rows shipped in 07-01) plus heavy DOM-binding view code that cannot be exercised in node without a full DOM stack. The implementation was written with the acceptance grep gates as the structural test contract (every `State.save('drafts')` inside an `onConfirm`; `requestJSON` with `schemaKey:'drafts'`; `inventoryFidelity` surfaced). No standalone RED commit for Task 2 — the existing 07-01 deterministic tests cover the underlying contract; the view code is verified by `node --check` + grep + the existing test suite remaining green. Recipe-balance and live recipe quality are UAT (per Phase-7 VALIDATION Manual-Only table).

**2. [Rule 1 — test-helper bug found during TDD]** — `withClaudeStub` in the new tests originally used `try { return fn(); }`. The `try/finally` block fired the `finally` (restoring patched methods) SYNCHRONOUSLY because `fn()` returns a promise — the patched methods were restored before the async test body completed. Caused a spurious cache-miss in the AI-13 cache test (r2 came back as `false` because `ClaudeAPI.getKey()` had reverted to the empty real value mid-call). Fixed by changing to `try { return await fn(); }` and adding an explanatory comment to the helper. Captured in the GREEN commit (`284dde6`).

## Known Stubs

None. Every UI affordance shipped in this plan is wired to its real backing primitive:
- Ask-Bjorn buttons call `ChatView.openDrawer` (live in 07-03)
- Best-bottle buttons call `ChatView.openDrawer` (live)
- Wizard "Help me write this" calls `ClaudeAPI.callMessages` (live)
- Generate-with-AI calls `ClaudeAPI.requestJSON({schemaKey:'drafts'})` (live)
- Drafts tab reads `State.get('drafts')` (5th State file live since 07-01)
- Promote-to-Original calls `WriteGate.gate` then sequential `State.save` (live)
- `deriveWithAI` is exported but currently a callable opt-in helper — no caller wires it into the recommender's main path yet. **This is the intentional shape per plan H-1 / D-14 ("additive opt-in helper")** — the engine's synchronous derivation path is unchanged so Phase-5 behavior is byte-identical when no caller invokes the new helper. A future enhancement could wire it into `_expandLookup` behind a feature flag.

## Threat Flags

None new — every surface added in this plan is covered by the plan's `<threat_model>` register (T-07-22 through T-07-27). Mitigations confirmed:

| Threat | Mitigation in this plan |
|--------|--------------------------|
| T-07-22 (Tampering: draft/promote writes) | `WriteGate.gate` on every drafts/recipes AI write; `requestJSON` fails closed before any write |
| T-07-23 (Spoofing buildable) | `WriteGate.inventoryFidelity` phantom + veto flag toasted before save |
| T-07-24 (XSS via model output) | `Utils.escapeHtml` on every draft preview / refine card field / chip / source-prompt; textarea value assignment used for persona drafter (no innerHTML) |
| T-07-25 (DoS / cost) | `max_tokens: 1500` on AI-03 / `max_tokens: 512` on wizard / `max_tokens: 64` on AI-13; drawer reuse means no extra streaming controllers; `requestJSON` does ONE retry only; `deriveWithAI` cached in `bb_derivation_cache` (Pitfall 6) |
| T-07-26 (Promote 409 / partial write) | Sequential save: `await State.save('recipes')` THEN `await State.save('drafts')` in promote's `onConfirm` (Pitfall 4) |
| T-07-27 (Wizard direct AI→GitHub) | AI-12 only fills the textarea and dispatches `input`; the existing `State.patch('barkeeper', …)` handler is the only persistence path |

## Self-Check

Files modified (all present + non-empty):
- `app/js/views/recommender.js` — FOUND
- `app/js/views/recipes.js` — FOUND
- `app/js/views/inventory.js` — FOUND
- `app/js/views/dashboard.js` — FOUND
- `app/js/views/bartender-wizard.js` — FOUND
- `app/js/recommender-engine.js` — FOUND
- `app/css/app.css` — FOUND
- `tests/phase-07-ai.test.js` — FOUND

Commits (all present):
- `32b2ef7` — Task 1
- `a72fdf8` — Task 2
- `9675203` — Task 3
- `d70613a` — Task 4 RED
- `284dde6` — Task 4 GREEN

Full test suite: 4 files green (Phase 5 engine + normalize + Phase 6 + Phase 7).

## Self-Check: PASSED
