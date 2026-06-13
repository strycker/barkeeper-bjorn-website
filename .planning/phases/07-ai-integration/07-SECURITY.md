---
phase: 7
slug: ai-integration
audited_at: 2026-06-13
asvs_level: 1
block_on: high
threats_total: 33
threats_closed: 33
threats_open: 0
threats_accepted: 3
threats_open_high: 0
status: verified
---

# Phase 7 — AI Integration Security

Per-phase security contract: threat register, accepted risks, audit trail. Phase shipped (18/18 UAT pass, UI Review 18/24, LEARNINGS extracted). This audit is the security gate.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| browser → api.anthropic.com | BYOK key in `x-api-key`; untrusted model output streams back | BYOK key (out), recipe/parse/chat payloads (in) |
| AI output → State/GitHub | parsed/generated payloads cross into the user's repo | structured JSON drafts/recipes/inventory/profile |
| localStorage → app | `bb_anthropic_key`, `bb_chat_model`, `bb_api_log`, `bb_chat_history`, `bb_parse_cache`, `bb_derivation_cache` | secrets + audit log + caches |
| user input → DOM (library/import) | user-entered URLs/MD become HTML | href/title/description/tags |
| model output → DOM | streamed tokens + previews render into transcripts/cards | untrusted text |

---

## Threat Register

### Plan 07-01 — AI Foundation (claude-api.js / write-gate.js)

| Threat ID | Category | Disposition | Status | Evidence |
|-----------|----------|-------------|--------|----------|
| T-07-01 | Info Disclosure (log) | mitigate | CLOSED | `app/js/claude-api.js:74-90` appendLog explicitly allowlists ts/type/model/usage/status/message and drops key/prompt/system/raw/content/text |
| T-07-02 | Info Disclosure (headers) | mitigate | CLOSED | `app/js/claude-api.js:101-108` `_headers()` sends `x-api-key` only to ENDPOINT (api.anthropic.com) with `anthropic-dangerous-direct-browser-access:true`; used by callMessages (:131), streamMessage (:164), generateRecipe (:468) |
| T-07-03 | Tampering (silent corruption) | mitigate | CLOSED | `app/js/claude-api.js:222-274` requestJSON: parse→Normalize.byKey→WriteGate.validate→ONE retry→throw; `app/js/write-gate.js:198-260` gate refuses to call onConfirm when errors present |
| T-07-04 | DoS (wallet, 429 storm) | mitigate | CLOSED | `app/js/claude-api.js:169-175` streamMessage surfaces `retry-after` and throws — no auto-retry loop; max_tokens cap on every body (`requestJSON` :224, `callMessages` callers, `generateRecipe` :458) |
| T-07-05 | Tampering (cached context) | accept | CLOSED | Read-only derivation of user's own data; no external input mixed (see `deriveContextMarkdown` :281-435); accepted-risks log entry below |
| T-07-06 | Spoofing (buildable) | mitigate | CLOSED | `app/js/write-gate.js:277-300` `inventoryFidelity(recipe, tokens, vetoes)` returns {phantoms, vetoed}; consumed in `app/js/views/recipes.js:367-368` |

### Plan 07-02 — Settings UI (settings.js)

| Threat ID | Category | Disposition | Status | Evidence |
|-----------|----------|-------------|--------|----------|
| T-07-07 | Info Disclosure (log render/copy) | mitigate | CLOSED | `app/js/views/settings.js:386-420` renderAiLog reads only ts/type/model/usage; `:426` Copy emits raw `bb_api_log` array which is already key-free by T-07-01 hardening |
| T-07-08 | Tampering (XSS, log innerHTML) | mitigate | CLOSED | `app/js/views/settings.js:414-416` all four interpolations (tsStr, type, model, usageStr) wrapped in `Utils.escapeHtml` |
| T-07-09 | Tampering (bb_chat_model) | accept | CLOSED | Selector constrained to three hardcoded option values (`:201`); accepted-risks log entry below |
| T-07-10 | Info Disclosure (Reset retains AI metadata) | mitigate | CLOSED | `app/js/views/settings.js:724-727` Reset clears bb_chat_history, bb_api_log, bb_parse_cache, bb_derivation_cache. Post-UAT design: bb_chat_model preserved as UI preference (documented at :713-722); user data + caches still swept |

### Plan 07-03 — Chat surfaces (chat.js)

