// Data Export / Import module — ZIP bundle and AI-context text.
// Exposed as DataExport IIFE; consumed by SettingsView.

const DataExport = (() => {
  const EXPORT_VERSION = '1.0';
  const SECTIONS = ['inventory', 'recipes', 'profile', 'barkeeper'];

  // ── Helpers ──────────────────────────────────────────────────────────────

  function triggerDownload(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  // ── EXPORT-01 / D-07: ZIP bundle ──────────────────────────────────────────

  async function exportJSON() {
    if (typeof JSZip === 'undefined') {
      Utils.showToast('ZIP library not loaded. Check your internet connection.', 'error');
      return;
    }
    const zip = new JSZip();
    const filenames = {
      inventory: 'inventory.json',
      recipes:   'recipes.json',
      profile:   'bar-owner-profile.json',
      barkeeper: 'barkeeper.json',
    };
    SECTIONS.forEach(key => {
      zip.file(filenames[key], JSON.stringify(State.get(key) || {}, null, 2));
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `barkeeper-bjorn-export-${today()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── EXPORT-02: AI-context text ────────────────────────────────────────────

  function exportAIContext() {
    const inventory = State.get('inventory') || {};
    const recipes   = State.get('recipes')   || {};
    const profile   = State.get('profile')   || {};
    const barkeeper = State.get('barkeeper') || {};

    const lines = [];
    const bkName   = barkeeper.identity?.name || 'Barkeeper Bjorn';
    const bkPreset = barkeeper.active_preset  || '';

    lines.push(`# My Bar — AI Context Export`);
    lines.push(`_Bartender: ${bkName}${bkPreset ? ` (${bkPreset})` : ''}_`);
    lines.push(`_Exported: ${today()}_`);
    lines.push('');

    // Inventory
    lines.push('## Inventory');
    const spiritEntries = Object.entries(inventory.base_spirits || {});
    if (spiritEntries.length) {
      spiritEntries.forEach(([cat, items]) => {
        const names = items.map(i => typeof i === 'string' ? i : i.name).join(', ');
        if (names) lines.push(`- **${cat}:** ${names}`);
      });
    }
    const pantryEntries = Object.entries(inventory.pantry || {});
    if (pantryEntries.some(([, v]) => v.length)) {
      lines.push('');
      lines.push('### Pantry');
      pantryEntries.forEach(([cat, items]) => {
        const names = items.map(i => typeof i === 'string' ? i : i.name).join(', ');
        if (names) lines.push(`- **${cat}:** ${names}`);
      });
    }
    const barware = Object.entries(inventory.barware || {});
    if (barware.some(([, v]) => Array.isArray(v) ? v.length : v)) {
      lines.push('');
      lines.push('### Barware');
      barware.forEach(([k, v]) => {
        if (Array.isArray(v) && v.length) lines.push(`- ${k}: ${v.join(', ')}`);
        else if (v && !Array.isArray(v)) lines.push(`- ${k}: ${v}`);
      });
    }
    if ((inventory.unassigned || []).length) {
      lines.push('');
      lines.push('### Unassigned');
      (inventory.unassigned).forEach(s => lines.push(`- ${typeof s === 'string' ? s : s.name}`));
    }
    lines.push('');

    // Flavor profile
    lines.push('## Flavor Profile');
    const axes = profile.flavor_profile?.axes || {};
    if (Object.keys(axes).length) {
      Object.entries(axes).forEach(([k, v]) => lines.push(`- ${k}: ${v}`));
    } else {
      lines.push('_Not set._');
    }
    const identity = profile.identity || {};
    if (Object.keys(identity).length) {
      lines.push('');
      lines.push('### Identity');
      Object.entries(identity).forEach(([k, v]) => {
        if (v) lines.push(`- ${k}: ${v}`);
      });
    }
    lines.push('');

    // Original cocktails
    const originals = recipes.originals || [];
    if (originals.length) {
      lines.push('## Original Cocktails');
      originals.forEach(r => {
        lines.push('');
        lines.push(`### ${r.name}`);
        if (r.tagline) lines.push(`_${r.tagline}_`);
        if (r.creator) lines.push(`Creator: ${r.creator}`);
        if (r.date_created) lines.push(`Date: ${r.date_created}`);
        if (r.ingredients?.length) {
          lines.push('\nIngredients:');
          r.ingredients.forEach(i =>
            lines.push(`- ${i.amount} ${i.name}${i.notes ? ` (${i.notes})` : ''}`));
        }
        if (r.method) lines.push(`\nMethod: ${r.method}`);
        if (r.method_type) lines.push(`Method type: ${r.method_type}`);
        if (r.glassware) lines.push(`Glassware: ${r.glassware}`);
        if (r.garnish) lines.push(`Garnish: ${r.garnish}`);
        if (r.profile) lines.push(`\nProfile: ${r.profile}`);
        if (r.why_it_works) lines.push(`\nWhy it works: ${r.why_it_works}`);
        if (r.ratings?.bar_owner) lines.push(`\nRating: ${r.ratings.bar_owner}/10`);
        if (r.confirmed_built) lines.push('Status: Built ✓');
      });
      lines.push('');
    }

    // Confirmed favorites
    const favorites = recipes.confirmed_favorites || [];
    if (favorites.length) {
      lines.push('## Confirmed Favorites');
      favorites.forEach(f => {
        lines.push(`- ${f.name}${f.creator ? ` (${f.creator})` : ''}${f.notes ? ` — ${f.notes}` : ''}`);
      });
      lines.push('');
    }

    // Wishlist
    const wishlist = recipes.wishlist || [];
    if (wishlist.length) {
      lines.push('## Wishlist');
      wishlist.forEach(w => {
        lines.push(`- ${w.name}${w.pending ? ` [missing: ${w.pending}]` : ''}`);
      });
    }

    const text = lines.join('\n');
    triggerDownload(text, `barkeeper-bjorn-ai-context-${today()}.txt`, 'text/plain');
  }

  // ── EXPORT-03 / D-08 / D-09: ZIP import with drop zone + preview ─────────

  function renderImportUI(container) {
    container.innerHTML = `
      <div class="section-label" style="margin-top:4px;">Import Data</div>
      <p style="font-size:0.88rem;color:var(--text-dim);margin-bottom:12px;">
        Drop a ZIP export file here or choose one. All 4 data files will be overwritten on GitHub after confirmation.
      </p>
      <div class="import-drop-zone" id="imp-drop-zone">
        <div style="font-size:0.95rem;margin-bottom:6px;">Drop a ZIP export file here</div>
        <div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:12px;">— or —</div>
        <button class="btn btn-secondary btn-sm" id="imp-choose" type="button">Choose File…</button>
      </div>
      <div class="import-preview" id="imp-preview" style="display:none;"></div>`;

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.zip,application/zip,application/x-zip-compressed';
    fileInput.style.display = 'none';
    container.appendChild(fileInput);

    const zone = container.querySelector('#imp-drop-zone');
    container.querySelector('#imp-choose').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (file) handleFile(file);
    });

    // Drag-and-drop: dragover MUST preventDefault or drop never fires
    zone.addEventListener('dragover', e => {
      e.preventDefault();
      zone.classList.add('dragover');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (!file) return;
      if (!/\.zip$/i.test(file.name)) {
        Utils.showToast('Drop a .zip file.', 'error');
        return;
      }
      handleFile(file);
    });

    async function handleFile(file) {
      if (typeof JSZip === 'undefined') {
        Utils.showToast('ZIP library not loaded. Check your internet connection.', 'error');
        return;
      }
      const preview = container.querySelector('#imp-preview');
      try {
        const zip = await JSZip.loadAsync(file);
        const expected = {
          'barkeeper.json':         'barkeeper',
          'bar-owner-profile.json': 'profile',
          'inventory.json':         'inventory',
          'recipes.json':           'recipes',
        };
        const parsed = {};
        let allPresent = true;

        // Promise.all is safe here — reads ZIP entries from local memory, no GitHub API calls.
        // Sequential await is only required for State.save() to avoid 409 SHA conflicts.
        const rows = await Promise.all(Object.entries(expected).map(async ([filename, key]) => {
          const entry = zip.file(filename);
          if (!entry) {
            allPresent = false;
            return { filename, key, ok: false, size: 0 };
          }
          const text = await entry.async('string');
          try {
            parsed[key] = JSON.parse(text);
            return { filename, key, ok: true, size: text.length };
          } catch {
            throw new Error(`Invalid JSON in ${filename}`);
          }
        }));

        renderPreview(rows, parsed, allPresent, preview);
      } catch (err) {
        preview.style.display = '';
        preview.innerHTML = `<p style="color:var(--red);font-size:0.88rem;">${Utils.escapeHtml('Not a valid Barkeeper Bjorn export. Expected a ZIP containing 4 JSON files. ' + err.message)}</p>`;
      }
    }

    function renderPreview(rows, parsed, allPresent, preview) {
      const rowsHtml = rows.map(({ filename, ok, size }) => `
        <div class="import-preview-row">
          <span class="badge badge-blue" style="flex:none;">json</span>
          <span style="flex:1;">${Utils.escapeHtml(filename)}</span>
          <span style="font-size:0.82rem;color:var(--text-muted);">${size ? (size / 1024).toFixed(1) + ' KB' : ''}</span>
          <span style="color:${ok ? 'var(--green)' : 'var(--red)'};">${ok ? '✓' : '✕'}</span>
        </div>`).join('');

      preview.style.display = '';
      preview.innerHTML = `
        <div style="font-size:0.88rem;color:var(--text-dim);font-weight:600;margin-bottom:12px;">Ready to import 4 files</div>
        <p style="font-size:0.82rem;color:var(--text-dim);margin-bottom:12px;">
          These files will overwrite your current data on GitHub. This cannot be undone.
        </p>
        ${rowsHtml}
        ${!allPresent ? `<p style="font-size:0.82rem;color:var(--red);margin-top:10px;">ZIP must contain all 4 data files.</p>` : ''}
        <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;">
          <button class="btn btn-primary btn-sm" id="imp-confirm" type="button"
                  ${!allPresent ? 'disabled' : ''}>Confirm Import</button>
          <button class="btn btn-ghost btn-sm" id="imp-cancel" type="button">Cancel</button>
        </div>
        <p id="imp-status" style="font-size:0.82rem;min-height:1.2em;margin-top:8px;"></p>`;

      preview.querySelector('#imp-cancel').addEventListener('click', () => {
        preview.style.display = 'none';
      });

      if (!allPresent) return;

      preview.querySelector('#imp-confirm').addEventListener('click', async () => {
        const confirmBtn = preview.querySelector('#imp-confirm');
        const statusEl   = preview.querySelector('#imp-status');
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Importing…';

        const writeOrder = ['barkeeper', 'profile', 'inventory', 'recipes'];
        const filenames  = {
          barkeeper: 'barkeeper.json',
          profile:   'bar-owner-profile.json',
          inventory: 'inventory.json',
          recipes:   'recipes.json',
        };

        try {
          // Sequential writes — parallel State.save causes GitHub 409 SHA conflicts
          for (const key of writeOrder) {
            statusEl.textContent = `Writing ${filenames[key]}…`;
            statusEl.style.color = 'var(--text-muted)';
            State.set(key, parsed[key]);
            await State.save(key, 'Import ZIP bundle');
          }
          statusEl.textContent = 'Import complete.';
          statusEl.style.color = 'var(--green)';
          Utils.showToast('Import complete.');
          preview.style.display = 'none';
        } catch (err) {
          statusEl.textContent = `Import failed: ${Utils.escapeHtml(err.message)}`;
          statusEl.style.color = 'var(--red)';
          Utils.showToast('Import failed: ' + err.message, 'error');
          confirmBtn.disabled = false;
          confirmBtn.textContent = 'Confirm Import';
        }
      });
    }
  }

  // EXPORT_VERSION retained for potential future use
  void EXPORT_VERSION;

  return { exportJSON, exportAIContext, renderImportUI };
})();
