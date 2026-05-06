---
phase: 01-agent-instructions-polish
plan: 02
subsystem: agent-prompts
tags: [markdown, agent-instructions, session-start, install-guide, mirror-sync, init-prompt]

# Dependency graph
requires:
  - phase: 01-agent-instructions-polish
    provides: "Plan 01-05 onboarding-rules expansion (extended Session-Start Menu Rules block) — 01-02 inserts the always-show-menu bullet at the top of that same block"
provides:
  - "D-03 always-show-menu rule under Session-Start Menu Rules in barkeeper-instructions.md and instructions/onboarding.md (mirrored)"
  - "D-03 named-tasks-only exception (replaces the previously permissive 'honor it directly' bullet)"
  - "D-09 mirror drift fix: instructions/onboarding.md session-start menu now has 8 items (Analytics mode at #7) byte-identical to monolith"
  - "D-04 paste-ready Standard init blocks under INSTALL.md Platform 2 (ChatGPT), Platform 3 (Gemini), Platform 4 (Grok) — verbatim from INIT_PROMPT.md lines 9–17"
affects: [phase-02-web-ui-onboarding, future-agent-prompt-changes, install-guide-updates]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Mirror obligation S2: every change to a Session-Start Menu Rules bullet must land identically in barkeeper-instructions.md AND instructions/onboarding.md"
    - "INSTALL.md per-platform paste-ready fenced blocks indented 3 spaces as a sub-element of the relevant numbered step (matches existing sub-bullet indentation)"

key-files:
  created:
    - ".planning/phases/01-agent-instructions-polish/01-02-SUMMARY.md"
  modified:
    - "barkeeper-instructions.md"
    - "instructions/onboarding.md"
    - "INSTALL.md"

key-decisions:
  - "Inserted the new always-show-menu bullet as the FIRST item in the **Rules:** block to make precedence visually obvious — the rule that fires first appears first."
  - "Reworded the existing 'If the user skips the menu...' bullet rather than deleting it, preserving the 'menu is a convenience, not a gate' intent while narrowing scope to NAMED tasks only."
  - "Used 3-space indentation for the INSTALL.md paste blocks — matches the existing sub-bullet pattern under each step (e.g., the `- inventory.md` lines under step 3) so the fenced block renders as part of its parent step in standard markdown."
  - "Did NOT touch Platform 1 (Claude Projects) or Platform 5 (Local LLMs) — D-04 explicitly scoped to ChatGPT/Gemini/Grok."

patterns-established:
  - "Pattern: Always-show-menu rule placed as the first **Rules:** bullet, with the named-tasks-only exception cross-referencing it explicitly. Future Rules block edits should preserve this precedence ordering."
  - "Pattern: Standard init paste blocks in INSTALL.md follow the form '**Paste this into the [field-name] field:**' followed by a bare triple-backtick fenced block (no language tag, per S5)."

requirements-completed: [AGENT-02, AGENT-05]

# Metrics
duration: ~6 min
completed: 2026-05-06
---

# Phase 01 Plan 02: Session-Start Menu Lockdown and INSTALL Paste Blocks Summary

**Returning-user session-start menu always shows on vague openers (D-03), monolith/module mirror drift fixed at 8 items (D-09), and INSTALL.md ChatGPT/Gemini/Grok sections inline the verbatim Standard init paste block (D-04).**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-05-06T20:04:18Z
- **Completed:** 2026-05-06T20:10:07Z
- **Tasks:** 3
- **Files modified:** 3 (barkeeper-instructions.md, instructions/onboarding.md, INSTALL.md)

## Accomplishments

