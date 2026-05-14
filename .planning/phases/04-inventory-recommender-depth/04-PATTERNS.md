# Phase 4: Inventory & Recommender Depth - Pattern Map

**Mapped:** 2026-05-14
**Files analyzed:** 8
**Analogs found:** 7 / 8

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `app/js/views/inventory.js` | view | CRUD | self (extend) | exact |
| `app/js/views/recommender.js` | view | request-response | self (extend) | exact |
| `app/js/recommender-engine.js` | service | transform | self (extend) | exact |
| `app/js/normalize.js` | utility | transform | self (extend) | exact |
| `app/js/canonical-names.js` | utility | request-response | `app/js/recommender-engine.js` (IIFE structure) | role-match |
| `app/css/app.css` | config | — | self (extend) | exact |
| `schema/inventory.schema.json` | config | — | self (extend) | exact |
| `app/js/classics-db.js` | config/data | — | self (extend) | exact |

---

## Pattern Assignments

### `app/js/views/inventory.js` (view, CRUD — major extension)

**Analog:** `app/js/views/inventory.js` (self — brownfield extension)

**IIFE module + module-level state** (lines 1–46):
```js
const InventoryView = (() => {
  const BOTTLE_SECTIONS = [ ... ];
  const STRING_SECTIONS = [ ... ];

  // Phase 4: replace these two constants with 6-tier versions
  const TIER_COLORS = {
    'industrial': 'tier-industrial',
    'premium-accessible': 'tier-premium-accessible',
    'boutique': 'tier-boutique',
    'rare/exceptional': 'tier-rare',
  };
  const TIERS = ['industrial', 'premium-accessible', 'boutique', 'rare/exceptional'];

  let _dirty = false;
  // Phase 4: add  let _openEditForm = null;  (one-at-a-time edit rule)
```

**Dot-path helpers** (lines 48–66) — reuse unchanged for `equipment.strainers`:
```js
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
```

**Chip render pattern** (lines 125–153) — the extension point for inline edit (D-07):
```js
function renderBottleChips(grid, arr, sectionKey, inv) {
  grid.innerHTML = '';
  arr.forEach((bottle, idx) => {
    const chip = document.createElement('div');
    chip.className = 'bottle-chip';
    const tierClass = TIER_COLORS[bottle.tier] || 'tier-industrial';
    chip.innerHTML = `
      <span class="bottle-tier-dot ${tierClass}" ...></span>
      <span>${Utils.escapeHtml(bottle.name)}</span>
      ...
      <button class="chip-remove" ...>×</button>`;
    chip.querySelector('.chip-remove').addEventListener('click', (e) => {
      e.stopPropagation();
      // ... remove + markDirty + re-render
    });
    // Phase 4: chip body click (excluding .chip-remove) → openEditForm(...)
    grid.appendChild(chip);
  });
}
```

**markDirty + sticky save bar** (lines 202–220) — reuse unchanged for inline edit Save Bottle:
```js
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
    document.getElementById('inv-save-bar').style.display = 'none';
    Utils.showToast('Inventory saved to GitHub ✓');
  } catch (err) {
    Utils.showToast(`Save failed: ${err.message}`, 'error');
  }
}
```

**Tab pattern** (lines 303–336) — copy exactly; add 4th entry for Equipment tab:
```js
const tabs = [
  { id: 'tab-spirits',   label: 'Spirits & Bottles' },
  { id: 'tab-pantry',    label: 'Pantry & Perishables' },
  { id: 'tab-vetoes',    label: 'Vetoes & Substitutes' },
  // Phase 4: { id: 'tab-equipment', label: 'Equipment' },
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
    // reset search input
  });
  tabsEl.appendChild(tab);
});
```

**renderTabContent switch** (lines 339–352) — add equipment case:
```js
function renderTabContent(tabId, inv, container) {
  container.innerHTML = '';
  if (tabId === 'tab-spirits') { ... }
  else if (tabId === 'tab-pantry') { ... }
  else if (tabId === 'tab-vetoes') { ... }
  // Phase 4: else if (tabId === 'tab-equipment') { renderEquipmentSection(container, inv); }
}
```

