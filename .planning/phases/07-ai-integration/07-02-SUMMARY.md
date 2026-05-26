---
phase: 07-ai-integration
plan: 02
subsystem: settings-ai-surface
tags: [settings, ai, model-selector, call-log, ai-01, set-05, ai-09]
dependency-graph:
  requires:
    - "Phase 07-01 foundation (ClaudeAPI.getModel(), bb_api_log appendLog hardened entry shape {ts,type,model,usage}, bb_anthropic_key + AI-01 Reveal already shipped in #sect-ai-key)"
  provides:
    - "SET-05: three-tier model selector (Haiku/Sonnet/Opus) in #sect-ai-key writing localStorage.bb_chat_model"
    - "AI-09: call-log panel rendering bb_api_log (newest-first, escaped, key/prompt/system NEVER read) with Copy-raw-JSON + Clear-log actions"
    - "Reset all data now sweeps bb_chat_model + bb_api_log (T-07-10)"
  affects:
    - "app/js/views/settings.js — the only file modified by this plan"
    - "ClaudeAPI.getModel() consumers (downstream plans): the model returned now reflects user selection from the SET-05 selector"
tech-stack:
  added: []
  patterns:
    - "Voice-preset <select> map pattern (settings.js:94-100) copied for the model selector"
    - "Status-line convention (#st-*-status with min-height + var(--green)/var(--red)/var(--text-muted))"
    - "Defensive JSON.parse(try/catch -> []) + Utils.escapeHtml on every interpolated value before innerHTML"
key-files:
  created: []
  modified:
    - "app/js/views/settings.js — +119 lines: CHAT_MODELS const, currentChatModel(), model <select> markup + handler, AI-09 log panel markup + renderAiLog() + copy/clear handlers, Reset-confirm extension"
decisions:
  - "Reset-all-data uses targeted removeItem('bb_chat_model') + removeItem('bb_api_log') rather than a blanket bb_* sweep, because the existing Reset UX explicitly preserves GitHub credentials; this is consistent and surgical."
  - "currentChatModel() applies the L-2 polish defensively: any stored bb_chat_model value not in the three-tuple allow-list is cleared and the default returned. Catches stale date-suffixed aliases from before Phase 7."
  - "Clipboard write guarded for navigator.clipboard absence (older browsers / non-secure contexts) — graceful toast fallback."
metrics:
  duration: "single-session, <10 min wall clock"
  completed: "2026-05-26"
  tasks: 2
  commits: 2
  files_changed: 1
  lines_added: ~119
---

# Phase 7 Plan 02: AI Settings UI (SET-05 + AI-09 + AI-01 Reveal confirm) Summary

One-liner: Added the three-tier model selector that writes `bb_chat_model` (consumed by `ClaudeAPI.getModel()`) and the safe call-log panel that renders `bb_api_log` without ever touching key/prompt/system fields, both inside the existing `#sect-ai-key` section; Reset-all-data now sweeps the two new keys.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | SET-05 model selector in `#sect-ai-key` | `2f20b8d` | `app/js/views/settings.js` |
| 2 | AI-09 call-log panel + Reset sweep + AI-01 Reveal confirm | `52241fd` | `app/js/views/settings.js` |

## What Shipped

### SET-05 — Model Selector (Task 1, commit 2f20b8d)
- New `CHAT_MODELS` constant pairs three bare model aliases with user-facing labels: `claude-haiku-4-5` → "Haiku (fast/cheap)", `claude-sonnet-4-6` → "Sonnet (recommended)", `claude-opus-4-7` → "Opus (max quality)".
- `currentChatModel()` reads `localStorage.bb_chat_model`, validates it against the allow-list, clears stale/unknown values, and returns the validated value or the default `claude-sonnet-4-6`.
- `<select id="st-chat-model">` rendered via the voice-preset `.map` pattern; pre-selects the current value; helper text references D-12.
- `change` handler writes `bb_chat_model`, sets `'Model saved ✓'` status, toasts.

### AI-09 — Call Log Panel (Task 2, commit 52241fd)
- "AI Call Log" sub-section with `<div id="st-ai-log">` container and `Copy raw JSON` / `Clear log` buttons.
- `renderAiLog(panel)`:
  - Defensively parses `bb_api_log` (try/catch → `[]`, Array.isArray guard).
  - Empty state: italic "No API calls logged yet." paragraph.
  - Non-empty: newest-first rows showing escaped timestamp, type, model, and usage string `"in N / out N / cache_read N / cache_create N"`.
  - Reads ONLY `entry.ts`, `entry.type`, `entry.model`, `entry.usage.{input_tokens,output_tokens,cache_read_input_tokens,cache_creation_input_tokens}` — never `key`/`prompt`/`system`.
  - Every interpolated value wrapped in `Utils.escapeHtml` before innerHTML (T-07-08 / Security V10 / Pitfall 3).
