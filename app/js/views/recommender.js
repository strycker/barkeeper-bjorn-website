// Cocktail Recommender view — shows buildable and one-away recipes
const RecommenderView = (() => {

  const BASE_FILTERS = [
    { label: 'All', value: '' },
    { label: 'Whiskey', value: 'whiskey' },
    { label: 'Rum', value: 'rum' },
    { label: 'Gin', value: 'gin' },
    { label: 'Vodka', value: 'vodka' },
    { label: 'Tequila / Mezcal', value: 'agave' },
    { label: 'Brandy', value: 'brandy' },
  ];

  let _activeFilter = '';
  let _activeTab = 'buildable'; // 'buildable' | 'oneaway'
  let _results = null;

  function _matchesFilter(recipe, filter) {
    if (!filter) return true;
    const base = (recipe.base || '').toLowerCase();
    if (filter === 'agave') return base.includes('tequila') || base.includes('mezcal') || base.includes('agave');
    if (filter === 'whiskey') return base.includes('whiskey') || base.includes('bourbon') || base.includes('rye') || base.includes('scotch') || base.includes('irish');
    return base.includes(filter);
  }

  function _difficultyLabel(d) {
    if (d === 1) return { label: 'Easy', cls: 'diff-easy' };
    if (d === 2) return { label: 'Medium', cls: 'diff-medium' };
    return { label: 'Advanced', cls: 'diff-hard' };
  }

  function _scoreBar(score) {
    const pct = Math.round(score * 100);
    const hue = Math.round(score * 120); // red→green
    return `<div class="score-bar-wrap" title="Flavor match: ${pct}%">
      <div class="score-bar-fill" style="width:${pct}%;background:hsl(${hue},60%,45%);"></div>
    </div>`;
  }

  function _renderCard(item, isOneAway) {
    const { recipe, flavorScore, missingIngredient } = item;
    const diff = _difficultyLabel(recipe.difficulty);
    return `
      <div class="rec-card ${isOneAway ? 'rec-card--oneaway' : ''}">
        <div class="rec-card-header">
          <div>
            <div class="rec-card-name">${Utils.escapeHtml(recipe.name)}</div>
            <div class="rec-card-meta">
              <span class="rec-base">${Utils.escapeHtml(recipe.base)}</span>
              <span class="rec-sep">·</span>
              <span class="rec-method">${Utils.escapeHtml(recipe.method)}</span>
              <span class="rec-sep">·</span>
              <span class="rec-diff ${diff.cls}">${diff.label}</span>
            </div>
          </div>
          <div class="rec-score">
            <div class="rec-score-label">Match</div>
            ${_scoreBar(flavorScore)}
            <div class="rec-score-pct">${Math.round(flavorScore * 100)}%</div>
          </div>
        </div>
        ${recipe.occasion ? `<p class="rec-occasion">${Utils.escapeHtml(recipe.occasion)}</p>` : ''}
        <div class="rec-ingredients">
          ${recipe.ingredients.map(i =>
            `<span class="rec-ing-chip">${Utils.escapeHtml(i.amount)} ${Utils.escapeHtml(i.name)}</span>`
          ).join('')}
          ${recipe.garnish ? `<span class="rec-ing-chip rec-garnish">+ ${Utils.escapeHtml(recipe.garnish)}</span>` : ''}
        </div>
        ${isOneAway ? `
          <div class="rec-oneaway-banner">
            <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path d="M10 2a8 8 0 1 0 0 16A8 8 0 0 0 10 2zm1 11H9v-2h2v2zm0-4H9V5h2v4z"/></svg>
            One bottle away: <strong>${Utils.escapeHtml(missingIngredient.name)}</strong>
          </div>` : ''}
        <div class="rec-glass">Glass: ${Utils.escapeHtml(recipe.glassware)}</div>
      </div>`;
  }

  function _renderList(items, isOneAway, filter) {
    const filtered = items.filter(it => _matchesFilter(it.recipe, filter));
    if (filtered.length === 0) {
      return `<div class="rec-empty">
        <p>No ${isOneAway ? 'near-miss' : 'buildable'} cocktails${filter ? ' for that spirit' : ''}.</p>
        ${!isOneAway ? '<p style="font-size:0.85rem;color:var(--text-muted);">Try adding more bottles to your inventory.</p>' : ''}
      </div>`;
    }
    return filtered.map(it => _renderCard(it, isOneAway)).join('');
  }

  function _attach(container) {
    // Tab switching
    container.querySelectorAll('.rec-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        _activeTab = btn.dataset.tab;
        _rerender(container);
      });
    });

    // Filter chips
    container.querySelectorAll('.rec-filter-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        _activeFilter = btn.dataset.filter;
        _rerender(container);
      });
    });
  }

  function _rerender(container) {
    const listEl = container.querySelector('#rec-list');
    if (!listEl || !_results) return;

    // Update tabs
    container.querySelectorAll('.rec-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === _activeTab);
    });

    // Update filter chips
    container.querySelectorAll('.rec-filter-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.filter === _activeFilter);
    });

    const isOneAway = _activeTab === 'oneaway';
    const items = isOneAway ? _results.oneAway : _results.buildable;
    listEl.innerHTML = _renderList(items, isOneAway, _activeFilter);
  }

  function render(container) {
    const inventory = State.get('inventory') || {};
    const profile   = State.get('profile')   || {};
    const isNew     = State.isNewUser();

    container.innerHTML = '';

    if (isNew) {
      container.innerHTML = `
        <div class="rec-splash">
          <h2>Cocktail Recommender</h2>
          <p>Complete onboarding first so I know your inventory and taste preferences.</p>
          <a href="#onboarding" class="btn btn-primary">Start Setup →</a>
        </div>`;
      return;
    }

    // Run the engine
    _results = RecommenderEngine.recommend(inventory, profile);
    const buildCount = _results.buildable.length;
    const oneAwayCount = _results.oneAway.length;

    container.innerHTML = `
      <div class="rec-root">
        <div class="rec-header">
          <h2>Cocktail Recommender</h2>
          <p class="rec-subtitle">Based on your inventory and flavor profile.</p>
        </div>

        <div class="rec-tabs">
          <button class="rec-tab ${_activeTab === 'buildable' ? 'active' : ''}" data-tab="buildable">
            You Can Make These
            <span class="rec-badge">${buildCount}</span>
          </button>
          <button class="rec-tab ${_activeTab === 'oneaway' ? 'active' : ''}" data-tab="oneaway">
            One Bottle Away
            <span class="rec-badge">${oneAwayCount}</span>
          </button>
        </div>

        <div class="rec-filters">
          ${BASE_FILTERS.map(f => `
            <button class="rec-filter-chip ${_activeFilter === f.value ? 'active' : ''}" data-filter="${f.value}">
              ${Utils.escapeHtml(f.label)}
            </button>`).join('')}
        </div>

        <div id="rec-list" class="rec-list">
          ${_renderList(
            _activeTab === 'buildable' ? _results.buildable : _results.oneAway,
            _activeTab === 'oneaway',
            _activeFilter
          )}
        </div>
      </div>`;

    _attach(container);
  }

  return { render };
})();
