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
