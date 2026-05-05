# Phase 1: Agent Instructions Polish - Pattern Map

**Mapped:** 2026-05-04
**Files analyzed:** 6 (5 modified, 1 read-only source)
**Analogs found:** 6 / 6 (this phase modifies existing files in place — every "analog" is the file's own current state)

> *Phase 1 is markdown-only. There are no JS modules, classes, or routes to map. The relevant patterns are document-level conventions: how rules are formatted (blockquoted italics), how the session-start menu is structured (numbered list inside a blockquote), how the recipe template embeds an image (HTML `<img>` tag with placeholders), and the mirror relationship between the monolithic `barkeeper-instructions.md` and the modular `instructions/*.md` files. The planner copies these conventions verbatim when writing decision diffs.*

---

## File Classification

| Modified File | Document Role | Content Pattern | Self-Analog (Section) | Match Quality |
|---|---|---|---|---|
| `barkeeper-instructions.md` | Agent constitution (single-file edition) | Behavioral rule blocks + menu block + recipe template | Itself, lines 71–72, 84–96, 483–489, 514–536, 575 | exact |
| `instructions/onboarding.md` | Modular onboarding mirror | Behavioral rule block + menu block + onboarding phases | Itself, lines 7–9, 23–33; mirrors `barkeeper-instructions.md` 71–72, 84–95 | exact |
| `instructions/communication.md` | Modular communication module | Bulleted core principles + persona table + formatting list | Itself, lines 9–10, 42 | exact |
| `recipes.md` | User-facing template | Recipe template fenced code block | Itself, lines 15–37 | exact |
| `INSTALL.md` | Platform setup guide | Per-platform numbered setup steps + fenced examples | Itself — Platform 2 ChatGPT (lines 35–68), Platform 3 Gemini (72–82), Platform 4 Grok (86–102) | role-match (paste-ready code-fence pattern not yet present per-platform) |
| `INIT_PROMPT.md` | **Read-only source** | Standard init fenced block | Lines 9–17 (source of paste snippet for INSTALL.md) | source-only |

---

## Pattern Assignments

### `barkeeper-instructions.md` (agent constitution, behavioral rules + menu + recipe template)

This file is its own analog — every change in Phase 1 amends an existing block whose style must be preserved. Below are the exact excerpts the planner must match when writing diffs.

#### Pattern 1 — Behavioral-rule blockquote (used for D-01 strengthening, D-02 all-contexts mirror)

**The one-question rule** (lines 71–72) — the canonical example of the "major rule" pattern. Two-line blockquote: bold-uppercase header on line 1, italicized prose on line 2.

```markdown
> **ONE QUESTION AT A TIME — this rule is absolute.**
> Ask exactly one question per message throughout all onboarding phases, re-evaluation prompts, and follow-up exchanges. Do not group questions. Do not number a list of questions in a single message. Do not hint at what comes next ("and then I'll ask you about..."). Wait for the user's answer before sending anything else. This applies even when questions are closely related. A user who answers three questions at once is fine — a bartender who asks three at once is not.
```

**Style rules to preserve when adding the WRONG/RIGHT example (D-01):**
- Header line uses `> **CAPS — terse declarative.**` form
- Prose line continues the same blockquote (`>` prefix)
- "This applies even when questions are closely related" already lives at the end of line 72 — the all-contexts language for D-02 should be folded into this same line, not added as a new paragraph
- The closing rhetorical contrast (`A user who answers three questions at once is fine — a bartender who asks three at once is not.`) sets the rhythm. The new WRONG/RIGHT block should follow this same blockquote (continue with `>` lines) so the entire rule reads as one unit. Suggested insertion immediately after line 72:

```markdown
>
> **WRONG:** *"What's your name? And where are you based?"*
> **RIGHT:** *"What's your name?"* (Wait for answer, then ask about location.)
>
> **No numbered question lists.** Never write "1. ... 2. ..." in any message that requests information from the user — regardless of how related the questions are.
```

**Other rule-block analogs in the same file** (use these to confirm the blockquote-italics pattern is project-wide):
- Re-evaluation prompt (line 402) — italicized question inside `>`
- Step 1 persona prompt (line 128) — italicized question inside `>` followed by a sub-blockquote table
- Onboarding-first exception language (line 442) — bold inline header, no blockquote (used for sub-rules under a parent rule, not new top-level rules)

#### Pattern 2 — Session-start menu block (D-09 review target)

**Lines 84–96** — the canonical numbered list inside a blockquote with ALL menu items at top level. Note that `barkeeper-instructions.md` has **8 items** here (Analytics mode at #7) whereas `instructions/onboarding.md` only has **7** (no analytics) — this is an existing drift the planner should flag.

```markdown
### Session-Start Menu (returning users only)

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

**Format rules to preserve:**
- Greeting line is italicized inside double-quotes inside blockquote (`> *"..."*`)
- Empty blockquote line (`>`) separates greeting from list
- Each list item is `> N. Text` — no bold, no descriptions on the list lines themselves
- Per the `**Rules:**` block at lines 97–101: cap at 9 items, "Chat about something else" is always last

**Companion rules block** (lines 97–101) — bold inline header `**Rules:**` then a bulleted list, NOT inside a blockquote. This is the pattern for adding clarifying constraints under a major block:

```markdown
**Rules:**
- The persona name in the greeting comes from `barkeeper.md` (default: Barkeeper Bjorn, but the user may have renamed).
- Keep the menu exactly as formatted above. Do not add explanations, descriptions, or preamble to any menu item.
- If the user skips the menu and just says something ("make me something smoky"), honor it directly — the menu is a convenience, not a gate.
- The menu can grow over time as features are added, but cap at 9 items. "Chat about something else" is always last.
```

**D-03 (always-show-menu rule)** must be added as a new bullet under `**Rules:**` here, in the same `instructions/onboarding.md` block, and should override-by-precedence the existing "If the user skips the menu and just says something..." bullet. Suggested phrasing:

```markdown
- **Always show the menu first for returning users**, regardless of how the user opens. If the user says "hi", "let's go", or any vague opener, display the menu before doing anything else. The "honor a specific request directly" exception applies *only* when the user names a clear task (e.g., "make me something smoky") — never to general greetings.
```

#### Pattern 3 — Recipe template with image field (D-08 canonical form)

**Lines 514–536** — the canonical recipe template. Already uses `<img>` tag form (so D-08 is largely "make sure both files match", not a structural change). Image line is **line 529**:

```markdown
**Image:** <img src="https://raw.githubusercontent.com/USERNAME/barkeeper-bjorn/refs/heads/BRANCH/images/[cocktailN]_short_name_001.png" width="200"> *(optional — replace USERNAME and BRANCH; add multiple img tags for alternates)*
```

**Format rules to preserve:**
- `**Image:**` bold field label
- Inline `<img>` tag with `src=` URL containing `USERNAME` and `BRANCH` placeholders (NOT `{owner}` / `{repo}` — the file uses literal-uppercase placeholders, not curly braces)
- `width="200"` (the CONTEXT.md spec says `width="400"` — the planner must reconcile: D-08 explicitly calls for `width="400"`, so this is a value to UPDATE)
- Trailing italicized parenthetical instructing user to replace placeholders
- Filename convention: `[cocktailN]_short_name_001.png` (snake_case, _001 suffix), confirmed in line 489 of the same file

**D-08 reconciliation note for planner:** The current canonical example uses `width="200"` and the path form `images/[cocktailN]_short_name_001.png`. CONTEXT.md D-08 specifies `width="400"` and `images/[cocktailN]-image.png` (kebab, no `_001`). The planner needs to pick one canonical form and apply it to BOTH `barkeeper-instructions.md` line 529 AND `recipes.md` line 30. Recommend honoring D-08 verbatim per CONTEXT.md (it is a locked decision).

#### Pattern 4 — Image-prompt instruction block (D-05, D-06, D-07 target)

**Lines 483–489** — the existing "Cocktail artwork" rule under `### Original Cocktails` (#6). Currently has TWO variants (Photorealistic, Illustrated/painterly); D-05 expands to THREE (adds Vintage / retro). D-07 adds a save-reminder line.

```markdown
6. **Cocktail artwork:** When a new original is confirmed, offer to suggest image generation prompts the user can use to create AI artwork (Midjourney, DALL-E, Ideogram, etc.). Provide two prompt variants:
   - **Photorealistic:** cinematic close-up shot, dramatic lighting, cocktail glass on a surface that matches the drink's character (dark marble for spirit-forward; beach wood for tropical; weathered bar top for classics). Include key visual ingredients as garnish or background.
   - **Illustrated/painterly:** vintage cocktail-poster style, or watercolor, or Art Deco — match the aesthetic to the drink's era and personality.
   
   Tailor both prompts to the specific drink's profile, dominant colors, and occasion. Do not use generic "cocktail on a bar" prompts.
   
   Suggested filename convention: `images/[cocktailN]_short_name_001.png` (increment suffix for alternates: `_002.png`, etc.). When the user provides artwork, update the `**Image:**` field in the recipe using the `<img>` tag format (see recipe template).
```

**Format rules to preserve:**
- Numbered top-level rule (`6.`) with `**Bold inline header:**` lead-in
- Two indented bullets, each `**Variant Name:**` then prose
- Trailing prose paragraph (the "Tailor both prompts..." line) is at 3-space indent under the parent number
- D-05 third variant should slot in as a third bullet labeled `**Vintage / retro:** 1920s–1960s cocktail book illustration style ...` (per CONTEXT.md "specifics" — Trader Vic-style aesthetic)
- D-06 fields to drive prompt content: cocktail name + tagline, color palette derived from base spirit + key modifiers, occasion. **Do NOT include flavor axes.**
- D-07 save reminder — append as a new prose line after the variants. CONTEXT.md gives exact wording:

```markdown
> *"Save to `images/` as `[cocktailN]-image.png` and link it in `recipes.md` with the `<img>` tag format."*
```

  Note: this is a one-line italicized blockquote (matches the rule-block pattern from Pattern 1), not a bullet — the planner should insert it as a standalone blockquote between the variant bullets and the existing "Tailor both prompts..." paragraph.

#### Pattern 5 — Onboarding step header (D-10 bartender personalization step 2)

**Phase F1 (lines 163–172) and Phase M1 (lines 314–319)** are the analogs for inserting a new step. Step header pattern:

```markdown
### Phase F1 — Bar Owner Profile

Ask in sequence, one at a time:

1. Full name (used for cocktail attribution)
2. Location (for time zone and seasonal context)
3. Background — profession, academic credentials, vocabulary preferences (physics, finance, medicine, engineering, etc.)
[...]
```

**Format rules:**
- `### Phase FN — Title` heading (Full track) or `### Phase MN — Title` (Minimalist)
- Brief intro line ("Ask in sequence, one at a time:" or `One question:`)
- Numbered list of question topics (Full track) or italicized question prompts (Minimalist track)
- D-10 inserts a new phase between F1 and F2 (and between M1 and M2). The CONTEXT.md transition prompt is given verbatim:

```markdown
> *"Before we go further — I'm Barkeeper Bjorn by default, but let's make sure I'm set up right for you."*
```

  This transition line is itself in the rule-block style (italicized blockquote). The three sub-questions (bartender name, voice preset, specialty focus) should follow the F3 pattern (lines 186–189) of asking each veto question separately as numbered italicized prompts.

**D-11 voice presets table reference** — already partially documented in `instructions/communication.md` lines 23–32 (5-row preset table) and in `barkeeper-instructions.md` lines 130–138 (5-row preset table at Step 1). **These two existing preset tables are NOT identical** — `communication.md` uses presets {Professional Mixologist, Frontier, Old-World European, Craftsman, Custom} whereas D-11 specifies a different 5-set {Professional & measured, Warm & playful, Terse & opinionated, Theatrical & verbose, Nerdy / analytical}. Planner must decide whether to:
   (a) replace the existing preset names with D-11's set, or
   (b) treat D-11 as an orthogonal "voice preset" axis distinct from the existing "persona preset" axis.
This is a flagged ambiguity for the planner to resolve in PLAN.md, possibly by raising a clarifying question.

#### Pattern 6 — Communication-style bulleted rule list (D-02 all-contexts mirror in communication.md)

**Lines 574–580** in `barkeeper-instructions.md` (the `## Communication Style` section) and **lines 9–15** in `instructions/communication.md` mirror each other almost exactly. The one-question rule already appears at line 575 / line 10 respectively. D-02 amendment to make it explicit "all contexts" should edit the existing bullet:

Current:
```markdown
- **One question per message — always.** This applies in onboarding, re-evaluation, follow-ups, and casual conversation. If you have two questions, pick the more important one. Ask the second after the first is answered.
```

This already says "all contexts" implicitly — the planner should review whether it needs strengthening (D-02) or whether the explicit list ("onboarding, re-evaluation, follow-ups, and casual conversation") is sufficient. Suggested strengthening: add "recipe design" and "analytics mode" to the explicit list to match CONTEXT.md D-02 enumeration.

---

### `instructions/onboarding.md` (modular onboarding mirror)

**Mirrors:** `barkeeper-instructions.md` Onboarding Flow section (lines 69–305 of `barkeeper-instructions.md` correspond to the entirety of `instructions/onboarding.md` lines 1–323).

#### Pattern 1 — One-question rule blockquote (lines 7–9)

```markdown
## ONE QUESTION AT A TIME — Absolute Rule

> Ask exactly one question per message throughout all onboarding phases, re-evaluation prompts, and follow-up exchanges. Do not group questions. Do not number a list of questions in a single message. Do not hint at what comes next ("and then I'll ask you about..."). Wait for the user's answer before sending anything else. This applies even when questions are closely related. A user who answers three questions at once is fine — a bartender who asks three at once is not.
```

**Mirror obligation:** The D-01 WRONG/RIGHT example added to `barkeeper-instructions.md` line 72 must be added here in identical form. Note this file uses `## ONE QUESTION AT A TIME — Absolute Rule` as a section header (not a blockquote bold-line) — the structure differs slightly from the monolith. Planner should preserve both forms.

#### Pattern 2 — Session-start menu (lines 23–33) — KNOWN DRIFT

```markdown
> *"Hey [Name] — [Persona Name] here. What are we doing tonight?"*
>
> 1. Make me a drink from what I have
> 2. Design a new original
> 3. See my current recipe list
> 4. What should I buy next? (gap analysis)
> 5. Update my inventory
> 6. Review my flavor profile
> 7. Chat about something else
```

**This menu has 7 items; the monolith has 8** (Analytics mode is missing here). Planner must reconcile: per D-09 the 8-item version in `barkeeper-instructions.md` is the correct one. Update `instructions/onboarding.md` to add `7. Analytics mode` and bump `Chat about something else` to `8`. Also append the D-03 always-show-menu bullet to the `**Rules:**` block at lines 35–39.

#### Pattern 3 — Onboarding phases (lines 97–323)

These mirror `barkeeper-instructions.md` lines 159–387 exactly. Any D-10 phase insertion (bartender personalization as new step 2) must be applied to both files in identical form. Specifically:
- Insert a new `### Phase F1.5 — Bartender Personalization` (or rename existing phases F2–F13 → F3–F14 if a clean numbering is preferred — planner's call) between current F1 and F2 in both files
- Insert mirror personalization step in Minimalist track between M1 and M2

---

### `instructions/communication.md` (modular communication module)

**Mirrors:** `barkeeper-instructions.md` § Communication Style (lines 572–582) — though `communication.md` is more elaborated (includes Persona Application table at lines 23–32 and Formatting Defaults at lines 38–42 that are NOT in the monolith).

#### Pattern 1 — Bulleted core principles (lines 9–15)

```markdown
## Core Principles

- Lead with the answer. No preamble, no restating the question, no filler.
- **One question per message — always.** This applies in onboarding, re-evaluation, follow-ups, and casual conversation. If you have two questions, pick the more important one. Ask the second after the first is answered.
- Mobile-friendly by default: short paragraphs, recipe tables, minimal over-formatting.
- Match the user's vocabulary level. If they signal expertise (data science, finance, physics, medicine, etc.), free use of that domain's terminology is welcome.
- Be honest. Push back when something isn't a good idea, doesn't fit the user's palate, or has a better alternative. Avoid sycophancy.
- Use the user's local time zone for any timestamps.
- When asked simple factual questions ("is X mezcal good?"), answer directly first, then provide context.
```

**D-02 amendment target:** the `**One question per message — always.**` bullet on line 10. Strengthen to mention all contexts including recipe design and analytics mode.

#### Pattern 2 — Image format note (line 42)

```markdown
- Images use `<img src="..." width="200">` HTML tag — not markdown `![]()` syntax, since width control matters.
```

**D-08 propagation:** if the canonical width is changed to `400` per CONTEXT.md, this example here must also change to `width="400"` (or be left as a generic `width="..."` to avoid coupling).

---

### `recipes.md` (user-facing template)

#### Pattern 1 — Recipe template fenced block (lines 15–37)

```markdown
### Recipe Template

\`\`\`
### [cocktailN] Drink Name
*Optional tagline*
*Created by [attribution]*

| Ingredient | Amount |
|---|---|
| ... | ... |

**Method:** ...

**Garnish:** ...

**Profile:** Brief flavor/occasion description.

**Image:** <img src="https://raw.githubusercontent.com/USERNAME/barkeeper-bjorn/refs/heads/BRANCH/images/[cocktailN]_short_name_001.png" width="200"> *(optional — replace USERNAME and BRANCH; add multiple img tags for alternates)*

#### Why it works
Brief structural explanation.

#### Variation
Optional alternate build.
\`\`\`
```

**This is the SAME template as `barkeeper-instructions.md` lines 514–536.** D-08 update must be applied to both files in identical form. Note that the fenced block here uses no language tag (just three backticks). Preserve that.

---

### `INSTALL.md` (platform setup guide)

#### Pattern 1 — Per-platform numbered setup steps

The file already has per-platform sections (Platform 1: Claude Projects lines 7–32; Platform 2: ChatGPT lines 35–68; Platform 3: Gemini lines 72–82; Platform 4: Grok lines 86–102; Platform 5: Local LLMs lines 106–112). D-04 affects Platforms 2, 3, 4. Each section follows this skeleton:

```markdown
## Platform N: <Name> (<qualifier>)

**Why <Platform>:** <one-line reason>

### Setup

1. <step>
2. <step>
   - <sub-step>
3. <step with paste reference to INIT_PROMPT.md>
[...]
```

**Existing pattern for paste references** (Platform 2, line 55):
```markdown
5. Under **Conversation starters**, paste the contents of `INIT_PROMPT.md` as the first starter (or the short one-liner: *"Initialize Barkeeper Bjorn."*). This makes the init prompt fire automatically when a user opens the GPT for the first time, without them having to paste it manually.
```

**D-04 gap:** None of the platform sections currently inline the literal "Standard init" text as a paste-ready code block. They reference `INIT_PROMPT.md` by name but don't show the text. D-04 wants the literal text inserted. Suggested format (matches code-fence convention used elsewhere in the file, e.g., line 47, lines 91–97):

```markdown
**Paste this into the [opening message / starter / system prompt] field:**

\`\`\`
Initialize Barkeeper Bjorn.

Read all your knowledge files (barkeeper.md, barkeeper-instructions.md, bar-owner-profile.md, inventory.md, recipes.md) before responding.

If my user files (bar-owner-profile.md, inventory.md, recipes.md) are empty or template-only, run the onboarding flow described in barkeeper-instructions.md. Start by asking whether I'm building a serious home bar or just looking to make a few favorite cocktails well (Minimalist track vs. Full track).

If my user files are already populated, greet me by name and ask what I'd like to do tonight: build a drink, design an original, get a gap analysis on my bar, or something else.
\`\`\`
```

**Insertion points:**
- Platform 2 ChatGPT: replace line 55 reference with the literal block (or add it under that bullet)
- Platform 3 Gemini: insert under step 4 (line 79)
- Platform 4 Grok: insert under step 3 (line 99)

**Per CONTEXT.md "specifics":** the snippet must come from `INIT_PROMPT.md` "Standard init" section — lines 9–17 (NOT the "Returning user" or "Reset" variants).

---

### `INIT_PROMPT.md` (READ-ONLY in this phase — source of paste text)

#### Lines 9–17 — the "Standard init" paste text to embed in INSTALL.md

```markdown
\`\`\`
Initialize Barkeeper Bjorn.

Read all your knowledge files (barkeeper.md, barkeeper-instructions.md, bar-owner-profile.md, inventory.md, recipes.md) before responding.

If my user files (bar-owner-profile.md, inventory.md, recipes.md) are empty or template-only, run the onboarding flow described in barkeeper-instructions.md. Start by asking whether I'm building a serious home bar or just looking to make a few favorite cocktails well (Minimalist track vs. Full track).

If my user files are already populated, greet me by name and ask what I'd like to do tonight: build a drink, design an original, get a gap analysis on my bar, or something else.
\`\`\`
```

This text is sourced verbatim into INSTALL.md per D-04. **The planner must NOT modify `INIT_PROMPT.md` itself in Phase 1.**

---

## Shared Patterns

### S1 — Behavioral-rule blockquote
**Source:** `barkeeper-instructions.md` lines 71–72 (canonical), line 402 (re-evaluation prompt), line 442 (impatience exception); `instructions/onboarding.md` lines 7–9 (mirror).
**Apply to:** Every new or strengthened behavioral rule (D-01, D-02, D-03, D-07, D-10).
**Form:**
```markdown
> **CAPS HEADER — terse declarative.**
> Italicized prose body explaining the rule, with a closing rhetorical contrast or example.
```
For italic-quoted dialogue prompts: `> *"Sentence in italics inside double-quotes."*`

### S2 — Mirror obligation between monolith and modules
**Source:** `barkeeper-instructions.md` lines 9–22 (How This File Is Organized table) — declares which `instructions/*.md` modules mirror which sections.
**Apply to:** Every change in this phase. Specifically:
- D-01, D-02 changes to `barkeeper-instructions.md` Communication Style → mirror in `instructions/communication.md`
- D-03, D-09, D-10 changes to onboarding sections of `barkeeper-instructions.md` → mirror in `instructions/onboarding.md`
- D-08 changes to recipe template in `barkeeper-instructions.md` → mirror in `recipes.md`
**Drift detected:** Session-start menu currently differs (8 items in monolith, 7 in module). Planner must include a "fix mirror drift" task.

### S3 — Italicized-quoted user-facing prompt
**Source:** `barkeeper-instructions.md` line 86 (greeting), line 128 (Step 1 question), line 144 (Step 2 question), line 188 (Phase F3 vetoes), and many more.
**Apply to:** The D-10 transition prompt and D-07 save reminder — both should use this form.
**Form:** `> *"Sentence the bartender literally says, in italics, inside double-quotes."*`

### S4 — Recipe template `<img>` tag
**Source:** `barkeeper-instructions.md` line 529, `recipes.md` line 30, `instructions/communication.md` line 42.
**Apply to:** D-08 update — must touch all THREE files. Width value and filename pattern must reconcile across them.

### S5 — Fenced code block for paste-ready text
**Source:** `INIT_PROMPT.md` lines 9–17, `INSTALL.md` lines 47–48 (ChatGPT instruction append snippet), lines 91–97 (Grok concatenation list).
**Apply to:** D-04 INSTALL.md per-platform paste blocks. Use bare triple-backtick fence (no language tag).

---

## No Analog Found

None — every modified file in Phase 1 is amending an existing structure with established conventions. There is no "blank-slate" content to write.

---

## Flagged Ambiguities for the Planner

1. **D-08 width and filename divergence.** Current canonical example: `width="200"`, filename `[cocktailN]_short_name_001.png`. CONTEXT.md D-08 spec: `width="400"`, filename `[cocktailN]-image.png`. Planner must pick one and apply uniformly to `barkeeper-instructions.md` line 529, `recipes.md` line 30, `instructions/communication.md` line 42, and the D-07 save-reminder language.

2. **D-11 voice preset name divergence.** CONTEXT.md D-11 lists 5 voice presets {Professional & measured, Warm & playful, Terse & opinionated, Theatrical & verbose, Nerdy / analytical}. The existing persona presets in `barkeeper-instructions.md` lines 130–138 and `instructions/communication.md` lines 23–32 are a different 5-set {Professional Mixologist, Frontier, Old-World European, Craftsman, Custom}. Planner must decide whether D-11 replaces, supplements, or reframes the existing set. Phase 2's `app/js/views/onboarding.js` will mirror whichever the planner chooses (D-13 locks the order: name → voice preset → specialty focus).

3. **Session-start menu item count drift.** Monolith has 8 items (Analytics mode at #7); module file has 7 (no Analytics). D-09 says "minor review" — planner should sync the module up to 8 items as part of D-09.

4. **D-10 phase numbering.** Inserting a new "Bartender Personalization" step between F1 and F2 means either (a) renumbering F2–F13 to F3–F14, or (b) using a fractional/letter label (F1.5, F1B). Planner's call — recommend (a) for cleanliness, but it is a wider edit.

---

## Metadata

**Analog search scope:** Repository root + `instructions/` + `.planning/`
**Files scanned:** 6 in scope + REQUIREMENTS.md + ROADMAP.md + CONTEXT.md (8 total)
**Pattern extraction date:** 2026-05-04
**Project context loaded:** `CLAUDE.md` (project instructions — markdown-only phase confirmed, no build step, no app/ JS)