**Add-bottle row with user input** (lines 88–122) — copy as base for Phase 4 simplified add-bottle row (no tier select; add canonical suggestion banner hook):
```js
// Phase 4 add-bottle row: style/name input only + "Add Bottle" button
// oninput on nameInput → CanonicalNames.suggest(value) → render/clear .canonical-suggestion banner
addBtn.addEventListener('click', () => {
  const name = nameInput.value.trim();
  if (!name) return;
  const bottle = {
    style: name,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  current.push(bottle);
  setNestedArr(inv, sectionKey, current);
  markDirty();
  renderBottleChips(grid, current, sectionKey, inv);
  nameInput.value = '';
});
```

**Sticky save bar HTML** (lines 236–244) — copy unchanged:
```js
`<div id="inv-save-bar" style="display:none;position:sticky;top:60px;z-index:50;
     background:var(--bg);border-bottom:1px solid var(--amber-dim);padding:10px 0 10px;
     align-items:center;gap:12px;margin-bottom:16px;">
  <span style="color:var(--amber);font-size:0.88rem;">Unsaved changes</span>
  <button class="btn btn-primary btn-sm" id="inv-save-btn">Save to GitHub</button>
  <button class="btn btn-ghost btn-sm" id="inv-discard-btn">Discard</button>
</div>`
```

**Utils.escapeHtml usage** — every user-supplied string (bottle name, brand, notes, tier) must be wrapped:
```js
Utils.escapeHtml(bottle.style)
Utils.escapeHtml(bottle.brand || '')
Utils.escapeHtml(bottle.notes || '')
```

---

### `app/js/views/recommender.js` (view, request-response — major extension)

**Analog:** `app/js/views/recommender.js` (self — brownfield extension)

**Module-level session state** (lines 14–17) — extend with new variables:
```js
let _activeFilter  = '';
let _activeTab     = 'buildable'; // Phase 4: remove (replaced by _scopeLevel)
let _results       = null;
// Phase 4 additions:
// let _scopeLevel    = 0;  // 0 | 1 | 2
// let _activeOccasions = new Set();
// let _moodSlidersVisible = false; // mobile toggle
```

**_matchesFilter** (lines 18–24) — reuse unchanged; occasion filter is a parallel filter applied alongside base-spirit filter:
```js
function _matchesFilter(recipe, filter) {
  if (!filter) return true;
  const base = (recipe.base || '').toLowerCase();
  if (filter === 'agave') return base.includes('tequila') || ...;
  if (filter === 'whiskey') return base.includes('whiskey') || ...;
  return base.includes(filter);
}
// Phase 4: add _matchesOccasion(recipe, activeOccasions)
// function _matchesOccasion(recipe, occasions) {
//   if (!occasions.size) return true;
//   return (recipe.tags || []).some(tag => occasions.has(tag));
// }
```

**_scoreBar + _difficultyLabel** (lines 26–38) — copy unchanged into Phase 4:
```js
function _scoreBar(score) {
  const pct = Math.round(score * 100);
  const hue = Math.round(score * 120);
  return `<div class="score-bar-wrap" title="Flavor match: ${pct}%">
    <div class="score-bar-fill" style="width:${pct}%;background:hsl(${hue},60%,45%);"></div>
  </div>`;
}
```

**_renderCard** (lines 40–76) — copy as base; Phase 4 extends for two-away missing items (D-18):
```js
// Existing one-away banner pattern to copy for two-away missing items:
`<div class="rec-oneaway-banner">
  <svg ...>...</svg>
  One bottle away: <strong>${Utils.escapeHtml(missingIngredient.name)}</strong>
</div>`
// Phase 4 two-away missing item row (new class .rec-twoaway-missing):
// missing.map(m => `
//   <div class="rec-twoaway-missing">
//     <span style="color:var(--amber);">${Utils.escapeHtml(m.name)}</span>
//     <a class="rec-twoaway-link" href="#" data-item="${Utils.escapeHtml(m.name)}">Add to shopping list →</a>
//   </div>`).join('')
```

**Filter chip render pattern** (lines 167–170) — copy for scope toggle and occasion chips:
```js
// Existing base-spirit chip pattern:
${BASE_FILTERS.map(f => `
  <button class="rec-filter-chip ${_activeFilter === f.value ? 'active' : ''}" data-filter="${f.value}">
    ${Utils.escapeHtml(f.label)}
  </button>`).join('')}
