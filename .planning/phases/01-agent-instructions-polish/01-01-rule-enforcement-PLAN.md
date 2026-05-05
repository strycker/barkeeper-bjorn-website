---
phase: 01-agent-instructions-polish
plan: 01
type: execute
wave: 2
depends_on: ["01-05"]
files_modified:
  - barkeeper-instructions.md
  - instructions/communication.md
  - instructions/onboarding.md
autonomous: true
requirements: [AGENT-01]
must_haves:
  truths:
    - "D-01: A WRONG/RIGHT negative example block immediately follows the one-question rule blockquote in barkeeper-instructions.md"
    - "D-01: An explicit numbered-list ban line is present in the same rule block"
    - "D-02: The 'all-contexts' enumeration in instructions/communication.md explicitly names recipe design and analytics mode (in addition to onboarding, re-evaluation, follow-ups, casual conversation)"
    - "D-02: The Communication Style bullet in barkeeper-instructions.md mirrors the strengthened communication.md bullet"
  artifacts:
    - path: "barkeeper-instructions.md"
      provides: "Strengthened one-question rule block with WRONG/RIGHT example and numbered-list ban"
      contains: "WRONG: \"What's your name? And where are you based?\""
    - path: "instructions/communication.md"
      provides: "All-contexts one-question rule mirrored from monolith"
      contains: "recipe design"
  key_links:
    - from: "barkeeper-instructions.md (rule block at line 71)"
      to: "instructions/communication.md (Core Principles bullet)"
      via: "Mirror obligation S2 from PATTERNS.md"
      pattern: "ONE QUESTION AT A TIME"
---

<objective>
Strengthen the one-question rule across the agent constitution and the modular communication module by adding a concrete WRONG/RIGHT negative example, an explicit numbered-list ban, and explicit "all contexts" enumeration that names recipe design and analytics mode.

Purpose: Closes AGENT-01. The current rule reads as policy; LLMs (especially ChatGPT in observed sessions) still ask multi-part questions. A negative example block + numbered-list ban + "all contexts" enumeration makes the rule un-misinterpretable.
Output: Two modified markdown files. No code, no schema changes.
</objective>

<execution_context>
@/Users/glestryc/personal/github_repos/barkeeper-bjorn-website/.claude/get-shit-done/workflows/execute-plan.md
@/Users/glestryc/personal/github_repos/barkeeper-bjorn-website/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/01-agent-instructions-polish/01-CONTEXT.md
@.planning/phases/01-agent-instructions-polish/01-PATTERNS.md
@CLAUDE.md
@barkeeper-instructions.md
@instructions/communication.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Strengthen the one-question rule in barkeeper-instructions.md (D-01)</name>
  <files>barkeeper-instructions.md</files>
  <read_first>
    - barkeeper-instructions.md (focus lines 71–72; the existing one-question blockquote)
    - .planning/phases/01-agent-instructions-polish/01-PATTERNS.md (Pattern 1 — Behavioral-rule blockquote, lines 30–51)
    - .planning/phases/01-agent-instructions-polish/01-CONTEXT.md (D-01)
  </read_first>
  <action>
    Edit barkeeper-instructions.md. Locate the one-question rule blockquote at lines 71–72 (the block beginning `> **ONE QUESTION AT A TIME — this rule is absolute.**`). Leave the existing two-line blockquote intact, then immediately append the following continuation lines to the SAME blockquote (each line prefixed with `> `, preserving the existing italic-quoted style established by Pattern 1):

```
>
> **WRONG:** *"What's your name? And where are you based?"*
> **RIGHT:** *"What's your name?"* (Wait for answer, then ask about location.)
>
> **No numbered question lists.** Never write "1. ... 2. ..." in any message that requests information from the user — regardless of how related the questions are.
```

The result: a single contiguous blockquote (no blank line breaking it) that starts at the existing `> **ONE QUESTION AT A TIME — this rule is absolute.**` header and ends with the numbered-list-ban paragraph above. Do not modify the existing line 72 prose; the WRONG/RIGHT block is appended after it.