| Threat ID | Category | Disposition | Status | Evidence |
|-----------|----------|-------------|--------|----------|
| T-07-11 | Tampering (XSS, streamed tokens) | mitigate | CLOSED | `app/js/views/chat.js:95` persisted content via `Utils.escapeHtml`; `:138, :341` streamed tokens appended as `document.createTextNode(t)` |
| T-07-12 | DoS (abandoned stream) | mitigate | CLOSED | `app/js/views/chat.js:115` page AbortController; `:307` drawer abort on close; `:388-393` cleanup() abort; 429 surfaced via T-07-04 |
| T-07-13 | Info Disclosure (bb_chat_history) | accept | CLOSED | Transcript is user's own data in user's own browser; key never part of a turn; accepted-risks log entry below |
| T-07-14 | Tampering (drawer touching persisted thread) | mitigate | CLOSED | `app/js/views/chat.js:265-384` openDrawer uses in-memory `const turns = []` (:299); no `bb_chat_history` reference within the function body |
| T-07-15 | Spoofing (no-key bypass) | mitigate | CLOSED | `app/js/views/chat.js:21-26` `_noKey()` + `_noKeyHtml()` with `#settings` link; checked in render (:194) and openDrawer (:269) |
| T-07-16 | DoS (per-turn context size) | mitigate | CLOSED | `buildContext()` cached block (claude-api.js :441-446) + `_buildMessages` summary+recent windowing in chat.js; max_tokens cap |

### Plan 07-04 — Classroom / Library (classroom.js, library.js)

| Threat ID | Category | Disposition | Status | Evidence |
|-----------|----------|-------------|--------|----------|
| T-07-17 | Tampering (XSS via library href/title/tags) | mitigate | CLOSED | `app/js/views/library.js:31-34` `_safeHref` allows only `^https?://`; `:74-75` unsafe schemes render as escaped `<span>` not `<a>`; titles/desc/tags wrapped in `Utils.escapeHtml` (:62-65, :81) |
| T-07-18 | Tampering (XSS, classroom lesson body) | mitigate | CLOSED | `app/js/views/classroom.js:54-55` `Utils.escapeHtml` on lesson title + body before innerHTML |
| T-07-19 | Tampering (library write payload) | mitigate | CLOSED | `app/js/normalize.js:552-564` `library()` coerces fields + drops unknown keys; writes via `State.save('library')` |
| T-07-20 | Spoofing (no-key bypass Ask-Bjorn) | mitigate | CLOSED | `app/js/views/classroom.js:27` + `app/js/views/library.js:37` `_noKey()` check before openDrawer; openDrawer self-gates too (T-07-15) |
| T-07-21 | DoS (loadAll on missing library.json) | mitigate | CLOSED | `app/js/state.js:18` `TOLERANT_FILES = Set(['drafts','library'])`; `:60-69` 404 resolves to empty stub; `data/library.json` committed seed present |

### Plan 07-05 — AI woven into views (recipes.js, recommender.js, etc.)

| Threat ID | Category | Disposition | Status | Evidence |
|-----------|----------|-------------|--------|----------|
| T-07-22 | Tampering (AI-03 draft/promote write) | mitigate | CLOSED | `app/js/views/recipes.js:288` requestJSON; `:377-388` WriteGate.gate around State.save('recipes'); `:616` promote requestJSON; requestJSON fails closed (T-07-03) |
| T-07-23 | Spoofing (buildable, generated recipes) | mitigate | CLOSED | `app/js/views/recipes.js:367-368` `WriteGate.inventoryFidelity(draftEntry, tokens, vetoArr)`; phantoms/vetoed surfaced in diff preview |
| T-07-24 | Tampering (XSS, draft preview/refine) | mitigate | CLOSED | `app/js/views/recipes.js:453, 458-464, 561` `Utils.escapeHtml` on every draft field (name, tagline, method, glassware, garnish, why_it_works, source_prompt) |
| T-07-25 | DoS (cost, repeated generate) | mitigate | CLOSED | requestJSON enforces max_tokens (claude-api.js :224 default 1024); ONE-retry only; no auto-retry beyond it |
| T-07-26 | Tampering (promote 409 / partial write) | mitigate | CLOSED | Sequential `State.save('recipes')` then `State.save('drafts')`; `app/js/state.js:156, :195, :218` `_isShaConflict` refetch-retry; `Utils.sameRecipe` duplicate flag (recommender.js confirmed) |
| T-07-27 | Tampering (wizard AI-12 auto-write) | mitigate | CLOSED | Wizard fills `#bw-personality.value` only; existing user-edit + State.patch save path preserved (no direct AI→GitHub write) |

### Plan 07-06 — AI data ops (settings.js import/repair, inventory.js AI-11)

