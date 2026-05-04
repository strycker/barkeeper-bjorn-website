// Shopping List view — prioritized buy list with ROI context.

const ShoppingView = (() => {

  let _dirty = false;

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
        const current = State.get('inventory');
        const bought = current.shopping_list.splice(idx, 1)[0];
        // Add to base spirits "other" as a simple entry (user can recategorize in inventory view)
        if (!Array.isArray(current.base_spirits.other)) current.base_spirits.other = [];
        current.base_spirits.other.push({ name: bought.item });
        markDirty();
        Utils.showToast(`"${bought.item}" moved to inventory. Recategorize in Inventory view.`, 'info', 4000);
        render(container);
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
