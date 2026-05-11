---
phase: 01-agent-instructions-polish
plan: 02
type: execute
wave: 2
depends_on: ["01-05"]
files_modified:
  - barkeeper-instructions.md
  - instructions/onboarding.md
  - INSTALL.md
autonomous: true
requirements: [AGENT-02, AGENT-05]
must_haves:
  truths:
    - "D-03: For returning users, Bjorn always shows the session-start menu first regardless of how the user opens the conversation, with the existing 'specific request' exception narrowed to NAMED tasks only (not general greetings)"
    - "D-09: The session-start menu in instructions/onboarding.md has 8 items matching the monolith (Analytics mode at #7, Chat about something else at #8) — drift fixed"
    - "D-04: INSTALL.md Platform 2 (ChatGPT), Platform 3 (Gemini), and Platform 4 (Grok) sections each contain a paste-ready fenced code block with the verbatim 'Standard init' text from INIT_PROMPT.md lines 9–17"
    - "Mirror obligation S2 holds: barkeeper-instructions.md and instructions/onboarding.md menu blocks have identical item counts and ordering"
    - "AGENT-02 closure depends on the installer following the per-platform INSTALL.md guidance to set the Standard init block as the GPT/Gem/Grok opening starter message — D-04 enables AGENT-02 via platform setup; the agent itself does not detect 'first message' programmatically. If a user installs without that step, AGENT-02 behavior degrades regardless of the agent prompt."
  artifacts:
    - path: "barkeeper-instructions.md"
      provides: "Always-show-menu rule (D-03) under the Session-Start Menu Rules block"
      contains: "Always show the menu first for returning users"
    - path: "instructions/onboarding.md"
      provides: "Session-start menu synced to 8 items + always-show-menu rule (D-03)"
      contains: "7. Analytics mode"
    - path: "INSTALL.md"
      provides: "Paste-ready Standard init blocks for ChatGPT, Gemini, and Grok platforms (D-04)"
      contains: "Initialize Barkeeper Bjorn."
  key_links:
    - from: "barkeeper-instructions.md (Session-Start Menu Rules block, line ~97)"
      to: "instructions/onboarding.md (Session-Start Menu Rules block)"
      via: "Mirror obligation S2 from PATTERNS.md — both files must list the always-show-menu bullet (D-03)"
      pattern: "Always show the menu first for returning users"
    - from: "INSTALL.md (Platforms 2/3/4 paste blocks)"
      to: "INIT_PROMPT.md (lines 9–17, Standard init)"
      via: "Verbatim copy of the Standard init fenced block per D-04"
      pattern: "Initialize Barkeeper Bjorn."
---

<objective>
Lock down the session-start behavior for returning users (D-03 always-show-menu rule, D-09 mirror drift fix between monolith and module) and add paste-ready INIT_PROMPT blocks to INSTALL.md for ChatGPT, Gemini, and Grok platforms (D-04). Closes AGENT-02 and AGENT-05.

