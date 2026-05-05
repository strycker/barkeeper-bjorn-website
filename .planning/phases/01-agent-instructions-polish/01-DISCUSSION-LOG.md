# Phase 1: Agent Instructions Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in 01-CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-04
**Phase:** 1-Agent Instructions Polish
**Areas discussed:** Rule enforcement, Image workflow, Onboarding reorder

---

## Rule Enforcement

| Option | Description | Selected |
|--------|-------------|----------|
| Add negative example | WRONG/RIGHT counter-example directly in the rule block | ✓ |
| Add violation check | Self-check: "count question marks before sending" | |
| Both + repeat in communication.md | Negative example + violation check + repeat in comms module | |
| You decide | Apply whatever combination looks most effective | |

**User's choice:** Add negative example
**Notes:** Strongest LLM compliance comes from concrete examples showing the failure mode.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Vague openers only | Fire INIT_PROMPT for blank/greeting-only messages | |
| Always show the menu first | For returning users, always show session-start menu regardless of first message | ✓ |
| Keyword heuristic | Define a list of non-task patterns that trigger the menu | |

**User's choice:** Always show the menu first
**Notes:** No intent inference — returning users always get the menu, then can pick an option or type past it.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Onboarding + re-evaluation only | Rule scoped to structured Q&A flows only | |
| All contexts | Bjorn never asks two questions in any message, ever | ✓ |
| Onboarding only | Keep rule exactly where it is | |

**User's choice:** All contexts
**Notes:** Universal rule — no exceptions for bartender mode or analytics.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Paste-ready snippet | Literal INIT_PROMPT text as copyable block under each platform section | ✓ |
| Reference only | Point to INIT_PROMPT.md without copying the text | |
| Skip INSTALL.md | Don't touch INSTALL.md for now | |

**User's choice:** Paste-ready snippet
**Notes:** Cover ChatGPT Custom GPT, Gemini Gem, and Grok sections.

---

## Image Workflow

| Option | Description | Selected |
|--------|-------------|----------|
| Always offer, no asking | Automatically produce prompts after recipe confirmed | ✓ |
| Ask first | "Want me to generate image prompts?" before producing | |
| You decide | Apply whatever fits the conversational tone | |

**User's choice:** Always offer, no asking

---

| Option | Description | Selected |
|--------|-------------|----------|
| Name + color + occasion | Name/tagline + color palette from base spirit + occasion for mood | ✓ |
| Full flavor profile | All 6 axes translated into visual language | |
| Name + base spirit only | Minimal — name and base spirit only | |

**User's choice:** Name + color + occasion

---

| Option | Description | Selected |
|--------|-------------|----------|
| Two variants, labeled | Photorealistic + illustrated, labeled with style descriptions | |
| Two variants, unlabeled | Two prompts sequentially, no meta-labeling | |
| Three variants | Add vintage/retro as a third variant | ✓ |

**User's choice:** Three variants — Photorealistic, Illustrated/painterly, Vintage/retro cocktail book style

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, include save reminder | One-line reminder: save to images/, naming convention, img tag | ✓ |
| No, keep it clean | Just the prompts | |

**User's choice:** Yes, include save reminder

---

## Onboarding Reorder

| Option | Description | Selected |
|--------|-------------|----------|
| Light opt-in | One question: keep defaults or customize? | |
| Always full screen | Always collect name + voice + specialty at step 2 | ✓ |
| Platform-aware | Ask on ChatGPT/Grok; skip on Claude Projects | |

**User's choice:** Always full screen — every user goes through step 2 personalization

---

| Option | Description | Selected |
|--------|-------------|----------|
| Exactly as to-do.md | Name + voice preset (4) + specialty focus | |
| Name + voice only | Skip specialty focus | |
| Add more presets | Expand voice presets with additional options | ✓ |

**User's choice:** Add more presets — add "Nerdy / analytical" as 5th voice preset

---

| Option | Description | Selected |
|--------|-------------|----------|
| Nerdy / analytical | Add data-driven, science-focused preset | ✓ |
| Both nerdy + irreverent | Add both nerdy and irreverent/punk presets | |
| Nerdy + one more | Add nerdy plus a different 6th option | |

**User's choice:** Nerdy / analytical only (5 presets total)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Must match exactly | Agent and web UI use same step 2 content and order | ✓ |
| Can diverge | Different media = different step structures | |

**User's choice:** Must match exactly — Phase 2 web UI mirrors Phase 1 agent step 2 precisely

---

## Claude's Discretion

- Exact wording of WRONG/RIGHT examples — represent the ChatGPT failure mode faithfully
- Exact structure and wording of Variant A/B/C image prompt templates
- Minor formatting/wording cleanup in files if inconsistencies found

## Deferred Ideas

None — discussion stayed within phase scope.
