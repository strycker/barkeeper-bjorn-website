## RESEARCH COMPLETE

# Phase 7: AI Integration - Research

**Researched:** 2026-05-21
**Domain:** Browser-side BYOK Anthropic integration in a no-build vanilla ES6 IIFE SPA — chat, structured generation, AI-enhanced data ops, two new views
**Confidence:** HIGH (codebase integration verified by direct read; Anthropic API approach pre-locked by AI-SPEC; model IDs re-verified against registry)

> **Scope note:** Per the objective, the Anthropic API mechanics (Messages API via `fetch`, browser-direct header, SSE event names, prompt caching, `requestJSON()` contract, model IDs) are **already locked by 07-AI-SPEC.md §3/§4/§4b** and are treated as given. This research focuses on **codebase integration and sequencing**. AI-SPEC claims that were independently re-verified this session are tagged `[VERIFIED]`; everything else from AI-SPEC is tagged `[CITED: 07-AI-SPEC.md]`.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** All "Ask Bjorn about this" / AI-action entry points (REC-04 on every recipe card, plus Inventory/Dashboard/Recommender AI entry points) open the **shared ephemeral quick-ask drawer** pre-seeded with a context-specific prompt. They do NOT render inline panels and do NOT navigate to `#chat`.
- **D-02:** Two chat surfaces fed by the same context builder: **`#chat`** = one persisted thread (resumes on return, cleared only explicitly); **quick-ask drawer** = ephemeral (clean each open). Page label uses the barkeeper name from `barkeeper.json`.
- **D-03 (supersedes CHAT-07):** `#chat` persists to `localStorage.bb_chat_history`; survives reloads; cleared only by explicit "Clear conversation"; manual **"Save conversation to GitHub"** action (no auto commit-per-message). The drawer is NOT persisted.
- **D-04 (supersedes CHAT-04 token target):** Rich shared context builder = persona + flavor profile + current mood + originals + drafts + made-log with `times_made` tallies + inventory/vetoes + stats.
- **D-05:** Large stable context block delivered via Anthropic **prompt caching** (`cache_control`), reused across turns, refreshed only on data change. Prompt structure per call: (1) cached stable block, (2) running summary verbatim, (3) recent N turns full, (4) current user message.
- **D-06:** Agent receives **derived markdown** (not raw JSON) reusing the canonical `inventory.md` / `bar-owner-profile.md` format. Phase 7 implements lightweight JSON→MD derivation; planner decides minimal-helper-now vs. pull-forward part of Phase 8's `md-converter.js`. The strict round-trippable MD **export** contract stays Phase 8.
- **D-07 (supersedes CHAT-07 window):** Older turns roll into a running summary (sent verbatim); recent turns sent in full; full history retained locally for display; a summarization step condenses older turns as the thread grows.
- **D-08:** Streaming via `fetch`+`ReadableStream`+`TextDecoder` SSE (CHAT-05); `AbortController` tied to view lifecycle, `cleanup()` aborts in-flight stream (CHAT-06); mid-stream SSE `error` rendered (CHAT-08); 429 surfaces `retry-after` (CHAT-09); no-key message links to Settings (CHAT-03); all calls through `claude-api.js` with `anthropic-dangerous-direct-browser-access: true` (CHAT-02).
- **D-09:** On generation, AI recipe is **immediately auto-saved as a draft** AND the chat card stays open for conversational refinement.
- **D-10:** In-place tweaks update the **same** draft; "Generate a new recipe from this" creates a **new** draft; a "Save draft copy before refining" button forks/checkpoints the open draft.
- **D-11:** AI drafts live in a new **`data/drafts.json`** (5th file) + **`schema/drafts.schema.json`**; a separate **"Drafts" tab** on Recipes; each chip has **"Promote to Original"** (moves entry into `recipes.originals`); drafts carry `_source: 'ai-generated'`, promotion re-tags `_source: 'originals'`; generated recipes conform to the universal recipe JSON format.
- **D-12:** SET-05 model selector (Haiku/Sonnet/Opus) → `localStorage.bb_chat_model` consumed by `ClaudeAPI.getModel()`; AI-09 log to `localStorage.bb_api_log` (50-cap) with timestamp/type/model/token usage + copy-raw-JSON + clear; AI-01 masked key field gets a Reveal toggle.
- **D-13:** Classroom (`#classroom`) static content from new `app/js/data/classroom-content.js`, loads WITHOUT a key, interactive (lesson-scoped Q&A) with a key. Library (`#library`) = user-curated external links (URL, title, description, tags), distinct from Classroom, "Ask Bjorn about this" with a key.
- **D-14:** AI-04 (recommender explanations + variations), AI-05 (best-bottle advice on Inventory + Dashboard), AI-08 (legacy MD import → parse → diff → confirm write), AI-10 (JSON error correction → diff → confirm), AI-11 (paste-a-line Claude fallback), AI-12 (Wizard "Help me write this with Claude"), AI-13 (ingredient derivation inference, cached).
- **D-15:** Full UAT + VALIDATION.md (Phases 3–6 pattern); user-initiated via GSD commands; `mode: yolo`, `auto_advance: false`.

### Claude's Discretion
- Drawer vs `#chat` visual layout, animation, exact seeded-prompt wording per entry point.
- `N` for recent-turns-in-full and the summarization threshold.
- Cache-invalidation granularity (per-file change vs whole-context hash).
- Drafts tab placement/ordering relative to Originals/Favorites/Wishlist/Made.
- Classroom content depth/taxonomy; Library tag UX.
- Exact API-log entry shape within the 50-entry cap.
- Whether MD derivation is a standalone helper or part of `claude-api.js` context assembly.

