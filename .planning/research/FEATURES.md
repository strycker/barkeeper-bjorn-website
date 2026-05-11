# Features Research: Cocktail & Home Bar Apps

**Domain:** Home bar management + cocktail recommendation SPA with AI bartender
**Researched:** 2026-05-11
**Scope:** Informs active milestone additions to an existing app (inventory, recommender, AI chat, recipe editor, export/import)

---

## Table Stakes (Must Have)

Features users expect as baseline — missing any of these makes the product feel unfinished.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Inventory "what can I make" filter | Every competing app (Cocktail Flow, My Bar, Mixel, Cocktail Party) has this as their #1 feature | Low | Already shipped; reinforcing scope |
| One-away / near-miss matching | Users explicitly call this out: "show me what I almost can make" | Low | Already shipped as "one-away tab" |
| Recipe detail: glass, garnish, technique | Industry standard per Tales of the Cocktail; users expect specifics, not "garnish with lime" | Medium | Garnish must be precise |
| Step-by-step preparation instructions | Users expect ordered steps, not a paragraph | Low | |
| Ingredient measurements (oz/ml) | Unit display is critical; metric vs US customary toggle expected | Low | |
| Favorites / wishlist / saved recipes | Every app has this; users curate across multiple sessions | Low | Already shipped |
| Shopping list from missing ingredients | Direct logical extension of near-miss; Cocktail Party and My Cocktail Bar both surface this | Low | Already shipped |
| Search by ingredient or name | Basic discoverability; apps that removed this (Cocktail Flow v2) faced severe backlash | Low | |
| Mobile-responsive layout | Home bar context = phone in hand | Medium | Already mobile-first |
| Persistent auth across sessions | Users don't re-authenticate per session | Low | localStorage pattern handles this |

---

## Differentiators (Competitive Advantage)

Features that meaningfully separate this app from alternatives. These are where investment creates durable value.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Flavor profile radar + personalized scoring | Diageo 2024 research shows users want taste-matched recommendations, not just inventory matches | High | Already shipped radar; scoring in recommender |
| Per-session mood sliders | BarGPT and Bartender's Choice ask "how are you feeling?" up front; Cocktail Flow uses strength/style filters; mood context produces dramatically better recs | Medium | Active item |
| Occasion tags (date night, party, solo nightcap, etc.) | My Cocktail Bar's whimsical categories ("The Drink to Have When You're in Havana") are a fan favorite; occasion filtering is underserved in most apps | Low | Active item |
| AI chat with inventory awareness | Mixel's "Bart" AI feature is praised specifically for combining inventory knowledge + natural language; BarGPT starts from mood/occasion/ingredients; inventory-aware AI is SOTA differentiator | High | Active item; BYOK pattern |
| AI-designed original recipes | Users want "design me a cocktail around my Islay Scotch" — generative capability goes beyond curation | High | Active item |
| Flavor-axis evolution log | Tracking how taste changes over time — no competitor app does this | Medium | Already shipped |
| User-owned data in GitHub | Data portability angle: no app currently lets users own their own data this way; appeals to privacy-minded / technical users | Low (infra already done) | Core architecture already shipped |
| Structured inventory fields (brand/style/tier) | Most apps use freeform strings; structured fields enable better substitution logic and AI context | Medium | Active item |
| Paste-in inventory onboarding | No competitor allows importing existing session data from ChatGPT/Claude notes; reduces the biggest onboarding friction | Medium | Active item |

---

## Anti-Features (Deliberately Avoid)

Things that annoy users or add complexity without delivering value. Evidence-backed from user reviews.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Subscription paywalls on core features | Cocktail Flow's shift to $20/year subscription caused significant user backlash; many moved to free alternatives (Shookd, Cocktail Party) | Keep core features free; monetize via BYOK API cost transparency |
| Removing previously free features | Cocktail Flow lost users permanently when it moved recipes behind a paywall post-update | Don't regress existing functionality |
| Mandatory social / community features | Highball's social network angle limits appeal; most home bartenders don't want a "cocktail Instagram" | Keep sharing opt-in and lightweight |
| Recipe duplicate proliferation | noflair users complained about duplicate entries and self-reviewed recipes polluting quality | Curate classics DB carefully; user recipes in a separate namespace |
| Overlong onboarding with no escape | Multi-step wizards without skip/return frustrate return users; the app's own user (Glenn) identified this | Add skip/return to every onboarding step |
| Asking personalization questions that change nothing | UX research consensus: if the post-onboarding experience is identical for every answer, the questions are decorative and annoying | Flavor axis answers must visibly affect recommendations |
| Locking AI behind a non-optional API cost | BYOK pattern is correct; users accept cost when they control it and can see it | Surface API key setup clearly; show estimated cost per session |
| Excessive fields on every recipe form | UX best practice: start with basics; advanced fields (batch scaling, technique notes) should be optional/collapsible | Required: name, ingredients, steps. Optional: glass, garnish, technique, tags, difficulty |

