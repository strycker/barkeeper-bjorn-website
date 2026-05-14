# Barkeeper Bjorn — Improvement Roadmap

> *A living document. Items move from backlog to in-progress as work begins. Organized by tier: quick fixes first, then structural improvements, then product/platform ambitions.*

---

## Tier 1 — Quick Fixes (low effort, high impact)

These are targeted edits to existing files. No new infrastructure needed.

### 1.1 — Enforce one-question-at-a-time in onboarding

**Problem:** ChatGPT (and other LLMs) ignore the intent of the structured onboarding flow and dump multiple questions at once. The current `barkeeper-instructions.md` doesn't explicitly forbid this.

**Fix:** Add a hard rule to the onboarding section:

> *"Ask exactly one question at a time. Do not list multiple questions in a single message, regardless of how related they are. Wait for the user's response before proceeding to the next question. This rule applies throughout onboarding and re-evaluation."*

Also add a formatting rule that bans numbered-list question dumps.

**Files:** `barkeeper-instructions.md`

---

### 1.2 — Auto-launch INIT_PROMPT for fresh installs

**Problem:** ChatGPT greeted with an elaborate menu of options ("Option A / B / C") rather than running `INIT_PROMPT.md`. The user had to manually ask to use the init prompt.

**Fix:** Add a "Session Start" rule to `barkeeper-instructions.md`:

> *"If the user's first message does not include a clear task or question, immediately run the INIT_PROMPT flow — do not present an options menu or ask what the user wants to do. Begin with: 'Initialize Barkeeper Bjorn.' and proceed."*

Also update `INSTALL.md` platform notes (ChatGPT Custom GPT, Gemini Gem, Grok) to explicitly recommend setting the GPT's opening message to the contents of `INIT_PROMPT.md`, so the init fires automatically on first chat open.

**Files:** `barkeeper-instructions.md`, `INSTALL.md`

---

### 1.3 — Cocktail image workflow in agent instructions

**Problem:** When a new original is confirmed, the agent doesn't proactively offer to help generate artwork. The image field exists in the template but the agent doesn't prompt for it.

**Fix:** Already partially addressed (v1.1 of `barkeeper-instructions.md`). Extend to include:
- Suggest a specific image-generation prompt (Midjourney / DALL-E style) tuned to the cocktail's profile, color palette, and occasion.
- Offer two prompt variants: one photorealistic, one illustrated/painterly.
- Remind user to save images to `images/` with the naming convention and link them via `<img>` tag in `recipes.md`.

**Files:** `barkeeper-instructions.md`

---

### 1.4 — Update `recipes.md` image field template to use `<img>` tag

