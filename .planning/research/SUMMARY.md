# Research Summary — Barkeeper Bjorn

_Synthesized: 2026-05-11 from STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md_
_Milestone scope: Settings page, Export/Import, Inventory structured fields, Inventory parser, Claude chat panel, Onboarding UX improvements_

---

## Recommended Stack Additions

**Claude API (direct browser fetch, no proxy)**
Use raw `fetch` to `api.anthropic.com` with header `anthropic-dangerous-direct-browser-access: true`. No SDK, no bundler, no Cloudflare Worker needed — Anthropic enabled CORS for BYOK use in August 2024. Store key as `bb_anthropic_key` in localStorage (same pattern as existing GitHub PAT). Default model: `claude-haiku-4-5` for chat (cheapest/fastest); expose `bb_chat_model` override in Settings.

**Streaming: fetch + ReadableStream + TextDecoder**
EventSource cannot POST; use the reader loop pattern. Buffer chunks, split on `\n`, parse complete SSE frames only. Handle `content_block_delta` events for tokens; `message_stop` for completion; `error` events mid-stream (HTTP 200 does not mean success for streaming). Add AbortController tied to view lifecycle.

**Export/Import: Blob + URL.createObjectURL / FileReader**
No library needed. Bundle all 4 data files into one JSON with `export_version` and `exported_at`. Also offer a text/markdown export for AI-context paste-in (unique differentiator — no competitor offers this). Import uses FileReader with validate → diff preview → selective confirmation → sequential writes.

**Inventory migration: additive fields only, normalize on load**
Bottle entries are already objects. New fields (`brand`, `type`, `style`) are optional additions. Check `_schema_version` on load; run migration in-memory before notifying subscribers; write back only if changed. Tier enum extension is UI-only, no data migration needed.

---

## Key Features for This Milestone

**Already shipped (do not regress):**
Inventory match, one-away tab, favorites, shopping list, flavor radar, recommender scoring — these are table stakes and must remain functional through all migration work.

**Must ship this milestone (ranked by user value):**

1. **Settings page** — prerequisite for everything AI-related; unblocks Anthropic key storage, logout, bartender rename
2. **Export/Import (JSON + AI-context text)** — highest immediate value for existing Claude Projects users migrating in; primary backup path
3. **Inventory structured fields + in-place edit** — enables richer AI context; fixes freeform-string matching problem; required before inventory parser
4. **Claude API chat panel ("Ask Bjorn")** — primary differentiator vs. every static cocktail app; inventory-aware system prompt is what makes it better than raw ChatGPT
5. **Onboarding skip/return + open-text inventory paste** — reduces biggest new-user friction; paste-parser depends on structured fields shipping first
6. **Recommender mood sliders + occasion tags** — per-session overlays, no save; re-ranks results in real time; passes mood context to chat system prompt

**Defer to next milestone:**
Image upload, Mixology 101 classroom, recipe add/edit form, Supabase/multi-user.

---

## Architecture Guidance

**Build order (hard dependencies):**
```
Settings page (Phase 1) ──────────────────────→ Claude chat panel (Phase 4)
Export/Import (Phase 2) — independent, parallel
Inventory structured fields (Phase 2) ────────→ Inventory parser (Phase 3) → Onboarding UX (Phase 5)
```
Phases 1, 2 can run in parallel. Phases 3, 4, 5 are gated.

**New files to create:**
- `app/js/claude-api.js` — IIFE wrapping `streamMessage()` and `sendMessage()`; all Anthropic calls go here
- `app/js/views/settings.js` — key entry/masking, model selection, export/import, logout, danger zone
- `app/js/views/chat.js` — streaming chat UI, system prompt injection, conversation window
- `app/js/inventory-parser.js` — standalone IIFE, keyword classifier, ~150 lines

**New localStorage keys:** `bb_anthropic_key`, `bb_chat_model`

**Settings write order:** GitHub write first, localStorage second. If GitHub fails, revert. Never let a localStorage success mask a GitHub failure.

**Chat system prompt strategy:** Inject once at session start — persona (~100t) + flavor profile summary (~150t) + compact inventory (~300–600t) + vetoes (~50t) + task framing (~100t). Never trim vetoes. 10-turn sliding conversation window. Extract to `buildSystemPrompt(barkeeper, profile, inventory)` helper.

**View cleanup convention (new):** Add optional `cleanup()` to view API. Router calls `currentView.cleanup?.()` before rendering next view. Required for aborting in-flight streams on navigation.

**CSP required before Anthropic key ships:** Add `<meta>` Content-Security-Policy to `index.html` restricting `connect-src` to `api.github.com` and `api.anthropic.com`. Hard dependency.

---

## Critical Pitfalls to Encode in Plans

**Inventory migration phase:**
- Fix `recommender-engine.js` to normalize entries (`typeof s === 'string' ? s : s.name`) BEFORE migration ships — zero buildable cocktails is a P0 regression
- Make migration idempotent: check `_schema_version`, skip if already at target
- Run migration synchronously before subscriber notification; suppress saves during migration pass

**Claude API integration phase:**
- `anthropic-dangerous-direct-browser-access: true` header is mandatory — CORS blocks without it
- Mid-stream errors arrive as SSE `error` events inside HTTP 200 — `res.ok` guard is blind; parse every SSE chunk
- AbortController must be stored at module scope; call `abort()` in `cleanup()`; catch `AbortError` silently
- `try/finally` around reader loop: `reader.releaseLock()` in finally

**Export/Import phase:**
- Validate bundle completeness before any write — missing required key = block entirely, never partial-overwrite
- After import completes, call `State.loadAll()` to refresh all SHAs before allowing user saves (stale SHAs → 409)
- Show diff preview and require explicit confirmation before writing

**Settings page phase:**
- Wrap all `localStorage.setItem()` in try/catch — Safari private mode throws `QuotaExceededError`
- Never log API key; mask immediately; offer "Clear API Key" button distinct from logout

**Onboarding UX phase:**
- Move draft state (`_step`, `_answers`) out of `render()` into `sessionStorage` under `bb_onboarding_draft`
- Default required fields on `saveAnswers()` rather than silently writing an incomplete profile (breaks `isNewUser()` permanently)

---

## Open Questions / Risks

- **Model default:** Haiku (stack research) vs. Sonnet (architecture research) as chat default — resolve in Settings phase; expose override
- **Token budget:** 1500–2500 token system prompt estimate is heuristic; test against real inventory and tune
- **Inventory parser edge cases:** Non-English spirits and unusual brands land in REVIEW bucket — confirmation UI with manual section picker is not optional
- **Onboarding slider compatibility:** New slider values must be compatible with existing `bar-owner-profile.json` schema positions ("Strong A" etc.) — verify before shipping
