# Stack Research

**Project:** Barkeeper Bjorn Web UI — Milestone 2 additions
**Researched:** 2026-05-11

---

## Browser → Anthropic API (Direct Calls)

### CORS Status: SUPPORTED (as of August 2024)

Anthropic enabled CORS for their Messages API in August 2024. Direct browser-to-`api.anthropic.com` calls work without a proxy — no backend required. This is precisely the bring-your-own-API-key pattern this project uses.

**Required header for raw fetch (no SDK):**

```
anthropic-dangerous-direct-browser-access: true
```

This header must be included on every request in addition to `x-api-key`, `anthropic-version`, and `content-type`.

**Full request shape (non-streaming):**

```js
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json',
    'anthropic-dangerous-direct-browser-access': 'true',
  },
  body: JSON.stringify({
    model: 'claude-haiku-4-5',   // cheapest; user can override
    max_tokens: 1024,
    messages: [{ role: 'user', content: userMessage }],
  }),
});
const data = await response.json();
const text = data.content[0].text;
```

**Recommended model for chat panel:** `claude-haiku-4-5` — fastest, cheapest, best for real-time chat. Expose model selection in settings so power users can switch to Sonnet/Opus for recipe design tasks.

**SDK option:** The Anthropic TypeScript SDK supports `dangerouslyAllowBrowser: true` but it adds ~50 KB to the page and requires either a bundler or a CDN import. Since this project has no bundler, use raw fetch. The header approach is identical in behavior.

**Error handling:** Anthropic returns structured error JSON even on 4xx/5xx. Always check `response.ok` before parsing, and surface `error.error.message` to the user. Rate limit is 429; overload is 529. Network failures (CORS mismatch, no key) throw before you reach the response.

---

## localStorage API Key Security

### Risk Assessment for This App: ACCEPTABLE

The theoretical risk of localStorage is XSS: any injected script can read it. The practical risk for this app is low because:

1. **No third-party scripts.** The app has zero npm dependencies and no CDN script tags. The entire JS surface is files in this repo. XSS via supply-chain attack is effectively impossible.
2. **No user-generated HTML rendered as HTML.** Views use `textContent` and DOM methods, not `innerHTML` with user data. No injection vectors.
3. **Bring-your-own-key pattern.** The key never leaves the browser except to `api.anthropic.com`. No server receives it. Storing it server-side would be strictly worse (server breach = everyone's key leaked).
4. **Personal-use audience.** The threat model is not a public SaaS — it is one person (Glenn) plus a handful of trusted non-technical users who fork their own copy. Each user's key lives in their own browser instance.
5. **Same pattern already in use for GitHub PAT.** The GitHub PAT (`bb_token`) is already in localStorage by design. The Anthropic key is the same pattern.

**Real risks to acknowledge (not dismiss):**

- A malicious browser extension with host-match permissions could read localStorage. Users should be warned not to install sketchy extensions.
- If the user opens the app on a shared/public computer and doesn't clear localStorage, the key persists. Warn on first key entry; offer a "clear key" button in settings.
- DevTools console access: on a shared machine, anyone can read the key in one line. Mitigated by being a single-user personal app.

**Mitigations to implement:**

- Store key under a namespaced key (`bb_anthropic_key`), not something generic.
- Never log the key anywhere (console.log, error reporting, etc.).
- Display the key in settings as `sk-ant-...` (first 10 chars) + masked remainder — never full value.
- Add a "Clear API Key" button that calls `localStorage.removeItem('bb_anthropic_key')`.
- One-time informational toast on key save: "Key stored locally. Never leave this app open on shared devices."

**Conclusion:** localStorage is the correct choice here. HttpOnly cookies require a backend. In-memory only requires re-entry on every page load. Session storage requires re-entry on every tab open. localStorage + user awareness is the right tradeoff for this use case.

---

## Vanilla JS Structured Data Migration

### Context

The existing inventory schema already uses `bottleEntry` objects (`{ name, category, tier, notes, best_for }`) for all spirit/liqueur/bitters sections. The `STRING_SECTIONS` (mixers, perishables, pantry, produce, etc.) are flat string arrays — and the milestone scope leaves those as strings. The structured fields milestone adds `brand`, `type`, `style` to the existing `bottleEntry` objects and changes the tier enum.

**The data is already structured objects — not flat strings.** The migration scope is:
- Extending `bottleEntry` with new optional fields (`brand`, `type`, `style`)
- Adding new tier values (`Standard`, `Dirt Cheap`) to the existing enum
- In-place editing UI on existing bottles

### Migration Pattern: Defensive Optional Fields

Since the new fields are optional additions to existing objects, no destructive migration is needed. The pattern is "normalize on read":

```js
// In a migration helper — run once on loadAll() completion
function migrateInventory(inv) {
  const BOTTLE_KEYS = [
    'base_spirits.whiskey', 'base_spirits.brandy', /* ...all keys */
  ];

  for (const dotKey of BOTTLE_KEYS) {
    const arr = getNestedArr(inv, dotKey);
    arr.forEach(bottle => {
      // Coerce string entries (shouldn't exist, but guard anyway)
      if (typeof bottle === 'string') {
        // Replace with object — shouldn't happen given current schema
        Object.assign(bottle, { name: bottle });
        return;
      }
      // Add missing optional fields as undefined (don't pollute JSON with nulls)
      // No action needed — JSON round-trips omit undefined fields
    });
  }

  // Tier enum expansion: old values remain valid, new values added to UI only
  // No migration needed — existing tier values stay as-is
  return inv;
}
```

**Key principle:** New optional fields don't need a migration step — they simply don't exist on old objects and that's valid. Only add a migration step if you're renaming a field, changing its type, or removing a field that code depends on.

**Schema version tracking:** Add a `_schema_version` field to `inventory.json` at the root. On load, check version; if below target, run migration chain and save. Start at version `1` (current); new fields bump to `2`.

```js
const MIGRATIONS = {
  1: inv => {
    // Tier enum expansion (no data change needed — just UI)
    inv._schema_version = 2;
    return inv;
  },
};

function runMigrations(inv) {
  const version = inv._schema_version || 1;
  let v = version;
  while (MIGRATIONS[v]) {
    inv = MIGRATIONS[v](inv);
    v++;
  }
  return inv;
}
```

**Backward compat guarantee:** Old data (no `brand`/`type`/`style` fields) renders fine because the UI checks for field presence before displaying. New fields appear only after a user edits a bottle. No forced migration write on first load — write only if a migration actually changes data (check `version !== targetVersion`).

---

## Browser File Download/Upload (Export/Import)

### Download (Export)

The pattern is well-established and works in all modern browsers:

```js
function downloadJSON(filename, data) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;  // e.g. 'barkeeper-bjorn-export-2026-05-11.json'
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);  // release memory immediately
}
```

For the AI-context markdown export (plain text for pasting into Claude/ChatGPT):

```js
function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/plain' });
  // same URL.createObjectURL pattern
}
```

**Bundle export shape:** Include all four data files plus export metadata in one JSON:

```json
{
  "export_version": 1,
  "exported_at": "2026-05-11T00:00:00Z",
  "app": "barkeeper-bjorn",
  "data": {
    "barkeeper": { ... },
    "profile": { ... },
    "inventory": { ... },
    "recipes": { ... }
  }
}
```

### Upload (Import)

Use a hidden `<input type="file">` triggered by a visible button. Read with FileReader:

```js
function importJSON(onData) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.addEventListener('change', () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const bundle = JSON.parse(e.target.result);
        onData(bundle);
      } catch (err) {
        // surface parse error to user as toast
      }
    };
    reader.readAsText(file);
  });
  input.click();
}
```

**Import validation checklist:**
1. Check `bundle.app === 'barkeeper-bjorn'` to reject wrong-format files.
2. Check `bundle.export_version` for compatibility.
3. Validate required top-level keys before touching State.
4. Show a confirmation modal with a summary ("This will replace your current barkeeper, profile, inventory, and recipes. Continue?") before writing.
5. Write all keys atomically via State.set() then save each, or offer selective import ("Import only inventory").

**Memory note:** `URL.revokeObjectURL()` must be called after the click, or the object URL leaks memory for the browser session. The pattern above handles this correctly.

---

## Streaming Chat UI (No Framework)

### The Approach: fetch() + ReadableStream reader

`EventSource` cannot be used because it only supports GET requests with no body. Use `fetch()` with `stream: true` (implicitly supported) and read the response body as a stream:

```js
async function streamMessage(apiKey, messages, onToken, onDone, onError) {
  let response;
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 1024,
        stream: true,
        messages,
      }),
    });
  } catch (networkErr) {
    onError('Network error: ' + networkErr.message);
    return;
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    onError(err?.error?.message || `HTTP ${response.status}`);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();  // last partial line stays in buffer

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') continue;
        try {
          const evt = JSON.parse(raw);
          if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
            onToken(evt.delta.text);
          }
          if (evt.type === 'message_stop') {
            onDone();
          }
          if (evt.type === 'error') {
            onError(evt.error?.message || 'Stream error');
          }
        } catch (_) { /* skip malformed lines */ }
      }
    }
  }
}
```

### DOM Update Pattern

Use `textContent +=` on a pre-allocated element, not innerHTML. Create the message element before the stream starts; append tokens to it as they arrive.

```js
function startStreamingMessage(container) {
  const msgEl = document.createElement('div');
  msgEl.className = 'chat-message assistant';
  const textEl = document.createElement('p');
  msgEl.appendChild(textEl);
  container.appendChild(msgEl);
  container.scrollTop = container.scrollHeight;

  return {
    appendToken(text) {
      textEl.textContent += text;
      container.scrollTop = container.scrollHeight;
    },
    finalize() {
      msgEl.classList.add('complete');
    },
    showError(msg) {
      textEl.textContent = 'Error: ' + msg;
      msgEl.classList.add('error');
    },
  };
}
```

**Usage:**

```js
const streaming = startStreamingMessage(chatContainer);
await streamMessage(
  apiKey,
  conversationHistory,
  token => streaming.appendToken(token),
  () => streaming.finalize(),
  err => streaming.showError(err),
);
```

### SSE Event Flow (Anthropic-specific)

The Anthropic stream emits these event types in order:

1. `message_start` — message shell with empty content (ignore for text display)
2. `content_block_start` — begins a text block (ignore for text display)
3. `content_block_delta` with `delta.type = 'text_delta'` — this is your token; read `delta.text`
4. `content_block_stop` — ends a block (ignore for text display)
5. `message_delta` — usage stats; ignore for chat UI
6. `message_stop` — stream complete; call onDone()
7. `ping` events — ignore
8. `error` events — call onError()

**No framework needed.** The pattern above is ~60 lines of vanilla JS, handles all edge cases, and doesn't require any library.

### Conversation history

Maintain an in-memory array of `{ role, content }` pairs for the current chat session. On each user send, push the user message; on stream complete, push the assembled assistant response. Pass the full array as `messages` to the API. This gives Claude full context. Cap history at ~20 turns to avoid context limit errors; truncate from the oldest non-system messages.

---

## Recommendations

**1. API module: `app/js/claude-api.js`**
Create a single IIFE module with `ClaudeAPI.streamMessage()` and `ClaudeAPI.sendMessage()` (non-streaming). Store key under `bb_anthropic_key`. This module is the single place where the key is read and where requests are formed. All other code calls into it.

**2. Settings view: `app/js/views/settings.js`**
Follow the existing view pattern (IIFE, single `render(container)` export). The settings view handles: API key entry/masking, model selection dropdown, logout (clear all localStorage), export/import entry points, barkeeper rename.

**3. Use streaming for the chat panel; non-streaming for one-shot AI calls**
The chat panel (back-and-forth conversation) needs streaming for UX. One-shot calls (e.g., "Generate with AI" on a recipe, or "Get AI cocktail recommendation") can use the simpler non-streaming path since the user is waiting for a complete result anyway, and the latency is acceptable.

**4. Inventory migration: normalize on load, write only if changed**
Check `_schema_version` in `inventory.json` on `State.loadAll()` completion. Run migrations if needed, then write back. New optional fields (`brand`, `type`, `style`) require no data migration — add only when user edits a bottle in-place.

**5. Export bundle: one JSON file, selective import**
Export all four data files in a single `barkeeper-bjorn-export-YYYY-MM-DD.json`. Import validates the schema then shows a confirmation modal with selective import checkboxes (barkeeper, profile, inventory, recipes independently). This is the primary path for Glenn to migrate his existing Claude Projects data.

**6. Tier enum expansion: UI only, no data migration**
Add `Standard` and `Dirt Cheap` to the tier dropdown in the inventory edit form. Existing tier values (`industrial`, `premium-accessible`, `boutique`, `rare/exceptional`) remain valid. No schema write needed.

---

## Confidence Levels

| Area | Level | Rationale |
|------|-------|-----------|
| Anthropic CORS support | HIGH | Announced August 2024, documented in official release notes; confirmed by multiple sources including Simon Willison's analysis |
| `anthropic-dangerous-direct-browser-access` header | HIGH | Required header documented in Anthropic SDK GitHub issues and community resources; consistent across sources |
| Streaming via fetch + ReadableStream | HIGH | Standard Web API; Anthropic SSE event types documented at platform.claude.com/docs; pattern well-established |
| SSE event type names (`content_block_delta`, `text_delta`) | HIGH | Read directly from official Anthropic streaming docs |
| localStorage security for this use case | HIGH | Well-understood risk model; consistent with existing PAT-in-localStorage pattern; confirmed by pragmatic security analysis |
| Blob + URL.createObjectURL for download | HIGH | Standard Web API; MDN-documented; works in all modern browsers |
| FileReader for JSON import | HIGH | Standard Web API; well-documented pattern |
| Data migration approach (normalize on read) | HIGH | Standard pattern for schema evolution in client-side apps; conservative approach eliminates migration bugs |
| Model recommendation (Haiku for chat) | MEDIUM | Based on Anthropic pricing and speed characteristics; user should be able to override in settings |

---

## Sources

- Anthropic CORS announcement: https://simonwillison.net/2024/Aug/23/anthropic-dangerous-direct-browser-access/ (August 2024)
- Anthropic streaming docs: https://platform.claude.com/docs/en/build-with-claude/streaming
- Anthropic TypeScript SDK browser issue thread: https://github.com/anthropics/anthropic-sdk-typescript/issues/248
- localStorage XSS pragmatic analysis: https://pragmaticwebsecurity.com/articles/oauthoidc/localstorage-xss.html
- Blob/download pattern: https://developer.mozilla.org/en-US/docs/Web/API/Blob
- Streaming frontend patterns (2026): https://medium.com/@fellipe.silvestre/text-streaming-on-frontend-from-javascript-protocols-to-real-time-llm-chat-6f3403af54ad
