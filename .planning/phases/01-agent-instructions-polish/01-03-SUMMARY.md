---
phase: 01-agent-instructions-polish
plan: 03
subsystem: agent-instructions
tags: [markdown, agent-prompt, image-generation, behavioral-rules, D-05, D-06, D-07]

# Dependency graph
requires:
  - phase: "01-agent-instructions-polish (planning)"
    provides: "Locked decisions D-05 (three variants, auto-generate), D-06 (prompt-content inputs, flavor-axes excluded), D-07 (verbatim save-reminder wording) per 01-CONTEXT.md"
provides:
  - "Three-variant auto-generation image-prompt rule in barkeeper-instructions.md §Original Cocktails item 6"
  - "Verbatim D-07 save-reminder italicized blockquote immediately following the variants"
  - "Forward-compatible cross-reference to recipes.md `<img>` tag format (resolved by plan 04)"
affects: ["01-04-recipe-img-template", "Phase 2 web UI onboarding (image-related cues only — D-13 lock is plan 05's concern)"]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "S1 — Behavioral-rule blockquote (preserved for the parent rule)"
    - "S3 — Italicized-quoted user-facing prompt (used for the D-07 save reminder)"
    - "Pattern 4 — Image-prompt instruction block with named variants (extended from 2 to 3)"

key-files:
  created:
    - ".planning/phases/01-agent-instructions-polish/01-03-SUMMARY.md"
  modified:
    - "barkeeper-instructions.md (§Original Cocktails item 6, lines 483–489)"

key-decisions:
  - "D-05 three variants vs. ROADMAP's earlier 'two variants' wording: honored D-05 (locked), per must_haves explicit guidance. ROADMAP language predates the lock and will be reconciled at phase close."
  - "Variant C 1920s–1960s aesthetic phrasing: drew Trader Vic + Esquire mid-century + golden-era hotel-bar menu art per CONTEXT.md Specifics."
  - "Save-reminder placement: as a top-level italicized blockquote at column 0 immediately after the variants list (S3 pattern), NOT a fourth bullet. This visually separates the save reminder from the variant set."
  - "Mirror obligation S2 confirmed inapplicable: instructions/communication.md has no image-prompt rule (only line 42 `<img>` width note belonging to D-08/plan 04). Communication.md remains unmodified by this plan."
  - "Reused color-palette phrasing as concrete color words ('amber', 'smoke-grey', 'ruby') in Variant A to make D-06's flavor-axes-vs-color-palette distinction explicit at point-of-use, not just the parent paragraph."

patterns-established:
  - "Three-variant labeled image-prompt block (A Photorealistic / B Illustrated / painterly / C Vintage / retro) is now the canonical post-confirmation cocktail-artwork block — replicate verbatim if any future markdown file mirrors this rule."
  - "D-07 save-reminder is a one-line italicized blockquote at column 0 after a numbered-list rule body — sets precedent for future rules that need a one-line user-facing 'next action' addendum."

requirements-completed: [AGENT-03]

# Metrics
duration: ~6min
completed: 2026-05-05
---

# Phase 01 Plan 03: Image-Generation Workflow Summary

**Three-variant auto-generated image-prompt block (A Photorealistic, B Illustrated/painterly, C Vintage/retro 1920s–1960s) with D-06 prompt-content directives and a verbatim D-07 save-reminder blockquote — replaces the prior two-variant 'offer to suggest' rule in `barkeeper-instructions.md` §Original Cocktails item 6.**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-05-05T22:21Z
- **Completed:** 2026-05-05T22:21Z
- **Tasks:** 2 (1 verification + 1 edit)
- **Files modified:** 1 (`barkeeper-instructions.md`)

## Accomplishments

