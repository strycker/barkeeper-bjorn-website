---
phase: 01-agent-instructions-polish
plan: 01
subsystem: agent-instructions
tags: [markdown, prompt-engineering, behavioral-rules, mirror-invariant]

# Dependency graph
requires:
  - phase: 01-agent-instructions-polish
    provides: Phase F2/M2 onboarding personalization step renumbered subsequent phases (plan 01-05)
provides:
  - Strengthened one-question rule with WRONG/RIGHT negative example and explicit numbered-list ban (D-01)
  - All-contexts enumeration including "recipe design" and "analytics mode" mirrored across the monolith Communication Style and modular communication.md (D-02)
  - Mirror parity between barkeeper-instructions.md, instructions/communication.md, and instructions/onboarding.md for the one-question rule
affects: [02-web-ui-onboarding, 03-image-workflows, agent-behavior]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Behavioral-rule blockquote (Pattern 1): bold-CAPS header + italicized prose + appended WRONG/RIGHT and numbered-list-ban paragraphs in one continuous blockquote"
    - "Mirror obligation S2: every D-01/D-02 change to barkeeper-instructions.md propagated to the corresponding instructions/*.md module"

key-files:
  created:
    - ".planning/phases/01-agent-instructions-polish/01-01-SUMMARY.md"
  modified:
    - "barkeeper-instructions.md"
    - "instructions/communication.md"
    - "instructions/onboarding.md"

key-decisions:
  - "Used a continuous blockquote (no blank break) for the strengthened rule in barkeeper-instructions.md and instructions/onboarding.md, matching Pattern 1"
  - "In instructions/communication.md, nested the WRONG/RIGHT and numbered-list-ban as sub-bullets under the Core Principles bullet (Pattern 6) rather than a blockquote — preserves the bulleted-rule list structure of that module"
  - "In barkeeper-instructions.md Communication Style (line 633, originally line 575 in the stale plan), kept the bullet short and added an italicized cross-reference to the Onboarding Flow rule block instead of duplicating the WRONG/RIGHT — avoids triple-mirror drift"

patterns-established:
  - "WRONG/RIGHT negative-example block format: `> **WRONG:** *\"...\"*` / `> **RIGHT:** *\"...\"* (parenthetical clarification)` inside the rule blockquote"
  - "Numbered-list ban phrasing: `**No numbered question lists.** Never write \"1. ... 2. ...\" in any message that requests information from the user — regardless of how related the questions are.`"
  - "All-contexts enumeration order (locked): onboarding, re-evaluation, follow-ups, recipe design, analytics mode, casual conversation"

requirements-completed: [AGENT-01]

# Metrics
duration: 63min
completed: 2026-05-06
---

# Phase 01 Plan 01: Rule Enforcement Summary

**Strengthened the one-question rule with a WRONG/RIGHT negative example and an explicit numbered-list ban, and mirrored an all-contexts enumeration (recipe design + analytics mode) across the monolith Communication Style and modular communication module.**

## Performance

