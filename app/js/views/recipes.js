// Recipe Browser view — card grid of originals + detail pane.

const RecipesView = (() => {

  function render(container, params = {}) {
    const recipes = State.get('recipes') || {};
    const originals = recipes.originals || [];
    const favorites = recipes.confirmed_favorites || [];
    const wishlist  = recipes.wishlist || [];

    container.innerHTML = `
      <div class="page-header">
        <h1>Recipe Book</h1>
        <p>${originals.length} original${originals.length !== 1 ? 's' : ''} · ${favorites.length} confirmed favorite${favorites.length !== 1 ? 's' : ''}</p>
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
    if (originals.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🍹</div>
          <p>No original cocktails yet.</p>
          <p style="font-size:0.85rem;color:var(--text-muted);">Design one with your AI bartender and it will appear here.</p>
        </div>`;
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

    const back = document.createElement('button');
    back.className = 'back-btn';
    back.innerHTML = `← Back to Recipes`;
    back.addEventListener('click', () => render(container));
    container.appendChild(back);

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

    container.appendChild(wrap);
  }

  return { render };
})();