---

## AI Chat UX Patterns

What good "ask an AI bartender" UX looks like, based on BarGPT, Mixel's Bart, and serverless AI bartender implementations.

### Core principles

**Inventory injection via system prompt, not conversation.** The AI must know what's in the bar before the user asks anything. Effective implementations inject the full inventory + flavor profile into the system prompt. The user should never have to re-state what they have. Constraint in the system prompt ("ONLY recommend drinks that can be made from these ingredients, or flag if you're suggesting something that requires a purchase") is critical — without this, the AI hallucinates available ingredients.

**Session memory within the conversation, no cross-session persistence required.** Users expect the AI to remember "we were talking about Islay Scotch" within a chat session. Cross-session memory is a nice-to-have, not expected at this stage.

**Natural language input, structured output.** Users say "something smoky and low ABV for a Tuesday night." The AI interprets mood, occasion, and constraints, then returns: (1) a specific recipe recommendation, (2) why it matches the stated mood, (3) what to sub if one ingredient is missing. Presenting a bulleted recipe inline in chat is the accepted pattern — don't just link to a recipe card.

**Character and voice matter.** AI bartender apps with a distinct persona (Bart, Bjorn) consistently outperform generic chatbot UIs. The bartender should explain its choices, offer alternatives, and push back when something won't work — not just generate output.

**Constraint-first prompt engineering.** From serverless AI bartender research: vague system prompts ("you are a helpful bartender") produce unreliable results. Effective prompts include explicit rules: "ALWAYS reference the user's inventory before recommending. ONLY suggest drinks buildable from the provided ingredients unless user explicitly asks to discover something new. NEVER recommend a drink the user has vetoed."

**Follow-up conversation is the differentiator.** The value over a recipe search is the dialogue: "What if I don't have Campari?" → "What would you sub in the Negroni?" → "Can you make it lower ABV?" This requires good context window management. Keep full conversation history in memory; don't truncate aggressively.

**Show the reasoning.** Users trust AI recommendations more when the AI explains: "I'm suggesting this because you said you wanted something smoky and you have Laphroaig in your bar." Transparency builds trust and teaches the user about flavor.

### BYOK-specific UX

- API key entry should be in Settings, not surfaced during chat initiation
- Show a clear indicator when Claude is connected (e.g., "Bjorn is online")
- If no API key is configured, show a friendly prompt with instructions — not an error
- Never display the raw key; mask after entry
- Estimated cost display is a nice-to-have (each Claude API call costs roughly $0.003–$0.015 at typical lengths)
- Confidence: MEDIUM — based on general BYOK UX patterns; no cocktail-app-specific BYOK research found

---

## Mood/Occasion Recommendation UX

How top apps handle "I'm in the mood for X" — synthesized from BarGPT, Bartender's Choice, Cocktail Flow, My Cocktail Bar, and Diageo's 2024 research.

### What works

**Sliders for continuous dimensions beat dropdowns for categorical ones.** "How boozy?" and "How sweet?" work best as sliders. "What occasion?" works best as tags/chips. Combining both gives users enough expressive power without overwhelming them.

**Occasion as tags, not a dropdown.** Tags that feel evocative work better than clinical categories. "Date night" beats "Romantic occasion." "Party pitcher" beats "High volume." "Solo nightcap" beats "Low quantity." My Cocktail Bar's "The Drink to Have When You're in Paris" is loved precisely because it's evocative.

**Spirit-first is a valid alternative entry point.** "I feel like bourbon tonight" is as common as "I feel like something citrusy." The recommender should accept spirit-first queries as a mood signal.

**Strength as a first-class filter.** Cocktail Flow uses strength (light/medium/strong) as a top-level filter; this correlates with occasion (weeknight = lighter, celebration = stronger). Map to ABV range internally.

**Flavor dimension labels that non-experts understand.** "Bitter" is fine. "Citrus-forward" is fine. Avoid "acidic" or "tannic" — these are professional vocabulary.

### Recommended pattern for this app

1. Per-session mood panel appears above recommender results (not blocking them)
2. 3–4 sliders: Spirit Strength | Sweetness | Citrus/Fresh vs Rich/Warming | Adventurous vs Familiar
3. Occasion chip selector: Weeknight Solo | Date Night | Hosting | Celebration | Exploring something new
4. Results re-rank in real time (no separate "apply" button)
5. Mood context also passed to AI chat system prompt so Bjorn knows the occasion

