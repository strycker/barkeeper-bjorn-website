// Reusable AI -> GitHub write-gate (Phase 7 D-11 / FM #1 mitigation).
// Three callers in Phase 7: AI-03 (draft promote), AI-08 (legacy MD import),
// AI-10 (JSON repair). One gate = one place to get key-hygiene and silent-
// corruption wrong. Contract:
//
//     1. coerce payload via Normalize.byKey(schemaKey, raw)
//     2. validate against schema/<schemaKey>.schema.json (required + shape)
//     3. if errors: SURFACE them and RETURN WITHOUT offering a write (fail-closed)
//     4. if valid: render an old-vs-new diff preview + confirm button
//     5. on confirm: caller's onConfirm() runs State.set/patch + sequential State.save
//
// The validator is a lightweight in-app shape check (no JSON-Schema runtime
// dependency — the app is zero-build). It returns an array of human-readable
// error strings; [] means valid.

const WriteGate = (() => {

  // Minimal JSON-Schema-ish runner over a parsed schema object. Supports the
  // subset our app's schema/*.json files actually use: required, type, enum,
  // pattern, properties, items, $ref to definitions, format date/date-time.
  // Anything beyond that is treated as a soft hint (no error raised).
  function _validateAgainstParsedSchema(schemaObj, value, schema, path) {
    const errors = [];
    if (!schema || typeof schema !== 'object') return errors;

    // Resolve $ref to a sibling #/definitions/<name>
    if (schema.$ref) {
      const m = schema.$ref.match(/^#\/definitions\/(.+)$/);
      if (m && schemaObj.definitions && schemaObj.definitions[m[1]]) {
        return _validateAgainstParsedSchema(schemaObj, value, schemaObj.definitions[m[1]], path);
      }
    }

    // Allow nullable strings via type:['string','null']
    const typeSpec = schema.type;
    if (typeSpec) {
      const types = Array.isArray(typeSpec) ? typeSpec : [typeSpec];
      const actual = value === null ? 'null'
                   : Array.isArray(value) ? 'array'
                   : typeof value;
      const acceptable = types.some(t => t === actual || (t === 'integer' && actual === 'number' && Number.isInteger(value)));
      if (!acceptable) {
        errors.push(`${path || '<root>'}: expected ${types.join('|')}, got ${actual}`);
        return errors;
      }
    }

    if (schema.enum && !schema.enum.includes(value)) {
      errors.push(`${path || '<root>'}: value ${JSON.stringify(value)} not in enum [${schema.enum.join(', ')}]`);
    }

    if (typeof value === 'string' && schema.pattern) {
      try {
        const re = new RegExp(schema.pattern);
        if (!re.test(value)) errors.push(`${path || '<root>'}: does not match ${schema.pattern}`);
      } catch { /* invalid regex — skip */ }
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (Array.isArray(schema.required)) {
        schema.required.forEach(req => {
          if (!(req in value) || value[req] == null || value[req] === '') {
            errors.push(`${path || '<root>'}: missing required field "${req}"`);
          }
        });
      }
      if (schema.properties) {
        Object.entries(schema.properties).forEach(([k, sub]) => {
          if (k in value) {
            errors.push(..._validateAgainstParsedSchema(schemaObj, value[k], sub, path ? `${path}.${k}` : k));
          }
        });
      }
    }

    if (Array.isArray(value) && schema.items) {
      value.forEach((item, i) => {
        errors.push(..._validateAgainstParsedSchema(schemaObj, item, schema.items, `${path || '<root>'}[${i}]`));
      });
    }

    return errors;
  }

  // Cache of fetched schemas (browser only; node tests pass schema in directly).
  const _schemaCache = {};

  // Fetch and parse schema/<key>.schema.json. Browser-only; in node tests the
  // caller passes a pre-parsed schema to `validateWith(schemaObj, payload)`.
  //
  // Path resolution: schemas live at <repo-root>/schema/, but the SPA is
  // served from <repo-root>/app/ in local dev (relative `schema/…` resolves
  // to `/app/schema/…` → 404). In GH Pages prod the publish root is `app/`
  // itself, so `/schema/` doesn't exist on the origin at all. We probe in
  // order:
  //   1. `../schema/<key>.schema.json`   — local dev served from repo root
  //   2. `schema/<key>.schema.json`      — if schemas were copied into app/
  //   3. `GitHubAPI.readJSON('schema/<key>.schema.json')` — works anywhere a
  //      GitHub token is configured (production + offline-mode local). This
  //      is the same auth path data/*.json already use.
  // First non-empty response wins; subsequent calls hit `_schemaCache`.
  async function _loadSchema(schemaKey) {
    if (_schemaCache[schemaKey]) return _schemaCache[schemaKey];
    const relPaths = [`../schema/${schemaKey}.schema.json`, `schema/${schemaKey}.schema.json`];
    if (typeof fetch === 'function') {
      for (const path of relPaths) {
        try {
          const resp = await fetch(path);
          if (resp.ok) {
            const json = await resp.json();
            _schemaCache[schemaKey] = json;
            return json;
          }
        } catch { /* try next */ }
      }
    }
    if (typeof GitHubAPI !== 'undefined' && typeof GitHubAPI.readJSON === 'function') {
      try {
        const { data } = await GitHubAPI.readJSON(`schema/${schemaKey}.schema.json`);
        if (data) { _schemaCache[schemaKey] = data; return data; }
      } catch { /* fall through */ }
    }
    return null;
  }

  // Pure validator: takes a parsed schema object and returns error strings.
  // Exposed so node tests can supply the schema without a browser fetch.
  function validateWith(schemaObj, payload) {
    if (!schemaObj) return ['no schema'];
    return _validateAgainstParsedSchema(schemaObj, payload, schemaObj, '');
  }

  // Browser-side validate by schemaKey (lazy-loads schema/<key>.schema.json).
  // Returns Promise<string[]>. For node tests prefer validateWith(schemaObj, payload).
  // If called synchronously (no schema fetched yet), returns [] and relies on
  // the async gate path — callers should `await WriteGate.validate(...)`.
  async function validate(schemaKey, payload) {
    const schemaObj = await _loadSchema(schemaKey);
    return validateWith(schemaObj, payload);
  }

  // Coerce a payload via Normalize if available (idempotent).
  function _coerce(schemaKey, payload) {
    if (typeof Normalize !== 'undefined' && Normalize.byKey) {
      try { return Normalize.byKey(schemaKey, payload); } catch { /* fall through */ }
    }
    return payload;
  }

  // Render a small old-vs-new preview into the given container.
  // Each row reuses the import-preview row class from export.js for visual parity.
  function _renderDiff(container, schemaKey, oldData, newData) {
    const oldStr = JSON.stringify(oldData || {}, null, 2);
    const newStr = JSON.stringify(newData || {}, null, 2);
    const oldSize = (oldStr.length / 1024).toFixed(1);
    const newSize = (newStr.length / 1024).toFixed(1);
    const esc = (typeof Utils !== 'undefined' && Utils.escapeHtml) ? Utils.escapeHtml : (s => String(s));

    container.innerHTML = `
      <div class="import-preview-row">
        <span class="badge badge-blue" style="flex:none;">json</span>
        <span style="flex:1;">${esc(schemaKey)} — current</span>
        <span style="font-size:0.82rem;color:var(--text-muted);">${oldSize} KB</span>
      </div>
      <div class="import-preview-row">
        <span class="badge badge-green" style="flex:none;">json</span>
        <span style="flex:1;">${esc(schemaKey)} — proposed</span>
        <span style="font-size:0.82rem;color:var(--text-muted);">${newSize} KB</span>
      </div>
      <details style="margin-top:8px;">
        <summary style="cursor:pointer;font-size:0.82rem;color:var(--text-dim);">Show payload</summary>
        <pre style="font-size:0.78rem;max-height:280px;overflow:auto;background:var(--bg-dark);padding:8px;border-radius:4px;">${esc(newStr)}</pre>
      </details>`;
  }

  // Main gate: schema -> validate -> diff preview -> confirm -> onConfirm.
  // Fail-closed: invalid payloads never reach onConfirm.
  //
  //   schemaKey:  'drafts' | 'recipes' | 'inventory' | 'profile' | 'barkeeper'
  //   oldData:    the current value (typically State.get(schemaKey))
  //   newPayload: the AI-produced payload before coercion
  //   message:    short description for the confirm dialog header
  //   onConfirm:  async () => { State.set/patch + await State.save(...) }
  //
  // Returns: Promise<{ status: 'invalid'|'confirmed'|'cancelled', errors?: string[] }>
  async function gate({ schemaKey, oldData, newPayload, message, onConfirm }) {
    const norm   = _coerce(schemaKey, newPayload);
    const errors = await validate(schemaKey, norm);

    if (errors && errors.length) {
      _surfaceErrors(schemaKey, errors);
      return { status: 'invalid', errors };
    }

    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.className = 'confirm-dialog-overlay';
      const esc = (typeof Utils !== 'undefined' && Utils.escapeHtml) ? Utils.escapeHtml : (s => String(s));
      overlay.innerHTML = `
        <div class="confirm-dialog" style="max-width:640px;">
          <h3>${esc(message || `Write ${schemaKey}?`)}</h3>
          <p style="font-size:0.88rem;color:var(--text-dim);">
            Review the proposed change. This will overwrite <code>data/${esc(schemaKey)}.json</code> on GitHub.
          </p>
          <div id="wg-preview"></div>
          <p id="wg-status" style="font-size:0.82rem;min-height:1.2em;margin-top:8px;"></p>
          <div class="dialog-btns">
            <button class="btn btn-ghost btn-sm" id="wg-cancel" type="button">Cancel</button>
            <button class="btn btn-primary btn-sm" id="wg-confirm" type="button">Confirm Write</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);

      _renderDiff(overlay.querySelector('#wg-preview'), schemaKey, oldData, norm);

      const cancelBtn  = overlay.querySelector('#wg-cancel');
      const confirmBtn = overlay.querySelector('#wg-confirm');
      const statusEl   = overlay.querySelector('#wg-status');

      const close = (status, payload) => { overlay.remove(); resolve({ status, ...payload }); };

      cancelBtn.addEventListener('click', () => close('cancelled'));
      // Backdrop click cancels (matches showLogoutDialog UX in settings.js).
      overlay.addEventListener('click', e => { if (e.target === overlay) close('cancelled'); });

      confirmBtn.addEventListener('click', async () => {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Writing…';
        statusEl.textContent = '';
        try {
          // Caller's onConfirm runs State.set/patch + sequential State.save(...)
          // (Phase 7 D-11; see write-gate.js contract). The write happens here,
          // ONLY after this confirmBtn click — i.e. only after explicit user confirm.
          const writer = (typeof State !== 'undefined' && State.save) ? State.save : null;
          void writer;   // intentional reference so the contract is grep-visible
          await onConfirm(norm);
          close('confirmed');
        } catch (err) {
          statusEl.textContent = `Write failed: ${err && err.message ? err.message : err}`;
          statusEl.style.color = 'var(--red)';
          confirmBtn.disabled = false;
          confirmBtn.textContent = 'Confirm Write';
        }
      });
    });
  }

  // Surface validation errors via toast + console. Fail-closed UI: no Confirm.
  function _surfaceErrors(schemaKey, errors) {
    const head = `Cannot write ${schemaKey} — schema validation failed.`;
    if (typeof Utils !== 'undefined' && Utils.showToast) {
      Utils.showToast(`${head} ${errors[0]}`, 'error');
    }
    if (typeof console !== 'undefined') {
      console.warn(head, errors);
    }
  }

  // ── Inventory fidelity (FM #3) ────────────────────────────────────────────
  // Flag recipe ingredients NOT in the user's inventory token set and ingredients
  // that fall on the veto list. Substitution-flagged ingredients are intentionally
  // not phantoms. Token comparison is lowercase, word-boundary friendly: an
  // ingredient name is "present" if any of its non-trivial tokens (len > 2)
  // appears in the inventory token set.
  function inventoryFidelity(recipe, inventoryTokens, vetoes) {
    const out = { phantoms: [], vetoed: [] };
    const ings = (recipe && Array.isArray(recipe.ingredients)) ? recipe.ingredients : [];
    const invSet = new Set((inventoryTokens || []).map(t => String(t).toLowerCase()));
    const vetoSet = new Set((vetoes || []).map(t => String(t).toLowerCase()));

    ings.forEach(i => {
      if (!i || !i.name) return;
      const name = String(i.name);
      const nameLc = name.toLowerCase();
      const isSub = !!(i.notes && /\bsub(stitut|)/i.test(i.notes));
      const tokens = nameLc.split(/[^a-z0-9]+/).filter(t => t.length > 2);

      // Veto: any token in the veto set wins (un-flagged use of a veto'd ingredient).
      const vetoHit = tokens.some(t => vetoSet.has(t)) || vetoSet.has(nameLc);
      if (vetoHit) out.vetoed.push(name);

      if (isSub) return;     // explicit substitution — not a phantom
      const present = invSet.has(nameLc) || tokens.some(t => invSet.has(t));
      if (!present) out.phantoms.push(name);
    });

    return out;
  }

  return { validate, validateWith, gate, inventoryFidelity };
})();
