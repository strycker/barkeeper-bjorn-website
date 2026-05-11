---
phase: 01-agent-instructions-polish
verified: 2026-05-11T00:00:00Z
status: human_needed
score: 4/5 roadmap success criteria verified (2 deviate from roadmap wording but match locked planning decisions)
overrides_applied: 0
human_verification:
  - test: "Start a fresh ChatGPT Custom GPT session using the INIT_PROMPT.md Standard init block pasted as a Conversation Starter"
    expected: "The agent immediately begins onboarding (asks a single question about bar-building goals) — it does NOT display an options menu or summarize its capabilities"
    why_human: "INIT_PROMPT flow trigger is a platform-level behavior that depends on ChatGPT firing Conversation Starters automatically. Cannot verify programmatically whether the agent actually suppresses the options menu on first message across platforms."
  - test: "During onboarding, answer a question then check if the agent asks more than one question in its next reply"
    expected: "Each agent turn contains exactly one question; no numbered lists requesting information"
    why_human: "One-question rule is a runtime LLM behavioral constraint, not statically testable. The rule text and WRONG/RIGHT examples are verified present; actual compliance requires a live session."
---

# Phase 1: Agent Instructions Polish Verification Report

**Phase Goal:** Fix all open Tier 1 issues in `barkeeper-instructions.md` and related agent files so the agent behaves consistently and professionally across ChatGPT, Claude, Gemini, and Grok.
**Verified:** 2026-05-11
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Critical Finding: AGENT-XX IDs Not Present in REQUIREMENTS.md

The plans declare requirements `AGENT-01` through `AGENT-06`. These IDs appear only in `ROADMAP.md` (§Phase 1) and the plan frontmatter. They do not exist in `.planning/REQUIREMENTS.md`, which uses entirely different ID prefixes (SET-XX, ONB-XX, INV-XX, etc.). There is no traceability table entry for any AGENT-XX ID.

This is an **orphaned requirements issue** — the six requirement IDs this phase claims to satisfy are not registered in the canonical REQUIREMENTS.md. The ROADMAP.md description of Phase 1 serves as the only formal specification. All verification below is conducted against ROADMAP.md success criteria and locked planning decisions (CONTEXT.md D-01 through D-13).

---

## Goal Achievement

### Observable Truths (Roadmap Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC1 | Starting a fresh session produces INIT_PROMPT flow — not an options menu — on the first user message | ? UNCERTAIN | `barkeeper-instructions.md` line 83 explicitly says "do not present an options menu, do not ask 'what would you like to do?', do not summarize your capabilities. Just start." INSTALL.md has paste-ready Standard init blocks for ChatGPT (Conversation starters), Gemini (opening message), Grok (system prompt). Runtime behavior requires human test. |
| SC2 | Onboarding never presents more than one question per agent turn | ? UNCERTAIN | WRONG/RIGHT blockquote present (lines 71-77 of monolith, lines 9-14 of onboarding.md); `instructions/communication.md` also contains the rule with nested examples. Numbered-list ban explicit. Runtime compliance requires human test. |
| SC3 | After confirming a new original, agent offers image-generation prompt variants unprompted | ✓ VERIFIED with deviation | Three variants implemented (A Photorealistic, B Illustrated/painterly, C Vintage/retro) at line 547-553 of `barkeeper-instructions.md`. Roadmap says "two variants" — plan 03 explicitly documents that D-05 locked three and overrides the roadmap text. Auto-generation behavior confirmed ("automatically generate... do not ask permission first"). Old "offer to suggest" wording absent. |
| SC4 | The `recipes.md` recipe template uses `<img>` tag with raw GitHub URL as the default | ✓ VERIFIED | `recipes.md` line 30: `<img src="https://raw.githubusercontent.com/USERNAME/barkeeper-bjorn/refs/heads/BRANCH/images/[cocktailN]-image.png" width="400" alt="[Drink Name]">`. Old `width="200"` and `_short_name_001.png` pattern absent from all three sync points. |
| SC5 | Session-start menu for a returning user is ≤7 numbered items with a single greeting line — no preamble | ✗ FAILED (intentional deviation) | Actual menu has **8 items** (items 1-8, ending with "Chat about something else"). ROADMAP says ≤7. CONTEXT.md D-09 states the 8-item menu in `barkeeper-instructions.md` is already correct and was the intended target — plans explicitly sync the module to 8 items. Roadmap wording was not updated when D-09 locked 8 items. The single greeting line and no-preamble requirements ARE met. |

**Score:** 3/5 roadmap success criteria cleanly verified. SC3 and SC5 deviate from roadmap wording but are aligned with locked planning decisions (CONTEXT.md). SC1 and SC2 require human testing.

