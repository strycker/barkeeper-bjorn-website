---
phase: 01-agent-instructions-polish
plan: 04
type: execute
wave: 1
depends_on: []
files_modified:
  - barkeeper-instructions.md
  - recipes.md
  - instructions/communication.md
autonomous: true
requirements: [AGENT-04]
must_haves:
  truths:
    - "D-08: All three sync points (barkeeper-instructions.md recipe template, recipes.md recipe template, instructions/communication.md image-format note) use the SAME canonical `<img>` form: width=\"400\" and the kebab filename pattern `[cocktailN]-image.png`"
    - "D-08: The previous canonical values width=\"200\" and `[cocktailN]_short_name_001.png` no longer appear at any of the three sync points"
    - "Mirror invariant S4 (recipe-template <img> tag, PATTERNS.md): the <img> form is uniform across barkeeper-instructions.md, recipes.md, and instructions/communication.md"
    - "Compatibility invariant: the new filename pattern `[cocktailN]-image.png` matches the D-07 save reminder in plan 03 — both files cross-reference each other consistently"
  artifacts:
    - path: "barkeeper-instructions.md"
      provides: "Updated recipe-template Image field using width=\"400\" and `[cocktailN]-image.png`"
      contains: 'width="400"'
    - path: "recipes.md"
      provides: "Updated recipe-template Image field using width=\"400\" and `[cocktailN]-image.png`"
      contains: 'width="400"'
    - path: "instructions/communication.md"
      provides: "Updated Formatting Defaults image-format note using width=\"400\""
      contains: 'width="400"'
  key_links:
    - from: "barkeeper-instructions.md (recipe template Image line, line 529)"
      to: "recipes.md (recipe template Image line, line 30)"
      via: "Mirror obligation S4 — same `<img>` tag form in both files"
      pattern: '\[cocktailN\]-image\.png'
    - from: "recipes.md (Image line)"
      to: "instructions/communication.md (Formatting Defaults image-format note, line 42)"
      via: "Mirror obligation S4 — width value must match the canonical recipe-template width"
      pattern: 'width="400"'
    - from: "barkeeper-instructions.md (D-07 save reminder from plan 03)"
      to: "barkeeper-instructions.md and recipes.md (recipe-template Image line)"
      via: "The save reminder text `[cocktailN]-image.png` must equal the filename pattern in the recipe template — set by D-08"
      pattern: '\[cocktailN\]-image\.png'
---

<objective>
Update the recipe-template `<img>` tag at all three sync points (D-08) so the canonical form is `width="400"` with the kebab filename pattern `images/[cocktailN]-image.png`. Closes AGENT-04.