Reasoning: D-01 is LOCKED text from CONTEXT.md. PATTERNS.md Pattern 1 confirms the rule lives in a continuous blockquote and shows the exact insertion form ("Suggested insertion immediately after line 72"). The exact `WRONG:` / `RIGHT:` strings come verbatim from CONTEXT.md so the executor does not improvise.
  </action>
  <verify>
    <automated>cd /Users/glestryc/personal/github_repos/barkeeper-bjorn-website &amp;&amp; grep -F 'WRONG:** *"What'\''s your name? And where are you based?"*' barkeeper-instructions.md &amp;&amp; grep -F 'RIGHT:** *"What'\''s your name?"*' barkeeper-instructions.md &amp;&amp; grep -F 'No numbered question lists.' barkeeper-instructions.md</automated>
  </verify>
  <acceptance_criteria>
    - `grep -F 'WRONG:** *"What'\''s your name? And where are you based?"*' barkeeper-instructions.md` exits 0
    - `grep -F 'RIGHT:** *"What'\''s your name?"*' barkeeper-instructions.md` exits 0
    - `grep -F 'No numbered question lists.' barkeeper-instructions.md` exits 0
    - `grep -F '1. ... 2. ...' barkeeper-instructions.md` exits 0 (the numbered-list-ban example string is present)
    - `grep -c '^> \*\*ONE QUESTION AT A TIME' barkeeper-instructions.md` returns exactly 1 (header still unique)
    - The WRONG/RIGHT lines are inside the same blockquote as `ONE QUESTION AT A TIME` (no blank non-`>` line between them): `awk '/^> \*\*ONE QUESTION AT A TIME/,/^$/' barkeeper-instructions.md | grep -c '^> '` returns ≥ 6
  </acceptance_criteria>
  <done>
    The one-question rule blockquote in barkeeper-instructions.md contains the WRONG/RIGHT block and the numbered-list ban paragraph as a continuous blockquote, and no other content in the file is changed.
  </done>
</task>