**Problem:** The current template uses a backtick path string. The working format (as established in Glenn's `[cocktail7]`) is an HTML `<img>` tag with a raw GitHub URL and fixed width.

**Fix:** Update the recipe template block in `recipes.md` (and the matching block in `barkeeper-instructions.md`) to show the `<img>` format as the default.

**Files:** `recipes.md` (main template), `barkeeper-instructions.md`

---

### 1.5 — Session-start menu for returning users

**Problem:** When a returning user starts a session (files already populated), the agent has no consistent entry point. ChatGPT defaulted to a verbose "Option A / B / C" menu that felt more like a product pitch than a bartender greeting. The correct behavior is a warm, focused menu that respects the user's time and leads directly into action.

**Behavior spec:**

On session start with populated files, the agent greets the user by name and presents a short numbered menu. The persona name in the greeting comes from `barkeeper.md` (default: Barkeeper Bjorn, but user may have renamed).

Example:

> *"Hey Glenn — Barkeeper Bjorn here. What are we doing tonight?"*
>
> 1. Make me a drink from what I have
> 2. Design a new original
> 3. See my current recipe list
> 4. What should I buy next? (gap analysis)
> 5. Update my inventory
> 6. Review my flavor profile
> 7. Chat about something else

Rules:
- Always exactly one greeting line, then the numbered menu. No preamble, no story, no product pitch.
- **"Chat about something else"** is always the last option.
- If the user skips the menu and just says something ("make me something smoky"), honor it directly — the menu is a convenience, not a gate.
- The menu items can expand slightly over time (e.g., "See drink history" once history tracking exists), but keep it to 7–9 items maximum.

**Option 3 — "See my current recipe list" behavior:**

- **Fewer than 10 originals:** Display all of them immediately in a compact card format — name, creator, base spirit, method, and one-line occasion/profile. No need to ask which ones.
- **10 or more originals:** Display names only in a numbered list. User selects one or more by number to read in full. Selected recipes are shown with full detail: ingredients table, method, garnish, profile, image if present.

Compact card format (for < 10):
```
**[cocktailN] Drink Name** — Created by [attribution]
Base: [spirit] | Method: [shaken/stirred/built] | Occasion: [one phrase]
```

**Files:** `barkeeper-instructions.md`

---

### 1.6 — Move bartender personalization earlier in agent onboarding

**Problem:** In the text-based AI agent flow, the bartender name/voice/personality questions appear late in onboarding — after the flavor axes, after the inventory questions. By that point the agent has been speaking generically for several exchanges. The user should meet their bartender (and confirm the name and persona) immediately after providing their own name and location, so the rest of onboarding feels like a conversation with a known character rather than a generic assistant.

**Fix:** Reorder the onboarding script in `barkeeper-instructions.md` so that after collecting the user's name and general background (questions 1–2), the agent immediately asks:
> *"Before we go any further — I'm Barkeeper Bjorn by default, but you can rename me and shape my personality. Want to keep the defaults, or customize?"*

If the user says keep defaults, proceed. If they want to customize, collect: new name, voice preset (professional / warm / terse / theatrical), and specialty focus (classics / modern / tiki / NA-forward / no preference).

This same order fix is tracked for the web UI onboarding in **3.1.7**.

**Files:** `barkeeper-instructions.md`, `instructions/onboarding.md`

---

## Tier 2 — Structural Improvements ✓ Complete

These required new files or meaningful refactoring of existing ones. No new tech stack.

### 2.1 — JSON schema normalization (with bidirectional MD sync) ✓

**Problem:** The current `.md` files are human-readable and LLM-parseable, but not machine-readable. A future API, recommender, or UI would need structured data. However, the `.md` files must remain fully usable for humans — users will continue to edit them by hand.

**Data architecture:**
- **JSON is the system of record.** All writes from the app, API, and agent go to JSON first.
- **MD files are derived from JSON.** They are regenerated whenever JSON changes — either by the agent, by a sync script, or by the future web UI. They are the human-readable view of the canonical data.
- **Bidirectional sync:** If a user edits an `.md` file by hand (the expected workflow for most users), Bjorn detects the change at the next session start, reconciles the diff against the JSON, and updates the JSON to match. The agent narrates this: *"I noticed you updated `inventory.md` since last time — I've synced those changes into the structured data."*
- No pure-JSON workflow is imposed on users. The `.md` files remain first-class and fully editable.

**Schema files to define:**
- `schema/inventory.schema.json`
- `schema/recipes.schema.json`
- `schema/bar-owner-profile.schema.json`
- `schema/barkeeper.schema.json`

**Data files (generated, not hand-edited):**
- `data/inventory.json`
- `data/recipes.json`
- `data/bar-owner-profile.json`
- `data/barkeeper.json`

**Agent instruction addition:** "At session start, if JSON data files exist, check whether the corresponding `.md` files have been modified since the last sync. If yes, parse the changes and offer to update the JSON. If JSON files don't exist yet, offer to generate them from the current `.md` files."

**Files:** New `schema/` and `data/` directories; `barkeeper-instructions.md` updates

---

### 2.2 — Modular prompt architecture ✓

**Problem:** `barkeeper-instructions.md` is a monolithic 20KB file. As features grow, it becomes harder to maintain, harder to update selectively, and harder to diff.

**Plan:** Split into modules:
- `instructions/core.md` — role, mandate, file table
- `instructions/onboarding.md` — full track, minimalist track, impatience detection
- `instructions/behavioral-rules.md` — inventory, vetoes, attribution, originals, substitutions, gap analysis
- `instructions/re-evaluation.md` — periodic review logic
- `instructions/communication.md` — style, formatting, persona application
- `instructions/safety.md` — mental health guardrails, NA recommendations

A top-level `barkeeper-instructions.md` would `include` or concatenate these — or platforms that support multiple knowledge files (Claude Projects) can load them individually.

**Files:** New `instructions/` directory; `barkeeper-instructions.md` becomes an index/concat

---

### 2.3 — State management design (inventory depletion + preferences learning) ✓

**Problem:** The agent has no concept of time within a session. It doesn't track that you used 2 oz of cognac tonight, doesn't decrement bottle levels, and doesn't record preference signals from in-session feedback.

**Plan:**
- Define a lightweight `session-state.md` file (or JSON) that the agent writes to during a session:
  - Ingredients used (type + approximate amount)
  - Cocktails built this session
  - Feedback signals ("liked it," "too sweet," "make it again")
  - Profile update candidates (not yet written back to `bar-owner-profile.md`)
- Agent instruction: at session end, summarize what changed and prompt user to commit updates to the canonical files.
- Longer-term: this becomes the input layer for the analytics brain (see Tier 3).

**Files:** New `session-state.md` template; `barkeeper-instructions.md` updates

---

### 2.4 — Analytics intelligence layer ✓

**Problem:** Glenn has a PhD in physics and runs a Decision Sciences team. The current agent is a knowledgeable bartender, not a recommendation engine. There's a gap.

**Plan:** Add an analytics mode — triggered by a slash command or keyword — that shifts the agent from conversational bartender into data analyst:

- **Cocktail gap analysis:** Given current inventory, compute the set of buildable classics, rank by user's flavor-axis alignment, surface the highest-probability hits the user hasn't tried yet.
- **Bottle ROI analysis:** For each shopping-list item, estimate how many additional buildable drinks it unlocks, weighted by the user's flavor profile. Output a ranked list.
- **Flavor-space mapping:** Visualize (in text/table form) where the user's originals cluster across the 6 flavor axes. Identify quadrants with no coverage.
- **Profile drift detection:** Compare current flavor-axis ratings to prior entries in the evolution log. Surface trends ("your acid preference has shifted from Middle toward Strong A over 6 months").
- **Attribution analytics:** Track which foundation models generated which originals. Allow the user to rate originals and build a comparative scorecard.

**Files:** `barkeeper-instructions.md` (analytics mode section); possibly a new `analytics.md` module

---

## Tier 3 — Product / Platform (significant effort, new tech)

These require building something beyond markdown files. Each is a project in its own right.

### 3.1 — Interactive web UI ⟳ In Progress

**Vision:** A single-page web app that replaces the raw-markdown onboarding flow with a proper interactive experience.

**Approach chosen:** Hybrid static site — vanilla HTML/CSS/JS in `app/`, reads/writes JSON data files in the repo via GitHub Contents API. Auth via GitHub Personal Access Token (stored in localStorage). No backend, no build step, deployable to GitHub Pages.

**Components implemented (v0.1):**
- **Setup view:** GitHub PAT + repo config. Validates connection. Stores config in localStorage.
- **Dashboard:** Session-start menu with stat bar (bottle count, originals, favorites, shopping items). Returning-user greeting. New-user call-to-action. Recent originals quick-view.
- **Onboarding wizard:** Full step-by-step flow — persona, track, name, location, background, equipment, all 6 flavor axes (A/B choice cards), supplemental (smoke/funk/savory), saves to GitHub on completion.
- **Inventory manager:** Tabbed view (Spirits & Bottles / Pantry & Perishables / Vetoes). Bottle chips with tier color-coding. Add/remove bottles and string items. Inline save-to-GitHub. Vetoes and temporary substitutes editor.
- **Recipe browser:** Card grid of originals + favorites + wishlist tabs. Click to drill into full recipe detail (ingredients table, method, garnish, profile, why-it-works, variations, ratings, inline images from GitHub raw URLs).
- **Profile dashboard:** Interactive SVG hexagonal radar chart of the 6 flavor axes. Drag sliders to adjust axes — radar updates live. Supplemental preferences (smoke/funk/savory). Identity fields. Evolution log. Save-to-GitHub.
- **Shopping list:** Priority-ranked buy list. Add items manually. Mark as "Got It" (moves to inventory). ROI context and cocktail unlocks shown per item.

**GitHub API integration:**
- `GET /repos/{owner}/{repo}/contents/{path}?ref={branch}` — read JSON
- `PUT /repos/{owner}/{repo}/contents/{path}` — write JSON (base64 encoded, with SHA for conflict detection)
- All operations use PAT in `Authorization: Bearer` header

**Files:** `app/index.html`, `app/css/app.css`, `app/js/{github-api,state,utils,app}.js`, `app/js/views/{setup,dashboard,onboarding,inventory,recipes,profile,shopping}.js`

**Next steps for 3.1:**
- GitHub Pages deployment config (or Netlify)
- Cocktail recommender view ("What can I make right now?" — filter by current inventory)
- Inventory search and filter by category
- Recipe add/edit form (full inline editor for originals)
- "Got It" flow: proper category selection when moving from shopping list to inventory
- Image upload workflow (upload to `images/` via GitHub API)

---

### 3.1.x — Remaining web UI completions (before moving to backend)

These complete the single-user static-site story before we introduce a backend layer. Each is self-contained and can be done in one session.

**3.1.1 — Deployment to GitHub Pages (highest priority)**
- Add `.github/workflows/pages.yml` to auto-deploy `app/` on push to main
- OR add `_config.yml` for simple GitHub Pages (set source to `/app`)
- Update README with "Deploy your own" section (fork → enable Pages → enter PAT → done)
- Add `netlify.toml` as a Netlify alternative (zero-config, drag-and-drop deploy)
- Decision: GitHub Pages is simplest; the HTML is already self-contained

**3.1.2 — "What can I make right now?" recommender view**
- New view `app/js/views/recommender.js`, linked from dashboard as primary menu item
- Algorithm (client-side, pure JS):
  - Normalize inventory: flatten all bottle names into a canonical string set
  - Maintain a built-in table of ~50 classic cocktail recipes with ingredient lists
  - Compute set intersection: classics where all required bottles are in inventory
  - Score by flavor-profile alignment (weight each classic against user's axis positions)
  - Output: ranked card list — "You can build these right now"
  - Secondary: "One bottle away" section — 1-ingredient gap recipes, linked to shopping list
- This is the single most compelling UI feature for a new visitor; prioritize it

**3.1.3 — Recipe add/edit form**
- Currently the recipe browser is read-only; users cannot add originals through the UI
- Add an "Add Original" button → modal or dedicated route `#recipes/new`
- Form fields: id (auto-incremented), name, tagline, creator (pre-filled from profile), date, ingredients (repeating rows: amount + name + notes), method type, glassware, garnish, profile, why-it-works, variations
- On save: append to `recipes.originals`, update `profile_coverage_matrix`, write back to GitHub
- Also add "Edit" button on recipe detail view (same form, pre-filled)

**3.1.4 — Image upload via GitHub API**
- Add "Upload Image" button on recipe detail view
- File picker → FileReader → base64 → `PUT /repos/.../contents/images/{filename}`
- Display confirmation with raw GitHub URL for use in AI agent sessions
- This closes the loop for cocktail image workflow (to-do item 1.3)

**3.1.5 — Inventory search and category filter**
- Add search input that filters bottle chips across all categories in real-time
- Category filter dropdown to jump-scroll to a section
- "Total count" stat kept in sync as bottles are added/removed

**3.1.7 — Onboarding UX improvements** *(priority: high — affects every new user)*

Several flow and interaction fixes based on first-run feedback:

- **Skip and return:** Every onboarding step gets a "Skip for now →" link. Skipped answers are left null; user can return from the Dashboard via a new "Revisit Onboarding" menu item. Resume picks up from the first unanswered step.
- **Barkeeper personalization order:** Move the bartender name/voice/personality step to step 2, immediately after collecting the user's name and location. Currently it comes far too late — the user should meet their bartender before being asked detailed flavor questions.
- **Flavor axes: sliders + Middle option:** Replace the A/B choice cards with the same slider bar component used on the Profile page. Explicitly label the center position "Middle / Both / Depends on my mood" so users aren't forced into a binary when they genuinely like both ends. Pre-fill the slider from any saved value; null stays centered until moved.
- **Open-text inventory entry during onboarding:** After the equipment step, add an optional free-text area: "Paste a list of what's in your bar (one per line, or comma-separated) — you can clean it up in the Inventory tab later." App parses the text, attempts to categorize each item, and pre-populates inventory with a review-and-edit step before saving. This lets users with an existing list (from a prior AI-chat session) skip tedious manual entry.
- **Files:** `app/js/views/onboarding.js`, `app/css/app.css`

---

**3.1.8 — Dashboard & navigation enhancements** *(priority: high — first impression and discoverability)*

- **Images in UI:**
  - Header title bar: add `barkeeper_bjorn_002.png` as a small avatar next to "Barkeeper Bjorn" text
  - Dashboard hero: show `bar_equipment_001.png` as a muted background or welcome-section image
  - Onboarding welcome step: show `barkeeper_bjorn_001.png` with a caption — user meets Bjorn before answering questions
- **Expanded dashboard menu items** (add to returning-user quick-action grid):
  - "Revisit Onboarding" → `#onboarding` (resume flow; see 3.1.7)
  - "Enhance Profile" → `#profile`
  - "Recommend a Cocktail" → `#recommender` (already featured; rename for consistency)
  - "Classroom / Mixology 101" → `#classroom` (new view; see 3.1.15)
  - "Chat with [bartender name]" → `#chat` (shown grayed-out with lock icon if no Claude API key; links to 3.1.6)
  - "Feedback" → opens a mailto or GitHub Issues link in a new tab
- **Settings button in nav:** Add a gear icon button in the upper-right nav bar (separate from Setup). Routes to `#settings` — a new view covering logout, bartender rename, personality, theme, Export/Import. See 3.1.9.
- **Files:** `app/index.html`, `app/css/app.css`, `app/js/views/dashboard.js`, `app/js/views/settings.js` (new)

---

**3.1.9 — Settings page** *(priority: high — logout and bartender rename are frequently needed)*

A standalone Settings view (`#settings`) separate from the first-run Setup flow:

- **Bartender identity:** Rename the bartender (writes to `barkeeper.json`); change voice/personality preset (a dropdown: "Professional & measured", "Warm & playful", "Terse & opinionated", "Theatrical & verbose")
- **API keys:** Move GitHub PAT + repo config here (keep Setup for first-run only); add Anthropic API key field (for 3.1.6); show masked values with a "Reveal" toggle
- **Export / Import:** Primary entry point for data portability (see 3.1.10)
- **Logout:** Clears all `bb_*` localStorage keys; redirects to Setup; shows confirmation dialog
- **Danger zone:** "Reset all data" — overwrites all 4 data files with empty defaults after a two-step confirmation; useful for re-testing onboarding
- **Files:** `app/js/views/settings.js` (new), `app/index.html` (route + nav), `app/css/app.css`

---

**3.1.10 — Export / Import** *(priority: high — data portability and safe onboarding re-testing)*

Closes a real gap: users with existing Barkeeper Bjorn data (from Claude Projects or ChatGPT) need a way to import it, and users who want to re-test onboarding need to export first so they don't lose their real data.

- **Export — JSON bundle:** "Export All Data" button in Settings → bundles all 4 data files (`inventory.json`, `recipes.json`, `bar-owner-profile.json`, `barkeeper.json`) into a single `barkeeper-bjorn-export-YYYY-MM-DD.json` with a version header. Triggers a browser file download — no server involved.
- **Export — AI context text:** Secondary export format: a clean markdown/text summary of inventory + profile + originals, formatted for pasting directly into Claude, ChatGPT, Gemini, or Grok as context. Covers the same data the AI agent uses.
- **Import:** "Import Data" button in Settings → file picker accepts the export JSON format → shows a diff preview ("This will replace X bottles, Y recipes…") → on confirm, writes all 4 files to GitHub in one batch
- **Selective import:** Checkboxes per section — import only inventory, or only recipes, keeping other sections untouched. Essential for "clear and re-onboard, then restore recipes."
- **Reset & re-onboard flow:** Export → Reset → re-run onboarding → optional Import of specific sections
- **Format versioning:** Export bundle includes `format_version` field; Import validates and warns on version mismatch
- **Files:** `app/js/export.js` (new — bundle builder + downloader + importer), `app/js/views/settings.js`, `app/css/app.css`

---

**3.1.11 — Inventory structured fields + tiers + in-place editing** *(priority: medium-high — significant daily-use UX)*

The current inventory model treats each bottle as a single freeform string. This creates three problems: no structured metadata, no editing (only delete + re-add), and missing tier options.

- **Structured spirit fields:** Store each bottle as an object `{ type, brand, style, tier, notes }` rather than a flat string. Display as a formatted chip: *"Montelobos Espadin"* with a tooltip showing type/tier/notes. Edit opens a small inline form with individual fields. Example: `{ type: "Mezcal", brand: "Montelobos", style: "Espadin", notes: "Oaxaca, artesanal", tier: "Premium" }`.
- **In-place editing:** Clicking a bottle chip opens an edit popover — change any field and save without deleting and re-adding. Enables changing tier, correcting a name, or adding a note without data loss.
- **Expanded tier options:** Current tiers (Well / Call / Premium / Ultra-Premium / Craft) missing common levels. Add:
  - **"Standard / Common"** — everyday accessible bottles (e.g. Evan Williams, Olmeca)
  - **"Dirt Cheap"** — value/bottom-shelf (e.g. plastic-handle vodka, Carlo Rossi)
  - Reorder tier list: Dirt Cheap → Well → Standard → Call → Premium → Ultra-Premium → Craft
- **Barware strainers → checkboxes:** Change strainer field from a single dropdown to a multi-select checkbox grid (user may own Hawthorne, Julep, Fine Mesh, and Conical simultaneously)
- **Schema impact:** `inventory.json` spirit arrays change from `string[]` to `object[]`; engine and views need to handle both formats for backward compatibility during migration
- **Files:** `app/js/views/inventory.js`, `app/css/app.css`, `app/js/recommender-engine.js` (update keyword matching to check `brand + style` string), schema files

---

**3.1.12 — Recommender enhancements: mood sliders + scope toggle** *(priority: medium)*

The current recommender is profile-anchored — it always scores against your saved flavor profile. Two additions make it dramatically more useful for per-session use:

- **"What are you in the mood for?" mood sliders:** At the top of the Recommender view, show the same 6-axis slider bars as the Profile page, pre-loaded from the saved profile. User can adjust any axis for this session without saving — "tonight I want something more refreshing and less boozy than usual." Recommendations re-score live as sliders move.
- **Inventory scope control:** Replace the fixed "You Can Make / One Bottle Away" tabs with a single slider or segmented control: *"Only what I have"* → *"Allow 1 missing ingredient"* → *"Allow 2 missing ingredients."* All results shown in one ranked list filtered by the selected scope. One-away and two-away items show what's missing with a link to the shopping list.
- **Occasion tag filter:** Optional — quick-select chips for "After dinner," "Aperitif," "Party / batch," "Refreshing / warm weather," "Cozy / winter." Filters the recipe list by the `occasion` field.
- **Files:** `app/js/views/recommender.js`, `app/js/recommender-engine.js` (expose configurable `maxMissing` param), `app/css/app.css`

---

**3.1.13 — Recipe Book enhancements** *(priority: medium — ties to 3.1.3)*

- **"Submit New Recipe" button** in the Recipe Book header → routes to the recipe add form (3.1.3); pre-fills creator from profile
- **"Generate New Recipe with AI" button:** If Claude API key is configured (3.1.6), opens the chat view with a pre-seeded prompt asking Bjorn to design a new original based on inventory and profile. If no API key, shows a copyable prompt the user can paste into their Claude/ChatGPT session.
- **Files:** `app/js/views/recipes.js`

---

**3.1.14 — Name standardization and spell-check suggestions** *(priority: medium-low)*

When a user types an ingredient or bottle name into any inventory input field, the app compares the entry against a built-in canonical list and offers a correction suggestion.

- Canonical examples: "lemon" → "Lemons", "lime juice" → "Fresh Lime Juice", "simple" → "Simple Syrup", "angostura" → "Angostura Bitters", "cointreau" → "Cointreau (Triple Sec)"
- Suggestions appear as a small inline tooltip ("Did you mean: **Lemons**?") — user can accept with one click or dismiss and keep their text
- Canonical list lives in `app/js/canonical-names.js`; it pulls from the same vocabulary used in `classics-db.js` ingredient keywords, so canonical forms are guaranteed to match the recommender engine
- **Files:** `app/js/canonical-names.js` (new), `app/js/views/inventory.js` (input handler hookup)

---

**3.1.15 — Classroom / Mixology 101** *(priority: lower — new content area, significant scope)*

A reference section for learning bartending fundamentals — useful for new users who don't know the difference between shaking and stirring, or why you double-strain.

- **Static content initially:** Curated reference pages rendered from embedded JS data objects: Techniques (shake, stir, build, throw, fat-wash, infuse), Glassware guide (what glass and why), Ingredient deep-dives (vermouth storage, bitters families, citrus ratios), Cocktail ratio frameworks (Sour template 2:¾:¾, Old Fashioned template, Highball ratios)
- **With Claude API (3.1.6):** Interactive — user can ask Bjorn questions in context of the current lesson ("Why does bruising matter?" → AI explains)
- **Routes:** `#classroom`, sub-pages: `#classroom/techniques`, `#classroom/glassware`, `#classroom/ratios`, `#classroom/ingredients`
- **Files:** `app/js/views/classroom.js` (new), `app/js/data/classroom-content.js` (new), `app/css/app.css`

---

**3.1.6 — Claude API integration (bring your own API key)**

Currently the web UI has zero AI — recommendations are rule-based JS and there's no inference anywhere. This item adds an optional Claude API connection so users can unlock AI-powered features directly from the browser.

**How it would work:**
- User enters their [Anthropic API key](https://console.anthropic.com/settings/keys) in the Setup view alongside the GitHub PAT (stored in localStorage as `bb_anthropic_key`)
- API key is never sent anywhere except `api.anthropic.com` — stays in the browser just like the GitHub PAT
- The key is optional: the app works without it (rule-based mode), and unlocks AI features when present
- Browser → Anthropic API calls use `Authorization: x-api-key {key}` against `https://api.anthropic.com/v1/messages`
- **CORS note:** Anthropic's API allows direct browser calls, but this should be verified; a thin Cloudflare Worker proxy may be needed as a fallback

**Features unlocked by Claude API key:**
1. **"Ask Bjorn" button** — a chat panel where the user can type natural language ("make me something smoky and boozy") and Bjorn responds using the full system prompt from `barkeeper-instructions.md`, with inventory + profile injected as context
2. **AI cocktail design** — generate a new original from scratch, with full rationale and attribution string
3. **AI-powered recommendations** — instead of pure inventory matching, Bjorn explains *why* a recipe fits the user's current mood and taste, and suggests variations
4. **Inventory advice** — "what's the single best bottle I could add given what I have?" with explanation
5. **Forum bot** (prerequisite for 3.8) — Bjorn can answer questions in community threads

**Context injection strategy:**
- System prompt: contents of `barkeeper-instructions.md` (fetched from repo via GitHub API, cached)
- User context block: inventory summary + flavor profile axes (serialized from State)
- Model: `claude-sonnet-4-6` by default; user can override to `claude-opus-4-7` in Setup for higher quality

**Files:** `app/js/claude-api.js` (API wrapper), `app/js/views/chat.js` (chat panel), Setup view additions, `app/css/app.css` (chat panel styles)

---

### 3.5 — Backend / auth layer (prerequisite for multi-user) ⚠ Architecture decision point

**The core problem:** The current GitHub-API approach is inherently single-user. A PAT authenticates one GitHub account. To support user logins, shared data, and social features, a backend layer is required.

**Honest analysis of options:**

| Option | Effort | Multi-user | Shared data | Forum | Notes |
|---|---|---|---|---|---|
| Stay GitHub-API only | Low | Fork-per-user (awkward) | Via PRs (very awkward) | No | Works fine for solo/power users. Breaks for casual users and social. |
| **Supabase** (recommended) | Medium | Yes, built-in | Yes, Postgres | Yes (later) | Managed Postgres + Auth + Storage. Frontend stays static. Free tier generous. |
| Cloudflare Workers + D1 | Medium | Yes (custom auth) | Yes | Yes (later) | Serverless edge, SQLite. More DIY. |
| FastAPI + PostgreSQL | High | Yes (custom auth) | Yes | Yes | Most control, aligns with 3.2 plan, requires hosting. |

**Recommendation: Supabase**
- Auth: email/password + GitHub OAuth — no custom auth code
- Database: Postgres — existing JSON schemas map directly to tables
- Storage: built-in S3-compatible bucket for cocktail images
- Realtime: future live-collaboration features available for free
- Frontend: remains static (GitHub Pages / Netlify) — only the data layer changes
- Free tier: 500MB DB, 1GB storage, 50k monthly active users — plenty to start
- The existing `data/*.json` files become the migration source

**Migration path from GitHub-API:**
- App gets a "mode" flag: `solo` (current PAT-based) vs `hosted` (Supabase)
- Solo mode stays fully functional — no breaking change for current users
- Hosted mode replaces `GitHubAPI` reads/writes with `supabase-js` calls
- Data model maps: `inventory.json` → `inventory` table, `recipes.json` → `recipes` table, etc.
- Images: move from `images/` in repo to Supabase Storage bucket

**Files:** `app/js/supabase-api.js`, `app/js/auth.js`, Supabase project setup, DB migration scripts

---

### 3.6 — Multi-user accounts and per-user data

**Depends on:** 3.5 complete

**Vision:** Any person can sign up at the hosted URL, go through onboarding, and have their own private bar profile — inventory, recipes, flavor axes — without touching GitHub or a text editor.

**Feature spec:**
- **Sign up / log in:** Email+password or "Continue with GitHub" — handled entirely by Supabase Auth
- **Per-user isolation:** Each user's inventory, profile, and recipes are private by default (row-level security in Postgres)
- **Session persistence:** Auth token in localStorage (or cookie) — no re-login on refresh
- **Account settings view:** Change email, password, display name, delete account
- **User identity in recipes:** Creator field auto-populated with display name from account (overrides onboarding answer)
- **Multiple "bars":** Advanced — a single user could manage multiple bars (home bar, vacation house, a bar they consult for). Probably Tier 4 initially.

**Data model additions:**
- `users` table: id, email, display_name, created_at (managed by Supabase Auth)
- All existing tables get a `user_id` foreign key
- Row-level security: `user_id = auth.uid()` on all reads/writes

**Files:** `app/js/views/auth.js` (login/signup modal), `app/js/views/account.js`, schema migrations

---

### 3.7 — Community recipe sharing and discovery

**Depends on:** 3.6 complete

**Vision:** Users can publish originals to a community feed. Other users can browse, save, and rate community recipes. This is the social layer that makes the platform more than a personal notebook.

**Feature spec:**
- **Per-recipe visibility toggle:** Private (default) / Public. One click in the recipe editor.
- **Community feed:** `#community` view — paginated card grid of all public originals, sorted by date or rating
- **Filtering:** By base spirit, method, flavor profile (nearest axis match)
- **"Save to my collection":** One-click to copy a community recipe into your own `recipes.wishlist` or `confirmed_favorites`
- **Recipe ratings:** Star or thumbs up/down. Aggregated average shown on community cards.
- **Attribution preserved:** Creator name and model attribution always visible — core to the project's philosophy
- **Flagging / moderation:** Report inappropriate content; admin review queue. Keep it simple initially.
- **Search:** Full-text search over recipe names, ingredients, profiles. Postgres has built-in FTS.

**Data model additions:**
- `recipes` table: add `is_public boolean` field
- `recipe_saves` table: user_id, recipe_id, saved_at (for "save to my collection")
- `recipe_ratings` table: user_id, recipe_id, rating (1-5), created_at
- Aggregated view: `recipe_public_with_stats` — join recipes + ratings + save counts

**Files:** `app/js/views/community.js`, `app/js/views/recipe-detail-public.js`, DB migrations

---

### 3.8 — Discussion forum / threads

**Depends on:** 3.6 (accounts) — 3.7 (community) is optional but synergistic

**Vision:** A lightweight discussion space — not a full forum, more like a comment section on steroids. Threads can be attached to recipes (ingredient questions, variation ideas, "I tried this and…") or stand-alone (technique discussions, ingredient sourcing, seasonal menus).

**Feature spec:**
- **Recipe-attached comments:** Each public recipe gets a comment thread. Threaded replies (one level deep — not infinitely nested).
- **Stand-alone topics:** A `#forum` view with topic categories: Techniques, Ingredients, Spirits, Recommendations, Off-Topic.
- **Markdown support:** Basic formatting — bold, italic, code (for recipe snippets), links.
- **Notifications:** Email digest of replies to your posts/comments (Supabase has SMTP/hooks).
- **Moderation:** Soft delete, admin flag. Keep simple — no karma system initially.
- **"Barkeeper Bjorn" bot posts:** The AI agent could be invoked in threads — someone asks "what's a good substitute for Velvet Falernum?" and Bjorn answers. Requires Claude API integration.

**Data model:**
- `forum_topics` table: id, user_id, category, title, body, created_at, is_pinned
- `forum_replies` table: id, topic_id, user_id, parent_reply_id (nullable), body, created_at
- `recipe_comments` table: id, recipe_id, user_id, parent_comment_id (nullable), body, created_at
- `forum_votes` table: user_id, target_type (topic/reply/comment), target_id, vote (+1/-1)

**Files:** `app/js/views/forum.js`, `app/js/views/topic.js`, `app/js/views/recipe-comments.js`, DB migrations

---

### 3.2 — API-ready JSON output + recipe engine

**Vision:** A structured API that exposes Barkeeper Bjorn's logic programmatically — for integration into a future app, a POS system, or third-party cocktail platforms.

**Endpoints (sketch):**
- `GET /cocktails/buildable` — returns recipes the user can make from current inventory
- `GET /cocktails/recommend` — returns top N recommendations ranked by flavor-profile fit
- `POST /cocktails/design` — takes flavor constraints, returns a new original
- `GET /inventory/gaps` — returns prioritized shopping list with unlock counts
- `GET /profile/axes` — returns current flavor axis positions + confidence
- `POST /session/log` — records a cocktail-built event and feedback

**Tech:** FastAPI (Python) is the natural fit given Glenn's data science background. Schema definitions from Tier 2.1 feed directly into Pydantic models.

**Files:** New `api/` directory

---

### 3.3 — Multi-agent system

**Vision:** Barkeeper Bjorn is the primary agent, but specialized sub-agents handle deeper domains.

**Agent roster:**
- **Barkeeper Bjorn** — primary interface. Conversational, opinionated, session-aware. (Current agent, enhanced.)
- **The Sommelier** — fortified wines, vermouths, sherries, and wine-adjacent ingredients. Called when Bjorn needs deeper expertise on wine-based modifiers.
- **The Analytics Brain** — Tier 2.4 logic elevated to a full agent. Takes inventory + profile as input, outputs structured recommendations with confidence scores. No personality — pure signal.
- **The Archivist** — manages `recipes.md`. Responsible for deduplication, attribution validation, version history, and export. Called when Bjorn wants to save or retrieve a recipe.
- **The Shopper** — manages the shopping list. Given current inventory and flavor profile, runs gap analysis, checks current prices (web search), outputs ranked prioritized list with links.

**Orchestration:** Bjorn is the user-facing agent. It calls sub-agents via tool use (Claude API) or prompt injection (simpler platforms). Results are summarized and returned in Bjorn's voice.

**Files:** New `agents/` directory; Claude API implementation in `api/`

---

### 3.4 — "Upgrade it" / enterprise path

**Vision:** If Barkeeper Bjorn were a product — a SaaS bartending assistant or a licensed platform for hospitality businesses — what would it need?

**Requirements beyond Tier 3.1–3.3:**
- Multi-user support (families, bars, restaurants) with role-based access (owner, bartender, guest)
- POS integration hooks (sync with Square, Toast, etc. to track actual bottle depletion)
- Supplier / distributor integration (live pricing, availability)
- Customer-facing menu generation (cocktail menu PDF/web export from `recipes.md`)
- Event mode (configure a temporary cocktail menu for a party, track what got made)
- Compliance / responsible service (market-specific ABV display, allergen flagging)
- White-label / franchise support (a bar could run its own Barkeeper instance with its own persona and house recipes, forked from the public template)

**Files:** Product spec document (separate from this roadmap)

---

## Tier 4 — Ideas Parking Lot

Things worth capturing but not yet scoped.

- **Cocktail comparison mode:** Side-by-side two drinks by structure (base, modifier, acid, sweetener, bitters). Useful for teaching and for designing variations.
- **Seasonal menu generator:** Given current inventory + current month/location, produce a 4-drink seasonal menu with names, recipes, and suggested garnishes.
- **Guest mode:** Simplified interface for a guest who doesn't have their own Barkeeper instance. Takes flavor preferences in 3 questions, returns 2 drink suggestions from the host's inventory.
- **"What's depleted?" tracker:** The agent asks at session start whether anything ran out since last time, and updates inventory before recommending.
- **Community cocktails file:** Superseded by 3.7 (community recipe sharing). The markdown version (community-recipes.md aggregated from forks via PRs) was always awkward — the Supabase-backed community feed in 3.7 is the right approach.
- **Barkeeper persona gallery:** Multiple pre-built personas beyond Bjorn (a tiki-obsessed Hawaiian uncle, a no-nonsense Tokyo bartender, a theatrical Victorian apothecary). Users can swap personas without changing user files. In multi-user context (3.6+), persona is stored per-user account.
- **Drink history log:** A session history table in the database (multi-user) or a `history.md` log (solo). Records what was built, by whom, rating, notes. Feeds the analytics brain over time.
- **Halal / NA mode:** A full non-alcoholic track with the same structural depth as the alcoholic system. Seedlip, Lyre's, shrubs, switchels, drinking vinegars, NA beers and wines.
- **Multiple bars per user:** One user account managing multiple distinct bars (home bar, vacation house, a bar they consult for). Each bar has its own inventory, recipes, and flavor profile. Probably requires 3.6 to be complete first.
- **"Barkeeper Bjorn" bot in forum threads:** A user can invoke the AI agent in a forum discussion thread — e.g., "Bjorn, what's the best substitute for Velvet Falernum?" — and get a response. Requires Claude API integration and a small server-side function (can't call Claude from the browser directly).
- **Guest mode:** Simplified interface for a guest who doesn't have their own account. Takes flavor preferences in 3 questions, returns drink suggestions from the host's inventory. Host shares a link; guest gets a read-only recommender view.
- **Cocktail comparison mode:** Side-by-side two drinks by structure (base, modifier, acid, sweetener, bitters). Useful for teaching and for designing variations.
- **Seasonal menu generator:** Given current inventory + current month/location, produce a 4-drink seasonal menu with names, recipes, and suggested garnishes.
- **"What's depleted?" tracker:** The agent asks at session start whether anything ran out since last time, and updates inventory before recommending.
- **Event mode:** Configure a temporary cocktail menu for a party or event. Track what gets made, how many servings, what runs low. Auto-generates a depletion report at the end.
- **Public profile / bartender page:** A public-facing URL for your bar — shareable link that shows your public recipes, flavor profile radar, and "signature cocktails." Think portfolio page for cocktail enthusiasts.
- **Ingredient hierarchy / automatic derivations:** When a user lists a base ingredient, the recommender should infer common derivatives: limes → lime juice, lemons → lemon juice, sugar → simple syrup, mint → muddled mint, eggs → egg white/yolk, etc. Currently the engine matches strictly by keyword, so "limes" in produce does not satisfy a recipe calling for "lime juice." Needs a derivation map and lookup-expansion pass in `recommender-engine.js`. Discuss design (static map vs. AI-assisted inference, user-overridable substitutions, transitive derivations) before implementing — target Phase 5+ or later. (Captured 2026-05-14 during Phase 4 context discussion)
- **Library tab:** A new top-level view (`#library`) for links, references, saved articles, technique videos, and other curated/saved items that don't fit Recipes, Inventory, or Classroom. Acts as the user's bookmarks and curation surface. Schema and scope TBD — could include external URLs, internal recipe references, embedded notes. Discuss whether this overlaps with or replaces Classroom (Phase 5) before scoping. (Captured 2026-05-14)
- **AI-assisted JSON error correction:** When a save or import fails due to a malformed or conflicting JSON file, offer to send the broken data to the Anthropic API for automated repair suggestions. Claude diagnoses the issue (corrupt field, schema mismatch, SHA conflict, etc.), proposes a corrected version, presents a diff preview to the user, and only writes to GitHub after explicit confirmation. Requires Phase 5 Claude API integration (`bb_anthropic_key`). Design questions: which error types trigger the offer; whether AI sees full file or error context only; how the diff is rendered. (Captured 2026-05-14)
- **"Add to Favorites" / "Add to Wishlist" buttons on Recommender cards:** Each recipe card in the Recommender (buildable, one-away, two-away sections) should have two quick-action buttons that copy the recipe into the user's Recipes → Favorites or Recipes → Wishlist tab, so the user can find it again later from the Recipes view. Currently recommender cards are read-only — there is no path from "I saw this recommendation" → "save it for later." Small scope: append the recipe (or its id reference) to `recipes.favorites` / `recipes.wishlist` and call `State.save('recipes')`. Could be folded into Phase 4 if scope allows, otherwise Phase 5. (Captured 2026-05-14)

---

## Versioning

| Version | Date | Notes |
|---|---|---|
| 0.1 | 2026-05-03 | Initial roadmap. Captures quick fixes (Tier 1), structural improvements (Tier 2), and product/platform ambitions (Tiers 3–4) based on first real-world install feedback from ChatGPT. |
| 0.2 | 2026-05-03 | Added 1.5 (session-start menu with smart recipe list display). Revised 2.1 to clarify JSON↔MD architecture: JSON is system-of-record, MD files are derived and human-editable, bidirectional sync handled by agent at session start. |
| 0.3 | 2026-05-03 | Tier 2 complete: 2.1 (JSON schemas in schema/, data/ placeholders, bidirectional sync instruction); 2.2 (instructions/ module split — 7 modules); 2.3 (session-state.md template, re-evaluation module updated); 2.4 (analytics.md module, analytics mode in main instructions, Option 7 in session-start menu). barkeeper-instructions.md bumped to v2.0. README file structure updated. |
| 0.4 | 2026-05-04 | Tier 3.1 v0.1: Hybrid static web UI in app/ — vanilla JS SPA, GitHub API read/write, PAT auth. Implements setup, dashboard, onboarding wizard (all 6 flavor axes), inventory manager, recipe browser + detail, profile dashboard with SVG radar chart, shopping list. No backend, no build step, deployable to GitHub Pages. |
| 0.5 | 2026-05-04 | Roadmap re-analysis for Phase 3. Added 3.1.x sub-phases (deployment, recommender, recipe edit, image upload, inventory search). Added 3.5 (backend/auth layer — Supabase recommended), 3.6 (multi-user accounts), 3.7 (community recipe sharing), 3.8 (discussion forum). Expanded Tier 4 with multi-bar, event mode, public profile, bot-in-forum, guest mode ideas. |
| 0.6 | 2026-05-04 | 3.1.1 (GitHub Pages deployment) complete. 3.1.2 (cocktail recommender) complete — 75-recipe classics database, inventory matching engine, flavor-score ranking, buildable + one-away tabs. Added 3.1.6: Claude API integration (bring-your-own Anthropic API key, browser-based, unlocks AI chat + cocktail design + AI-powered recommendations). |
| 0.7 | 2026-05-04 | Added 1.6 (barkeeper personalization order in agent onboarding). Added 3.1.7–3.1.15: onboarding UX (skip/return, slider axes, barkeeper-first order, open-text inventory entry), dashboard enhancements (images, expanded menu, settings button), settings page, export/import, inventory structured fields + new tiers + in-place edit + strainer checkboxes, recommender mood sliders + scope toggle, recipe book buttons, name standardization, Classroom/Mixology 101. |
