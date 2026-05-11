# Phase 1: Agent Instructions Polish - Context

**Gathered:** 2026-05-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix 6 behavioral issues in the LLM agent prompt markdown files only. No `app/` web UI code is touched. All changes go to: `barkeeper-instructions.md`, `instructions/onboarding.md`, `instructions/communication.md`, `recipes.md`, and `INSTALL.md`.

Scope: how Bjorn behaves in a conversation — question cadence, session start, image workflows, and persona setup order. Not: new features, new file formats, or web UI changes.

</domain>

<decisions>
## Implementation Decisions

### Rule Enforcement (AGENT-01, AGENT-02)

- **D-01:** Strengthen the one-question rule in `barkeeper-instructions.md` by adding a concrete WRONG/RIGHT negative example directly in the rule block. Example format:
  ```
  WRONG: "What's your name? And where are you based?"
  RIGHT: "What's your name?"
  ```
  A numbered-list ban must also be explicit: never write "1. ... 2. ..." in a question context regardless of how related the questions are.

- **D-02:** The one-question rule applies to **all contexts** — not just onboarding. Bjorn never asks two questions in any message: onboarding, re-evaluation, recipe design, analytics mode, or casual bartender conversation.

- **D-03:** For returning users (files populated), Bjorn **always shows the session-start menu first** — regardless of what the first message says. Never infer intent from a vague opener. If user says "hi" or "let's go", still show the menu. If user says something specific ("make me something smoky"), honor it directly as per existing rule.

- **D-04:** `INSTALL.md` gets updated with platform-specific guidance for ChatGPT Custom GPT, Gemini Gem, and Grok: include the literal `INIT_PROMPT.md` "Standard init" text as a paste-ready copyable block under each platform's section, with explicit instruction to set it as the GPT's opening/starter message.

### Image Generation Workflow (AGENT-03, AGENT-04)

- **D-05:** After a new original is confirmed, Bjorn **automatically produces image-generation prompts without asking** — three variants, labeled:
  - **Variant A — Photorealistic:** photography style prompt
  - **Variant B — Illustrated / painterly:** editorial illustration style
  - **Variant C — Vintage / retro:** classic cocktail book illustration style (1920s–1960s aesthetic)

- **D-06:** Image prompt content uses: cocktail name + tagline, color palette derived from the base spirit and key modifiers, occasion (for mood and lighting direction). Flavor axes are **not** included in image prompts.

- **D-07:** After the three variants, Bjorn appends a one-line save reminder:
  > *"Save to `images/` as `[cocktailN]-image.png` and link it in `recipes.md` with the `<img>` tag format."*

- **D-08:** `recipes.md` recipe template image field updated from backtick path string to `<img>` tag format:
  ```html
  <img src="https://raw.githubusercontent.com/{owner}/{repo}/main/images/[cocktailN]-image.png" width="400" alt="[Drink Name]">
  ```
  This format is also the canonical example in `barkeeper-instructions.md`'s behavioral rules.

### Bartender Personalization Order (AGENT-05, AGENT-06)

- **D-09:** Session-start menu for returning users: the existing 8-item menu in `barkeeper-instructions.md` (lines 84–120) is already correct. Minor review for consistency with the "all-contexts one-question rule" — no structural change needed unless a conflict is found.

- **D-10:** Bartender personalization **always presented as a full step 2** in onboarding — even for users who want defaults. After collecting name + location (step 1), agent asks:
  > *"Before we go further — I'm Barkeeper Bjorn by default, but let's make sure I'm set up right for you."*
  Then collects **one at a time**: (a) bartender name, (b) voice preset, (c) specialty focus.

- **D-11:** Voice presets (5 total):
  1. **Professional & measured** — formal, knowledgeable, composed
  2. **Warm & playful** — friendly, encouraging, a little cheeky
  3. **Terse & opinionated** — minimal words, strong opinions, no hedging
  4. **Theatrical & verbose** — dramatic flair, storytelling, rich descriptions
  5. **Nerdy / analytical** — data-driven, talks ratios and chemistry, explains the science