<task type="auto">
  <name>Task 2: Mirror the strengthened rule into instructions/communication.md and instructions/onboarding.md, expand all-contexts enumeration (D-02)</name>
  <files>instructions/communication.md, instructions/onboarding.md, barkeeper-instructions.md</files>
  <read_first>
    - instructions/communication.md (focus lines 9–10; the Core Principles `One question per message — always.` bullet)
    - instructions/onboarding.md (focus lines 7–9; the `## ONE QUESTION AT A TIME — Absolute Rule` section)
    - barkeeper-instructions.md (focus line 575; the Communication Style mirror bullet)
    - .planning/phases/01-agent-instructions-polish/01-PATTERNS.md (Pattern 6 — Communication-style bulleted rule list, lines 176–185)
    - .planning/phases/01-agent-instructions-polish/01-CONTEXT.md (D-02)
  </read_first>
  <action>
    Three edits in this task. All three preserve existing surrounding content; only the targeted bullet/blockquote changes.

    EDIT A — instructions/communication.md line 10. Locate the bullet currently reading:
    `- **One question per message — always.** This applies in onboarding, re-evaluation, follow-ups, and casual conversation. If you have two questions, pick the more important one. Ask the second after the first is answered.`

    Replace with the verbatim line below (adds `recipe design` and `analytics mode` to the explicit context list, per D-02; appends the WRONG/RIGHT and numbered-list-ban sub-points as a nested bulleted list directly under the bullet so the module mirrors the monolith's emphasis):

```
- **One question per message — always.** This applies in onboarding, re-evaluation, follow-ups, recipe design, analytics mode, and casual conversation. If you have two questions, pick the more important one. Ask the second after the first is answered.
  - **WRONG:** *"What's your name? And where are you based?"*
  - **RIGHT:** *"What's your name?"* (Wait for answer, then ask about location.)
  - **No numbered question lists.** Never write "1. ... 2. ..." in any message that requests information from the user — regardless of how related the questions are.
```

    EDIT B — barkeeper-instructions.md line 575. Locate the matching Communication Style bullet (the SECOND occurrence of `**One question per message — always.**` in this file; the FIRST occurrence is the new mirrored bullet you may already see if module is read first — but in barkeeper-instructions.md the bullet is at line 575). Replace with the same wording (no nested bullets — the monolith already has the full rule blockquote up at line 71, so down here at line 575 we only update the enumeration line itself):

```
- **One question per message — always.** This applies in onboarding, re-evaluation, follow-ups, recipe design, analytics mode, and casual conversation. If you have two questions, pick the more important one. Ask the second after the first is answered. *(See the full rule with WRONG/RIGHT examples in the Onboarding Flow section.)*
```

    EDIT C — instructions/onboarding.md line 9. Locate the blockquote `> Ask exactly one question per message...` (the body of the `## ONE QUESTION AT A TIME — Absolute Rule` section). Append continuation lines to the same blockquote so the module mirrors the monolith's strengthened rule. Insert immediately after the existing single-line blockquote at line 9:

```
>
> **WRONG:** *"What's your name? And where are you based?"*
> **RIGHT:** *"What's your name?"* (Wait for answer, then ask about location.)
>
> **No numbered question lists.** Never write "1. ... 2. ..." in any message that requests information from the user — regardless of how related the questions are.
```

    Reasoning: PATTERNS.md S2 (Mirror obligation) requires the strengthened D-01 rule to land in BOTH the modular `instructions/onboarding.md` (which mirrors the Onboarding Flow section of the monolith, including the rule blockquote at lines 7–9) AND the modular `instructions/communication.md` (which mirrors the Communication Style section). D-02 explicitly requires the all-contexts enumeration to name `recipe design` and `analytics mode`. The Communication Style bullet inside `barkeeper-instructions.md` line 575 is itself a mirror of `instructions/communication.md` line 10 per S2; both must be updated together. The italicized cross-reference in EDIT B keeps line 575 short while pointing readers up to the canonical rule block.
  </action>
  <verify>
    <automated>cd /Users/glestryc/personal/github_repos/barkeeper-bjorn-website &amp;&amp; grep -F 'recipe design, analytics mode' instructions/communication.md barkeeper-instructions.md &amp;&amp; grep -F 'WRONG:** *"What'\''s your name? And where are you based?"*' instructions/communication.md instructions/onboarding.md &amp;&amp; grep -F 'No numbered question lists.' instructions/communication.md instructions/onboarding.md</automated>
  </verify>
  <acceptance_criteria>
    - `grep -F 'recipe design, analytics mode' instructions/communication.md` exits 0
    - `grep -F 'recipe design, analytics mode' barkeeper-instructions.md` exits 0
    - `grep -F 'WRONG:** *"What'\''s your name? And where are you based?"*' instructions/communication.md` exits 0
    - `grep -F 'WRONG:** *"What'\''s your name? And where are you based?"*' instructions/onboarding.md` exits 0
    - `grep -F 'No numbered question lists.' instructions/communication.md` exits 0
    - `grep -F 'No numbered question lists.' instructions/onboarding.md` exits 0
    - `grep -c '\*\*One question per message — always.\*\*' instructions/communication.md` returns exactly 1
    - `grep -c '\*\*One question per message — always.\*\*' barkeeper-instructions.md` returns exactly 1
    - Negative invariant — no `app/` files touched: `git diff --name-only HEAD | grep -v -E '^(barkeeper-instructions\.md|instructions/communication\.md|instructions/onboarding\.md)$' | grep -c .` returns 0
  </acceptance_criteria>
  <done>
    All four mirror locations (barkeeper-instructions.md line 71 block, barkeeper-instructions.md line 575 bullet, instructions/communication.md Core Principles bullet, instructions/onboarding.md ONE QUESTION rule blockquote) explicitly enumerate the all-contexts list including recipe design and analytics mode, and the WRONG/RIGHT + numbered-list-ban content appears in barkeeper-instructions.md, instructions/communication.md, and instructions/onboarding.md. No app/ files are modified.
  </done>
</task>

</tasks>

<verification>
After both tasks:
- `grep -F 'WRONG:' barkeeper-instructions.md instructions/communication.md instructions/onboarding.md` shows ≥1 hit per file
- `grep -F 'recipe design, analytics mode' barkeeper-instructions.md instructions/communication.md` shows ≥1 hit per file (NOT required in onboarding.md — that file's blockquote inherits the monolith's full rule; the all-contexts enumeration belongs to the Communication Style mirror)
- The Communication Style bullet (line 575 in monolith) and Core Principles bullet (line 10 in module) read the same enumeration
- No file outside `files_modified` is touched (git diff verifies)
</verification>

<success_criteria>
- AGENT-01 closed: the one-question rule contains a concrete WRONG example, a concrete RIGHT example, and an explicit numbered-list ban
- D-02 enforced: explicit "all contexts" enumeration including recipe design and analytics mode is present in both the monolith Communication Style and the modular communication.md
- Mirror invariant intact: every change in barkeeper-instructions.md has a matching change in the corresponding instructions/*.md module
- Negative invariant: no app/ files modified (out of scope per CONTEXT.md)
</success_criteria>

<output>
After completion, create `.planning/phases/01-agent-instructions-polish/01-01-SUMMARY.md` per templates/summary.md.
</output>