---

## Inventory Management Pain Points

What frustrates users in existing apps — synthesized from noflair reviews, My Cocktail Bar user feedback, WISK research, and general home bar app discussion.

### Critical pain points

**Manual entry is tedious at scale.** Once a home bar reaches 15–20 bottles, entering each individually becomes a friction point. noflair's barcode scan addresses this for new acquisitions; the app's paste-in inventory feature addresses the migration problem for users with existing data elsewhere. Both are the right moves.

**Freeform strings break matching.** Apps using string matching for inventory against recipe ingredients fail when "Woodford Reserve" doesn't match "bourbon." Structured fields (spirit category, style) are the industry solution — WISK's 200,000-bottle database uses this. The active work on structured fields (brand/type/style/tier) directly addresses this.

**Duplicates.** noflair users complained about duplicate entries proliferating. Home bar apps don't enforce uniqueness; users end up with "Campari" and "campari" and "Campari (liqueur)" all as separate entries. Prevention: normalize on input, warn on suspected duplicates.

**No quantity tracking = no shopping intelligence.** Users can't tell the app "I'm almost out of Angostura bitters" in most apps. Tier-based tracking ("full / partial / almost gone") is the pragmatic solution for home use (no need for professional oz-level counting).

**Pantry ingredients are a different mental model than spirits.** Users think of bitters, syrups, and citrus differently from their spirit bottles. The tabbed inventory (Spirits / Pantry / Vetoes) is the right separation. Vetoes are underused in competitor apps — this is a real differentiator when implemented well.

**In-place editing is expected.** Users don't want to delete and re-add a bottle to correct a typo. Inline/in-place editing is expected per UX research on data management apps.

---

## Export/Import Expectations

What formats users expect, based on Bar Assistant documentation, Bevnap/Mixel feature sets, and general data portability patterns.

### Export

**JSON bundle (full backup)** — expected by technical users; should include all four data files in a single downloadable .zip or .json. Bar Assistant exports JSON, YAML, and Markdown. For this app, JSON is the system of record, so a JSON bundle of all `data/*.json` files is the minimum viable backup format.

**AI context text export** — the app's unique use case: generating a formatted Markdown/text snapshot that can be pasted into a new Claude Projects or ChatGPT session. This is not offered by any competitor and directly addresses the primary user's workflow. Format should mirror the existing `.md` files (inventory.md, bar-owner-profile.md, etc.).

**Recipe cards (human-readable)** — nice-to-have; Bevnap exported to plain text and PDF. Low priority for this milestone but expected eventually.

### Import

**JSON bundle import** — round-trip with the export format; selective import (choose which data files to merge vs overwrite) is expected for safety. Bar Assistant implements selective import well.

**Paste-in text for inventory** — the active onboarding item; users with existing Claude/ChatGPT session data should be able to paste their inventory list and have it parsed. This is not a standard format — needs a flexible parser.

**Conflict handling** — when importing over existing data, users expect: preview what will change, option to merge vs replace, no silent data loss.

### Format priorities

1. JSON (full backup/restore) — HIGH priority
2. AI context text (.md export for Claude/ChatGPT paste-in) — HIGH priority (unique to this app)
3. PDF recipe cards — LOW priority, defer
4. CSV — LOW priority, not a user expectation for cocktail apps specifically

---

## Confidence Levels

| Finding | Confidence | Basis |
|---------|------------|-------|
| Table stakes features (inventory match, one-away, favorites) | HIGH | Documented across 8+ apps; consistent across review sources |
| Mood sliders + occasion tags as differentiators | HIGH | BarGPT, Bartender's Choice, Cocktail Flow all implement; Diageo 2024 research confirms demand |
| Subscription backlash / anti-paywall sentiment | HIGH | Cocktail Flow reviews, MacRumors forum threads, direct user quotes |
| AI chat UX patterns (inventory injection, constraint prompts) | MEDIUM | Serverless AI bartender implementations; no large-scale user research found |
| BYOK UX patterns | MEDIUM | General BYOK product patterns; limited cocktail-app-specific evidence |
| Structured inventory fields as differentiator | MEDIUM | WISK professional solution evidence; home bar app evidence thinner |
| AI-context text export as unique value | MEDIUM | No competitor found offering this; inferred from primary user feedback, not broad market research |
| Occasion tag vocabulary (evocative beats clinical) | MEDIUM | My Cocktail Bar anecdote + general UX research on filter design (NN/g) |
| Paste-in inventory parser for onboarding | LOW | Single-user (Glenn) pain point; broader market demand not verified |
| Recipe form field priorities | MEDIUM | Tales of the Cocktail professional guidance + general UX form research; no A/B test data |
