// Recipe Browser view — card grid of originals + detail pane.

const RecipesView = (() => {

  let _searchQuery = '';

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

  function render(container, params = {}) {
    _searchQuery = '';
    const recipes = State.get('recipes') || {};
    const draftsObj = State.get('drafts') || { drafts: [] };
    const originals = recipes.originals || [];
    const favorites = recipes.confirmed_favorites || [];
    const wishlist  = recipes.wishlist || [];
    const madeLog   = recipes.made_log || [];
    const draftList = draftsObj.drafts || [];
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
      renderTab(activeTab, State.get('recipes') || {}, tabContent, container);
    });

    container.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        _searchQuery = '';
        searchInput.value = '';
        renderTab(tab.dataset.tab, State.get('recipes') || {}, tabContent, container);
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

    renderTab(initialTab, recipes, tabContent, container);

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
      const now = new Date().toISOString();
      let draftEntry;
      if (mode === 'tweak' && baseDraft && baseDraft.draft_id) {
        draftEntry = {
          ...candidate,
          _source: 'ai-generated',
          draft_id: baseDraft.draft_id,
          created_at: baseDraft.created_at || now,
          updated_at: now,
          source_prompt: baseDraft.source_prompt || userPrompt,
        };
      } else {
        draftEntry = {
          ...candidate,
          _source: 'ai-generated',
          draft_id: 'draft' + Date.now(),
          created_at: now,
          updated_at: now,
          source_prompt: userPrompt,
        };
      }

      // Build the new drafts.json payload.
      const oldDrafts = State.get('drafts') || { drafts: [] };
      const list = Array.isArray(oldDrafts.drafts) ? oldDrafts.drafts.slice() : [];
      const idx = list.findIndex(d => d.draft_id === draftEntry.draft_id);
      if (idx >= 0) list[idx] = draftEntry; else list.push(draftEntry);
      const newDrafts = { drafts: list, last_updated: new Date().toISOString().slice(0, 10) };

      // FM #3: phantom-ingredient flag before gate.
      const inv = State.get('inventory') || {};
      const tokens = _inventoryTokens(inv);
      const vetoArr = (inv.vetoes && inv.vetoes.disliked_ingredients) || [];
      const fid = (typeof WriteGate !== 'undefined' && WriteGate.inventoryFidelity)
        ? WriteGate.inventoryFidelity(draftEntry, tokens, vetoArr)
        : { phantoms: [], vetoed: [] };

      // Auto-save via WriteGate (D-09 - never silently corrupt).
      const gateMsg = mode === 'tweak'
        ? `Refine draft: ${draftEntry.name}`
        : `Save AI draft: ${draftEntry.name}`;
      const result = await WriteGate.gate({
        schemaKey: 'drafts',
        oldData: oldDrafts,
        newPayload: newDrafts,
        message: gateMsg,
        onConfirm: async () => {
          State.set('drafts', newDrafts);
          return State.save('drafts');
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

  function renderTab(tabName, recipes, container, mainContainer) {
    container.innerHTML = '';
    if (tabName === 'originals') {
      renderOriginalsGrid(recipes.originals || [], container);
    } else if (tabName === 'favorites') {
      renderRecipeChips(recipes.confirmed_favorites || [], container, 'confirmed_favorites', mainContainer);
    } else if (tabName === 'wishlist') {
      renderRecipeChips(recipes.wishlist || [], container, 'wishlist', mainContainer);
    } else if (tabName === 'made') {
      renderMadeList(recipes.made_log || [], container, mainContainer);
    } else if (tabName === 'drafts') {
      const draftsObj = State.get('drafts') || { drafts: [] };
      renderDraftChips(draftsObj.drafts || [], container, mainContainer);
    }
  }

  // ── Drafts tab (D-11): list AI-generated drafts + Promote-to-Original ────
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

    filtered.forEach(draft => {
      const card = document.createElement('div');
      card.className = 'rec-card';
      const ingChips = (draft.ingredients || []).slice(0, 5).map(i =>
        `<span class="rec-ing-chip">${Utils.escapeHtml(i.amount || '')} ${Utils.escapeHtml(i.name || '')}</span>`
      ).join('');
      const overflow = (draft.ingredients || []).length > 5
        ? `<span class="rec-ing-chip" style="color:var(--text-muted);">+${(draft.ingredients||[]).length - 5} more</span>` : '';

      card.innerHTML = `
        <div class="rec-card-header">
          <div style="flex:1;min-width:0;">
            <div class="rec-card-name">${Utils.escapeHtml(draft.name)} <span class="badge badge-amber" style="font-size:0.7rem;margin-left:6px;">draft</span></div>
            <div class="rec-card-meta">
              ${draft.base ? `<span class="rec-base">${Utils.escapeHtml(draft.base)}</span>` : ''}
              ${draft.method ? `<span class="rec-sep">·</span><span class="rec-method">${Utils.escapeHtml(draft.method)}</span>` : ''}
              ${draft.glassware ? `<span class="rec-sep">·</span><span>${Utils.escapeHtml(draft.glassware)}</span>` : ''}
            </div>
          </div>
          <div style="display:flex;gap:6px;align-items:center;flex-shrink:0;">
            <button class="btn btn-ghost btn-sm" data-edit-draft="${Utils.escapeHtml(draft.draft_id || '')}">Edit</button>
            <button class="btn btn-primary btn-sm" data-promote="${Utils.escapeHtml(draft.draft_id || '')}">Promote to Original</button>
            <button class="btn-icon" data-discard title="Discard draft">✕</button>
          </div>
        </div>
        ${draft.tagline ? `<p class="rec-occasion" style="font-style:italic;">${Utils.escapeHtml(draft.tagline)}</p>` : ''}
        <div class="rec-ingredients">${ingChips}${overflow}</div>
        ${draft.source_prompt ? `<div style="font-size:0.78rem;color:var(--text-muted);margin-top:6px;"><strong>From:</strong> ${Utils.escapeHtml(draft.source_prompt)}</div>` : ''}`;

      card.querySelector('[data-promote]').addEventListener('click', e => {
        e.stopPropagation();
        promoteDraftToOriginal(draft, mainContainer);
      });

      card.querySelector('[data-edit-draft]').addEventListener('click', e => {
        e.stopPropagation();
        // Reuse the existing renderForm — it sniffs _source==='ai-generated'
        // and routes the save back to drafts.drafts (find by draft_id).
        renderForm(draft, mainContainer);
      });

      card.querySelector('[data-discard]').addEventListener('click', e => {
        e.stopPropagation();
        if (!confirm(`Discard draft "${draft.name}"?`)) return;
        const cur = State.get('drafts') || { drafts: [] };
        const next = {
          ...cur,
          drafts: (cur.drafts || []).filter(d => d.draft_id !== draft.draft_id),
          last_updated: new Date().toISOString().slice(0, 10),
        };
        // Discard isn't an AI-generated write — straight save is fine (no model output entering data).
        State.set('drafts', next);
        State.save('drafts').then(() => {
          Utils.showToast('Draft discarded.');
          render(mainContainer, { tab: 'drafts' });
        }).catch(err => Utils.showToast('Save failed: ' + err.message, 'error'));
      });

      container.appendChild(card);
    });
  }

  // ── Promote draft -> originals (D-11) ────────────────────────────────────
  // Re-tag _source to 'originals', assign 'cocktail'+Date.now() id (matches
  // ^cocktail[0-9]+$), append to recipes.originals, then SEQUENTIALLY save
  // recipes BEFORE drafts (Pitfall 4 - never parallel saves to avoid 409).
  async function promoteDraftToOriginal(draft, mainContainer) {
    const recipesNow = State.get('recipes') || {};
    const originalsArr = Array.isArray(recipesNow.originals) ? recipesNow.originals.slice() : [];

    // Build promoted entry. Drop draft-only metadata.
    const promoted = {
      ...draft,
      _source: 'originals',
      id: 'cocktail' + Date.now(),
      creator: draft.creator || ((State.get('barkeeper') || {}).identity?.name) || 'Barkeeper Bjorn',
      date_created: new Date().toISOString().slice(0, 10),
    };
    delete promoted.draft_id;
    delete promoted.source_prompt;
    delete promoted.created_at;
    delete promoted.updated_at;

    // Duplicate flag (Utils.sameRecipe match against existing originals).
    const dup = originalsArr.find(o => Utils.sameRecipe(o, promoted));
    const dupNote = dup ? `\nPossible duplicate of existing original "${dup.name}".` : '';

    originalsArr.push(promoted);
    const newRecipes = {
      ...recipesNow,
      originals: originalsArr,
      last_updated: new Date().toISOString().slice(0, 10),
    };

    const result = await WriteGate.gate({
      schemaKey: 'recipes',
      oldData: recipesNow,
      newPayload: newRecipes,
      message: `Promote to Original: ${promoted.name}${dupNote}`,
      onConfirm: async () => {
        // Pitfall 4: save SEQUENTIALLY — recipes THEN drafts. Never parallel.
        State.set('recipes', newRecipes);
        await State.save('recipes');
        // Now remove the draft from drafts.json.
        State.patch('drafts', d => {
          d.drafts = (d.drafts || []).filter(x => x.draft_id !== draft.draft_id);
          d.last_updated = new Date().toISOString().slice(0, 10);
        });
        await State.save('drafts');
      },
    });

    if (result && result.status === 'confirmed') {
      Utils.showToast(`Promoted "${promoted.name}" to Originals.`);
      render(mainContainer, { tab: 'drafts' });
    } else if (result && result.status === 'invalid') {
      // WriteGate already toasted the schema error.
    }
  }

  function renderOriginalsGrid(originals, container) {
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

    const grid = document.createElement('div');
    grid.className = 'card-grid';

    filtered.forEach(r => {
      const card = document.createElement('div');
      card.className = 'recipe-card';
      const builtBadge = r.confirmed_built
        ? `<span class="badge badge-green" style="position:absolute;top:14px;right:14px;font-size:0.7rem;">Built ✓</span>`
        : '';
      const method = r.method_type || r.method || '';
      const base = r.ingredients?.[0]?.name || '';
      card.innerHTML = `
        ${builtBadge}
        <div class="card-id">${Utils.escapeHtml(r.id)}</div>
        <div class="card-title">${Utils.escapeHtml(r.name)}</div>
        ${r.tagline ? `<div style="font-size:0.83rem;color:var(--text-dim);font-style:italic;margin-bottom:8px;">${Utils.escapeHtml(r.tagline)}</div>` : ''}
        <div class="card-meta">
          ${method ? `<span>${Utils.escapeHtml(method)}</span>` : ''}
          ${base ? `<span>${Utils.escapeHtml(base)}</span>` : ''}
          ${r.glassware ? `<span>${Utils.escapeHtml(r.glassware)}</span>` : ''}
        </div>
        ${r.profile ? `<div class="card-profile">${Utils.escapeHtml(r.profile)}</div>` : ''}
        ${r.ratings?.bar_owner ? `<div style="margin-top:10px;font-size:0.8rem;color:var(--amber);">Rating: ${r.ratings.bar_owner}/10</div>` : ''}`;

      card.addEventListener('click', () => {
        renderDetail(r, document.getElementById('main-content'));
      });
      grid.appendChild(card);
    });

    container.appendChild(grid);
  }

  function renderRecipeChips(list, container, listKey, mainContainer) {
    const emptyIcon = listKey === 'confirmed_favorites' ? '⭐' : '📋';
    const emptyMsg  = listKey === 'confirmed_favorites' ? 'No favorites yet.' : 'Wishlist is empty.';

    const filtered = _filterRecipes(list, _searchQuery);
    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${emptyIcon}</div>
          <p>${_searchQuery ? 'No matches found.' : emptyMsg}</p>
        </div>`;
      return;
    }

    filtered.forEach(recipe => {
      const card = document.createElement('div');
      card.className = 'rec-card';
      card.style.cursor = 'pointer';

      const ingChips = (recipe.ingredients || []).slice(0, 5).map(i =>
        `<span class="rec-ing-chip">${Utils.escapeHtml(i.amount || '')} ${Utils.escapeHtml(i.name)}</span>`
      ).join('');
      const overflow = (recipe.ingredients || []).length > 5
        ? `<span class="rec-ing-chip" style="color:var(--text-muted);">+${(recipe.ingredients||[]).length - 5} more</span>` : '';

      card.innerHTML = `
        <div class="rec-card-header">
          <div style="flex:1;min-width:0;">
            <div class="rec-card-name">${Utils.escapeHtml(recipe.name)}</div>
            <div class="rec-card-meta">
              ${recipe.base ? `<span class="rec-base">${Utils.escapeHtml(recipe.base)}</span>` : ''}
              ${recipe.method ? `<span class="rec-sep">·</span><span class="rec-method">${Utils.escapeHtml(recipe.method)}</span>` : ''}
              ${recipe.glassware ? `<span class="rec-sep">·</span><span>${Utils.escapeHtml(recipe.glassware)}</span>` : ''}
            </div>
          </div>
          <div style="display:flex;gap:6px;align-items:center;flex-shrink:0;">
            <button class="rec-ask-btn ai-ask-btn" data-ask title="Ask Bjorn about this">Ask Bjorn</button>
            <button class="btn-icon" data-remove title="Remove">✕</button>
          </div>
        </div>
        ${recipe.occasion ? `<p class="rec-occasion">${Utils.escapeHtml(recipe.occasion)}</p>` : ''}
        <div class="rec-ingredients">${ingChips}${overflow}</div>`;

      card.addEventListener('click', e => {
        if (e.target.closest('[data-remove]')) return;
        if (e.target.closest('[data-ask]')) return;
        showRecipeDetail(recipe, listKey, mainContainer);
      });

      card.querySelector('[data-ask]').addEventListener('click', e => {
        e.stopPropagation();
        if (typeof ChatView === 'undefined' || !ChatView.openDrawer) {
          Utils.showToast('Chat module not loaded.', 'error');
          return;
        }
        const seed =
          `Tell me about the ${recipe.name}${recipe.base ? ` (${recipe.base})` : ''}. ` +
          `Would it suit my taste, and what variations would you suggest given my bar?`;
        ChatView.openDrawer({ seed });
      });

      card.querySelector('[data-remove]').addEventListener('click', e => {
        e.stopPropagation();
        State.patch('recipes', r => { r[listKey] = (r[listKey] || []).filter(x => !Utils.sameRecipe(x, recipe)); });
        State.save('recipes').then(() => {
          Utils.showToast('Removed');
          render(mainContainer, { tab: listKey === 'confirmed_favorites' ? 'favorites' : 'wishlist' });
        });
      });

      container.appendChild(card);
    });
  }

  function renderMadeList(madeLog, container, mainContainer) {
    const filtered = _filterRecipes(madeLog, _searchQuery);
    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">✓</div>
          <p>${_searchQuery ? 'No matches found.' : 'Nothing marked as made yet.'}</p>
          <p style="font-size:0.85rem;color:var(--text-muted);">Use the ○ button on Recommender cards to track what you've made.</p>
        </div>`;
      return;
    }

    // Most-recent first (already unshifted on add, but sort by last_made for robustness)
    const sorted = [...filtered].sort((a, b) => (b.last_made || '') > (a.last_made || '') ? 1 : -1);

    sorted.forEach(recipe => {
      const card = document.createElement('div');
      card.className = 'rec-card';
      card.style.cursor = 'pointer';

      const ingChips = (recipe.ingredients || []).slice(0, 5).map(i =>
        `<span class="rec-ing-chip">${Utils.escapeHtml(i.amount || '')} ${Utils.escapeHtml(i.name)}</span>`
      ).join('');
      const overflow = (recipe.ingredients || []).length > 5
        ? `<span class="rec-ing-chip" style="color:var(--text-muted);">+${(recipe.ingredients||[]).length - 5} more</span>` : '';

      card.innerHTML = `
        <div class="rec-card-header">
          <div style="flex:1;min-width:0;">
            <div class="rec-card-name">
              ${Utils.escapeHtml(recipe.name)}
              <span class="rec-times-made-badge">×${recipe.times_made || 1}</span>
            </div>
            <div class="rec-card-meta">
              ${recipe.base ? `<span class="rec-base">${Utils.escapeHtml(recipe.base)}</span>` : ''}
              ${recipe.method ? `<span class="rec-sep">·</span><span class="rec-method">${Utils.escapeHtml(recipe.method)}</span>` : ''}
              ${recipe.last_made ? `<span class="rec-sep">·</span><span style="color:var(--text-muted);">Last: ${Utils.escapeHtml(recipe.last_made)}</span>` : ''}
            </div>
          </div>
          <button class="btn-icon" data-remove title="Remove from Made" style="flex-shrink:0;">✕</button>
        </div>
        ${recipe.occasion ? `<p class="rec-occasion">${Utils.escapeHtml(recipe.occasion)}</p>` : ''}
        <div class="rec-ingredients">${ingChips}${overflow}</div>`;

      card.addEventListener('click', e => {
        if (e.target.closest('[data-remove]')) return;
        showRecipeDetail(recipe, 'made_log', mainContainer);
      });

      card.querySelector('[data-remove]').addEventListener('click', e => {
        e.stopPropagation();
        State.patch('recipes', r => { r.made_log = (r.made_log || []).filter(x => !Utils.sameRecipe(x, recipe)); });
        State.save('recipes').then(() => {
          Utils.showToast('Removed from Made');
          render(mainContainer, { tab: 'made' });
        });
      });

      container.appendChild(card);
    });
  }

  function showRecipeDetail(recipe, listKey, mainContainer) {
    const editable = recipe._source === 'originals';
    const madeLog = State.get('recipes')?.made_log || [];
    const madeEntry = madeLog.find(m => Utils.sameRecipe(m, recipe));
    const timesMade = madeEntry?.times_made || 0;
    const currentNotes = (listKey === 'made_log' ? recipe.notes : null) ||
      (State.get('recipes')?.[listKey]?.find(r => Utils.sameRecipe(r, recipe))?.notes) || '';

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

    overlay.querySelector('.rdm-save-notes').addEventListener('click', () => {
      const notes = overlay.querySelector('.rdm-notes').value.trim();
      State.patch('recipes', r => {
        const entry = (r[listKey] || []).find(x => Utils.sameRecipe(x, recipe));
        if (entry) entry.notes = notes;
      });
      State.save('recipes').then(() => Utils.showToast('Notes saved.'))
        .catch(err => Utils.showToast('Save failed: ' + err.message, 'error'));
    });

    if (editable) {
      overlay.querySelector('.rdm-save-recipe').addEventListener('click', () => {
        // CRITICAL ORDER (Pitfall C): capture lookup keys BEFORE reading edited
        // inputs so a rename still finds the canonical + inline-copy entries.
        const origId = recipe.id;
        const origProbe = { name: recipe.name, base: recipe.base }; // pre-edit keys

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
          const canon = (r.originals || []).find(o => o.id === origId)
            || (r.originals || []).find(o => Utils.sameRecipe(o, origProbe));
          if (canon) Object.assign(canon, edited);
          if (listKey) {
            const copy = (r[listKey] || []).find(x => Utils.sameRecipe(x, origProbe));
            if (copy) Object.assign(copy, edited);
          }
        });
        State.save('recipes').then(() => {
          Utils.showToast('Recipe updated.');
          close();
          const tab = listKey === 'made_log' ? 'made' : (listKey === 'confirmed_favorites' ? 'favorites' : 'wishlist');
          render(mainContainer, { tab });
        }).catch(err => Utils.showToast('Save failed: ' + err.message, 'error'));
      });
    }

    overlay.querySelector('.rdm-made-btn').addEventListener('click', () => {
      const today = new Date().toISOString().slice(0, 10);
      State.patch('recipes', r => {
        if (!r.made_log) r.made_log = [];
        const existing = r.made_log.find(m => Utils.sameRecipe(m, recipe));
        if (existing) {
          existing.times_made = (existing.times_made || 1) + 1;
          existing.last_made = today;
        } else {
          r.made_log.unshift({ ...recipe, _source: recipe._source || 'classics-db', times_made: 1, first_made: today, last_made: today, notes: '' });
        }
      });
      State.save('recipes').then(() => {
        Utils.showToast('Marked as made ✓');
        const newCount = State.get('recipes')?.made_log?.find(m => Utils.sameRecipe(m, recipe))?.times_made || 1;
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
            State.patch('recipes', r => { r.made_log = (r.made_log || []).filter(m => !Utils.sameRecipe(m, recipe)); });
            State.save('recipes').then(() => {
              Utils.showToast('Removed from Made');
              close();
              const activeTab = listKey === 'made_log' ? 'made' : (listKey === 'confirmed_favorites' ? 'favorites' : 'wishlist');
              render(mainContainer, { tab: activeTab });
            }).catch(err => Utils.showToast('Save failed: ' + err.message, 'error'));
          });
        }
      }).catch(err => Utils.showToast('Save failed: ' + err.message, 'error'));
    });

    const unMadeBtn = overlay.querySelector('.rdm-unmade-btn');
    if (unMadeBtn) {
      unMadeBtn.addEventListener('click', () => {
        State.patch('recipes', r => { r.made_log = (r.made_log || []).filter(m => !Utils.sameRecipe(m, recipe)); });
        State.save('recipes').then(() => {
          Utils.showToast('Removed from Made');
          close();
          const activeTab = listKey === 'made_log' ? 'made' : (listKey === 'confirmed_favorites' ? 'favorites' : 'wishlist');
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
      const recipes = State.get('recipes') || {};
      recipes.originals = (recipes.originals || []).filter(x => x.id !== r.id);
      recipes.last_updated = new Date().toISOString().slice(0, 10);
      State.set('recipes', recipes);
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

        // Patch recipe images array
        const recipes = State.get('recipes') || {};
        const originals = recipes.originals || [];
        const idx = originals.findIndex(x => x.id === r.id);
        if (idx >= 0) {
          if (!originals[idx].images) originals[idx].images = [];
          originals[idx].images.push({ filename, alt_text: r.name });
          recipes.originals = originals;
          recipes.last_updated = new Date().toISOString().slice(0, 10);
          State.set('recipes', recipes);
          await State.save('recipes');
        }

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
      const oldDrafts = State.get('drafts') || { drafts: [] };
      const list = Array.isArray(oldDrafts.drafts) ? oldDrafts.drafts.slice() : [];
      list.push(newDraft);
      const newDraftsPayload = { ...oldDrafts, drafts: list, last_updated: now.slice(0, 10) };
      State.set('drafts', newDraftsPayload);
      await State.save('drafts');
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
    // A draft is just a universal recipe stored in drafts.drafts; the form is
    // the same, but its save handler must route back to drafts (not originals)
    // and titles/back-nav should reflect that. Detect via _source provenance.
    const isDraft = isEdit && r && r._source === 'ai-generated' && r.draft_id;
    container.innerHTML = '';

    const back = document.createElement('button');
    back.className = 'back-btn';
    back.textContent = isDraft ? '← Back to Drafts' : (isEdit ? '← Back to Recipe' : '← Back to Recipes');
    back.addEventListener('click', () => {
      if (isDraft) render(container, { tab: 'drafts' });
      else if (isEdit) renderDetail(r, container);
      else render(container);
    });
    container.appendChild(back);

    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:680px;';

    const title = document.createElement('h2');
    title.textContent = isDraft ? `Edit Draft: ${r.name}` : (isEdit ? `Edit: ${r.name}` : 'New Recipe');
    title.style.cssText = 'color:var(--amber);font-weight:normal;margin-bottom:20px;';
    wrap.appendChild(title);

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

    // Build ingredient rows HTML
    const ingRows = (r?.ingredients?.length ? r.ingredients : [{ amount: '', name: '', notes: '' }])
      .map((ing, i) => ingredientRowHtml(ing, i)).join('');

    wrap.innerHTML += `
      <div class="form-group">
        <label>Name *</label>
        <input type="text" id="rf-name" value="${Utils.escapeHtml(r?.name || '')}" placeholder="Cocktail name">
      </div>
      <div class="form-group">
        <label>Tagline</label>
        <input type="text" id="rf-tagline" value="${Utils.escapeHtml(r?.tagline || '')}" placeholder="One-line description">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Creator *</label>
          <input type="text" id="rf-creator" value="${Utils.escapeHtml(r?.creator || '')}" placeholder="Who made this?">
        </div>
        <div class="form-group">
          <label>Date Created</label>
          <input type="date" id="rf-date" value="${Utils.escapeHtml(r?.date_created || '')}">
        </div>
      </div>

      <div class="section-label" style="margin-top:8px;">Ingredients</div>
      <div id="rf-ingredients">${ingRows}</div>
      <button type="button" class="btn btn-ghost btn-sm" id="rf-add-ing" style="margin-bottom:16px;">+ Add Ingredient</button>

      <div class="form-row">
        <div class="form-group">
          <label>Method Type</label>
          <select id="rf-method-type">
            <option value="">—</option>
            ${['shaken','stirred','built','blended','thrown','other'].map(m =>
              `<option value="${m}" ${r?.method_type === m ? 'selected' : ''}>${m}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Glassware</label>
          <input type="text" id="rf-glassware" value="${Utils.escapeHtml(r?.glassware || '')}" placeholder="e.g. coupe">
        </div>
      </div>
      <div class="form-group">
        <label>Method / Instructions</label>
        <textarea id="rf-method" rows="2" placeholder="Stir with ice for 30 seconds...">${Utils.escapeHtml(r?.method || '')}</textarea>
      </div>
      <div class="form-group">
        <label>Garnish</label>
        <input type="text" id="rf-garnish" value="${Utils.escapeHtml(r?.garnish || '')}" placeholder="e.g. lemon twist">
      </div>
      <div class="form-group">
        <label>Profile</label>
        <textarea id="rf-profile" rows="2" placeholder="Flavor/occasion description">${Utils.escapeHtml(r?.profile || '')}</textarea>
      </div>
      <div class="form-group">
        <label>Why It Works</label>
        <textarea id="rf-why" rows="2" placeholder="The science behind it">${Utils.escapeHtml(r?.why_it_works || '')}</textarea>
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

      <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;">
        <button class="btn btn-primary" id="rf-save">${isDraft ? 'Save Draft Changes' : (isEdit ? 'Save Changes' : 'Create Recipe')}</button>
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

    wrap.querySelector('#rf-add-ing').addEventListener('click', () => {
      const ingList = wrap.querySelector('#rf-ingredients');
      const idx = ingList.querySelectorAll('.rf-ing-row').length;
      ingList.insertAdjacentHTML('beforeend', ingredientRowHtml({ amount: '', name: '', notes: '' }, idx));
      bindIngredientRemove(wrap);
    });

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

      // Originals / new-recipe path (unchanged).
      const recipes = State.get('recipes') || {};
      const originals = recipes.originals || [];
      if (isEdit) {
        const idx = originals.findIndex(x => x.id === r.id);
        if (idx >= 0) originals[idx] = updated;
        else originals.push(updated);
      } else {
        originals.push(updated);
      }
      recipes.originals = originals;
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

  function ingredientRowHtml(ing, i) {
    return `
      <div class="rf-ing-row form-row" style="align-items:center;margin-bottom:6px;">
        <input class="rf-ing-amount" type="text" value="${Utils.escapeHtml(ing.amount || '')}" placeholder="2 oz" style="flex:0 0 90px;">
        <input class="rf-ing-name"   type="text" value="${Utils.escapeHtml(ing.name  || '')}" placeholder="Ingredient">
        <input class="rf-ing-notes"  type="text" value="${Utils.escapeHtml(ing.notes || '')}" placeholder="Notes (opt)" style="flex:0 0 160px;">
        <button type="button" class="btn-icon rf-ing-remove" title="Remove" style="flex:none;">✕</button>
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
