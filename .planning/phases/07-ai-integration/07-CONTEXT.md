# Phase 7: AI Integration - Context

**Gathered:** 2026-05-21
**Status:** Ready for AI-SPEC + planning
**Source:** Synthesized from 07-DISCUSSION-LOG.md (committed) + ROADMAP Phase 7

<domain>
## Phase Boundary

Connect the web UI to the Claude API (bring-your-own Anthropic key) to unlock natural-language
chat with the barkeeper, AI cocktail design, AI-powered recommendations, inventory advice, the
Classroom tutorial view, and the Library link collection — all browser-side, no backend. Also
upgrade Phase 5's rule-based features (paste-a-line parser, ingredient derivation) with Claude
fallbacks.

Core mental model (locked): **The agent behaves like the user's original markdown-agent
barkeeper — a knowledgeable bartender assistant with full context of the bar, the owner's
tastes, and the recipe history — now reachable from inside the web app.**

Two AI conversation surfaces, one shared context:
- **"Chat with <barkeeper>" page (`#chat`)** — a single *persisted* long-running conversation
  that retains context until the user clears it, and resumes when the user returns.
- **Quick-ask drawer** — an *ephemeral* surface; every open starts a clean conversation. All
  "Ask Bjorn about this" / AI-action entry points across the app open this drawer seeded with a
  contextual prompt.

