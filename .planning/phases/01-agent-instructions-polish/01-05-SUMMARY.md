---
phase: 01-agent-instructions-polish
plan: 05
status: complete
self_check: PASSED
closes: [AGENT-06]
decisions_implemented: [D-10, D-11, D-12, D-13]
---

# Plan 01-05 Summary — Onboarding Step-2 Personalization

## What was built

Inserted a new **Phase F2 / Phase M2 — Bartender Personalization** step into both the Full-track and Minimalist-track onboarding flows, in both `barkeeper-instructions.md` (the monolith) and `instructions/onboarding.md` (the modular split). All existing F2..F13 phases shifted to F3..F14; M2..M5 shifted to M3..M6. The new step collects three fields one at a time per D-13 (name → voice preset → specialty focus) using the verbatim 5-item voice preset list (D-11) and the verbatim 5-item specialty focus list (D-12), introduced by the verbatim D-10 transition blockquote.

## Commits

- `281c05e` — refactor(01-05): renumber onboarding phases to open slot 2
- `c6a8a52` — feat(01-05): insert Phase F2/M2 Bartender Personalization step (D-10/D-11/D-12/D-13)
- (this commit) — docs(01-05): complete onboarding step-2 personalization plan

## Files modified

- `barkeeper-instructions.md` — F-track renumber (lines 174–294), M-track renumber (lines 321–363), F4→F5 cross-ref update at the new line ~357, new Phase F2 inserted (lines 174–202), new Phase M2 inserted (lines 349–376)
- `instructions/onboarding.md` — same renumber + insertions in the parallel module file

## Decisions implemented

| ID | Decision | How |
|----|----------|-----|
| D-10 | Bartender Personalization is a full step even for users keeping defaults | New step inserted as F2 (Full) and M2 (Minimalist) with the verbatim transition blockquote; prose explicitly says "Always present this as a full step" |
| D-11 | 5 voice presets verbatim | Pasted verbatim in both files; **bold name — descriptor** form preserved exactly per CONTEXT.md |
| D-12 | 5 specialty focus options verbatim | Pasted verbatim including parenthetical clarifications (`(pre-Prohibition and golden-era cocktails)`, `(non-alcoholic and low-ABV)`, `(broad and balanced)`) |
| D-13 | Field order locked at name → voice preset → specialty focus, one-question-at-a-time | Numbered list in Full track and three sequential italicized blockquotes in Minimalist track; prose reminds executor of the one-question rule |

## Acceptance criteria — all pass

### Task 1 (renumber)
- ✓ F2 slot empty in both files (`grep -E '^### Phase F2 — '` exits 1 before Task 2)
- ✓ F1 unchanged in both files
- ✓ Full-track titles match between files (`comm -3` produces no output)
- ✓ M2 slot empty similarly
- ✓ M1 unchanged
- ✓ Renumber contiguous (F1, F3..F14 then F1..F14 after Task 2)
- ✓ In-prose F4 cross-ref updated to F5 in both files (1 occurrence each)
- ✓ No old `Phase F4` references remain
- ✓ No `app/` files modified

### Task 2 (insertion)
- ✓ Phase F2 — Bartender Personalization header in both files
- ✓ Phase M2 — Bartender Personalization header in both files
- ✓ D-10 transition blockquote present 2× in each file (once in F2, once in M2)
- ✓ All 5 D-11 voice presets present verbatim in both files
- ✓ All 5 D-12 specialty options present verbatim in both files
- ✓ Mirror invariant S2: monolith and module insertions are byte-identical for the F2 block and the M2 block respectively
- ✓ Negative invariant: 0 `app/` files modified

## Issues encountered

The first attempt at this plan was paused by a runtime rate limit after Task 1 was committed (`281c05e`). The orchestrator finished Task 2 and the SUMMARY.md directly in the worktree to avoid burning a fresh agent budget on a deterministic insertion. Task 1's output was inspected (full-track F1, F3..F14 and minimalist M1, M3..M6) and confirmed correct before continuation. No state corruption.

## Cross-plan integration

Phase 2 of the project (`app/js/views/onboarding.js`) will mirror this field order per D-13 — the locked sequence is now in agent context, ready to be reflected in the web UI wizard.

## Self-check: PASSED

All commits on `worktree-agent-a4b7d714`. SUMMARY.md committed before return per parallel-executor protocol.
