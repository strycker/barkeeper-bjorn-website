// Data Export / Import module — JSON bundle and AI-context text.
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

  // ── EXPORT-01: JSON bundle ────────────────────────────────────────────────

  function exportJSON() {
    const bundle = {
      _export: { version: EXPORT_VERSION, app: 'barkeeper-bjorn', date: new Date().toISOString() },
    };
    SECTIONS.forEach(k => { bundle[k] = State.get(k) || {}; });
    const filename = `barkeeper-bjorn-export-${today()}.json`;
    triggerDownload(JSON.stringify(bundle, null, 2), filename, 'application/json');
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
    triggerDownload(text, `barkeeper-bjorn-context-${today()}.md`, 'text/markdown');
  }

  // ── EXPORT-03 / EXPORT-04: Import with diff preview + selective import ───

  function renderImportUI(container) {
    container.innerHTML = `
      <div class="section-label" style="margin-top:4px;">Import Data</div>
      <p style="font-size:0.88rem;color:var(--text-dim);margin-bottom:12px;">
        Select a previously exported JSON bundle. You'll see a summary before anything is written.
      </p>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <button class="btn btn-secondary btn-sm" id="imp-choose">Choose File</button>
        <span id="imp-filename" style="font-size:0.85rem;color:var(--text-dim);">No file chosen</span>
      </div>
      <div id="imp-preview" style="display:none;margin-top:16px;"></div>`;

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json,application/json';
    fileInput.style.display = 'none';
    container.appendChild(fileInput);

    container.querySelector('#imp-choose').addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (!file) return;
      container.querySelector('#imp-filename').textContent = file.name;

      const reader = new FileReader();
      reader.onload = e => {
        try {
          const bundle = JSON.parse(e.target.result);
          renderImportPreview(bundle, container.querySelector('#imp-preview'));
        } catch {
          Utils.toast('Invalid JSON file.', 'error');
        }
      };
      reader.readAsText(file);
    });
  }

  function renderImportPreview(bundle, el) {
    if (!bundle._export) {
      el.style.display = '';
      el.innerHTML = `<p style="color:var(--red);font-size:0.88rem;">Not a valid Barkeeper Bjorn export file (missing _export header).</p>`;
      return;
    }

    const sectionsInBundle = SECTIONS.filter(k => k in bundle);
    const summaries = sectionsInBundle.map(k => {
      const current = State.get(k) || {};
      const incoming = bundle[k] || {};
      return { key: k, summary: describeDiff(k, current, incoming) };
    });

    const checkboxes = summaries.map(({ key, summary }) => `
      <label style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;cursor:pointer;">
        <input type="checkbox" class="imp-section-cb" data-key="${key}" checked
               style="width:auto;margin-top:3px;flex:none;">
        <div>
          <div style="font-size:0.9rem;color:var(--text);font-weight:500;">${key}</div>
          <div style="font-size:0.82rem;color:var(--text-dim);">${Utils.escapeHtml(summary)}</div>
        </div>
      </label>`).join('');

    el.style.display = '';
    el.innerHTML = `
      <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:16px 20px;">
        <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:12px;text-transform:uppercase;letter-spacing:0.06em;">
          Export from ${bundle._export.date ? new Date(bundle._export.date).toLocaleDateString() : 'unknown date'}
          · v${bundle._export.version || '?'}
        </div>
        <div id="imp-checks">${checkboxes}</div>
        <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;">
          <button class="btn btn-primary btn-sm" id="imp-run">Import Selected</button>
          <button class="btn btn-ghost btn-sm" id="imp-cancel">Cancel</button>
        </div>
        <p id="imp-status" style="font-size:0.82rem;min-height:1.2em;margin-top:8px;"></p>
      </div>`;

    el.querySelector('#imp-cancel').addEventListener('click', () => { el.style.display = 'none'; });

    el.querySelector('#imp-run').addEventListener('click', async () => {
      const selected = [...el.querySelectorAll('.imp-section-cb:checked')].map(cb => cb.dataset.key);
      if (!selected.length) { Utils.toast('Select at least one section.', 'error'); return; }

      const runBtn   = el.querySelector('#imp-run');
      const statusEl = el.querySelector('#imp-status');
      runBtn.disabled = true;
      statusEl.textContent = 'Importing…';
      statusEl.style.color = 'var(--text-muted)';

      try {
        for (const key of selected) {
          State.set(key, bundle[key]);
          await State.save(key, `Import ${key} from bundle via Settings`);
        }
        statusEl.textContent = `Imported: ${selected.join(', ')}`;
        statusEl.style.color = 'var(--green)';
        Utils.toast(`Imported ${selected.length} section${selected.length > 1 ? 's' : ''} successfully.`);
        el.style.display = 'none';
      } catch (err) {
        statusEl.textContent = `Import failed: ${Utils.escapeHtml(err.message)}`;
        statusEl.style.color = 'var(--red)';
        Utils.toast('Import failed: ' + err.message, 'error');
        runBtn.disabled = false;
      }
    });
  }

  function describeDiff(key, current, incoming) {
    if (key === 'recipes') {
      const curCount = (current.originals || []).length;
      const incCount = (incoming.originals || []).length;
      return `${incCount} original${incCount !== 1 ? 's' : ''} (currently ${curCount})`;
    }
    if (key === 'inventory') {
      const curSpirits = Object.values(current.base_spirits || {}).flat().length;
      const incSpirits = Object.values(incoming.base_spirits || {}).flat().length;
      return `${incSpirits} spirit entr${incSpirits !== 1 ? 'ies' : 'y'} (currently ${curSpirits})`;
    }
    if (key === 'profile') {
      const axes = Object.keys(incoming.flavor_profile?.axes || {}).length;
      return `${axes} flavor axis setting${axes !== 1 ? 's' : ''}`;
    }
    if (key === 'barkeeper') {
      return `Bartender: ${incoming.identity?.name || 'Barkeeper Bjorn'}`;
    }
    return 'Will be replaced with bundle data.';
  }

  return { exportJSON, exportAIContext, renderImportUI };
})();