### Deferred Ideas (OUT OF SCOPE)
- Strict round-trippable Markdown **export** contract (`md-converter.js`) — Phase 8.
- Cross-device chat sync beyond manual "Save conversation to GitHub" — Phase 9.
- Server-side key proxying / hiding the key — out of scope; BYOK browser-direct is locked.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AI-01 | Anthropic key field (masked + Reveal); unlocks AI | **Partially done** — `settings.js` `#sect-ai-key` exists with masked input + `st-ai-key-toggle` Show button + save/clear handlers (lines 150–166, 289–297). Phase 7 confirms Reveal toggle wording and "unlocks all AI" gating. |
| SET-05 | Model selector → `bb_chat_model` | Add `<select>` to `#sect-ai-key`; `ClaudeAPI.getModel()` already reads `bb_chat_model` (claude-api.js:17). Verified model IDs in §State of the Art. |
| AI-09 | Call log → `bb_api_log` (50-cap) Settings panel | `claude-api.js` `appendLog()`/`LOG_KEY`/`LOG_MAX=50` already exist (lines 50–60). Add a Settings panel renderer + copy/clear; harden entry shape to never log the key. |
| AI-02 | "Ask Bjorn" chat panel, key-gated, full context injected | New `chat.js` view; context from the D-04 builder. |
| CHAT-01 | `#chat` route from nav + Dashboard | Router add in `app.js`; nav link; dashboard `Chat with Bjorn` card is currently `menu-item--disabled` (dashboard.js:130–136) — un-disable. |
| CHAT-02 | All calls via `claude-api.js` with browser-direct header | Header already present in `generateRecipe` (claude-api.js:91); new `streamMessage`/`requestJSON`/`callMessages` reuse the same header block. |
| CHAT-03 | "No API key" message → Settings | `ClaudeAPI.getKey()` returns '' when absent; each surface checks and shows a link. |
| CHAT-04 | System prompt from persona+profile+inventory+vetoes | **Superseded by D-04** (richer context). Flag supersession. |
| CHAT-05 | Token-by-token streaming (fetch+ReadableStream+TextDecoder SSE) | `streamMessage()` per AI-SPEC §3 — net-new in `claude-api.js`. |
| CHAT-06 | AbortController; `cleanup()` aborts on nav | View-lifecycle pattern already used elsewhere; chat/drawer create controller on open. |
| CHAT-07 | (was) 10-turn in-memory window | **Superseded by D-03 + D-07** (persisted + summarized). Flag supersession. |
| CHAT-08 | Mid-stream SSE `error` rendered | Handled in `streamMessage` per AI-SPEC §3. |
| CHAT-09 | 429 surfaces `retry-after` | `generateRecipe` already reads `retry-after` (claude-api.js:100); replicate in stream path; no retry storm. |
| AI-03 | AI cocktail design — draft + refine, integrates with Recipe Book | Extends `recipes.js` Generate flow (handleGenerate, line 760) + drafts.json + Drafts tab + promote. |
| AI-04 | AI recommendation explanations + variations | `recommender.js` card actions (rec-card-actions, line 85) seed the drawer. |
| REC-04 | "Ask Bjorn about this" on every recipe card → seeded drawer | Card action button across recommender.js + recipes.js chip render. |
| AI-05 | Best-single-bottle advice (Inventory + Dashboard) | Entry points seed the drawer with inventory/gap context. |
| AI-06 | Classroom static reference, no key needed | New `classroom.js` + `app/js/data/classroom-content.js`. |
| AI-07 | Classroom interactive (lesson-scoped Q&A) with key | Lesson context → seeded streaming call. |
| LIB-01 | Library external-links CRUD; "Ask Bjorn" with key | New `library.js`; storage decision in Open Questions. |
| AI-08 | Legacy MD import → parse → diff → confirm write | `requestJSON()` per-file schema + reusable write-gate. |
| AI-10 | AI JSON error correction → diff → confirm | Same write-gate; triggered on save/import failure. |
| AI-11 | Paste-a-line Claude fallback | Falls back from `inventory.js parseBottleEntry` (line 77) on low-confidence parse. |
| AI-12 | Wizard "Help me write this with Claude" | `bartender-wizard.js` personality textarea (line 240) gets a draft button → `requestJSON`/free text. |
| AI-13 | Ingredient derivation inference, cached | Extends `recommender-engine.js DERIVATIONS` static map (line 106) with a Claude fallback + cache. |
</phase_requirements>

**ROADMAP supersessions to flag to the planner (CONTEXT.md wins):**
1. **CHAT-04** "1500–2500 token target" → replaced by **D-04 rich cached context** (no token target; caching makes it affordable).
2. **CHAT-07** "10-turn in-memory window, not persisted" → replaced by **D-03 (localStorage `bb_chat_history` + manual GitHub save)** and **D-07 (summarize older turns)**.
3. **Dashboard drift:** `dashboard.js` ships disabled "Chat with Bjorn" + "Classroom" coming-soon cards (lines 128–152) gated behind a toast saying "add your Anthropic key". Phase 7 un-disables these and adds Library; the toast/gating logic is reused as the CHAT-03 no-key affordance.
4. **Code/comment drift:** `claude-api.js` header comment says "Phase 5 (CHAT) will extend"; STATE notes phase-number drift ("Phase 5 (CHAT)", "06-0X"). This work is Phase 7 — not missing work.

---

## Summary

This is a **brownfield AI-integration phase**. The Anthropic plumbing partially exists: `claude-api.js` already issues a non-streaming Messages call with the correct browser-direct header, has `getKey()`/`getModel()` (reads `bb_chat_model`), a 50-entry `appendLog()`, and a fence-tolerant `extractJSON()`. Settings already has a masked key field with a Show toggle. The recipes view already has a working "Generate with AI" path. Phase 7 **extends** these — it does not rebuild them. The net-new surface is: streaming + a rich cached-context builder + a `requestJSON()` structured-output helper in `claude-api.js`; a 5th State data file (`drafts`); three new views (`chat`, `classroom`, `library`); a JSON→MD context derivation; and AI hooks wired into five existing views.

The single highest-leverage architectural decision is the **shared chokepoint**: `claude-api.js` is the only place the browser-direct header, the call log, and prompt-caching live (CHAT-02 / AI-09 / D-05). The second is the **data-write safety gate** — every AI payload destined for GitHub (AI-03 draft, AI-08 import, AI-10 repair) must pass `schema validation → diff preview → explicit confirm` before any `writeJSON`. This is the project's #1 critical failure mode (silent data corruption) and should be built **once** as a reusable module and reused by all three writers.

