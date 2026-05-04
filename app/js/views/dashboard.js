// Dashboard / session-start menu view

const DashboardView = (() => {

  function render(container) {
    const barkeeper = State.get('barkeeper') || {};
    const profile   = State.get('profile')   || {};
    const inventory = State.get('inventory') || {};
    const recipes   = State.get('recipes')   || {};

    const name       = profile.identity?.preferred_name || profile.identity?.full_name || 'there';
    const bjornName  = barkeeper.identity?.name || 'Barkeeper Bjorn';
    const originals  = (recipes.originals || []).length;
    const bottleCount = Utils.countInventoryItems(inventory);
    const shopping   = (inventory.shopping_list || []).length;
    const isNew      = State.isNewUser();

    container.innerHTML = '';

    if (isNew) {
      container.innerHTML = `
        <div style="max-width:540px;margin:40px auto;text-align:center;">
          <svg style="width:60px;height:60px;color:var(--amber);margin-bottom:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 2l-1 7H5a1 1 0 0 0-1 1v1a5 5 0 0 0 5 5h6a5 5 0 0 0 5-5v-1a1 1 0 0 0-1-1h-2L16 2z"/>
            <path d="M12 15v7"/><path d="M8 22h8"/>
          </svg>
          <h1 style="font-size:1.8rem;margin-bottom:8px;">Welcome.</h1>
          <p style="color:var(--text-dim);max-width:400px;margin:0 auto 28px;">
            I'm ${Utils.escapeHtml(bjornName)}. Let's set up your bar profile — it only takes a few minutes and I'll remember everything from here on out.
          </p>
          <a href="#onboarding" class="btn btn-primary" style="font-size:1rem;padding:12px 28px;">
            Start Setup →
          </a>
          <p style="margin-top:16px;font-size:0.82rem;color:var(--text-muted);">
            Or explore the views above — you can fill in your data manually too.
          </p>
        </div>`;
      return;
    }

    // Returning user greeting
    const hour = new Date().getHours();
    const timeGreet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    const greetEl = document.createElement('div');
    greetEl.innerHTML = `
      <p class="greeting">
        ${Utils.escapeHtml(timeGreet)}, <strong>${Utils.escapeHtml(name)}</strong> —
        <span style="color:var(--text-dim)">${Utils.escapeHtml(bjornName)} here.</span>
      </p>
      <p class="greeting-sub">What are we doing tonight?</p>`;
    container.appendChild(greetEl);

    // Stats bar
    const statsEl = document.createElement('div');
    statsEl.className = 'stats-bar';
    statsEl.innerHTML = `
      <div class="stat-item">
        <span class="stat-value">${bottleCount}</span>
        <span class="stat-label">Bottles</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${originals}</span>
        <span class="stat-label">Originals</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${(recipes.confirmed_favorites || []).length}</span>
        <span class="stat-label">Favorites</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${shopping}</span>
        <span class="stat-label">On Shopping List</span>
      </div>`;
    container.appendChild(statsEl);

    // Menu grid
    const menuEl = document.createElement('div');
    menuEl.className = 'menu-grid';
    menuEl.innerHTML = `
      <a href="#inventory" class="menu-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h18M3 10h18M3 15h18M3 20h18"/></svg>
        <span class="menu-item-title">Update My Inventory</span>
        <span class="menu-item-desc">Add or remove bottles, manage categories</span>
      </a>
      <a href="#recipes" class="menu-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        <span class="menu-item-title">My Recipe List</span>
        <span class="menu-item-desc">${originals} original${originals !== 1 ? 's' : ''} — click to browse</span>
      </a>
      <a href="#profile" class="menu-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <span class="menu-item-title">Review Flavor Profile</span>
        <span class="menu-item-desc">Your 6-axis taste map and archetypes</span>
      </a>
      <a href="#recommender" class="menu-item menu-item--featured">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        <span class="menu-item-title">What Can I Make Right Now?</span>
        <span class="menu-item-desc">Cocktail recommendations from your inventory</span>
      </a>
      <a href="#shopping" class="menu-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        <span class="menu-item-title">What Should I Buy Next?</span>
        <span class="menu-item-desc">${shopping > 0 ? `${shopping} item${shopping !== 1 ? 's' : ''} queued` : 'Gap analysis & prioritized list'}</span>
      </a>`;
    container.appendChild(menuEl);

    // Quick-view: recent originals if any
    if (originals > 0 && originals <= 10) {
      const recentsEl = document.createElement('div');
      recentsEl.style.marginTop = '32px';
      recentsEl.innerHTML = `<h2 style="margin-bottom:14px;">Recent Originals</h2>`;
      const grid = document.createElement('div');
      grid.className = 'card-grid';
      const toShow = (recipes.originals || []).slice(-4).reverse();
      toShow.forEach(r => {
        const card = document.createElement('a');
        card.href = `#recipes/${r.id}`;
        card.className = 'recipe-card';
        card.innerHTML = `
          <div class="card-id">${Utils.escapeHtml(r.id)}</div>
          <div class="card-title">${Utils.escapeHtml(r.name)}</div>
          <div class="card-meta">
            <span>${Utils.escapeHtml(r.method_type || r.method || '—')}</span>
            ${r.ingredients?.[0] ? `<span>${Utils.escapeHtml(r.ingredients[0].name)}</span>` : ''}
          </div>
          ${r.profile ? `<div class="card-profile">${Utils.escapeHtml(r.profile)}</div>` : ''}`;
        grid.appendChild(card);
      });
      recentsEl.appendChild(grid);
      container.appendChild(recentsEl);
    }
  }

  return { render };
})();