- Replaced the permission-asking "offer to suggest" wording with locked auto-generation behavior per D-05.
- Expanded variant set from 2 to 3, adding the Vintage / retro variant referencing 1920s–1960s cocktail book illustration style (Trader Vic / Esquire mid-century / golden-era hotel-bar menu art) per CONTEXT.md Specifics.
- Added the D-06 prompt-content directive at the parent-paragraph level (cocktail name + tagline + color palette + occasion drive prompts) AND made the flavor-axes exclusion explicit (`Do **not** include the user's flavor axes in the prompt`).
- Inserted the verbatim D-07 save-reminder italicized blockquote (`> *"Save to `images/` as `[cocktailN]-image.png` and link it in `recipes.md` with the `<img>` tag format."*`) immediately after the variants list, at column 0 (S3 pattern).
- Confirmed mirror invariant: `instructions/communication.md` has no image-prompt rule (only the line-42 `<img>` width note belonging to plan 04's D-08 update) and remains unmodified by this plan.

## Task Commits

Each task was committed atomically (Task 1 was a verification-only task with no file modifications and therefore no commit, per its own acceptance criteria — the confirmation is recorded in this Summary):

1. **Task 1: Confirm mirror scope (verify no image-prompt rule lives in `instructions/communication.md`)** — verification only; no commit (acceptance criterion specified `git diff --name-only HEAD -- instructions/communication.md | grep -c .` returns 0). Confirmation recorded below.
2. **Task 2: Replace barkeeper-instructions.md §Original Cocktails item 6 with three-variant auto-generation rule + D-07 save reminder** — `bbd052a` (feat) on `worktree-agent-ac53b36f`. The same change was first inadvertently committed to `main` as `8ca3d06` from the wrong working directory; see "Issues Encountered" below for full disclosure and recommended remediation.

**Plan metadata:** committed in this commit (no separate metadata commit; SUMMARY.md is the only doc artifact for this plan).

### Task 1 confirmation (verification-only — recorded here)

- `grep -E 'Photorealistic|Illustrated/painterly|Vintage / retro|image generation prompt|Variant A|Variant B|Variant C' instructions/communication.md` exits 1 — no matches.
- `instructions/communication.md` line 42 (the only image-related line) reads only: `- Images use `<img src="..." width="200">` HTML tag — not markdown `![]()` syntax, since width control matters.` This is a Pattern 2 image-format note belonging to D-08 / plan 04, NOT an image-prompt rule.
- Conclusion: mirror obligation S2 from PATTERNS.md does not apply for D-05/D-06/D-07 in this plan. The change lands only in `barkeeper-instructions.md`.

### Task 2 verification

All <verify> automated greps pass:

- `grep -F 'Variant A — Photorealistic' barkeeper-instructions.md` — match.
- `grep -F 'Variant B — Illustrated / painterly' barkeeper-instructions.md` — match.
- `grep -F 'Variant C — Vintage / retro' barkeeper-instructions.md` — match.
- `grep -F '1920s–1960s cocktail book illustration style' barkeeper-instructions.md` — match.
- `grep -F 'Save to `images/` as `[cocktailN]-image.png`' barkeeper-instructions.md` — match.
- `grep -F 'automatically generate three image-prompt variants' barkeeper-instructions.md` — match.
- `grep -F "Do **not** include the user's flavor axes" barkeeper-instructions.md` — match (D-06 exclusion).
- `grep -F 'Save to `images/` as `[cocktailN]-image.png` and link it in `recipes.md` with the `<img>` tag format.' barkeeper-instructions.md` — match (D-07 verbatim).
- `grep -F 'offer to suggest image generation prompts' barkeeper-instructions.md` — exit 1 (old wording removed).
- `grep -F 'Provide two prompt variants:' barkeeper-instructions.md` — exit 1 (old two-variant phrasing removed).
- `grep -c '\*\*Variant [ABC] —' barkeeper-instructions.md` returns 3 (≥3 required).
- `grep -E 'Photorealistic|Illustrated/painterly|Vintage / retro|Variant A|Variant B|Variant C' instructions/communication.md` exits 1 (mirror sanity — no incidental leak).
- No `app/` files modified.

## Files Created/Modified

- `barkeeper-instructions.md` — §Original Cocktails item 6 rewritten (lines 483–489): permission-asking "offer to suggest" replaced with auto-generate "do not ask permission first"; two variants expanded to three (A/B/C); D-06 prompt-content directives added (name + tagline + color palette + occasion; flavor axes excluded); D-07 verbatim save-reminder blockquote appended at column 0 after the variants; old filename-convention sentence removed (subsumed and superseded by D-07's `[cocktailN]-image.png` form).
- `.planning/phases/01-agent-instructions-polish/01-03-SUMMARY.md` — this file.

## Decisions Made

- **ROADMAP-vs-D-05 wording reconciliation:** ROADMAP §Phase 1 currently says "two variants"; CONTEXT.md D-05 LOCKS three variants. Honored D-05 per the plan's must_haves. Recommend ROADMAP reconciliation at phase close (orchestrator).
- **Save-reminder placement:** Plan said "between the variants and any trailing prose", but the prior trailing prose (the "Tailor both prompts..." paragraph and the filename-convention sentence) is replaced by the new parent paragraph + the D-07 blockquote. The blockquote sits at column 0 outside the numbered list to render as a top-level reminder rather than a fourth list item — matches S3 pattern usage elsewhere in the file.
- **Color palette phrasing inside Variant A:** Reinforced D-06's "color words not flavor descriptors" rule with concrete examples (`"amber", "smoke-grey", "ruby"`) at the point-of-use. Without this, a model could still leak flavor axes ("smoky", "bitter") into prompts despite the parent paragraph's exclusion. This is a Claude's-discretion call permitted by CONTEXT.md "Claude's Discretion" §("Exact structure of Variant A/B/C prompt templates").

## Deviations from Plan

None — plan executed exactly as written. All replacement-block content matches the plan's prescribed verbatim text (with the noted indentation strip described in the plan's "Notes for the executor").

## Issues Encountered

**1. Working-directory drift caused commit to land on `main` instead of the per-agent worktree branch.**

- **What happened:** The plan's <verify> blocks contain `cd /Users/glestryc/personal/github_repos/barkeeper-bjorn-website && ...` — that absolute path is the **main repo**, not the worktree (which is at `/Users/glestryc/personal/github_repos/barkeeper-bjorn-website/.claude/worktrees/agent-ac53b36f`). Following those exact commands moved the persistent shell into the main repo. The Edit (which uses absolute file paths) and the subsequent `git add` + `git commit` therefore landed on `main` (commit `8ca3d06`) rather than `worktree-agent-ac53b36f`.
- **Detection:** Caught immediately after the commit by `git log` showing the new commit on `main`.
- **Recovery (executed):** Returned to the worktree directory `.claude/worktrees/agent-ac53b36f`, ran `git cherry-pick 8ca3d06` onto `worktree-agent-ac53b36f`. Cherry-pick succeeded with no conflicts (commit object is shared in the worktree's object database). The worktree branch is now at `bbd052a` carrying the same change. All <verify> greps pass on the worktree filesystem.
- **Recovery NOT executed (by design — destructive-git prohibition):** Did NOT `git update-ref refs/heads/main` or `git reset --hard <prev>` on `main`. The destructive-git prohibition is absolute; surfacing this for orchestrator/user resolution rather than self-healing.
- **Surface to orchestrator/user as a BLOCKER:** Commit `8ca3d06` is currently on `main` in the primary repo at `/Users/glestryc/personal/github_repos/barkeeper-bjorn-website/`. When the orchestrator merges `worktree-agent-ac53b36f` (which contains an identical-content commit `bbd052a`) back into main, git will deduplicate via patch-id but the history will show two commits with the same content. **Recommended remediation (user/orchestrator decision):** before the merge-back, the user can `git -C /Users/glestryc/personal/github_repos/barkeeper-bjorn-website reset --hard b54780e` on `main` (or `git reset --hard HEAD~1`) to drop `8ca3d06`, then proceed with the worktree merge as normal. This is a destructive op on `main` that I will not execute autonomously.
- **Plan's `<verify>` cd-path is the underlying cause:** `cd /Users/glestryc/personal/github_repos/barkeeper-bjorn-website && ...` should be `cd /Users/glestryc/personal/github_repos/barkeeper-bjorn-website/.claude/worktrees/agent-ac53b36f && ...` (or omitted entirely — relative paths from the executor's already-correct cwd are simpler and safer). Recommended for future plans: planner emits relative paths, or the executor explicitly checks cwd against worktree root before running cd-prefixed commands.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- AGENT-03 closed: confirming a new original triggers an automatic three-variant image-prompt block with D-06 prompt-content directives and a D-07 save reminder.
- D-05/D-06/D-07 enforced. Mirror invariant intact.
- Plan 04 (recipe-img-template) can proceed: the D-07 save-reminder forward-references the `<img>` tag format that plan 04 will land in `recipes.md`, `barkeeper-instructions.md` line 529, and `instructions/communication.md` line 42. The save-reminder wording (`link it in `recipes.md` with the `<img>` tag format`) resolves naturally once plan 04 lands.
- **Open blocker for orchestrator/user (NOT for plan 04):** stray commit `8ca3d06` on `main` — see "Issues Encountered" item 1 for recommended remediation. Does not block plan 04, but should be resolved before the worktree merge-back.

## Self-Check: PASSED

- [x] `barkeeper-instructions.md` modification verified: `grep -F 'Variant A — Photorealistic' barkeeper-instructions.md` returns match in worktree.
- [x] `bbd052a` commit verified on `worktree-agent-ac53b36f`: `git log --oneline | grep bbd052a` returns the feat commit.
- [x] SUMMARY file path exists: `.planning/phases/01-agent-instructions-polish/01-03-SUMMARY.md` (this file, written before commit).
- [x] No `app/` files modified.
- [x] `instructions/communication.md` unmodified by this plan: `git diff --name-only 2abc29f bbd052a -- instructions/communication.md` is empty.
- [x] Mirror sanity grep `grep -E 'Photorealistic|Illustrated/painterly|Vintage / retro|Variant A|Variant B|Variant C' instructions/communication.md` exits 1.

---
*Phase: 01-agent-instructions-polish*
*Plan: 03 — Image Generation Workflow*
*Completed: 2026-05-05*