| Threat ID | Category | Disposition | Status | Evidence |
|-----------|----------|-------------|--------|----------|
| T-07-28 | Tampering (AI-08/AI-10 write) | mitigate | CLOSED | `app/js/views/settings.js:469-498` repairSection wraps `WriteGate.gate` → onConfirm State.save; `:525-633` importLegacy validates each section via `WriteGate.validate` (:591), gate on confirm (:611-619); invalid sections never written (:597-606) |
| T-07-29 | Tampering (prompt injection from imported MD) | mitigate | CLOSED | Imported content parsed → Normalize → schema-validated → diff-confirmed; injected instructions cannot bypass schema gate (every write inside WriteGate.gate onConfirm) |
| T-07-30 | Tampering (XSS, import diff / parse chip preview) | mitigate | CLOSED | `app/js/views/settings.js:563, 598-602, 515` `Utils.escapeHtml` on every model-output interpolation in repair/import previews |
| T-07-31 | DoS (cost, AI-11/AI-08) | mitigate | CLOSED | `app/js/views/inventory.js:149` bb_parse_cache read; `:215` write; `:154` getKey gate; `:167` Haiku model; AI-08 makes ONE call per import (not per-section loop) |
| T-07-32 | Info Disclosure (bb_parse_cache) | accept | CLOSED | Cache holds parsed bottle objects keyed by user input only; no key cached or logged; accepted-risks log entry below |
| T-07-33 | Tampering (AI-11 auto-write) | mitigate | CLOSED | `app/js/views/inventory.js:143-220` aiParseBottle stages a reviewable chip; no State.save inside aiParseBottle (search-confirmed only used downstream after user review) |

### Additional Verified Mitigations (cross-cutting)

| Item | Evidence |
|------|----------|
| AI-13 deriveWithAI key-gated/cached/fail-soft | `app/js/recommender-engine.js:122` DERIV_CACHE_KEY; `:137` key gate; `:142` callMessages; `:312` exported alongside existing exports (synchronous Phase-5 path preserved) |
| v2 pool migration persisted | `data/recipes.json:2` `_schema_version:2`, `:161` `_reclassified_v2_2:true` (idempotency flag confirms migration ran and is not re-running) |
| Recipe-chip defense in depth | `app/js/recipe-chip.js` `_esc`, `resolveCore`, `_seedById` bare-const lookup present (status badge keyed off seed_id) |

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-07-01 | T-07-05 | `deriveContextMarkdown` reads only the user's own State data; no external untrusted input is mixed into the cached system block. Lossy-OK derivation, not the round-trippable export contract. | gsd-security-auditor | 2026-06-13 |
| AR-07-02 | T-07-09 | `bb_chat_model` selector is constrained to three hardcoded option values. An out-of-band value can only cause Anthropic to 400 the call (surfaced via existing error handling) — no data-integrity impact. | gsd-security-auditor | 2026-06-13 |
| AR-07-03 | T-07-13 | `bb_chat_history` is the user's own conversation in the user's own browser. The API key is never part of a turn (carried in `x-api-key` header only). Reset sweep (T-07-10) clears it on hand-off. | gsd-security-auditor | 2026-06-13 |
| AR-07-04 | T-07-32 | `bb_parse_cache` holds only parsed bottle objects keyed by the user's own input strings. No API key or sensitive metadata cached. | gsd-security-auditor | 2026-06-13 |

---

## Unregistered Flags

None. All six SUMMARY files explicitly state no new threat surfaces beyond those captured in each plan's `<threat_model>` block. Plan 07-05 SUMMARY notes that `deriveWithAI` is currently a callable opt-in helper not wired into the synchronous recommender path — this is per-spec (H-1 / D-14 "additive opt-in helper") and preserves Phase-5 behavior byte-identically when no caller invokes it.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-06-13 | 33 | 33 | 0 | gsd-security-auditor (Claude opus-4-7) |

Notable post-UAT divergence (T-07-10): The plan called for Reset to clear bb_chat_model and bb_api_log along with other bb_* keys. UAT feedback re-classified `bb_chat_model` as a UI preference (preserve across reset, like dark-mode) and surfaced that `bb_chat_history` (user data) was previously NOT cleared — a real gap. Current implementation (`settings.js:713-727`) clears the user-data + cache surfaces (bb_chat_history, bb_api_log, bb_parse_cache, bb_derivation_cache) and preserves bb_chat_model + bb_anthropic_key + GitHub creds. The mitigation intent (no AI metadata persists for a handoff) is satisfied; a documented UX choice deliberately preserves the model preference.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `threats_open_high: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-06-13