Sequencing is naturally layered: **foundations first** (claude-api.js streaming + context builder + `requestJSON` + write-gate + drafts State wiring + JSON→MD derivation + Settings SET-05/AI-09), because every feature depends on them. Then the two chat surfaces, then Classroom+Library, then the AI-enhanced data features, then AI-assisted import/repair. Validation splits cleanly: deterministic dimensions (schema validity, inventory fidelity, parse success, write-gate presence) run as `node:test` exactly like Phase 6; subjective dimensions (streaming UX, voice, balance/technique, lesson Q&A) are user UAT. **No live Anthropic calls in CI** — BYOK key never lives in CI.

**Primary recommendation:** Build a Wave-0/Wave-1 "AI foundations" plan (claude-api.js extension + drafts State + write-gate + MD derivation + Settings) that everything else consumes, then layer chat → views → AI-features → import as parallelizable plans. Build the reusable write-gate and the `node:test` fixtures *with* the foundations, not after.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Anthropic calls (stream + one-shot), header, log, caching | `claude-api.js` (API client module) | — | Single chokepoint for CHAT-02 header, AI-09 log, D-05 caching, key hygiene |
| Rich context assembly (D-04) + JSON→MD derivation (D-06) | `claude-api.js` (or a sibling `context-builder.js`) | `State` (reads `_data`), `recommender-engine` (mood/profile normalize) | Context is derived from in-memory State; the builder is API-adjacent |
| Chat persistence (`bb_chat_history`) + summarization (D-07) | `chat.js` view + `localStorage` | `claude-api.js` (summarize call) | UI-owned thread state; survives reload; not GitHub unless user saves |
| 5th data file (`drafts`) load/save/normalize | `State` + `Normalize` + `GitHubAPI` | `schema/drafts.schema.json` | Mirrors the existing 4-file pattern exactly |
| Data-write safety gate (schema → diff → confirm) | New reusable module (e.g. `write-gate.js`) | `Normalize`, `schema/*.json`, `GitHubAPI.writeJSON` | Shared by AI-03/AI-08/AI-10; client-side fail-closed |
| Routing for `#chat` / `#classroom` / `#library` | `app.js` router + `index.html` nav | view modules | Same switch + nav pattern as all existing views |
| Classroom static content | `app/js/data/classroom-content.js` (static JS) | `classroom.js` view | Loads without a key (config-via-JS pattern, like `config.js`) |
| AI entry points (REC-04, AI-04, AI-05, AI-12) | existing views (recommender/recipes/inventory/dashboard/wizard) | shared quick-ask drawer | Views own their buttons; drawer is the shared surface (D-01) |
| Ingredient derivation fallback (AI-13) | `recommender-engine.js` (static map) | `claude-api.js` (fallback) + cache | Static map stays authoritative; Claude only fills gaps |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Native `fetch` + `ReadableStream` + `TextDecoder` | Browser built-in | Streaming SSE from Anthropic | Zero-dependency; CLAUDE.md forbids npm/build `[VERIFIED: CLAUDE.md]` |
| `AbortController` | Browser built-in | Cancel in-flight stream on nav (CHAT-06) | Native; tied to view `cleanup()` |
| Anthropic Messages API | `anthropic-version: 2023-06-01` | All AI calls | Pre-locked by AI-SPEC §2 `[CITED: 07-AI-SPEC.md]` |
| `node:test` + `node:assert/strict` | Node built-in | Deterministic validation | Phase 5/6 precedent `[VERIFIED: tests/*.test.js]` |

**No new runtime dependencies.** `JSZip` (CDN) already present for export/import (index.html:77) and is reused by AI-08 if MD files arrive in a ZIP.

