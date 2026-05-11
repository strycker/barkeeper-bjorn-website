---
phase: 01-agent-instructions-polish
plan: 03
type: execute
wave: 1
depends_on: []
files_modified:
  - barkeeper-instructions.md
autonomous: true
requirements: [AGENT-03]
must_haves:
  truths:
    - "D-05: After a new original is confirmed, Bjorn auto-produces THREE image-prompt variants (A Photorealistic, B Illustrated/painterly, C Vintage/retro 1920s–1960s) without asking for permission. Note the ROADMAP success criterion mentions 'two variants' — this plan honors D-05's locked count of three."
    - "D-05: The Vintage / retro variant explicitly references 1920s–1960s cocktail book illustration style (Trader Vic-era aesthetic per CONTEXT.md Specifics)"
    - "D-05: The variants are produced AUTOMATICALLY ('without asking') — the existing 'offer to suggest' wording must be replaced with a 'produce' / 'generate' wording"
    - "D-06: Image-prompt content uses cocktail name + tagline + color palette (derived from base spirit + key modifiers) + occasion. Flavor axes are explicitly excluded."
    - "D-07: A one-line save reminder is appended after the three variants, in italicized-quoted blockquote form (S3 pattern), using the verbatim wording from CONTEXT.md"
    - "Mirror obligation S2: instructions/communication.md (modular communication module) is reviewed for image-prompt rule mirror; if no image-prompt rule lives in communication.md (per PATTERNS.md, the canonical block is in barkeeper-instructions.md §6 only), no mirror change is required there beyond the D-08-adjacent image-format note (handled in plan 04)"
  artifacts:
    - path: "barkeeper-instructions.md"
      provides: "Three-variant auto-generation image-prompt rule (D-05/D-06/D-07) replacing the existing two-variant 'offer to suggest' rule at §Original Cocktails item 6"
      contains: "Variant C — Vintage / retro"
    - path: "barkeeper-instructions.md"
      provides: "Verbatim D-07 save-reminder blockquote after the three variants"
      contains: "Save to `images/` as `[cocktailN]-image.png`"
  key_links:
    - from: "barkeeper-instructions.md (§Original Cocktails item 6, lines 483–489)"
      to: "the recipe template image field (handled in plan 04)"
      via: "D-07 save reminder cross-references the `<img>` tag format from the recipe template — wording is 'link it in `recipes.md` with the `<img>` tag format' so the save reminder is forward-compatible with plan 04's D-08 update"
      pattern: "link it in `recipes.md` with the `<img>` tag format"
---

<objective>
Replace the existing two-variant "offer to suggest" image-prompt rule in `barkeeper-instructions.md` §Original Cocktails item 6 with a three-variant auto-generation rule (D-05) whose prompt content is driven by name + tagline + color palette + occasion (D-06, flavor axes excluded), followed by a verbatim italicized save-reminder blockquote (D-07). Closes AGENT-03.

