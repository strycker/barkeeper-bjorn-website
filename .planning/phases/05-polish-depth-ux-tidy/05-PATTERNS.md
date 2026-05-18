# Phase 5: Polish, Depth & UX Tidy — Pattern Map

**Mapped:** 2026-05-18
**Files analyzed:** 12 (1 new view, 8 modifications, 3 schema updates)
**Analogs found:** 12 / 12

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `app/js/views/bartender-wizard.js` (NEW) | view (form) | read+write barkeeper.json + image upload | `app/js/views/inventory.js` (form/save-bar) + `app/js/views/recipes.js:374-423` (image upload) | exact (composite) |
| `app/js/views/recommender.js` (MOD) | view (read-only + ephemeral writes for favs/wishlist) | read inventory/profile, write recipes for REC-08 | self (extend in place) | self |
| `app/js/recommender-engine.js` (MOD) | pure engine | in-memory transform | self (extend `_buildLookup` → `_expandLookup`) | self |
| `app/js/views/inventory.js` (MOD) | view (form) | read+write inventory | self (extend `openEditForm`) | self |
| `app/js/normalize.js` (MOD) | data layer | pure transform on load | self (extend `barkeeper()` + `profile()`) | self |
| `app/js/views/profile.js` (MOD) | view (form) | read+write profile | self (fix slider write site + append collapsible) | self |
| `app/js/views/onboarding.js` (MOD) | view (step wizard) | write profile + inventory | self (append Step 7; rewrite equipment write) | self |
| `app/js/views/settings.js` (MOD) | view (form) | read+write barkeeper | self (add link in Bartender Identity section) | self |
| `app/js/app.js` (MOD) | router | dispatch | self (add `case 'bartender-wizard':`) | self |
| `schema/inventory.schema.json` (MOD) | schema | declarative | self (extend `bottleEntry`) | self |
| `schema/bar-owner-profile.schema.json` (MOD) | schema | declarative | self | self |
| `schema/barkeeper.schema.json` (MOD) | schema | declarative | self | self |

---

## Pattern Assignments

### `app/js/views/bartender-wizard.js` (NEW — composite analog)

**Primary analogs:**
- `app/js/views/inventory.js` — IIFE structure, sticky save bar + dirty flag, `renderStringSection` for behavioral rules (D-31)
- `app/js/views/recipes.js:374-423` — image upload pattern for avatar (D-30)
- `app/js/views/settings.js:84-103` — single-section form layout for simple identity-like fields

#### IIFE module skeleton (copy from `inventory.js:3` and `:516-534`)

```js
const BartenderWizardView = (() => {

  let _dirty = false;
  let _selectedAvatarFile = null;

  function markDirty() {
    _dirty = true;
    const bar = document.getElementById('bw-save-bar');
    if (bar) bar.style.display = 'flex';
  }

  async function save() {
    const bk = State.get('barkeeper');
    bk.last_updated = Utils.today();
    try {
      await State.save('barkeeper', 'Update bartender via wizard');
      _dirty = false;
      const bar = document.getElementById('bw-save-bar');
      if (bar) bar.style.display = 'none';
      Utils.showToast('Bartender saved to GitHub ✓');
    } catch (err) {
      Utils.showToast(`Save failed: ${err.message}`, 'error');
    }
  }

  function render(container) { /* see below */ }

  return { render };
})();
```

#### Sticky save bar HTML (copy from `inventory.js:551-557`)

```html
<div id="bw-save-bar" style="display:none;position:sticky;top:60px;z-index:50;
     background:var(--bg);border-bottom:1px solid var(--amber-dim);padding:10px 0 10px;
     align-items:center;gap:12px;margin-bottom:16px;">
  <span style="color:var(--amber);font-size:0.88rem;">Unsaved changes</span>
  <button class="btn btn-primary btn-sm" id="bw-save-btn">Save to GitHub</button>
  <button class="btn btn-ghost btn-sm" id="bw-discard-btn">Discard</button>
</div>
```

Wire (copy from `inventory.js:561-567`):
```js
document.getElementById('bw-save-btn')?.addEventListener('click', save);
document.getElementById('bw-discard-btn')?.addEventListener('click', () => {
  _dirty = false;
  Utils.showToast('Changes discarded', 'info');
  render(container);
});
```

#### Behavioral rules add/remove list (copy `renderStringSection` from `inventory.js:381-426`, retarget to barkeeper)