Purpose: The current canonical example uses `width="200"` and the older snake-case + numeric-suffix filename `[cocktailN]_short_name_001.png`. CONTEXT.md D-08 LOCKS the form to `width="400"` and `[cocktailN]-image.png`. PATTERNS.md flagged this as ambiguity #1 — the planner has resolved it in favor of D-08 verbatim. The rule must hold uniformly because (a) PATTERNS.md S4 (mirror invariant) requires it across all three sync points, and (b) the D-07 save-reminder added in plan 03 already uses `[cocktailN]-image.png`, so any sync point still using the old filename creates a self-contradicting reference.
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
@recipes.md
@instructions/communication.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update barkeeper-instructions.md and recipes.md recipe-template Image field to D-08 canonical form</name>
  <files>barkeeper-instructions.md, recipes.md</files>
  <read_first>
    - barkeeper-instructions.md (focus line 529 — the existing recipe-template Image line, currently `**Image:** <img src="https://raw.githubusercontent.com/USERNAME/barkeeper-bjorn/refs/heads/BRANCH/images/[cocktailN]_short_name_001.png" width="200"> *(optional — replace USERNAME and BRANCH; add multiple img tags for alternates)*`)
    - recipes.md (focus line 30 — same Image line as in the monolith template)
    - .planning/phases/01-agent-instructions-polish/01-PATTERNS.md (Pattern 3 — Recipe template with image field, lines 99–114; flagged ambiguity #1 lines 405–406; S4 mirror invariant)
    - .planning/phases/01-agent-instructions-polish/01-CONTEXT.md (D-08)
  </read_first>
  <action>
    Two edits in this task — apply both atomically (the mirror obligation S4 requires they land together).

    EDIT A — barkeeper-instructions.md line 529. Replace the existing line:
    `**Image:** <img src="https://raw.githubusercontent.com/USERNAME/barkeeper-bjorn/refs/heads/BRANCH/images/[cocktailN]_short_name_001.png" width="200"> *(optional — replace USERNAME and BRANCH; add multiple img tags for alternates)*`

    With:
    `**Image:** <img src="https://raw.githubusercontent.com/USERNAME/barkeeper-bjorn/refs/heads/BRANCH/images/[cocktailN]-image.png" width="400" alt="[Drink Name]"> *(optional — replace USERNAME and BRANCH; add multiple img tags for alternates)*`

    Three changes vs. the original: (i) filename `[cocktailN]_short_name_001.png` → `[cocktailN]-image.png`, (ii) `width="200"` → `width="400"`, (iii) added `alt="[Drink Name]"` attribute (per CONTEXT.md D-08 — the locked form includes the alt attribute). Everything else (the `**Image:**` label, the `https://raw.githubusercontent.com/USERNAME/barkeeper-bjorn/refs/heads/BRANCH/images/` URL stem, and the trailing italicized parenthetical) is preserved verbatim, including the `USERNAME` and `BRANCH` placeholders.

    EDIT B — recipes.md line 30. Apply the identical replacement: same source line → same target line. The two files must read identically on this line after the edit (apart from the surrounding fenced-code-block context which is structural, not content).

    Reasoning: D-08 LOCKS the canonical form to `width="400"` and `[cocktailN]-image.png` with an `alt` attribute. PATTERNS.md Pattern 3 documents both files using the older form (`width="200"`, snake-case + `_001` suffix) and pins the change to a uniform replacement across both. PATTERNS.md S4 demands mirror symmetry. The new form is also the form referenced by the D-07 save reminder (plan 03) — keeping the filenames identical eliminates the reference drift. PATTERNS.md noted that flagged ambiguity #1 was already resolved in favor of D-08 verbatim by CONTEXT.md, so the executor does not have a choice here: D-08 is LOCKED text.
  </action>
  <verify>
    <automated>cd /Users/glestryc/personal/github_repos/barkeeper-bjorn-website &amp;&amp; grep -F '[cocktailN]-image.png" width="400"' barkeeper-instructions.md &amp;&amp; grep -F '[cocktailN]-image.png" width="400"' recipes.md &amp;&amp; ! grep -F '[cocktailN]_short_name_001.png' barkeeper-instructions.md &amp;&amp; ! grep -F '[cocktailN]_short_name_001.png' recipes.md</automated>
  </verify>
  <acceptance_criteria>
    - Positive grep — new form present in both files: `grep -F '[cocktailN]-image.png" width="400"' barkeeper-instructions.md` exits 0; `grep -F '[cocktailN]-image.png" width="400"' recipes.md` exits 0
    - Positive grep — alt attribute present in both files: `grep -F 'alt="[Drink Name]"' barkeeper-instructions.md` exits 0; `grep -F 'alt="[Drink Name]"' recipes.md` exits 0
    - Negative grep — old filename pattern absent in both files: `grep -F '[cocktailN]_short_name_001.png' barkeeper-instructions.md` exits 1; `grep -F '[cocktailN]_short_name_001.png' recipes.md` exits 1
    - Negative grep — old width value absent on the Image line in barkeeper-instructions.md: `grep -F '[cocktailN]_short_name_001.png" width="200"' barkeeper-instructions.md` exits 1
    - Negative grep — old width value absent on the Image line in recipes.md: `grep -F '[cocktailN]_short_name_001.png" width="200"' recipes.md` exits 1
    - Mirror symmetry: the `**Image:**` line is byte-identical between the two files. Run `diff <(grep -F '**Image:** <img src="https://raw.githubusercontent.com/USERNAME/barkeeper-bjorn/refs/heads/BRANCH/images/[cocktailN]-image.png"' barkeeper-instructions.md) <(grep -F '**Image:** <img src="https://raw.githubusercontent.com/USERNAME/barkeeper-bjorn/refs/heads/BRANCH/images/[cocktailN]-image.png"' recipes.md)` — output is empty (exit 0)
    - URL stem preserved (no accidental rewrite): `grep -F 'https://raw.githubusercontent.com/USERNAME/barkeeper-bjorn/refs/heads/BRANCH/images/' barkeeper-instructions.md` exits 0 and same in recipes.md
    - Negative invariant — no `app/` files modified: `git diff --name-only HEAD | grep -c '^app/'` returns 0
  </acceptance_criteria>
  <done>
    Both `barkeeper-instructions.md` line 529 and `recipes.md` line 30 use the D-08 canonical Image-line form: `width="400"`, filename `[cocktailN]-image.png`, alt attribute `[Drink Name]`. The previous `width="200"` and `_short_name_001.png` patterns have been removed from both files at this sync point. The two lines are byte-identical.
  </done>
</task>

<task type="auto">
  <name>Task 2: Update instructions/communication.md Formatting Defaults image-format note to width="400" (D-08 mirror)</name>
  <files>instructions/communication.md</files>
  <read_first>
    - instructions/communication.md (focus line 42 — the Formatting Defaults bullet currently reading `Images use \`<img src="..." width="200">\` HTML tag — not markdown \`![]()\` syntax, since width control matters.`)
    - .planning/phases/01-agent-instructions-polish/01-PATTERNS.md (instructions/communication.md Pattern 2 — Image format note, lines 247–253; S4 mirror invariant)
    - .planning/phases/01-agent-instructions-polish/01-CONTEXT.md (D-08)
  </read_first>
  <action>
    Edit `instructions/communication.md` line 42. Replace the existing bullet:
    `- Images use \`<img src="..." width="200">\` HTML tag — not markdown \`![]()\` syntax, since width control matters.`

    With:
    `- Images use \`<img src="..." width="400">\` HTML tag — not markdown \`![]()\` syntax, since width control matters.`

    Single-character-width change — the only difference is `width="200"` → `width="400"`. Everything else (the bullet marker, the inline-code formatting, the rationale clause) is preserved verbatim.

    Reasoning: PATTERNS.md S4 mirror invariant — the canonical width value must match the recipe-template Image line value chosen in Task 1. Since Task 1 sets `width="400"` per D-08, this note must follow. PATTERNS.md noted an alternative (use a generic `width="..."` to decouple the example from the canonical width) — but that loses the user-facing guidance value of the example. The D-08-locked uniform form is the better choice and is consistent with PATTERNS.md's "honor D-08 verbatim" recommendation.
  </action>
  <verify>
    <automated>cd /Users/glestryc/personal/github_repos/barkeeper-bjorn-website &amp;&amp; grep -F 'Images use `<img src="..." width="400">`' instructions/communication.md &amp;&amp; ! grep -F 'Images use `<img src="..." width="200">`' instructions/communication.md</automated>
  </verify>
  <acceptance_criteria>
    - Positive grep — new form: `grep -F 'Images use \`<img src="..." width="400">\`' instructions/communication.md` exits 0
    - Negative grep — old form gone: `grep -F 'Images use \`<img src="..." width="200">\`' instructions/communication.md` exits 1
    - The rest of the bullet text is unchanged: `grep -F 'not markdown \`![]()\` syntax, since width control matters.' instructions/communication.md` exits 0
    - Mirror sanity — width value matches the recipe template lines updated in Task 1: `grep -c 'width="400"' instructions/communication.md` returns at least 1, and `grep -c 'width="400"' barkeeper-instructions.md` returns at least 1, and `grep -c 'width="400"' recipes.md` returns at least 1
    - File-scope sanity — no other lines in `instructions/communication.md` accidentally modified: `git diff -U0 instructions/communication.md | grep -E '^[+-]' | grep -v -E '^(---|\+\+\+)' | grep -v -E 'width="(200|400)"' | grep -c .` returns 0 (every diffed line involves the width attribute)
    - Negative invariant — no `app/` files modified: `git diff --name-only HEAD | grep -c '^app/'` returns 0
  </acceptance_criteria>
  <done>
    `instructions/communication.md` line 42 uses `width="400"` (D-08 canonical), matching the recipe-template Image line in `barkeeper-instructions.md` and `recipes.md`. The rest of the bullet text is unchanged. No `app/` files modified.
  </done>
</task>

</tasks>

<verification>
After all tasks:
- `grep -c 'width="400"' barkeeper-instructions.md instructions/communication.md recipes.md` returns ≥1 for each file
- `grep -c '\[cocktailN\]-image\.png' barkeeper-instructions.md recipes.md` returns ≥1 for each file
- Negative invariants — old form absent at every sync point:
  - `grep -F '[cocktailN]_short_name_001.png' barkeeper-instructions.md` exits 1
  - `grep -F '[cocktailN]_short_name_001.png' recipes.md` exits 1
  - `grep -F 'Images use \`<img src="..." width="200">\`' instructions/communication.md` exits 1
- Cross-plan consistency check: the D-07 save reminder added in plan 03 references `[cocktailN]-image.png`. After this plan, the recipe-template Image line uses the same filename — `grep -F '[cocktailN]-image.png' barkeeper-instructions.md` returns ≥2 hits (one in the save reminder from plan 03, one in the recipe template from this plan)
- No file outside `files_modified` is touched (git diff verifies)
</verification>

<success_criteria>
- AGENT-04 closed: the `recipes.md` recipe template uses the `<img>` tag with the D-08 canonical form (width="400", filename `[cocktailN]-image.png`, alt attribute)
- D-08 enforced uniformly across all three sync points: `barkeeper-instructions.md`, `recipes.md`, and `instructions/communication.md`
- Mirror invariant intact: the recipe-template Image lines in `barkeeper-instructions.md` and `recipes.md` are byte-identical; the width value in `instructions/communication.md` matches
- No drift: the old `width="200"` and `_short_name_001.png` patterns are absent at every sync point
- Cross-plan consistency: the filename `[cocktailN]-image.png` matches the D-07 save reminder set in plan 03
- Negative invariant: no `app/` files modified
</success_criteria>

<output>
After completion, create `.planning/phases/01-agent-instructions-polish/01-04-SUMMARY.md` per templates/summary.md.
</output>
