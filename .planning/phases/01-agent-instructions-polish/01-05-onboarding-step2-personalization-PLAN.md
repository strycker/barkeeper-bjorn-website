---
phase: 01-agent-instructions-polish
plan: 05
type: execute
wave: 1
depends_on: []
files_modified:
  - barkeeper-instructions.md
  - instructions/onboarding.md
autonomous: true
requirements: [AGENT-06]
must_haves:
  truths:
    - "D-10: A new Bartender Personalization step is inserted as step 2 of onboarding (between the existing Bar Owner Profile step and the previous step 2). The new step is a FULL step — not skippable, not abbreviated for users who want defaults"
    - "D-10: The transition prompt is the verbatim italicized blockquote: > *\"Before we go further — I'm Barkeeper Bjorn by default, but let's make sure I'm set up right for you.\"*"
    - "D-11: The new step lists exactly five voice presets, verbatim from CONTEXT.md: Professional & measured, Warm & playful, Terse & opinionated, Theatrical & verbose, Nerdy / analytical"
    - "D-12: The new step lists exactly five specialty focus options, verbatim from CONTEXT.md: Classics (pre-Prohibition and golden-era cocktails), Modern / contemporary, Tiki / tropical, NA-forward (non-alcoholic and low-ABV), No preference (broad and balanced)"
    - "D-13: Field order is locked at name → voice preset → specialty focus, asked one at a time (one-question-at-a-time rule from plan 01 enforces this)"
    - "Step renumbering is applied uniformly: the previous step 2 becomes step 3, previous step 3 becomes step 4, etc. The Minimalist track receives the same insertion (between M1 and M2)"
    - "Mirror obligation S2: every change in barkeeper-instructions.md is mirrored in instructions/onboarding.md (full-track and minimalist-track changes both)"
  artifacts:
    - path: "barkeeper-instructions.md"
      provides: "New Phase F2 — Bartender Personalization between F1 and the previous F2; previous F2..FN renumbered F3..F(N+1). Same insertion in Minimalist track between M1 and M2."
      contains: "Bartender Personalization"
    - path: "instructions/onboarding.md"
      provides: "Mirror of the new Phase F2 — Bartender Personalization in the modular onboarding file; same Minimalist insertion"
      contains: "Bartender Personalization"
    - path: "barkeeper-instructions.md"
      provides: "Verbatim D-11 voice presets and D-12 specialty focus lists inside the new step 2"
      contains: "Theatrical & verbose"
    - path: "instructions/onboarding.md"
      provides: "Verbatim D-11 voice presets and D-12 specialty focus lists inside the new step 2"
      contains: "NA-forward (non-alcoholic and low-ABV)"
  key_links:
    - from: "barkeeper-instructions.md (new Phase F2 + new Phase M1.5/M-equivalent)"
      to: "instructions/onboarding.md (parallel new phases)"
      via: "Mirror obligation S2 — both files must contain identical step 2 inserts in both Full and Minimalist tracks"
      pattern: "Bartender Personalization"
    - from: "barkeeper-instructions.md / instructions/onboarding.md (new step 2 fields)"
      to: "app/js/views/onboarding.js (Phase 2 of the project)"
      via: "D-13 locks the field order so Phase 2 web UI wizard mirrors agent step 2"
      pattern: "name → voice preset → specialty focus"
---

<objective>
Insert a new Bartender Personalization step as step 2 of onboarding (D-10) in both the Full track and the Minimalist track, in both `barkeeper-instructions.md` and `instructions/onboarding.md`. Renumber subsequent steps. The new step collects three fields one at a time (D-13: name → voice preset → specialty focus) using the verbatim 5-item voice preset list (D-11) and the verbatim 5-item specialty focus list (D-12). Closes AGENT-06.