The exact `renderStringSection` + `renderStringItems` pair (lines 381–426) — same input + "+ Add" button + `<ul>` with `×` removers. For the wizard:
- Replace `State.patch('inventory', …)` with direct mutation on `State.get('barkeeper').behavioral_rules` (or wrap in `State.patch('barkeeper', bk => …)` for consistency).
- Replace `markDirty()` (still call it — the wizard's own `markDirty`).
- `sectionKey` becomes `'behavioral_rules'`; `inv[sectionKey]` becomes `bk.behavioral_rules`.

#### Avatar upload (copy `recipes.js:374-423`, corrected method names per RESEARCH §6)

```js
// Note: CONTEXT.md D-30 says `GitHubAPI.uploadImage` — that method does NOT exist.
// Real API: GitHubAPI.getFileSHA + GitHubAPI.writeFile.
uploadBtn.addEventListener('click', async () => {
  if (!_selectedAvatarFile) return;
  const ext = _selectedAvatarFile.name.split('.').pop().toLowerCase();
  const filename = `barkeeper_avatar_${Date.now()}.${ext}`;
  try {
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(_selectedAvatarFile);
    });
    const path = `images/${filename}`;
    const sha = await GitHubAPI.getFileSHA(path);
    await GitHubAPI.writeFile(path, base64, sha, `Upload bartender avatar`);
    const cfg = GitHubAPI.cfg();
    const url = `https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/${cfg.branch}/${path}`;
    // Populate the URL input — single source of truth (per Pitfall 3)
    document.getElementById('bw-avatar-url').value = url;
    State.patch('barkeeper', bk => { bk.avatar_url = url; });
    markDirty();
    Utils.showToast('Avatar uploaded ✓');
  } catch (err) {
    Utils.showToast('Upload failed: ' + err.message, 'error');
  }
});
```

#### Form layout (adapt from `settings.js:84-103` — `.settings-section` + `.form-group` blocks)

For each field (name, voice preset, personality_description textarea, cocktail_naming_style, image_gen_style textarea, signoff), use:
```html
<div class="settings-section">
  <div class="settings-section__heading">Personality</div>
  <div class="form-group">
    <label for="bw-personality">Long-form personality description</label>
    <textarea id="bw-personality" rows="5" placeholder="…">${Utils.escapeHtml(bk.personality_description || '')}</textarea>
  </div>
</div>
```

Wire each input with `addEventListener('input', () => { State.patch('barkeeper', bk => { bk.personality_description = el.value; }); markDirty(); })`.

#### Voice preset dropdown (copy from `settings.js:94-99`)

Reuse the `VOICE_PRESETS` constant from `settings.js`. Either re-declare in the wizard module or expose it (planner choice — recommend re-declare to keep IIFE isolation).

---

### `app/js/views/recommender.js` (MOD)

**Self-analog patterns to extend in place:**

#### Cumulative scope highlight (D-07) — modify line `199-201`

Current:
```js
container.querySelectorAll('.rec-scope-btn').forEach(btn => {
  btn.classList.toggle('active', Number(btn.dataset.scope) === _scopeLevel);
});
```
Change to:
```js
btn.classList.toggle('active', Number(btn.dataset.scope) <= _scopeLevel);
```

#### Unconstrained 4th button (D-08) — add to scope HTML at line `441-449`

Append `<button class="rec-scope-btn ${_scopeLevel === 3 ? 'active' : ''}" data-scope="3">Unconstrained</button>`. Visually distinguish with dashed border (see CONTEXT.md `<specifics>`).

#### Vetoes panel (D-03–D-06) — add new `.rec-sidebar-section` below `${occasionChipsHtml}` at line `475`

Module-level state pattern mirrors `_sliderValues` (line 31):
```js
let _vetoOverrides = new Set();  // session-only; cleared in render() at top
```
Reset in `render()` at line `389` alongside other ephemeral state. Per D-04, render vetoes as chips; toggled-off chips get `style="text-decoration:line-through;opacity:0.5"`.

Empty-state copy (per D-06): if `inv.vetoes.disliked_ingredients.length === 0`, render "No vetoes configured — add them in Inventory → Vetoes." with no section header.

#### Favorites/Wishlist quick-action buttons (D-09–D-11) — extend `_renderCard` at line `57-94`

Add `<button class="rec-fav-btn">♥</button><button class="rec-wish-btn">☆</button>` near `.rec-score` (top-right) — see RESEARCH §8 for layout note (3-cell flex restructure or absolute overlay).

Click handler pattern (D-10 immediate save; D-11 duplicate guard):
```js
cardsEl.querySelectorAll('.rec-fav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const recipeName = btn.dataset.name;
    const recipes = State.get('recipes') || {};
    const existing = (recipes.confirmed_favorites || []).some(r => r.name === recipeName);
    if (existing) { Utils.showToast('Already in Favorites', 'info'); return; }
    State.patch('recipes', r => {
      r.confirmed_favorites = r.confirmed_favorites || [];
      r.confirmed_favorites.push({ /* shallow copy of recipe */ });
    });
    State.save('recipes').then(() => Utils.showToast('Added to Favorites'));
  });
});
```
Mirror existing `addToShoppingList` pattern at line `170-187`.

#### Engine signature change (per RESEARCH §2)

Three call sites to update simultaneously (RESEARCH Pitfall 4): `recommender.js:316`, `:354`, `:396`. New shape:
```js
_results = RecommenderEngine.recommend(inv, overrideProfile, { scope: _scopeLevel, ignoreVetoes: _vetoOverrides });
```

---

### `app/js/recommender-engine.js` (MOD)

**Insert `_expandLookup` between lines 53 and 55** (after `_buildLookup`, before `_hasIngredient`). Call from `recommend()` at line `121` immediately after `const lookup = _buildLookup(inv);`.

Recommended in-place pattern (per RESEARCH §1; Claude's Discretion):
```js
const DERIVATIONS = [
  // [sourceKeyword, derivedKeyword, ...targetSectionKeys]
  ['lime',  'lime juice',   'produce', 'perishables'],
  ['lemon', 'lemon juice',  'produce', 'perishables'],
  ['sugar', 'simple syrup', 'pantry',  'syrups'],
  ['egg',   'egg white',    'perishables'],
  ['mint',  'muddled mint', 'produce'],
  ['cream', 'heavy cream',  'perishables'],
  ['honey', 'honey syrup',  'pantry',  'syrups'],
];

function _expandLookup(lookup) {
  for (const [src, derived, ...targets] of DERIVATIONS) {
    const present = Object.values(lookup).some(arr => arr.some(item => item.includes(src)));
    if (!present) continue;
    for (const sec of targets) {
      if (!lookup[sec]) lookup[sec] = [];
      if (!lookup[sec].some(i => i.includes(derived))) lookup[sec].push(derived);
    }
  }
  return lookup;
}
```

**Opts parameter:** Extend `recommend(inventory, rawProfile, opts = {})`. Use `opts.scope === 3` to skip the `missing.length > 0` filter (REC-06 Unconstrained); use `opts.ignoreVetoes` Set to filter veto list at line `130-134`:
```js
.filter(v => !opts.ignoreVetoes?.has(v))
```

---

### `app/js/views/inventory.js` (MOD)

**INV-08 (D-15) labels only** — lines 306–307. Change:
```html
<label>Style <input type="text" data-field="style" ...></label>
<label>Type  <input type="text" data-field="type"  ...></label>
```
to:
```html
<label>Category <input type="text" data-field="style" placeholder="e.g. Bourbon, Gin, Mezcal" ...></label>
<label>Specific Style/Type <input type="text" data-field="type" placeholder="e.g. Single Barrel, Cask Strength, Espadin" ...></label>
```
JSON keys (`style`, `type`) stay unchanged.

**INV-09 (D-16) nationality field** — add to "More fields" expanded block at lines 311–325, alongside Brand and Tier:
```html
<label>Nationality <input type="text" data-field="nationality" placeholder="e.g. Scotland, Mexico, Kentucky USA" value="${Utils.escapeHtml(entry.nationality || '')}"></label>
```
The existing `formEl.querySelectorAll('[data-field]')` save loop at line `349-352` already picks up new fields automatically — no save-handler change needed.

---

### `app/js/normalize.js` (MOD)

**Self-analog:** every existing normalizer function (`inventory`, `barkeeper`, `profile`) follows: `ensureObject(src)` → spread → coerce known keys → return. Idempotent. Pattern at lines 82–156.

#### DATA-01 equipment strip (D-19) — modify `barkeeper()` (line 158) and `profile()` (line 173)

Both functions add `delete out.equipment;` after spreading source. Silent — no error.

```js
function barkeeper(data) {
  const src = ensureObject(data);
  const id = ensureObject(src.identity);
  const out = {
    ...src,
    identity: { /* existing */ },
    last_updated: ensureString(src.last_updated) || isoToday(),
  };
  delete out.equipment;
  // Phase 5 CUST-01 defaults — add behavioral_rules etc.
  out.behavioral_rules = ensureArray(out.behavioral_rules).map(String).filter(Boolean);
  out.personality_description = ensureString(out.personality_description);
  out.cocktail_naming_style   = ensureString(out.cocktail_naming_style);
  out.image_gen_style         = ensureString(out.image_gen_style);
  out.signoff                 = ensureString(out.signoff);
  out.avatar_url              = ensureString(out.avatar_url);
  return out;
}
```

#### DATA-02 axis float migration (D-21) — modify `profile()` (line 173)

```js
const POS_MAP = { 'Strong A': 0, 'Lean A': 0.25, 'Middle': 0.5, 'Lean B': 0.75, 'Strong B': 1 };
const AXIS_KEYS = ['sweetness','acid','strength','complexity','season','risk'];

function profile(data) {
  const src = ensureObject(data);
  const fp  = ensureObject(src.flavor_profile);
  const axes = ensureObject(fp.axes);
  for (const k of AXIS_KEYS) {
    const a = ensureObject(axes[k]);
    if (typeof a.position === 'string' && POS_MAP[a.position] != null) {
      a.position = POS_MAP[a.position];
    }
    axes[k] = a;
  }
  const out = { ...src, /* ... existing ... */ };
  delete out.equipment;  // DATA-01

  // DATA-03 background defaults
  const bg = ensureObject(out.background);
  bg.drinking_frequency   = ensureString(bg.drinking_frequency);
  bg.household_context    = ensureString(bg.household_context);
  bg.vocabulary_preference = ensureString(bg.vocabulary_preference);
  out.background = bg;
  out.archetypes = ensureArray(out.archetypes).filter(a => a && typeof a === 'object' && a.name);

  return out;
}
```

---

### `app/js/views/profile.js` (MOD)

**DATA-02 write-site fix** (RESEARCH §3, Pitfall 1) — line 253 changes from:
```js
p.flavor_profile.axes[a.key].position = Utils.valueToAxisLabel(newVal);  // STRING
```
to:
```js
p.flavor_profile.axes[a.key].position = newVal;  // raw float — matches recommender.js:333
```

**D-23 remove "Strong A / Lean B" headings** — adjust `renderAxisControls` template (lines around 228–235) to drop the heading labels but keep `flavor-slider-labels` pole labels.

**DATA-03 collapsible "Drinking Style" section** — append at the bottom of the Profile container (after the evolution log around line 410). Mirror the `inv-quick-add-picker` collapse pattern (inventory.js:454-483) or use a simple `<details>` element. Each of the 4 fields wires `input`/`change` → `State.patch('profile', …)` + `markDirty()` (line 421). Save bar already exists at line 423.

---

### `app/js/views/onboarding.js` (MOD)

**DATA-01 equipment write-site fix** — line 564 currently writes to profile:
```js
if (_answers.equipment) profile.equipment = _answers.equipment;
```
Rewrite to inventory only (D-20). Of the 7 fields collected, only `strainers` belongs in the current inventory schema (RESEARCH §4 Open Q1). Recommended:
```js
if (_answers.equipment?.strainers) {
  const inv = State.get('inventory') || {};
  inv.equipment = inv.equipment || { strainers: [] };
  inv.equipment.strainers = _answers.equipment.strainers;
  State.set('inventory', inv);
}
```
Drop the 6 non-strainer fields (per RESEARCH Open Q1 recommendation (a)).

**DATA-03 new Step 7** — append `'about_drinking_style'` to STEPS array at line 18–25 (insert before `'done'`). Add a `renderAboutDrinkingStyle(body, container)` function in the same style as `renderInventoryPaste` (line 399). The step has a Skip button via existing `navButtons(body, container, { skipFn: … })` helper used throughout (e.g. line 388, 441). On Next, populate `_answers.drinking_frequency`, `_answers.household_context`, `_answers.vocabulary_preference`, `_answers.archetypes`. In the final commit block (line ~558), write them to `profile.background.*` and `profile.archetypes` — pattern already established by `_answers.drinking_frequency` at line 560 (existing field, currently unused on the form).

---

### `app/js/views/settings.js` (MOD)

**CUST-02 (D-32) link only** — extend Bartender Identity section (lines 84–103). Add after the existing Save button at line 101:

```html
<a href="#bartender-wizard" class="btn btn-secondary btn-sm" style="margin-left:8px;">
  Full Customization →
</a>
```

No field duplication. No additional JS wiring — hash navigation handles route change.

---

### `app/js/app.js` (MOD)

**Add route case at line 99** (before `default:`):
```js
case 'bartender-wizard':
  BartenderWizardView.render(content);
  break;
```

**Add script tag in `app/index.html`** (after other view scripts):
```html
<script src="js/views/bartender-wizard.js"></script>
```

No nav link per D-32. Optionally: prefer `barkeeper.avatar_url` over hardcoded path at app.js:23 (RESEARCH §6 — flagged as optional).

---

### Schema updates

#### `schema/inventory.schema.json` (D-17)

Extend `bottleEntry` definition at line 151–172. Add after `notes`:
```json
"nationality": { "type": "string", "description": "Country/region of origin (e.g. Scotland, Mexico, Kentucky USA)." }
```

#### `schema/bar-owner-profile.schema.json` (D-27)

Add to `background` object: `drinking_frequency`, `household_context`, `vocabulary_preference` (all `{ "type": "string" }`). Add top-level `archetypes: { type: "array", items: { type: "object", required: ["name"], properties: { name: { type: "string" }, description: { type: "string" } } } }`.

#### `schema/barkeeper.schema.json` (D-29)

Add top-level fields: `behavioral_rules: { type: "array", items: { type: "string" } }`, `personality_description`, `cocktail_naming_style`, `image_gen_style`, `signoff`, `avatar_url` (all `{ "type": "string" }`).

---

## Shared Patterns

### Sticky save bar + dirty flag
**Source:** `app/js/views/inventory.js:516-534` + `:551-557`
**Apply to:** `bartender-wizard.js` (NEW), profile.js (DATA-03 section)
Verbatim copy with renamed IDs (`bw-save-bar`, `bw-save-btn`, `bw-discard-btn`).

### IIFE module structure
**Source:** every file in `app/js/views/`
**Apply to:** `bartender-wizard.js`
```js
const FooView = (() => {
  let _dirty = false;
  function render(container) { /* ... */ }
  return { render };
})();
```

### State write + save flow
**Source:** `app/js/views/inventory.js:344-358` (and every form view)
**Apply to:** All form changes (bartender wizard, profile DATA-03, settings)
Pattern: `State.patch('key', mut => { … })` → `markDirty()` → user clicks Save → `State.save('key', commitMessage)`.

For immediate-save (REC-08, D-10): skip `markDirty`, call `State.save('recipes')` directly after `State.patch`. Mirror `addToShoppingList` at `recommender.js:170-187`.

### Image upload (FileReader + GitHub Contents API)
**Source:** `app/js/views/recipes.js:374-423`
**Apply to:** Bartender wizard avatar (D-30)
**Correction:** Use `GitHubAPI.getFileSHA(path)` + `GitHubAPI.writeFile(path, base64, sha, msg)`. There is NO `GitHubAPI.uploadImage` method (CONTEXT.md D-30 + line 124 misname).

### String add/remove list
**Source:** `app/js/views/inventory.js:381-426` (`renderStringSection` + `renderStringItems`)
**Apply to:** Bartender wizard `behavioral_rules` (D-31)
Direct copy with `inv[sectionKey]` retargeted to `bk.behavioral_rules`.

### Normalize-on-load defaults
**Source:** `app/js/normalize.js` — every key per `inventory()`, `barkeeper()`, `profile()`
**Apply to:** Every new schema field (D-17 nationality; D-27 background.* and archetypes[]; D-29 behavioral_rules etc.)
Pattern: `ensureString(out.field)` or `ensureArray(out.field).map(String).filter(Boolean)` — idempotent.

### Strip-on-load (delete legacy keys)
**Source:** `app/js/normalize.js:87-89` (inventory drops unknown top-level keys via `INVENTORY_KEYS` Set)
**Apply to:** DATA-01 equipment strip from `barkeeper()` and `profile()` — `delete out.equipment;` after spread.

### Hash router case
**Source:** `app/js/app.js:71-101` switch statement
**Apply to:** Adding `bartender-wizard` route — one case + script tag in `index.html`.

### Chip + filter UI
**Source:** `app/js/views/recommender.js:417-426` (occasion chips) and `:429-438` (base-spirit chips)
**Apply to:** Vetoes panel (D-03) and archetype chip grid (D-25). Reuse `.rec-filter-chip` class with `.active` toggle. For struck-through state (D-04 bypassed veto): inline `text-decoration:line-through;opacity:0.5`.

### Onboarding step + skip
**Source:** `app/js/views/onboarding.js:388-396` `navButtons(body, container, { nextFn, skipFn })`
**Apply to:** New Step 7 `about_drinking_style` (D-24). Skip writes `_skipped_about_drinking_style` flag in same style as line 391.

---

## No Analog Found

None. Every Phase 5 file maps to an existing, verified pattern in the codebase.

---

## Metadata

**Analog search scope:** `app/js/views/`, `app/js/`, `schema/`
**Files scanned:** 11 source files + 4 schemas read directly
**Pattern extraction date:** 2026-05-18
**Confidence:** HIGH — every line reference verified from direct read during this session and cross-checked against RESEARCH.md line numbers.