- **D-12:** Specialty focus options (5):
  1. Classics (pre-Prohibition and golden-era cocktails)
  2. Modern / contemporary
  3. Tiki / tropical
  4. NA-forward (non-alcoholic and low-ABV)
  5. No preference (broad and balanced)

- **D-13:** The bartender personalization step 2 fields **must match exactly** between agent onboarding (`barkeeper-instructions.md` / `instructions/onboarding.md`) and the web UI wizard (`app/js/views/onboarding.js`, addressed in Phase 2). Step order: name → voice preset → specialty focus, one question at a time.

### Claude's Discretion

- Exact wording of the negative WRONG/RIGHT examples in the rule block — pick examples that are clear and representative of the actual failure mode seen in ChatGPT
- Exact structure of Variant A/B/C prompt templates — use the name, color, and occasion inputs per D-06; wording of each variant's style instruction is Claude's call
- Minor formatting/wording cleanup throughout the files if inconsistencies are found — within scope

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Agent instruction files (primary targets)
- `barkeeper-instructions.md` — main agent constitution; one-question rule at line 72, session-start menu at lines 84–120; behavioral rules section has the recipe template with image field
- `instructions/onboarding.md` — modular onboarding for Claude Projects; mirrors `barkeeper-instructions.md` onboarding section; must stay in sync
- `instructions/communication.md` — communication/formatting rules module; one-question rule must be added here too (D-02: all contexts)

### Supporting files to update
- `INIT_PROMPT.md` — source of the "Standard init" paste-ready text for INSTALL.md platform sections
- `INSTALL.md` — platform-specific setup guidance (ChatGPT Custom GPT, Gemini Gem, Grok sections); add paste-ready INIT_PROMPT snippet per D-04
- `recipes.md` — recipe template with image field; update `<img>` tag format per D-08

### Planning context
- `.planning/REQUIREMENTS.md` §Agent Instructions — AGENT-01 through AGENT-06 (source requirements)
- `.planning/ROADMAP.md` §Phase 1 — Phase goal and success criteria
- `to-do.md` §Tier 1 — items 1.1–1.6 (original problem statements and fix specs)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No web app code involved — this phase is markdown-only

### Established Patterns
- `barkeeper-instructions.md` uses a blockquote (`> *rule text*`) for major behavioral rules — one-question rule, session-start menu rules. New/strengthened rules should follow this pattern.
- `instructions/*.md` modules mirror the relevant section of `barkeeper-instructions.md` exactly. Changes to `barkeeper-instructions.md` must be mirrored in the corresponding module files.
- The session-start menu uses a specific numbered-list format inside a blockquote — preserve this format for any additions or edits.

### Integration Points
- `onboarding.js` (web UI, Phase 2) mirrors the agent onboarding step sequence. D-13 locks the field order so Phase 2 can implement web UI step 2 with the same structure.
- `barkeeper.md` is the user-editable persona file. The `instructions/onboarding.md` currently writes persona updates to `barkeeper.md` at the end of onboarding. The new step 2 personalization collects the same fields earlier — ensure the write target remains `barkeeper.md`.

</code_context>

<specifics>
## Specific Ideas

- The WRONG/RIGHT example in D-01 should reflect the exact failure mode: the agent asking two closely-related but distinct questions in one message (e.g., asking for name AND location together). That's the pattern ChatGPT exhibited.
- Vintage/retro image variant (D-05, Variant C) should reference "1920s–1960s cocktail book illustration style" in the prompt template, evoking works like Trader Vic's original Bartender's Guide.
- The INSTALL.md paste snippet (D-04) should come from the "Standard init" section of `INIT_PROMPT.md` (lines 10–16) — not the "returning user" or "reset" variants.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-Agent Instructions Polish*
*Context gathered: 2026-05-04*