// Phase 4 scope toggle uses same .rec-filter-chip visual but with class .rec-scope-btn:
// ['Only what I have', 'Allow 1 missing', 'Allow 2 missing'].map((label, i) => `
//   <button class="rec-scope-btn ${_scopeLevel === i ? 'active' : ''}" data-level="${i}">${label}</button>`
// ).join('')
```

**_attach event wiring** (lines 89–105) — extend with new event listeners:
```js
function _attach(container) {
  // Existing tab switching → Phase 4: replace with scope toggle
  container.querySelectorAll('.rec-tab').forEach(btn => {
    btn.addEventListener('click', () => { _activeTab = btn.dataset.tab; _rerender(container); });
  });
  // Existing filter chips → keep as-is
  container.querySelectorAll('.rec-filter-chip').forEach(btn => {
    btn.addEventListener('click', () => { _activeFilter = btn.dataset.filter; _rerender(container); });
  });
  // Phase 4: scope toggle, occasion chips, slider onchange, Save to Profile, Reset to saved
}
```

**_rerender** (lines 107–124) — replace tab logic with cumulative scope sections:
```js
// Existing _rerender (shows one tab at a time) — replace with:
// function _rerender(container) {
//   const listEl = container.querySelector('#rec-list');
//   if (!listEl || !_results) return;
//   update scope btn active states
//   update filter chip active states
//   update occasion chip active states
//   let html = _renderSection('You Can Make These', _results.buildable, false);
//   if (_scopeLevel >= 1) html += _renderSection('One Bottle Away', _results.oneAway, 'oneaway');
//   if (_scopeLevel >= 2) html += _renderSection('Two Bottles Away', _results.twoAway, 'twoaway');
//   listEl.innerHTML = html;
// }
```

**render() entry point** (lines 126–183) — copy the new-user guard and engine call pattern:
```js
function render(container) {
  const inventory = State.get('inventory') || {};
  const profile   = State.get('profile')   || {};
  const isNew     = State.isNewUser();

  container.innerHTML = '';

  if (isNew) {
    container.innerHTML = `<div class="rec-splash">...</div>`;
    return;
  }

  _results = RecommenderEngine.recommend(inventory, profile);
  // Phase 4: reset _scopeLevel = 0; reset _activeOccasions = new Set();
  // Phase 4: populate sliders from profile.flavor_profile.axes
  // Phase 4: derive occasion chips from CLASSICS_DB tags at render time
  // ... build two-column layout HTML ...
  _attach(container);
}
```

**Profile save pattern** (copy from settings.js:337–363 sequential-save structure):
```js
// Mood slider "Save to Profile" button handler:
async function saveProfile() {
  try {
    await State.save('profile', 'Update flavor profile via Barkeeper Bjorn');
    Utils.showToast('Profile updated ✓');
  } catch (err) {
    Utils.showToast(`Save failed: ${err.message}`, 'error');
  }
}
```

---

### `app/js/recommender-engine.js` (service, transform — extension)

**Analog:** `app/js/recommender-engine.js` (self — brownfield extension)

**lc() helper** (line 5) — update from BUG-01 fix to D-25 shape:
```js
// Current (handles {name} only — BUG-01 fix):
const lc = s => (typeof s === 'string' ? s : (s?.name ?? String(s ?? ''))).toLowerCase();

// Phase 4 (handles strings, {name} objects, AND new {style, brand} objects):
const lc = s => (typeof s === 'string' ? s : (s?.style ?? s?.name ?? String(s ?? ''))).toLowerCase();
```

**SECTION_MAP extractors** (lines 12–41) — the `.map(lc)` call on each array already handles the lc() update automatically. No changes to SECTION_MAP structure needed.

**_hasIngredient** (lines 53–64) — BUG-02 fix: add spirit-subtype guard:
```js
// Current pure substring match (causes false positives):
function _hasIngredient(lookup, ingredient) {
  const kws = ingredient.keywords.map(k => k.toLowerCase());
  for (const sectionKey of ingredient.searchIn) {
    const items = lookup[sectionKey] || [];
    for (const item of items) {
      for (const kw of kws) {
        if (item.includes(kw)) return { found: true, item };
      }
    }
  }
  return { found: false };
}

// Phase 4: add subtype guard before returning found:
// const SUBTYPE_TOKENS = ['scotch', 'bourbon', 'rye', 'japanese'];
// If kw is a subtype token, verify item also contains that same token (not just any whisky).
// Guard fires only when kw is in SUBTYPE_TOKENS to preserve broad matching for non-subtype kws.
```

**recommend() return value** (line 105) — extend to add twoAway:
```js
// Current:
function recommend(inventory, rawProfile) {
  ...
  const buildable = [];
  const oneAway = [];
  ...
  if (missing.length === 0) { buildable.push(...); }
  else if (missing.length === 1) { oneAway.push(...); }
  ...
  return { buildable, oneAway };
}