Purpose: Today the agent is allowed to skip the menu when the user opens with a vague greeting ("hi", "let's go") because the existing "honor a specific request directly" exception is too broad. D-03 narrows the exception to NAMED tasks. Separately, the modular `instructions/onboarding.md` menu has 7 items vs. the monolith's 8 (Analytics mode is missing) — D-09 closes that drift. INSTALL.md tells users to "paste the contents of `INIT_PROMPT.md`" but never inlines the text, forcing platform users to flip between files; D-04 puts the literal text inline per platform.
Output: Three modified markdown files. No code, no schema changes, no `app/` files.
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
@instructions/onboarding.md
@INSTALL.md
@INIT_PROMPT.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add D-03 always-show-menu rule to barkeeper-instructions.md and instructions/onboarding.md (mirror)</name>
  <files>barkeeper-instructions.md, instructions/onboarding.md</files>
  <read_first>
    - barkeeper-instructions.md (focus the `### Session-Start Menu (returning users only)` block at lines 84–101 — the menu blockquote and the `**Rules:**` bulleted list immediately after it)
    - instructions/onboarding.md (focus the parallel Session-Start Menu block at lines 23–40)
    - .planning/phases/01-agent-instructions-polish/01-PATTERNS.md (Pattern 2 — Session-start menu block, lines 58–97; S2 mirror obligation lines 376–381)
    - .planning/phases/01-agent-instructions-polish/01-CONTEXT.md (D-03)
  </read_first>
  <action>
    Two edits in this task. They must be applied as a paired mirror change.

    EDIT A — barkeeper-instructions.md. Locate the `**Rules:**` bulleted block immediately after the Session-Start Menu numbered list (the block currently containing the bullets `The persona name in the greeting comes from barkeeper.md...`, `Keep the menu exactly as formatted above...`, `If the user skips the menu and just says something ("make me something smoky"), honor it directly...`, `The menu can grow over time as features are added, but cap at 9 items...`).

    Insert the following NEW bullet as the FIRST bullet in this `**Rules:**` list (i.e., immediately under the `**Rules:**` header line, before the existing `The persona name in the greeting comes from barkeeper.md...` bullet). The existing bullets are NOT removed — the new bullet establishes precedence:

```
- **Always show the menu first for returning users**, regardless of how the user opens. If the user says "hi", "let's go", "what's up", or any vague opener, display the menu before doing anything else. The "honor a specific request directly" exception (below) applies *only* when the user names a clear task (e.g., "make me something smoky", "design me a mezcal sour") — never to general greetings.
```

    Then, in the SAME `**Rules:**` block, locate the existing bullet:
    `- If the user skips the menu and just says something ("make me something smoky"), honor it directly — the menu is a convenience, not a gate.`
    Replace its leading prose to make precedence explicit (preserves the existing example, adds the cross-reference back to the always-show rule):
```
- **Exception (named tasks only):** If the user opens with a specific named task ("make me something smoky", "design me a mezcal sour", "I want a Manhattan variation"), honor it directly — the menu is a convenience, not a gate. This exception does NOT apply to vague openers — see the always-show-menu rule above.
```

    EDIT B — instructions/onboarding.md. The same `**Rules:**` block exists in this file under the Session-Start Menu section (per PATTERNS.md, currently at lines 35–39). Apply the same two changes verbatim: insert the new `**Always show the menu first for returning users**...` bullet as the first bullet of the `**Rules:**` block, and replace the existing `If the user skips the menu and just says something...` bullet with the same `**Exception (named tasks only):**` rewording.

    Reasoning: D-03 is LOCKED. PATTERNS.md Pattern 2 documents the exact `**Rules:**` block location in both files and provides the canonical phrasing for the new rule (`Always show the menu first for returning users, regardless of how the user opens...`). PATTERNS.md S2 (Mirror obligation) requires identical changes in both files. The "Exception (named tasks only)" rewording is necessary because the original "honor it directly" bullet, read in isolation, contradicts D-03; the executor must update the existing bullet rather than leave a self-contradictory rules block.
  </action>
  <verify>
    <automated>cd /Users/glestryc/personal/github_repos/barkeeper-bjorn-website &amp;&amp; grep -F 'Always show the menu first for returning users' barkeeper-instructions.md instructions/onboarding.md &amp;&amp; grep -F 'Exception (named tasks only):' barkeeper-instructions.md instructions/onboarding.md</automated>
  </verify>
  <acceptance_criteria>
    - `grep -F 'Always show the menu first for returning users' barkeeper-instructions.md` exits 0
    - `grep -F 'Always show the menu first for returning users' instructions/onboarding.md` exits 0
    - `grep -F 'Exception (named tasks only):' barkeeper-instructions.md` exits 0
    - `grep -F 'Exception (named tasks only):' instructions/onboarding.md` exits 0
    - Negative grep — the OLD permissive phrasing is gone in both files: `grep -F 'If the user skips the menu and just says something ("make me something smoky"), honor it directly — the menu is a convenience, not a gate.' barkeeper-instructions.md` exits 1 (string not found)
    - `grep -F 'If the user skips the menu and just says something ("make me something smoky"), honor it directly — the menu is a convenience, not a gate.' instructions/onboarding.md` exits 1 (string not found)
    - `grep -c 'Always show the menu first for returning users' barkeeper-instructions.md` returns exactly 1
    - `grep -c 'Always show the menu first for returning users' instructions/onboarding.md` returns exactly 1
  </acceptance_criteria>
  <done>
    Both `barkeeper-instructions.md` and `instructions/onboarding.md` have the always-show-menu bullet as the first item under the Session-Start Menu `**Rules:**` block, and the previously permissive "honor it directly" bullet has been reworded as the named-tasks-only exception. The two files mirror each other exactly in this block.
  </done>
