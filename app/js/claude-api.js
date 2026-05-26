// Anthropic API wrapper — direct browser call with BYOK.
// Mirrors github-api.js IIFE shape. Consumed by RecipesView (generate recipe),
// ChatView (streaming), and AI-* features (structured-JSON generation).
//
// Phase 7 extension: streamMessage (SSE), requestJSON (structured + fail-closed),
// callMessages (non-streaming primitive), buildContext (cached context), and
// deriveContextMarkdown (JSON->MD walk). generateRecipe is preserved.

const ClaudeAPI = (() => {

  const ENDPOINT       = 'https://api.anthropic.com/v1/messages';
  const API_VERSION    = '2023-06-01';
  // Valid model IDs (re-verify at https://platform.claude.com/docs/en/about-claude/models):
  //   - claude-haiku-4-5   (fast/cheap, deterministic parse/repair/derivation)
  //   - claude-sonnet-4-6  (default — chat, recipe design, recommendation explanations)
  //   - claude-opus-4-7    (max quality)
  // Use bare aliases, no date suffix. SET-05 override via localStorage.bb_chat_model.
  const DEFAULT_MODEL  = 'claude-sonnet-4-6';

  function getKey() {
    return localStorage.getItem('bb_anthropic_key') || '';
  }

  function getModel() {
    return localStorage.getItem('bb_chat_model') || DEFAULT_MODEL;
  }

  // Stable persona instruction kept verbatim across turns so the cached system
  // block hashes consistently (D-04/D-05). Volatile content (user question,
  // timestamps, mood) MUST live in `messages`, never here.
  const BASE_PERSONA_INSTRUCTION = [
    `You are the user's configured home-bar bartender persona.`,
    `Speak in the voice configured in the user's barkeeper.json (name, preset, signoff).`,
    `Ground every recommendation in the user's inventory and vetoes — never invent bottles the user does not own; flag substitutions explicitly.`,
    `Respect the user's locked flavor profile and made-history when suggesting drinks.`,
    `Surface allergen and responsible-consumption caveats where relevant (egg white, dairy, nuts, overproof/large pours).`,
  ].join('\n');

  function buildSystemPrompt(ctx = {}) {
    const { bkName, bkPreset, inventoryText, profileText } = ctx;
    return [
      `You are ${bkName || 'Barkeeper Bjorn'}, a ${bkPreset || 'Professional Mixologist'} bartender.`,
      `Design a new original cocktail for the home bar described below.`,
      ``,
      `## Bar Inventory`,
      inventoryText || 'Not set yet.',
      ``,
      `## Flavor Profile`,
      profileText || 'Not set yet.',
      ``,
      `You MUST respond with a single JSON object and nothing else — no prose, no markdown, no codefences.`,
      `Schema:`,
      `{`,
      `  "name": string,`,
      `  "tagline": string,`,
      `  "ingredients": [{ "amount": string, "name": string, "notes": string }],`,
      `  "method": string,`,
      `  "glassware": string,`,
      `  "garnish": string,`,
      `  "tasting_notes": string,`,
      `  "method_type": "shaken" | "stirred" | "built" | "blended" | "thrown" | "other",`,
      `  "why_it_works": string,`,
      `  "suggested_occasions": [string]`,
      `}`,
    ].join('\n');
  }

  const LOG_KEY     = 'bb_api_log';
  const LOG_MAX     = 50;

  // AI-09 hardened log: ONLY {ts, type, model, usage [, status, message]}.
  // NEVER record the API key, full prompt, system text, or raw response body.
  // Callers passing key/prompt/system/raw fields will have them stripped here.
  function appendLog(entry) {
    try {
      const safe = { ts: new Date().toISOString() };
      if (entry && typeof entry === 'object') {
        if (entry.type)    safe.type    = entry.type;
        if (entry.model)   safe.model   = entry.model;
        if (entry.usage)   safe.usage   = entry.usage;
        if (entry.status)  safe.status  = entry.status;
        if (entry.message) safe.message = entry.message;
        // Explicitly drop: key, x-api-key, prompt, system, raw, content, text.
      }
      const log = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
      log.push(safe);
      if (log.length > LOG_MAX) log.splice(0, log.length - LOG_MAX);
      localStorage.setItem(LOG_KEY, JSON.stringify(log));
    } catch { /* storage full or disabled — silently skip */ }
  }

  function extractJSON(text) {
    // Model sometimes wraps in ```json fences despite strict instructions.
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const raw = fenced ? fenced[1] : text;
    return JSON.parse(raw.trim());
  }

  // Build the standard auth+version+browser-direct header block.
  // CHAT-02: anthropic-dangerous-direct-browser-access is mandatory for in-browser calls.
  function _headers(key) {
    return {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': API_VERSION,
      'anthropic-dangerous-direct-browser-access': 'true',
    };
  }

  // Map a non-OK Messages API response to a user-readable error string.
  function _httpError(res, errBody) {
    if (res.status === 401) return 'Invalid API key. Check Settings.';
    if (res.status === 429) return `Rate limited — retry after ${res.headers.get('retry-after') || '?'}s.`;
    if (res.status === 529) return 'Anthropic API overloaded. Try again in a moment.';
    return (errBody && errBody.error && errBody.error.message) || `HTTP ${res.status}`;
  }

  // ── Non-streaming primitive (callMessages) ────────────────────────────────
  // Body shape: { model, max_tokens, system, messages, ... }.  Optional internal
  // `_logType` selects the AI-09 log type label (default 'request').
  async function callMessages(body) {
    const key = getKey();
    if (!key) throw new Error('No Anthropic API key configured. Add one in Settings.');

    const logType = body && body._logType ? body._logType : 'request';
    const sendBody = { ...body };
    delete sendBody._logType;

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: _headers(key),
      body: JSON.stringify(sendBody),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({ error: { message: res.statusText } }));
      const msg = _httpError(res, errBody);
      appendLog({ type: 'error', model: sendBody.model, status: res.status, message: msg });
      throw new Error(msg);
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    appendLog({ type: logType, model: sendBody.model, usage: data.usage });
    if (!text) throw new Error('Empty response from Anthropic API.');
    return text;
  }

  // ── Streaming (SSE) — chat surfaces (CHAT-05/08/09) ───────────────────────
  // Source: 07-AI-SPEC.md §3 — buffered SSE reader. Caller passes:
  //   body:    { model, max_tokens, system, messages }  (stream:true is forced)
  //   onText:  (chunk) => void                          — token deltas
  //   signal:  AbortController.signal                   — CHAT-06 cancellation
  // Returns the final usage object (or null) and AI-09-logs {type:'chat', model, usage}.
  async function streamMessage(body, { onText, signal } = {}) {
    const key = getKey();
    if (!key) throw new Error('No Anthropic API key configured. Add one in Settings.');

    const sendBody = { ...body, stream: true };
    delete sendBody._logType;

    const resp = await fetch(ENDPOINT, {
      method: 'POST',
      headers: _headers(key),
      body: JSON.stringify(sendBody),
      signal,
    });

    if (resp.status === 429) {
      // CHAT-09: surface retry-after; do NOT auto-retry in a loop.
      const retryAfter = resp.headers.get('retry-after') || '?';
      const msg = `Rate limited — retry after ${retryAfter}s.`;
      appendLog({ type: 'error', model: sendBody.model, status: 429, message: msg });
      throw new Error(msg);
    }
    if (!resp.ok) {
      const errText = await resp.text().catch(() => resp.statusText);
      const msg = `Anthropic ${resp.status}: ${errText}`;
      appendLog({ type: 'error', model: sendBody.model, status: resp.status, message: `HTTP ${resp.status}` });
      throw new Error(msg);
    }

    const reader  = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let usage  = null;

    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();                              // keep the trailing partial line
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;         // ignore `event:` / blank lines
        const data = line.slice(5).trim();
        if (!data) continue;
        let evt;
        try { evt = JSON.parse(data); }
        catch { continue; }                              // skip malformed SSE frames
        if (evt.type === 'content_block_delta' && evt.delta && evt.delta.type === 'text_delta') {
          if (typeof onText === 'function') onText(evt.delta.text);
        } else if (evt.type === 'message_delta') {
          if (evt.usage) usage = evt.usage;              // final token counts
        } else if (evt.type === 'error') {
          // CHAT-08: surface mid-stream errors to the caller.
          const errMsg = (evt.error && evt.error.message) || 'stream error';
          appendLog({ type: 'error', model: sendBody.model, message: errMsg });
          throw new Error(errMsg);
        }
        // message_start / content_block_start/stop / message_stop / ping: ignore.
      }
    }

    appendLog({ type: 'chat', model: sendBody.model, usage });   // AI-09 — never the key
    return usage;
  }

  // ── Structured-JSON helper (AI-03/08/10/11/13) ────────────────────────────
  // 07-AI-SPEC.md §4b: parse -> Normalize -> validate -> ONE retry -> fail closed.
  // Caller MUST NOT write on throw. Returns the Normalized object on success.
  async function requestJSON({ system, userPrompt, schemaKey, model, maxTokens } = {}) {
    const mdl  = model     || getModel();
    const mtok = maxTokens || 1024;
    const baseSystem = (system || '') +
      '\nRespond with a SINGLE JSON object and nothing else — no prose, no markdown, no code fences.';

    const ask = (extra = '') => callMessages({
      model: mdl,
      max_tokens: mtok,
      system: [{ type: 'text', text: baseSystem }],
      messages: [{ role: 'user', content: (userPrompt || '') + extra }],
      _logType: 'structured',
    });

    let raw = await ask();
    for (let attempt = 0; attempt < 2; attempt++) {
      let obj = null;
      try { obj = extractJSON(raw); } catch { obj = null; }
      if (obj && typeof obj === 'object') {
        // Coerce to canonical shape (idempotent).
        const norm = (typeof Normalize !== 'undefined' && Normalize.byKey)
          ? Normalize.byKey(schemaKey, obj) : obj;
        // Validate. Prefer the shared WriteGate if present (browser); fall back to
        // a minimal local shape check (node tests can stub Normalize/WriteGate).
        let errors = [];
        if (typeof WriteGate !== 'undefined' && typeof WriteGate.validate === 'function') {
          errors = WriteGate.validate(schemaKey, norm) || [];
        }
        if (errors.length === 0) return norm;
        if (attempt === 0) {
          raw = await ask(`\n\nYour previous output was invalid: ${errors.join('; ')}. Return corrected JSON only.`);
          continue;
        }
        // Fail closed — caller must NOT write.
        const err = new Error('Structured output failed validation: ' + errors.join('; '));
        err.schemaKey = schemaKey;
        err.errors = errors;
        throw err;
      }
      if (attempt === 0) {
        raw = await ask('\n\nThat was not valid JSON. Return a single valid JSON object only.');
        continue;
      }
      const err = new Error('Unparseable JSON from model.');
      err.schemaKey = schemaKey;
      err.errors = ['unparseable JSON'];
      throw err;
    }
  }

  // ── JSON -> Markdown derivation (D-06) ────────────────────────────────────
  // Context derivation, lossy-OK — NOT the Phase 8 round-trippable export contract.
  // Walks State._data and emits a readable markdown block for the cached system
  // context (persona / profile / mood / originals / drafts / made-log /
  // inventory / vetoes). Style mirrors export.js exportAIContext.
  function deriveContextMarkdown() {
    // Guard: State may be undefined in node tests; emit a minimal stub.
    if (typeof State === 'undefined' || typeof State.get !== 'function') {
      return '# Bar Context\n_State not loaded._';
    }
    const inventory = State.get('inventory') || {};
    const recipes   = State.get('recipes')   || {};
    const drafts    = State.get('drafts')    || {};
    const profile   = State.get('profile')   || {};
    const barkeeper = State.get('barkeeper') || {};

    const lines = [];
    const bkName   = (barkeeper.identity && barkeeper.identity.name) || 'Barkeeper Bjorn';
    const bkPreset = barkeeper.active_preset || '';

    lines.push('# Bar Context');
    lines.push(`_Bartender: ${bkName}${bkPreset ? ` (${bkPreset})` : ''}_`);
    lines.push('');

    // Persona
    lines.push('## Persona');
    if (barkeeper.personality_description) lines.push(barkeeper.personality_description);
    if (barkeeper.cocktail_naming_style)   lines.push(`Naming style: ${barkeeper.cocktail_naming_style}`);
    if (barkeeper.signoff)                  lines.push(`Signoff: ${barkeeper.signoff}`);
    if (Array.isArray(barkeeper.behavioral_rules) && barkeeper.behavioral_rules.length) {
      lines.push('Behavioral rules:');
      barkeeper.behavioral_rules.forEach(r => lines.push(`- ${r}`));
    }
    lines.push('');

    // Flavor profile (axes as floats — D-02)
    lines.push('## Flavor Profile');
    const axes = (profile.flavor_profile && profile.flavor_profile.axes) || {};
    const axisEntries = Object.entries(axes).filter(([, v]) => v && !v._skipped);
    if (axisEntries.length) {
      axisEntries.forEach(([k, v]) => {
        const pos = typeof v === 'object' ? v.position : v;
        lines.push(`- ${k}: ${pos}`);
      });
    } else {
      lines.push('_Not set._');
    }
    // Identity hints (drinking frequency, household, vocabulary) — non-PII signal only.
    const bg = profile.background || {};
    if (bg.drinking_frequency)    lines.push(`- drinking_frequency: ${bg.drinking_frequency}`);
    if (bg.household_context)     lines.push(`- household_context: ${bg.household_context}`);
    if (bg.vocabulary_preference) lines.push(`- vocabulary_preference: ${bg.vocabulary_preference}`);
    lines.push('');

    // Current mood (recommender-engine.normalizeProfile if available)
    if (typeof RecommenderEngine !== 'undefined' && typeof RecommenderEngine.normalizeProfile === 'function') {
      try {
        const p = RecommenderEngine.normalizeProfile(profile);
        if (p && typeof p === 'object' && Object.keys(p).length) {
          lines.push('## Current Mood (derived)');
          Object.entries(p).forEach(([k, v]) => {
            if (typeof v === 'number') lines.push(`- ${k}: ${v.toFixed(2)}`);
          });
          lines.push('');
        }
      } catch { /* defensive — derivation must never crash context build */ }
    }

    // Originals
    const originals = (recipes.originals || []).filter(r => r && r.name);
    if (originals.length) {
      lines.push('## Original Cocktails');
      originals.forEach(r => {
        lines.push(`### ${r.name}`);
        if (r.tagline)      lines.push(`_${r.tagline}_`);
        if (r.creator)      lines.push(`Creator: ${r.creator}`);
        if (Array.isArray(r.ingredients) && r.ingredients.length) {
          lines.push('Ingredients:');
          r.ingredients.forEach(i => {
            const nm = i && i.name ? i.name : '';
            const am = i && i.amount ? i.amount : '';
            lines.push(`- ${am} ${nm}${i && i.notes ? ` (${i.notes})` : ''}`.trim());
          });
        }
        if (r.method)       lines.push(`Method: ${r.method}`);
        if (r.method_type)  lines.push(`Method type: ${r.method_type}`);
        if (r.glassware)    lines.push(`Glassware: ${r.glassware}`);
        if (r.garnish)      lines.push(`Garnish: ${r.garnish}`);
        if (r.why_it_works) lines.push(`Why it works: ${r.why_it_works}`);
        lines.push('');
      });
    }

    // Drafts (5th data file)
    const draftList = (drafts.drafts || []).filter(r => r && r.name);
    if (draftList.length) {
      lines.push('## AI Drafts');
      draftList.forEach(d => {
        lines.push(`- ${d.name}${d.base ? ` (${d.base})` : ''}${d.source_prompt ? ` — from: ${d.source_prompt}` : ''}`);
      });
      lines.push('');
    }

    // Made-log with times_made
    const madeLog = (recipes.made_log || []).filter(r => r && r.name);
    if (madeLog.length) {
      lines.push('## Made Log (with frequency)');
      madeLog.forEach(m => {
        const n = m.times_made || 1;
        lines.push(`- ${m.name} — ${n}× ${m.last_made ? `(last: ${m.last_made})` : ''}`.trim());
      });
      lines.push('');
    }

    // Inventory
    lines.push('## Inventory');
    const baseSpirits = inventory.base_spirits || {};
    Object.entries(baseSpirits).forEach(([cat, items]) => {
      if (!Array.isArray(items) || !items.length) return;
      const names = items.map(i => (typeof i === 'string' ? i : (i.style || i.type || i.brand || ''))).filter(Boolean).join(', ');
      if (names) lines.push(`- **${cat}:** ${names}`);
    });
    const liqueurs = inventory.liqueurs_and_cordials || {};
    Object.entries(liqueurs).forEach(([cat, items]) => {
      if (!Array.isArray(items) || !items.length) return;
      const names = items.map(i => (typeof i === 'string' ? i : (i.style || i.type || i.brand || ''))).filter(Boolean).join(', ');
      if (names) lines.push(`- **liqueurs/${cat}:** ${names}`);
    });
    const bitters = inventory.bitters || {};
    Object.entries(bitters).forEach(([cat, items]) => {
      if (!Array.isArray(items) || !items.length) return;
      const names = items.map(i => (typeof i === 'string' ? i : (i.style || i.type || i.brand || ''))).filter(Boolean).join(', ');
      if (names) lines.push(`- **bitters/${cat}:** ${names}`);
    });
    ['fortified_wines_and_aperitif_wines', 'syrups', 'mixers_bottles', 'non_alcoholic_spirits'].forEach(k => {
      const arr = inventory[k] || [];
      if (!arr.length) return;
      const names = arr.map(i => (typeof i === 'string' ? i : (i.style || i.type || i.brand || ''))).filter(Boolean).join(', ');
      if (names) lines.push(`- **${k}:** ${names}`);
    });
    ['mixers', 'refrigerator_perishables', 'pantry_spice_rack', 'fresh_produce', 'specialty_ingredients', 'garnish_and_service'].forEach(k => {
      const arr = inventory[k] || [];
      if (arr.length) lines.push(`- **${k}:** ${arr.join(', ')}`);
    });

    // Vetoes
    const vetoes = inventory.vetoes || {};
    const disliked = vetoes.disliked_ingredients || [];
    const subs     = vetoes.substitute_for_now    || [];
    if (disliked.length || subs.length) {
      lines.push('');
      lines.push('## Vetoes');
      if (disliked.length) lines.push(`- disliked: ${disliked.join(', ')}`);
      subs.forEach(s => {
        if (s && s.missing && s.substitute) lines.push(`- substitute "${s.missing}" → "${s.substitute}"`);
      });
    }

    return lines.join('\n');
  }

  // ── Cached context builder (D-04/D-05) ────────────────────────────────────
  // Returns an array of system text blocks. The LAST block carries cache_control:
  // {type:'ephemeral'} and contains NO volatile content (no timestamp/UUID/question).
  // The volatile user question must live in `messages`, not here.
  function buildContext() {
    return [
      { type: 'text', text: BASE_PERSONA_INSTRUCTION },
      { type: 'text', text: deriveContextMarkdown(), cache_control: { type: 'ephemeral' } },
    ];
  }

  // ── Existing one-shot recipe design (preserved) ───────────────────────────
  async function generateRecipe(userPrompt, ctx = {}) {
    const key = getKey();
    if (!key) throw new Error('No Anthropic API key configured. Add one in Settings.');

    const model = getModel();
    const systemPrompt = buildSystemPrompt(ctx);

    const requestBody = {
      model,
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    };

    // AI-09 hardened: type+model only (NO prompt/system/raw — those go to network, not log).
    appendLog({ type: 'request', model });

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: _headers(key),
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({ error: { message: res.statusText } }));
      const msg = _httpError(res, errBody);
      appendLog({ type: 'error', model, status: res.status, message: msg });
      throw new Error(msg);
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    if (!text) throw new Error('Empty response from Anthropic API.');

    appendLog({ type: 'response', model, status: res.status, usage: data.usage });

    try {
      return extractJSON(text);
    } catch {
      throw new Error('Could not parse AI response as JSON. Raw: ' + text.slice(0, 200));
    }
  }

  return {
    generateRecipe,
    callMessages,
    streamMessage,
    requestJSON,
    buildContext,
    deriveContextMarkdown,
    appendLog,
    getKey,
    getModel,
    extractJSON,
  };
})();
