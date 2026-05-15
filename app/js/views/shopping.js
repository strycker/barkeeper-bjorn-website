// Shopping List view — prioritized buy list with ROI context.

const ShoppingView = (() => {

  // Inventory section list for "Got it" placement dialog
  const PLACEMENT_SECTIONS = [
    { key: 'base_spirits.whiskey',             label: 'Whiskey / Bourbon / Scotch',   type: 'bottle' },
    { key: 'base_spirits.brandy',              label: 'Brandy / Cognac',              type: 'bottle' },
    { key: 'base_spirits.rum',                 label: 'Rum',                          type: 'bottle' },
    { key: 'base_spirits.agave',               label: 'Agave (Tequila / Mezcal)',     type: 'bottle' },
    { key: 'base_spirits.white_spirits',       label: 'White Spirits (Gin / Vodka)',  type: 'bottle' },
    { key: 'base_spirits.other',               label: 'Other Spirits',                type: 'bottle' },
    { key: 'fortified_wines_and_aperitif_wines', label: 'Fortified & Aperitif Wines', type: 'bottle' },
    { key: 'liqueurs_and_cordials.fruit_forward', label: 'Liqueurs — Fruit-Forward', type: 'bottle' },
    { key: 'liqueurs_and_cordials.nut_coffee',    label: 'Liqueurs — Nut & Coffee',  type: 'bottle' },
    { key: 'liqueurs_and_cordials.herbal',        label: 'Liqueurs — Herbal',        type: 'bottle' },
    { key: 'liqueurs_and_cordials.specialty_regional', label: 'Liqueurs — Specialty', type: 'bottle' },
    { key: 'bitters.anchors',        label: 'Bitters — Anchors',          type: 'bottle' },
    { key: 'bitters.aromatic_smoke', label: 'Bitters — Aromatic & Smoke', type: 'bottle' },
    { key: 'bitters.nut_earth',      label: 'Bitters — Nut & Earth',      type: 'bottle' },
    { key: 'bitters.fruit_botanical',label: 'Bitters — Fruit & Botanical',type: 'bottle' },
    { key: 'bitters.other',          label: 'Bitters — Other',            type: 'bottle' },
    { key: 'syrups',                 label: 'Syrups',                     type: 'bottle' },
    { key: 'non_alcoholic_spirits',  label: 'Non-Alcoholic Spirits',      type: 'bottle' },
    { key: 'mixers',                 label: 'Mixers',                     type: 'string' },
    { key: 'refrigerator_perishables', label: 'Refrigerator / Perishables', type: 'string' },
    { key: 'pantry_spice_rack',      label: 'Pantry & Spice Rack',        type: 'string' },
    { key: 'fresh_produce',          label: 'Fresh Produce',              type: 'string' },
    { key: 'specialty_ingredients',  label: 'Specialty Ingredients',      type: 'string' },
    { key: 'garnish_and_service',    label: 'Garnish & Service',          type: 'string' },
  ];

  const TIER_OPTS = ['', 'well', 'standard', 'premium', 'craft', 'boutique', 'rare/exceptional'];
  const TIER_LBL  = { '': 'Unset', 'well': 'Well', 'standard': 'Standard', 'premium': 'Premium', 'craft': 'Craft', 'boutique': 'Boutique', 'rare/exceptional': 'Rare/Exceptional' };

  let _dirty = false;

  function _showPlacementDialog(bought, boughtIdx, container) {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-dialog-overlay';
    overlay.innerHTML = `
      <div class="confirm-dialog" style="max-width:460px;">
        <h3>Add to Inventory</h3>
        <p>Where should <strong>${Utils.escapeHtml(bought.item || bought)}</strong> go?</p>
        <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;">
          <label style="display:flex;flex-direction:column;gap:4px;font-size:0.88rem;">
            Section
            <select id="pd-section">
              ${PLACEMENT_SECTIONS.map(s => `<option value="${Utils.escapeHtml(s.key)}">${Utils.escapeHtml(s.label)}</option>`).join('')}
            </select>
          </label>
          <div id="pd-bottle-fields" style="display:flex;flex-direction:column;gap:8px;">
            <label style="display:flex;flex-direction:column;gap:4px;font-size:0.88rem;">
              Style / Name
              <input type="text" id="pd-style" value="${Utils.escapeHtml(bought.item || bought)}">
            </label>
            <label style="display:flex;flex-direction:column;gap:4px;font-size:0.88rem;">
              Brand <span style="color:var(--text-muted);font-weight:400;">(optional)</span>
              <input type="text" id="pd-brand" placeholder="e.g. Maker's Mark">
            </label>
            <label style="display:flex;flex-direction:column;gap:4px;font-size:0.88rem;">
              Type <span style="color:var(--text-muted);font-weight:400;">(optional)</span>
              <input type="text" id="pd-type" placeholder="e.g. Bourbon">
            </label>
            <label style="display:flex;flex-direction:column;gap:4px;font-size:0.88rem;">
              Tier
              <select id="pd-tier">
                ${TIER_OPTS.map(t => `<option value="${Utils.escapeHtml(t)}">${Utils.escapeHtml(TIER_LBL[t])}</option>`).join('')}
              </select>
            </label>
          </div>
          <div id="pd-string-fields" style="display:none;flex-direction:column;gap:8px;">
            <label style="display:flex;flex-direction:column;gap:4px;font-size:0.88rem;">
              Name
              <input type="text" id="pd-string-name" value="${Utils.escapeHtml(bought.item || bought)}">
            </label>
          </div>
        </div>
        <div class="dialog-btns">
          <button class="btn btn-ghost btn-sm" id="pd-cancel">Cancel</button>
          <button class="btn btn-primary btn-sm" id="pd-add">Add to Inventory</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    const sectionSel = overlay.querySelector('#pd-section');
    const bottleFields = overlay.querySelector('#pd-bottle-fields');
    const stringFields = overlay.querySelector('#pd-string-fields');

    function updateFields() {
      const sec = PLACEMENT_SECTIONS.find(s => s.key === sectionSel.value);
      const isStr = sec && sec.type === 'string';
      bottleFields.style.display = isStr ? 'none' : 'flex';
      stringFields.style.display = isStr ? 'flex' : 'none';
    }
    sectionSel.addEventListener('change', updateFields);

    overlay.querySelector('#pd-cancel').addEventListener('click', () => overlay.remove());

    overlay.querySelector('#pd-add').addEventListener('click', () => {
      const sectionKey = sectionSel.value;
      const sec = PLACEMENT_SECTIONS.find(s => s.key === sectionKey);
      const now = new Date().toISOString();
      const itemName = bought.item || bought;

      State.patch('inventory', inv => {
        // Resolve nested key path
        const parts = sectionKey.split('.');
        let obj = inv;
        for (let i = 0; i < parts.length - 1; i++) {
          if (!obj[parts[i]]) obj[parts[i]] = {};
          obj = obj[parts[i]];
        }
        const last = parts[parts.length - 1];
        if (!Array.isArray(obj[last])) obj[last] = [];

        if (sec && sec.type === 'string') {
          const name = overlay.querySelector('#pd-string-name').value.trim() || itemName;
          obj[last].push(name);
        } else {
          const style = overlay.querySelector('#pd-style').value.trim() || itemName;
          const brand = overlay.querySelector('#pd-brand').value.trim();
          const type  = overlay.querySelector('#pd-type').value.trim();
          const tier  = overlay.querySelector('#pd-tier').value;
          obj[last].push({ style, brand, type, tier, best_for: '', notes: '', created_at: now, updated_at: now });
        }

        // Remove from shopping list
        if (Array.isArray(inv.shopping_list)) inv.shopping_list.splice(boughtIdx, 1);
      });

      markDirty();
      Utils.showToast(`"${itemName}" added to inventory ✓`);
      overlay.remove();
      render(container);
    });
  }

  function render(container) {
    _dirty = false;
    const inv = State.get('inventory') || {};
    const shopping = Array.isArray(inv.shopping_list) ? inv.shopping_list : [];

    container.innerHTML = `
      <div class="page-header">
        <h1>Shopping List</h1>
        <p>Prioritized bottle purchases — each ranked by how much it unlocks.</p>
      </div>

      <div id="shop-save-bar" style="display:none;position:sticky;top:60px;z-index:50;
           background:var(--bg);border-bottom:1px solid var(--amber-dim);padding:10px 0;
           align-items:center;gap:12px;margin-bottom:16px;">
        <span style="color:var(--amber);font-size:0.88rem;">Unsaved changes</span>
        <button class="btn btn-primary btn-sm" id="shop-save-btn">Save to GitHub</button>
        <button class="btn btn-ghost btn-sm" id="shop-discard-btn">Discard</button>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <span style="color:var(--text-dim);font-size:0.9rem;">${shopping.length} item${shopping.length !== 1 ? 's' : ''} queued</span>
        <button class="btn btn-secondary btn-sm" id="shop-add-btn">+ Add Item</button>
      </div>

      <div id="shop-add-form" style="display:none;background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius);padding:20px;margin-bottom:20px;">
        <h3>New Shopping Item</h3>
        <div class="form-row" style="flex-wrap:wrap;">
          <div class="form-group" style="flex:2;min-width:200px;">
            <label>Item Name</label>
            <input type="text" id="new-item-name" placeholder="e.g. Génépy des Alpes">
          </div>
          <div class="form-group" style="flex:1;min-width:100px;">
            <label>Priority</label>
            <input type="number" id="new-item-priority" placeholder="1" min="1" max="20" value="${shopping.length + 1}">
          </div>
          <div class="form-group" style="flex:1;min-width:100px;">
            <label>Est. Price (USD)</label>
            <input type="number" id="new-item-price" placeholder="35" min="0" step="1">
          </div>
        </div>
        <div class="form-group">
          <label>Rationale / ROI Notes</label>
          <input type="text" id="new-item-rationale" placeholder="Unlocks 8 additional recipes, fills alpine herbal gap">
        </div>
        <div class="form-group">
          <label>Unlocks (cocktails this purchase enables)</label>
          <input type="text" id="new-item-unlocks" placeholder="Last Word, Chartreuse Sour, Alpine Negroni (comma-separated)">
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-primary btn-sm" id="new-item-save">Add to List</button>
          <button class="btn btn-ghost btn-sm" id="new-item-cancel">Cancel</button>
        </div>
      </div>

      <div id="shopping-list-items"></div>`;

    document.getElementById('shop-save-btn')?.addEventListener('click', saveList);
    document.getElementById('shop-discard-btn')?.addEventListener('click', () => {
      _dirty = false;
      render(container);
    });

    const addBtn = document.getElementById('shop-add-btn');
    const addForm = document.getElementById('shop-add-form');
    addBtn.addEventListener('click', () => {
      addForm.style.display = addForm.style.display === 'none' ? 'block' : 'none';
    });

    document.getElementById('new-item-cancel')?.addEventListener('click', () => {
      addForm.style.display = 'none';
    });

    document.getElementById('new-item-save')?.addEventListener('click', () => {
      const name = document.getElementById('new-item-name').value.trim();
      if (!name) return;
      const priority = parseInt(document.getElementById('new-item-priority').value) || shopping.length + 1;
      const price    = parseFloat(document.getElementById('new-item-price').value) || undefined;
      const rationale = document.getElementById('new-item-rationale').value.trim() || undefined;
      const unlocksStr = document.getElementById('new-item-unlocks').value.trim();
      const unlocks = unlocksStr ? unlocksStr.split(',').map(s => s.trim()).filter(Boolean) : undefined;

      const item = { item: name, priority, ...(price ? { estimated_price_usd: price } : {}), ...(unlocks ? { unlocks } : {}), ...(rationale ? { rationale } : {}) };
      const inv = State.get('inventory');
      if (!Array.isArray(inv.shopping_list)) inv.shopping_list = [];
      inv.shopping_list.push(item);
      inv.shopping_list.sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
      markDirty();
      render(container);
    });

    renderItems(shopping, inv, container);
  }

  function renderItems(shopping, inv, container) {
    const listEl = document.getElementById('shopping-list-items');
    if (!listEl) return;

    if (shopping.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🛒</div>
          <p>Shopping list is empty.</p>
          <p style="font-size:0.85rem;color:var(--text-muted);">
            Your AI bartender will populate this during gap analysis sessions.
            You can also add items manually above.
          </p>
        </div>`;
      return;
    }

    listEl.innerHTML = '';
    shopping.forEach((item, idx) => {
      const el = document.createElement('div');
      el.className = 'shopping-item';
      el.innerHTML = `
        <div class="shopping-priority">${item.priority ?? idx + 1}</div>
        <div>
          <div class="shopping-name">${Utils.escapeHtml(item.item)}</div>
          ${item.rationale ? `<div class="shopping-rationale">${Utils.escapeHtml(item.rationale)}</div>` : ''}
          ${item.unlocks?.length ? `
            <div class="shopping-unlocks">
              ${item.unlocks.map(u => `<span class="shopping-unlock-chip">${Utils.escapeHtml(u)}</span>`).join('')}
            </div>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
          ${item.estimated_price_usd ? `<div class="shopping-price">~$${item.estimated_price_usd}</div>` : ''}
          <div style="display:flex;gap:6px;">
            <button class="btn btn-secondary btn-sm" data-action="bought" data-idx="${idx}" title="Mark as purchased — moves to inventory">
              ✓ Got It
            </button>
            <button class="btn btn-icon btn-sm" data-action="remove" data-idx="${idx}" title="Remove from list">
              ×
            </button>
          </div>
        </div>`;

      el.querySelector('[data-action="remove"]').addEventListener('click', () => {
        const current = State.get('inventory');
        current.shopping_list.splice(idx, 1);
        markDirty();
        render(container);
      });

      el.querySelector('[data-action="bought"]').addEventListener('click', () => {
        const bought = State.get('inventory').shopping_list[idx];
        _showPlacementDialog(bought, idx, container);
      });

      listEl.appendChild(el);
    });
  }

  function markDirty() {
    _dirty = true;
    const bar = document.getElementById('shop-save-bar');
    if (bar) bar.style.display = 'flex';
  }

  async function saveList() {
    const inv = State.get('inventory');
    inv.last_updated = Utils.today();
    try {
      await State.save('inventory', 'Update shopping list via Barkeeper Bjorn web UI');
      _dirty = false;
      const bar = document.getElementById('shop-save-bar');
      if (bar) bar.style.display = 'none';
      Utils.showToast('Shopping list saved to GitHub ✓');
    } catch (err) {
      Utils.showToast(`Save failed: ${err.message}`, 'error');
    }
  }

  return { render };
})();