</task>

<task type="auto">
  <name>Task 2: Sync instructions/onboarding.md session-start menu to 8 items (D-09 mirror drift fix)</name>
  <files>instructions/onboarding.md</files>
  <read_first>
    - instructions/onboarding.md (focus the menu blockquote at lines 23–33; currently 7 items, ending `7. Chat about something else`)
    - barkeeper-instructions.md (focus lines 84–96; the 8-item canonical version)
    - .planning/phases/01-agent-instructions-polish/01-PATTERNS.md (Pattern 2 — Session-start menu block; flagged ambiguity #3 lines 410–411)
    - .planning/phases/01-agent-instructions-polish/01-CONTEXT.md (D-09)
  </read_first>
  <action>
    Edit instructions/onboarding.md. Locate the menu blockquote (the block that opens with `> *"Hey [Name] — [Persona Name] here. What are we doing tonight?"*`). Replace the existing 7-item list with the 8-item version that matches `barkeeper-instructions.md` lines 84–96 exactly. The replacement preserves the greeting line and the empty-blockquote separator, then renumbers Items 1–6 unchanged, inserts `7. Analytics mode`, and bumps `Chat about something else` to `8`. Final block must read:

```
> *"Hey [Name] — [Persona Name] here. What are we doing tonight?"*
>
> 1. Make me a drink from what I have
> 2. Design a new original
> 3. See my current recipe list
> 4. What should I buy next? (gap analysis)
> 5. Update my inventory
> 6. Review my flavor profile
> 7. Analytics mode
> 8. Chat about something else
```

    Do not change anything outside this blockquote (Task 1 already handles the `**Rules:**` block right after it).

    Reasoning: D-09 says the existing 8-item monolith menu is correct and the planner should sync the module to it. PATTERNS.md flagged ambiguity #3 documents this drift explicitly. The fix is purely additive (one new item + renumber the last item) — no other changes to the menu format, greeting line, or separator pattern (S1/S3 from PATTERNS.md preserved verbatim).
  </action>
  <verify>
    <automated>cd /Users/glestryc/personal/github_repos/barkeeper-bjorn-website &amp;&amp; grep -F '> 7. Analytics mode' instructions/onboarding.md &amp;&amp; grep -F '> 8. Chat about something else' instructions/onboarding.md</automated>
  </verify>
  <acceptance_criteria>
    - `grep -F '> 7. Analytics mode' instructions/onboarding.md` exits 0
    - `grep -F '> 8. Chat about something else' instructions/onboarding.md` exits 0
    - Negative grep — the OLD `> 7. Chat about something else` is gone: `grep -F '> 7. Chat about something else' instructions/onboarding.md` exits 1
    - Item count check (positional): `awk '/^> \*"Hey \[Name\]/,/^> 8\. Chat about something else/' instructions/onboarding.md | grep -E '^> [0-9]+\. ' | wc -l` returns exactly 8
    - Mirror-symmetry check: the bullet lines `> 1.` through `> 8.` in `instructions/onboarding.md` (extracted from the menu block) are byte-identical to the corresponding lines in `barkeeper-instructions.md` (apart from any leading/trailing whitespace introduced by the editor): `diff <(awk '/^> \*"Hey \[Name\]/,/^> 8\. Chat about something else/' barkeeper-instructions.md | grep -E '^> [0-9]+\. ') <(awk '/^> \*"Hey \[Name\]/,/^> 8\. Chat about something else/' instructions/onboarding.md | grep -E '^> [0-9]+\. ')` produces no output (exit 0)
  </acceptance_criteria>
  <done>
    `instructions/onboarding.md` session-start menu has 8 numbered items matching `barkeeper-instructions.md` exactly: items 1–6 unchanged, `7. Analytics mode` added, `Chat about something else` is now item 8.
  </done>
</task>

<task type="auto">
  <name>Task 3: Inline paste-ready Standard init blocks in INSTALL.md for ChatGPT, Gemini, and Grok (D-04)</name>
  <files>INSTALL.md</files>
  <read_first>
    - INSTALL.md (focus Platform 2 ChatGPT lines 35–68, Platform 3 Gemini lines 72–82, Platform 4 Grok lines 86–102)
    - INIT_PROMPT.md (focus lines 9–17 — the Standard init fenced block; READ-ONLY in this phase)
    - .planning/phases/01-agent-instructions-polish/01-PATTERNS.md (Pattern 1 INSTALL.md per-platform setup steps lines 296–338; S5 fenced-code pattern lines 392–394)
    - .planning/phases/01-agent-instructions-polish/01-CONTEXT.md (D-04 + Specifics: snippet must come from INIT_PROMPT.md "Standard init" lines 9–17, NOT the Returning user or Reset variants)
  </read_first>
  <action>
    Three edits in this task — one per platform section. Each edit inserts the SAME paste-ready block, with platform-specific intro text that names the field where the user pastes.

    The block to insert (verbatim — this is the "Standard init" text from INIT_PROMPT.md lines 9–17, copied here so the executor does not switch files):

```
**Paste this into the [FIELD-NAME-HERE] field:**

\`\`\`
Initialize Barkeeper Bjorn.

Read all your knowledge files (barkeeper.md, barkeeper-instructions.md, bar-owner-profile.md, inventory.md, recipes.md) before responding.

If my user files (bar-owner-profile.md, inventory.md, recipes.md) are empty or template-only, run the onboarding flow described in barkeeper-instructions.md. Start by asking whether I'm building a serious home bar or just looking to make a few favorite cocktails well (Minimalist track vs. Full track).

If my user files are already populated, greet me by name and ask what I'd like to do tonight: build a drink, design an original, get a gap analysis on my bar, or something else.
\`\`\`
```

    (Note: the `\`\`\`` shown above are LITERAL triple-backticks in the inserted markdown. The executor's editor will write them as ``` triple-backticks.)

    EDIT A — Platform 2 (ChatGPT). Locate the existing step bullet that says `Under **Conversation starters**, paste the contents of \`INIT_PROMPT.md\` as the first starter (or the short one-liner: *"Initialize Barkeeper Bjorn."*).` (currently around line 55). Immediately UNDER this bullet (preserving the bullet itself), insert the paste-ready block above with `[FIELD-NAME-HERE]` replaced with `Conversation starters`. The block sits inside the existing numbered list — so each line of the block needs to be indented to match a sub-element of the list item (3 spaces of indentation in front of `**Paste this...**` and the fenced code block) so it renders as part of step 5, not as a new top-level paragraph.

    EDIT B — Platform 3 (Gemini). Locate step 4 of the Gemini setup (the line that references INIT_PROMPT.md as the Gem's opening message, currently around line 79). Insert the paste-ready block immediately under that step, with `[FIELD-NAME-HERE]` replaced with `opening message`, indented as a sub-element of the step.

    EDIT C — Platform 4 (Grok). Locate step 3 of the Grok setup (the system-prompt step, currently around line 99). Insert the paste-ready block immediately under that step, with `[FIELD-NAME-HERE]` replaced with `system prompt`, indented as a sub-element of the step.

    Do NOT modify Platform 1 (Claude Projects) or Platform 5 (Local LLMs) — they are out of scope for D-04.
    Do NOT modify INIT_PROMPT.md — it is the read-only source.

    Reasoning: D-04 LOCKS the requirement that ChatGPT, Gemini, and Grok sections each get a paste-ready block. CONTEXT.md "Specifics" pins the snippet to INIT_PROMPT.md "Standard init" lines 9–17 (not Returning user or Reset variants). PATTERNS.md S5 confirms the bare triple-backtick fence pattern (no language tag) is the project convention. PATTERNS.md Pattern 1 of INSTALL.md confirms each platform section uses numbered steps and that paste references currently exist by name — D-04 inlines the actual text.
  </action>
  <verify>
    <automated>cd /Users/glestryc/personal/github_repos/barkeeper-bjorn-website &amp;&amp; [ "$(grep -c 'Read all your knowledge files (barkeeper.md, barkeeper-instructions.md, bar-owner-profile.md, inventory.md, recipes.md) before responding.' INSTALL.md)" -ge 3 ]</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c 'Initialize Barkeeper Bjorn.' INSTALL.md` returns at least 3 (one per platform — ChatGPT, Gemini, Grok)
    - `grep -F 'Conversation starters' INSTALL.md` exits 0 (Platform 2 field name)
    - `grep -F 'opening message' INSTALL.md` exits 0 (Platform 3 field name)
    - `grep -F 'system prompt' INSTALL.md` exits 0 (Platform 4 field name)
    - The Standard-init body text is present verbatim (full sentence): `grep -F 'Read all your knowledge files (barkeeper.md, barkeeper-instructions.md, bar-owner-profile.md, inventory.md, recipes.md) before responding.' INSTALL.md` exits 0, and `grep -c 'Read all your knowledge files (barkeeper.md, barkeeper-instructions.md, bar-owner-profile.md, inventory.md, recipes.md) before responding.' INSTALL.md` returns at least 3
    - Negative invariant — `INIT_PROMPT.md` was not modified: `git diff --name-only HEAD -- INIT_PROMPT.md | grep -c .` returns 0
    - Negative invariant — no `app/` files modified by this task: `git diff --name-only HEAD | grep -c '^app/'` returns 0
  </acceptance_criteria>
  <done>
    INSTALL.md contains a paste-ready fenced "Standard init" block under each of the ChatGPT, Gemini, and Grok platform sections, naming the correct field per platform. INIT_PROMPT.md is unchanged. No `app/` files modified.
  </done>
</task>

</tasks>

<verification>
After all tasks:
- `grep -F 'Always show the menu first for returning users' barkeeper-instructions.md instructions/onboarding.md` shows ≥1 hit per file
- `grep -F 'Exception (named tasks only):' barkeeper-instructions.md instructions/onboarding.md` shows ≥1 hit per file
- `grep -F '> 7. Analytics mode' instructions/onboarding.md` shows 1 hit (drift fixed)
- `grep -F '> 8. Chat about something else' instructions/onboarding.md` shows 1 hit
- `grep -c 'Initialize Barkeeper Bjorn.' INSTALL.md` returns ≥3
- Mirror invariant: the menu blockquote bullets `> 1.` through `> 8.` are identical between `barkeeper-instructions.md` and `instructions/onboarding.md`
- No file outside `files_modified` is touched (git diff verifies)
</verification>

<success_criteria>
- AGENT-02 closed: D-04 paste-ready blocks present for ChatGPT/Gemini/Grok in INSTALL.md so a fresh session on those platforms fires the INIT_PROMPT flow without manual file lookups
- AGENT-05 closed: D-03 always-show-menu rule + D-09 mirror drift fix ensure the returning-user session-start menu is always shown (not skipped on vague openers) and is consistent across monolith and module
- Mirror invariant intact: barkeeper-instructions.md and instructions/onboarding.md menu and rules blocks are identical
- Negative invariant: no `app/` files modified, INIT_PROMPT.md unchanged
</success_criteria>

<output>
After completion, create `.planning/phases/01-agent-instructions-polish/01-02-SUMMARY.md` per templates/summary.md.
</output>