// Phase 4: add const twoAway = []; and:
// else if (missing.length === 2) { twoAway.push({ recipe, flavorScore: score, missingIngredients: missing }); }
// return { buildable, oneAway, twoAway };
```

**_normalizeProfile** (lines 84–97) — reuse unchanged; Phase 4 mood slider override creates an ephemeral profile object via object spread before passing to recommend():
```js
// In recommender.js slider onchange:
// const ephemeralProfile = JSON.parse(JSON.stringify(savedProfile));
// ephemeralProfile.flavor_profile.axes.sweetness = { position: sliderValue };
// _results = RecommenderEngine.recommend(inventory, ephemeralProfile);
// _normalizeProfile() inside the engine handles the numeric value directly (map lookup returns undefined → falls through to number check)
```

---

### `app/js/normalize.js` (utility, transform — extension)

**Analog:** `app/js/normalize.js` (self — brownfield extension)

**IIFE module structure** (lines 1–10) — copy unchanged:
```js
const Normalize = (() => {
  function ensureObject(v)  { return (v && typeof v === 'object' && !Array.isArray(v)) ? v : {}; }
  function ensureArray(v)   { return Array.isArray(v) ? v : []; }
  function ensureString(v)  { return typeof v === 'string' ? v : ''; }
  function isoToday()       { return new Date().toISOString().slice(0, 10); }
  ...
```

**INVENTORY_KEYS** (lines 14–34) — `'equipment'` is already in the set. No additions needed for Phase 4 top-level keys.

**coerceBottle** (lines 42–53) — update to Phase 4 shape (the primary change in normalize.js):
```js
// Current: coerces to {name, ...} shape
function coerceBottle(entry) {
  if (typeof entry === 'string') return { name: entry };
  if (!entry || typeof entry !== 'object') return null;
  const out = { ...entry };
  if (typeof out.name !== 'string' || !out.name) {
    const fallback = out.brand || out.style || out.type;
    if (typeof fallback === 'string' && fallback) out.name = fallback;
    else return null;
  }
  return out;
}

// Phase 4: coerce to {style, type, brand, tier, best_for, notes, created_at, updated_at}
// Migration rules (from D-05 + Pitfall 4):
//   If entry.style present → already migrated, preserve all new fields
//   If only entry.name present → old {name} format: style = name, clear name
//   Tier migration: 'industrial' | 'premium-accessible' | 'boutique' | 'rare/exceptional' → null
//   Add created_at / updated_at if missing (use isoToday())
const OLD_TIER_VALUES = new Set(['industrial', 'premium-accessible', 'boutique', 'rare/exceptional']);
function coerceBottle(entry) {
  if (typeof entry === 'string') {
    return { style: entry, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  }
  if (!entry || typeof entry !== 'object') return null;
  const out = { ...entry };
  // Migrate {name} → {style}
  if (!out.style && out.name) { out.style = out.name; delete out.name; }
  if (!out.style) return null;
  // Clear old tier values (D-05)
  if (OLD_TIER_VALUES.has(out.tier)) out.tier = null;
  // Ensure timestamps
  if (!out.created_at) out.created_at = new Date().toISOString();
  if (!out.updated_at) out.updated_at = new Date().toISOString();
  return out;
}
```

**equipment normalization** (line 126) — extend from stub to full coercion:
```js
// Current stub:
if ('equipment' in out) out.equipment = ensureObject(out.equipment);

// Phase 4: full coercion with strainers validation:
const VALID_STRAINERS = new Set(['Hawthorne', 'Julep', 'Fine Mesh', 'Conical']);
// Replace stub with:
const eq = ensureObject(out.equipment);
out.equipment = {
  ...eq,
  strainers: ensureArray(eq.strainers).filter(s => VALID_STRAINERS.has(s)),
};
```

**inventory() function structure** (lines 59–129) — all existing section coercions remain unchanged. The Phase 4 changes are only in coerceBottle() and the equipment block.

**byKey dispatcher** (lines 179–186) — copy unchanged:
```js
function byKey(key, data) {
  if (key === 'inventory') return inventory(data);
  if (key === 'barkeeper') return barkeeper(data);
  if (key === 'profile')   return profile(data);
  if (key === 'recipes')   return recipes(data);
  return data;
}
```

---

### `app/js/canonical-names.js` (utility, request-response — NEW FILE)

**Analog:** `app/js/recommender-engine.js` (IIFE module structure, same project conventions)

**IIFE module skeleton to copy from recommender-engine.js** (lines 1–5 structure):
```js
// Canonical name matcher — curated lookup table + Levenshtein fallback.
// Prevents inventory drift from typos and non-canonical bottle names.
const CanonicalNames = (() => {

  // Curated lookup: lowercased input variant → canonical display string
  // Seeded from classics-db.js ingredient names + common brand variants
  const CURATED = {
    // Bitters
    'angostura':          'Angostura Bitters',
    'angosutra':          'Angostura Bitters',  // common typo
    'angostura bitters':  'Angostura Bitters',
    'peychauds':          "Peychaud's Bitters",
    "peychaud's":         "Peychaud's Bitters",
    // Liqueurs
    'cointreau':          'Cointreau',
    'triple sec':         'Cointreau',
    'maraschino':         'Maraschino Liqueur',
    'luxardo':            'Maraschino Liqueur',
    'benedictine':        'Bénédictine',
    'chartreuse':         'Green Chartreuse',
    'green chartreuse':   'Green Chartreuse',
    'yellow chartreuse':  'Yellow Chartreuse',
    // Vermouths
    'carpano':            'Carpano Antica Formula',
    'punt e mes':         'Punt e Mes',
    'dolin':              'Dolin Dry Vermouth',
    'lillet':             'Lillet Blanc',
    // Spirits (common misspellings)
    'makers mark':        "Maker's Mark",
    "maker's mark":       "Maker's Mark",
    'bulleit':            'Bulleit Bourbon',
    'hendricks':          "Hendrick's Gin",
    "hendrick's":         "Hendrick's Gin",
    // Syrups
    'orgeat':             'Orgeat',
    'falernum':           'Velvet Falernum',
    'velvet falernum':    'Velvet Falernum',
    'simple':             'Simple Syrup',
    'simple syrup':       'Simple Syrup',
    'honey syrup':        'Honey Syrup',
    'ginger syrup':       'Ginger Syrup',
  };

  // Standard Levenshtein DP — O(m×n), suitable for strings ≤ ~40 chars
  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) => [i]);
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i-1] === b[j-1]
          ? dp[i-1][j-1]
          : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
      }
    }
    return dp[m][n];
  }

  function suggest(input) {
    if (!input || input.length < 3) return null;
    const lc = input.toLowerCase().trim();

    // 1. Exact curated match (O(1))
    if (CURATED[lc]) return CURATED[lc];

    // 2. Levenshtein fallback — pre-filter by length, then distance
    const threshold = lc.length <= 6 ? 2 : 3;
    let best = null, bestDist = Infinity;
    for (const [variant, canonical] of Object.entries(CURATED)) {
      // Fast pre-filter: skip if length delta exceeds threshold
      if (Math.abs(variant.length - lc.length) > threshold) continue;
      const d = levenshtein(lc, variant);
      if (d < bestDist && d <= threshold) { bestDist = d; best = canonical; }
    }
    return best;
  }

  return { suggest };
})();
```

---

### `app/css/app.css` (config — extension)

**Analog:** `app/css/app.css` (self — additive extension)

**Existing tier dot pattern to extend** (lines 184–192) — add 6 new classes after existing ones:
```css
/* Existing (keep for migration backward compat): */
.bottle-tier-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.tier-industrial       { background: var(--text-muted); }
.tier-premium-accessible { background: var(--green); }
.tier-boutique         { background: var(--amber); }
.tier-rare             { background: #c084fc; }

/* Phase 4 new tiers: */
.tier-well             { background: #666; }
.tier-standard         { background: var(--green); }
.tier-premium          { background: var(--blue); }
.tier-craft            { background: var(--amber); }
.tier-boutique-new     { background: #c084fc; }  /* reuse existing color */
.tier-rare-exceptional { background: #f59e42; }
```

**Existing .dash-progress-banner pattern** (lines 786–798) — copy the amber left-border treatment for .bottle-edit-form:
```css
.dash-progress-banner {
  background: var(--bg3);
  border-left: 3px solid var(--amber);
  border-radius: var(--radius);
  padding: 12px 16px;
  ...
}
/* Phase 4 .bottle-edit-form copies this left-border accent: */
.bottle-edit-form {
  border-left: 3px solid var(--amber);
  background: var(--bg2);
  border: 1px solid var(--border2);  /* also add right/top/bottom border */
  border-left-width: 3px;
  border-radius: var(--radius);
  padding: 16px;
  margin-top: 12px;
  margin-bottom: 8px;
}
```

**Existing .rec-filter-chip pattern** (lines 631–638) — copy for .rec-scope-btn:
```css
.rec-filter-chip {
  background: var(--bg3); border: 1px solid var(--border);
  color: var(--text-dim); cursor: pointer; font-family: inherit;
  font-size: 0.8rem; padding: 4px 12px; border-radius: 20px;
  transition: all var(--transition);
}
.rec-filter-chip.active { background: var(--amber-dim); border-color: var(--amber); color: #fff; }

/* Phase 4 .rec-scope-btn: same visual, straight borders (segmented group): */
.rec-scope-toggle { display: flex; gap: 4px; }
.rec-scope-btn {
  /* same background/border/color/cursor/font as .rec-filter-chip */
  border-radius: var(--radius-sm);  /* less pill, more square for segmented feel */
}
.rec-scope-btn.active { background: var(--amber-dim); border-color: var(--amber); color: #fff; }
```

**Existing .wizard-option.selected pattern** (lines 447–448) — copy amber tint for .canonical-suggestion:
```css
.wizard-option.selected { border-color: var(--amber); background: rgba(212,148,58,0.08); color: var(--amber); }

/* Phase 4 .canonical-suggestion copies this amber tint: */
.canonical-suggestion {
  background: rgba(212,148,58,0.08);
  border: 1px solid var(--amber-dim);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  font-size: 0.78rem;
  color: var(--text);
  margin-top: 4px;
}
.canonical-suggestion__action {
  /* .btn-ghost.btn-sm inline: */
  background: none; border: none; color: var(--amber); cursor: pointer;
  font-family: inherit; font-size: 0.78rem; padding: 0 4px;
}
```

**Existing @media (min-width: 641px) breakpoint pattern** (lines 808–813) — copy structure for 860px recommender layout:
```css
/* Existing mobile pattern: */
@media (min-width: 641px) { .menu-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 640px) { .menu-grid { grid-template-columns: repeat(2, 1fr); } }

/* Phase 4 recommender two-column layout: */
@media (min-width: 860px) {
  .rec-layout { display: grid; grid-template-columns: 280px 1fr; gap: 24px; align-items: start; }
  .mood-toggle-btn { display: none; }  /* hide on desktop; sliders always visible */
  .rec-mood-panel { display: block !important; }  /* always show on desktop */
}
@media (max-width: 859px) {
  .rec-layout { display: block; }
  .rec-sidebar { margin-bottom: 20px; }
  .rec-mood-panel { display: none; }  /* collapsed behind toggle on mobile */
}
```

**Existing .axis-slider pattern** (lines 334–337) — reuse unchanged for mood sliders:
```css
.axis-slider { -webkit-appearance: none; height: 4px; border-radius: 2px; outline: none; border: none;
  background: linear-gradient(to right, var(--blue) 0%, var(--amber) 50%, var(--green) 100%); }
.axis-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px;
  border-radius: 50%; background: var(--text); border: 2px solid var(--amber); cursor: pointer; }
```

---

### `schema/inventory.schema.json` (config — update)

**Analog:** `schema/inventory.schema.json` (self — update bottleEntry definition)

Read existing schema to understand structure before modifying. Key changes:
- `bottleEntry.required`: change from `["name"]` to `["style"]`
- Add new properties: `type`, `brand`, `best_for`, `notes`, `created_at`, `updated_at`
- Update `tier` enum from 4 values to 6: `["well", "standard", "premium", "craft", "boutique", "rare/exceptional"]`
- Add top-level `equipment` object with `strainers` array

---

### `app/js/classics-db.js` (config/data — extension)

**Analog:** `app/js/classics-db.js` (self — add `tags` array to each recipe)

**Existing recipe shape** (lines 19–28) — add `tags` field to all 75 entries:
```js
// Current recipe shape:
{ id: 'old-fashioned', name: 'Old Fashioned', base: 'Bourbon',
  method: 'stirred', glassware: 'Rocks glass', difficulty: 1,
  profile: { sweetness: 0.15, ... },
  occasion: 'The gold-standard evening sipper...',
  ingredients: [...],
  garnish: 'Orange twist or cherry' }

// Phase 4: add tags array (resolves REC-03 occasion blocker — Pitfall 5):
{ id: 'old-fashioned', ...,
  tags: ['after-dinner', 'spirit-forward', 'cozy'],
  ... }
```

**BUG-02 keyword fix** — remove bare `'whisky'` from Scotch-specific recipes (lines 46–49):
```js
// Rob Roy — remove 'whisky' from keywords, keep Scotch-specific terms only:
{ name: 'Scotch', keywords: ['scotch', 'islay', 'speyside', 'highland', 'blended'], ... }
// (was: ['scotch', 'whisky', 'islay', 'speyside', 'highland', 'blended'])
```

Planner must audit all 75 recipes for similar over-broad keyword issues (verified cases: rob-roy, penicillin, whiskey-highball).

---

## Shared Patterns

### Sequential State.save() — Anti-Parallel Pattern
**Source:** `app/js/views/settings.js` lines 337–363
**Apply to:** Any Phase 4 code that saves multiple keys (migration write, mood profile save)
```js
// CORRECT — sequential awaits, one save at a time:
try {
  State.set('profile', updatedProfile);
  await State.save('profile', 'Update via Barkeeper Bjorn');

  State.set('inventory', updatedInventory);
  await State.save('inventory', 'Update via Barkeeper Bjorn');
} catch (err) {
  Utils.showToast(`Save failed: ${err.message}`, 'error');
}
// NEVER: Promise.all([State.save('profile'), State.save('inventory')])
```

### Toast Notifications
**Source:** `app/js/views/inventory.js` lines 217, 219 + `app/js/views/recommender.js`
**Apply to:** All save confirmations and error handling
```js
Utils.showToast('Inventory saved to GitHub ✓');          // success (default)
Utils.showToast('Profile updated ✓');                    // success
Utils.showToast('Added to shopping list');               // success
Utils.showToast(`Save failed: ${err.message}`, 'error'); // error
```

### Utils.escapeHtml — Mandatory for User Strings
**Source:** used throughout `app/js/views/inventory.js` and `recommender.js`
**Apply to:** Every innerHTML interpolation involving user-supplied data (bottle.style, bottle.brand, bottle.notes, canonical suggestion text, recipe names)
```js
Utils.escapeHtml(bottle.style)
Utils.escapeHtml(bottle.brand || '')
Utils.escapeHtml(canonicalName)
```

### IIFE Module Pattern
**Source:** every JS file in `app/js/`
**Apply to:** `app/js/canonical-names.js` (new file)
```js
const ModuleName = (() => {
  // private state and helpers

  return { publicMethod1, publicMethod2 };
})();
```

### Dirty State Three-Step Flow
**Source:** `app/js/views/inventory.js` lines 104–116 (add bottle) and 136–143 (remove bottle)
**Apply to:** Inline edit Save Bottle button, Equipment tab strainer checkboxes
```js
// Step 1: mutate the live object
bottle.style = form.querySelector('[name=style]').value.trim();
bottle.updated_at = new Date().toISOString();
// Step 2: mark dirty (shows sticky save bar)
markDirty();
// Step 3: re-render chips to reflect changes
renderBottleChips(grid, getNestedArr(inv, sectionKey), sectionKey, inv);
// Note: State.save() is NOT called here — sticky bar button handles it
```

### State.isNewUser Guard
**Source:** `app/js/views/recommender.js` lines 129–141
**Apply to:** Recommender render — copy the existing guard unchanged
```js
if (isNew) {
  container.innerHTML = `<div class="rec-splash"><h2>...</h2>...</div>`;
  return;
}
```

---

## No Analog Found

No files in this phase are completely without codebase analog. All are brownfield extensions of existing files.

The `app/js/canonical-names.js` new file has no prior analog of the same function, but its IIFE structure, module conventions, and integration points (called from inventory.js on `oninput`) are fully patterned from existing code.

---

## Metadata

**Analog search scope:** `app/js/`, `app/js/views/`, `app/css/`, `schema/`
**Files read:** `inventory.js`, `recommender.js`, `recommender-engine.js`, `normalize.js`, `state.js`, `settings.js` (lines 280–367), `classics-db.js` (lines 1–80), `app.css` (targeted sections)
**Pattern extraction date:** 2026-05-14
