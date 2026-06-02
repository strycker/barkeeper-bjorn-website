// Recipe Browser view — card grid of originals + detail pane.
//
// Chip Unification Commit 3 (mini-phase): all reads/writes go through the
// canonical recipes.pool (v2). Filter views (Originals / Favorites / Wishlist
// / Made / Drafts) are derived live via RecipeChip.filterPool. Every chip is
// rendered by RecipeChip.render and wired by RecipeChip.bindActions, so
// click-to-open, AI-tweak, and the action buttons share one code path.

const RecipesView = (() => {

  let _searchQuery = '';

  // ─── Near-duplicate detection (AI-03 fail-closed extension) ──────────
  // Compare a candidate draft against the existing pool by normalized name
  // + ingredient-name set. If the AI returns a near-clone of an existing
  // recipe (real-world symptom: tweak prompts that don't move the needle
  // and produce essentially the same recipe back), block the save with a
  // clear error so the user doesn't accumulate duplicate draft chips.
  // Skips the entry with `excludeId` (callers pass the source draft's id
  // for the tweak/fork path).
  function _normName(s) {
    return typeof s === 'string'
      ? s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '')
      : '';
  }
  function _ingredientNameKey(recipe) {
    const list = Array.isArray(recipe && recipe.ingredients) ? recipe.ingredients : [];
    return list.map(i => _normName(i && i.name)).filter(Boolean).sort().join('|');
  }
  function _resolveSeedForCompare(entry) {
    if (!entry || !entry.seed_id || typeof CLASSICS_DB === 'undefined') return entry;
    const seed = CLASSICS_DB.find(c => c && c.id === entry.seed_id);
    return seed ? { ...seed, ...entry } : entry;
  }
  function _isNearDuplicateOfPool(candidate, pool, excludeId) {
    if (!candidate || !candidate.name || !Array.isArray(pool)) return null;
    const candName = _normName(candidate.name);
    const candIng  = _ingredientNameKey(candidate);
    if (!candName || !candIng) return null;
    for (const entry of pool) {
      if (!entry || (excludeId && entry.id === excludeId)) continue;
      const resolved = _resolveSeedForCompare(entry);
      if (_normName(resolved.name) === candName && _ingredientNameKey(resolved) === candIng) {
        return resolved;
      }
    }
    return null;
  }

  function _filterRecipes(list, q) {
    if (!q) return list;
    const lq = q.toLowerCase();
    return list.filter(r => {
      if ((r.name || '').toLowerCase().includes(lq)) return true;
      if ((r.base || '').toLowerCase().includes(lq)) return true;
      if ((r.ingredients || []).some(i => (i.name || '').toLowerCase().includes(lq))) return true;
      return false;
    });
  }

  // ── Pool helpers (Commit 3) ──────────────────────────────────────────────
  // Single source of truth: data/recipes.json's `pool` array. The State key
  // 'drafts' is now empty (folded into the pool on first load by state.js)
  // but we keep reading it for safety in case a legacy file is reintroduced.
  function _pool() {
    const r = State.get('recipes');
    return (r && Array.isArray(r.pool)) ? r.pool : [];
  }

  // Build a lookup function for RecipeChip.bindActions. The chip's data-id
  // is matched against pool[i].id (or seed_id / draft_id as fallback so
  // seeded chips still resolve under their seed key).
  function _lookupFromPool() {
    const pool = _pool();
    return (id) => pool.find(r =>
      r && (r.id === id || r.seed_id === id || r.draft_id === id)
    );
  }

  function render(container, params = {}) {
    _searchQuery = '';
    const pool = _pool();
    const originals = RecipeChip.filterPool(pool, 'originals');
    const favorites = RecipeChip.filterPool(pool, 'favorites');
    const wishlist  = RecipeChip.filterPool(pool, 'wishlist');
    const madeLog   = RecipeChip.filterPool(pool, 'made');
    const draftList = RecipeChip.filterPool(pool, 'drafts');
    const initialTab = params.tab || 'originals';

    container.innerHTML = `
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
        <div>
          <h1>Recipe Book</h1>
          <p>${originals.length} original${originals.length !== 1 ? 's' : ''} · ${favorites.length} favorite${favorites.length !== 1 ? 's' : ''} · ${madeLog.length} made${draftList.length ? ` · ${draftList.length} draft${draftList.length !== 1 ? 's' : ''}` : ''}</p>
        </div>
        <button class="btn btn-ghost btn-sm" id="rb-generate-ai" style="align-self:center;">✨ Generate with AI</button>
      </div>
      <div class="recipe-search-wrap">
        <input type="search" class="recipe-search-input" id="recipe-search" placeholder="Search by name, spirit, or ingredient…">
      </div>
      <div class="tabs">
        <div class="tab${initialTab === 'originals' ? ' active' : ''}" data-tab="originals">Originals (${originals.length})</div>
        <div class="tab${initialTab === 'favorites' ? ' active' : ''}" data-tab="favorites">Favorites (${favorites.length})</div>
        <div class="tab${initialTab === 'wishlist' ? ' active' : ''}" data-tab="wishlist">Wishlist (${wishlist.length})</div>
        <div class="tab${initialTab === 'made' ? ' active' : ''}" data-tab="made">Made (${madeLog.length})</div>
        <div class="tab${initialTab === 'drafts' ? ' active' : ''}" data-tab="drafts">Drafts (${draftList.length})</div>
      </div>
      <div id="recipe-tab-content"></div>`;

    const tabContent = container.querySelector('#recipe-tab-content');
    const searchInput = container.querySelector('#recipe-search');

    searchInput.addEventListener('input', () => {
      _searchQuery = searchInput.value;
      const activeTab = container.querySelector('.tab.active')?.dataset.tab || 'originals';
      renderTab(activeTab, tabContent, container);
    });

    container.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        _searchQuery = '';
        searchInput.value = '';
        renderTab(tab.dataset.tab, tabContent, container);
      });
    });

    // Check if a specific cocktail ID was requested
    if (params.id) {
      const match = originals.find(r => r.id === params.id);
      if (match) {
        renderDetail(match, container);
        return;
      }
    }

    renderTab(initialTab, tabContent, container);

    container.querySelector('#rb-generate-ai').addEventListener('click', () => {
      showAIPromptModal(container);
    });
  }

  function buildPromptContext() {
    const inventory = State.get('inventory') || {};
    const profile   = State.get('profile')   || {};
    const barkeeper = State.get('barkeeper') || {};

    const spirits = Object.entries(inventory.base_spirits || {})
      .flatMap(([cat, items]) => items.map(i => (typeof i === 'string' ? i : i.name) + ` (${cat})`));
    const pantry  = Object.values(inventory.pantry || {}).flat()
      .map(i => typeof i === 'string' ? i : i.name);
    const axes    = profile.flavor_profile?.axes || {};

    const inventoryText = [
      spirits.length ? `Spirits: ${spirits.join(', ')}` : '',
      pantry.length  ? `Pantry: ${pantry.join(', ')}` : '',
    ].filter(Boolean).join('\n') || 'Not set yet.';

    const profileText = Object.entries(axes)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ') || 'Not set yet.';

    const bkName   = barkeeper.identity?.name || 'Barkeeper Bjorn';
    const bkPreset = barkeeper.active_preset  || 'Professional Mixologist';

    return { inventoryText, profileText, bkName, bkPreset };
  }

  // ── AI-03: design prompt modal (live generation -> auto-saved draft) ────
  // Replaces the prior copy-the-prompt stub. Flow:
  //   1. user enters a design prompt
  //   2. ClaudeAPI.requestJSON(schemaKey:'drafts', ...) -> normalized draft
  //   3. WriteGate.gate auto-saves the draft (D-09)
  //   4. refine card stays open for same-draft tweaks (D-10) and new generation
  // All writes are fail-closed (no write on validation throw) and gated.
  function showAIPromptModal(container) {
    const { inventoryText, profileText, bkName, bkPreset } = buildPromptContext();
    const hasApiKey = !!(typeof ClaudeAPI !== 'undefined' && ClaudeAPI.getKey && ClaudeAPI.getKey());

    const overlay = document.createElement('div');
    overlay.className = 'confirm-dialog-overlay';
    overlay.innerHTML = `
      <div class="confirm-dialog ai-design-dialog" style="max-width:640px;width:92vw;">
        <h3 style="margin-bottom:8px;">Generate with AI</h3>
        ${hasApiKey
          ? `<p style="color:var(--text-dim);font-size:0.85rem;margin-bottom:12px;">Describe a cocktail and ${Utils.escapeHtml(bkName)} will design it. The draft auto-saves so you can refine it without losing work.</p>`
          : `<p style="color:var(--text-dim);font-size:0.85rem;margin-bottom:12px;">Add your Anthropic API key in Settings to generate drafts here. (Without a key, copy the prompt below into Claude/ChatGPT.)</p>`}
        <textarea id="ai-design-prompt" rows="3"
          placeholder="e.g. a smoky mezcal sour with honey and lemon, summery"
          style="width:100%;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px;font-size:0.88rem;font-family:inherit;resize:vertical;"></textarea>
        <p id="ai-design-status" style="font-size:0.82rem;min-height:1.2em;margin-top:6px;color:var(--text-muted);"></p>
        <div id="ai-design-preview"></div>
        <div class="dialog-btns" style="margin-top:12px;">
          <button class="btn btn-ghost btn-sm" id="ai-design-close">Close</button>
          <button class="btn btn-primary btn-sm" id="ai-design-generate" ${hasApiKey ? '' : 'disabled'}>${hasApiKey ? 'Generate' : 'No API key'}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const closeBtn   = overlay.querySelector('#ai-design-close');
    const genBtn     = overlay.querySelector('#ai-design-generate');
    const promptEl   = overlay.querySelector('#ai-design-prompt');
    const statusEl   = overlay.querySelector('#ai-design-status');
    const previewEl  = overlay.querySelector('#ai-design-preview');

    closeBtn.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    if (!hasApiKey) return;

    // State for the open draft (D-10): same draft_id is updated on tweaks;
    // 'generate new' creates a fresh draft_id; 'save copy' forks before refine.
    let currentDraft = null;

    genBtn.addEventListener('click', () => {
      const userPrompt = promptEl.value.trim();
      if (!userPrompt) {
        statusEl.textContent = 'Enter a description first.';
        statusEl.style.color = 'var(--red)';
        return;
      }
      runAIDesign({ userPrompt, mode: 'new', genBtn, statusEl, previewEl, bkName, bkPreset, inventoryText, profileText, setCurrent: d => { currentDraft = d; renderRefineCard(previewEl, currentDraft, { bkName, bkPreset, inventoryText, profileText, setCurrent: d2 => { currentDraft = d2; }, container }); }, container });
    });
  }

  // Build the system prompt for AI-03 design / refine requests.
  function _aiDesignSystem(bkName, bkPreset, inventoryText, profileText) {
    return [
      `You are ${bkName}, a ${bkPreset} bartender. Design a SINGLE original cocktail for the home bar described below.`,
      '',
      '## Bar Inventory',
      inventoryText || 'Not set yet.',
      '',
      '## Flavor Profile',
      profileText || 'Not set yet.',
      '',
      'Respond with a SINGLE JSON object matching the draft schema:',
      '{',
      '  "drafts": [ {',
      '    "name": string,            // required',
      '    "tagline": string,',
      '    "base": string,',
      '    "ingredients": [ { "name": string, "amount": string, "notes": string } ],',
      '    "method": string,',
      '    "method_type": "shaken"|"stirred"|"built"|"blended"|"thrown"|"other",',
      '    "glassware": string,',
      '    "garnish": string,',
      '    "tasting_notes": string,',
      '    "why_it_works": string',
      '  } ]',
      '}',
      'Wrap the single recipe in the drafts array. No prose, no markdown, no code fences.',
    ].join('\n');
  }

  // Drive a single design/refine request through requestJSON (fail-closed).
  // mode: 'new' (start from prompt) | 'tweak' (same draft_id) | 'fork' (new id seeded from a draft)
  async function runAIDesign({ userPrompt, mode, baseDraft, genBtn, statusEl, previewEl, bkName, bkPreset, inventoryText, profileText, setCurrent, container }) {
    if (genBtn) {
      genBtn.disabled = true;
      genBtn.dataset.label = genBtn.textContent;
      genBtn.textContent = 'Generating…';
    }
    statusEl.textContent = '';
    statusEl.style.color = 'var(--text-muted)';

    try {
      // Compose user prompt: for tweak/fork, include the prior draft JSON inline so
      // the model can iterate on it. For new, just the user's description.
      let composed = userPrompt;
      if ((mode === 'tweak' || mode === 'fork') && baseDraft) {
        const slim = {
          name: baseDraft.name,
          tagline: baseDraft.tagline,
          base: baseDraft.base,
          ingredients: baseDraft.ingredients,
          method: baseDraft.method,
          method_type: baseDraft.method_type,
          glassware: baseDraft.glassware,
          garnish: baseDraft.garnish,
        };
        composed = `Refine this existing draft per the user's tweak. Current draft:\n${JSON.stringify(slim, null, 2)}\n\nUser tweak: ${userPrompt}`;
      }

      const system = _aiDesignSystem(bkName, bkPreset, inventoryText, profileText);
      const norm = await ClaudeAPI.requestJSON({
        system,
        userPrompt: composed,
        schemaKey: 'drafts',
        model: ClaudeAPI.getModel(),
        maxTokens: 1500,
      });

      // requestJSON returns a Normalized {drafts:[...]} shape — pluck the new entry.
      const drafts = (norm && Array.isArray(norm.drafts)) ? norm.drafts : [];
      const candidate = drafts[drafts.length - 1];
      if (!candidate || !candidate.name) {
        throw new Error('No draft returned.');
      }

      // Build draft entry (D-10): same draft_id on tweak, new id on new/fork.
      // Commit 3: draft now lives in the recipes POOL as a status:'draft'
      // entry (not in drafts.json). Schema validation runs against the
      // recipes schema via WriteGate (the new pool entry includes draft-only
      // fields the schema accepts).
      const now = new Date().toISOString();
      let draftEntry;
      if (mode === 'tweak' && baseDraft && baseDraft.draft_id) {
        draftEntry = {
          ...candidate,
          id: baseDraft.id || baseDraft.draft_id,
          status: 'draft',
          _source: 'ai-generated',
          draft_id: baseDraft.draft_id,
          parent_id: baseDraft.parent_id || baseDraft.id || baseDraft.draft_id,
          created_at: baseDraft.created_at || now,
          updated_at: now,
          source_prompt: baseDraft.source_prompt || userPrompt,
        };
      } else {
        const nid = 'draft' + Date.now();
        draftEntry = {
          ...candidate,
          id: nid,
          status: 'draft',
          _source: 'ai-generated',
          draft_id: nid,
          parent_id: (mode === 'fork' && baseDraft) ? (baseDraft.id || baseDraft.draft_id) : null,
          created_at: now,
          updated_at: now,
          source_prompt: userPrompt,
        };
      }

      // Build the new recipes.json payload — mutate the POOL by id.
      const oldRecipes = State.get('recipes') || { pool: [] };
      const pool = Array.isArray(oldRecipes.pool) ? oldRecipes.pool.slice() : [];

      // AI-03 fail-closed: if the model returned essentially the same recipe
      // as something already in the pool (the symptom: a "tweak" that didn't
      // tweak; user accumulates identical draft chips), refuse the write and
      // tell the user what to try next.
      const excludeId = (mode === 'tweak' && baseDraft) ? (baseDraft.id || baseDraft.draft_id) : null;
      const dup = _isNearDuplicateOfPool(draftEntry, pool, excludeId);
      if (dup) {
        const where = dup.status === 'classic' ? 'a classic'
                    : dup.status === 'draft'   ? 'an existing draft'
                    : 'one of your originals';
        throw new Error(`The model returned ${where} ("${dup.name}") with the same ingredients — try a more specific tweak.`);
      }

      const idx = pool.findIndex(p => p && p.id === draftEntry.id);
      if (idx >= 0) pool[idx] = draftEntry; else pool.push(draftEntry);
      const newRecipes = {
        ...oldRecipes,
        _schema_version: 2,
        pool,
        last_updated: new Date().toISOString().slice(0, 10),
      };

      // FM #3: phantom-ingredient flag before gate.
      const inv = State.get('inventory') || {};
      const tokens = _inventoryTokens(inv);
      const vetoArr = (inv.vetoes && inv.vetoes.disliked_ingredients) || [];
      const fid = (typeof WriteGate !== 'undefined' && WriteGate.inventoryFidelity)
        ? WriteGate.inventoryFidelity(draftEntry, tokens, vetoArr)
        : { phantoms: [], vetoed: [] };

      // Auto-save via WriteGate (D-09 - never silently corrupt). Schema is
      // 'recipes' (the new pool shape) — drafts.json is no longer the system
      // of record.
      const gateMsg = mode === 'tweak'
        ? `Refine draft: ${draftEntry.name}`
        : `Save AI draft: ${draftEntry.name}`;
      const result = await WriteGate.gate({
        schemaKey: 'recipes',
        oldData: oldRecipes,
        newPayload: newRecipes,
        message: gateMsg,
        onConfirm: async () => {
          State.set('recipes', newRecipes);
          return State.save('recipes');
        },
      });

      if (result && result.status === 'confirmed') {
        setCurrent(draftEntry);
        statusEl.textContent = `Saved as draft "${draftEntry.name}".`;
        statusEl.style.color = 'var(--green)';
        if (fid.phantoms && fid.phantoms.length) {
          Utils.showToast(
            `Phantom ingredient${fid.phantoms.length > 1 ? 's' : ''}: ${fid.phantoms.join(', ')} (not in your inventory).`,
            'info',
            5000,
          );
        }
        if (fid.vetoed && fid.vetoed.length) {
          Utils.showToast(
            `Veto'd: ${fid.vetoed.join(', ')} — flagged before promote.`,
            'info',
            5000,
          );
        }
        return draftEntry;
      } else if (result && result.status === 'invalid') {
        // WriteGate already toasted the validation error.
        statusEl.textContent = 'Draft failed validation — not saved.';
        statusEl.style.color = 'var(--red)';
      } else {
        statusEl.textContent = 'Draft cancelled.';
        statusEl.style.color = 'var(--text-muted)';
      }
      return null;
    } catch (err) {
      const msg = (err && err.message) || String(err);
      statusEl.textContent = 'Generation failed: ' + msg;
      statusEl.style.color = 'var(--red)';
      Utils.showToast('Generation failed: ' + msg, 'error', 5000);
      return null;
    } finally {
      if (genBtn) {
        genBtn.disabled = false;
        genBtn.textContent = genBtn.dataset.label || 'Generate';
      }
    }
  }

  // Lowercase tokens from inventory bottle names — fed to inventoryFidelity.
  function _inventoryTokens(inv) {
    const tokens = new Set();
    const addStr = s => {
      if (!s) return;
      const lc = String(s).toLowerCase();
      tokens.add(lc);
      lc.split(/[^a-z0-9]+/).filter(t => t.length > 2).forEach(t => tokens.add(t));
    };
    Object.values(inv.base_spirits || {}).forEach(arr => (arr || []).forEach(i => addStr(typeof i === 'string' ? i : (i.style || i.type || i.brand || i.name))));
    Object.values(inv.liqueurs_and_cordials || {}).forEach(arr => (arr || []).forEach(i => addStr(typeof i === 'string' ? i : (i.style || i.type || i.brand || i.name))));
    Object.values(inv.bitters || {}).forEach(arr => (arr || []).forEach(i => addStr(typeof i === 'string' ? i : (i.style || i.type || i.brand || i.name))));
    ['fortified_wines_and_aperitif_wines', 'syrups', 'mixers', 'refrigerator_perishables', 'pantry_spice_rack', 'fresh_produce', 'non_alcoholic_spirits'].forEach(k => {
      (inv[k] || []).forEach(i => addStr(typeof i === 'string' ? i : (i.style || i.type || i.brand || i.name)));
    });
    return [...tokens];
  }

  // Render the open refine card for the most recent draft (D-10).
  function renderRefineCard(previewEl, draft, ctx) {
    if (!draft) { previewEl.innerHTML = ''; return; }
    const { bkName, bkPreset, inventoryText, profileText, setCurrent, container } = ctx;
    const ingList = (draft.ingredients || [])
      .map(i => `<li>${Utils.escapeHtml(i.amount || '')} ${Utils.escapeHtml(i.name || '')}${i.notes ? ` <span style="color:var(--text-muted);">(${Utils.escapeHtml(i.notes)})</span>` : ''}</li>`)
      .join('');

    previewEl.innerHTML = `
      <div class="ai-refine-card" style="margin-top:14px;padding:12px;background:var(--bg3);border:1px solid var(--amber-dim);border-radius:var(--radius-sm);">
        <div style="font-size:0.95rem;font-weight:600;color:var(--amber);">${Utils.escapeHtml(draft.name)}</div>
        ${draft.tagline ? `<div style="font-size:0.82rem;color:var(--text-dim);font-style:italic;margin-top:2px;">${Utils.escapeHtml(draft.tagline)}</div>` : ''}
        ${ingList ? `<ul style="margin:8px 0 6px;padding-left:18px;font-size:0.84rem;color:var(--text-dim);">${ingList}</ul>` : ''}
        ${draft.method ? `<div style="font-size:0.82rem;color:var(--text-dim);"><strong>Method:</strong> ${Utils.escapeHtml(draft.method)}</div>` : ''}
        ${draft.glassware ? `<div style="font-size:0.82rem;color:var(--text-dim);"><strong>Glass:</strong> ${Utils.escapeHtml(draft.glassware)}</div>` : ''}
        ${draft.garnish ? `<div style="font-size:0.82rem;color:var(--text-dim);"><strong>Garnish:</strong> ${Utils.escapeHtml(draft.garnish)}</div>` : ''}
        ${draft.why_it_works ? `<div style="font-size:0.82rem;color:var(--text-dim);margin-top:6px;"><strong>Why it works:</strong> ${Utils.escapeHtml(draft.why_it_works)}</div>` : ''}

        <div style="margin-top:10px;">
          <label style="font-size:0.82rem;color:var(--text-dim);">Refine this draft</label>
          <input type="text" class="ai-refine-input" placeholder="e.g. make it less sweet"
            style="width:100%;background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:6px 8px;font-size:0.85rem;margin-top:4px;">
        </div>
        <p class="ai-refine-status" style="font-size:0.82rem;min-height:1.2em;margin-top:6px;color:var(--text-muted);"></p>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">
          <button class="btn btn-primary btn-sm ai-refine-tweak" title="Update the SAME draft with this tweak">Apply tweak (same draft)</button>
          <button class="btn btn-secondary btn-sm ai-refine-new" title="Generate a brand-new draft from this idea">Generate new</button>
          <button class="btn btn-ghost btn-sm ai-refine-fork" title="Save a copy of this draft before refining">Save copy then refine</button>
        </div>
      </div>`;

    const tweakInput = previewEl.querySelector('.ai-refine-input');
    const refineStatus = previewEl.querySelector('.ai-refine-status');

    previewEl.querySelector('.ai-refine-tweak').addEventListener('click', async () => {
      const tweak = tweakInput.value.trim();
      if (!tweak) { refineStatus.textContent = 'Enter a tweak first.'; refineStatus.style.color = 'var(--red)'; return; }
      const btn = previewEl.querySelector('.ai-refine-tweak');
      const updated = await runAIDesign({
        userPrompt: tweak, mode: 'tweak', baseDraft: draft,
        genBtn: btn, statusEl: refineStatus, previewEl,
        bkName, bkPreset, inventoryText, profileText,
        setCurrent: d => { setCurrent(d); renderRefineCard(previewEl, d, ctx); },
        container,
      });
      if (!updated) return;
    });

    previewEl.querySelector('.ai-refine-new').addEventListener('click', async () => {
      const tweak = tweakInput.value.trim() || ('Variation on: ' + (draft.source_prompt || draft.name));
      const btn = previewEl.querySelector('.ai-refine-new');
      await runAIDesign({
        userPrompt: tweak, mode: 'new',
        genBtn: btn, statusEl: refineStatus, previewEl,
        bkName, bkPreset, inventoryText, profileText,
        setCurrent: d => { setCurrent(d); renderRefineCard(previewEl, d, ctx); },
        container,
      });
    });

    previewEl.querySelector('.ai-refine-fork').addEventListener('click', async () => {
      // Fork-before-refine: clone the draft as a new entry, then immediately
      // open the refine card on the new copy so the original is preserved.
      const tweak = tweakInput.value.trim() || 'minor variation';
      const btn = previewEl.querySelector('.ai-refine-fork');
      await runAIDesign({
        userPrompt: tweak, mode: 'fork', baseDraft: draft,
        genBtn: btn, statusEl: refineStatus, previewEl,
        bkName, bkPreset, inventoryText, profileText,
        setCurrent: d => { setCurrent(d); renderRefineCard(previewEl, d, ctx); },
        container,
      });
    });
  }

  function renderTab(tabName, container, mainContainer) {
    container.innerHTML = '';
    const pool = _pool();
    if (tabName === 'originals') {
      renderOriginalsGrid(RecipeChip.filterPool(pool, 'originals'), container, mainContainer);
    } else if (tabName === 'favorites') {
      renderRecipeChips(RecipeChip.filterPool(pool, 'favorites'), container, 'favorites', mainContainer);
    } else if (tabName === 'wishlist') {
      renderRecipeChips(RecipeChip.filterPool(pool, 'wishlist'), container, 'wishlist', mainContainer);
    } else if (tabName === 'made') {
      renderMadeList(RecipeChip.filterPool(pool, 'made'), container, mainContainer);
    } else if (tabName === 'drafts') {
      renderDraftChips(RecipeChip.filterPool(pool, 'drafts'), container, mainContainer);
    }
  }

  // ── Drafts tab (D-11): list AI-generated drafts + Promote-to-Original ────
  // Commit 3: all draft chips render through RecipeChip + bindActions and
  // mutate the recipes pool by id. The previous data/drafts.json route is
  // gone (drafts now live in the pool with status:'draft').
  function renderDraftChips(list, container, mainContainer) {
    const filtered = _filterRecipes(list, _searchQuery);
    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">✨</div>
          <p>${_searchQuery ? 'No matches found.' : 'No AI drafts yet.'}</p>
          <p style="font-size:0.85rem;color:var(--text-muted);">Click "✨ Generate with AI" above to design one.</p>
        </div>`;
      return;
    }

    container.innerHTML = filtered.map(draft => {
      const chipHtml = RecipeChip.render(draft, {
        context: 'recipes-tab-drafts',
        actions: { edit: true, promote: true, discard: true, askBjorn: true },
      });
      const sourceLine = draft.source_prompt
        ? `<div class="recipe-chip-source" style="font-size:0.78rem;color:var(--text-muted);margin:-6px 0 10px 4px;"><strong>From:</strong> ${Utils.escapeHtml(draft.source_prompt)}</div>`
        : '';
      return chipHtml + sourceLine;
    }).join('');

    RecipeChip.bindActions(container, {
      body:    (draft) => renderForm(draft, mainContainer),
      edit:    (draft) => renderForm(draft, mainContainer),
      promote: (draft) => promoteDraftToOriginal(draft, mainContainer),
      askBjorn: (draft) => {
        if (typeof ChatView === 'undefined' || !ChatView.openDrawer) {
          Utils.showToast('Chat module not loaded.', 'error');
          return;
        }
        ChatView.openDrawer({ seed: `I drafted "${draft.name}". What would you tweak?` });
      },
      discard: (draft) => {
        if (!confirm(`Discard draft "${draft.name}"?`)) return;
        State.patch('recipes', r => {
          r.pool = (r.pool || []).filter(p => p && p.id !== draft.id);
          r.last_updated = new Date().toISOString().slice(0, 10);
        });
        State.save('recipes').then(() => {
          Utils.showToast('Draft discarded.');
          render(mainContainer, { tab: 'drafts' });
        }).catch(err => Utils.showToast('Save failed: ' + err.message, 'error'));
      },
      tweak: (draft, prompt) => handleChipTweak(draft, prompt, mainContainer),
    }, { recipeById: _lookupFromPool() });
  }

  // Tweak-from-chip (Commit 3): every chip's "Tweak with AI" panel routes
  // here. Forks the source chip into a NEW draft with parent_id set, then
  // navigates to the Drafts tab so the user can see the fork.
  async function handleChipTweak(source, userPrompt, mainContainer) {
    if (!userPrompt) {
      Utils.showToast('Enter a tweak first.', 'error');
      return;
    }
    if (typeof ClaudeAPI === 'undefined' || !ClaudeAPI.getKey || !ClaudeAPI.getKey()) {
      Utils.showToast('Add your Anthropic API key in Settings to tweak with AI.', 'error');
      return;
    }
    try {
      const ctx = buildPromptContext();
      const system = _aiDesignSystem(ctx.bkName, ctx.bkPreset, ctx.inventoryText, ctx.profileText);
      // For seeded chips, resolveCore pulls live name/ingredients from CLASSICS_DB.
      const core = (typeof RecipeChip !== 'undefined' && RecipeChip.resolveCore)
        ? RecipeChip.resolveCore(source) : source;
      const slim = {
        name: core.name, tagline: core.tagline, base: core.base,
        ingredients: core.ingredients, method: core.method,
        method_type: core.method_type, glassware: core.glassware, garnish: core.garnish,
      };
      const composed = `Refine this existing recipe per the user's tweak. Current recipe:\n${JSON.stringify(slim, null, 2)}\n\nUser tweak: ${userPrompt}`;
      const norm = await ClaudeAPI.requestJSON({
        system, userPrompt: composed, schemaKey: 'drafts',
        model: ClaudeAPI.getModel(), maxTokens: 1500,
      });
      const drafts = (norm && Array.isArray(norm.drafts)) ? norm.drafts : [];
      const candidate = drafts[drafts.length - 1];
      if (!candidate || !candidate.name) throw new Error('No draft returned.');

      const now = new Date().toISOString();
      const nid = 'draft' + Date.now();
      const newDraft = {
        ...candidate,
        id: nid,
        status: 'draft',
        _source: 'ai-generated',
        draft_id: nid,
        parent_id: source.id || source.seed_id || source.draft_id || null,
        created_at: now,
        updated_at: now,
        source_prompt: `Tweak of "${core.name || 'recipe'}": ${userPrompt}`,
      };
      State.patch('recipes', r => {
        if (!Array.isArray(r.pool)) r.pool = [];
        r.pool.push(newDraft);
        r.last_updated = now.slice(0, 10);
        r._schema_version = 2;
      });
      await State.save('recipes');
      Utils.showToast('New draft created from your tweak.');
      render(mainContainer, { tab: 'drafts' });
    } catch (err) {
      Utils.showToast('Tweak failed: ' + (err.message || err), 'error');
    }
  }

  // ── Promote draft -> original (Commit 3 — pool-aware) ────────────────────
  // Mutate the existing pool entry by id: flip status 'draft' → 'original',
  // assign a fresh 'cocktail<ts>' id (preserving the legacy id convention),
  // clear draft-only metadata. Single State.save('recipes') — no parallel
  // saves, no 409 risk because there is no second file to write.
  async function promoteDraftToOriginal(draft, mainContainer) {
    const recipesNow = State.get('recipes') || { pool: [] };
    const pool = Array.isArray(recipesNow.pool) ? recipesNow.pool.slice() : [];
    const idx = pool.findIndex(p => p && p.id === draft.id);
    if (idx < 0) {
      Utils.showToast('Draft not found in pool — refresh and try again.', 'error');
      return;
    }

    const newId = 'cocktail' + Date.now();
    const promoted = {
      ...pool[idx],
      id: newId,
      status: 'original',
      _source: 'user',
      creator: pool[idx].creator || ((State.get('barkeeper') || {}).identity?.name) || 'Barkeeper Bjorn',
      date_created: pool[idx].date_created || new Date().toISOString().slice(0, 10),
    };
    delete promoted.draft_id;
    delete promoted.source_prompt;
    delete promoted.parent_id;
    delete promoted.created_at;
    delete promoted.updated_at;

    pool[idx] = promoted;

    // Duplicate flag — match against OTHER originals already in the pool.
    const dup = pool.find((o, i) => i !== idx && o.status === 'original' && Utils.sameRecipe(o, promoted));
    const dupNote = dup ? `\nPossible duplicate of existing original "${dup.name}".` : '';

    const newRecipes = {
      ...recipesNow,
      _schema_version: 2,
      pool,
      last_updated: new Date().toISOString().slice(0, 10),
    };

    const result = await WriteGate.gate({
      schemaKey: 'recipes',
      oldData: recipesNow,
      newPayload: newRecipes,
      message: `Promote to Original: ${promoted.name}${dupNote}`,
      onConfirm: async () => {
        State.set('recipes', newRecipes);
        return State.save('recipes');
      },
    });

    if (result && result.status === 'confirmed') {
      Utils.showToast(`Promoted "${promoted.name}" to Originals.`);
      render(mainContainer, { tab: 'originals' });
    }
  }

  function renderOriginalsGrid(originals, container, mainContainer) {
    const addBtn = document.createElement('div');
    addBtn.style.cssText = 'display:flex;justify-content:flex-end;margin-bottom:12px;';
    addBtn.innerHTML = `<button class="btn btn-secondary btn-sm">+ New Recipe</button>`;
    addBtn.querySelector('button').addEventListener('click', () => {
      renderForm(null, document.getElementById('main-content'));
    });
    container.appendChild(addBtn);

    const filtered = _filterRecipes(originals, _searchQuery);

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      if (originals.length === 0) {
        empty.innerHTML = `
          <div class="empty-icon">🍹</div>
          <p>No original cocktails yet.</p>
          <p style="font-size:0.85rem;color:var(--text-muted);">Click "+ New Recipe" or "✨ Generate with AI" to create your first one.</p>`;
      } else {
        empty.innerHTML = `
          <div class="empty-icon">🔍</div>
          <p>No matches found.</p>`;
      }
      container.appendChild(empty);
      return;
    }

    // Unified RecipeChip render (chip-unification Commit 3) — originals now
    // use the SAME chip markup as favorites / wishlist / drafts. Click body
    // opens the detail view; Edit button opens the form; Discard hard-deletes
    // from the pool. Tweak panel forks into a new draft.
    const chipsWrap = document.createElement('div');
    chipsWrap.className = 'recipe-chip-grid';
    chipsWrap.innerHTML = filtered.map(r => RecipeChip.render(r, {
      context: 'recipes-tab-originals',
      actions: { edit: true, discard: true, askBjorn: true },
    })).join('');
    container.appendChild(chipsWrap);

    RecipeChip.bindActions(chipsWrap, {
      body: (r) => renderDetail(r, mainContainer || document.getElementById('main-content')),
      edit: (r) => renderForm(r, mainContainer || document.getElementById('main-content')),
      askBjorn: (r) => {
        if (typeof ChatView === 'undefined' || !ChatView.openDrawer) {
          Utils.showToast('Chat module not loaded.', 'error');
          return;
        }
        const seed = `Tell me about my original "${r.name}". What would you tweak given my bar?`;
        ChatView.openDrawer({ seed });
      },
      discard: (r) => {
        if (!confirm(`Delete "${r.name}"? This cannot be undone.`)) return;
        State.patch('recipes', rec => {
          rec.pool = (rec.pool || []).filter(p => p && p.id !== r.id);
          rec.last_updated = new Date().toISOString().slice(0, 10);
        });
        State.save('recipes').then(() => {
          Utils.showToast('Recipe deleted.');
          render(mainContainer || document.getElementById('main-content'), { tab: 'originals' });
        }).catch(err => Utils.showToast('Save failed: ' + err.message, 'error'));
      },
      tweak: (r, prompt) => handleChipTweak(r, prompt, mainContainer || document.getElementById('main-content')),
    }, { recipeById: _lookupFromPool() });
  }

  // Commit 3: listKey is now the FILTER VIEW name ('favorites' | 'wishlist').
  // "Removing" from the view clears the overlay flag on the pool entry — the
  // recipe itself is never deleted by this control (a heart-toggle, not a
  // hard delete).
  function renderRecipeChips(list, container, listKey, mainContainer) {
    const emptyIcon = listKey === 'favorites' ? '⭐' : '📋';
    const emptyMsg  = listKey === 'favorites' ? 'No favorites yet.' : 'Wishlist is empty.';

    const filtered = _filterRecipes(list, _searchQuery);
    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${emptyIcon}</div>
          <p>${_searchQuery ? 'No matches found.' : emptyMsg}</p>
        </div>`;
      return;
    }

    const ctxName = 'recipes-tab-' + listKey;
    container.innerHTML = filtered.map(r => RecipeChip.render(r, {
      context: ctxName,
      actions: { edit: false, promote: false, discard: true, askBjorn: true },
    })).join('');

    const overlayKey = (listKey === 'favorites') ? 'is_favorite' : 'is_wishlist';
    const removedLabel = (listKey === 'favorites') ? 'Removed from Favorites' : 'Removed from Wishlist';

    RecipeChip.bindActions(container, {
      body: (r) => showRecipeDetail(r, listKey, mainContainer),
      askBjorn: (r) => {
        if (typeof ChatView === 'undefined' || !ChatView.openDrawer) {
          Utils.showToast('Chat module not loaded.', 'error');
          return;
        }
        const seed =
          `Tell me about the ${r.name}${r.base ? ` (${r.base})` : ''}. ` +
          `Would it suit my taste, and what variations would you suggest given my bar?`;
        ChatView.openDrawer({ seed });
      },
      discard: (r) => {
        State.patch('recipes', rec => {
          const entry = (rec.pool || []).find(p => p && p.id === r.id);
          if (entry) entry[overlayKey] = false;
          rec.last_updated = new Date().toISOString().slice(0, 10);
        });
        State.save('recipes').then(() => {
          Utils.showToast(removedLabel);
          render(mainContainer, { tab: listKey });
        });
      },
      tweak: (r, prompt) => handleChipTweak(r, prompt, mainContainer),
    }, { recipeById: _lookupFromPool() });
  }

  // Commit 3: made_log is now a per-pool-entry array (not a top-level
  // recipes.made_log). Renders the unified chip plus a times-made badge in
  // the meta line. The discard control clears the made_log array on that
  // pool entry (it does NOT delete the recipe itself).
  function renderMadeList(madeList, container, mainContainer) {
    const filtered = _filterRecipes(madeList, _searchQuery);
    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">✓</div>
          <p>${_searchQuery ? 'No matches found.' : 'Nothing marked as made yet.'}</p>
          <p style="font-size:0.85rem;color:var(--text-muted);">Use the ○ button on Recommender cards to track what you've made.</p>
        </div>`;
      return;
    }

    // Sort by most recent log entry (last item appended is most recent;
    // legacy entries may carry a `date` field).
    const sorted = filtered.slice().sort((a, b) => {
      const ad = (a.made_log && a.made_log.length) ? (a.made_log[a.made_log.length - 1].date || '') : '';
      const bd = (b.made_log && b.made_log.length) ? (b.made_log[b.made_log.length - 1].date || '') : '';
      return bd > ad ? 1 : -1;
    });

    container.innerHTML = sorted.map(r => RecipeChip.render(r, {
      context: 'recipes-tab-made',
      actions: { discard: true, askBjorn: true },
    })).join('');

    RecipeChip.bindActions(container, {
      body: (r) => showRecipeDetail(r, 'made', mainContainer),
      askBjorn: (r) => {
        if (typeof ChatView === 'undefined' || !ChatView.openDrawer) {
          Utils.showToast('Chat module not loaded.', 'error');
          return;
        }
        ChatView.openDrawer({ seed: `Tell me about ${r.name}. I've made it before — what variations should I try next?` });
      },
      discard: (r) => {
        State.patch('recipes', rec => {
          const entry = (rec.pool || []).find(p => p && p.id === r.id);
          if (entry) entry.made_log = [];
          rec.last_updated = new Date().toISOString().slice(0, 10);
        });
        State.save('recipes').then(() => {
          Utils.showToast('Removed from Made');
          render(mainContainer, { tab: 'made' });
        });
      },
      tweak: (r, prompt) => handleChipTweak(r, prompt, mainContainer),
    }, { recipeById: _lookupFromPool() });
  }

  // Commit 3: detail modal reads the pool entry by id. `editable` is only
  // true for user-owned originals (NOT seeded classics, NOT drafts). Seeded
  // chips show overlay editing (notes, made tally) but not core editing —
  // the form view handles core editing for originals/drafts (see renderForm).
  function showRecipeDetail(recipe, listKey, mainContainer) {
    const editable = recipe.status === 'original' && !recipe.seed_id;
    const pool = _pool();
    const poolEntry = pool.find(p => p && p.id === recipe.id) || recipe;
    // Use the resolved core (seed overlay) for seeded chips so the modal
    // shows the live seed name/ingredients rather than blanks.
    recipe = (typeof RecipeChip !== 'undefined' && RecipeChip.resolveCore)
      ? RecipeChip.resolveCore(poolEntry) : poolEntry;
    const madeLogArr = Array.isArray(poolEntry.made_log) ? poolEntry.made_log : [];
    const timesMade = madeLogArr.reduce((sum, m) => sum + (m.times_made || 1), 0);
    const lastMadeNotes = madeLogArr.length ? (madeLogArr[madeLogArr.length - 1].notes || '') : '';
    const currentNotes = poolEntry.user_notes || lastMadeNotes || '';

    const overlay = document.createElement('div');
    overlay.className = 'recipe-detail-modal-overlay';

    const ingRows = (recipe.ingredients || []).map(ing =>
      `<tr><td class="amount">${Utils.escapeHtml(ing.amount || '')}</td><td>${Utils.escapeHtml(ing.name || '')}</td></tr>`
    ).join('');

    // Shared tally + notes + footer-close blocks (rendered in BOTH branches).
    const tallyBlock = `
        <div class="section-label" style="margin-top:16px;">Times Made</div>
        <div class="rdm-tally">
          <span class="rdm-tally-count">${timesMade}</span>
          <button class="btn btn-secondary btn-sm rdm-made-btn">${timesMade > 0 ? '+ Made It Again' : 'Mark as Made'}</button>
          ${timesMade > 0 ? `<button class="btn btn-ghost btn-sm rdm-unmade-btn">Reset</button>` : ''}
        </div>

        <div class="section-label" style="margin-top:16px;">Notes</div>
        <textarea class="rdm-notes" rows="3" placeholder="Personal notes about this recipe…">${Utils.escapeHtml(currentNotes)}</textarea>`;

    if (editable) {
      const editIngRows = (recipe.ingredients?.length ? recipe.ingredients : [{ amount: '', name: '', notes: '' }])
        .map((ing, i) => ingredientRowHtml(ing, i)).join('');

      overlay.innerHTML = `
      <div class="recipe-detail-modal">
        <div class="recipe-detail-modal-header">
          <div style="flex:1;min-width:0;">
            <input class="rdm-edit-name" type="text" value="${Utils.escapeHtml(recipe.name || '')}" placeholder="Recipe name">
          </div>
          <button class="btn-icon rdm-close" aria-label="Close">✕</button>
        </div>

        <div class="section-label" style="margin-top:12px;">Ingredients</div>
        <div id="rdm-ingredients">${editIngRows}</div>
        <button type="button" class="btn btn-ghost btn-sm rdm-add-ing">+ Add Ingredient</button>

        <div class="rdm-edit-meta" style="margin-top:12px;">
          <div class="form-group">
            <label>Method</label>
            <input class="rdm-edit-method" type="text" value="${Utils.escapeHtml(recipe.method || '')}" placeholder="e.g. stirred">
          </div>
          <div class="form-group">
            <label>Glassware</label>
            <input class="rdm-edit-glassware" type="text" value="${Utils.escapeHtml(recipe.glassware || '')}" placeholder="e.g. coupe">
          </div>
          <div class="form-group">
            <label>Garnish</label>
            <input class="rdm-edit-garnish" type="text" value="${Utils.escapeHtml(recipe.garnish || '')}" placeholder="e.g. lemon twist">
          </div>
        </div>

        ${tallyBlock}

        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
          <button class="btn btn-primary btn-sm rdm-save-recipe">Save Recipe</button>
          <button class="btn btn-primary btn-sm rdm-save-notes">Save Notes</button>
          <button class="btn btn-ghost btn-sm rdm-close-btn">Close</button>
        </div>
      </div>`;
    } else {
      overlay.innerHTML = `
      <div class="recipe-detail-modal">
        <div class="recipe-detail-modal-header">
          <div>
            <div class="rec-card-name">${Utils.escapeHtml(recipe.name)}</div>
            <div class="rec-card-meta" style="margin-top:4px;">
              ${recipe.base ? `<span class="rec-base">${Utils.escapeHtml(recipe.base)}</span>` : ''}
              ${recipe.method ? `<span class="rec-sep">·</span><span class="rec-method">${Utils.escapeHtml(recipe.method)}</span>` : ''}
              ${recipe.glassware ? `<span class="rec-sep">·</span><span>${Utils.escapeHtml(recipe.glassware)}</span>` : ''}
            </div>
          </div>
          <button class="btn-icon rdm-close" aria-label="Close">✕</button>
        </div>

        ${recipe.occasion ? `<p class="rec-occasion" style="margin:8px 0;">${Utils.escapeHtml(recipe.occasion)}</p>` : ''}

        ${ingRows ? `
          <div class="section-label" style="margin-top:12px;">Ingredients</div>
          <table class="ingredients-table">
            <thead><tr><th>Amount</th><th>Ingredient</th></tr></thead>
            <tbody>${ingRows}</tbody>
          </table>` : ''}

        ${recipe.garnish ? `<div style="margin-top:8px;font-size:0.88rem;color:var(--text-dim);"><strong>Garnish:</strong> ${Utils.escapeHtml(recipe.garnish)}</div>` : ''}

        ${tallyBlock}

        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
          <button class="btn btn-primary btn-sm rdm-save-notes">Save Notes</button>
          <button class="btn btn-ghost btn-sm rdm-close-btn">Close</button>
        </div>
      </div>`;
    }

    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('.rdm-close').addEventListener('click', close);
    overlay.querySelector('.rdm-close-btn').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    if (editable) {
      // Initial rows removable, then wire add-ingredient (mirror renderForm:873-878).
      bindIngredientRemove(overlay);
      overlay.querySelector('.rdm-add-ing').addEventListener('click', () => {
        const ingList = overlay.querySelector('#rdm-ingredients');
        const idx = ingList.querySelectorAll('.rf-ing-row').length;
        ingList.insertAdjacentHTML('beforeend', ingredientRowHtml({ amount: '', name: '', notes: '' }, idx));
        bindIngredientRemove(overlay);
      });
    }

    // Tab to re-render after a write — derived from listKey ('favorites' |
    // 'wishlist' | 'made'). Used by every save path below.
    const activeTab = (listKey === 'made') ? 'made' : (listKey === 'favorites' ? 'favorites' : (listKey === 'wishlist' ? 'wishlist' : 'originals'));

    overlay.querySelector('.rdm-save-notes').addEventListener('click', () => {
      const notes = overlay.querySelector('.rdm-notes').value.trim();
      State.patch('recipes', r => {
        const entry = (r.pool || []).find(p => p && p.id === recipe.id);
        if (entry) entry.user_notes = notes;
        r.last_updated = new Date().toISOString().slice(0, 10);
      });
      State.save('recipes').then(() => Utils.showToast('Notes saved.'))
        .catch(err => Utils.showToast('Save failed: ' + err.message, 'error'));
    });

    if (editable) {
      overlay.querySelector('.rdm-save-recipe').addEventListener('click', () => {
        const origId = recipe.id;
        const edited = {
          name: overlay.querySelector('.rdm-edit-name').value.trim(),
          method: overlay.querySelector('.rdm-edit-method').value.trim(),
          glassware: overlay.querySelector('.rdm-edit-glassware').value.trim(),
          garnish: overlay.querySelector('.rdm-edit-garnish').value.trim(),
          ingredients: [...overlay.querySelectorAll('#rdm-ingredients .rf-ing-row')].map(row => {
            const ing = {
              amount: row.querySelector('.rf-ing-amount').value.trim(),
              name: row.querySelector('.rf-ing-name').value.trim(),
            };
            const notes = row.querySelector('.rf-ing-notes').value.trim();
            if (notes) ing.notes = notes;
            return ing;
          }).filter(i => i.name),
        };
        if (!edited.name) { Utils.showToast('Name is required.', 'error'); return; }
        if (!edited.ingredients.length) { Utils.showToast('At least one ingredient is required.', 'error'); return; }

        State.patch('recipes', r => {
          const entry = (r.pool || []).find(p => p && p.id === origId);
          if (entry && !entry.seed_id) Object.assign(entry, edited);
          r.last_updated = new Date().toISOString().slice(0, 10);
        });
        State.save('recipes').then(() => {
          Utils.showToast('Recipe updated.');
          close();
          render(mainContainer, { tab: activeTab });
        }).catch(err => Utils.showToast('Save failed: ' + err.message, 'error'));
      });
    }

    overlay.querySelector('.rdm-made-btn').addEventListener('click', () => {
      const today = new Date().toISOString().slice(0, 10);
      State.patch('recipes', r => {
        const entry = (r.pool || []).find(p => p && p.id === recipe.id);
        if (!entry) return;
        if (!Array.isArray(entry.made_log)) entry.made_log = [];
        entry.made_log.push({ date: today, times_made: 1, notes: '' });
        r.last_updated = today;
      });
      State.save('recipes').then(() => {
        Utils.showToast('Marked as made ✓');
        const updatedEntry = (State.get('recipes')?.pool || []).find(p => p && p.id === recipe.id);
        const newCount = updatedEntry ? (updatedEntry.made_log || []).reduce((s, m) => s + (m.times_made || 1), 0) : 1;
        const tallyCount = overlay.querySelector('.rdm-tally-count');
        if (tallyCount) tallyCount.textContent = newCount;
        const madeBtn = overlay.querySelector('.rdm-made-btn');
        if (madeBtn) madeBtn.textContent = '+ Made It Again';
        const tally = overlay.querySelector('.rdm-tally');
        if (tally && !tally.querySelector('.rdm-unmade-btn')) {
          const resetBtn = document.createElement('button');
          resetBtn.className = 'btn btn-ghost btn-sm rdm-unmade-btn';
          resetBtn.textContent = 'Reset';
          tally.appendChild(resetBtn);
          resetBtn.addEventListener('click', () => {
            State.patch('recipes', r => {
              const entry = (r.pool || []).find(p => p && p.id === recipe.id);
              if (entry) entry.made_log = [];
              r.last_updated = new Date().toISOString().slice(0, 10);
            });
            State.save('recipes').then(() => {
              Utils.showToast('Removed from Made');
              close();
              render(mainContainer, { tab: activeTab });
            }).catch(err => Utils.showToast('Save failed: ' + err.message, 'error'));
          });
        }
      }).catch(err => Utils.showToast('Save failed: ' + err.message, 'error'));
    });

    const unMadeBtn = overlay.querySelector('.rdm-unmade-btn');
    if (unMadeBtn) {
      unMadeBtn.addEventListener('click', () => {
        State.patch('recipes', r => {
          const entry = (r.pool || []).find(p => p && p.id === recipe.id);
          if (entry) entry.made_log = [];
          r.last_updated = new Date().toISOString().slice(0, 10);
        });
        State.save('recipes').then(() => {
          Utils.showToast('Removed from Made');
          close();
          render(mainContainer, { tab: activeTab });
        }).catch(err => Utils.showToast('Save failed: ' + err.message, 'error'));
      });
    }
  }

  function renderDetail(r, container) {
    container.innerHTML = '';

    const topBar = document.createElement('div');
    topBar.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;';
    topBar.innerHTML = `
      <button class="back-btn" style="margin-bottom:0;">← Back to Recipes</button>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-secondary btn-sm" data-action="edit">Edit</button>
        <button class="btn btn-danger btn-sm" data-action="delete">Delete</button>
      </div>`;
    topBar.querySelector('[data-action="edit"]').addEventListener('click', () => {
      renderForm(r, container);
    });
    topBar.querySelector('[data-action="delete"]').addEventListener('click', () => {
      if (!confirm(`Delete "${r.name}"? This cannot be undone.`)) return;
      State.patch('recipes', rec => {
        rec.pool = (rec.pool || []).filter(p => p && p.id !== r.id);
        rec.last_updated = new Date().toISOString().slice(0, 10);
      });
      State.save('recipes').then(() => {
        Utils.showToast('Recipe deleted.');
        render(container);
      }).catch(err => Utils.showToast('Save failed: ' + err.message, 'error'));
    });
    topBar.querySelector('.back-btn').addEventListener('click', () => render(container));
    container.appendChild(topBar);

    const wrap = document.createElement('div');
    wrap.className = 'recipe-detail';

    // Header
    wrap.innerHTML = `
      <div class="recipe-detail-header">
        <div class="recipe-id">${Utils.escapeHtml(r.id)}</div>
        <h2>${Utils.escapeHtml(r.name)}</h2>
        ${r.tagline ? `<div class="tagline">${Utils.escapeHtml(r.tagline)}</div>` : ''}
        <div class="creator" style="margin-top:8px;">
          ${Utils.escapeHtml(r.creator || '—')}
          ${r.date_created ? `<span style="margin-left:10px;color:var(--text-muted);">${Utils.formatDate(r.date_created)}</span>` : ''}
        </div>
      </div>

      <!-- Ingredients -->
      <div class="section-label">Ingredients</div>
      <table class="ingredients-table">
        <thead><tr><th>Amount</th><th>Ingredient</th><th>Notes</th></tr></thead>
        <tbody>${(r.ingredients || []).map(ing => `
          <tr>
            <td class="amount">${Utils.escapeHtml(ing.amount)}</td>
            <td>${Utils.escapeHtml(ing.name)}</td>
            <td style="color:var(--text-muted);font-size:0.85rem;">${Utils.escapeHtml(ing.notes || '')}</td>
          </tr>`).join('')}
        </tbody>
      </table>

      <!-- Meta grid -->
      <div class="recipe-meta-grid" style="margin-top:16px;">
        ${r.method ? `<div class="recipe-meta-item"><div class="meta-label">Method</div><div class="meta-value">${Utils.escapeHtml(r.method)}</div></div>` : ''}
        ${r.glassware ? `<div class="recipe-meta-item"><div class="meta-label">Glassware</div><div class="meta-value">${Utils.escapeHtml(r.glassware)}</div></div>` : ''}
        ${r.garnish ? `<div class="recipe-meta-item"><div class="meta-label">Garnish</div><div class="meta-value">${Utils.escapeHtml(r.garnish)}</div></div>` : ''}
        ${r.confirmed_built !== undefined ? `<div class="recipe-meta-item"><div class="meta-label">Status</div><div class="meta-value">${r.confirmed_built ? '<span class="badge badge-green">Built ✓</span>' : '<span class="badge badge-amber">Unbuilt</span>'}</div></div>` : ''}
      </div>

      ${r.profile ? `
        <div class="section-label">Profile</div>
        <p style="color:var(--text-dim);font-style:italic;">${Utils.escapeHtml(r.profile)}</p>` : ''}

      ${r.why_it_works ? `
        <div class="section-label">Why It Works</div>
        <p style="color:var(--text-dim);">${Utils.escapeHtml(r.why_it_works)}</p>` : ''}

      ${r.variations?.length ? `
        <div class="section-label">Variations</div>
        ${r.variations.map(v => `
          <div style="margin-bottom:10px;background:var(--bg3);padding:10px 14px;border-radius:var(--radius-sm);">
            <strong style="color:var(--text);">${Utils.escapeHtml(v.name)}</strong>
            ${v.description ? `<p style="margin-top:4px;font-size:0.88rem;color:var(--text-dim);">${Utils.escapeHtml(v.description)}</p>` : ''}
          </div>`).join('')}` : ''}

      ${r.ratings ? `
        <div class="section-label">Ratings</div>
        <div style="background:var(--bg3);padding:12px 16px;border-radius:var(--radius-sm);">
          ${r.ratings.bar_owner ? `<div>Owner rating: <strong style="color:var(--amber);">${r.ratings.bar_owner}/10</strong></div>` : ''}
          ${r.ratings.guests ? `<div style="margin-top:4px;font-size:0.88rem;color:var(--text-dim);">Guests: ${Utils.escapeHtml(r.ratings.guests)}</div>` : ''}
          ${r.ratings.notes ? `<div style="margin-top:6px;font-size:0.85rem;color:var(--text-dim);font-style:italic;">${Utils.escapeHtml(r.ratings.notes)}</div>` : ''}
        </div>` : ''}

      ${r.images?.length ? `
        <div class="section-label">Images</div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          ${r.images.map(img => {
            const { owner, repo, branch } = GitHubAPI.cfg();
            const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/images/${img.filename}`;
            return `<img src="${Utils.escapeHtml(rawUrl)}" alt="${Utils.escapeHtml(img.alt_text || r.name)}"
                        style="max-width:280px;border-radius:var(--radius);border:1px solid var(--border);"
                        onerror="this.style.display='none'">`;
          }).join('')}
        </div>` : ''}`;

    // Image upload (RECIPE-03)
    const imgSection = document.createElement('div');
    imgSection.innerHTML = `
      <div class="section-label" style="margin-top:20px;">Upload Image</div>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <button class="btn btn-secondary btn-sm" id="rd-img-btn">Choose File</button>
        <span id="rd-img-name" style="font-size:0.85rem;color:var(--text-dim);">No file chosen</span>
      </div>
      <button class="btn btn-ghost btn-sm" id="rd-img-upload" style="display:none;margin-top:10px;">Upload to GitHub</button>
      <p id="rd-img-status" style="font-size:0.82rem;min-height:1.2em;margin-top:6px;color:var(--text-muted);"></p>`;

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/png,image/jpeg,image/webp,image/gif';
    fileInput.style.display = 'none';
    imgSection.appendChild(fileInput);

    let selectedFile = null;
    imgSection.querySelector('#rd-img-btn').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      selectedFile = fileInput.files[0] || null;
      imgSection.querySelector('#rd-img-name').textContent = selectedFile ? selectedFile.name : 'No file chosen';
      imgSection.querySelector('#rd-img-upload').style.display = selectedFile ? '' : 'none';
    });

    imgSection.querySelector('#rd-img-upload').addEventListener('click', async () => {
      if (!selectedFile) return;
      const ext = selectedFile.name.split('.').pop().toLowerCase();
      const filename = `${r.id}_${Date.now()}.${ext}`;
      const statusEl = imgSection.querySelector('#rd-img-status');
      const uploadBtn = imgSection.querySelector('#rd-img-upload');
      uploadBtn.disabled = true;
      statusEl.textContent = 'Reading file…';
      statusEl.style.color = 'var(--text-muted)';

      try {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });

        statusEl.textContent = 'Uploading to GitHub…';
        const sha = await GitHubAPI.getFileSHA(`images/${filename}`);
        await GitHubAPI.writeFile(`images/${filename}`, base64, sha, `Upload image for ${r.name}`);

        // Patch recipe images array on the pool entry.
        State.patch('recipes', rec => {
          const entry = (rec.pool || []).find(p => p && p.id === r.id);
          if (entry) {
            if (!Array.isArray(entry.images)) entry.images = [];
            entry.images.push({ filename, alt_text: r.name });
          }
          rec.last_updated = new Date().toISOString().slice(0, 10);
        });
        await State.save('recipes');

        statusEl.textContent = `Uploaded: images/${filename}`;
        statusEl.style.color = 'var(--green)';
        Utils.showToast('Image uploaded successfully.');
        selectedFile = null;
        fileInput.value = '';
        imgSection.querySelector('#rd-img-name').textContent = 'No file chosen';
        uploadBtn.style.display = 'none';
        uploadBtn.disabled = false;
      } catch (err) {
        statusEl.textContent = `Upload failed: ${Utils.escapeHtml(err.message)}`;
        statusEl.style.color = 'var(--red)';
        Utils.showToast('Upload failed: ' + err.message, 'error');
        uploadBtn.disabled = false;
      }
    });

    wrap.appendChild(imgSection);
    container.appendChild(wrap);
  }

  // ── handleGenerate — live AI recipe generation (D-13) ─────────────────
  // Reads #rf-ai-prompt, calls ClaudeAPI.generateRecipe with current
  // buildPromptContext(), populates form fields inline, manages spinner +
  // form-field disable state. Errors surface as red toasts.
  // Tweak-from-edit-form: edit-form-side analog of the runAIDesign('fork')
  // path. Produces a NEW draft (fresh draft_id) so the original draft is
  // preserved as a comparison point. Then routes back to the Drafts tab.
  async function handleDraftTweak(wrap, baseDraft, container) {
    const promptEl = wrap.querySelector('#rf-tweak-prompt');
    const tweakBtn = wrap.querySelector('#rf-tweak');
    const statusEl = wrap.querySelector('#rf-tweak-status');
    const userPrompt = promptEl ? promptEl.value.trim() : '';
    if (!userPrompt) {
      Utils.showToast('Enter a tweak before requesting.', 'error');
      return;
    }
    if (typeof ClaudeAPI === 'undefined' || !ClaudeAPI.getKey || !ClaudeAPI.getKey()) {
      Utils.showToast('Add your Anthropic API key in Settings to tweak with AI.', 'error');
      return;
    }
    tweakBtn.disabled = true;
    tweakBtn.textContent = 'Tweaking…';
    if (statusEl) { statusEl.textContent = ''; statusEl.style.color = 'var(--text-muted)'; }
    try {
      const ctx = buildPromptContext();
      const system = _aiDesignSystem(ctx.bkName, ctx.bkPreset, ctx.inventoryText, ctx.profileText);
      const slim = {
        name: baseDraft.name,
        tagline: baseDraft.tagline,
        base: baseDraft.base,
        ingredients: baseDraft.ingredients,
        method: baseDraft.method,
        method_type: baseDraft.method_type,
        glassware: baseDraft.glassware,
        garnish: baseDraft.garnish,
      };
      const composed = `Refine this existing draft per the user's tweak. Current draft:\n${JSON.stringify(slim, null, 2)}\n\nUser tweak: ${userPrompt}`;
      const norm = await ClaudeAPI.requestJSON({
        system,
        userPrompt: composed,
        schemaKey: 'drafts',
        model: ClaudeAPI.getModel(),
        maxTokens: 1500,
      });
      const drafts = (norm && Array.isArray(norm.drafts)) ? norm.drafts : [];
      const candidate = drafts[drafts.length - 1];
      if (!candidate || !candidate.name) throw new Error('No draft returned.');
      const now = new Date().toISOString();
      const newDraft = {
        ...candidate,
        _source: 'ai-generated',
        draft_id: 'draft' + Date.now(),
        created_at: now,
        updated_at: now,
        source_prompt: `Tweak of "${baseDraft.name || 'draft'}": ${userPrompt}`,
      };
      // Commit 3: drafts now live in the recipes pool with status:'draft'.
      const nid = 'draft' + Date.now();
      const poolEntry = {
        ...newDraft,
        id: nid,
        status: 'draft',
        draft_id: nid,
        parent_id: baseDraft.id || baseDraft.draft_id || null,
      };
      // AI-03 fail-closed: if the model returned essentially the same recipe
      // as the source baseDraft or as another pool entry, refuse the write
      // and surface a clear error (caught by the catch block below).
      const dupCheck = (function(){
        const cur = State.get('recipes') || { pool: [] };
        const curPool = Array.isArray(cur.pool) ? cur.pool : [];
        return _isNearDuplicateOfPool(poolEntry, curPool, baseDraft.id || baseDraft.draft_id);
      })();
      if (dupCheck) {
        const where = dupCheck.status === 'classic' ? 'a classic'
                    : dupCheck.status === 'draft'   ? 'an existing draft'
                    : 'one of your originals';
        throw new Error(`The tweak produced ${where} ("${dupCheck.name}") with the same ingredients — try a more specific tweak (e.g. swap an ingredient or change a ratio).`);
      }
      State.patch('recipes', r => {
        if (!Array.isArray(r.pool)) r.pool = [];
        r.pool.push(poolEntry);
        r.last_updated = now.slice(0, 10);
        r._schema_version = 2;
      });
      await State.save('recipes');
      Utils.showToast('New draft created from your tweak.');
      render(container, { tab: 'drafts' });
    } catch (err) {
      Utils.showToast('Tweak failed: ' + err.message, 'error');
    } finally {
      tweakBtn.disabled = false;
      tweakBtn.textContent = 'Generate Tweaked Draft';
    }
  }

  async function handleGenerate(wrap) {
    const prompt = wrap.querySelector('#rf-ai-prompt').value.trim();
    if (!prompt) {
      Utils.showToast('Enter a description before generating.', 'error');
      return;
    }

    const genBtn   = wrap.querySelector('#rf-generate');
    const statusEl = wrap.querySelector('#rf-generate-status');

    // Disable Generate button and all form fields while in-flight (D-13)
    genBtn.disabled = true;
    genBtn.textContent = 'Generating…';
    statusEl.textContent = '';
    const formFields = wrap.querySelectorAll('input, textarea, button:not(#rf-generate)');
    formFields.forEach(el => { el.disabled = true; });

    try {
      const ctx = buildPromptContext();  // { bkName, bkPreset, inventoryText, profileText }
      const recipe = await ClaudeAPI.generateRecipe(prompt, ctx);

      // Populate form fields inline (D-13). Assigning to input.value does not
      // parse HTML — no XSS vector. escapeHtml is only needed for innerHTML sinks.
      if (recipe.name)          wrap.querySelector('#rf-name').value      = recipe.name;
      if (recipe.tagline)       wrap.querySelector('#rf-tagline').value   = recipe.tagline;
      // Auto-fill creator with AI-returned value or fall back to bartender name (D-02 required)
      wrap.querySelector('#rf-creator').value = recipe.creator || ctx.bkName || 'Barkeeper Bjorn';
      if (recipe.method)        wrap.querySelector('#rf-method').value    = recipe.method;
      if (recipe.glassware)     wrap.querySelector('#rf-glassware').value = recipe.glassware;
      if (recipe.garnish)       wrap.querySelector('#rf-garnish').value   = recipe.garnish;
      if (recipe.tasting_notes) wrap.querySelector('#rf-profile').value   = recipe.tasting_notes;
      if (recipe.why_it_works)  wrap.querySelector('#rf-why').value       = recipe.why_it_works;
      if (recipe.method_type) {
        const mtSelect = wrap.querySelector('#rf-method-type');
        const validTypes = ['shaken','stirred','built','blended','thrown','other'];
        if (validTypes.includes(recipe.method_type)) mtSelect.value = recipe.method_type;
      }

      // Rebuild ingredient rows from AI response (ingredientRowHtml escapes)
      if (Array.isArray(recipe.ingredients) && recipe.ingredients.length) {
        const ingContainer = wrap.querySelector('#rf-ingredients');
        ingContainer.innerHTML = recipe.ingredients
          .map((ing, i) => ingredientRowHtml(ing, i))
          .join('');
        bindIngredientRemove(wrap);
      }

      Utils.showToast('AI draft loaded — review and save.');

    } catch (err) {
      Utils.showToast('Generation failed: ' + err.message, 'error');
    } finally {
      // Always re-enable form fields and reset Generate button regardless of outcome
      const allFields = wrap.querySelectorAll('input, textarea, button');
      allFields.forEach(el => { el.disabled = false; });
      genBtn.textContent = 'Generate';
      // Edge case: user removed key during generation — re-disable Generate
      if (!localStorage.getItem('bb_anthropic_key')) {
        genBtn.disabled = true;
        genBtn.style.opacity = '0.4';
      }
    }
  }

  function renderForm(r, container) {
    const isEdit = !!r;
    // Commit 3: status-based branching replaces _source sniffing.
    // - isDraft        → editable core + Save and Promote button
    // - isSeededClassic → readonly core (overlay-only edits); titled "View"
    // - isOriginal     → editable core (no Promote)
    const isDraft = isEdit && r && r.status === 'draft';
    const isSeededClassic = isEdit && r && (r.status === 'classic' || r.seed_id);

    // For seeded chips, resolve the live core (name / ingredients / method
    // / etc.) from CLASSICS_DB so the readonly inputs display the seed
    // values. The pool entry itself stores only the overlay.
    const display = isSeededClassic && typeof RecipeChip !== 'undefined' && RecipeChip.resolveCore
      ? RecipeChip.resolveCore(r) : r;

    container.innerHTML = '';

    const back = document.createElement('button');
    back.className = 'back-btn';
    back.textContent = isDraft ? '← Back to Drafts'
                     : isSeededClassic ? '← Back to Recipes'
                     : isEdit ? '← Back to Recipe' : '← Back to Recipes';
    back.addEventListener('click', () => {
      if (isDraft) render(container, { tab: 'drafts' });
      else if (isSeededClassic) render(container, { tab: 'originals' });
      else if (isEdit) renderDetail(r, container);
      else render(container);
    });
    container.appendChild(back);

    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:680px;';

    const title = document.createElement('h2');
    const displayName = display?.name || r?.name || '';
    title.textContent = isDraft ? `Edit Draft: ${displayName}`
                      : isSeededClassic ? `View: ${displayName}`
                      : isEdit ? `Edit: ${displayName}` : 'New Recipe';
    title.style.cssText = 'color:var(--amber);font-weight:normal;margin-bottom:20px;';
    wrap.appendChild(title);

    // Per C-1: seeded chips' core fields are UNEDITABLE but not visually
    // grayed out. We mark inputs readonly/disabled and provide a small
    // hint at the top of the form explaining why. Overlay fields remain
    // editable below.
    if (isSeededClassic) {
      const hint = document.createElement('div');
      hint.style.cssText = 'margin-bottom:14px;padding:8px 12px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:0.82rem;color:var(--text-dim);';
      hint.textContent = 'This is a seeded classic — core recipe (name, ingredients, method) is read live from the classics database and not editable. Your overlay (ratings, notes, ♥/☆/✓) is editable below.';
      wrap.appendChild(hint);
    }

    // Hoisted before any conditional block that references it (the tweak panel
    // immediately below + the legacy AI prompt block further down both check
    // hasKey). Previously declared further down → temporal-dead-zone
    // ReferenceError on every draft edit, abandoning the form render.
    const hasKey = !!localStorage.getItem('bb_anthropic_key');

    // AI tweak panel — only when editing a draft (D-10 fork-on-tweak applied
    // from the edit form). Mirrors the `Generate with AI` block shape used
    // for new recipes. Produces a NEW draft (fork) so the original is
    // preserved as a comparison point.
    if (isDraft && hasKey) {
      wrap.innerHTML += `
        <div class="rf-ai-prompt-wrap" id="rf-tweak-wrap" style="margin-bottom:20px;padding:12px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius-sm);">
          <div class="section-label" style="margin-bottom:8px;">Tweak with AI</div>
          <div class="form-group" style="margin-bottom:10px;">
            <label for="rf-tweak-prompt" style="font-size:0.82rem;">Ask Claude to refine this draft (creates a NEW draft, keeps the original)</label>
            <textarea id="rf-tweak-prompt" rows="2"
                      placeholder="e.g. make it less sweet, or substitute something for mezcal"
                      style="font-family:monospace;font-size:0.82rem;padding:10px;resize:vertical;"></textarea>
          </div>
          <button class="btn btn-primary btn-sm" id="rf-tweak" type="button">Generate Tweaked Draft</button>
          <span id="rf-tweak-status" style="font-size:0.82rem;color:var(--text-muted);margin-left:10px;"></span>
        </div>`;
    }

    // Per-input readonly/disabled flags (seeded-core lock — C-1).
    const ro = isSeededClassic ? 'readonly' : '';
    const dis = isSeededClassic ? 'disabled' : '';

    // AI prompt block — shown only for new recipes (D-12)
    if (!isEdit) {
      wrap.innerHTML += `
        <div class="rf-ai-prompt-wrap" id="rf-ai-wrap" style="margin-bottom:20px;padding:12px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius-sm);">
          <div class="section-label" style="margin-bottom:8px;">Generate with AI</div>
          <div class="form-group" style="margin-bottom:10px;">
            <label for="rf-ai-prompt" style="font-size:0.82rem;">Describe the cocktail you want</label>
            <textarea id="rf-ai-prompt" rows="2"
                      placeholder="e.g. a smoky mezcal sour with honey and citrus"
                      style="font-family:monospace;font-size:0.82rem;padding:10px;resize:vertical;"></textarea>
          </div>
          <button class="btn btn-primary btn-sm" id="rf-generate" type="button"
                  ${hasKey ? '' : 'disabled'}
                  title="${hasKey ? '' : 'Add your Anthropic API key in Settings to use AI generation'}"
                  style="${hasKey ? '' : 'opacity:0.4;cursor:not-allowed;'}">
            Generate
          </button>
          <span id="rf-generate-status" style="font-size:0.82rem;color:var(--text-muted);margin-left:10px;"></span>
        </div>`;
    }

    // Build ingredient rows HTML — pulled from `display` (resolved seed core
    // for classics, pool entry otherwise). Rows are readonly for seeded.
    const ingRows = (display?.ingredients?.length ? display.ingredients : [{ amount: '', name: '', notes: '' }])
      .map((ing, i) => ingredientRowHtml(ing, i, isSeededClassic)).join('');

    wrap.innerHTML += `
      <div class="form-group">
        <label>Name *</label>
        <input type="text" id="rf-name" value="${Utils.escapeHtml(display?.name || '')}" placeholder="Cocktail name" ${ro}>
      </div>
      <div class="form-group">
        <label>Tagline</label>
        <input type="text" id="rf-tagline" value="${Utils.escapeHtml(display?.tagline || '')}" placeholder="One-line description" ${ro}>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Creator *</label>
          <input type="text" id="rf-creator" value="${Utils.escapeHtml(display?.creator || '')}" placeholder="Who made this?" ${ro}>
        </div>
        <div class="form-group">
          <label>Date Created</label>
          <input type="date" id="rf-date" value="${Utils.escapeHtml(display?.date_created || '')}" ${ro}>
        </div>
      </div>

      <div class="section-label" style="margin-top:8px;">Ingredients</div>
      <div id="rf-ingredients">${ingRows}</div>
      ${isSeededClassic ? '' : '<button type="button" class="btn btn-ghost btn-sm" id="rf-add-ing" style="margin-bottom:16px;">+ Add Ingredient</button>'}

      <div class="form-row">
        <div class="form-group">
          <label>Method Type</label>
          <select id="rf-method-type" ${dis}>
            <option value="">—</option>
            ${['shaken','stirred','built','blended','thrown','other'].map(m =>
              `<option value="${m}" ${display?.method_type === m ? 'selected' : ''}>${m}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Glassware</label>
          <input type="text" id="rf-glassware" value="${Utils.escapeHtml(display?.glassware || '')}" placeholder="e.g. coupe" ${ro}>
        </div>
      </div>
      <div class="form-group">
        <label>Method / Instructions</label>
        <textarea id="rf-method" rows="2" placeholder="Stir with ice for 30 seconds..." ${ro}>${Utils.escapeHtml(display?.method || '')}</textarea>
      </div>
      <div class="form-group">
        <label>Garnish</label>
        <input type="text" id="rf-garnish" value="${Utils.escapeHtml(display?.garnish || '')}" placeholder="e.g. lemon twist" ${ro}>
      </div>
      <div class="form-group">
        <label>Profile</label>
        <textarea id="rf-profile" rows="2" placeholder="Flavor/occasion description" ${ro}>${Utils.escapeHtml(typeof display?.profile === 'string' ? display.profile : '')}</textarea>
      </div>
      <div class="form-group">
        <label>Why It Works</label>
        <textarea id="rf-why" rows="2" placeholder="The science behind it" ${ro}>${Utils.escapeHtml(display?.why_it_works || '')}</textarea>
      </div>

      <div class="section-label" style="margin-top:8px;">Ratings & Status</div>
      <div class="form-row">
        <div class="form-group">
          <label>Owner Rating (1–10)</label>
          <input type="number" id="rf-rating" min="1" max="10" value="${r?.ratings?.bar_owner || ''}">
        </div>
        <div class="form-group">
          <label>Guest Feedback</label>
          <input type="text" id="rf-guests" value="${Utils.escapeHtml(r?.ratings?.guests || '')}" placeholder="What did they think?">
        </div>
      </div>
      <div class="form-group">
        <label>Rating Notes</label>
        <input type="text" id="rf-rating-notes" value="${Utils.escapeHtml(r?.ratings?.notes || '')}" placeholder="Any notes on the rating">
      </div>
      <div class="form-group" style="display:flex;align-items:center;gap:10px;">
        <input type="checkbox" id="rf-built" ${r?.confirmed_built ? 'checked' : ''} style="width:auto;margin:0;">
        <label for="rf-built" style="margin:0;">Confirmed Built</label>
      </div>
      <div class="form-group" style="display:flex;align-items:center;gap:10px;" title="${r?.seed_id ? 'Classics cannot be marked as your Original — they live in the seed library.' : 'Tag this entry as your own creation.'}">
        <input type="checkbox" id="rf-original"
               ${r?.is_original ? 'checked' : ''}
               ${r?.seed_id ? 'disabled' : ''}
               style="width:auto;margin:0;${r?.seed_id ? 'opacity:0.5;cursor:not-allowed;' : ''}">
        <label for="rf-original" style="margin:0;${r?.seed_id ? 'opacity:0.6;' : ''}">Original (my creation)${r?.seed_id ? ' — locked (classic)' : ''}</label>
      </div>

      <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;">
        <button class="btn btn-primary" id="rf-save">${isDraft ? 'Save Draft Changes' : isSeededClassic ? 'Save Overlay (ratings / notes)' : (isEdit ? 'Save Changes' : 'Create Recipe')}</button>
        ${isDraft ? '<button class="btn btn-primary" id="rf-save-promote" title="Save these edits then promote the draft into Originals">Save and Promote to Original</button>' : ''}
        <button class="btn btn-secondary" id="rf-cancel">Cancel</button>
      </div>`;

    container.appendChild(wrap);

    // Generate button stub: live wiring lands in plan 03-03 (Wave 2 / ClaudeAPI).
    // If no API key, button is disabled at render time (handled above) — skip listener.
    if (!isEdit && hasKey) {
      const genBtn = wrap.querySelector('#rf-generate');
      if (genBtn) {
        genBtn.addEventListener('click', () => {
          if (typeof ClaudeAPI === 'undefined' || typeof handleGenerate === 'undefined') {
            Utils.showToast('AI generation module not yet loaded.', 'error');
            return;
          }
          handleGenerate(wrap);
        });
      }
    }

    // Closure flag: set to true by the "Save and Promote to Original" button
    // before it programmatically clicks rf-save. The drafts-success branch of
    // the rf-save handler then calls promoteDraftToOriginal instead of
    // returning to the Drafts tab.
    let _promoteAfterSave = false;

    wrap.querySelector('#rf-cancel').addEventListener('click', () => {
      if (isDraft) render(container, { tab: 'drafts' });
      else if (isSeededClassic) render(container, { tab: 'originals' });
      else if (isEdit) renderDetail(r, container);
      else render(container);
    });

    if (isDraft) {
      const promoteBtn = wrap.querySelector('#rf-save-promote');
      if (promoteBtn) {
        promoteBtn.addEventListener('click', () => {
          _promoteAfterSave = true;
          wrap.querySelector('#rf-save').click();
        });
      }
      const tweakBtn = wrap.querySelector('#rf-tweak');
      if (tweakBtn) {
        tweakBtn.addEventListener('click', () => handleDraftTweak(wrap, r, container));
      }
    }

    const addIngBtn = wrap.querySelector('#rf-add-ing');
    if (addIngBtn) {
      addIngBtn.addEventListener('click', () => {
        const ingList = wrap.querySelector('#rf-ingredients');
        const idx = ingList.querySelectorAll('.rf-ing-row').length;
        ingList.insertAdjacentHTML('beforeend', ingredientRowHtml({ amount: '', name: '', notes: '' }, idx, false));
        bindIngredientRemove(wrap);
      });
    }

    bindIngredientRemove(wrap);

    wrap.querySelector('#rf-save').addEventListener('click', () => {
      const name = wrap.querySelector('#rf-name').value.trim();
      const creator = wrap.querySelector('#rf-creator').value.trim();
      if (!name) { Utils.showToast('Name is required.', 'error'); return; }
      if (!creator) { Utils.showToast('Creator is required.', 'error'); return; }

      // Ingredient validation (D-02): at least one ingredient with a name
      const ingRowsForValidation = [...wrap.querySelectorAll('.rf-ing-row')];
      const filledIngredients = ingRowsForValidation.filter(row => row.querySelector('.rf-ing-name').value.trim());
      if (!filledIngredients.length) { Utils.showToast('At least one ingredient is required.', 'error'); return; }

      // Method validation (D-02)
      const methodVal = wrap.querySelector('#rf-method').value.trim();
      if (!methodVal) { Utils.showToast('Method is required.', 'error'); return; }

      const ingredients = [...wrap.querySelectorAll('.rf-ing-row')].map(row => {
        const ing = {
          amount: row.querySelector('.rf-ing-amount').value.trim(),
          name: row.querySelector('.rf-ing-name').value.trim(),
        };
        const notes = row.querySelector('.rf-ing-notes').value.trim();
        if (notes) ing.notes = notes;
        return ing;
      }).filter(i => i.name);

      const ratingVal = parseInt(wrap.querySelector('#rf-rating').value, 10);
      const guestsVal = wrap.querySelector('#rf-guests').value.trim();
      const ratingNotesVal = wrap.querySelector('#rf-rating-notes').value.trim();
      const hasRating = ratingVal || guestsVal || ratingNotesVal;

      const updated = {
        id: isEdit ? r.id : `cocktail${Date.now()}`,
        name,
        creator,
        ingredients,
        method: wrap.querySelector('#rf-method').value.trim() || (isEdit ? r.method : ''),
      };
      const tagline = wrap.querySelector('#rf-tagline').value.trim();
      if (tagline) updated.tagline = tagline;
      const dateVal = wrap.querySelector('#rf-date').value;
      if (dateVal) updated.date_created = dateVal;
      const methodType = wrap.querySelector('#rf-method-type').value;
      if (methodType) updated.method_type = methodType;
      const glassware = wrap.querySelector('#rf-glassware').value.trim();
      if (glassware) updated.glassware = glassware;
      const garnish = wrap.querySelector('#rf-garnish').value.trim();
      if (garnish) updated.garnish = garnish;
      const profile = wrap.querySelector('#rf-profile').value.trim();
      if (profile) updated.profile = profile;
      const why = wrap.querySelector('#rf-why').value.trim();
      if (why) updated.why_it_works = why;
      updated.confirmed_built = wrap.querySelector('#rf-built').checked;
      // is_original tag: editable for non-seeded entries; for seeded chips
      // the checkbox is disabled so the read-as-checked stays false. The
      // save-path branches below trust Normalize.recipe / the pool-write
      // patch to force is_original=false when seed_id is set, but we still
      // honor the checkbox value here for user originals + drafts.
      const origCheckbox = wrap.querySelector('#rf-original');
      if (origCheckbox) updated.is_original = origCheckbox.checked;
      if (hasRating) {
        updated.ratings = {};
        if (ratingVal) updated.ratings.bar_owner = ratingVal;
        if (guestsVal) updated.ratings.guests = guestsVal;
        if (ratingNotesVal) updated.ratings.notes = ratingNotesVal;
      }

      const saveBtn = wrap.querySelector('#rf-save');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving…';

      // Draft path: preserve draft provenance, find-by-draft_id in drafts.drafts,
      // save back to the drafts state file. Reuses the same form code.
      if (isDraft) {
        const draftUpdated = {
          ...updated,
          _source: 'ai-generated',
          draft_id: r.draft_id,
          created_at: r.created_at,
          updated_at: new Date().toISOString(),
          source_prompt: r.source_prompt,
        };
        const draftsNow = State.get('drafts') || { drafts: [] };
        const list = Array.isArray(draftsNow.drafts) ? draftsNow.drafts.slice() : [];
        const dIdx = list.findIndex(d => d.draft_id === r.draft_id);
        if (dIdx >= 0) list[dIdx] = draftUpdated;
        else list.push(draftUpdated);
        const newDrafts = { ...draftsNow, drafts: list, last_updated: new Date().toISOString().slice(0, 10) };
        State.set('drafts', newDrafts);
        State.save('drafts').then(() => {
          if (_promoteAfterSave) {
            _promoteAfterSave = false;
            return promoteDraftToOriginal(draftUpdated, container);
          }
          Utils.showToast('Draft updated.');
          render(container, { tab: 'drafts' });
        }).catch(err => {
          _promoteAfterSave = false;
          Utils.showToast('Save failed: ' + err.message, 'error');
          saveBtn.disabled = false;
          saveBtn.textContent = 'Save Draft Changes';
        });
        return;
      }

      // Originals / new-recipe path — pool-aware (chip unification C3).
      const recipes = State.get('recipes') || { pool: [] };
      const pool = Array.isArray(recipes.pool) ? recipes.pool : [];
      if (isEdit) {
        const idx = pool.findIndex(p => p.id === r.id);
        if (idx >= 0) pool[idx] = { ...pool[idx], ...updated, status: 'original', _source: 'user' };
        else pool.push({ ...updated, status: 'original', _source: 'user' });
      } else {
        pool.push({ ...updated, status: 'original', _source: 'user' });
      }
      recipes.pool = pool;
      recipes.last_updated = new Date().toISOString().slice(0, 10);
      State.set('recipes', recipes);

      State.save('recipes').then(() => {
        Utils.showToast(isEdit ? 'Recipe updated.' : 'Recipe created.');
        renderDetail(updated, container);
      }).catch(err => {
        Utils.showToast('Save failed: ' + err.message, 'error');
        saveBtn.disabled = false;
        saveBtn.textContent = isEdit ? 'Save Changes' : 'Create Recipe';
      });
    });
  }

  function ingredientRowHtml(ing, i, readonly) {
    const ro = readonly ? 'readonly' : '';
    return `
      <div class="rf-ing-row form-row" style="align-items:center;margin-bottom:6px;">
        <input class="rf-ing-amount" type="text" value="${Utils.escapeHtml(ing.amount || '')}" placeholder="2 oz" style="flex:0 0 90px;" ${ro}>
        <input class="rf-ing-name"   type="text" value="${Utils.escapeHtml(ing.name  || '')}" placeholder="Ingredient" ${ro}>
        <input class="rf-ing-notes"  type="text" value="${Utils.escapeHtml(ing.notes || '')}" placeholder="Notes (opt)" style="flex:0 0 160px;" ${ro}>
        ${readonly ? '' : '<button type="button" class="btn-icon rf-ing-remove" title="Remove" style="flex:none;">✕</button>'}
      </div>`;
  }

  function bindIngredientRemove(wrap) {
    wrap.querySelectorAll('.rf-ing-remove').forEach(btn => {
      btn.onclick = () => {
        const row = btn.closest('.rf-ing-row');
        if (wrap.querySelectorAll('.rf-ing-row').length > 1) row.remove();
      };
    });
  }

  return { render };
})();
