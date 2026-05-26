// Cocktail Recommender view — shows buildable, one-away, and two-away recipes
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

  const AXIS_KEYS = ['sweetness', 'acid', 'strength', 'complexity', 'season', 'risk'];
  const AXIS_POLES = {
    sweetness:  { left: 'Dry',    right: 'Sweet',       label: 'Sweetness' },
    acid:       { left: 'Low',    right: 'High',         label: 'Acidity' },
    strength:   { left: 'Light',  right: 'Strong',       label: 'Strength' },
    complexity: { left: 'Simple', right: 'Complex',      label: 'Complexity' },
    season:     { left: 'Summer', right: 'Winter',       label: 'Season' },
    risk:       { left: 'Safe',   right: 'Adventurous',  label: 'Risk' },
  };

  let _activeFilter = '';
  let _activeTab = 'buildable'; // 'buildable' | 'oneaway' — retained for compat
  let _results = null;

  // New module-level state (wave 2)
  let _scopeLevel = 0;           // 0 | 1 | 2 | 3 (3 = Unconstrained)
  let _activeOccasions = new Set(); // tag strings; empty = show all
  let _sliderValues = {};        // { sweetness: 0.5, acid: 0.5, ... } — ephemeral, reset on render()
  let _savedSliderValues = {};   // snapshot of profile values at render() time, for Reset to saved
  let _slidersVisible = false;   // mobile toggle state
  let _vetoOverrides = new Set(); // session-only; veto strings bypassed for this session
  let _searchQuery = '';         // instant text search across all sections

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
    const { recipe, flavorScore, missingIngredient, missingIngredients } = item;
    const diff = _difficultyLabel(recipe.difficulty);
    const savedRecipes = State.get('recipes') || {};
    const isFav  = (savedRecipes.confirmed_favorites || []).some(r => Utils.sameRecipe(r, recipe));
    const isWish = (savedRecipes.wishlist || []).some(r => Utils.sameRecipe(r, recipe));
    const isMade = (savedRecipes.made_log || []).some(r => Utils.sameRecipe(r, recipe));
    return `
      <div class="rec-card ${isOneAway ? 'rec-card--oneaway' : ''}">
        <div class="rec-card-header">
          <div style="flex:1;min-width:0;">
            <div class="rec-card-name">${Utils.escapeHtml(recipe.name)}</div>
            <div class="rec-card-meta">
              <span class="rec-base">${Utils.escapeHtml(recipe.base)}</span>
              <span class="rec-sep">·</span>
              <span class="rec-method">${Utils.escapeHtml(recipe.method)}</span>
              <span class="rec-sep">·</span>
              <span class="rec-diff ${diff.cls}">${diff.label}</span>
              ${recipe._source === 'originals' ? '<span class="rec-original-badge">Your original</span>' : ''}
            </div>
          </div>
          <div class="rec-score">
            <div class="rec-score-label">Match</div>
            ${_scoreBar(flavorScore)}
            <div class="rec-score-pct">${Math.round(flavorScore * 100)}%</div>
          </div>
          <div class="rec-card-actions">
            <button class="rec-fav-btn${isFav ? ' active' : ''}" data-name="${Utils.escapeHtml(recipe.name)}" data-base="${Utils.escapeHtml(recipe.base || '')}" title="${isFav ? 'Remove from Favorites' : 'Add to Favorites'}">${isFav ? '&#9829;' : '&#9825;'}</button>
            <button class="rec-wish-btn${isWish ? ' active' : ''}" data-name="${Utils.escapeHtml(recipe.name)}" data-base="${Utils.escapeHtml(recipe.base || '')}" title="${isWish ? 'Remove from Wishlist' : 'Add to Wishlist'}">${isWish ? '&#9733;' : '&#9734;'}</button>
            <button class="rec-made-btn${isMade ? ' active' : ''}" data-name="${Utils.escapeHtml(recipe.name)}" data-base="${Utils.escapeHtml(recipe.base || '')}" title="${isMade ? 'Remove from Made' : 'I Made This'}">${isMade ? '&#10003;' : '&#9675;'}</button>
            <button class="rec-ask-btn ai-ask-btn" data-ask-name="${Utils.escapeHtml(recipe.name)}" data-ask-base="${Utils.escapeHtml(recipe.base || '')}" title="Ask Bjorn about this">Ask Bjorn</button>
          </div>
        </div>
        ${recipe.occasion ? `<p class="rec-occasion">${Utils.escapeHtml(recipe.occasion)}</p>` : ''}
        <div class="rec-ingredients">
          ${recipe.ingredients.map(i =>
            `<span class="rec-ing-chip">${Utils.escapeHtml(i.amount)} ${Utils.escapeHtml(i.name)}</span>`
          ).join('')}
          ${recipe.garnish ? `<span class="rec-ing-chip rec-garnish">+ ${Utils.escapeHtml(recipe.garnish)}</span>` : ''}
        </div>
        ${isOneAway && missingIngredient ? `
          <div class="rec-twoaway-missing">
            <span class="rec-twoaway-label">One bottle away:</span>
            <strong>${Utils.escapeHtml(missingIngredient.name)}</strong>
            <button class="rec-twoaway-link" data-item="${Utils.escapeHtml(missingIngredient.name)}">Add to shopping list &#8594;</button>
          </div>` : ''}
        ${!isOneAway && missingIngredients && missingIngredients.length > 0 ? `
          <div class="rec-missing-info">
            <span class="rec-missing-label">Not in your bar:</span>
            ${missingIngredients.map(m => `
              <span class="rec-missing-item">${Utils.escapeHtml(m.name)}</span>
              <button class="rec-twoaway-link" data-item="${Utils.escapeHtml(m.name)}">Add &#8594;</button>
            `).join('')}
          </div>` : ''}
        <div class="rec-glass">Glass: ${Utils.escapeHtml(recipe.glassware)}</div>
      </div>`;
  }

  function _renderTwoAwayCard(item) {
    const { recipe, flavorScore, missingIngredients } = item;
    const diff = _difficultyLabel(recipe.difficulty);
    const missing0 = missingIngredients[0];
    const missing1 = missingIngredients[1];
    const savedRecipes = State.get('recipes') || {};
    const isFav  = (savedRecipes.confirmed_favorites || []).some(r => Utils.sameRecipe(r, recipe));
    const isWish = (savedRecipes.wishlist || []).some(r => Utils.sameRecipe(r, recipe));
    const isMade = (savedRecipes.made_log || []).some(r => Utils.sameRecipe(r, recipe));
    return `
      <div class="rec-card rec-card--twoaway">
        <div class="rec-card-header">
          <div style="flex:1;min-width:0;">
            <div class="rec-card-name">${Utils.escapeHtml(recipe.name)}</div>
            <div class="rec-card-meta">
              <span class="rec-base">${Utils.escapeHtml(recipe.base)}</span>
              <span class="rec-sep">·</span>
              <span class="rec-method">${Utils.escapeHtml(recipe.method)}</span>
              <span class="rec-sep">·</span>
              <span class="rec-diff ${diff.cls}">${diff.label}</span>
              ${recipe._source === 'originals' ? '<span class="rec-original-badge">Your original</span>' : ''}
            </div>
          </div>
          <div class="rec-score">
            <div class="rec-score-label">Match</div>
            ${_scoreBar(flavorScore)}
            <div class="rec-score-pct">${Math.round(flavorScore * 100)}%</div>
          </div>
          <div class="rec-card-actions">
            <button class="rec-fav-btn${isFav ? ' active' : ''}" data-name="${Utils.escapeHtml(recipe.name)}" data-base="${Utils.escapeHtml(recipe.base || '')}" title="${isFav ? 'Remove from Favorites' : 'Add to Favorites'}">${isFav ? '&#9829;' : '&#9825;'}</button>
            <button class="rec-wish-btn${isWish ? ' active' : ''}" data-name="${Utils.escapeHtml(recipe.name)}" data-base="${Utils.escapeHtml(recipe.base || '')}" title="${isWish ? 'Remove from Wishlist' : 'Add to Wishlist'}">${isWish ? '&#9733;' : '&#9734;'}</button>
            <button class="rec-made-btn${isMade ? ' active' : ''}" data-name="${Utils.escapeHtml(recipe.name)}" data-base="${Utils.escapeHtml(recipe.base || '')}" title="${isMade ? 'Remove from Made' : 'I Made This'}">${isMade ? '&#10003;' : '&#9675;'}</button>
            <button class="rec-ask-btn ai-ask-btn" data-ask-name="${Utils.escapeHtml(recipe.name)}" data-ask-base="${Utils.escapeHtml(recipe.base || '')}" title="Ask Bjorn about this">Ask Bjorn</button>
          </div>
        </div>
        ${recipe.occasion ? `<p class="rec-occasion">${Utils.escapeHtml(recipe.occasion)}</p>` : ''}
        <div class="rec-ingredients">
          ${recipe.ingredients.map(i =>
            `<span class="rec-ing-chip">${Utils.escapeHtml(i.amount)} ${Utils.escapeHtml(i.name)}</span>`
          ).join('')}
          ${recipe.garnish ? `<span class="rec-ing-chip rec-garnish">+ ${Utils.escapeHtml(recipe.garnish)}</span>` : ''}
        </div>
        <div class="rec-twoaway-missing">
          <span style="color:var(--amber);">${missing0 ? Utils.escapeHtml(missing0.name) : ''}</span>
          ${missing0 ? `<button class="rec-twoaway-link" data-item="${Utils.escapeHtml(missing0.name)}">Add to shopping list &#8594;</button>` : ''}
        </div>
        <div class="rec-twoaway-missing">
          <span style="color:var(--amber);">${missing1 ? Utils.escapeHtml(missing1.name) : ''}</span>
          ${missing1 ? `<button class="rec-twoaway-link" data-item="${Utils.escapeHtml(missing1.name)}">Add to shopping list &#8594;</button>` : ''}
        </div>
        <div class="rec-glass">Glass: ${Utils.escapeHtml(recipe.glassware)}</div>
      </div>`;
  }

  // Helper: extract 0-1 numeric values from profile axes
  function _getInitialSliderValues(profile) {
    const POS_MAP = { 'Strong A': 0, 'Lean A': 0.25, 'Middle': 0.5, 'Lean B': 0.75, 'Strong B': 1 };
    const axes = profile && profile.flavor_profile && profile.flavor_profile.axes;
    const out = {};
    for (const k of AXIS_KEYS) {
      const pos = axes && axes[k] && axes[k].position;
      if (pos != null) {
        out[k] = typeof pos === 'number' ? pos : (POS_MAP[pos] ?? 0.5);
      } else {
        out[k] = 0.5;
      }
    }
    return out;
  }

  // Helper: construct ephemeral profile for engine re-ranking
  function _buildOverrideProfile(baseProfile) {
    const clone = JSON.parse(JSON.stringify(baseProfile || {}));
    if (!clone.flavor_profile) clone.flavor_profile = { axes: {} };
    if (!clone.flavor_profile.axes) clone.flavor_profile.axes = {};
    for (const k of AXIS_KEYS) {
      if (_sliderValues[k] != null) {
        if (!clone.flavor_profile.axes[k]) clone.flavor_profile.axes[k] = {};
        clone.flavor_profile.axes[k].position = _sliderValues[k];
      }
    }
    return clone;
  }

  // Helper: derive occasion tags from CLASSICS_DB
  function _getOccasionTags() {
    const db = (typeof CLASSICS_DB !== 'undefined') ? CLASSICS_DB : [];
    return [...new Set(db.flatMap(r => r.tags ?? []))].sort();
  }

  // Helper: add missing ingredient to shopping list and save immediately
  function addToShoppingList(itemName) {
    State.patch('inventory', inv => {
      if (!Array.isArray(inv.shopping_list)) inv.shopping_list = [];
      const already = inv.shopping_list.some(e =>
        e.item.toLowerCase() === itemName.toLowerCase()
      );
      if (!already) {
        inv.shopping_list.push({ item: itemName, rationale: 'one-away recommendation' });
      }
    });
    State.save('inventory').then(() => Utils.showToast('Added to shopping list'));
  }

  function _rerender(container) {
    const cardsEl = container.querySelector('.rec-main .rec-cards');
    if (!cardsEl || !_results) return;

    // Update base-spirit filter chips
    container.querySelectorAll('.rec-filter-chip[data-filter]').forEach(c => {
      c.classList.toggle('active', c.dataset.filter === _activeFilter);
    });

    // Update scope buttons (cumulative: all buttons <= current level are active)
    container.querySelectorAll('.rec-scope-btn').forEach(btn => {
      btn.classList.toggle('active', Number(btn.dataset.scope) <= _scopeLevel);
    });

    // Update occasion chips
    container.querySelectorAll('.rec-occ-chip').forEach(c => {
      if (c.dataset.tag === '__all__') {
        c.classList.toggle('active', _activeOccasions.size === 0);
      } else {
        c.classList.toggle('active', _activeOccasions.has(c.dataset.tag));
      }
    });

    // Apply occasion + base-spirit + text search filter to each result set
    function applyFilters(items) {
      const q = _searchQuery.toLowerCase().trim();
      return items.filter(it => {
        if (!_matchesFilter(it.recipe, _activeFilter)) return false;
        if (_activeOccasions.size > 0 && !(it.recipe.tags || []).some(t => _activeOccasions.has(t))) return false;
        if (!q) return true;
        const r = it.recipe;
        if ((r.name || '').toLowerCase().includes(q)) return true;
        if ((r.base || '').toLowerCase().includes(q)) return true;
        if ((r.ingredients || []).some(i => (i.name || '').toLowerCase().includes(q))) return true;
        return false;
      });
    }

    const buildable = applyFilters(_results.buildable);
    const oneAway   = applyFilters(_results.oneAway);
    const twoAway   = applyFilters(_results.twoAway || []);

    const noMatchMsg = `<div class="rec-empty"><p>No cocktails match your current filters.</p><p><button class="rec-clear-filters btn btn-ghost btn-sm">Clear filters</button></p></div>`;

    let html = '';

    // Level 0 — "You Can Make These"
    html += `<h3 class="rec-section-heading">You Can Make These <span class="rec-badge">${buildable.length}</span></h3>`;
    if (buildable.length === 0) {
      html += noMatchMsg;
    } else {
      html += buildable.map(it => _renderCard(it, false)).join('');
    }

    // Level 1 — "One Bottle Away" (cumulative: shown when scope >= 1)
    if (_scopeLevel >= 1) {
      html += `<h3 class="rec-section-heading rec-section-heading--oneaway">One Bottle Away <span class="rec-badge">${oneAway.length}</span></h3>`;
      if (oneAway.length === 0) {
        html += `<div class="rec-empty"><p>No near-miss cocktails for your current filters.</p></div>`;
      } else {
        html += oneAway.map(it => _renderCard(it, true)).join('');
      }
    }

    // Level 2 — "Two Bottles Away" (cumulative: shown when scope >= 2)
    if (_scopeLevel >= 2) {
      html += `<h3 class="rec-section-heading rec-section-heading--twoaway">Two Bottles Away <span class="rec-badge">${twoAway.length}</span></h3>`;
      if (twoAway.length === 0) {
        html += `<div class="rec-empty"><p>No two-bottle opportunities found.</p></div>`;
      } else {
        html += twoAway.map(it => _renderTwoAwayCard(it)).join('');
      }
    }

    cardsEl.innerHTML = html;

    // Wire "Add to shopping list" buttons in one-away and two-away cards
    cardsEl.querySelectorAll('.rec-twoaway-link').forEach(btn => {
      btn.addEventListener('click', () => addToShoppingList(btn.dataset.item));
    });

    // Wire "Clear filters" buttons
    cardsEl.querySelectorAll('.rec-clear-filters').forEach(btn => {
      btn.addEventListener('click', () => {
        _activeFilter = '';
        _activeOccasions = new Set();
        _rerender(container);
      });
    });

    // Wire "Ask Bjorn about this" buttons — REC-04 / AI-04 (seed drawer)
    cardsEl.querySelectorAll('.rec-ask-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (typeof ChatView === 'undefined' || !ChatView.openDrawer) {
          Utils.showToast('Chat module not loaded.', 'error');
          return;
        }
        const recipeName = btn.dataset.askName || '';
        const recipeBase = btn.dataset.askBase || '';
        // Build mood snippet from current slider values (ephemeral mood floats).
        const moodBits = AXIS_KEYS
          .map(k => {
            const v = _sliderValues[k];
            if (typeof v !== 'number') return null;
            return `${k}:${v.toFixed(2)}`;
          })
          .filter(Boolean)
          .join(', ');
        const seed =
          `Tell me about the ${recipeName}${recipeBase ? ` (${recipeBase})` : ''}. ` +
          `Would it suit my taste, and what variations would you suggest given my bar?` +
          (moodBits ? `\n\n(Current mood floats: ${moodBits}.)` : '');
        ChatView.openDrawer({ seed });
      });
    });

    // Wire ♥ Favorites toggle buttons — click toggles add/remove
    cardsEl.querySelectorAll('.rec-fav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const recipeName = btn.dataset.name;
        const allItems = [
          ...(_results?.buildable || []),
          ...(_results?.oneAway  || []),
          ...(_results?.twoAway  || []),
        ];
        const recipeBase = btn.dataset.base || '';
        const probe = { name: recipeName, base: recipeBase };
        const item = allItems.find(r => Utils.sameRecipe(r.recipe, probe));
        const isFav = (State.get('recipes')?.confirmed_favorites || []).some(r => Utils.sameRecipe(r, probe));
        if (isFav) {
          State.patch('recipes', r => { r.confirmed_favorites = (r.confirmed_favorites || []).filter(f => !Utils.sameRecipe(f, probe)); });
          State.save('recipes').then(() => { Utils.showToast('Removed from Favorites'); _rerender(container); });
        } else {
          if (!item) return;
          State.patch('recipes', r => {
            r.confirmed_favorites = r.confirmed_favorites || [];
            r.confirmed_favorites.push({ ...item.recipe, _source: item.recipe._source || 'classics-db' });
          });
          State.save('recipes').then(() => { Utils.showToast('Added to Favorites ♥'); _rerender(container); });
        }
      });
    });

    // Wire ☆ Wishlist toggle buttons — click toggles add/remove
    cardsEl.querySelectorAll('.rec-wish-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const recipeName = btn.dataset.name;
        const allItems = [
          ...(_results?.buildable || []),
          ...(_results?.oneAway  || []),
          ...(_results?.twoAway  || []),
        ];
        const recipeBase = btn.dataset.base || '';
        const probe = { name: recipeName, base: recipeBase };
        const item = allItems.find(r => Utils.sameRecipe(r.recipe, probe));
        const isWish = (State.get('recipes')?.wishlist || []).some(r => Utils.sameRecipe(r, probe));
        if (isWish) {
          State.patch('recipes', r => { r.wishlist = (r.wishlist || []).filter(w => !Utils.sameRecipe(w, probe)); });
          State.save('recipes').then(() => { Utils.showToast('Removed from Wishlist'); _rerender(container); });
        } else {
          if (!item) return;
          State.patch('recipes', r => {
            r.wishlist = r.wishlist || [];
            r.wishlist.push({ ...item.recipe, _source: item.recipe._source || 'classics-db' });
          });
          State.save('recipes').then(() => { Utils.showToast('Added to Wishlist ★'); _rerender(container); });
        }
      });
    });

    // Wire ✓ Made toggle buttons — click toggles add/remove
    cardsEl.querySelectorAll('.rec-made-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const recipeName = btn.dataset.name;
        const allItems = [
          ...(_results?.buildable || []),
          ...(_results?.oneAway  || []),
          ...(_results?.twoAway  || []),
        ];
        const recipeBase = btn.dataset.base || '';
        const probe = { name: recipeName, base: recipeBase };
        const item = allItems.find(r => Utils.sameRecipe(r.recipe, probe));
        const isMade = (State.get('recipes')?.made_log || []).some(r => Utils.sameRecipe(r, probe));
        if (isMade) {
          State.patch('recipes', r => { r.made_log = (r.made_log || []).filter(m => !Utils.sameRecipe(m, probe)); });
          State.save('recipes').then(() => { Utils.showToast('Removed from Made'); _rerender(container); });
        } else {
          if (!item) return;
          const today = new Date().toISOString().slice(0, 10);
          State.patch('recipes', r => {
            r.made_log = r.made_log || [];
            r.made_log.unshift({ ...item.recipe, _source: item.recipe._source || 'classics-db', times_made: 1, first_made: today, last_made: today, notes: '' });
          });
          State.save('recipes').then(() => { Utils.showToast('Marked as made ✓'); _rerender(container); });
        }
      });
    });
  }

  function _attach(container) {
    const profile = State.get('profile') || {};

    // Base-spirit filter chips
    container.querySelectorAll('.rec-filter-chip[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        _activeFilter = btn.dataset.filter;
        _rerender(container);
      });
    });

    // Scope buttons — change level, re-run engine, re-render
    container.querySelectorAll('.rec-scope-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        _scopeLevel = Number(btn.dataset.scope);
        const inv = State.get('inventory') || {};
        const overrideProfile = _buildOverrideProfile(profile);
        _results = RecommenderEngine.recommend(inv, overrideProfile, { scope: _scopeLevel, ignoreVetoes: _vetoOverrides, specialty: State.get('barkeeper')?.personality?.specialty || '', originals: State.get('recipes')?.originals || [] });
        _rerender(container);
      });
    });

    // Veto override chips — toggle per-session bypass, re-run engine
    container.querySelectorAll('.rec-veto-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const v = btn.dataset.veto;
        if (_vetoOverrides.has(v)) _vetoOverrides.delete(v); else _vetoOverrides.add(v);
        const inv = State.get('inventory') || {};
        const overrideProfile = _buildOverrideProfile(profile);
        _results = RecommenderEngine.recommend(inv, overrideProfile, { scope: _scopeLevel, ignoreVetoes: _vetoOverrides, specialty: State.get('barkeeper')?.personality?.specialty || '', originals: State.get('recipes')?.originals || [] });
        _rerender(container);
        // Update chip visual state
        btn.classList.toggle('bypassed', _vetoOverrides.has(v));
      });
    });

    // Occasion chips
    container.querySelectorAll('.rec-occ-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const tag = btn.dataset.tag;
        if (tag === '__all__') {
          _activeOccasions = new Set();
        } else {
          if (_activeOccasions.has(tag)) {
            _activeOccasions.delete(tag);
          } else {
            _activeOccasions.add(tag);
          }
        }
        _rerender(container);
      });
    });

    // Mood sliders — re-rank on change (release), not on drag (D-14)
    container.querySelectorAll('.rec-axis-slider').forEach(input => {
      input.addEventListener('change', () => {
        _sliderValues[input.dataset.axis] = parseFloat(input.value);
        const inv = State.get('inventory') || {};
        const overrideProfile = _buildOverrideProfile(profile);
        _results = RecommenderEngine.recommend(inv, overrideProfile, { scope: _scopeLevel, ignoreVetoes: _vetoOverrides, specialty: State.get('barkeeper')?.personality?.specialty || '', originals: State.get('recipes')?.originals || [] });
        _rerender(container);
      });
    });

    // Save to Profile button
    const saveBtn = container.querySelector('.rec-mood-save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        State.patch('profile', p => {
          if (!p.flavor_profile) p.flavor_profile = { axes: {} };
          if (!p.flavor_profile.axes) p.flavor_profile.axes = {};
          for (const k of AXIS_KEYS) {
            const v = _sliderValues[k] ?? 0.5;
            if (!p.flavor_profile.axes[k]) p.flavor_profile.axes[k] = {};
            // Store numeric value — _normalizeProfile handles both numbers and strings
            p.flavor_profile.axes[k].position = v;
          }
        });
        State.save('profile').then(() => {
          _savedSliderValues = { ..._sliderValues };
          Utils.showToast('Profile updated ✓');
        });
      });
    }

    // Reset to saved link
    const resetLink = container.querySelector('.rec-mood-reset');
    if (resetLink) {
      resetLink.addEventListener('click', e => {
        e.preventDefault();
        _sliderValues = { ..._savedSliderValues };
        // Update slider DOM values
        container.querySelectorAll('.rec-axis-slider').forEach(input => {
          input.value = _sliderValues[input.dataset.axis] ?? 0.5;
        });
        const inv = State.get('inventory') || {};
        const overrideProfile = _buildOverrideProfile(profile);
        _results = RecommenderEngine.recommend(inv, overrideProfile, { scope: _scopeLevel, ignoreVetoes: _vetoOverrides, specialty: State.get('barkeeper')?.personality?.specialty || '', originals: State.get('recipes')?.originals || [] });
        _rerender(container);
      });
    }

    // Text search (REC-SEARCH-01)
    const searchInput = container.querySelector('#rec-search');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        _searchQuery = searchInput.value;
        _rerender(container);
      });
    }

    // Mobile mood toggle (D-21)
    const moodToggle = container.querySelector('.mood-toggle-btn');
    const slidersPanel = container.querySelector('.rec-mood-sliders-inner');
    if (moodToggle && slidersPanel) {
      moodToggle.addEventListener('click', () => {
        _slidersVisible = !_slidersVisible;
        slidersPanel.classList.toggle('is-open', _slidersVisible);
        moodToggle.textContent = _slidersVisible ? 'Hide Sliders ▴' : 'Adjust Mood ▾';
      });
    }
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

    // Reset ephemeral state on every render (D-15: no sessionStorage persistence)
    _sliderValues = _getInitialSliderValues(profile);
    _savedSliderValues = { ..._sliderValues };
    _slidersVisible = false;
    _vetoOverrides = new Set(); // D-05: silent reset on navigation — vetoes fully enforced on re-entry
    // Do NOT reset _scopeLevel, _activeFilter, or _activeOccasions —
    // these are user-interaction state that persist within the session.

    // Run engine with saved profile
    _results = RecommenderEngine.recommend(inventory, profile, { scope: _scopeLevel, ignoreVetoes: _vetoOverrides, specialty: State.get('barkeeper')?.personality?.specialty || '', originals: State.get('recipes')?.originals || [] });

    const occasionTags = _getOccasionTags();

    // Build slider HTML (6 axes)
    const slidersHtml = AXIS_KEYS.map(k => {
      const poles = AXIS_POLES[k];
      const val = _sliderValues[k] ?? 0.5;
      return `
        <div class="rec-axis-row">
          <div class="rec-axis-label">${Utils.escapeHtml(poles.label)}</div>
          <div class="rec-axis-pole-row">
            <span class="axis-pole-label--left">${Utils.escapeHtml(poles.left)}</span>
            <input type="range" class="axis-slider rec-axis-slider" data-axis="${k}"
              min="0" max="1" step="0.05" value="${val}">
            <span class="axis-pole-label--right">${Utils.escapeHtml(poles.right)}</span>
          </div>
        </div>`;
    }).join('');

    // Build occasion chips HTML (empty section hidden if no tags)
    const occasionChipsHtml = occasionTags.length === 0 ? '' : `
      <div class="rec-sidebar-section">
        <div class="rec-occasion-heading">Occasions</div>
        <div class="rec-occ-chips">
          <button class="rec-occ-chip rec-filter-chip ${_activeOccasions.size === 0 ? 'active' : ''}" data-tag="__all__">All</button>
          ${occasionTags.map(t => `
            <button class="rec-occ-chip rec-filter-chip ${_activeOccasions.has(t) ? 'active' : ''}" data-tag="${Utils.escapeHtml(t)}">${Utils.escapeHtml(t)}</button>
          `).join('')}
        </div>
      </div>`;

    // Build vetoes panel HTML (REC-07, D-03–D-06)
    const vetoList = (State.get('inventory')?.vetoes?.disliked_ingredients || []);
    let vetoesHtml = '';
    if (vetoList.length === 0) {
      vetoesHtml = `
        <div class="rec-sidebar-section">
          <p class="rec-empty-hint" style="font-size:0.82rem;color:var(--text-muted);margin:0;">No vetoes configured &mdash; add them in Inventory &rarr; Vetoes.</p>
        </div>`;
    } else {
      vetoesHtml = `
        <div class="rec-sidebar-section">
          <div class="rec-sidebar-heading rec-occasion-heading">Vetoes</div>
          <div class="rec-veto-chips">
            ${vetoList.map(v => {
              const bypassed = _vetoOverrides.has(v);
              return `<button class="rec-filter-chip rec-veto-chip${bypassed ? ' bypassed' : ''}" data-veto="${Utils.escapeHtml(v)}">${Utils.escapeHtml(v)}</button>`;
            }).join('')}
          </div>
        </div>`;
    }

    // Build base-spirit chips HTML
    const baseSpiritChipsHtml = `
      <div class="rec-sidebar-section">
        <div class="rec-occasion-heading">Spirit</div>
        <div class="rec-filters">
          ${BASE_FILTERS.map(f => `
            <button class="rec-filter-chip ${_activeFilter === f.value ? 'active' : ''}" data-filter="${Utils.escapeHtml(f.value)}">
              ${Utils.escapeHtml(f.label)}
            </button>`).join('')}
        </div>
      </div>`;

    // Build scope toggle HTML (REC-05, REC-06, D-07, D-08)
    const scopeHtml = `
      <div class="rec-sidebar-section">
        <div class="rec-occasion-heading">Scope</div>
        <div class="rec-scope-toggle">
          <button class="rec-scope-btn ${_scopeLevel >= 0 ? 'active' : ''}" data-scope="0">Only what I have</button>
          <button class="rec-scope-btn ${_scopeLevel >= 1 ? 'active' : ''}" data-scope="1">Allow 1 missing</button>
          <button class="rec-scope-btn ${_scopeLevel >= 2 ? 'active' : ''}" data-scope="2">Allow 2 missing</button>
          <button class="rec-scope-btn rec-scope-btn--unconstrained ${_scopeLevel === 3 ? 'active' : ''}" data-scope="3">Unconstrained</button>
        </div>
      </div>`;

    // Full two-column layout HTML (D-20, D-21)
    container.innerHTML = `
      <div class="rec-root">
        <div class="rec-header">
          <h2>Cocktail Recommender</h2>
          <p class="rec-subtitle">Based on your inventory and flavor profile.</p>
        </div>
        <div class="rec-layout">
          <aside class="rec-sidebar">
            <div class="rec-mood-panel rec-sidebar-section">
              <div class="rec-mood-heading">Mood</div>
              <!-- Mobile-only toggle (hidden on desktop via CSS) -->
              <button class="mood-toggle-btn btn btn-secondary btn-sm">Adjust Mood &#9662;</button>
              <!-- Sliders inner wrapper — hidden on mobile until toggle clicked -->
              <div class="rec-mood-sliders-inner">
                ${slidersHtml}
              </div>
              <div class="rec-mood-save">
                <button class="rec-mood-save-btn btn btn-primary btn-sm">Save to Profile</button>
                <a href="#" class="rec-mood-reset">Reset to saved</a>
              </div>
            </div>
            ${scopeHtml}
            ${baseSpiritChipsHtml}
            ${occasionChipsHtml}
            ${vetoesHtml}
          </aside>
          <main class="rec-main">
            <div class="rec-search-wrap">
              <input type="search" class="rec-search-input" id="rec-search" placeholder="Search cocktails by name, spirit, or ingredient…" value="${Utils.escapeHtml(_searchQuery)}">
            </div>
            <div class="rec-cards">
              <!-- Populated by _rerender -->
            </div>
          </main>
        </div>
      </div>`;

    _attach(container);
    _rerender(container);
  }

  return { render };
})();