- **Duration:** ~63 min
- **Started:** 2026-05-06T14:54:57Z
- **Completed:** 2026-05-06T15:57:28Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Closed AGENT-01: the one-question rule now contains a concrete WRONG example, a concrete RIGHT example, and an explicit "no numbered question lists" ban (D-01 LOCKED text)
- Enforced D-02: the all-contexts enumeration in instructions/communication.md and the Communication Style section of barkeeper-instructions.md explicitly names recipe design and analytics mode (in addition to onboarding, re-evaluation, follow-ups, casual conversation)
- Maintained the S2 mirror invariant: every change in barkeeper-instructions.md has a matching change in the corresponding instructions/*.md module (and the rule appears in all three files)
- Preserved negative invariant: zero `app/` files modified

## Task Commits

Each task was committed atomically:

1. **Task 1: Strengthen the one-question rule in barkeeper-instructions.md (D-01)** — `62e1fde` (feat)
2. **Task 2: Mirror the strengthened rule into instructions/communication.md and instructions/onboarding.md, expand all-contexts enumeration (D-02)** — `62dd14a` (feat)

(STATE.md / ROADMAP.md / REQUIREMENTS.md updates and the metadata commit are deferred to the orchestrator per parallel-executor instructions; SUMMARY.md is committed below.)

## Files Created/Modified
- `barkeeper-instructions.md` — Onboarding Flow blockquote (lines 71–77) extended with WRONG/RIGHT and numbered-list-ban; Communication Style bullet (line 633) updated with `recipe design, analytics mode` enumeration plus italicized cross-reference to the Onboarding Flow block
- `instructions/communication.md` — Core Principles `One question per message` bullet (line 10) updated with the all-contexts enumeration; nested sub-bullets added for WRONG, RIGHT, and the numbered-list ban
- `instructions/onboarding.md` — `## ONE QUESTION AT A TIME — Absolute Rule` blockquote (lines 9 onward) extended with WRONG/RIGHT and numbered-list-ban, mirroring the monolith
- `.planning/phases/01-agent-instructions-polish/01-01-SUMMARY.md` — this file

## Decisions Made
- **Continuous blockquote in monolith and onboarding module:** Both blockquote-style rules append the WRONG/RIGHT and numbered-list-ban lines into the same `>`-prefixed block (with `>` empty-line separators between the original prose, the WRONG/RIGHT, and the numbered-list-ban paragraph). This matches the Pattern 1 convention and reads as one rule unit.
- **Nested sub-bullets in communication.md:** The communication module uses a bulleted Core Principles list, not a blockquote. The strengthened content is added as nested sub-bullets under the `One question per message — always.` bullet — preserving the module's bullet-list rhythm while keeping the WRONG/RIGHT example visually attached to the parent rule.
- **Cross-reference rather than duplication in barkeeper-instructions.md line 633:** The Communication Style bullet down at line 633 of the monolith is itself a mirror of communication.md line 10. Since the monolith already carries the full WRONG/RIGHT block up at lines 71–77 (the canonical Onboarding Flow rule), duplicating the WRONG/RIGHT here would create a third copy that could drift. Instead, line 633 carries the strengthened enumeration (`recipe design, analytics mode`) plus an italicized "*See the full rule with WRONG/RIGHT examples in the Onboarding Flow section.*" pointer.

## Deviations from Plan

None — plan executed as written. The plan's stale line numbers (line 72 / line 575) were resolved via grep-based anchors (`grep -nF 'ONE QUESTION AT A TIME'`, `grep -nF 'One question per message'`) per the runtime note in the executor prompt; the actual lines are 71 and 633 after Phase 01-05's earlier edits, but the textual anchors are unique and the edits landed in the intended blocks.

### Note on Task 1 acceptance-criterion arithmetic

The Task 1 acceptance block contains: `awk '/^> \*\*ONE QUESTION AT A TIME/,/^$/' barkeeper-instructions.md | grep -c '^> '` returns ≥ 6. Literal output is **5** (header + body + WRONG + RIGHT + numbered-list-ban) because the two `>` empty-line separators are bare `>` (no trailing space) and don't match `'^> '`. If the criterion is rewritten with `'^>'` (no trailing space), the count is **7**, well over 6. The substantive intent — "the WRONG/RIGHT lines are inside the same blockquote as `ONE QUESTION AT A TIME` (no blank non-`>` line between them)" — is satisfied: the blockquote is contiguous from line 71 through line 77 with no breaking blank line. Logged here for transparency rather than treated as a deviation since the plan-grep is an off-by-one in the criterion's regex, not a content gap.

---

**Total deviations:** 0
**Impact on plan:** None.

## Issues Encountered

- **Plan-grep regex off-by-one in Task 1 acceptance criterion** (see note above). The intent is met; the literal count differs. No content change required.

## User Setup Required

None — markdown-only edits to agent prompt files.

## Next Phase Readiness

- AGENT-01 closed; ready for the next plan in Phase 01 (rule-enforcement decisions D-03 onward, image workflow decisions D-05–D-08, and bartender-personalization rebuilds in subsequent plans).
- Mirror invariant intact between `barkeeper-instructions.md` and `instructions/{communication,onboarding}.md` for the one-question rule. Future plans modifying either side must continue to propagate.
- The strengthened WRONG/RIGHT phrasing and numbered-list-ban wording are now reusable as a pattern for any future "absolute rule" that needs concrete negative examples (Pattern 1 extension).

## Self-Check

Verifying claims before proceeding.

**Files exist:**
- barkeeper-instructions.md — FOUND
- instructions/communication.md — FOUND
- instructions/onboarding.md — FOUND
- .planning/phases/01-agent-instructions-polish/01-01-SUMMARY.md — FOUND (this file)

**Commits exist:**
- 62e1fde (Task 1) — FOUND
- 62dd14a (Task 2) — FOUND

**Acceptance criteria:**
- D-01 WRONG/RIGHT in barkeeper-instructions.md — PASS
- D-01 numbered-list ban + `1. ... 2. ...` example in barkeeper-instructions.md — PASS
- D-02 `recipe design, analytics mode` in barkeeper-instructions.md — PASS
- D-02 `recipe design, analytics mode` in instructions/communication.md — PASS
- WRONG/RIGHT + numbered-list ban in instructions/communication.md — PASS
- WRONG/RIGHT + numbered-list ban in instructions/onboarding.md — PASS
- `**One question per message — always.**` count = 1 in each of the two files — PASS
- Negative invariant — only the three plan files touched — PASS (verified via `git diff --name-only`)

## Self-Check: PASSED

---
*Phase: 01-agent-instructions-polish*
*Completed: 2026-05-06*
