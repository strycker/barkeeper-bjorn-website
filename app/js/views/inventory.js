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
    { key: 'mixers_bottles',           label: 'Mixers & Soft Drinks',      hint: 'Orgeat, tonic, ginger beer, cola, soda water…' },
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

  // Tier color classes are static (not from config)
  const TIER_COLORS = {
    '': 'tier-unset',
    'well': 'tier-well',
    'standard': 'tier-standard',
    'premium': 'tier-premium',
    'craft': 'tier-craft',
    'boutique': 'tier-boutique',
    'rare/exceptional': 'tier-rare-exceptional',
  };

  // Returns canonical sectionKey for a given style string (first match wins).
  // Used when saving an edit to move a bottle to a new section if the category changed.
  function canonicalSectionForStyle(style) {
    const ss = Config.sectionStyle();
    for (const [key, val] of Object.entries(ss)) {
      if (val === style) return key;
    }
    return null;
  }

  function loadCustomTypes() {
    try { return JSON.parse(localStorage.getItem('bb_custom_types') || '[]'); }
    catch { return []; }
  }

  function saveCustomType(t) {
    const list = loadCustomTypes();
    if (t && !list.includes(t) && !Config.typeOptions().includes(t)) {
      list.push(t);
      localStorage.setItem('bb_custom_types', JSON.stringify(list));
    }
  }

  function allTypeOptions() { return [...Config.typeOptions(), ...loadCustomTypes()]; }



  // Parse a free-text bottle name into { style, type, brand } using the catalog.
  // AI-11: returns a non-enumerable _lowConfidence flag so callers can decide
  // whether to ask Claude for a better parse. Low confidence = no brand AND
  // no type keyword matched (i.e. the type ended up as the section default OR
  // as the raw input name itself — inventory.js:110 fallback chain).
  function parseBottleEntry(rawName, sectionKey) {
    const lower = rawName.toLowerCase();
    const now = new Date().toISOString();
    const sectionStyle      = Config.sectionStyle();
    const brandCatalog      = Config.brandCatalog();
    const typeKeywords      = Config.typeKeywords();
    const sectionTypeDefault = Config.sectionTypeDefault();

    let style = sectionStyle[sectionKey] || '';
    let type  = '';
    let brand = '';
    let typeKeywordHit = false;
    let brandHit = false;

    // Brand catalog — longest-first for greedy match (sorted at call time)
    for (const [kw, info] of brandCatalog) {
      if (lower.includes(kw)) {
        brand = info.brand;
        brandHit = true;
        if (!type && info.typeHint) type = info.typeHint;
        break;
      }
    }

    // Type keywords — override brand hint when a more-specific keyword is found
    for (const [kw, typeName] of typeKeywords) {
      if (lower.includes(kw)) {
        type = typeName;
        typeKeywordHit = true;
        break;
      }
    }

    // style is always the plural group name from SECTION_STYLE; type carries the specific spirit
    if (!style) style = 'Other / Misc.';

    // Ensure type is never empty: use section-specific short default rather than group name
    let typeFellBackToRaw = false;
    if (!type) {
      type = sectionTypeDefault[sectionKey] || rawName;
      if (type === rawName) typeFellBackToRaw = true;
    }

    const entry = { style, type, brand, tier: '', best_for: '', notes: '', created_at: now, updated_at: now };
    // Low confidence when the parser had nothing to anchor on — no brand match
    // and no type keyword match (Pitfall 6 — only call Claude in this case).
    Object.defineProperty(entry, '_lowConfidence', {
      value: (!brandHit && !typeKeywordHit) || typeFellBackToRaw,
      enumerable: false,
      writable: true,
    });
    return entry;
  }

  // AI-11: Claude fallback for low-confidence paste-a-line parses.
  // Cached by raw input string in localStorage.bb_parse_cache so a repeat of
  // the same ambiguous line never costs a second API call (Pitfall 6).
  // - No key  → returns null immediately (Phase-5 byte-identical behavior).
  // - Network/parse errors → returns null (fail-soft; caller keeps regex result).
  // - Successful parse is wrapped through WriteGate.validate('inventory', ...);
  //   if the wrapped payload doesn't validate, discard and return null.
  // Returns a normalized bottle object on success, or null otherwise.
  async function aiParseBottle(rawLine, sectionKey) {
    const line = String(rawLine || '').trim();
    if (!line) return null;
    if (typeof ClaudeAPI === 'undefined') return null;
    // Cache check first — Pitfall 6.
    let cache = {};
    try { cache = JSON.parse(localStorage.getItem('bb_parse_cache') || '{}'); }
    catch { cache = {}; }
    if (cache && Object.prototype.hasOwnProperty.call(cache, line)) {
      return cache[line];
    }
    if (typeof ClaudeAPI.getKey !== 'function' || ClaudeAPI.getKey() === '') {
      return null;   // no key — Phase 5 byte-identical, no network.
    }
    let bottle = null;
    try {
      // NOTE on requestJSON vs callMessages: ClaudeAPI.requestJSON('inventory', ...)
      // would Normalize.byKey('inventory', singleBottle) which collapses a
      // single-bottle payload into an empty inventory (the bottle fields are
      // dropped because they don't match the top-level inventory schema). So
      // we use the lower-level callMessages here and wrap-then-validate the
      // result against the inventory schema below — same fail-closed contract,
      // correct shape preservation. (Rule 3 deviation from plan Task 2 step 1.)
      const raw = await ClaudeAPI.callMessages({
        model:      'claude-haiku-4-5',
        max_tokens: 256,
        system: 'Parse this single bottle line into a JSON object with keys {style, type, brand?, tier?}. style is the broad category (e.g. "Bourbon", "Gin", "Mezcal"); type is the specific style; brand is the producer if discernible. Return ONE JSON object — no prose, no markdown, no code fences.',
        messages: [{ role: 'user', content: line }],
      });
      const parsed = ClaudeAPI.extractJSON(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
      // Build a candidate bottle with required {style} and timestamps.
      const now = new Date().toISOString();
      const candidate = {
        style:      typeof parsed.style === 'string' && parsed.style ? parsed.style : '',
        type:       typeof parsed.type  === 'string' ? parsed.type  : '',
        brand:      typeof parsed.brand === 'string' ? parsed.brand : '',
        tier:       typeof parsed.tier  === 'string' ? parsed.tier  : '',
        best_for:   '',
        notes:      '',
        created_at: now,
        updated_at: now,
      };
      if (!candidate.style) return null;
      // Validate by wrapping into a minimal inventory payload — WriteGate then
      // exercises the same schema path that the AI-08/AI-10 writes go through.
      const sec = sectionKey || 'base_spirits.other';
      const wrap = Normalize.byKey('inventory', {});
      const parts = sec.split('.');
      if (parts.length === 2) {
        wrap[parts[0]] = wrap[parts[0]] || {};
        wrap[parts[0]][parts[1]] = [candidate];
      } else {
        wrap[sec] = [candidate];
      }
      const errs = await WriteGate.validate('inventory', wrap);
      if (errs && errs.length) return null;   // invalid → discard; never accept
      bottle = candidate;
    } catch (_err) {
      // Fail-soft per AI-SPEC §4 / Pitfall 6: never block the paste flow.
      return null;
    }
    // Cache the successful parse under the raw input string (never the API key).
    try {
      cache[line] = bottle;
      localStorage.setItem('bb_parse_cache', JSON.stringify(cache));
    } catch { /* storage full / disabled — silent */ }
    return bottle;
  }

  function parseBottleSection(name) {
    const lower = name.toLowerCase();
    for (const { key, words } of Config.quickAddRules()) {
      for (const w of words) {
        if (lower.includes(w)) return key;
      }
    }
    return null;
  }

  function sectionLabelByKey(key) {
    const found = BOTTLE_SECTIONS.find(s => s.key === key);
    return found ? found.label : key;
  }

  let _dirty = false;

  // One-at-a-time inline edit state
  let _openEdit = null; // { sectionKey, index, snapshot, formEl, gridEl, container }

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

  function renderBottleSection(container, sectionKey, sectionLabel, hint, inv) {
    const arr = getNestedArr(inv, sectionKey);

    const section = document.createElement('div');
    section.className = 'inventory-section';
    section.dataset.sectionKey = sectionKey;

    // Safe ID for datalist
    const safeId = sectionKey.replace(/\./g, '-');

    section.innerHTML = `
      <div class="inventory-section-title">${Utils.escapeHtml(sectionLabel)}</div>
      <div class="bottle-grid" id="bottles-${safeId}"></div>
      <div class="add-bottle-row" style="margin-top:12px;">
        <input type="text" class="bottle-add-input" placeholder="${Utils.escapeHtml('Add a ' + sectionLabel + ' bottle (style)')}" list="type-options-${safeId}" style="flex:1;">
        <button class="btn btn-primary btn-sm bottle-add-btn">Add Bottle</button>
      </div>
      <datalist id="type-options-${safeId}">
        ${allTypeOptions().map(t => `<option value="${Utils.escapeHtml(t)}">`).join('')}
      </datalist>
      <div class="canonical-suggestion" data-for="${safeId}" style="display:none;"></div>`;

    const grid = section.querySelector('.bottle-grid');
    renderBottleChips(grid, arr, sectionKey, inv);

    const addBtn = section.querySelector('.bottle-add-btn');
    const nameInput = section.querySelector('.bottle-add-input');
    const canonicalBanner = section.querySelector('.canonical-suggestion');

    // Canonical suggestion banner
    nameInput.addEventListener('input', () => {
      const val = nameInput.value;
      if (!val.trim()) {
        canonicalBanner.style.display = 'none';
        canonicalBanner.innerHTML = '';
        return;
      }
      const suggestion = (typeof CanonicalNames !== 'undefined') ? CanonicalNames.suggest(val) : null;
      if (suggestion) {
        canonicalBanner.innerHTML = `<span>Did you mean: <strong>${Utils.escapeHtml(suggestion.canonical)}</strong>?</span> <button class="canonical-suggestion__action btn btn-ghost btn-sm" type="button">Use it</button>`;
        canonicalBanner.style.display = 'flex';
        canonicalBanner.querySelector('.canonical-suggestion__action').addEventListener('click', () => {
          nameInput.value = suggestion.canonical;
          nameInput.dispatchEvent(new Event('input'));
          nameInput.focus();
        });
      } else {
        canonicalBanner.style.display = 'none';
        canonicalBanner.innerHTML = '';
      }
    });

    // Add bottle handler (AI-11: low-confidence regex parses fall back to Claude)
    addBtn.addEventListener('click', async () => {
      const name = nameInput.value.trim();
      if (!name) return;
      // Phase 5 regex parse first — always runs (free, deterministic).
      let newEntry = parseBottleEntry(name, sectionKey);
      // AI-11 fallback: only on low confidence AND only with a key (fail-soft
      // returns the regex result if Claude errors or no key). Paste-a-line
      // stages a reviewable chip; the user still confirms via the existing
      // save flow — no AI -> GitHub auto-write (T-07-33).
      if (newEntry._lowConfidence) {
        try {
          const ai = await aiParseBottle(name, sectionKey);
          if (ai) {
            newEntry = ai;
            // Optional UI hint — escape model output before injecting (T-07-30).
            if (canonicalBanner) {
              canonicalBanner.innerHTML = `<span class="ai-parse-hint">Parsed with AI: <strong>${Utils.escapeHtml(ai.type || ai.style || name)}</strong>${ai.brand ? ' · ' + Utils.escapeHtml(ai.brand) : ''}</span>`;
              canonicalBanner.style.display = 'flex';
            }
          }
        } catch { /* fail-soft — keep the regex result */ }
      }
      State.patch('inventory', i2 => {
        const arr2 = getNestedArr(i2, sectionKey);
        arr2.push(newEntry);
        setNestedArr(i2, sectionKey, arr2);
      });
      markDirty();
      nameInput.value = '';
      // Don't clobber the AI-parse hint immediately — leave it visible briefly.
      if (!newEntry || !newEntry._fromAI) {
        canonicalBanner.style.display = 'none';
        canonicalBanner.innerHTML = '';
      }
      renderBottleChips(grid, getNestedArr(State.get('inventory'), sectionKey), sectionKey, State.get('inventory'));
    });

    nameInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') addBtn.click();
    });

    container.appendChild(section);
  }

  function renderBottleChips(grid, arr, sectionKey, inv) {
    grid.innerHTML = '';
    arr.forEach((bottle, i) => {
      // Backward compat: handle legacy string or {name} shapes
      const displayName = bottle.type || bottle.style || bottle.name || (typeof bottle === 'string' ? bottle : '');
      const brand = bottle.brand || '';
      const tierClass = TIER_COLORS[bottle.tier] || 'tier-unset';
      const tierLabel = Config.tierLabels();

      // Build tooltip from non-empty parts
      const tooltipParts = [
        displayName,
        brand || null,
        bottle.tier ? ((tierLabel[bottle.tier] || bottle.tier) + ' tier') : null
      ].filter(Boolean);
      const tooltipText = tooltipParts.join(' — ');

      const chip = document.createElement('div');
      chip.className = 'bottle-chip';
      chip.innerHTML = `
        <span class="bottle-tier-dot ${tierClass}" aria-hidden="true"></span>
        <span class="bottle-chip-name">${Utils.escapeHtml(displayName)}</span>
        ${brand ? `<span class="bottle-chip-brand"> · ${Utils.escapeHtml(brand)}</span>` : ''}
        <button class="bottle-chip-remove" aria-label="Remove ${Utils.escapeHtml(displayName)}">×</button>`;
      chip.title = tooltipText;

      chip.querySelector('.bottle-chip-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        // Close open edit if it references this chip
        if (_openEdit && _openEdit.sectionKey === sectionKey && _openEdit.index === i) {
          closeEditForm(false);
          return;
        }
        State.patch('inventory', i2 => {
          const arr2 = getNestedArr(i2, sectionKey);
          arr2.splice(i, 1);
          setNestedArr(i2, sectionKey, arr2);
        });
        markDirty();
        renderBottleChips(grid, getNestedArr(State.get('inventory'), sectionKey), sectionKey, State.get('inventory'));
      });

      // Chip body click → open edit form (not × button)
      chip.addEventListener('click', (e) => {
        if (e.target.classList.contains('bottle-chip-remove')) return;
        openEditForm(grid, null, sectionKey, i, State.get('inventory'));
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

  function openEditForm(grid, container, sectionKey, index, inv) {
    // Close any open form first (revert behavior)
    if (_openEdit) closeEditForm(true);

    const arr = getNestedArr(inv, sectionKey);
    const entry = arr[index];
    if (!entry) return;

    // Coerce legacy {name} for editing
    if (!entry.style && entry.name) { entry.style = entry.name; delete entry.name; }

    const snapshot = JSON.parse(JSON.stringify(entry));

    // Safe datalist ID
    const safeId = sectionKey.replace(/\./g, '-');

    // Config read at render time (after Config.load() in app.js — never empty)
    const categories = Config.categories();
    const tiers      = Config.tiers();
    const tierLabel  = Config.tierLabels();

    // Build category <select>: canonical list + preserve any custom value not in list
    const catInList = categories.includes(entry.style || '');
    const customCatOption = (!catInList && entry.style)
      ? `<option value="${Utils.escapeHtml(entry.style)}" selected>${Utils.escapeHtml(entry.style)}</option>`
      : '';
    const catOptions = categories.map(c =>
      `<option value="${Utils.escapeHtml(c)}"${entry.style === c ? ' selected' : ''}>${Utils.escapeHtml(c)}</option>`
    ).join('');

    const formEl = document.createElement('div');
    formEl.className = 'bottle-edit-form';
    formEl.innerHTML = `
      <div class="bottle-edit-fields">
        <label>Category <select data-field="style" required title="Broad category (Bourbon, Gin, Vermouth, Mixers…)">
          <option value="">— select category —</option>
          ${customCatOption}
          ${catOptions}
        </select></label>
        <label>Specific Style/Type <input type="text" data-field="type" list="type-options-${safeId}" placeholder="e.g. Single Barrel, Cask Strength, Espadín" title="The specific bottle's style/type (e.g. Single Barrel, Espadín)" value="${Utils.escapeHtml(entry.type || '')}"></label>
        <label>Sub-type <input type="text" data-field="subtype" placeholder="e.g. Terroir, Navy Strength, Barrel-Aged" title="Further specialization (e.g. Terroir Gin, Navy Strength)" value="${Utils.escapeHtml(entry.subtype || '')}"></label>
      </div>
      <button type="button" class="bottle-edit-toggle">More fields ▾</button>
      <div class="bottle-edit-fields--expanded" style="display:none;">
        <div class="bottle-edit-fields">
          <label>Brand <input type="text" data-field="brand" value="${Utils.escapeHtml(entry.brand || '')}"></label>
          <label>Country <input type="text" data-field="nationality" placeholder="e.g. Scotland, Mexico, USA" title="Country of origin" value="${Utils.escapeHtml(entry.nationality || '')}"></label>
          <label>Region <input type="text" data-field="region" placeholder="e.g. Oaxaca, Speyside, Kentucky" title="Region within the country (e.g. Oaxaca, Speyside, Islay)" value="${Utils.escapeHtml(entry.region || '')}"></label>
          <label>Tier <select data-field="tier">
            <option value="">Unset</option>
            ${tiers.map(t => `<option value="${Utils.escapeHtml(t)}" ${entry.tier === t ? 'selected' : ''}>${Utils.escapeHtml(tierLabel[t] || t)}</option>`).join('')}
          </select></label>
          <label>Best for <select data-field="best_for">
            <option value="" ${!entry.best_for ? 'selected' : ''}></option>
            <option value="sipping" ${entry.best_for === 'sipping' ? 'selected' : ''}>Sipping</option>
            <option value="mixing" ${entry.best_for === 'mixing' ? 'selected' : ''}>Mixing</option>
            <option value="both" ${entry.best_for === 'both' ? 'selected' : ''}>Both</option>
          </select></label>
          <label>Notes <textarea rows="2" data-field="notes">${Utils.escapeHtml(entry.notes || '')}</textarea></label>
        </div>
      </div>
      <div class="bottle-edit-actions">
        <button type="button" class="btn btn-ghost btn-sm bottle-edit-revert">Revert Changes</button>
        <button type="button" class="btn btn-primary btn-sm bottle-edit-save">Save Bottle</button>
      </div>`;

    // Insert immediately after the grid
    grid.parentNode.insertBefore(formEl, grid.nextSibling);
    _openEdit = { sectionKey, index, snapshot, formEl, gridEl: grid, container };

    // More fields toggle
    formEl.querySelector('.bottle-edit-toggle').addEventListener('click', () => {
      const ext = formEl.querySelector('.bottle-edit-fields--expanded');
      const expanded = ext.style.display !== 'none';
      ext.style.display = expanded ? 'none' : '';
      formEl.querySelector('.bottle-edit-toggle').textContent = expanded ? 'More fields ▾' : 'Fewer fields ▴';
    });

    // Save Bottle
    formEl.querySelector('.bottle-edit-save').addEventListener('click', () => {
      const styleEl  = formEl.querySelector('[data-field="style"]');
      const newStyle = (styleEl ? styleEl.value : '').trim();
      if (!newStyle) {
        Utils.showToast('Category is required — please select one.', 'error');
        if (styleEl) styleEl.focus();
        return;
      }

      const oldStyle    = snapshot.style || '';
      const oldSection  = sectionKey;
      const newSection  = canonicalSectionForStyle(newStyle);
      const doMove      = newSection && newSection !== oldSection;

      const sectionTypeDefault = Config.sectionTypeDefault();

      // Collect all form field values
      const updatedFields = {};
      formEl.querySelectorAll('[data-field]').forEach(el => {
        updatedFields[el.dataset.field] = (el.value || '').trim();
      });
      if (!updatedFields.type) updatedFields.type = sectionTypeDefault[doMove ? newSection : oldSection] || newStyle;
      if (updatedFields.type) saveCustomType(updatedFields.type);
      const now = new Date().toISOString();

      if (doMove) {
        // Move bottle to the canonical section for the new category
        State.patch('inventory', i2 => {
          const srcArr = getNestedArr(i2, oldSection);
          const bottle = srcArr.splice(index, 1)[0];
          if (!bottle) return;
          Object.assign(bottle, updatedFields);
          if (!bottle.created_at) bottle.created_at = now;
          bottle.updated_at = now;
          const dstArr = getNestedArr(i2, newSection);
          dstArr.push(bottle);
          setNestedArr(i2, newSection, dstArr);
          setNestedArr(i2, oldSection, srcArr);
        });
        markDirty();
        _openEdit = null;
        formEl.remove();
        // Re-render both affected sections
        const renderSection = (secKey) => {
          const safeSecId = secKey.replace(/\./g, '-');
          const g = document.getElementById(`bottles-${safeSecId}`);
          if (g) renderBottleChips(g, getNestedArr(State.get('inventory'), secKey), secKey, State.get('inventory'));
        };
        renderSection(oldSection);
        renderSection(newSection);
        Utils.showToast(`Moved to ${sectionLabelByKey(newSection)}`);
      } else {
        State.patch('inventory', i2 => {
          const a2 = getNestedArr(i2, oldSection);
          const e2 = a2[index];
          if (!e2) return;
          Object.assign(e2, updatedFields);
          if (!e2.created_at) e2.created_at = now;
          e2.updated_at = now;
        });
        markDirty();
        closeEditForm(false);
      }
    });

    // Revert Changes
    formEl.querySelector('.bottle-edit-revert').addEventListener('click', () => closeEditForm(true));
  }

  function closeEditForm(doRevert) {
    if (!_openEdit) return;
    const { sectionKey, index, snapshot, formEl, gridEl } = _openEdit;
    if (doRevert) {
      State.patch('inventory', i2 => {
        const a2 = getNestedArr(i2, sectionKey);
        if (a2[index]) Object.assign(a2[index], snapshot);
      });
    }
    formEl.remove();
    _openEdit = null;
    // Re-render chips for this section
    renderBottleChips(gridEl, getNestedArr(State.get('inventory'), sectionKey), sectionKey, State.get('inventory'));
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

  function renderQuickAddBar(parentEl, inv) {
    const bar = document.createElement('div');
    bar.className = 'inv-quick-add';
    bar.innerHTML = `
      <input type="text" class="inv-quick-add-input" placeholder="Quick add a bottle — e.g. Bulleit Bourbon" aria-label="Quick add a bottle">
      <button class="btn btn-primary btn-sm inv-quick-add-btn">Add</button>
      <span class="inv-quick-add-hint">Type a bottle, press Enter</span>`;

    const input   = bar.querySelector('.inv-quick-add-input');
    const addBtn  = bar.querySelector('.inv-quick-add-btn');

    function attemptAdd() {
      const name = input.value.trim();
      if (!name) return;

      const sectionKey = parseBottleSection(name);

      if (sectionKey) {
        commitQuickAdd(name, sectionKey, inv);
        input.value = '';
        removePicker();
      } else {
        showPicker(name);
      }
    }

    function showPicker(name) {
      removePicker();
      const picker = document.createElement('div');
      picker.className = 'inv-quick-add-picker';
      picker.innerHTML = `
        <label for="qab-section-select">Add to:</label>
        <select id="qab-section-select">
          ${BOTTLE_SECTIONS.map(s => `<option value="${Utils.escapeHtml(s.key)}">${Utils.escapeHtml(s.label)}</option>`).join('')}
        </select>
        <button class="btn btn-primary btn-sm" id="qab-confirm-btn">Confirm</button>
        <button class="btn btn-ghost btn-sm" id="qab-cancel-btn">Cancel</button>`;
      bar.appendChild(picker);

      picker.querySelector('#qab-confirm-btn').addEventListener('click', () => {
        const sel = picker.querySelector('#qab-section-select').value;
        commitQuickAdd(name, sel, inv);
        input.value = '';
        removePicker();
      });
      picker.querySelector('#qab-cancel-btn').addEventListener('click', () => {
        removePicker();
        input.focus();
      });
      picker.querySelector('#qab-section-select').focus();
    }

    function removePicker() {
      const existing = bar.querySelector('.inv-quick-add-picker');
      if (existing) existing.remove();
    }

    async function commitQuickAdd(name, sectionKey, inv) {
      // Phase 5 regex parse first — always runs (free, deterministic).
      let newEntry = parseBottleEntry(name, sectionKey);
      // AI-11 fallback: only on low confidence AND only with a key (fail-soft
      // returns the regex result if Claude errors or no key). Mirrors the
      // main add-bottle handler above so the quick-add picker also benefits
      // from AI parsing on ambiguous lines.
      if (newEntry._lowConfidence) {
        try {
          const ai = await aiParseBottle(name, sectionKey);
          if (ai) newEntry = ai;
        } catch { /* fail-soft — keep the regex result */ }
      }
      State.patch('inventory', i2 => {
        const arr2 = getNestedArr(i2, sectionKey);
        arr2.push(newEntry);
        setNestedArr(i2, sectionKey, arr2);
      });
      markDirty();
      // Switch to Spirits tab and re-render if needed
      const spiritsTab = document.querySelector('.tab[data-tab="tab-spirits"]');
      if (spiritsTab && !spiritsTab.classList.contains('active')) {
        spiritsTab.click();
      } else {
        // Tab already active — refresh the section's chip grid
        const safeId = sectionKey.replace(/\./g, '-');
        const grid = document.getElementById(`bottles-${safeId}`);
        if (grid) renderBottleChips(grid, getNestedArr(State.get('inventory'), sectionKey), sectionKey, State.get('inventory'));
      }
      Utils.showToast(`Added "${name}" to ${sectionLabelByKey(sectionKey)}`);
    }

    addBtn.addEventListener('click', attemptAdd);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') attemptAdd();
      if (e.key === 'Escape') removePicker();
    });

    parentEl.appendChild(bar);
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
    _openEdit = null;
    const inv = State.get('inventory');
    if (!inv) {
      Utils.showError(container, 'Inventory data not loaded.');
      return;
    }

    container.innerHTML = `
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
        <div>
          <h1>Inventory</h1>
          <p>Your current bar — add or remove bottles. Changes are saved back to your GitHub repo.</p>
        </div>
        <button class="btn btn-ghost btn-sm ai-advice-btn" id="inv-ai-best-bottle" style="align-self:center;" title="Ask Bjorn what bottle to buy next">✨ Best bottle to add (AI)</button>
      </div>

      <div id="inv-save-bar" style="display:none;position:sticky;top:60px;z-index:50;
           background:var(--bg);border-bottom:1px solid var(--amber-dim);padding:10px 0 10px;
           align-items:center;gap:12px;margin-bottom:16px;">
        <span style="color:var(--amber);font-size:0.88rem;">Unsaved changes</span>
        <button class="btn btn-primary btn-sm" id="inv-save-btn">Save to GitHub</button>
        <button class="btn btn-ghost btn-sm" id="inv-discard-btn">Discard</button>
      </div>

      <div id="inv-sections"></div>`;

    document.getElementById('inv-ai-best-bottle')?.addEventListener('click', () => {
      if (typeof ChatView === 'undefined' || !ChatView.openDrawer) {
        Utils.showToast('Chat module not loaded.', 'error');
        return;
      }
      // Drawer's buildContext() already grounds in current inventory + vetoes;
      // the seed just asks the question.
      ChatView.openDrawer({
        seed: 'Given my current inventory and vetoes, what single bottle should I add next, and why? Focus on the biggest unlock for my taste profile.',
      });
    });

    document.getElementById('inv-save-btn')?.addEventListener('click', saveInventory);
    document.getElementById('inv-discard-btn')?.addEventListener('click', () => {
      _dirty = false;
      _openEdit = null;
      Utils.showToast('Changes discarded', 'info');
      render(container);
    });

    const sectionsEl = document.getElementById('inv-sections');

    // ── Search bar (INV-01, INV-02) ──────────────────────────────────────────
    const searchBar = document.createElement('div');
    searchBar.className = 'inv-search-bar';
    searchBar.innerHTML = `
      <input type="text" class="inv-search-input" placeholder="Search inventory…"
             aria-label="Search inventory">
      <select class="inv-category-select" aria-label="Jump to category">
        <option value="">All categories</option>
        ${[...BOTTLE_SECTIONS, ...STRING_SECTIONS].map(s =>
          `<option value="${Utils.escapeHtml(s.key)}">${Utils.escapeHtml(s.label)}</option>`
        ).join('')}
      </select>`;
    sectionsEl.appendChild(searchBar);

    const searchInput    = searchBar.querySelector('.inv-search-input');
    const categorySelect = searchBar.querySelector('.inv-category-select');

    // Real-time chip filter — scoped to #tab-content (never query document directly)
    searchInput.addEventListener('input', () => {
      const query      = searchInput.value.toLowerCase();
      const tabContent = document.querySelector('#tab-content');
      if (!tabContent) return;

      tabContent.querySelectorAll('.bottle-chip').forEach(chip => {
        const text = chip.textContent.toLowerCase();
        chip.style.display = text.includes(query) ? '' : 'none';
      });

      // Hide section title when no chips are visible in that section
      tabContent.querySelectorAll('.inventory-section').forEach(sec => {
        const hasVisible = [...sec.querySelectorAll('.bottle-chip')]
          .some(c => c.style.display !== 'none');
        const title = sec.querySelector('.inventory-section-title');
        if (title) title.style.display = hasVisible ? '' : 'none';
      });
    });

    // Category jump-scroll — smooth scroll to the matching section header
    categorySelect.addEventListener('change', () => {
      const key = categorySelect.value;
      if (!key) return;
      const section = document.querySelector(`.inventory-section[data-sectionKey="${key}"]`);
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      categorySelect.value = '';
    });

    // Quick-add bar (Phase 5)
    renderQuickAddBar(sectionsEl, inv);

    // Tabs (Phase 4: added Equipment tab)
    const tabsEl = document.createElement('div');
    tabsEl.className = 'tabs';
    const tabs = [
      { id: 'tab-spirits',   label: 'Spirits & Bottles' },
      { id: 'tab-pantry',    label: 'Pantry & Perishables' },
      { id: 'tab-vetoes',    label: 'Vetoes & Substitutes' },
      { id: 'tab-equipment', label: 'Equipment' },
    ];

    const contentEl = document.createElement('div');
    contentEl.id = 'tab-content';

    tabs.forEach((t, i) => {
      const tab = document.createElement('div');
      tab.className = 'tab' + (i === 0 ? ' active' : '');
      tab.textContent = t.label;
      tab.dataset.tabId = t.id;
      tab.dataset.tab = t.id;
      tab.addEventListener('click', () => {
        tabsEl.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
        tab.classList.add('active');
        // Close any open edit form when switching tabs
        if (_openEdit) closeEditForm(true);
        renderTabContent(t.id, inv, contentEl);
        // Reset search so stale filter from previous tab does not apply to new tab content
        if (searchInput) {
          searchInput.value = '';
          searchInput.dispatchEvent(new Event('input'));
        }
      });
      tabsEl.appendChild(tab);
    });

    sectionsEl.appendChild(tabsEl);
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
    } else if (tabId === 'tab-equipment') {
      renderEquipmentSection(container, inv);
    }
  }

  function renderEquipmentSection(contentEl, inv) {
    const eq = inv.equipment || (inv.equipment = { strainers: [] });
    const strainerOptions = Config.strainerOptions();
    const checked = new Set((eq.strainers || []).filter(s => strainerOptions.includes(s)));
    const emptyHint = checked.size === 0
      ? '<p class="empty-hint" style="color:var(--text-dim);">No equipment tracked yet. Check the strainers you own below.</p>'
      : '';
    contentEl.innerHTML = `
      <section class="equipment-section">
        <h3>Strainers</h3>
        ${emptyHint}
        <div class="equipment-strainer-grid">
          ${strainerOptions.map(name => `
            <label class="strainer-option${checked.has(name) ? ' checked' : ''}">
              <input type="checkbox" data-strainer="${Utils.escapeHtml(name)}" ${checked.has(name) ? 'checked' : ''}>
              <span>${Utils.escapeHtml(name)}</span>
            </label>
          `).join('')}
        </div>
      </section>`;

    contentEl.querySelectorAll('input[data-strainer]').forEach(cb => {
      cb.addEventListener('change', () => {
        const name = cb.dataset.strainer;
        State.patch('inventory', i2 => {
          i2.equipment = i2.equipment || { strainers: [] };
          i2.equipment.strainers = i2.equipment.strainers || [];
          const list = i2.equipment.strainers;
          const idx = list.indexOf(name);
          if (cb.checked && idx === -1) list.push(name);
          if (!cb.checked && idx !== -1) list.splice(idx, 1);
        });
        markDirty();
        // Re-render this tab to refresh empty state + .checked classes
        const tabBtn = document.querySelector('.tab[data-tab="tab-equipment"]');
        if (tabBtn) tabBtn.click();
      });
    });
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