Purpose: Today the rule reads "When a new original is confirmed, **offer** to suggest image generation prompts" (permission-asking) and lists only two variants. D-05 changes the trigger from "offer" to "automatically produce" and expands to three variants; D-06 specifies the prompt-content inputs (and excludes flavor axes — currently nothing rules them out, so a model could leak axes into prompts); D-07 adds a save-reminder so the user gets a paste-ready filename hint immediately after the variants. The ROADMAP success criterion in §Phase 1 says "two variants" — that text was written before D-05 locked three; this plan honors the locked decision and the must_haves explicitly cite three.
Output: One modified markdown file (`barkeeper-instructions.md`). The mirror obligation check on `instructions/communication.md` confirms no image-prompt rule lives there (per PATTERNS.md the rule is unique to the monolith's §Original Cocktails item 6) — communication.md is named in `files_modified` for the per-task confirmation step but receives no content changes in this plan.
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
  <name>Task 1: Confirm mirror scope — verify no image-prompt rule lives in instructions/communication.md</name>
  <files>instructions/communication.md</files>
  <read_first>
    - instructions/communication.md (full file — short module, ~42 lines)
    - .planning/phases/01-agent-instructions-polish/01-PATTERNS.md (the `instructions/communication.md` section lines 227–253 — confirms communication.md only contains a Pattern 2 image-format note about the `<img>` tag width, NOT an image-prompt rule)
    - .planning/phases/01-agent-instructions-polish/01-CONTEXT.md (D-05/D-06/D-07)
  </read_first>
  <action>
    This is a verification task — the executor reads `instructions/communication.md` end-to-end and confirms two facts:

    (1) The file does NOT contain any image-prompt-generation rule (no language about "Photorealistic", "Illustrated", "Variant", or "image generation prompts" — only the Formatting Defaults bullet at line 42 about `<img>` tag width, which belongs to D-08 and is handled in plan 04).

    (2) Therefore the mirror obligation S2 from PATTERNS.md does NOT apply to image-prompt content for this plan: D-05/D-06/D-07 changes land only in `barkeeper-instructions.md` §Original Cocktails item 6.

    No file modifications in this task. The executor records the confirmation in the plan summary.

    If the executor finds image-prompt language in communication.md (for example a future change to PATTERNS.md may have added one), STOP and surface it — D-05/D-06/D-07 must then mirror into communication.md as well, and this plan's `files_modified` list (which currently does NOT include communication.md, since the canonical block lives in barkeeper-instructions.md only) must be amended to add it before the mirror edit is applied.

    Reasoning: the planning-context note for plan 03 said `instructions/communication.md` is in `files_modified` if-and-only-if image-prompt rule lives in a Communication Style mirror — confirm against PATTERNS.md before writing. PATTERNS.md confirms the rule is monolith-only; this task makes that confirmation explicit and falsifiable so the executor cannot silently skip a mirror that turns out to be needed.
  </action>
  <verify>
    <automated>cd /Users/glestryc/personal/github_repos/barkeeper-bjorn-website &amp;&amp; ! grep -E 'Photorealistic|Illustrated/painterly|Vintage / retro|image generation prompt|Variant A|Variant B|Variant C' instructions/communication.md</automated>
  </verify>
  <acceptance_criteria>
    - `grep -E 'Photorealistic|Illustrated/painterly|Vintage / retro|image generation prompt|Variant A|Variant B|Variant C' instructions/communication.md` exits 1 (no matches — confirmed no image-prompt rule in the module)
    - `git diff --name-only HEAD -- instructions/communication.md | grep -c .` returns 0 (no modification by this task)
  </acceptance_criteria>
  <done>
    The executor has read instructions/communication.md and confirmed in writing that no image-prompt-generation rule exists there. instructions/communication.md is unmodified. The next task can land D-05/D-06/D-07 in barkeeper-instructions.md only.
  </done>
</task>

<task type="auto">
  <name>Task 2: Replace barkeeper-instructions.md §Original Cocktails item 6 with three-variant auto-generation rule + D-07 save reminder</name>
  <files>barkeeper-instructions.md</files>
  <read_first>
    - barkeeper-instructions.md (focus lines 483–489 — the existing `### Original Cocktails` item 6 "Cocktail artwork" block; READ the entire block including the trailing prose paragraph and the existing filename-convention sentence)
    - .planning/phases/01-agent-instructions-polish/01-PATTERNS.md (Pattern 4 — Image-prompt instruction block, lines 116–142; S1 behavioral-rule blockquote pattern; S3 italicized-quoted user-facing prompt pattern)
    - .planning/phases/01-agent-instructions-polish/01-CONTEXT.md (D-05, D-06, D-07 + Specifics line about Trader Vic 1920s–1960s aesthetic for Variant C)
  </read_first>
  <action>
    Edit `barkeeper-instructions.md`. Locate the numbered item 6 inside the `### Original Cocktails` section (currently at lines 483–489, beginning `6. **Cocktail artwork:** When a new original is confirmed, offer to suggest image generation prompts...`).

    REPLACE the entire item-6 block (header line + the two indented bullet variants + the "Tailor both prompts..." prose + the filename-convention sentence at line 489) with the following replacement block. Preserve the surrounding context: the numbering (this remains item `6.` under §Original Cocktails) and any blank lines before item 5 / after the new block must stay intact. Only the contents OF item 6 are rewritten.

    Replacement block (verbatim — the executor pastes this in place of the existing item 6, preserving the no-extra-indent / 3-space-sub-bullet style observed in the existing item 6):

    ```
    6. **Cocktail artwork:** When a new original is confirmed, automatically generate three image-prompt variants the user can paste into Midjourney, DALL-E, Ideogram, or any image model. Do not ask permission first — produce the prompts as part of the confirmation reply. Tailor every prompt to the specific drink: build it from the cocktail name and tagline, the color palette derived from the base spirit and the key modifiers, and the occasion the drink is designed for. Do **not** include the user's flavor axes in the prompt — those describe the user's palate, not the drink's image.

       - **Variant A — Photorealistic:** cinematic close-up, dramatic lighting, the cocktail glass on a surface that matches the drink's character (dark marble for spirit-forward; weathered bar top for classics; beach wood for tropical; linen for aperitif). Include the dominant garnish or visual ingredient. Include the color palette in the prompt as concrete color words ("amber", "smoke-grey", "ruby"), not flavor descriptors.
       - **Variant B — Illustrated / painterly:** editorial illustration, watercolor, or Art Deco — match the aesthetic to the drink's era and personality. Use the same color palette as Variant A. Reference the tagline as the mood directive.
       - **Variant C — Vintage / retro:** 1920s–1960s cocktail book illustration style — Trader Vic, Esquire mid-century, golden-era hotel-bar menu art. Hand-inked line work with limited spot color, paper texture optional. Same color palette and occasion cues as the other variants.

    > *"Save to `images/` as `[cocktailN]-image.png` and link it in `recipes.md` with the `<img>` tag format."*
    ```

    Notes for the executor:
    - When pasting, strip the 4-space indentation shown above (it is included only to keep the example inside this PLAN.md's own list-item context). The actual file-edit indentation is: item 6 starts at column 0; the three sub-bullets start at column 3 (3 spaces) — same as the existing item-6 sub-bullets per PATTERNS.md Pattern 4.
    - The `>` line at the end is a one-line italicized blockquote (S3 pattern from PATTERNS.md). It must sit OUTSIDE the numbered-list item — i.e., after a blank line that closes item 6 — at column 0. This makes it a top-level blockquote at the section level, which keeps it visually distinct as a save-reminder rather than a fourth bullet under the variants.
    - The italicized text inside the blockquote is verbatim D-07 from CONTEXT.md — do not rephrase, capitalize, or change punctuation.
    - The phrase `link it in \`recipes.md\` with the \`<img>\` tag format` deliberately references the recipe template that plan 04 will update. This is intentional — plan 04 lands the matching `<img>` tag pattern in `recipes.md`, `barkeeper-instructions.md`, and `instructions/communication.md` so the save-reminder cross-reference resolves consistently.

    Reasoning: D-05 LOCKS three variants and the auto-generation behavior — the existing "offer to suggest" wording is replaced with "automatically generate ... do not ask permission first". D-06 LOCKS the prompt-content inputs (name + tagline + color palette + occasion) and the explicit exclusion of flavor axes — both are baked into the parent paragraph so the rule cannot be misread. D-07 LOCKS the exact save-reminder wording — copied verbatim. PATTERNS.md Pattern 4 documents the indentation style of the existing variants list and confirms the save-reminder is a one-line italicized blockquote (S3) inserted between the variants and any trailing prose. The Trader Vic / 1920s–1960s phrasing for Variant C comes from CONTEXT.md "Specifics".
  </action>
  <verify>
    <automated>cd /Users/glestryc/personal/github_repos/barkeeper-bjorn-website &amp;&amp; grep -F 'Variant A — Photorealistic' barkeeper-instructions.md &amp;&amp; grep -F 'Variant B — Illustrated / painterly' barkeeper-instructions.md &amp;&amp; grep -F 'Variant C — Vintage / retro' barkeeper-instructions.md &amp;&amp; grep -F '1920s–1960s cocktail book illustration style' barkeeper-instructions.md &amp;&amp; grep -F 'Save to `images/` as `[cocktailN]-image.png`' barkeeper-instructions.md &amp;&amp; grep -F 'automatically generate three image-prompt variants' barkeeper-instructions.md</automated>
  </verify>
  <acceptance_criteria>
    - `grep -F 'Variant A — Photorealistic' barkeeper-instructions.md` exits 0
    - `grep -F 'Variant B — Illustrated / painterly' barkeeper-instructions.md` exits 0
    - `grep -F 'Variant C — Vintage / retro' barkeeper-instructions.md` exits 0
    - `grep -F '1920s–1960s cocktail book illustration style' barkeeper-instructions.md` exits 0
    - `grep -F 'automatically generate three image-prompt variants' barkeeper-instructions.md` exits 0
    - D-06 flavor-axes exclusion language present: `grep -F "Do **not** include the user's flavor axes" barkeeper-instructions.md` exits 0
    - D-07 save-reminder verbatim: `grep -F 'Save to `images/` as `[cocktailN]-image.png` and link it in `recipes.md` with the `<img>` tag format.' barkeeper-instructions.md` exits 0
    - Negative grep — the OLD permission-asking phrasing is gone: `grep -F 'offer to suggest image generation prompts' barkeeper-instructions.md` exits 1
    - Negative grep — the OLD two-variant wording is gone: `grep -F 'Provide two prompt variants:' barkeeper-instructions.md` exits 1
    - Variant count check (positive): `grep -c '\*\*Variant [ABC] —' barkeeper-instructions.md` returns at least 3
    - Negative invariant — no `app/` files modified by this task: `git diff --name-only HEAD | grep -c '^app/'` returns 0
    - Mirror sanity — no image-prompt rule was incidentally added to communication.md: `grep -E 'Photorealistic|Illustrated/painterly|Vintage / retro|Variant A|Variant B|Variant C' instructions/communication.md` exits 1
  </acceptance_criteria>
  <done>
    `barkeeper-instructions.md` §Original Cocktails item 6 contains three labeled variants (A Photorealistic, B Illustrated/painterly, C Vintage/retro), the auto-generate (no-ask-permission) trigger language, the D-06 prompt-content directive that excludes flavor axes, and the verbatim D-07 save-reminder blockquote immediately after the variants. The OLD two-variant "offer to suggest" prose is gone. `instructions/communication.md` is unmodified. No `app/` files modified.
  </done>
</task>

</tasks>

<verification>
After all tasks:
- `grep -c '\*\*Variant [ABC] —' barkeeper-instructions.md` returns ≥3
- `grep -F '1920s–1960s cocktail book illustration style' barkeeper-instructions.md` returns 1 hit
- `grep -F 'Save to `images/` as `[cocktailN]-image.png`' barkeeper-instructions.md` returns 1 hit
- `grep -F 'offer to suggest image generation prompts' barkeeper-instructions.md` returns 0 hits (old language removed)
- `instructions/communication.md` is unchanged (`git diff --name-only HEAD -- instructions/communication.md` is empty)
- No file outside `files_modified` is touched (git diff verifies)
</verification>

<success_criteria>
- AGENT-03 closed: confirming a new original triggers an automatic three-variant image-prompt block with D-06 prompt-content directives and a D-07 save reminder
- D-05 enforced: three variants (A/B/C), all generated without asking, with C explicitly the 1920s–1960s vintage style
- D-06 enforced: name + tagline + color palette + occasion drive prompts; flavor axes are explicitly excluded
- D-07 enforced: verbatim save-reminder italicized blockquote present
- Mirror invariant intact: `instructions/communication.md` confirmed to have no image-prompt rule and is unmodified
- Negative invariant: no `app/` files modified
</success_criteria>

<output>
After completion, create `.planning/phases/01-agent-instructions-polish/01-03-SUMMARY.md` per templates/summary.md.
</output>
