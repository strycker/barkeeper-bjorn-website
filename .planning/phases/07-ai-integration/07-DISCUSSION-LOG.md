# Phase 7: AI Integration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.
> **STATUS: IN PROGRESS** — discussion ongoing; persisted incrementally to survive connection loss.

**Date:** 2026-05-21
**Phase:** 07-ai-integration
**Areas discussed so far:** AI entry points / affordances, AI cocktail design output & draft storage, Chat surface architecture & context

---

## AI entry points / affordances

### Q1: How do "Ask Bjorn about this" and AI actions surface?

| Option | Description | Selected |
|--------|-------------|----------|
| Open the global chat drawer, seeded prompt | All AI entry points open the shared chat surface pre-seeded with context | ✓ |
| Inline panel per card | Each card hosts its own embedded AI response area | |
| Navigate to #chat route | Full-page chat with seeded prompt | |

**User's choice:** Open the global drawer with a seeded prompt
**Notes:** Applies to REC-04 ("Ask Bjorn about this" on every recipe card) and AI design/advice entry points across Inventory, Dashboard, Recommender.

---

## AI cocktail design output & draft storage (AI-03)

### Q1: What happens to an AI-designed recipe after generation?

| Option | Description | Selected |
|--------|-------------|----------|
| Save immediately AND keep chat card open | Dual behavior: persist the draft right away (durability) and keep the card open for conversational refinement | ✓ |
| Save only on explicit confirm | Draft lives in chat until user clicks Save | |
| Keep in chat, no auto-save | User copies result manually | |

**User's choice:** BOTH — auto-save the draft immediately AND keep the chat card open for editing/refinement
**Notes:** Durability is the driver — an interrupted connection must not lose a generated recipe. Conversational refinement supported (e.g. "generate a new recipe from this prompt", "generate a different name given the ingredients", "make it less sweet").

### Q2: When you refine an AI draft, how does it write back?

| Option | Description | Selected |
|--------|-------------|----------|
| Hybrid (+ checkpoint button) | In-place tweaks ("different name", "less sweet") update the same draft; "generate a new recipe from this" creates a new entry; plus a "Save draft copy before refining" button to checkpoint the current draft as a separate save before a new generation overwrites it | ✓ |
| Always in place | Every refinement overwrites the current draft | |
| Always new entry | Each generate/refine appends a new entry | |

**User's choice:** Hybrid + explicit "Save draft copy before refining" checkpoint button
**Notes:** The checkpoint button lets the user fork/preserve a good variation before letting a new generation overwrite the currently-open draft.

### Q3: How are AI drafts distinguished from confirmed Originals?

| Option | Description | Selected |
|--------|-------------|----------|
| Separate drafts.json + Drafts tab | Drafts stored in their own data/drafts.json file; a separate "Drafts" tab on the Recipes page; promote-to-Original button on each draft chip | ✓ |
| Draft flag + filter within recipes.json | status:'draft' inside recipes.originals, hidden behind a filter | |
| Save as normal originals | No distinction; delete unwanted ones manually | |

**User's choice:** Separate `drafts.json` file + separate "Drafts" tab; promote draft → Saved Original via a button on the draft chips
**Notes:** Keeps the Originals tab clean of experiments. Promotion moves a draft from drafts.json into recipes.originals.

---

## Chat surface architecture & context (CHAT-01..09, AI-02)

### Q1: Is the chat one global persistent surface, or does it reset per page?

| Option | Description | Selected |
|--------|-------------|----------|
| Two-surface model | Persistent "Chat with Bjorn" page + ephemeral quick-ask drawer | ✓ |
| Single global persistent drawer | One drawer survives navigation everywhere | (clicked, then refined) |
| Resets on navigation | Every page change aborts/clears | |

**User's choice:** Two distinct surfaces (refinement of the "Global & persistent" click):
- **"Chat with <barkeeper>" page** — a full chat window holding a SINGLE persisted conversation that retains context until the user explicitly clears it; returning to the page resumes the longer conversation. Mirrors the user's original markdown-agent design before the web UI was built.
- **Drawer** — quick-question surface; each open starts a CLEAN conversation (resets each time).