### Supporting (existing modules to reuse — do not recreate)
| Module | Reuse For |
|--------|-----------|
| `ClaudeAPI` (claude-api.js) | Extend: `streamMessage`, `requestJSON`, `callMessages`, context builder, cache. Keep `generateRecipe` working. |
| `State` (state.js) | Add `drafts` as 5th file; reuse `loadAll`/`save`/`patch`/`set`/`subscribe`/`_normalize` |
| `GitHubAPI` (github-api.js) | `readJSON`/`writeJSON` (base64+SHA) for drafts, conversation save, AI-08/AI-10 writes; `getFileSHA` for conflict retry |
| `Normalize` (normalize.js) | `byKey()` dispatch; add a `drafts` normalizer; coerce AI payloads before validate/write |
| `RecommenderEngine` | `normalizeProfile()` for mood/profile context; `DERIVATIONS` map for AI-13 |
| `Utils.escapeHtml` | Mandatory on ALL model + user output before `innerHTML` |
| Phase 6 universal recipe JSON + `_source` tagging | Drafts + promotion reuse directly |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@anthropic-ai/sdk` | direct `fetch` | SDK needs npm+bundler — violates no-build ethos; user declined (AI-SPEC §2) |
| Messages API `output_config.format` (JSON schema) | prompt-and-validate `requestJSON()` | App's own `schema/*.json` + `Normalize` stays authoritative; simpler for zero-dep `[CITED: 07-AI-SPEC.md §4b]` |
| Per-message GitHub commit for chat | localStorage + manual save | Avoids commit churn (D-03) |

**Installation:** None — zero-dependency, no build. New files are added as `<script>` tags in `index.html` in dependency order (after `claude-api.js`, before `app.js`).

**Version verification (Anthropic model IDs, re-verified this session):** `claude-opus-4-7`, `claude-sonnet-4-6`, `claude-haiku-4-5` are all valid current IDs; on the Anthropic API the bare aliases resolve correctly (Haiku's pinned snapshot is `claude-haiku-4-5-20251001`). The 4.6 generation uses dateless canonical IDs (not evergreen pointers). `[VERIFIED: web search of platform.claude.com models docs, 2026-05-21]` The existing `DEFAULT_MODEL = 'claude-sonnet-4-5-20250929'` (claude-api.js:11) is **stale** → update to `claude-sonnet-4-6`.

---

## Architecture Patterns

### System Architecture Diagram

```
                     ┌──────────────────────────── USER ────────────────────────────┐
                     │  #chat page    quick-ask drawer    Settings    existing views │
                     │  (persisted)   (ephemeral, D-01)   (key/model/log)  (buttons) │
                     └───────┬────────────┬───────────────────┬───────────────┬──────┘
                             │            │                    │               │
        bb_chat_history ◄────┘            │            bb_chat_model      seeded prompt
        (localStorage,D-03)               │            bb_api_log         (REC-04/AI-04/05/12)
                             │            │                    │               │
                             ▼            ▼                    ▼               ▼
                     ┌────────────────────────────────────────────────────────────────┐
                     │                       claude-api.js (CHOKEPOINT)                 │
                     │  buildContext() ──► system blocks (cached, cache_control, D-05)  │
                     │       ▲            ┌──────────────┬──────────────────────────┐   │
                     │   JSON→MD (D-06)   │ streamMessage│ requestJSON (one-shot)   │   │
                     │       ▲            │ (SSE, abort) │ parse→Normalize→validate │   │
                     │   State._data      └──────┬───────┴───────────┬──────────────┘   │
                     │   (5 files inc.           │ tokens            │ JSON payload     │
                     │    drafts)         appendLog(bb_api_log,no key)│                  │
                     └───────────────────────────┼────────────────── ┼─────────────────┘
                                                  │                    │
                                  fetch ──────────┘                    ▼
                              api.anthropic.com           ┌────────────────────────┐
                              (browser-direct header)     │  write-gate.js (NEW)   │
                                                          │  schema-validate ─► diff│
                                                          │  preview ─► CONFIRM     │
                                                          └──────────┬─────────────┘
                                                                     │ (only if confirmed)
                                                          State.set/patch + State.save
                                                                     │
                                                          GitHubAPI.writeJSON (base64+SHA)
                                                                     ▼
                                                       data/{drafts,recipes,inventory,…}.json
```

**Trace the primary use case (chat turn):** user types → view calls `ClaudeAPI.streamMessage({system:[cachedContext], messages:[summary, …recentTurns, userMsg]}, {onText, signal})` → tokens render live → `usage` logged → transcript persisted to `bb_chat_history`. **Trace a write (AI-03 draft):** `requestJSON(schemaKey:'drafts')` → Normalize+validate → write-gate diff+confirm → `State.save('drafts')` → `writeJSON`.

### Recommended Project Structure
```
app/js/
├── claude-api.js              # EXTEND: streamMessage, requestJSON, callMessages, buildContext, cache, log hardening
├── context-builder.js         # OPTIONAL NEW: D-04 assembly + D-06 JSON→MD (or fold into claude-api.js — discretion)
├── write-gate.js              # NEW: reusable schema→diff→confirm→write (AI-03/08/10)
├── views/
│   ├── chat.js                # NEW: #chat (persisted) + the shared quick-ask drawer (ephemeral)
│   ├── classroom.js           # NEW: #classroom (static + lesson Q&A)
│   └── library.js             # NEW: #library
└── data/
    └── classroom-content.js   # NEW: static lessons (loads without key)
schema/drafts.schema.json       # NEW
data/drafts.json                # NEW (5th State file; seed {} / {drafts:[]})
tests/phase-07-ai.test.js       # NEW: deterministic node:test (schema-shape, inventory-fidelity, parse, gate)
```

### Pattern 1: Extend ClaudeAPI without breaking `generateRecipe`
**What:** Add `callMessages` (non-streaming primitive), `streamMessage` (SSE), `requestJSON` (structured), `buildContext`; keep `generateRecipe` as a thin caller. Export the new functions from the IIFE return.
**When:** Wave 0/1 foundation.
**Example:**
```javascript
// Source: 07-AI-SPEC.md §3 (streamMessage) — reuse the existing header block (claude-api.js:87–93)
async function streamMessage(body, { onText, signal }) {
  const resp = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type':'application/json', 'x-api-key': getKey(),
               'anthropic-version': API_VERSION,
               'anthropic-dangerous-direct-browser-access':'true' },
    body: JSON.stringify({ ...body, stream: true }),
    signal,
  });
  if (resp.status === 429) throw new Error(`Rate limited — retry after ${resp.headers.get('retry-after')||'?'}s.`);
  if (!resp.ok) throw new Error(`Anthropic ${resp.status}: ${await resp.text()}`);
  const reader = resp.body.getReader(); const decoder = new TextDecoder();
  let buffer = '', usage = null;
  for (;;) {
    const { value, done } = await reader.read(); if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n'); buffer = lines.pop();        // keep partial line
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim(); if (!data) continue;
      const evt = JSON.parse(data);
      if (evt.type === 'content_block_delta' && evt.delta.type === 'text_delta') onText(evt.delta.text);
      else if (evt.type === 'message_delta') usage = evt.usage;     // → appendLog (AI-09), no key
      else if (evt.type === 'error') throw new Error(evt.error?.message || 'stream error'); // CHAT-08
    }
  }
  appendLog({ type:'chat', model: body.model, usage });             // AI-09 — never the key
  return usage;
}
```

### Pattern 2: Cached context block (D-04/D-05)
**What:** `system` is an array of text blocks; the big derived-markdown context is the last block and carries `cache_control:{type:"ephemeral"}`. The volatile user question stays in `messages` (never in the cached block — busts the cache).
**Example:**
```javascript
// Source: 07-AI-SPEC.md §3/§4. buildContext() reads State._data and derives MD (D-06).
function buildContext() {  // returns array of system blocks
  const md = deriveContextMarkdown();    // persona+profile+mood+originals+drafts+made(times_made)+inventory/vetoes
  return [
    { type:'text', text: BASE_PERSONA_INSTRUCTION },
    { type:'text', text: md, cache_control: { type:'ephemeral' } },   // cache breakpoint (D-05)
  ];
}
```
> Caching only engages above the model minimum (Opus/Haiku ~4096, Sonnet ~2048 input tokens) `[CITED: 07-AI-SPEC.md §3 pitfall 3]`. The rich D-04 context clears this. Watch `usage.cache_read_input_tokens` to confirm hits.

### Pattern 3: Reusable write-gate (AI-03 / AI-08 / AI-10)
**What:** One module: `gate(schemaKey, oldData, newPayload, onConfirm)` → coerce via `Normalize.byKey` → validate against `schema/<key>.schema.json` → if invalid, surface error & **never offer write**; if valid, render an old-vs-new diff and require an explicit confirm before `State.set/patch` + `State.save`.
**When:** every AI→GitHub write. **Why one module:** AI-SPEC's #1 failure mode is silent corruption; three separate gates = three places to get it wrong.

### Pattern 4: 5th State file (drafts) — exact plug points
```javascript
// state.js — register drafts following the existing 4-file pattern (state.js:4–9)
const FILES = { barkeeper:'data/barkeeper.json', profile:'data/bar-owner-profile.json',
                inventory:'data/inventory.json', recipes:'data/recipes.json',
                drafts:'data/drafts.json' };               // ADD
// _data / _shas comments updated to include drafts; loadAll() iterates FILES so it
// picks up drafts automatically; save('drafts') works unchanged; _normalize('drafts',…)
// dispatches to a new Normalize.drafts (add to normalize.js byKey).
```
- **Normalize.drafts:** ensure `{ drafts: [ {…universal recipe…, _source:'ai-generated', draft_id, created_at, updated_at, source_prompt } ], last_updated }`; drop unknown keys; idempotent (mirror `Normalize.recipes`).
- **`data/drafts.json` seed:** `{ "drafts": [], "last_updated": "2026-05-21" }` — must exist in the repo or `loadAll` 404s (app.js:55 surfaces a "could not find data files" error if any FILES entry is missing). **This is a Runtime State item — see inventory below.**
- **Promote-to-Original:** read draft, re-tag `_source:'originals'`, assign `id: 'cocktail'+Date.now()` (matches recipes.js:1014 convention), push into `recipes.originals`, remove from `drafts`, then `State.save('recipes')` **then** `State.save('drafts')` sequentially (avoid 409 — STATE Phase 2 sequential-save decision).

### Anti-Patterns to Avoid
- **Interpolating the question/timestamp into the cached `system` block** — busts the prompt cache every turn (D-05 / AI-SPEC §3 pitfall 5/6). Keep volatile content in `messages`.
- **Auto-retry loop on 429** — cost on the user's key; surface `retry-after` only (CHAT-09).
- **Writing an AI payload without the gate** — every AI write goes through schema→diff→confirm. No exceptions.
- **Logging the key** — `appendLog` records type/model/usage only; never `x-api-key` (FM #4).
- **Rebuilding `generateRecipe`/the Settings key field/the appendLog** — they exist; extend.
- **Per-card inline AI panels** — D-01 says all entry points open the *shared* drawer, not bespoke panels.
- **Skipping `Utils.escapeHtml` on streamed model text** before `innerHTML` — XSS via model output.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SSE parsing | naive `JSON.parse` per chunk | buffered line-split keeping the trailing partial (AI-SPEC §3) | `data:` objects span `read()` chunks — naive parse throws intermittently |
| Base64 + SHA conflict-safe writes | new write logic | `GitHubAPI.writeJSON` + `State.save` 409-retry | already battle-tested (state.js:71–99, BUG-03) |
| Schema coercion of AI payloads | ad-hoc field checks | `Normalize.byKey` + a `node:test` shape validator | one canonical place; idempotent; reused by recommender |
| Mood/profile float extraction | re-deriving axis floats | `RecommenderEngine.normalizeProfile()` | already maps `flavor_profile.axes[*].position`→0–1 |
| Recipe identity for promote/dedup | string compare | `Utils.sameRecipe(a,b)` (name+base, case-insensitive) | Phase 6 D-08 precedent, tested |
| Ingredient derivation | a parallel LLM-only map | existing `DERIVATIONS` static map + Claude *fallback* only | static is free/instant; Claude fills gaps, cached (AI-13) |
| Recipe rendering everywhere | a drafts-specific chip | universal recipe JSON + existing chip render | drafts conform → render as chips anywhere (D-11) |

**Key insight:** Almost every "hard" piece already has a home in this codebase. The genuinely net-new logic is small: SSE streaming, the context-MD derivation, the write-gate, and the three view shells.

---

## Runtime State Inventory

> This phase adds a new data file and several localStorage keys — runtime state that a code-only audit misses.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| **Stored data (GitHub)** | `data/drafts.json` does not yet exist in the repo; `State.loadAll()` iterates `FILES` and will 404 on a missing file (app.js:50–64 surfaces a hard "could not find data files" error). | **Create + commit `data/drafts.json`** seed (`{"drafts":[],"last_updated":"…"}`) as part of the foundation plan, before drafts is registered in `FILES`. Also add `schema/drafts.schema.json`. |
| **Live service config** | None — no external service config (no n8n/Datadog/etc.); the only external endpoint is `api.anthropic.com`, called per-request with a localStorage key. | None — verified by reading the full app/js tree; the app talks only to GitHub + Anthropic. |
| **OS-registered state** | None — browser SPA, no OS-level registrations, no scheduler, no daemon. | None — verified (static SPA, no backend). |
| **Secrets / env vars (localStorage keys)** | NEW: `bb_chat_history` (chat persistence, D-03), `bb_chat_model` (SET-05; already read by getModel), `bb_api_log` (AI-09; already written by appendLog). EXISTING: `bb_anthropic_key` (AI-01), `bb_token`/`bb_owner`/`bb_repo`/`bb_branch` (GitHub). AI-13 cache + Library storage (if localStorage) add more keys — see Open Questions. | **No GitHub commit** for these — browser-only. **Invariant:** `bb_anthropic_key` is sent only to `api.anthropic.com` and never written to `bb_api_log` or committed (FM #4). "Reset all data" in settings.js should also clear the new `bb_*` keys for completeness. |
| **Build artifacts / installed packages** | None — no build, no npm, no compiled output. New JS files only need `<script>` tags in `index.html` in dependency order (after `claude-api.js`, before `app.js`). | Add `<script>` tags for `chat.js`, `classroom.js`, `library.js`, `classroom-content.js`, `write-gate.js`, (optional) `context-builder.js`. |

**The canonical question — after every file is updated, what runtime state still holds the old shape?** Two things: (1) an existing repo with only 4 data files will 404 until `drafts.json` is committed; (2) `localStorage.bb_api_log` from the existing non-streaming path uses a looser entry shape (logs `prompt`/`system` text, claude-api.js:83) — AI-09's hardened shape (timestamp/type/model/usage, no full prompt, never the key) should supersede it, and any code reading old log entries must tolerate the old shape.

---

## Common Pitfalls

### Pitfall 1: drafts.json missing in existing repos
**What goes wrong:** Registering `drafts` in `FILES` before the file exists in the user's repo makes `State.loadAll()` throw "Not Found", blocking the whole app (app.js:55).
**Why:** `loadAll` `Promise.all`s every `FILES` entry; one 404 rejects all.
**How to avoid:** Commit `data/drafts.json` to the template repo AND make `loadAll` tolerant of a missing 5th file (treat 404 on `drafts` as empty `{drafts:[]}` rather than fatal). Recommend the tolerant-load approach so existing user repos don't break on upgrade.
**Warning signs:** "Could not find data files" error after upgrade.

### Pitfall 2: Cache silently never engages
**What goes wrong:** `cache_read_input_tokens` stays 0; rich context costs full price every turn.
**Why:** context below the model minimum, or a volatile value (timestamp/question) interpolated into the cached block.
**How to avoid:** keep the question in `messages`; put `cache_control` on the last *stable* block; surface `cache_read_input_tokens` in the AI-09 log so a low hit-rate is visible (AI-SPEC §7).
**Warning signs:** AI-09 log shows `cache_creation` repeating and `cache_read` near 0.

### Pitfall 3: Streamed model text injected as HTML
**What goes wrong:** model output containing `<` / `>` / markdown breaks layout or injects markup.
**How to avoid:** append tokens as text nodes or `escapeHtml` before `innerHTML`; if rendering markdown, escape first then format a safe subset.
**Warning signs:** broken transcript layout on certain responses.

### Pitfall 4: 409 SHA conflicts on multi-file writes (promote, import)
**What goes wrong:** promoting a draft writes both `recipes` and `drafts`; concurrent/parallel saves hit GitHub 409.
**Why:** GitHub Contents API requires the current SHA.
**How to avoid:** sequential `await State.save(...)` (STATE Phase 2 decision); rely on the existing 409-refetch-retry (state.js:80–95).

### Pitfall 5: Drawer abort leaking into the persisted thread
**What goes wrong:** aborting the ephemeral drawer mid-stream corrupts or wipes `bb_chat_history`.
**Why:** shared streaming code, shared transcript handling.
**How to avoid:** keep drawer state purely in-memory; only `#chat` persists; `cleanup()` abort must not touch `bb_chat_history` (D-08).

### Pitfall 6: AI-11/AI-13 calling Claude on every entry (cost)
**What goes wrong:** regex/static-map fallback fires Claude on inputs the deterministic path already handles → surprise spend.
**How to avoid:** AI-11 calls Claude only when `parseBottleEntry` confidence is low (e.g. type fell back to raw name / REVIEW bucket); AI-13 calls only on a derivation miss in `DERIVATIONS`, and **caches** the result (localStorage) so repeats are free.

---

## Code Examples

### Structured generation with fail-closed (AI-03/08/10/11/13)
```javascript
// Source: 07-AI-SPEC.md §4b — parse → Normalize → validate → ONE retry → fail closed.
async function requestJSON({ system, userPrompt, schemaKey, model, maxTokens }) {
  const ask = (extra='') => callMessages({ model, max_tokens: maxTokens,
    system: [{ type:'text', text: system + '\nRespond with a SINGLE JSON object and nothing else.' }],
    messages: [{ role:'user', content: userPrompt + extra }] });
  let raw = await ask();
  for (let attempt = 0; attempt < 2; attempt++) {
    let obj = null;
    try { obj = JSON.parse(extractJSON(raw)); } catch {}          // reuse existing fence-tolerant extractJSON
    if (obj) {
      const norm = Normalize.byKey(schemaKey, obj);
      const errors = validateAgainstSchema(schemaKey, norm);      // NEW shape validator over schema/*.json
      if (!errors.length) return norm;
      if (attempt === 0) { raw = await ask(`\nYour previous output was invalid: ${errors.join('; ')}. Return corrected JSON only.`); continue; }
      throw new Error('Structured output failed validation: ' + errors.join('; ')); // caller must NOT write
    }
    if (attempt === 0) { raw = await ask('\nThat was not valid JSON. Return one JSON object only.'); continue; }
    throw new Error('Unparseable JSON from model.');
  }
}
```

### Seeding the shared quick-ask drawer (D-01 / REC-04 / AI-04 / AI-05 / AI-12)
```javascript
// Each entry point builds a contextual prompt and opens the SAME ephemeral drawer.
// Example REC-04 on a recipe card:
ChatView.openDrawer({ seed: `Tell me about the ${recipe.name}. Would it suit my taste, and what variations would you suggest given my bar?` });
// AI-05 on Inventory/Dashboard:
ChatView.openDrawer({ seed: `Given my current inventory and vetoes, what single bottle should I add next, and why?` });
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `DEFAULT_MODEL = claude-sonnet-4-5-20250929` | `claude-sonnet-4-6` (dateless canonical) | 4.6 generation | Update claude-api.js:11; dateless IDs are pinned snapshots, not evergreen `[VERIFIED]` |
| Non-streaming generate only | streaming chat + structured one-shot | Phase 7 | Two call shapes in one client |
| 4 State data files | 5 (adds `drafts`) | Phase 7 | `loadAll` tolerant of missing 5th file |
| CHAT-04 token-target context | rich cached context (D-04/D-05) | Phase 7 CONTEXT | caching makes richness affordable |
| CHAT-07 ephemeral 10-turn window | persisted history + summarization (D-03/D-07) | Phase 7 CONTEXT | survives reload; manual GitHub checkpoint |

**Deprecated/outdated:**
- Dated Sonnet 4.5 ID in `claude-api.js` — replace with `claude-sonnet-4-6`.
- Do **not** append date suffixes to 4.6/4.7 IDs in new code (use bare canonical IDs) `[CITED: 07-AI-SPEC.md §4]`.
- Do **not** send `temperature`/`top_p`/`top_k`/`thinking`/`effort` — rejected on some tiers; keep one cross-model request shape `[CITED: 07-AI-SPEC.md §4]`.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Making `State.loadAll` tolerant of a missing `drafts.json` (vs. committing the file only) is the safer upgrade path for existing user repos | Pitfall 1 / Runtime State | If wrong, planner can instead just require the seed file; low risk either way |
| A2 | Library links should persist as a **new `data/library.json`** (consistent with the JSON-file storage model) rather than localStorage | Open Questions | If localStorage chosen instead, no GitHub durability/cross-device; affects whether a 6th schema/file is needed |
| A3 | AI-13 derivation cache and AI-11 fallback live in `localStorage` (session/persistent) keyed by input string | Pitfall 6 | If a different cache scope is wanted, minor rework |
| A4 | The write-gate is best as a standalone `write-gate.js` reused by 3 callers (vs. inline per feature) | Pattern 3 | If inlined, higher duplication/corruption risk but functionally equivalent |
| A5 | Prompt-cache token minimums (Opus/Haiku ~4096, Sonnet ~2048) per AI-SPEC are current | Pattern 2 / Pitfall 2 | Docs were 403 this session; values are AI-SPEC-cited, not re-verified — confirm at platform.claude.com before relying on exact numbers |

**Note:** Anthropic docs pages (model overview, prompt-caching) returned HTTP 403 to WebFetch this session; model IDs were re-verified via web search (HIGH), but exact cache-minimum token counts remain `[CITED: 07-AI-SPEC.md]` only.

---

## Open Questions

1. **Library storage location (LIB-01).**
   - Known: Library = user-curated external links; "distinct from Classroom"; CRUD with diff/save patterns available.
   - Unclear: a new `data/library.json` (durable, cross-device, consistent with the 4/5-file model, needs a schema + State registration) vs. `localStorage` (simpler, no schema, not durable).
   - Recommendation: **`data/library.json` as a 6th State file** for durability and to reuse the write path; small schema (`{links:[{url,title,description,tags[]}], last_updated}`). If the planner wants to minimize State surface this phase, localStorage is acceptable for v1.

2. **MD derivation: minimal helper now vs. pull Phase 8 `md-converter.js` forward (D-06).**
   - Known: agent context needs derived MD (`inventory.md`/`bar-owner-profile.md` style); Phase 8 owns the strict round-trippable export.
   - Recommendation: **build a minimal, lossy-OK `deriveContextMarkdown()` now** (context only; readability over round-trip fidelity). Keep it small and clearly labeled "context derivation, not the Phase 8 export contract" so Phase 8 can supersede without rework.

3. **Conversation summarization model + threshold (D-07).**
   - Recommendation: summarize older turns with **Haiku** (cheap) when the thread exceeds N recent turns (N is discretion; suggest N≈6–10). One extra call, result cached in `bb_chat_history` as the running summary.

4. **AI-09 entry-shape migration.** The existing `appendLog` logs full `prompt`/`system` text (claude-api.js:83). Recommend the AI-09 panel render the hardened shape (ts/type/model/usage) and treat older verbose entries gracefully.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js (`node:test`) | Deterministic validation | ✓ (assumed dev machine) | built-in | — |
| `python3 -m http.server` | Serving app for UAT | ✓ (CLAUDE.md documents it) | — | any static server |
| Anthropic API + user key | All AI runtime features | runtime/BYOK | API `2023-06-01` | features show "No API key" (CHAT-03); Classroom static still loads |
| GitHub Contents API + PAT | Drafts/library/conversation writes | runtime | `2022-11-28` | existing app already requires it |
| Browser `fetch`/`ReadableStream`/`AbortController`/`TextDecoder` | Streaming | ✓ all evergreen browsers | native | — |

**Missing dependencies with no fallback:** None for build/test. At runtime, AI features require the user's key (by design — BYOK).
**No live Anthropic calls in CI** — the key never lives in CI; deterministic tests run over recorded fixtures only.

---

## Validation Architecture

> `workflow.nyquist_validation: true` in `.planning/config.json` — section included. Mirrors the Phase 6 `node:test` + UAT split (06-VALIDATION.md).

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in `node:test` + `node:assert/strict` (no install) |
| Config file | none — IIFE modules loaded via `vm.runInThisContext` with stubbed browser globals (`window`/`localStorage`/`document`), exactly as `tests/phase-06-engine.test.js` |
| Quick run command | `node tests/phase-07-ai.test.js` |
| Full suite command | `for f in tests/*.test.js; do node "$f" || exit 1; done` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| AI-03/AI-08/AI-10 | Generated/parsed/repaired payload validates against `schema/*.json` (renders as chip; required fields present) | unit (Code) | `node tests/phase-07-ai.test.js` → "schema-shape: drafts/recipes/inventory/profile fixtures validate" | ❌ Wave 0 |
| AI-03/AI-08/AI-10 | **Write-safety gate exists** — write path requires validate + confirm; invalid payload never offered for write | unit (Code, structural) | → "write-gate: invalid payload throws / valid payload requires confirm" | ❌ Wave 0 |
| AI-03/AI-04/AI-05 | **Inventory fidelity** — generated drink's ingredients are set-members of inventory tokens (or flagged subs); vetoes honored | unit (Code) | → "inventory-fidelity: phantom ingredient flagged against fixture inventory" (reuse engine token logic) | ❌ Wave 0 |
| AI-03/08/10/11/13 | **Structured-output parse** — `extractJSON`/`requestJSON` parses fenced+clean JSON; fails closed on garbage | unit (Code) | → "requestJSON parses fixtures; throws on unparseable; one-retry contract" | ❌ Wave 0 |
| D-11 | Drafts normalizer is idempotent + tags `_source:'ai-generated'`; promotion re-tags `'originals'` + `cocktail<ts>` id | unit (Code) | → "Normalize.drafts idempotent; promote re-tags + assigns id" | ❌ Wave 0 |
| SET-05 | `getModel()` returns `bb_chat_model` override else `claude-sonnet-4-6` | unit (Code) | → "getModel honors override; default is sonnet-4-6" | ❌ Wave 0 |
| AI-09 | `appendLog` caps at 50 and never includes the key | unit (Code) | → "appendLog caps at 50; no x-api-key field present" | ❌ Wave 0 |
| CHAT-05/06/08/09 | Streaming UX, abort-on-nav, mid-stream error render, 429 retry-after | manual (UAT) | — (DOM/network; no live calls in CI) | UAT |
| AI-02/CHAT-01/03 | Chat surfaces render; no-key affordance links to Settings | manual (UAT) | — | UAT |
| AI-06/AI-07 | Classroom loads without key; lesson-scoped Q&A with key | manual (UAT) | — | UAT |
| LIB-01 | Library CRUD + Ask-Bjorn | manual (UAT) | — | UAT |
| Subjective | Balance/technique, persona/voice, personalization, responsible-consumption | LLM-judge (calibrated on AI-SPEC §1b gold) + Human UAT | — | UAT |

### Sampling Rate
- **Per task commit:** `node tests/phase-07-ai.test.js`
- **Per wave merge:** full suite (`tests/*.test.js`) — must stay green (includes Phase 5/6 regression tests)
- **Phase gate:** full suite green + `07-UAT.md` passed before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/phase-07-ai.test.js` — schema-shape, inventory-fidelity, parse-success, write-gate-structural, drafts-normalize, getModel, appendLog-cap (covers all **Code** rows above)
- [ ] Recorded **fixtures**: a fixture `inventory.json`, a valid + an invalid generated-recipe payload, a malformed-JSON blob (AI-10), a legacy-MD blob (AI-08), an ambiguous paste-a-line entry (AI-11). Built **during** implementation alongside each feature (AI-SPEC §5).
- [ ] `schema/drafts.schema.json` (+ a lightweight `validateAgainstSchema` shape validator, since the app has no JSON-Schema runtime)
- [ ] `07-TEST-CHECKLIST.md` + `07-UAT.md` (~15–20 reference prompts incl. AI-SPEC §5 adversarial cases: empty inventory, veto'd spirit, allergen, off-template ratio, overproof, fabricated provenance)
- [ ] Framework install: none required

---

## Security Domain

> `security_enforcement` not set to false → included. This is a single-user BYOK hobby app (AI-SPEC §1b: no binding regulatory regime; soft editorial guardrails only).

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | partial | BYOK Anthropic key + GitHub PAT in localStorage; no app-level auth (single-user) |
| V3 Session Management | no | no server sessions |
| V4 Access Control | no | single-user, own repo |
| V5 Input Validation | **yes** | `Normalize.byKey` + `schema/*.json` validation on every AI payload before write (FM #1/#2) |
| V6 Cryptography | no | never hand-roll; no crypto introduced; keys are bearer tokens in localStorage by design |
| V7 Error Handling/Logging | **yes** | AI-09 log must never record the key (FM #4); mid-stream errors surfaced not swallowed (CHAT-08) |
| V10 Malicious Code / Output | **yes** | `Utils.escapeHtml` on all model + user output before `innerHTML` (XSS via streamed model text) |
| V13 API/Web Service | **yes** | key sent only to `api.anthropic.com` with the browser-direct header; never to GitHub, never to logs |

### Known Threat Patterns for {browser BYOK + LLM + GitHub writes}
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Silent data corruption (unvalidated AI write) | Tampering | schema-validate → diff → explicit confirm before any `writeJSON` (write-gate) |
| XSS via streamed/model HTML | Tampering/Elevation | escape model + user text before `innerHTML` |
| Key exfiltration (logged/committed/wrong host) | Info Disclosure | key only in `x-api-key` to anthropic.com; never in `bb_api_log`/GitHub; masked in UI |
| Phantom-ingredient / veto'd output | Spoofing (of "buildable") | inventory-fidelity check vs. loaded inventory tokens + veto list (FM #3) |
| Runaway cost / retry storm | DoS (of user's wallet) | `max_tokens` cap, AbortController on nav, no auto-retry on 429, prompt caching |
| Prompt injection via imported MD / pasted lines | Tampering | output still passes schema + diff + confirm; treat parsed content as untrusted until validated |

---

## Sources

### Primary (HIGH confidence)
- **Codebase (direct read):** `claude-api.js`, `state.js`, `app.js`, `github-api.js`, `normalize.js`, `recommender-engine.js`, `recipes.js`, `settings.js`, `inventory.js`, `dashboard.js`, `bartender-wizard.js`, `schema/recipes.schema.json`, `index.html`, `tests/phase-05-normalize.test.js`, `tests/phase-06-engine.test.js`, `06-VALIDATION.md`.
- **07-AI-SPEC.md** — framework decision, §3 streaming/caching reference, §4/§4b implementation + `requestJSON`, §5 eval, §6 guardrails, §7 monitoring.
- **07-CONTEXT.md** — locked decisions D-01..D-15.
- **Anthropic model IDs** — web search of platform.claude.com models docs (confirmed `claude-opus-4-7`/`claude-sonnet-4-6`/`claude-haiku-4-5`, dateless canonical IDs) `[VERIFIED 2026-05-21]`.

### Secondary (MEDIUM confidence)
- `.planning/STATE.md`, `.planning/REQUIREMENTS.md`, `.planning/config.json` — phase scope, sequential-save and provenance decisions.

### Tertiary (LOW confidence)
- Prompt-cache exact token minimums — AI-SPEC-cited only; Anthropic docs returned 403 to WebFetch this session (flag A5).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified by codebase read + model-ID re-verification; AI-SPEC pre-locks the API.
- Architecture/integration: HIGH — exact plug points (FILES, handleGenerate, settings sections, router, nav, DERIVATIONS) read directly.
- Pitfalls: HIGH — derived from the actual loadAll/save/append code paths and AI-SPEC failure modes.
- Cache token minimums: MEDIUM — cited, not re-verified (docs 403).

**Research date:** 2026-05-21
**Valid until:** ~2026-06-20 (30 days; Anthropic model IDs move faster — re-confirm IDs at code time).
