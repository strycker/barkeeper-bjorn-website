// Anthropic API wrapper — direct browser call with BYOK.
// Mirrors github-api.js IIFE shape. Consumed by RecipesView (generate recipe).
// Phase 5 (CHAT) will extend this module with streaming support.

const ClaudeAPI = (() => {

  const ENDPOINT       = 'https://api.anthropic.com/v1/messages';
  const API_VERSION    = '2023-06-01';
  // Re-verify model ID at https://docs.anthropic.com/en/docs/about-claude/models
  // Allow localStorage.bb_chat_model override so the user can switch models without a code change.
  const DEFAULT_MODEL  = 'claude-sonnet-4-5-20250929';

  function getKey() {
    return localStorage.getItem('bb_anthropic_key') || '';
  }

  function getModel() {
    return localStorage.getItem('bb_chat_model') || DEFAULT_MODEL;
  }

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

  function appendLog(entry) {
    try {
      const log = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
      log.push({ ts: new Date().toISOString(), ...entry });
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

    appendLog({ type: 'request', model, prompt: userPrompt, system: systemPrompt });

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': API_VERSION,
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({ error: { message: res.statusText } }));
      const msg =
        res.status === 401 ? 'Invalid API key. Check Settings.' :
        res.status === 429 ? `Rate limited — retry after ${res.headers.get('retry-after') || '?'}s.` :
        res.status === 529 ? 'Anthropic API overloaded. Try again in a moment.' :
        errBody.error?.message || `HTTP ${res.status}`;
      appendLog({ type: 'error', status: res.status, message: msg });
      throw new Error(msg);
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    if (!text) throw new Error('Empty response from Anthropic API.');

    appendLog({ type: 'response', status: res.status, raw: text, usage: data.usage });

    try {
      return extractJSON(text);
    } catch {
      throw new Error('Could not parse AI response as JSON. Raw: ' + text.slice(0, 200));
    }
  }

  return { generateRecipe };
})();