**Notes:** Both surfaces share the SAME full context. This supersedes the "single global drawer" reading of the earlier click.

### Q2: What context does the agent always receive? (expands CHAT-04)

**User's directive:** The agent should ALWAYS have context of:
- bartender personality (`barkeeper.json`)
- bar-owner profile (`bar-owner-profile.json`)
- mood
- Original recipes (`recipes.originals`)
- generated recipes (drafts — `drafts.json`)
- made recipes incl. tally count (`recipes.made_log`)
- other helpful stats

Purpose: respond like a real bartender assistant — helpful suggestions, classroom-style education, and mixologist-expert explanations of WHY a cocktail works.

**Conflict flagged:** CHAT-04 currently targets a 1500–2500 token system prompt (persona + flavor profile + compact inventory + vetoes). This richer context exceeds that target → token-budget / caching strategy needed (see open questions).

### Q3: Markdown-derived context

**User's directive:** If raw `data/*.json` files are not well-suited as agent context, derive `data/*.md` files from the JSON and send those to the agent instead. Reuses the canonical markdown representation the agent templates already expect.

**Notes:** Relates to Phase 8's `md-converter.js` (strict MD export). Phase 7 may need a lightweight MD-derivation utility, or to pull part of that converter forward.

---

## Architectural implications captured (for planning)

- **New data file:** `data/drafts.json` (5th JSON data file) — requires a `schema/drafts.json`, registration in `state.js` (`_data` + `_shas`, loadAll/save), and write path in `github-api.js` semantics.
- **Recipes view:** new "Drafts" tab alongside Originals/Favorites/Made; draft chips carry a "Promote to Original" action and the auto-save / checkpoint behaviors.
- **Global chat drawer:** a shared chat surface that all AI entry points open with a seeded prompt; AI cocktail design renders an editable, refinable card that dual-writes to drafts.json.
- **Source tagging:** AI drafts carry `_source: 'ai-generated'`; promotion to Originals re-tags to `_source: 'originals'`.
- **Two chat surfaces:** persistent `#chat` page (single saved thread until cleared) + ephemeral quick-ask drawer; shared context builder feeds both.
- **Persisted chat history:** contradicts CHAT-07 ("not persisted") — persistence target + history-windowing strategy TBD (open question).
- **Rich shared context:** context builder must assemble persona + profile + mood + originals + drafts + made_log/tallies + stats — exceeds CHAT-04's 1500–2500 token target; budgeting/caching strategy TBD (open question).
- **MD-derived context:** a JSON→MD derivation step (lightweight `md-converter` or pulled forward from Phase 8) feeds the agent canonical markdown rather than raw JSON.

## Open questions (resolved)

1. **Persisted chat history storage target** → **localStorage + manual save.** The `#chat` thread persists in localStorage (e.g. `bb_chat_history`) and survives reloads; a manual "Save conversation to GitHub" action lets the user checkpoint a thread when they want durability/cross-device. No commit per message.
2. **History management within token limits** → **Summarize older turns.** Older turns roll into a running summary (sent verbatim) while recent turns are sent in full. Requires a summarization step. Full history still retained locally for display. Supersedes CHAT-07's plain 10-turn in-memory window.
3. **Rich-context delivery & cost** → **Prompt caching.** The large stable context block (persona + profile + mood + originals + drafts + made-log/tallies + stats, as derived MD) is sent once with `cache_control` and reused across turns; cache refreshes only when underlying data changes. Enables rich context affordably. (Aligns with the claude-api skill's prompt-caching requirement.)

### Resulting structure for the system prompt / context
- **Cached block (stable):** persona + bar-owner profile + mood + originals + drafts + made-log w/ tallies + stats — built as derived markdown.
- **Running summary (semi-stable):** condensed older conversation turns.
- **Recent turns (volatile):** last N exchanges verbatim.
- **Current user message.**
