// Inventory Manager view — browse, add, remove bottles; manage string lists.

const InventoryView = (() => {

  // Sections that hold arrays of bottleEntry objects
  const BOTTLE_SECTIONS = [
    { key: 'base_spirits.whiskey',      label: 'Whiskey',      hint: 'Bourbon, rye, Scotch, Irish, Japanese…' },
    { key: 'base_spirits.brandy',       label: 'Brandy / Cognac', hint: 'Cognac, Armagnac, Calvados, pisco…' },
    { key: 'base_spirits.rum',          label: 'Rum',          hint: 'White, dark, aged, agricole, cachaça…' },
    { key: 'base_spirits.agave',        label: 'Agave',        hint: 'Tequila (blanco/repos/añejo), mezcal…' },
    { key: 'base_spirits.white_spirits',label: 'White Spirits',hint: 'Gin (style noted), vodka…' },
    { key: 'base_spirits.other',        label: 'Other Spirits',hint: 'Aquavit, baijiu, sotol, soju…' },
    { key: 'fortified_wines_and_aperitif_wines', label: 'Fortified & Aperitif Wines', hint: 'Vermouth, sherry, Lillet, Cocchi…' },
    { key: 'liqueurs_and_cordials.fruit_forward', label: 'Liqueurs — Fruit-Forward', hint: 'Cointreau, Chambord, St-Germain…' },
    { key: 'liqueurs_and_cordials.nut_coffee',    label: 'Liqueurs — Nut & Coffee',  hint: 'Kahlúa, Frangelico, Baileys…' },
    { key: 'liqueurs_and_cordials.herbal',        label: 'Liqueurs — Herbal',         hint: 'Chartreuse, Bénédictine, Campari…' },
    { key: 'liqueurs_and_cordials.specialty_regional', label: 'Liqueurs — Specialty', hint: 'Velvet Falernum, Cynar, Aperol…' },
    { key: 'bitters.anchors',          label: 'Bitters — Anchors',         hint: 'Angostura, Peychaud\'s…' },
    { key: 'bitters.aromatic_smoke',   label: 'Bitters — Aromatic & Smoke', hint: 'Bittermens, Woodford…' },
    { key: 'bitters.nut_earth',        label: 'Bitters — Nut & Earth',     hint: 'Mole, walnut, black walnut…' },
    { key: 'bitters.fruit_botanical',  label: 'Bitters — Fruit & Botanical', hint: 'Orange, lemon, celery…' },
    { key: 'bitters.other',            label: 'Bitters — Other',           hint: 'Any specialty bitters…' },
    { key: 'syrups',                   label: 'Syrups',                    hint: 'Simple, orgeat, honey, ginger, falernum…' },
    { key: 'non_alcoholic_spirits',    label: 'Non-Alcoholic Spirits',     hint: 'Seedlip, Lyre\'s, Ritual…' },
  ];

  // Sections that hold plain string arrays
  const STRING_SECTIONS = [
    { key: 'mixers',                 label: 'Mixers',              hint: 'Sparkling water, tonic, ginger beer, juices…' },
    { key: 'refrigerator_perishables', label: 'Refrigerator / Perishables', hint: 'Cream, eggs, citrus, fresh juice…' },
    { key: 'pantry_spice_rack',      label: 'Pantry & Spice Rack', hint: 'Salt, sugar, cinnamon, nutmeg…' },
    { key: 'fresh_produce',          label: 'Fresh Produce',       hint: 'Herbs, fruit, mint, basil…' },
    { key: 'specialty_ingredients',  label: 'Specialty Ingredients', hint: 'Regional or unusual items…' },
    { key: 'garnish_and_service',    label: 'Garnish & Service',   hint: 'Cherries, picks, glassware notes…' },
  ];

  const TIER_COLORS = {
    'industrial': 'tier-industrial',
    'premium-accessible': 'tier-premium-accessible',
    'boutique': 'tier-boutique',
    'rare/exceptional': 'tier-rare',
  };

  const TIERS = ['industrial', 'premium-accessible', 'boutique', 'rare/exceptional'];

  let _dirty = false;

  function getNestedArr(inv, dotKey) {
    const parts = dotKey.split('.');
    let obj = inv;
    for (const p of parts) {
      if (!obj) return [];
      obj = obj[p];
    }
    return Array.isArray(obj) ? obj : [];
  }

  function setNestedArr(inv, dotKey, value) {
    const parts = dotKey.split('.');
    let obj = inv;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!obj[parts[i]]) obj[parts[i]] = {};
      obj = obj[parts[i]];
    }
    obj[parts[parts.length - 1]] = value;
  }

  function tierLabel(tier) {
    const map = {
      'industrial': 'Industrial',
      'premium-accessible': 'Premium',
      'boutique': 'Boutique',
      'rare/exceptional': 'Rare',
    };
    return map[tier] || tier || '';
  }

  function renderBottleSection(container, sectionKey, sectionLabel, hint, inv) {
    const arr = getNestedArr(inv, sectionKey);

    const section = document.createElement('div');
    section.className = 'inventory-section';
    section.dataset.sectionKey = sectionKey;

    section.innerHTML = `
      <div class="inventory-section-title">${Utils.escapeHtml(sectionLabel)}</div>
      <div class="bottle-grid" id="bottles-${sectionKey.replace(/\./g, '-')}"></div>
      <div class="add-bottle-row" style="margin-top:12px;">
        <input type="text" class="add-bottle-input" placeholder="${Utils.escapeHtml(hint)}" style="flex:1;">
        <select class="add-bottle-tier" style="width:130px;">
          ${TIERS.map(t => `<option value="${t}">${tierLabel(t)}</option>`).join('')}
          <option value="" selected>Tier…</option>
        </select>
        <button class="btn btn-secondary btn-sm add-bottle-btn">+ Add</button>
      </div>`;

    const grid = section.querySelector('.bottle-grid');
    renderBottleChips(grid, arr, sectionKey, inv);

    const addBtn = section.querySelector('.add-bottle-btn');
    const nameInput = section.querySelector('.add-bottle-input');
    const tierSelect = section.querySelector('.add-bottle-tier');

    addBtn.addEventListener('click', () => {
      const name = nameInput.value.trim();
      if (!name) return;
      const tier = tierSelect.value || undefined;
      const bottle = { name, ...(tier ? { tier } : {}) };
      const current = getNestedArr(inv, sectionKey);
      current.push(bottle);
      setNestedArr(inv, sectionKey, current);
      markDirty();
      renderBottleChips(grid, current, sectionKey, inv);
      nameInput.value = '';
      tierSelect.value = '';
    });

    nameInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') addBtn.click();
    });

    container.appendChild(section);
  }

  function renderBottleChips(grid, arr, sectionKey, inv) {
    grid.innerHTML = '';
    arr.forEach((bottle, idx) => {
      const chip = document.createElement('div');
      chip.className = 'bottle-chip';
      const tierClass = TIER_COLORS[bottle.tier] || 'tier-industrial';
      chip.innerHTML = `
        <span class="bottle-tier-dot ${tierClass}" title="${Utils.escapeHtml(bottle.tier || 'unrated')}"></span>
        <span>${Utils.escapeHtml(bottle.name)}</span>
        ${bottle.best_for ? `<span style="font-size:0.75rem;color:var(--text-muted);">(${Utils.escapeHtml(bottle.best_for)})</span>` : ''}
        <button class="chip-remove" title="Remove" data-idx="${idx}">×</button>`;
      chip.querySelector('.chip-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        const current = getNestedArr(inv, sectionKey);
        current.splice(idx, 1);
        setNestedArr(inv, sectionKey, current);
        markDirty();
        renderBottleChips(grid, current, sectionKey, inv);
      });
      grid.appendChild(chip);
    });

    if (arr.length === 0) {
      const empty = document.createElement('span');
      empty.style.cssText = 'font-size:0.82rem;color:var(--text-muted);font-style:italic;';
      empty.textContent = 'Nothing here yet';
      grid.appendChild(empty);
    }
  }

  function renderStringSection(container, sectionKey, sectionLabel, hint, inv) {
    const arr = Array.isArray(inv[sectionKey]) ? inv[sectionKey] : [];

    const section = document.createElement('div');
    section.className = 'inventory-section';
    section.innerHTML = `
      <div class="inventory-section-title">${Utils.escapeHtml(sectionLabel)}</div>
      <ul class="string-list" id="strlist-${sectionKey}"></ul>
      <div class="add-bottle-row" style="margin-top:10px;">
        <input type="text" class="add-str-input" placeholder="${Utils.escapeHtml(hint)}" style="flex:1;">
        <button class="btn btn-secondary btn-sm add-str-btn">+ Add</button>
      </div>`;

    const list = section.querySelector('.string-list');
    renderStringItems(list, arr, sectionKey, inv);

    const addBtn = section.querySelector('.add-str-btn');
    const input  = section.querySelector('.add-str-input');

    addBtn.addEventListener('click', () => {
      const val = input.value.trim();
      if (!val) return;
      if (!Array.isArray(inv[sectionKey])) inv[sectionKey] = [];
      inv[sectionKey].push(val);
      markDirty();
      renderStringItems(list, inv[sectionKey], sectionKey, inv);
      input.value = '';
    });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') addBtn.click(); });

    container.appendChild(section);
  }

  function renderStringItems(list, arr, sectionKey, inv) {
    list.innerHTML = '';
    arr.forEach((item, idx) => {
      const li = document.createElement('li');
      li.innerHTML = `${Utils.escapeHtml(item)}<button title="Remove" data-idx="${idx}">×</button>`;
      li.querySelector('button').addEventListener('click', () => {
        inv[sectionKey].splice(idx, 1);
        markDirty();
        renderStringItems(list, inv[sectionKey], sectionKey, inv);
      });
      list.appendChild(li);
    });
  }

  function markDirty() {
    _dirty = true;
    const saveBar = document.getElementById('inv-save-bar');
    if (saveBar) saveBar.style.display = 'flex';
  }

  async function saveInventory() {
    const inv = State.get('inventory');
    inv.last_updated = Utils.today();
    try {
      await State.save('inventory', 'Update inventory via Barkeeper Bjorn web UI');
      _dirty = false;
      const saveBar = document.getElementById('inv-save-bar');
      if (saveBar) saveBar.style.display = 'none';
      Utils.showToast('Inventory saved to GitHub ✓');
    } catch (err) {
      Utils.showToast(`Save failed: ${err.message}`, 'error');
    }
  }

  function render(container) {
    _dirty = false;
    const inv = State.get('inventory');
    if (!inv) {
      Utils.showError(container, 'Inventory data not loaded.');
      return;
    }

    container.innerHTML = `
      <div class="page-header">
        <h1>Inventory</h1>
        <p>Your current bar — add or remove bottles. Changes are saved back to your GitHub repo.</p>
      </div>

      <div id="inv-save-bar" style="display:none;position:sticky;top:60px;z-index:50;
           background:var(--bg);border-bottom:1px solid var(--amber-dim);padding:10px 0 10px;
           align-items:center;gap:12px;margin-bottom:16px;">
        <span style="color:var(--amber);font-size:0.88rem;">Unsaved changes</span>
        <button class="btn btn-primary btn-sm" id="inv-save-btn">Save to GitHub</button>
        <button class="btn btn-ghost btn-sm" id="inv-discard-btn">Discard</button>
      </div>

      <div id="inv-sections"></div>`;

    document.getElementById('inv-save-btn')?.addEventListener('click', saveInventory);
    document.getElementById('inv-discard-btn')?.addEventListener('click', () => {
      _dirty = false;
      // Reload from state (state still has original — user just edited UI arrays in-place)
      Utils.showToast('Changes discarded', 'info');
      render(container);
    });

    const sectionsEl = document.getElementById('inv-sections');

    // Tabs
    const tabsEl = document.createElement('div');
    tabsEl.className = 'tabs';
    const tabs = [
      { id: 'tab-spirits',  label: 'Spirits & Bottles' },
      { id: 'tab-pantry',   label: 'Pantry & Perishables' },
      { id: 'tab-vetoes',   label: 'Vetoes & Substitutes' },
    ];

    tabs.forEach((t, i) => {
      const tab = document.createElement('div');
      tab.className = 'tab' + (i === 0 ? ' active' : '');
      tab.textContent = t.label;
      tab.dataset.tabId = t.id;
      tab.addEventListener('click', () => {
        tabsEl.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
        tab.classList.add('active');
        renderTabContent(t.id, inv, contentEl);
      });
      tabsEl.appendChild(tab);
    });

    sectionsEl.appendChild(tabsEl);

    const contentEl = document.createElement('div');
    contentEl.id = 'tab-content';
    sectionsEl.appendChild(contentEl);

    renderTabContent('tab-spirits', inv, contentEl);
  }

  function renderTabContent(tabId, inv, container) {
    container.innerHTML = '';
    if (tabId === 'tab-spirits') {
      BOTTLE_SECTIONS.forEach(({ key, label, hint }) => {
        renderBottleSection(container, key, label, hint, inv);
      });
    } else if (tabId === 'tab-pantry') {
      STRING_SECTIONS.forEach(({ key, label, hint }) => {
        renderStringSection(container, key, label, hint, inv);
      });
    } else if (tabId === 'tab-vetoes') {
      renderVetoesSection(container, inv);
    }
  }

  function renderVetoesSection(container, inv) {
    const vetoes = inv.vetoes || { disliked_ingredients: [], substitute_for_now: [] };
    inv.vetoes = vetoes;

    // Disliked
    const dislikedEl = document.createElement('div');
    dislikedEl.className = 'inventory-section';
    dislikedEl.innerHTML = `
      <div class="inventory-section-title">Disliked Ingredients (permanent vetoes)</div>
      <p style="font-size:0.85rem;color:var(--text-dim);margin-bottom:10px;">
        These are never suggested in drinks or as purchases.
      </p>
      <ul class="string-list" id="veto-disliked"></ul>
      <div class="add-bottle-row" style="margin-top:10px;">
        <input type="text" class="add-veto-input" placeholder="e.g. Green Chartreuse" style="flex:1;">
        <button class="btn btn-secondary btn-sm add-veto-btn">+ Add</button>
      </div>`;
    const dList = dislikedEl.querySelector('#veto-disliked');
    renderStringItems(dList, vetoes.disliked_ingredients, '_vetoes_disliked', {
      get _vetoes_disliked() { return vetoes.disliked_ingredients; },
      set _vetoes_disliked(v) { vetoes.disliked_ingredients = v; }
    });
    const dInput = dislikedEl.querySelector('.add-veto-input');
    const dBtn   = dislikedEl.querySelector('.add-veto-btn');
    dBtn.addEventListener('click', () => {
      const v = dInput.value.trim();
      if (!v) return;
      vetoes.disliked_ingredients.push(v);
      markDirty();
      renderStringItems(dList, vetoes.disliked_ingredients, '_vetoes_disliked', {
        get _vetoes_disliked() { return vetoes.disliked_ingredients; },
        set _vetoes_disliked(v2) { vetoes.disliked_ingredients = v2; }
      });
      dInput.value = '';
    });
    container.appendChild(dislikedEl);

    // Substitutes
    const subEl = document.createElement('div');
    subEl.className = 'inventory-section';
    const subs = vetoes.substitute_for_now || [];
    vetoes.substitute_for_now = subs;
    subEl.innerHTML = `
      <div class="inventory-section-title">Temporary Substitutes</div>
      <p style="font-size:0.85rem;color:var(--text-dim);margin-bottom:10px;">
        Ingredients you intend to buy — use these in the meantime.
      </p>
      <div id="subs-list"></div>
      <div class="add-bottle-row" style="margin-top:10px;flex-wrap:wrap;gap:6px;">
        <input type="text" id="sub-missing" placeholder="Missing ingredient" style="flex:1;min-width:140px;">
        <input type="text" id="sub-substitute" placeholder="Use instead" style="flex:1;min-width:140px;">
        <input type="text" id="sub-ratio" placeholder="Ratio (e.g. 1:1)" style="width:100px;">
        <button class="btn btn-secondary btn-sm" id="sub-add-btn">+ Add</button>
      </div>`;
    const subsList = subEl.querySelector('#subs-list');
    renderSubsList(subsList, subs);
    subEl.querySelector('#sub-add-btn').addEventListener('click', () => {
      const missing    = subEl.querySelector('#sub-missing').value.trim();
      const substitute = subEl.querySelector('#sub-substitute').value.trim();
      const ratio      = subEl.querySelector('#sub-ratio').value.trim();
      if (!missing || !substitute) return;
      subs.push({ missing, substitute, ...(ratio ? { ratio } : {}) });
      markDirty();
      renderSubsList(subsList, subs);
      ['#sub-missing','#sub-substitute','#sub-ratio'].forEach(s => subEl.querySelector(s).value = '');
    });
    container.appendChild(subEl);
  }

  function renderSubsList(container, subs) {
    container.innerHTML = '';
    if (subs.length === 0) {
      container.innerHTML = '<p style="font-size:0.82rem;color:var(--text-muted);font-style:italic;">None yet</p>';
      return;
    }
    subs.forEach((s, idx) => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:10px;margin-bottom:8px;background:var(--bg3);padding:10px 14px;border-radius:var(--radius-sm);';
      row.innerHTML = `
        <span style="flex:1;font-size:0.9rem;">
          <strong style="color:var(--text-dim);">${Utils.escapeHtml(s.missing)}</strong>
          <span style="color:var(--text-muted);margin:0 6px;">→</span>
          ${Utils.escapeHtml(s.substitute)}
          ${s.ratio ? `<span style="color:var(--text-muted);font-size:0.8rem;margin-left:6px;">(${Utils.escapeHtml(s.ratio)})</span>` : ''}
        </span>
        <button class="btn-icon btn-sm" title="Remove" data-idx="${idx}">×</button>`;
      row.querySelector('button').addEventListener('click', () => {
        subs.splice(idx, 1);
        markDirty();
        renderSubsList(container, subs);
      });
      container.appendChild(row);
    });
  }

  return { render };
})();