---

### Plan Must-Have Truths (All Plans)

#### Plan 01-01 Must-Haves (AGENT-01)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| D-01a | WRONG/RIGHT negative example block in barkeeper-instructions.md one-question blockquote | ✓ VERIFIED | Lines 74-75: `> **WRONG:** *"What's your name? And where are you based?"*` / `> **RIGHT:** *"What's your name?"*` |
| D-01b | Explicit numbered-list ban present in same rule block | ✓ VERIFIED | Line 77: `> **No numbered question lists.** Never write "1. ... 2. ..." in any message that requests information from the user` |
| D-02a | `instructions/communication.md` explicitly names recipe design and analytics mode | ✓ VERIFIED | Line 10: "This applies in onboarding, re-evaluation, follow-ups, recipe design, analytics mode, and casual conversation." |
| D-02b | Communication Style bullet in `barkeeper-instructions.md` mirrors communication.md | ✓ VERIFIED | Line 639: identical enumeration including "recipe design, analytics mode" |
| WRONG/RIGHT in onboarding.md | Mirror of the WRONG/RIGHT block in instructions/onboarding.md | ✓ VERIFIED | Lines 11-14 of onboarding.md contain the identical WRONG/RIGHT block and numbered-list ban |

#### Plan 01-02 Must-Haves (AGENT-02, AGENT-05)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| D-03 | Always-show-menu rule present in both monolith and module | ✓ VERIFIED | Both files line: "**Always show the menu first for returning users**, regardless of how the user opens." |
| D-03 Exception | Old permissive "honor it directly" reworded to named-tasks-only | ✓ VERIFIED | Old text absent (grep returns 0). "**Exception (named tasks only):**" present in both files. |
| D-09 | Module synced to 8-item menu matching monolith | ✓ VERIFIED | Both files: items 1-8 identical (diff shows no output). "7. Analytics mode" and "8. Chat about something else" present. |
| D-04 | INSTALL.md has paste-ready Standard init blocks for ChatGPT, Gemini, Grok | ✓ VERIFIED | 3 occurrences of "Read all your knowledge files..." in INSTALL.md. Field names: "Conversation starters" (ChatGPT), "opening message" (Gemini), "system prompt" (Grok). |

#### Plan 01-03 Must-Haves (AGENT-03)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| D-05a | Three variants auto-generated without asking | ✓ VERIFIED | "automatically generate three image-prompt variants... Do not ask permission first" (line 547). Old "offer to suggest" absent. |
| D-05b | Variant C references 1920s-1960s style | ✓ VERIFIED | Line 551: "1920s–1960s cocktail book illustration style — Trader Vic, Esquire mid-century" |
| D-06 | Flavor axes excluded from prompt content | ✓ VERIFIED | Line 547: "Do **not** include the user's flavor axes in the prompt" |
| D-07 | Verbatim save-reminder blockquote present | ✓ VERIFIED | Line 553: `> *"Save to \`images/\` as \`[cocktailN]-image.png\` and link it in \`recipes.md\` with the \`<img>\` tag format."*` |

#### Plan 01-04 Must-Haves (AGENT-04)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| D-08a | All three sync points use `width="400"` and `[cocktailN]-image.png` | ✓ VERIFIED | barkeeper-instructions.md line 593, recipes.md line 30, instructions/communication.md line 45: all use `width="400"`. |
| D-08b | Old `width="200"` and `_short_name_001.png` absent everywhere | ✓ VERIFIED | All three files return 0 matches for old patterns. |
| Mirror S4 | Recipe Image lines byte-identical in monolith and recipes.md | ✓ VERIFIED | Both use identical `<img>` tag with `width="400"`, `[cocktailN]-image.png`, `alt="[Drink Name]"`. |