Already present in the codebase (NOT net-new — extend, don't recreate):
- `app/js/claude-api.js` — non-streaming `ClaudeAPI` IIFE used by RecipesView "Generate with AI"
  (has `getKey`, `getModel`, `buildSystemPrompt`, ENDPOINT, API_VERSION). Phase 7 extends it with
  streaming, the rich shared-context builder, prompt caching, and the call log.
- Settings Anthropic API key field (`bb_anthropic_key`, masked) — AI-01 is partially done; this
  phase adds the model selector (SET-05) and the API call log (AI-09) to Settings.
- "Generate with AI" on new recipes in RecipesView — AI-03 is partially done; this phase adds
  draft persistence, the Drafts tab, and conversational refinement.

</domain>

<decisions>
## Implementation Decisions

### D-01: AI entry points open the seeded quick-ask drawer
All "Ask Bjorn about this" and AI-action entry points (REC-04 on every recipe card, plus AI
design/advice entry points on Inventory, Dashboard, Recommender) open the **shared ephemeral
quick-ask drawer**, pre-seeded with a context-specific prompt. They do NOT each render their own
inline panel and do NOT navigate to `#chat`.

### D-02: Two chat surfaces (supersedes single-surface reading)
- **`#chat` "Chat with <barkeeper>" page** — one persisted conversation thread. Holds context
  until the user explicitly clears it; returning to `#chat` resumes the same thread.
- **Quick-ask drawer** — ephemeral; each open starts a clean conversation for a one-off question.
- Both surfaces are fed by the **same shared context builder** (D-04). The barkeeper's name in
  the page/label comes from `barkeeper.json` (e.g. "Chat with Bjorn").

### D-03: Persisted chat history — localStorage + manual save (supersedes CHAT-07)
CHAT-07 ("10-turn in-memory window, not persisted") is **superseded**. The `#chat` thread:
- Persists to `localStorage` (key `bb_chat_history`); survives reloads; resumes on return.
- Is cleared only by an explicit user "Clear conversation" action.
- Offers a manual **"Save conversation to GitHub"** action for durable/cross-device checkpoints
  (no automatic commit-per-message — that would create commit churn).
- The drawer's ephemeral conversation is NOT persisted.

### D-04: Rich shared context builder (expands CHAT-04)
CHAT-04's 1500–2500 token target is **superseded by a richer context**. The context builder
assembles, for both surfaces:
- bartender personality (`barkeeper.json`)
- bar-owner flavor profile (`bar-owner-profile.json`)
- current mood (the mood axis/selection used by the recommender)
- Original recipes (`recipes.originals`)
- AI-generated drafts (`drafts.json`)
- made recipes including tally counts (`recipes.made_log` with `times_made`)
- inventory + vetoes and other helpful stats

Purpose: respond like a real bartender — suggestions, classroom-style teaching, and
mixologist-grade explanations of WHY a cocktail works.

### D-05: Context delivered via prompt caching
The large, stable context block (D-04, rendered as derived markdown — see D-06) is sent with
Anthropic **prompt caching** (`cache_control`) and reused across turns; the cache is refreshed
only when the underlying data changes. This makes rich context affordable. (Aligns with the
project's claude-api skill requirement to use prompt caching.)

Resulting prompt structure per call:
1. **Cached stable block** — persona + profile + mood + originals + drafts + made-log/tallies +
   inventory/stats, as derived markdown.
2. **Running summary** — older conversation turns condensed (see D-07), sent verbatim.
3. **Recent turns** — last N exchanges in full.
4. **Current user message.**

### D-06: Markdown-derived context (not raw JSON)
The agent receives **derived `.md` representations** of the JSON data, not raw JSON, reusing the
canonical human-readable markdown format the agent templates already expect (`inventory.md`,
`bar-owner-profile.md`, etc.). Phase 7 implements a lightweight JSON→MD derivation for context
assembly. This overlaps Phase 8's `md-converter.js`; the planner decides whether to build a
minimal derivation now or pull the relevant part of `md-converter.js` forward (the strict,
round-trippable MD *export* contract remains Phase 8's responsibility).

### D-07: Conversation history windowing — summarize older turns (supersedes CHAT-07 window)
Older turns roll into a running summary (sent verbatim in the prompt); recent turns are sent in
full. Full history is still retained locally for display in the `#chat` transcript. A
summarization step condenses older turns when the thread grows.

### D-08: Streaming + lifecycle + error handling (carried from ROADMAP)
- CHAT-05: responses stream token-by-token via `fetch` + `ReadableStream` + `TextDecoder` SSE
  parsing.
- CHAT-06: an `AbortController` is tied to the view/surface lifecycle; `cleanup()` aborts the
  in-flight stream on navigation (drawer close / leaving `#chat`). The persisted transcript
  (D-03) is unaffected by abort.
- CHAT-08: mid-stream SSE `error` events are caught and rendered as user-readable messages.
- CHAT-09: 429 rate-limit responses surface the `retry-after` value to the user.
- CHAT-03: when no API key is present, chat surfaces show a "No API key" message linking to
  Settings.
- CHAT-02: all Anthropic calls go through `claude-api.js` with the
  `anthropic-dangerous-direct-browser-access: true` header.

### D-09: AI cocktail design — auto-save draft AND keep card open (AI-03)
On generation, the AI recipe is **immediately auto-saved as a draft** (durability — an
interrupted connection must not lose a generated recipe) **and** the chat card stays open for
conversational refinement (e.g. "make it less sweet", "different name for these ingredients",
"generate a new recipe from this prompt").

### D-10: Refinement write-back — hybrid + checkpoint button (AI-03)
- In-place tweaks ("less sweet", "different name") update the **same** draft entry.
- "Generate a new recipe from this" creates a **new** draft entry.
- A **"Save draft copy before refining"** button lets the user fork/checkpoint the current draft
  as a separate save before a new generation overwrites the open one.

### D-11: drafts.json + Drafts tab + promotion (AI-03)
- AI drafts live in a **new `data/drafts.json`** file (5th JSON data file), with a matching
  `schema/drafts.schema.json`.
- A separate **"Drafts" tab** on the Recipes page lists draft chips (keeps the Originals tab
  clean of experiments).
- Each draft chip carries a **"Promote to Original"** action that moves the entry from
  `drafts.json` into `recipes.originals`.
- AI drafts carry `_source: 'ai-generated'`; promotion re-tags to `_source: 'originals'`
  (consistent with Phase 6 D-02 provenance model). Generated recipes conform to the universal
  recipe JSON format so they render as chips everywhere.

### D-12: Settings — model selector + API call log (SET-05, AI-09)
- SET-05: a model selector (Haiku / Sonnet / Opus) stored in `localStorage.bb_chat_model`,
  consumed by `ClaudeAPI.getModel()` (the override hook already exists).
- AI-09: every Anthropic call is recorded in `localStorage.bb_api_log` (50-entry cap); a Settings
  panel shows timestamp / type / model / token usage, with copy-raw-JSON and clear-log actions.
- AI-01: the existing masked key field gets a Reveal toggle if not already present; the key
  unlocks all AI features.

### D-13: Classroom and Library views (AI-06, AI-07, LIB-01)
- **Classroom (`#classroom`)** — static reference content (Techniques, Glassware, Ratios,
  Ingredients) from a new `app/js/data/classroom-content.js`; loads WITHOUT an API key. With a
  key present, it becomes interactive: questions are answered scoped to the current lesson.
- **Library (`#library`)** — user-curated external links (URL, title, description, tags),
  distinct from Classroom. "Ask Bjorn about this" is available with a key.

### D-14: AI-enhanced data features (AI-04, AI-05, AI-08, AI-10, AI-11, AI-12, AI-13)
- AI-04: AI-powered recommendations — Bjorn explains fit and suggests variations for Recommender
  results.
- AI-05: AI inventory advice — "best single bottle to add" with explanation; entry points on
  Inventory + Dashboard.
- AI-08: legacy markdown import — paste/upload old `.md` notes → Claude parses into structured
  JSON (inventory, profile, recipes, barkeeper) → diff preview → confirm write to GitHub.
- AI-10: AI-assisted JSON error correction — on save/import failure, offer to send the broken
  section to Claude; show a diff preview before any write; user confirms.
- AI-11: paste-a-line AI upgrade — the Phase 5 regex parser gains Claude as a fallback for
  ambiguous entries.
- AI-12: Bartender Wizard AI assist — "Help me write this with Claude" drafts long-form persona
  text from short preference inputs.
- AI-13: ingredient derivation AI inference — Claude suggests derivations for ingredients not in
  the Phase 5 static map; results cached to avoid repeat calls.

### D-15: Phase completion
- Full UAT + VALIDATION.md following the Phases 3–6 pattern.
- UAT/verification initiated by the user via GSD commands — no auto-advance (`mode: yolo`,
  `auto_advance: false`).

### Claude's Discretion
- Drawer vs `#chat` visual layout, animation, and exact seeded-prompt wording per entry point.
- `N` for "recent turns sent in full" and the threshold at which summarization kicks in.
- Cache-invalidation trigger granularity (per data-file change vs whole-context hash).
- Drafts tab placement/ordering relative to Originals / Favorites / Wishlist / Made.
- Classroom content depth and lesson taxonomy; Library tag UX.
- Exact API-log entry shape within the 50-entry cap.
- Whether MD derivation is a standalone helper or part of `claude-api.js` context assembly.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context
- `.planning/ROADMAP.md` — Phase 7 requirements: AI-01, SET-05, AI-09, AI-02, CHAT-01..09,
  AI-03, AI-04, REC-04, AI-05, AI-06, AI-07, LIB-01, AI-08, AI-10, AI-11, AI-12, AI-13
- `.planning/STATE.md` — project decisions and phase history
- `.planning/phases/07-ai-integration/07-DISCUSSION-LOG.md` — alternatives considered (audit only)
- `CLAUDE.md` — IIFE module pattern, no build step, vanilla ES6+, GitHub Contents API storage,
  JSON↔Markdown sync model, "Adding a New View" steps

### Existing Implementation Files (extend, don't recreate)
- `app/js/claude-api.js` — `ClaudeAPI` IIFE (non-streaming generate-recipe today; extend for
  streaming, rich context builder, prompt caching, call log)
- `app/js/views/settings.js` — Anthropic key field present; add SET-05 model selector + AI-09 log
- `app/js/views/recipes.js` — universal modal + tabs (Phase 6); add Drafts tab + promotion
- `app/js/views/recommender.js` — add AI-04 explanations + REC-04 entry points
- `app/js/views/inventory.js` — add AI-05 inventory-advice entry point
- `app/js/views/dashboard.js` — add AI-05 entry point + `#chat` access
- `app/js/views/bartender-wizard.js` — add AI-12 "Help me write this with Claude"
- `app/js/state.js` — register `drafts` as a 5th data file in `FILES` / `_data` / `_shas` /
  loadAll / save
- `app/js/github-api.js` — `readJSON()` / `writeJSON()` base64 + SHA write path used for drafts
- `app/js/app.js` — hash router; add `#chat`, `#classroom`, `#library` routes
- `app/index.html` — nav links for new routes
- `app/css/app.css` — single stylesheet; append Phase 7 styles
- `app/js/normalize.js`, `app/js/recommender-engine.js` — referenced for mood/profile context

### New Files (net-new this phase)
- `app/js/views/chat.js`, `app/js/views/classroom.js`, `app/js/views/library.js`
- `app/js/data/classroom-content.js`
- `data/drafts.json`, `schema/drafts.schema.json`

### Prior Phase Patterns
- `.planning/phases/06-recipe-recommender-ux/06-UAT.md` — UAT format to follow
- `.planning/phases/06-recipe-recommender-ux/06-VALIDATION.md` — Validation format to follow
- `.planning/phases/06-recipe-recommender-ux/06-CONTEXT.md` — `_source` provenance model (D-02),
  universal recipe JSON format, dual-write pattern

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ClaudeAPI` in `claude-api.js` — already has `getKey()`, `getModel()` (reads
  `localStorage.bb_chat_model`), `buildSystemPrompt(ctx)`, ENDPOINT, API_VERSION. Extend rather
  than rewrite; streaming + caching + rich context attach here.
- `State` IIFE (`state.js`) — `FILES` map, `_data`/`_shas`, `loadAll()`, subscription model,
  `_normalize()`. Adding `drafts` follows the existing 4-file pattern exactly.
- `GitHubAPI.readJSON()` / `writeJSON()` — base64 + SHA conflict-safe writes; reuse for drafts
  and for "Save conversation to GitHub" (D-03) and AI-08/AI-10 confirmed writes.
- Phase 6 universal recipe JSON format + `_source` tagging + dual-write — AI drafts and
  promotion reuse this directly.
- `Utils.escapeHtml()` — mandatory on all model/user output before innerHTML insertion.

### Established Patterns
- IIFE view modules: `const XView = (() => { ... })()`, single `render(container)` export, no
  globals (CLAUDE.md "Adding a New View").
- View lifecycle `cleanup()` for abort-on-navigation (D-08 / CHAT-06).
- Config-via-JSON (`config.js`) for lookup tables — classroom content is static JS data, not API.

### Integration Points
- Router in `app.js` switch — add `#chat`, `#classroom`, `#library`.
- `claude-api.js` is the single chokepoint for the `anthropic-dangerous-direct-browser-access`
  header (CHAT-02) and the call log (AI-09).
- Mood/profile for context (D-04) come from the same source the recommender reads.

### Known State / Drift Notes
- Code comments and the ROADMAP "Plans" list reference "Phase 5 (CHAT)" / "06-0X" — this is
  phase-number drift; the work belongs to Phase 7. Do not treat as missing work.
- `claude-api.js` `DEFAULT_MODEL` currently pins an older Sonnet ID; SET-05 wiring + AI-SPEC
  should confirm current model IDs (do not hardcode stale IDs in new code).

</code_context>

<specifics>
## Specific Ideas

From the discussion session:
- The agent should answer like the user's original markdown-agent barkeeper — full context of
  bar, tastes, and history — with classroom-style teaching and mixologist explanations of WHY a
  cocktail works.
- Durability drives auto-save: "an interrupted connection must not lose a generated recipe."
- "Returning to 'Chat with <barkeeper>' should resume the longer conversation (persisted
  history)"; the drawer is for quick one-off questions and resets each time.
- "If the data/*.json files are not compatible [as agent context], derive markdown data/*.md
  files from the json files that can be sent to the agent for context."

</specifics>

<deferred>
## Deferred Ideas

- Strict, round-trippable Markdown *export* contract (`md-converter.js`) — Phase 8 (Portability).
  Phase 7 only derives MD for agent context, not for canonical export.
- Cross-device chat sync beyond the manual "Save conversation to GitHub" checkpoint — out of
  scope; full sync would belong to Phase 9 (Backend & Multi-User).
- Server-side key proxying / hiding the Anthropic key — out of scope; BYOK browser-direct is the
  locked model for v1 (no backend).

</deferred>

---

*Phase: 07-ai-integration*
*Context synthesized: 2026-05-21 from 07-DISCUSSION-LOG.md*
