# Architecture Research

_Researched: 2026-05-11_
_Project: Barkeeper Bjorn Web UI — Milestone 3.2_

---

## Settings Page Integration

**Pattern: Split-responsibility view — localStorage writes are synchronous; GitHub writes go through State.save().**

The Settings view is structurally identical to the existing Setup view: it reads config from `localStorage` via `GitHubAPI.cfg()`, renders a form, and on save writes some values to `localStorage` and others through `State.patch() + State.save('barkeeper', ...)`.

Two data categories exist:

| Setting | Store | Mechanism |
|---|---|---|
| GitHub PAT, owner, repo, branch | `localStorage` | `localStorage.setItem('bb_token', ...)` directly |
| Anthropic API key | `localStorage` | `localStorage.setItem('bb_anthropic_key', ...)` — never committed |
| Bartender name, persona preset | `data/barkeeper.json` | `State.patch('barkeeper', ...) + State.save('barkeeper', ...)` |
| Export/import entry point | N/A | buttons that invoke helper functions |
| Logout | `localStorage` clear | `localStorage.clear()` then `window.location.hash = '#setup'` |

**Atomicity concern:** There is no transaction across localStorage and GitHub. The right order is: write localStorage first (instant, can't fail at the network level), then attempt the GitHub write. If the GitHub write fails, the localStorage values are already correct — settings are partially applied but the user can retry the save. Do not roll back localStorage on GitHub failure; the values are consistent from the app's point of view.

**Pattern for bartender rename flow:**

```js
// 1. Read current barkeeper from State (already in memory)
const bk = State.get('barkeeper');

// 2. Apply to in-memory State — triggers re-renders in any subscribed views
State.patch('barkeeper', b => {
  b.identity.name = newName;
  b.last_updated = Utils.today();
});

// 3. Persist to GitHub
await State.save('barkeeper', 'Rename bartender via Settings');

// 4. localStorage writes for pure-local keys (no GitHub needed)
localStorage.setItem('bb_anthropic_key', apiKey);
```

**Anthropic key storage:** Use a new `localStorage` key `bb_anthropic_key`. The Settings view reads/writes this directly. It is never included in any GitHub write. Treat it like `bb_token` — password input, never logged. Add a copy-to-clipboard affordance but no "show key" toggle (security hygiene).

**Logout:** Clear all `bb_*` localStorage keys, reset `State` by dispatching `bb:reset-data`, and navigate to `#setup`. Do not clear `bb_anthropic_key` on logout unless the user explicitly clicks a separate "Forget Anthropic key" button — the key is unrelated to which GitHub repo is connected.

**New localStorage keys introduced:**

- `bb_anthropic_key` — Anthropic API key, browser-only, never committed
- `bb_chat_model` — which Claude model to use (optional, default `claude-opus-4-7`)

**Route:** `#settings` — add to `app.js` switch block and `<nav>` in `index.html`.

---

## Streaming Chat UI (Vanilla JS)

**Pattern: direct browser `fetch` to `api.anthropic.com` with `ReadableStream` + `TextDecoder` + SSE line parser. No proxy, no SDK.**

The Anthropic API supports browser-direct calls when you set the `anthropic-dangerous-allow-browser: true` header. This is documented and intentional for BYOK ("bring your own key") patterns — the risk (key exposure) is the user's own since they supplied the key. This fits the existing pattern of storing the GitHub PAT in localStorage and calling the GitHub API directly.

**Why not EventSource:** `EventSource` only supports `GET` requests. The Messages API requires `POST` with a JSON body. Use `fetch` + `response.body.getReader()` instead.

**SSE event structure from the API (HIGH confidence — verified against official docs):**

```
event: message_start
data: {"type":"message_start","message":{...}}

event: content_block_start
data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" there"}}

event: content_block_stop
data: {"type":"content_block_stop","index":0}

event: message_delta
data: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":42}}

event: message_stop
data: {"type":"message_stop"}
```

**Vanilla JS implementation sketch:**

```js
async function streamChat(messages, systemPrompt, onChunk, onDone, onError) {
  const apiKey = localStorage.getItem('bb_anthropic_key');
  const model  = localStorage.getItem('bb_chat_model') || 'claude-opus-4-7';

  let res;
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-allow-browser': 'true',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        stream: true,
        system: systemPrompt,
        messages,
      }),
    });
  } catch (err) {
    onError(err); return;
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    onError(new Error(body.error?.message || `HTTP ${res.status}`));
    return;
  }

  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let   buffer  = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep incomplete last line

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (raw === '[DONE]') break;
      let evt;
      try { evt = JSON.parse(raw); } catch { continue; }

      if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
        onChunk(evt.delta.text);
      }
      if (evt.type === 'message_stop') {
        onDone();
      }
    }
  }
}
```

**UI pattern for the chat panel:**

The `ChatView` maintains local state: an array of `{ role, content }` message objects (conversation history) and a `_streaming` boolean. On `render(container)`, rebuild the entire message list as DOM nodes. On each `onChunk` call, append text to the last assistant bubble element directly via `element.textContent += chunk` (no innerHTML — avoids XSS). On `onDone`, set `_streaming = false` and enable the input.

Do not call `State.patch()` or `State.subscribe()` for chat history — conversation is ephemeral, session-only, not persisted to GitHub. If persistence is wanted later, store a transcript in `recipes.json` or a new file, but that is out of scope for this milestone.

**Abort support:** Hold a reference to `reader` at module scope. Provide a "Stop generating" button that calls `reader.cancel()` and `onDone()`. Reset `_streaming`.

**Error display:** On API error (wrong key, overloaded, rate-limited), show the error message inline in the chat as a system bubble styled differently. Do not use `Utils.showToast()` — the toast disappears and the user loses the error context.

**Model selection:** Default to `claude-opus-4-7` (the current flagship). Allow override via `bb_chat_model` localStorage key set in Settings. Do not expose model selection in the chat panel itself — keep the UI simple.

---

## Claude API Context Injection

**Strategy: inject a condensed but structured system prompt; keep total context under ~4000 tokens to leave room for conversation.**

The context budget for a chat session with `max_tokens: 1024` and Claude Opus 4.7 (200K context window) is effectively unlimited, but practical limits apply: more context = higher latency and cost. Target a system prompt of 1500–2500 tokens maximum, which leaves enormous headroom.

**What to inject (in order of priority):**

1. **Persona block** — bartender name, voice, active preset (from `barkeeper.json`). ~100 tokens.
2. **Flavor profile summary** — the 6 axes from `bar-owner-profile.json` as a short paragraph, plus top flavor preferences. ~150 tokens.
3. **Current inventory** — structured list of spirits/bottles. This is the most valuable context for recommendations. ~300–600 tokens depending on bar size.
4. **Vetoes** — disliked ingredients. Critical for safety. ~50 tokens.
5. **Task framing** — one paragraph telling Claude what it should do (suggest cocktails, design originals, answer questions). ~100 tokens.

**Inventory serialization:** Convert the structured inventory to a compact, readable format rather than raw JSON — Claude reads prose-style context better and it uses fewer tokens:

```
CURRENT BAR INVENTORY:
Whiskey: American Bourbon (premium-accessible), American Rye (premium-accessible), Scotch (premium-accessible), Japanese Whisky (premium-accessible)
Brandy: Cognac (premium-accessible), Armagnac (premium-accessible)
Rum: Dark Jamaican Rum (industrial), White Jamaican Rum (industrial), Cachaça (premium-accessible)
Agave: Mezcal — Montelobos (premium-accessible)
White Spirits: Vodka — Reyka (premium-accessible), Gin (premium-accessible)
Fortified: Carpano Antica sweet vermouth (premium-accessible)
Bitters: Angostura
Pantry: salt, sugar, cinnamon, nutmeg, allspice
Fresh: lemon, limes, mint, basil
Mixers: sparkling water, orange juice
VETOES: [disliked list here]
```

**Trimming strategy when inventory is large (>150 bottles):**

- Drop `past_inventory` first (historical, low value for single-session chat)
- Collapse string lists (mixers, pantry, produce) to a single comma-separated line
- For bottle sections, if a category has >6 items, show first 4 and append "(+N more)"
- Never trim vetoes — they are safety-critical
- Never trim the flavor profile

A vanilla JS `buildSystemPrompt(barkeeper, profile, inventory)` function can implement this deterministically. No token counting needed — just character counting (rough heuristic: ~4 chars/token). If the formatted string exceeds 10,000 characters, apply trimming passes.

**Conversation history management:**

Keep the last 10 turns of the conversation in the `messages` array sent to the API. At 11+ turns, drop the oldest user+assistant pair. This is a sliding window. No summarization needed at this scale.

**Per-request context injection:** Inject the system prompt once at session start. Do not re-inject inventory on every message — it is already in the `system` field and Claude retains it for the session.

---

## Inventory Data Migration (Flat → Structured)

**Observation: The current `inventory.json` does NOT use flat string arrays for spirits.** The schema already defines `bottleEntry` objects with `{ name, tier, notes, best_for }` and the live data matches — entries like `{ "name": "American Bourbon", "tier": "premium-accessible" }`. The mixers, pantry, produce, etc. remain as `string[]` by design.

The migration task is therefore: **add new fields (`brand`, `type`, `style`) to existing `bottleEntry` objects**, and add new tier values (`standard`, `dirt-cheap`) to the enum. This is an additive, backward-compatible change — not a format migration.

**Migration strategy:**

Use a `migrateInventory(inv)` normalizer function called once in `State.loadAll()` (or lazily on first `State.get('inventory')` access) that:

1. Walks all bottle sections
2. For each entry that lacks `brand` or `style`, adds them as `null` (not empty string — null signals "not yet filled in" vs "intentionally blank")
3. Updates `last_updated` if any mutations occurred
4. Does NOT auto-save — migration is applied to in-memory state only; the next explicit user save will persist it

```js
function migrateInventory(inv) {
  let migrated = false;
  const BOTTLE_PATHS = [
    'base_spirits.whiskey', 'base_spirits.brandy', /* ... all paths ... */
  ];
  for (const path of BOTTLE_PATHS) {
    const arr = getNestedArr(inv, path);
    for (const entry of arr) {
      if (!('brand' in entry)) { entry.brand = null; migrated = true; }
      if (!('style' in entry)) { entry.style = null; migrated = true; }
      if (!('type'  in entry)) { entry.type  = null; migrated = true; }
    }
  }
  return migrated;
}
```

**Tier enum extension:** The schema currently has `["industrial", "premium-accessible", "boutique", "rare/exceptional"]`. Add `"standard"` and `"dirt-cheap"`. This is a schema-only change and does not require any data migration — existing records keep their current tier values unchanged.

**Backward compatibility:** The `RecommenderEngine` only reads `entry.name` from bottle arrays — it does not read `tier`, `brand`, or `style`. Adding new fields to entries does not break the recommender. InventoryView renders `entry.name` and `entry.tier` — both still present.

**Schema update:** Update `schema/inventory.schema.json`:
- Add `brand`, `type`, `style` as optional string properties to `bottleEntry`
- Add `"standard"` and `"dirt-cheap"` to the tier enum

No data file needs to be touched manually — the in-place migration handles it on first load after the code ships.

---

## Open-Text Inventory Parser

**Pattern: keyword extraction + category heuristics + confidence scoring; present results for user confirmation before committing.**

The goal is: user pastes a blob of text (e.g., from a previous Claude session's inventory summary, or a handwritten list), and the app extracts bottles and assigns them to the right sections.

**Parsing approach — two phases:**

Phase 1 — Line splitting and normalization:

```js
function parseLines(text) {
  return text
    .split(/[\n,;]+/)
    .map(l => l.trim())
    .filter(l => l.length > 2 && l.length < 120);
}
```

Phase 2 — Category classification per line:

Build a keyword dictionary mapping terms to inventory sections. This does not need to be exhaustive — cover the most common spirit types, mixers, and pantry items. Unknown items go to a "Review" bucket.

```js
const CATEGORY_HINTS = {
  'base_spirits.whiskey':  ['bourbon', 'rye', 'scotch', 'whiskey', 'whisky', 'irish', 'japanese', 'taiwanese', 'single malt'],
  'base_spirits.brandy':   ['cognac', 'armagnac', 'calvados', 'pisco', 'brandy'],
  'base_spirits.rum':      ['rum', 'cachaça', 'cachaca', 'rhum', 'agricole', 'ron'],
  'base_spirits.agave':    ['tequila', 'mezcal', 'blanco', 'reposado', 'añejo', 'sotol'],
  'base_spirits.white_spirits': ['gin', 'vodka', 'aquavit'],
  'fortified_wines_and_aperitif_wines': ['vermouth', 'sherry', 'port', 'lillet', 'cocchi', 'amaro'],
  'liqueurs_and_cordials.herbal': ['campari', 'aperol', 'chartreuse', 'benedictine', 'cynar'],
  'liqueurs_and_cordials.fruit_forward': ['cointreau', 'triple sec', 'chambord', 'st-germain', 'limoncello'],
  'liqueurs_and_cordials.nut_coffee': ['kahlua', 'frangelico', 'baileys', 'amaretto'],
  'bitters.anchors': ['angostura', 'peychaud'],
  'mixers':    ['tonic', 'soda', 'ginger beer', 'juice', 'sparkling water', 'cola'],
  'pantry_spice_rack': ['sugar', 'salt', 'cinnamon', 'nutmeg', 'allspice'],
  'fresh_produce': ['lemon', 'lime', 'mint', 'basil', 'grapefruit', 'orange'],
  'syrups':    ['syrup', 'orgeat', 'falernum', 'grenadine'],
};

function classifyLine(line) {
  const lower = line.toLowerCase();
  for (const [section, keywords] of Object.entries(CATEGORY_HINTS)) {
    if (keywords.some(k => lower.includes(k))) {
      return { section, confidence: 'high' };
    }
  }
  // Secondary heuristic: check for parenthetical tier cues
  if (/\b(industrial|premium|boutique|rare)\b/i.test(lower)) {
    return { section: 'base_spirits.other', confidence: 'medium' };
  }
  return { section: 'REVIEW', confidence: 'low' };
}
```

**Tier extraction:** Look for parenthetical or adjacent tier cues in the line:

```js
function extractTier(line) {
  if (/industrial/i.test(line)) return 'industrial';
  if (/boutique/i.test(line)) return 'boutique';
  if (/rare|exceptional/i.test(line)) return 'rare/exceptional';
  if (/premium/i.test(line)) return 'premium-accessible';
  return 'premium-accessible'; // sensible default
}
```

**Name normalization:** Strip leading dashes, bullets, numbers, and category headers before treating a line as a bottle name:

```js
const name = line.replace(/^[\-\*\•\d\.]+\s*/, '').trim();
```

**UI flow:** Show parsed results in a confirmation dialog:
- Grouped by target section, each with a checkbox (checked by default)
- REVIEW items highlighted in amber with a dropdown to pick the section manually
- "Duplicate detection" — check if `entry.name.toLowerCase()` already exists in the target section; if so, show "already in bar" badge and uncheck by default
- "Add selected" button appends confirmed items to State, then user saves normally

This is a client-side IIFE helper (`InventoryParser`) — no network calls, no dependencies. ~150 lines of code.

---

## Import Safety Pattern

**Pattern: fetch → validate structure → show diff preview → require explicit confirmation → write sequentially.**

Import involves overwriting live GitHub data. The safety sequence must be:

1. **File pick** — `<input type="file" accept=".json">` reads the file via `FileReader.readAsText()`. No network call yet.

2. **Parse** — `JSON.parse()` in a try/catch. If malformed, show error and stop. Do not proceed.

3. **Structural validation** — check that required top-level keys are present for each file being imported. This is a "shape check" — not full JSON Schema validation (no library available), but sufficient:

```js
function validateInventoryShape(data) {
  const required = ['base_spirits', 'vetoes', 'shopping_list'];
  return required.every(k => k in data);
}
```

4. **Diff preview** — show a modal with two columns: "Current" vs "Importing". For each section, show count changes: "Whiskey: 5 → 3 bottles". For profile, show axis value deltas. This is display-only; no write has happened yet.

5. **Selective import** — allow the user to check/uncheck which keys to import. Default: all checked. This prevents accidentally overwriting a carefully curated inventory when only importing a profile.

6. **Explicit confirmation** — a red "Overwrite and Save" button that is disabled until the user types "confirm" or toggles a checkbox labeled "I understand this will replace my current data." Prevent accidental clicks.

7. **Write sequence** — for each selected key, call `State.set(key, importedData[key])` then `await State.save(key, 'Import via Barkeeper Bjorn')`. Write sequentially (not `Promise.all`) so that a failure on file 2 does not leave files 1 and 3 in inconsistent states. Show progress per file.

8. **SHA freshness** — before writing, optionally call `GitHubAPI.readJSON(path)` to get the latest SHA. This prevents a 409 conflict if the file was modified in another browser tab. The overhead is 4 extra GET requests — acceptable for an infrequent import operation.

**Export pattern (simpler):**

- Bundle all 4 data files into a single JSON: `{ barkeeper, profile, inventory, recipes, exportedAt: '...' }`
- `JSON.stringify(bundle, null, 2)` → `Blob` → object URL → programmatic `<a>` click → download
- Also offer a "Copy AI context" button that generates the same text format as the system prompt (useful for pasting into a new Claude Project session)

---

## Build Order (Dependencies Between Features)

The features have real dependencies. This is the correct shipping order:

**Step 1 — Settings page (no dependencies)**
Can be built immediately. Reads existing `barkeeper.json` and `localStorage`. Does not require any other new feature. Delivers: logout, Anthropic key storage, bartender rename. This also validates the `bb_anthropic_key` localStorage pattern before the chat view needs it.

**Step 2 — Export/Import (depends on: nothing new)**
Pure data manipulation — FileReader, JSON, State.set/save. No dependency on structured inventory or chat. Useful immediately for users migrating from Claude Projects. Build export first (simpler), then import with the validation + preview pattern.

**Step 3 — Inventory structured fields (depends on: schema update from Step 1/2 window)**
The in-place migration runs on load; the UI adds brand/style/type fields to the bottle entry editor. Must ship before the Claude chat panel so the AI has richer context to work with.

**Step 4 — Onboarding improvements: open-text inventory parser (depends on: Step 3)**
The paste parser outputs `{ name, tier, brand?, style? }` objects — it needs the structured field schema to already be in place so parsed items land correctly. The parser is a standalone IIFE (`InventoryParser`) that InventoryView and OnboardingView both call.

**Step 5 — Claude API chat panel (depends on: Step 1 for API key storage)**
Step 1 must ship first (the Settings page is where the user stores their Anthropic key). The chat panel reads `bb_anthropic_key` and calls `buildSystemPrompt()` with inventory + profile. Step 3's structured fields improve context quality but are not required — the chat panel works with the current name+tier format.

**Step 6 — Onboarding UX improvements (depends on: Step 4)**
Skip/return logic, slider bars, and the middle option are UI-only changes. The inventory paste panel (Step 4) should be integrated here.

**Summary dependency graph:**

```
Settings (Step 1)
  └─→ Chat Panel (Step 5)

Export/Import (Step 2)  [independent]

Inventory Structured Fields (Step 3)
  └─→ Inventory Parser (Step 4)
        └─→ Onboarding UX (Step 6)
```

Steps 1, 2, and 3 can be parallelized across developers. Steps 4 and 5 depend on 3 and 1 respectively.

---

## Confidence Levels

| Area | Confidence | Notes |
|---|---|---|
| Settings split (localStorage vs GitHub) | HIGH | Directly follows existing SetupView pattern; no unknowns |
| Streaming fetch + ReadableStream | HIGH | Verified against official Anthropic streaming docs; SSE event format confirmed |
| `anthropic-dangerous-allow-browser` header | HIGH | Documented in official Anthropic API reference for BYOK browser use |
| Claude API context injection strategy | MEDIUM | Token budget estimates are heuristic (4 chars/token rough average); test with real inventory |
| Inventory migration (additive fields) | HIGH | Schema inspection confirms no format migration needed; only field addition |
| Open-text inventory parser accuracy | MEDIUM | Keyword list covers common cases; unusual brand names or non-English spirits will land in REVIEW bucket — expected and acceptable |
| Import safety (sequential writes, SHA refresh) | HIGH | Follows GitHub API conflict-prevention pattern already in github-api.js |
| Build order | HIGH | Dependencies are direct code-level references; no speculation |

---

_Sources:_
- _Anthropic Streaming Messages documentation: https://platform.claude.com/docs/en/build-with-claude/streaming_
- _Anthropic API reference (browser header): https://docs.anthropic.com/claude/reference/messages-streaming_
- _Codebase: app/js/github-api.js, app/js/state.js, app/js/views/inventory.js_
- _Schema: schema/inventory.schema.json_
- _Data: data/inventory.json, data/barkeeper.json_