Purpose: Today the agent collects bartender personalization at the END of onboarding (or at "Step 1" depending on which file you read — the existing Step 1 in the monolith is persona setup, but Phases F1/M1 in the same file are Bar Owner Profile). The user wants persona setup AFTER name/location but BEFORE everything else, so the bartender's voice and specialty focus are set early and used consistently in subsequent prompts. D-10 LOCKS this as a full step (not a skip-friendly preamble), even for users who want defaults — so the user always sees the 5 voice presets and the 5 specialty options at least once. D-11 and D-12 LOCK the literal lists to be presented; CONTEXT.md is the source of truth and the executor is given the lists verbatim below to remove any chance of paraphrasing.
Output: Two modified markdown files. No code, no schema changes, no `app/` files. The web UI wizard mirror (per D-13) is Phase 2 territory and is NOT touched here.
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
</context>

<tasks>

<task type="auto">
  <name>Task 1: Renumber existing Full-track phases F2..FN to F3..F(N+1) and Minimalist-track phases M2..MN to M3..M(N+1) in both files</name>
  <files>barkeeper-instructions.md, instructions/onboarding.md</files>
  <read_first>
    - barkeeper-instructions.md (focus the Onboarding Flow section — Phase F1 begins around line 163; subsequent phases F2..F13 follow; Minimalist Phase M1 starts around line 314, M2..MN follow)
    - instructions/onboarding.md (focus the parallel Onboarding Flow — F1 around line 97 in this module; the Minimalist track also exists later in the file)
    - .planning/phases/01-agent-instructions-polish/01-PATTERNS.md (Pattern 5 — Onboarding step header, lines 144–174; flagged ambiguity #4 — D-10 phase numbering, lines 412–413; planner's resolution: option (a) clean renumbering, recommended for cleanliness)
    - .planning/phases/01-agent-instructions-polish/01-CONTEXT.md (D-10 — full step 2; D-13 — field order locked)
  </read_first>
  <action>
    The planner resolution per PATTERNS.md ambiguity #4 is option (a) — clean renumbering. The new step 2 will be inserted as `### Phase F2 — Bartender Personalization` (Full track) and at the equivalent slot in the Minimalist track (`### Phase M2 — Bartender Personalization`). All existing F2..FN must shift to F3..F(N+1); all existing M2..MN must shift to M3..M(N+1). Apply uniformly to both files in the same task.

    PROCEDURE — execute these sub-steps in order, in BOTH files:

    1. Identify the highest existing Full-track phase number FN. (PATTERNS.md notes existing phases F1..F13 in the monolith; verify in the actual file before renaming, since drift may exist.)
    2. Renumber from the BOTTOM UP to avoid collisions. For Full track:
       - Find `### Phase F{FN} — `, replace with `### Phase F{FN+1} — `.
       - Then `### Phase F{FN-1} — ` → `### Phase F{FN} — `.
       - Continue until `### Phase F2 — ` → `### Phase F3 — `.
       - DO NOT touch `### Phase F1 — ` — it stays.
    3. Same procedure for Minimalist track (M2..MN renumbered to M3..M(N+1)).
    4. ALSO update specific in-prose cross-references. A pre-execution grep (`grep -nE 'Phase F[0-9]+|Phase M[0-9]+' barkeeper-instructions.md instructions/onboarding.md`) confirms the only NON-HEADER `Phase F{N}` / `Phase M{N}` cross-references in the body of either file are:

       | File | Line (pre-edit) | Old | New |
       |------|------------------|-----|-----|
       | `barkeeper-instructions.md` | inside the Phase M3 section, after the M3 header | `from Full Track Phase F4` | `from Full Track Phase F5` |
       | `instructions/onboarding.md` | inside the Phase M3 section, after the M3 header | `from Full Track Phase F4` | `from Full Track Phase F5` |

       (F4 in the original numbering is "Flavor Profile (the 6 axes)"; after the renumber it becomes F5. Both files have one occurrence each, both inside the M3-section body. There are NO other in-prose `Phase F{N}` or `Phase M{N}` references in either file — the rest are all `### Phase F{N} —` headers handled in steps 2–3 above.)

       After completing steps 2–3 (header renumber), re-run the same grep and verify the only remaining `Phase F4` / `Phase M4` etc. occurrences are the renumbered headers AND the two updated cross-references — no missed references and no introduced phantom references. If the pre-execution grep above ever surfaces a NEW match not listed in the table, STOP and resolve manually before continuing — the plan was written against the file state at the renumbering ambiguity resolution and any drift since then must be reviewed.
    5. After renumbering, verify the two files mirror each other: the same set of `### Phase F{N} — Title` headers must exist in both, with the same titles.

    DO NOT yet insert the new Phase F2 / Phase M2 — that is Task 2. This task only opens up the slot.

    Reasoning: D-10 LOCKS Bartender Personalization as step 2 of onboarding — that requires the slot at F2 / M2 to be available. PATTERNS.md flagged ambiguity #4 left the choice to the planner; the planning context locks option (a) clean renumbering for cleanliness. Doing the renumber as a separate task (rather than combined with the insertion) makes the diff reviewable: a renumber-only commit is mechanical and easy to verify; mixing it with content insertion makes review noisy.
  </action>
  <verify>
    <automated>cd /Users/glestryc/personal/github_repos/barkeeper-bjorn-website &amp;&amp; ! grep -E '^### Phase F2 ' barkeeper-instructions.md &amp;&amp; ! grep -E '^### Phase F2 ' instructions/onboarding.md &amp;&amp; grep -cE '^### Phase F[0-9]+ — ' barkeeper-instructions.md &amp;&amp; grep -cE '^### Phase F[0-9]+ — ' instructions/onboarding.md</automated>
  </verify>
  <acceptance_criteria>
    - The slot for the new Phase F2 is open: `grep -E '^### Phase F2 — ' barkeeper-instructions.md` exits 1 (no header at F2 yet); same for instructions/onboarding.md
    - Phase F1 still exists: `grep -E '^### Phase F1 — ' barkeeper-instructions.md` exits 0; same for instructions/onboarding.md
    - The same Full-track phase TITLES exist in both files (set equality, ignoring numbers): `comm -3 <(grep -oE '^### Phase F[0-9]+ — .*' barkeeper-instructions.md | sed -E 's/^### Phase F[0-9]+ — //' | sort) <(grep -oE '^### Phase F[0-9]+ — .*' instructions/onboarding.md | sed -E 's/^### Phase F[0-9]+ — //' | sort)` produces no output (all titles match)
    - Minimalist-track slot open similarly: `grep -E '^### Phase M2 — ' barkeeper-instructions.md` exits 1; same for instructions/onboarding.md
    - Minimalist M1 preserved: `grep -E '^### Phase M1 — ' barkeeper-instructions.md` exits 0; same for instructions/onboarding.md
    - Renumbering is contiguous (no gaps) — Full track: `grep -oE '^### Phase F[0-9]+ — ' barkeeper-instructions.md | grep -oE '[0-9]+' | sort -n | awk 'NR==1{prev=$1; next} $1==prev+1 {prev=$1; next} {print "GAP"; exit 1} END{print "OK"}'` returns `OK`
    - Same gap-check for instructions/onboarding.md and for the Minimalist track
    - In-prose cross-reference updated: `grep -F 'from Full Track Phase F5' barkeeper-instructions.md` exits 0 AND `grep -F 'from Full Track Phase F5' instructions/onboarding.md` exits 0
    - Old in-prose cross-reference removed: `! grep -F 'from Full Track Phase F4' barkeeper-instructions.md` AND `! grep -F 'from Full Track Phase F4' instructions/onboarding.md`
    - No stray in-prose phase references introduced or missed: `grep -nE 'Phase F[0-9]+|Phase M[0-9]+' barkeeper-instructions.md instructions/onboarding.md | grep -v -E '^[^:]+:[0-9]+:### Phase' | grep -v 'Phase F5' | wc -l` returns 0 (every non-header phase reference must be the renumbered F5; if any other matches exist, the renumber missed or introduced a reference)
    - Negative invariant — no `app/` files modified: `git diff --name-only HEAD | grep -c '^app/'` returns 0
  </acceptance_criteria>
  <done>
    Existing Full-track phases F2..FN have shifted to F3..F(N+1) in both `barkeeper-instructions.md` and `instructions/onboarding.md`. Same shift applied to Minimalist M2..MN. Phase F1 and Phase M1 are unchanged. The F2 / M2 slots are now empty and ready for the new Bartender Personalization step. In-prose phase references are updated. No `app/` files modified.
  </done>
</task>

<task type="auto">
  <name>Task 2: Insert new Phase F2 — Bartender Personalization (Full track) and new Phase M2 — Bartender Personalization (Minimalist track) into both files, with verbatim D-10 transition prompt and verbatim D-11/D-12 lists</name>
  <files>barkeeper-instructions.md, instructions/onboarding.md</files>
  <read_first>
    - barkeeper-instructions.md (focus the now-empty slot between Phase F1 and Phase F3, and between Phase M1 and Phase M3 — confirm Task 1 left those slots open)
    - instructions/onboarding.md (same — confirm Task 1 left F2 / M2 slots open)
    - .planning/phases/01-agent-instructions-polish/01-PATTERNS.md (Pattern 5 — Onboarding step header conventions, lines 144–174; S1 behavioral-rule blockquote; S3 italicized-quoted user-facing prompt)
    - .planning/phases/01-agent-instructions-polish/01-CONTEXT.md (D-10 transition wording verbatim; D-11 voice presets verbatim; D-12 specialty focus options verbatim; D-13 field order)
    - The existing Phase F1 — Bar Owner Profile section (just above the insertion point) — copy its formatting style for the intro line and numbered question list (PATTERNS.md Pattern 5 confirms `Ask in sequence, one at a time:` is the Full-track intro convention)
    - The existing Phase M1 section — copy its formatting style for the Minimalist insertion (typically `One question:` or italicized prompts)
  </read_first>
  <action>
    Two edits in this task. Each inserts the same Bartender Personalization step content at the appropriate slot. The Full-track and Minimalist-track variants differ slightly per PATTERNS.md Pattern 5 conventions.

    EDIT A — Full track. Insert the following NEW Phase F2 block between the end of the existing Phase F1 (Bar Owner Profile) section and the start of the renumbered Phase F3 section. Insert in BOTH `barkeeper-instructions.md` and `instructions/onboarding.md` verbatim:

    ```
    ### Phase F2 — Bartender Personalization

    Always present this as a full step — even for users who plan to keep defaults. The user must see the available voice presets and specialty options at least once before onboarding continues.

    > *"Before we go further — I'm Barkeeper Bjorn by default, but let's make sure I'm set up right for you."*

    Ask in sequence, one at a time (D-13 field order locked: name → voice preset → specialty focus):

    1. **Bartender name.** *"What would you like to call me? (default: Barkeeper Bjorn)"* — accept the default if the user opts to keep it; otherwise record the chosen name. Persist to `barkeeper.md`.
    2. **Voice preset.** Present these five options and ask the user to pick one:
       1. **Professional & measured** — formal, knowledgeable, composed
       2. **Warm & playful** — friendly, encouraging, a little cheeky
       3. **Terse & opinionated** — minimal words, strong opinions, no hedging
       4. **Theatrical & verbose** — dramatic flair, storytelling, rich descriptions
       5. **Nerdy / analytical** — data-driven, talks ratios and chemistry, explains the science

       Record the selection. Persist to `barkeeper.md`.
    3. **Specialty focus.** Present these five options and ask the user to pick one:
       1. **Classics (pre-Prohibition and golden-era cocktails)**
       2. **Modern / contemporary**
       3. **Tiki / tropical**
       4. **NA-forward (non-alcoholic and low-ABV)**
       5. **No preference (broad and balanced)**

       Record the selection. Persist to `barkeeper.md`.

    Do not combine these three questions into one message — the one-question-at-a-time rule applies (see the rule blockquote earlier in this file). Wait for each answer before asking the next.
    ```

    EDIT B — Minimalist track. Insert the following NEW Phase M2 block between the end of the existing Phase M1 section and the start of the renumbered Phase M3 section. Insert in BOTH files verbatim. The Minimalist variant abbreviates the prose around each option (per PATTERNS.md Pattern 5: Minimalist track uses italicized question prompts) but keeps the lists verbatim:

    ```
    ### Phase M2 — Bartender Personalization

    Always present this as a full step — even in Minimalist mode. The five voice presets and five specialty options are shown to the user at least once.

    > *"Before we go further — I'm Barkeeper Bjorn by default, but let's make sure I'm set up right for you."*

    Three questions, one at a time (D-13 order locked: name → voice preset → specialty focus):

    > *"What would you like to call me? (default: Barkeeper Bjorn)"*

    Then voice preset:

    > *"Pick a voice preset:*
    > *1. Professional & measured — formal, knowledgeable, composed*
    > *2. Warm & playful — friendly, encouraging, a little cheeky*
    > *3. Terse & opinionated — minimal words, strong opinions, no hedging*
    > *4. Theatrical & verbose — dramatic flair, storytelling, rich descriptions*
    > *5. Nerdy / analytical — data-driven, talks ratios and chemistry, explains the science"*

    Then specialty focus:

    > *"Pick a specialty focus:*
    > *1. Classics (pre-Prohibition and golden-era cocktails)*
    > *2. Modern / contemporary*
    > *3. Tiki / tropical*
    > *4. NA-forward (non-alcoholic and low-ABV)*
    > *5. No preference (broad and balanced)"*

    Persist all three answers to `barkeeper.md`.
    ```

    Notes for the executor:
    - The transition prompt blockquote (`> *"Before we go further..."*`) is verbatim D-10 from CONTEXT.md. Do not reword.
    - The voice preset 5-item list is verbatim D-11 from CONTEXT.md. The `**Bold name** — descriptor` form for each item matches CONTEXT.md exactly. Do not reorder; do not add or drop items.
    - The specialty focus 5-item list is verbatim D-12 from CONTEXT.md. Do not reword the parenthetical clarifications (e.g., "(pre-Prohibition and golden-era cocktails)", "(non-alcoholic and low-ABV)", "(broad and balanced)") — they are part of the locked text.
    - The "Persist to `barkeeper.md`" line at the end of each item is the integration point with the existing barkeeper.md write target (CONTEXT.md notes the existing onboarding writes persona updates to `barkeeper.md` at the end — by writing earlier, this step does not change the WRITE target, only the timing).
    - For BOTH files, the Full-track insertion text is byte-identical and the Minimalist-track insertion text is byte-identical (mirror invariant S2).

    Reasoning: D-10 LOCKS the step as a full step (the prose says "even for users who plan to keep defaults"). D-11 and D-12 LOCK the lists. D-13 LOCKS the field order. PATTERNS.md Pattern 5 documents the Full-track convention (`### Phase FN — Title` + `Ask in sequence, one at a time:` + numbered list) and the Minimalist convention (italicized blockquoted prompts). Inserting the Full and Minimalist variants in the same task keeps the mirror visible to the executor. The descriptor text for each preset/option is copied directly from CONTEXT.md so the executor does not need to switch files mid-task — verbatim copying is required by the planning-context quality gate (D-11 and D-12 lists must be pasted, not referenced).
  </action>
  <verify>
    <automated>cd /Users/glestryc/personal/github_repos/barkeeper-bjorn-website &amp;&amp; grep -F 'Phase F2 — Bartender Personalization' barkeeper-instructions.md &amp;&amp; grep -F 'Phase F2 — Bartender Personalization' instructions/onboarding.md &amp;&amp; grep -F 'Phase M2 — Bartender Personalization' barkeeper-instructions.md &amp;&amp; grep -F 'Phase M2 — Bartender Personalization' instructions/onboarding.md &amp;&amp; grep -F 'Theatrical &amp; verbose' barkeeper-instructions.md instructions/onboarding.md &amp;&amp; grep -F 'NA-forward (non-alcoholic and low-ABV)' barkeeper-instructions.md instructions/onboarding.md &amp;&amp; grep -F 'Before we go further — I'\''m Barkeeper Bjorn by default' barkeeper-instructions.md instructions/onboarding.md</automated>
  </verify>
  <acceptance_criteria>
    - Phase F2 header present in both files: `grep -E '^### Phase F2 — Bartender Personalization' barkeeper-instructions.md` exits 0; `grep -E '^### Phase F2 — Bartender Personalization' instructions/onboarding.md` exits 0
    - Phase M2 header present in both files: `grep -E '^### Phase M2 — Bartender Personalization' barkeeper-instructions.md` exits 0; `grep -E '^### Phase M2 — Bartender Personalization' instructions/onboarding.md` exits 0
    - D-10 verbatim transition present in both files: `grep -F "Before we go further — I'm Barkeeper Bjorn by default, but let's make sure I'm set up right for you." barkeeper-instructions.md` exits 0; same for instructions/onboarding.md. Each file should contain this string at least 2 times (once in Phase F2, once in Phase M2): `grep -c "Before we go further — I'm Barkeeper Bjorn by default" barkeeper-instructions.md` returns at least 2; same for instructions/onboarding.md
    - D-11 voice preset list — all 5 items present verbatim in both files:
      - `grep -F 'Professional & measured' barkeeper-instructions.md instructions/onboarding.md` exits 0
      - `grep -F 'Warm & playful' barkeeper-instructions.md instructions/onboarding.md` exits 0
      - `grep -F 'Terse & opinionated' barkeeper-instructions.md instructions/onboarding.md` exits 0
      - `grep -F 'Theatrical & verbose' barkeeper-instructions.md instructions/onboarding.md` exits 0
      - `grep -F 'Nerdy / analytical' barkeeper-instructions.md instructions/onboarding.md` exits 0
      - Descriptor text verbatim: `grep -F 'data-driven, talks ratios and chemistry, explains the science' barkeeper-instructions.md instructions/onboarding.md` exits 0
    - D-12 specialty focus list — all 5 items present verbatim in both files:
      - `grep -F 'Classics (pre-Prohibition and golden-era cocktails)' barkeeper-instructions.md instructions/onboarding.md` exits 0
      - `grep -F 'Modern / contemporary' barkeeper-instructions.md instructions/onboarding.md` exits 0
      - `grep -F 'Tiki / tropical' barkeeper-instructions.md instructions/onboarding.md` exits 0
      - `grep -F 'NA-forward (non-alcoholic and low-ABV)' barkeeper-instructions.md instructions/onboarding.md` exits 0
      - `grep -F 'No preference (broad and balanced)' barkeeper-instructions.md instructions/onboarding.md` exits 0
    - D-13 field order check — within Phase F2 of barkeeper-instructions.md, the bartender-name question precedes the voice-preset list, which precedes the specialty-focus list. Run: `awk '/^### Phase F2 — Bartender Personalization/,/^### Phase F3 — /' barkeeper-instructions.md > /tmp/f2-monolith.txt && grep -n -F 'Bartender name.' /tmp/f2-monolith.txt && grep -n -F 'Voice preset.' /tmp/f2-monolith.txt && grep -n -F 'Specialty focus.' /tmp/f2-monolith.txt` — line numbers must be strictly increasing
    - Mirror symmetry — the Phase F2 block has the same content in both files. Run `diff <(awk '/^### Phase F2 — Bartender Personalization/,/^### Phase F3 — /' barkeeper-instructions.md) <(awk '/^### Phase F2 — Bartender Personalization/,/^### Phase F3 — /' instructions/onboarding.md)` — output is empty (exit 0)
    - Same mirror check for Phase M2: `diff <(awk '/^### Phase M2 — Bartender Personalization/,/^### Phase M3 — /' barkeeper-instructions.md) <(awk '/^### Phase M2 — Bartender Personalization/,/^### Phase M3 — /' instructions/onboarding.md)` — output is empty (exit 0)
    - Negative grep — the previous step 2 header `### Phase F2 — Bar Equipment & Tools` (or whatever Phase F1's neighbor was titled) does NOT appear at the F2 slot now: `grep -E '^### Phase F2 — Bar Owner Profile' barkeeper-instructions.md` exits 1 (Bar Owner Profile is F1; F2 must be Bartender Personalization)
    - Negative invariant — no `app/` files modified: `git diff --name-only HEAD | grep -c '^app/'` returns 0
  </acceptance_criteria>
  <done>
    Both `barkeeper-instructions.md` and `instructions/onboarding.md` contain a new `### Phase F2 — Bartender Personalization` block (Full track) and a new `### Phase M2 — Bartender Personalization` block (Minimalist track). Each block contains the verbatim D-10 transition prompt, the verbatim D-11 5-item voice preset list, and the verbatim D-12 5-item specialty focus list, in the D-13 locked order (name → voice preset → specialty focus). The two files mirror each other on both the F2 and M2 blocks. Step renumbering from Task 1 holds. No `app/` files modified.
  </done>
</task>

</tasks>

<verification>
After all tasks:
- `grep -cE '^### Phase F2 — Bartender Personalization' barkeeper-instructions.md instructions/onboarding.md` returns ≥1 per file
- `grep -cE '^### Phase M2 — Bartender Personalization' barkeeper-instructions.md instructions/onboarding.md` returns ≥1 per file
- All 5 D-11 voice presets present verbatim in both files (Professional & measured, Warm & playful, Terse & opinionated, Theatrical & verbose, Nerdy / analytical)
- All 5 D-12 specialty options present verbatim in both files (Classics (pre-Prohibition and golden-era cocktails), Modern / contemporary, Tiki / tropical, NA-forward (non-alcoholic and low-ABV), No preference (broad and balanced))
- D-13 field order: within each Phase F2 and Phase M2 block, "Bartender name" precedes "Voice preset" precedes "Specialty focus"
- Mirror invariant: F2 and M2 blocks are byte-identical between barkeeper-instructions.md and instructions/onboarding.md
- Renumbering invariant: Phase F1 (Bar Owner Profile) is the only F1 header; the previous Phase F2 has shifted to F3; same for Minimalist
- No file outside `files_modified` is touched (git diff verifies)
</verification>

<success_criteria>
- AGENT-06 closed: bartender personalization is now step 2 of agent onboarding (immediately after user name and location), in both Full and Minimalist tracks, in both monolith and module files
- D-10 enforced: the new step is a full step (not skip-friendly) and uses the verbatim transition prompt
- D-11 enforced: 5 voice presets, verbatim from CONTEXT.md
- D-12 enforced: 5 specialty options, verbatim from CONTEXT.md
- D-13 enforced: field order is name → voice preset → specialty focus, asked one at a time
- Mirror invariant intact: barkeeper-instructions.md and instructions/onboarding.md are byte-identical on Phase F2 and Phase M2 inserts; previous F2..FN and M2..MN are renumbered consistently
- Negative invariant: no `app/` files modified — Phase 2 will mirror this step in the web UI wizard separately
</success_criteria>

<output>
After completion, create `.planning/phases/01-agent-instructions-polish/01-05-SUMMARY.md` per templates/summary.md.
</output>
