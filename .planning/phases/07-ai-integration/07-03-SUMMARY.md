---
phase: 07-ai-integration
plan: 03
subsystem: ai
tags: [chat, streaming, sse, persisted-history, ephemeral-drawer, abort-controller, byok, anthropic]

# Dependency graph
requires:
  - phase: 07-ai-integration / plan 01
    provides: ClaudeAPI.streamMessage (SSE), ClaudeAPI.callMessages, ClaudeAPI.buildContext (cached system blocks per D-04/D-05), ClaudeAPI.getKey/getModel
  - phase: 07-ai-integration / plan 02
    provides: bb_chat_model Settings selector (Haiku/Sonnet/Opus) + AI-09 call-log panel
provides:
  - "ChatView IIFE module (render/openDrawer/cleanup) — persisted #chat page + ephemeral shared quick-ask drawer"
  - "#chat route in app.js router + cleanup-on-leave hook (CHAT-06)"
  - "Top-nav Chat link and views/chat.js script tag (after claude-api.js, before app.js)"
  - "Conversation windowing + Haiku summarization of older turns (D-07)"
  - "Manual Save conversation to GitHub (D-03) writing data/conversations/chat-<ts>-<rand>.json"
  - "Chat page + drawer CSS (reuses .confirm-dialog-overlay for the drawer)"
affects: [07-04 Classroom Q&A, 07-05 REC-04/AI-04/AI-05 (all reuse ChatView.openDrawer for shared quick-ask), 07-06 dashboard un-disable of the Chat with Bjorn card]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Two-surface conversational pattern: persisted page (bb_chat_history) + ephemeral drawer (in-memory only) sharing one _send code path"
    - "Lifecycle-bound AbortController per turn; router calls leaving view's cleanup() before next render"
    - "Streamed-token rendering via createTextNode (no innerHTML on untrusted model output)"
    - "Cheap one-shot summarization over older turns to bound context size"

key-files:
  created:
    - "app/js/views/chat.js (ChatView IIFE — page + drawer + streaming + persistence + summarization + GitHub save)"
  modified:
    - "app/js/app.js (router case 'chat' + cleanup-on-leave)"
    - "app/index.html (#chat nav link + views/chat.js script tag)"
    - "app/css/app.css (.chat-page, .chat-transcript, .chat-bubble--*, .chat-composer, .chat-nokey, .chat-drawer)"

key-decisions:
  - "Render streamed tokens as text nodes (not innerHTML) — closes T-07-11 XSS at the streaming boundary cleanly"
  - "Drawer holds turns in a function-local array; openDrawer body has zero references to bb_chat_history — confirmed by grep"
  - "Add 4-char random suffix to data/conversations/chat-<ts>.json paths (L-4 polish) so two same-ms saves cannot collide"
  - "Summarization is a one-shot Haiku call after persist (page only — drawer never summarizes); failures are non-fatal (older turns simply remain in window)"
  - "Cleanup-on-leave is gated on _currentRoute === 'chat' so non-chat views are not penalized by a try/catch they don't need"

patterns-established:
  - "View cleanup() contract: router calls leaving view's cleanup() before next render (new with this plan — first instance)"
  - "Per-turn AbortController stored in module scope for page, function scope for drawer overlay; abort on cleanup/close"
  - "_send shared signature ({text, turns, summary, transcriptEl, persist, history}) so page and drawer share one streaming code path"

requirements-completed: [AI-02, CHAT-01, CHAT-03, CHAT-04, CHAT-06, CHAT-07]

# Metrics
duration: ~30min
completed: 2026-05-26
---

# Phase 7 Plan 07-03: Chat (Page + Drawer) Summary

**Persisted #chat page + ephemeral shared quick-ask drawer, both streaming via the 07-01 SSE primitive with the cached bar context, CHAT-03 no-key gate, AbortController on lifecycle, manual GitHub save, and one-shot Haiku summarization of older turns.**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-05-26T20:40:00Z (approx — plan-execution start)
- **Completed:** 2026-05-26T21:12:00Z
- **Tasks:** 2 auto + 1 checkpoint (auto-approved)
- **Files modified:** 4 (1 created, 3 edited)

## Accomplishments

- New `app/js/views/chat.js` IIFE exposing `render(container)`, `openDrawer({seed})`, and `cleanup()` — the shared streaming surface every downstream AI entry point (07-04 Classroom Q&A, 07-05 REC-04/AI-04/AI-05) will seed.
- Persisted `#chat` page resumes the prior conversation from `localStorage.bb_chat_history` on every load (D-03); "Clear conversation" and "Save conversation to GitHub" are the only user-visible write actions.
- Ephemeral drawer holds its turns in a function-local array — `grep` confirms `openDrawer` has zero references to `bb_chat_history` (T-07-14 closed).
- Both surfaces gate cleanly when `ClaudeAPI.getKey() === ''`, rendering a Settings link instead of making any network call (CHAT-03 / T-07-15).
- Streaming uses `ClaudeAPI.streamMessage(body, { onText, signal })` with `system = ClaudeAPI.buildContext()` — cached persona + derived bar context already attached by 07-01 (D-04/D-05). Per-turn `AbortController.signal` is `.abort()`-ed by `cleanup()` (router leave) and by drawer close (CHAT-06 / T-07-12).
- Pitfall 3 mitigation: every streamed token is appended via `document.createTextNode`; every persisted/displayed user message and error string passes through `Utils.escapeHtml` before any `innerHTML` assignment (T-07-11 closed).
- Windowing (D-07): `_buildMessages(turns, summary)` sends an optional summary prefix + the last 8 turns verbatim; `_maybeSummarize(history)` calls Haiku (`claude-haiku-4-5`, `max_tokens: 512`) after persist when total turns exceed 12, condensing the older slice into `history.summary`.
- 429 / SSE-error / network errors render as a `.chat-bubble--error` bubble + toast — no auto-retry loop (CHAT-09 / T-07-12).
- Router cleanup-on-leave is now wired: leaving `#chat` for any other route triggers `ChatView.cleanup()` before the next view renders — first view in the codebase with this lifecycle contract.