- Copy handler: `navigator.clipboard.writeText(bb_api_log || '[]')` with availability guard and error toast fallback.
- Clear handler: `removeItem('bb_api_log')` + re-render to empty state + toast.

### AI-01 Reveal Confirmed (Task 2)
- `#st-ai-key-toggle` handler at settings.js Show/Hide toggle is present and untouched (3 grep hits across markup, status line region, and handler).

### Reset Sweep Extension (Task 2)
- Reset-confirm handler now calls `localStorage.removeItem('bb_chat_model')` and `localStorage.removeItem('bb_api_log')` after the data-file resets succeed.
- GitHub creds (`bb_token`/`bb_owner`/`bb_repo`/`bb_branch`) and `bb_anthropic_key` are intentionally preserved — consistent with the existing UX message "Your GitHub credentials are preserved."

## Verification Gates (all green)

```
node --check app/js/views/settings.js           # exit 0
grep -c "st-chat-model"     settings.js  = 5    # ≥3 required
grep -c "bb_chat_model"     settings.js  = 3    # ≥1 required
grep -c "claude-haiku-4-5"  settings.js  = 1    # ≥1 required
grep -c "claude-opus-4-7"   settings.js  = 1    # ≥1 required
grep -c "claude-sonnet-4-5-20250929"     = 0    # 0 required (no stale ID)
grep -c "bb_api_log"        settings.js  = 4    # ≥3 required
grep -c "st-ai-log"         settings.js  = 6    # ≥3 required
grep -c "renderAiLog"       settings.js  = 3    # ≥2 required
grep -c "st-ai-key-toggle"  settings.js  = 3    # ≥2 required (AI-01 still present)
grep -nE "\.(key|prompt|system)\b" settings.js = (no matches anywhere)
```

Manual confirmation in `renderAiLog`:
- Field reads: `entry.ts`, `entry.type`, `entry.model`, `entry.usage.input_tokens`, `entry.usage.output_tokens`, `entry.usage.cache_read_input_tokens`, `entry.usage.cache_creation_input_tokens` — exactly the 07-01 appendLog hardened shape; nothing else.
- All four interpolations (timestamp, type, model, usage string) wrapped in `Utils.escapeHtml`.

## Threat Model Status

| Threat ID | Mitigation Applied |
|-----------|--------------------|
| T-07-07 (info disclosure, AI-09 render/copy) | renderAiLog reads only ts/type/model/usage; copy emits the same key-free `bb_api_log` array stored by appendLog; FM #4 honored. |
| T-07-08 (XSS via innerHTML in renderAiLog)   | Every interpolated value wrapped in `Utils.escapeHtml` (timestamp via `new Date(...).toLocaleString()` then escaped; type, model, usageStr all escaped). |
| T-07-09 (bb_chat_model tampering) — accepted | Selector constrained to three hardcoded option values; `currentChatModel()` also defends on read by clearing unknown values. |
| T-07-10 (Reset retains AI metadata)          | Reset-confirm handler explicitly removes both `bb_chat_model` and `bb_api_log` before transitioning to dashboard. |

## Deviations from Plan

None — plan executed as written. One small inline polish (not a deviation):
- Reset sweep was implemented as targeted `removeItem` calls rather than a `bb_*` prefix scan, because the existing Reset UX explicitly preserves GitHub credentials. This choice is documented in `decisions:` above. The plan permitted either approach ("if it uses an explicit list … add `bb_chat_model` and `bb_api_log` to it"); the current handler used neither, so I extended it with two targeted calls in keeping with the existing "preserve creds" UX.

## Auth / Checkpoint Gates

None — both tasks were fully autonomous, no auth gates, no checkpoints.

## Known Stubs

None — the model selector is wired to a real localStorage write consumed by `ClaudeAPI.getModel()`, and the call-log panel reads the real `bb_api_log` written by 07-01's `appendLog()`. No empty-array dead constants flowing to UI.

## File Inventory

| File | Change | Lines |
|------|--------|-------|
| `app/js/views/settings.js` | modified (commit 2f20b8d) | +41 (CHAT_MODELS, currentChatModel, model `<select>` markup + change handler) |
| `app/js/views/settings.js` | modified (commit 52241fd) | +78 (AI-09 panel markup, renderAiLog, copy/clear handlers, Reset sweep extension) |

Total: 1 file, +119 lines, 2 commits.

## Self-Check: PASSED

- `app/js/views/settings.js` exists (488 lines after this plan): FOUND
- Commit `2f20b8d` (Task 1): FOUND in `git log --oneline`
- Commit `52241fd` (Task 2): FOUND in `git log --oneline`
- Summary file `.planning/phases/07-ai-integration/07-02-SUMMARY.md`: being written now