#### Plan 01-05 Must-Haves (AGENT-06)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| D-10 | New Phase F2 — Bartender Personalization inserted as full step 2 | ✓ VERIFIED | Both files: `### Phase F2 — Bartender Personalization` exists. "Always present this as a full step" present. |
| D-10 transition | Verbatim transition prompt present | ✓ VERIFIED | Both files: `> *"Before we go further — I'm Barkeeper Bjorn by default, but let's make sure I'm set up right for you."*` (2 occurrences per file: F2 and M2). |
| D-11 | All 5 voice presets verbatim | ✓ VERIFIED | All 5 present in both files (10 matches each from extended grep counting both F2 and M2). |
| D-12 | All 5 specialty focus options verbatim | ✓ VERIFIED | All 5 present in both files (10 matches each). |
| D-13 | Field order: name → voice preset → specialty focus | ✓ VERIFIED | F2 section lists "Bartender name", then "Voice preset", then "Specialty focus" in that order. |
| Mirror S2 F2 | Phase F2 block byte-identical between monolith and module | ✓ VERIFIED | diff between the two F2 blocks produces no output. |
| Mirror S2 M2 | Phase M2 block byte-identical between monolith and module | ✓ VERIFIED | diff between the two M2 blocks produces no output. |

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `barkeeper-instructions.md` | One-question rule with WRONG/RIGHT block | ✓ VERIFIED | Lines 71-77: blockquote with WRONG/RIGHT + numbered-list ban. Contiguous (5 lines starting with `>`). |
| `barkeeper-instructions.md` | Three-variant image-prompt block | ✓ VERIFIED | Lines 547-553: Variants A/B/C with auto-generation rule and D-07 save reminder. |
| `barkeeper-instructions.md` | Phase F2 and M2 Bartender Personalization | ✓ VERIFIED | Lines 180+ (F2), 355+ (M2). All D-11/D-12 lists present. |
| `barkeeper-instructions.md` | Session-start menu with always-show-menu rule | ✓ VERIFIED | Lines 89-108: 8-item menu, always-show-menu rule as first bullet, Exception(named tasks only) present. |
| `instructions/onboarding.md` | One-question rule WRONG/RIGHT block | ✓ VERIFIED | Lines 9-14: identical content to monolith. |
| `instructions/onboarding.md` | 8-item session-start menu (D-09 drift fix) | ✓ VERIFIED | Lines 30-39: items 1-8, byte-identical to monolith menu items. |
| `instructions/onboarding.md` | Phase F2 and M2 Bartender Personalization | ✓ VERIFIED | Lines 115+ (F2), 290+ (M2). Mirrors monolith. |
| `instructions/communication.md` | One-question rule with recipe design, analytics mode | ✓ VERIFIED | Line 10: full enumeration + WRONG/RIGHT nested bullets. |
| `instructions/communication.md` | `width="400"` image format note | ✓ VERIFIED | Line 45: `Images use \`<img src="..." width="400">\`` |
| `recipes.md` | `<img>` tag with `width="400"` and raw GitHub URL | ✓ VERIFIED | Line 30: canonical `<img>` form with `width="400"`, `[cocktailN]-image.png`, `alt="[Drink Name]"`. |
| `INSTALL.md` | Paste-ready Standard init blocks for ChatGPT/Gemini/Grok | ✓ VERIFIED | 3 fenced code blocks with full Standard init text. Field names match per platform. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `barkeeper-instructions.md` one-question blockquote | `instructions/communication.md` Core Principles bullet | Mirror obligation S2 | ✓ WIRED | Both enumerate "recipe design, analytics mode"; both contain WRONG/RIGHT examples. |
| `barkeeper-instructions.md` one-question blockquote | `instructions/onboarding.md` ONE QUESTION rule | Mirror obligation S2 | ✓ WIRED | Identical WRONG/RIGHT content in both. |
| `barkeeper-instructions.md` session-start menu | `instructions/onboarding.md` session-start menu | Mirror obligation S2 | ✓ WIRED | Menu items 1-8 byte-identical between files (diff empty). |
| `INSTALL.md` paste blocks | `INIT_PROMPT.md` Standard init text | Verbatim copy D-04 | ✓ WIRED | "Read all your knowledge files..." appears 3x in INSTALL.md (verified against INIT_PROMPT.md Standard init section). |
| `barkeeper-instructions.md` D-07 save reminder | `recipes.md` Image field | Filename `[cocktailN]-image.png` must match | ✓ WIRED | Both use `[cocktailN]-image.png` — 2+ hits in monolith (save reminder + recipe template), 1 hit in recipes.md. |
| `barkeeper-instructions.md` Phase F2 | `instructions/onboarding.md` Phase F2 | Mirror obligation S2 | ✓ WIRED | diff produces no output — byte-identical. |

---

### Data-Flow Trace (Level 4)

Not applicable — this phase modifies markdown agent instruction files, not runnable code with data flows.

---

### Behavioral Spot-Checks

Step 7b SKIPPED for static file content — no runnable entry points. All changes are LLM behavioral instruction text.

---

### Requirements Coverage