## Task Commits

1. **Task 1: ChatView core (persisted page + ephemeral drawer + streaming + gate + windowing + summarization + save handler)** — `026439d` (feat)
2. **Task 2: Router #chat case + cleanup-on-leave + nav link + script tag + chat/drawer CSS** — `46d5d76` (feat)
3. **Task 3 (checkpoint:human-verify):** Auto-approved per yolo mode; live-key UAT deferred to `/gsd-verify-work`.

**Plan metadata commit:** orchestrator-owned (not authored here).

## Files Created/Modified

- `app/js/views/chat.js` — created. ChatView IIFE: `render(container)` for the persisted page, `openDrawer({seed})` for the ephemeral overlay, `cleanup()` for router-driven stream abort. Includes `_buildMessages` (windowing), `_maybeSummarize` (Haiku one-shot), `_saveToGitHub` (manual D-03 write), and the shared `_send` path used by both surfaces.
- `app/js/app.js` — modified. Added `case 'chat': ChatView.render(content); break;` and a cleanup-on-leave block that runs BEFORE the switch when `_currentRoute === 'chat'` and the new route differs.
- `app/index.html` — modified. Added `<a href="#chat" data-route="chat">` nav link between Recommend and Shopping; added `<script src="js/views/chat.js"></script>` after `js/claude-api.js` (line 107) and before `js/app.js` (line 112).
- `app/css/app.css` — modified. Appended `.chat-page`, `.chat-header`, `.chat-actions`, `.chat-transcript` (+ `--drawer` variant), `.chat-bubble--{user,bot,error}`, `.chat-composer`, `.chat-nokey`, `.chat-drawer`, and a `@media (max-width: 640px)` block. Uses existing `:root` custom properties; drawer reuses `.confirm-dialog-overlay`.

## Decisions Made

- **Drawer scope confirmation via grep, not just convention.** `awk` over `openDrawer` body confirms zero `bb_chat_history` references — Pitfall 5 is mechanically verifiable, not just code-review trust.
- **Cleanup contract introduced now, not later.** Plans 07-04 and 07-05 will need this same hook; the router gains a generic leave-then-cleanup pattern (currently `#chat`-specific) so the next plan can extend it trivially.
- **Drawer never summarizes.** Even with a long seeded interaction, the drawer is ephemeral by contract; summarization is page-only so the user's `bb_chat_history` is the only thing growing a `summary` field.
- **Summarization failures are non-fatal.** A failed Haiku call simply means older turns stay in the verbatim window for now; another turn later will retry. No user-visible error — this is a background optimization.
- **Save path uses random suffix.** `data/conversations/chat-<ts>-<rand>.json` (L-4 polish) — two same-ms saves cannot collide and GitHub's "file already exists" 422 is avoided by construction rather than by retry.

## Deviations from Plan

None — plan executed as written. The plan already specified the L-4 random-suffix polish and the windowing constants; this executor honored them.

## Issues Encountered

None — all acceptance grep gates passed on first try, `node --check` clean on both modified JS files, and all 37 deterministic tests stayed green.

## Self-Check: PASSED

Verified:
- `app/js/views/chat.js` exists (created, 396 LOC at commit 026439d).
- `app/js/app.js`, `app/index.html`, `app/css/app.css` modified (commit 46d5d76).
- Commit `026439d` present in git log; commit `46d5d76` present in git log.
- Acceptance gates (Task 1 + Task 2 grep counts) all returned ≥ required counts.
- `node --check` passed on `chat.js` and `app.js`.
- Full deterministic test suite (4 test files, 37 assertions) all PASS.

## User Setup Required

None — Chat works once the user adds their Anthropic API key in Settings (the same key already used by the recipe-generation surface). No new environment variables, no additional services.

## Next Phase Readiness

- `ChatView.openDrawer({seed})` is the shared entry point that 07-04 (Classroom Q&A) and 07-05 (REC-04 "Why this drink?" / AI-04 / AI-05 explanation buttons) will reuse — they just seed a prompt and the streaming/abort/gate logic is already paid for.
- The Dashboard "Chat with Bjorn" disabled card (dashboard.js:128–152) remains disabled in this plan by design; un-disabling it is a 07-05 trivial follow-up (one-line `data-coming-soon` removal + `href="#chat"`).
- Router cleanup-on-leave is in place for any future view that needs lifecycle teardown — the pattern is generic, currently only invoked for `#chat`.
- Live-key UAT (Task 3 human-verify checkpoint) was auto-approved per yolo mode and deferred to `/gsd-verify-work` — UAT covers streaming UX, voice/context fidelity, abort-on-nav, persistence resume, summarization round, manual save commit, and clear action.

---
*Phase: 07-ai-integration*
*Completed: 2026-05-26*