- D-03 LOCKED in both monolith and module: returning-user menu always shows first, with the "honor it directly" exception narrowed to NAMED tasks only (e.g., "make me something smoky") — never to general greetings ("hi", "let's go").
- D-09 mirror drift closed: `instructions/onboarding.md` session-start menu went from 7 to 8 items (Analytics mode inserted at #7, "Chat about something else" bumped to #8) and is now byte-identical to `barkeeper-instructions.md` for items 1–8.
- D-04 paste-ready blocks added: ChatGPT (Conversation starters), Gemini (opening message), and Grok (system prompt) sections of INSTALL.md each contain the full Standard init text from `INIT_PROMPT.md` lines 9–17, indented under the relevant step. Users no longer need to flip between files.
- AGENT-02 and AGENT-05 both closed by this plan.

## Task Commits

Each task was committed atomically:

1. **Task 1: D-03 always-show-menu rule + named-tasks-only exception (mirror)** — `f009b10` (docs)
2. **Task 2: D-09 mirror drift fix — onboarding.md menu synced to 8 items** — `3545c7c` (docs)
3. **Task 3: D-04 paste-ready Standard init blocks for ChatGPT/Gemini/Grok** — `462fc42` (docs)

## Files Created/Modified

- `barkeeper-instructions.md` — Inserted always-show-menu bullet as first item under Session-Start Menu **Rules:** block; reworded the existing "honor it directly" bullet as the named-tasks-only exception with cross-reference back to the always-show rule.
- `instructions/onboarding.md` — Same two edits as monolith (mirror); plus added `> 7. Analytics mode` to the menu blockquote and renumbered "Chat about something else" to `> 8.`
- `INSTALL.md` — Added a paste-ready fenced "Standard init" block (verbatim from INIT_PROMPT.md lines 9–17) under each of: Platform 2 step 5 (ChatGPT, "Conversation starters"), Platform 3 step 4 (Gemini, "opening message"), Platform 4 step 3 (Grok, "system prompt"). Each block is indented 3 spaces so it renders as a sub-element of its parent step.

## Decisions Made

- **Precedence ordering:** New always-show-menu bullet is the first item in the **Rules:** list. This matches how rule blocks elsewhere in `barkeeper-instructions.md` express precedence (the rule that fires first appears first in the list).
- **Existing bullet rewording (not deletion):** The previously permissive "If the user skips the menu and just says something..." bullet was rewritten in place rather than deleted. Deleting it would have lost the "menu is a convenience, not a gate" framing that informs the named-tasks-only exception. Rewording preserves the intent while narrowing scope.
- **INSTALL.md indentation:** 3-space indent for the paste blocks. The existing sub-bullets under steps in this file (e.g., the `- barkeeper.md`, `- bar-owner-profile.md` list under step 3) use 3-space indentation; matching that keeps the fenced block visually part of its parent step.
- **Out-of-scope platforms:** D-04 explicitly names ChatGPT, Gemini, and Grok. Platform 1 (Claude Projects) and Platform 5 (Local LLMs) were left untouched — Claude Projects has a different setup flow, and Local LLMs already use the concatenation approach where the Standard init is pasted as the first user message.

## Deviations from Plan

None — plan executed exactly as written. All three tasks landed without auto-fix triggers; INIT_PROMPT.md was not modified (negative invariant held); no `app/` files were touched.

## Issues Encountered

None. The plan's `<read_first>` blocks contained line numbers from the planning phase that were stale by a few lines after Plan 01-05 expanded the onboarding section (the runtime note in the executor prompt warned about this). I used `grep -nF` content-based anchors instead of literal line numbers — the edits landed correctly without confusion.

## Verification Results

All plan-level acceptance criteria pass:

| Check | Expected | Actual |
| ----- | -------- | ------ |
| `Always show the menu first for returning users` in `barkeeper-instructions.md` | 1 | 1 |
| `Always show the menu first for returning users` in `instructions/onboarding.md` | 1 | 1 |
| `Exception (named tasks only):` in both files | ≥1 each | 1 each |
| Old permissive phrasing gone in both files | 0 | 0 |
| `> 7. Analytics mode` in `instructions/onboarding.md` | 1 | 1 |
| `> 8. Chat about something else` in `instructions/onboarding.md` | 1 | 1 |
| Old `> 7. Chat about something else` in `instructions/onboarding.md` | 0 | 0 |
| Menu items 1–8 byte-identical between monolith and module | yes | yes (diff empty) |
| `Initialize Barkeeper Bjorn.` count in `INSTALL.md` | ≥3 | 6 |
| `Read all your knowledge files (...) before responding.` count in `INSTALL.md` | ≥3 | 3 |
| `Conversation starters`, `opening message`, `system prompt` field names present | yes | yes |
| INIT_PROMPT.md unchanged | 0 modifications | 0 |
| `app/` files unchanged | 0 modifications | 0 |

## User Setup Required

None — no external service configuration needed. This plan only edits markdown agent instructions and the install guide.

## Next Phase Readiness

- AGENT-02 (returning-user session-start) and AGENT-05 (cross-file menu consistency) are closed.
- Phase 1 has remaining plans tracked in STATE.md (image-generation workflow, recipe-template width reconciliation, etc.) — orchestrator will dispatch them.
- Mirror obligation S2 remains an ongoing constraint: any future edit to either `barkeeper-instructions.md` Session-Start Menu Rules or `instructions/onboarding.md` Session-Start Menu Rules must be applied to BOTH files. The byte-identical mirror is now intact across the menu blockquote and the always-show rule.
- For installers following INSTALL.md: the paste blocks are now self-contained, so AGENT-02 will fire automatically on first GPT/Gem/Grok session as long as the user follows the per-platform step (no separate trip to INIT_PROMPT.md required).

## Self-Check: PASSED

- File `.planning/phases/01-agent-instructions-polish/01-02-SUMMARY.md` written.
- All three task commits present in git log: `f009b10`, `3545c7c`, `462fc42` (verified before this section was written).

---
*Phase: 01-agent-instructions-polish*
*Completed: 2026-05-06*