| Requirement | Source Plan | Description (from ROADMAP.md) | Status | Evidence |
|-------------|-------------|-------------------------------|--------|----------|
| AGENT-01 | 01-01 | One-question-at-a-time rule with explicit formatting ban | ✓ SATISFIED | WRONG/RIGHT block, numbered-list ban, all-contexts enumeration present in monolith and both modules. |
| AGENT-02 | 01-02 | Auto-launch INIT_PROMPT on first message (no options menu) | ? NEEDS HUMAN | Agent instruction text says "do not present an options menu"; INSTALL.md has paste-ready blocks. Platform-level behavior requires live test. |
| AGENT-03 | 01-03 | Post-confirmation image-generation prompt (two variants per roadmap, three per D-05) | ✓ SATISFIED (D-05 override) | Three variants implemented automatically. Roadmap said "two" but plan 03 explicitly overrides with D-05 locked decision of three. |
| AGENT-04 | 01-04 | `recipes.md` image template updated to `<img>` tag format | ✓ SATISFIED | `recipes.md` line 30 uses `<img>` with `width="400"`, raw GitHub URL, and `alt` attribute. |
| AGENT-05 | 01-02 | Session-start returning-user menu (warm greeting + ≤7 items, no preamble) | ✓ SATISFIED (D-09 override) | Menu has 8 items (not ≤7) per D-09. Warm greeting line present. No preamble. Roadmap count was outdated. |
| AGENT-06 | 01-05 | Bartender personalization moved to step 2 of onboarding | ✓ SATISFIED | Phase F2 and M2 Bartender Personalization present as full steps in both files. D-11/D-12/D-13 all implemented. |

**Orphaned requirements note:** AGENT-01 through AGENT-06 are defined only in ROADMAP.md, not in REQUIREMENTS.md. No traceability table entries exist for these IDs. The REQUIREMENTS.md was updated with a new ID scheme (SET-XX, ONB-XX, etc.) that covers the web UI phase but does not backfill the agent instruction IDs from Phase 1.

---

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| None | — | — | All modified files contain substantive instruction text. No TODOs, stubs, or placeholder returns found. |

---

### Human Verification Required

#### 1. Fresh Session INIT_PROMPT Flow (SC1 / AGENT-02)

**Test:** On ChatGPT, open the Barkeeper Bjorn Custom GPT configured per INSTALL.md. The Conversation Starter should auto-fire. Observe the first agent response.
**Expected:** Agent immediately begins onboarding with a single question about bar-building goals (Full vs. Minimalist track). It does NOT say "What would you like to do?" or present an options menu or summarize capabilities.
**Why human:** The instruction text forbidding options-menu behavior is present, but whether ChatGPT/Gemini/Grok platforms actually fire the Conversation Starter automatically and whether the LLM follows the instruction cannot be verified from static file inspection alone.

#### 2. One-Question-At-A-Time Rule in Live Session (SC2 / AGENT-01)

**Test:** During onboarding on any platform, answer one question at a time and watch whether the agent asks only one question per reply. Also try sending a vague opener ("hi") after onboarding to see if the session-start menu appears without preamble.
**Expected:** Every agent reply during onboarding asks exactly one question. No numbered question lists. Session-start menu appears immediately after the single greeting line with no explanation of what the agent does.
**Why human:** LLM compliance with behavioral rules is probabilistic and varies by platform and model. The rule text is verified present and correct; live compliance requires a real session.

---

### Gaps Summary

#### SC5 Deviation: 8-Item Menu vs. Roadmap's ≤7 Claim

The ROADMAP.md success criterion 5 says "≤7 numbered items." The actual implementation has 8 items. This is intentional: CONTEXT.md D-09 explicitly states the 8-item monolith menu is correct and the plan fixes the module to match it. The ROADMAP was not updated when D-09 locked the decision.

This is not a code defect — it is a planning artifact. The behavior (8 items, correct analytics mode item, single greeting, no preamble) matches D-09's locked intent. The ROADMAP's "≤7" text needs updating to reflect the actual decision.

**Suggested override:** If the team accepts the 8-item menu as final, add to VERIFICATION.md frontmatter:

```yaml
overrides:
  - must_have: "Session-start menu for a returning user is ≤7 numbered items with a single greeting line — no preamble"
    reason: "D-09 in CONTEXT.md explicitly locks the 8-item menu as correct. The roadmap '≤7' text predates D-09 and was not updated. The 8-item implementation matches the locked planning decision."
    accepted_by: "developer"
    accepted_at: "ISO timestamp"
```

#### AGENT-XX IDs Absent from REQUIREMENTS.md

The six requirement IDs from this phase are not in the canonical REQUIREMENTS.md. This does not block the phase (the requirements are fully satisfied per ROADMAP.md) but is a traceability gap. If REQUIREMENTS.md is the authoritative source, AGENT-01 through AGENT-06 should be added to it with their phase mapping.

---

*Verified: 2026-05-11*
*Verifier: Claude (gsd-verifier)*
