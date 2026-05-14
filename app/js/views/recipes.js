// Recipe Browser view — card grid of originals + detail pane.

const RecipesView = (() => {

  function render(container, params = {}) {
    const recipes = State.get('recipes') || {};
    const originals = recipes.originals || [];
    const favorites = recipes.confirmed_favorites || [];
    const wishlist  = recipes.wishlist || [];

    container.innerHTML = `
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
        <div>
          <h1>Recipe Book</h1>
          <p>${originals.length} original${originals.length !== 1 ? 's' : ''} · ${favorites.length} confirmed favorite${favorites.length !== 1 ? 's' : ''}</p>
        </div>
        <button class="btn btn-ghost btn-sm" id="rb-generate-ai" style="align-self:center;">✨ Generate with AI</button>
      </div>
      <div class="tabs">
        <div class="tab active" data-tab="originals">Originals (${originals.length})</div>
        <div class="tab" data-tab="favorites">Favorites (${favorites.length})</div>
        <div class="tab" data-tab="wishlist">Wishlist (${wishlist.length})</div>
      </div>
      <div id="recipe-tab-content"></div>`;

    const tabContent = container.querySelector('#recipe-tab-content');
    container.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderTab(tab.dataset.tab, recipes, tabContent);
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

    renderTab('originals', recipes, tabContent);

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

  function showAIPromptModal(container) {
    const { inventoryText, profileText, bkName, bkPreset } = buildPromptContext();

    const prompt = `You are ${bkName}, a ${bkPreset} bartender. Design a new original cocktail for my home bar.

My inventory:
${inventoryText}

My flavor profile: ${profileText}

Please provide:
- Name and tagline
- Creator attribution (format: "Original by ${bkName}")
- Full ingredient list with amounts (e.g. "2 oz Bourbon")
- Method (step-by-step instructions)
- Method type (shaken/stirred/built/blended/thrown/other)
- Glassware and garnish
- Flavor profile description
- Why it works (the reasoning behind the recipe)`.trim();

    const hasApiKey = !!localStorage.getItem('bb_anthropic_key');

    const overlay = document.createElement('div');
    overlay.className = 'confirm-dialog-overlay';
    overlay.innerHTML = `
      <div class="confirm-dialog" style="max-width:560px;width:90vw;">
        <h3 style="margin-bottom:8px;">Generate with AI</h3>
        ${hasApiKey
          ? `<p style="color:var(--amber-dim);font-size:0.85rem;margin-bottom:12px;">AI generation coming in a future update. Copy the prompt below to use with any AI assistant.</p>`
          : `<p style="color:var(--text-dim);font-size:0.85rem;margin-bottom:12px;">Copy this prompt and paste it into Claude, ChatGPT, or any AI assistant.</p>`}
        <textarea id="ai-prompt-text" rows="12"
          style="width:100%;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px;font-size:0.82rem;color:var(--text-dim);font-family:monospace;resize:vertical;"
          readonly>${Utils.escapeHtml(prompt)}</textarea>
        <div class="dialog-btns" style="margin-top:12px;">
          <button class="btn btn-ghost btn-sm" id="ai-close">Close</button>
          <button class="btn btn-primary btn-sm" id="ai-copy">Copy Prompt</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#ai-close').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#ai-copy').addEventListener('click', () => {
      navigator.clipboard.writeText(prompt).then(() => {
        const btn = overlay.querySelector('#ai-copy');
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = 'Copy Prompt'; }, 2000);
      });
    });
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  }

  function renderTab(tabName, recipes, container) {
    container.innerHTML = '';
    if (tabName === 'originals') {
      renderOriginalsGrid(recipes.originals || [], container);
    } else if (tabName === 'favorites') {
      renderFavoritesList(recipes.confirmed_favorites || [], container);
    } else if (tabName === 'wishlist') {
      renderWishlist(recipes.wishlist || [], container);
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

    if (originals.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = `
        <div class="empty-icon">🍹</div>
        <p>No original cocktails yet.</p>
        <p style="font-size:0.85rem;color:var(--text-muted);">Click "+ New Recipe" or "✨ Generate with AI" to create your first one.</p>`;
      container.appendChild(empty);
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'card-grid';

    originals.forEach(r => {
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

  function renderFavoritesList(favorites, container) {
    if (favorites.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⭐</div>
          <p>No confirmed favorites yet.</p>
        </div>`;
      return;
    }

    favorites.forEach(fav => {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.cursor = 'pointer';
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:start;gap:12px;">
          <div>
            <div style="font-size:1.05rem;color:var(--amber);margin-bottom:4px;">${Utils.escapeHtml(fav.name)}</div>
            ${fav.creator ? `<div style="font-size:0.82rem;color:var(--text-muted);">by ${Utils.escapeHtml(fav.creator)}</div>` : ''}
            ${fav.notes ? `<div style="font-size:0.88rem;color:var(--text-dim);margin-top:8px;font-style:italic;">${Utils.escapeHtml(fav.notes)}</div>` : ''}
          </div>
          ${fav.date_confirmed ? `<span style="font-size:0.78rem;color:var(--text-muted);white-space:nowrap;">${Utils.formatDate(fav.date_confirmed)}</span>` : ''}
        </div>
        ${fav.adaptation ? `<div style="margin-top:10px;font-size:0.85rem;background:var(--bg3);padding:8px 12px;border-radius:4px;color:var(--text-dim);">Adaptation: ${Utils.escapeHtml(fav.adaptation)}</div>` : ''}
        ${renderIngredientsCompact(fav.ingredients || [])}`;
      container.appendChild(card);
    });
  }

  function renderWishlist(wishlist, container) {
    if (wishlist.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <p>Wishlist is empty.</p>
        </div>`;
      return;
    }

    wishlist.forEach(item => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div style="font-size:1rem;color:var(--text);margin-bottom:6px;">${Utils.escapeHtml(item.name)}</div>
        ${item.ingredients_summary ? `<div style="font-size:0.88rem;color:var(--text-dim);">${Utils.escapeHtml(item.ingredients_summary)}</div>` : ''}
        ${item.pending ? `<div style="margin-top:8px;font-size:0.82rem;background:rgba(212,148,58,0.08);border:1px solid rgba(212,148,58,0.2);padding:6px 10px;border-radius:4px;color:var(--amber-dim);">⏳ Missing: ${Utils.escapeHtml(item.pending)}</div>` : ''}`;
      container.appendChild(card);
    });
  }

  function renderIngredientsCompact(ingredients) {
    if (!ingredients || ingredients.length === 0) return '';
    const items = ingredients.map(i =>
      `<span style="font-size:0.82rem;color:var(--text-dim);">${Utils.escapeHtml(i.amount)} ${Utils.escapeHtml(i.name)}</span>`
    ).join('<span style="color:var(--text-muted);margin:0 4px;">·</span>');
    return `<div style="margin-top:10px;">${items}</div>`;
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
    container.innerHTML = '';

    const back = document.createElement('button');
    back.className = 'back-btn';
    back.textContent = isEdit ? '← Back to Recipe' : '← Back to Recipes';
    back.addEventListener('click', () => {
      if (isEdit) renderDetail(r, container);
      else render(container);
    });
    container.appendChild(back);

    const wrap = document.createElement('div');
    wrap.style.cssText = 'max-width:680px;';

    const title = document.createElement('h2');
    title.textContent = isEdit ? `Edit: ${r.name}` : 'New Recipe';
    title.style.cssText = 'color:var(--amber);font-weight:normal;margin-bottom:20px;';
    wrap.appendChild(title);

    // AI prompt block — shown only for new recipes (D-12)
    const hasKey = !!localStorage.getItem('bb_anthropic_key');
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

      <div style="display:flex;gap:10px;margin-top:20px;">
        <button class="btn btn-primary" id="rf-save">${isEdit ? 'Save Changes' : 'Create Recipe'}</button>
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

    wrap.querySelector('#rf-cancel').addEventListener('click', () => {
      if (isEdit) renderDetail(r, container);
      else render(container);
    });

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

      const saveBtn = wrap.querySelector('#rf-save');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving…';

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
