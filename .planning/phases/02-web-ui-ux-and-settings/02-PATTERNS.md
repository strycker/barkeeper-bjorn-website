# Phase 2: Web UI UX & Settings — Pattern Map

**Mapped:** 2026-05-11
**Files analyzed:** 6 (5 modify, 1 create)
**Analogs found:** 6 / 6

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `app/js/views/settings.js` | view | request-response (read State + localStorage; write via State.save + localStorage) | `app/js/views/setup.js` | role-match (same localStorage + GitHubAPI.cfg pattern) |
| `app/js/views/onboarding.js` | view/wizard | CRUD (profile write on done; incremental patch per step) | self (extend in-place) | exact |
| `app/js/views/dashboard.js` | view | request-response (read-only; State.get) | `app/js/views/inventory.js` | role-match (same DOM-append pattern with markDirty/save) |
| `app/js/views/inventory.js` | view | CRUD (State.get + markDirty + State.save) | self (extend in-place) | exact |
| `app/index.html` | config/template | — | self (extend in-place) | exact |
| `app/css/app.css` | stylesheet | — | self (extend in-place) | exact |

---

## Pattern Assignments

### `app/js/views/settings.js` (new view, request-response)

**Primary analog:** `app/js/views/setup.js`
**Secondary analog for State writes:** `app/js/views/inventory.js` (State.patch + State.save)

**IIFE shell pattern** (setup.js lines 3–7, 106–107):
```javascript
const SettingsView = (() => {

  function render(container) {
    // ...
  }

  return { render };
})();
```

**Reading runtime config** (setup.js lines 6):
```javascript
const cfg = GitHubAPI.cfg();
// cfg.token, cfg.owner, cfg.repo, cfg.branch — all from localStorage
```

**localStorage write pattern** (setup.js lines 83–86):
```javascript
localStorage.setItem('bb_token',  token);
localStorage.setItem('bb_owner',  owner);
localStorage.setItem('bb_repo',   repo);
localStorage.setItem('bb_branch', branch);
```

**GitHub credential validation** (setup.js lines 88–103):
```javascript
saveBtn.disabled = true;
saveBtn.textContent = 'Connecting…';
try {
  await GitHubAPI.validateConfig();
  status.textContent = '✓ Connected! Loading your bar…';
  status.style.color = 'var(--green)';
  setTimeout(() => { window.location.hash = '#dashboard'; }, 800);
} catch (err) {
  status.textContent = `Connection failed: ${err.message}`;
  status.style.color = 'var(--red)';
  saveBtn.disabled = false;
  saveBtn.textContent = 'Connect Repository';
}
```

**State.patch + State.save write pattern** (state.js lines 51–57, 66–68; inventory.js lines 208–219):
```javascript
// Mutate in-memory data
State.patch('barkeeper', bk => {
  if (!bk.identity) bk.identity = {};
  bk.identity.name = newName;
  bk.personality.voice_preset = newVoice;
});
// Persist to GitHub
async function saveBarkeeper() {
  try {
    await State.save('barkeeper', 'Update bartender identity via Settings');
    Utils.showToast('Saved ✓');
  } catch (err) {
    Utils.showToast(`Save failed: ${err.message}`, 'error');
  }
}
```

**Dispatch bb:reset-data after GitHub credential change** (app.js lines 109–111):
```javascript
// SettingsView must dispatch this after writing new GitHub credentials:
document.dispatchEvent(new CustomEvent('bb:reset-data'));
// app.js listens: _dataLoaded = false — forces data reload on next navigate()
```

**Logout: enumerate and clear all bb_* keys** (security pattern from RESEARCH.md):
```javascript
// Enumerate dynamically — never hard-code the list
Object.keys(localStorage)
  .filter(k => k.startsWith('bb_'))
  .forEach(k => localStorage.removeItem(k));
window.location.hash = '#setup';
```

**Danger Zone two-click pattern** (use existing .confirm-dialog classes, css lines 575–591):
```javascript
// First click: reveal warning + confirm button
dangerBtn.addEventListener('click', () => {
  dangerBtn.style.display = 'none';
  confirmSection.style.display = '';   // shows warning text + "Yes, delete everything" btn
});
// Second click: execute reset
confirmBtn.addEventListener('click', async () => {
  // Reset each key sequentially — must await each to preserve SHA tracking
  State.set('profile',   defaultProfile);
  await State.save('profile',   'Reset all data via Settings');
  State.set('inventory', defaultInventory);
  await State.save('inventory', 'Reset all data via Settings');
  State.set('recipes',   defaultRecipes);
  await State.save('recipes',   'Reset all data via Settings');
  State.set('barkeeper', defaultBarkeeper);
  await State.save('barkeeper', 'Reset all data via Settings');
  Utils.showToast('All data reset ✓');
});
```

**page-header pattern for Settings heading** (inventory.js lines 230–233; css line 109):
```javascript
container.innerHTML = `
  <div class="page-header">
    <h1>Settings</h1>
    <p>Configure Barkeeper Bjorn and your GitHub connection.</p>
  </div>
  <div class="settings-wrap">…</div>`;
```

**form-group / form-row input pattern** (setup.js lines 19–47):
```html
<div class="form-group">
  <label for="cfg-token">GitHub Personal Access Token</label>
  <input type="password" id="cfg-token" placeholder="ghp_…"
         value="${Utils.escapeHtml(cfg.token || '')}" autocomplete="off">
</div>
<div class="form-row">
  <div class="form-group">
    <label for="cfg-owner">Repository Owner</label>
    <input type="text" id="cfg-owner" value="${Utils.escapeHtml(cfg.owner || '')}">
  </div>
  <div class="form-group">
    <label for="cfg-repo">Repository Name</label>
    <input type="text" id="cfg-repo" value="${Utils.escapeHtml(cfg.repo || '')}">
  </div>
</div>
```

---

### `app/js/views/onboarding.js` (modify, CRUD wizard)

**Analog:** self — extend in-place. All patterns are already present; document here for executor reference.

**IIFE and module-level state** (onboarding.js lines 4–66):
```javascript
const OnboardingView = (() => {
  let _step = 0;
  let _answers = {};

  const STEPS = [ 'welcome', /* ... 17 items ... */ 'done' ];

  function render(container) {
    _step = 0;    // CHANGE: replace with resume-from-skipped logic
    _answers = {};
    renderStep(container);
  }
  // ...
  return { render };
})();
```

**Resume-from-skipped logic to replace unconditional reset** (new code; pattern from RESEARCH.md Pitfall 2):
```javascript
function render(container) {
  _answers = {};
  // Check for any skipped steps in saved profile
  const profile = State.get('profile') || {};
  const axes = profile.flavor_profile?.axes || {};
  const firstSkippedAxis = Object.entries(axes).find(([, v]) => v && v._skipped);
  if (firstSkippedAxis) {
    const stepId = `axis_${firstSkippedAxis[0]}`;
    _step = STEPS.indexOf(stepId);
    if (_step < 0) _step = 0;
  } else {
    _step = 0;
  }
  renderStep(container);
}
```

**navButtons() helper — already has skipFn hook** (onboarding.js lines 99–123):
```javascript
function navButtons(body, container, { nextLabel = 'Next →', nextFn, skipFn } = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'wizard-nav';
  if (_step > 0) {
    const back = document.createElement('button');
    back.className = 'btn btn-ghost';
    back.textContent = '← Back';
    back.addEventListener('click', () => { _step--; renderStep(container); });
    wrap.appendChild(back);
  }
  const next = document.createElement('button');
  next.className = 'btn btn-primary';
  next.textContent = nextLabel;
  next.addEventListener('click', nextFn || (() => { _step++; renderStep(container); }));
  wrap.appendChild(next);
  if (skipFn) {
    const skip = document.createElement('button');
    skip.className = 'btn btn-ghost btn-sm';
    skip.textContent = 'Skip for now →';
    skip.style.marginLeft = 'auto';
    skip.addEventListener('click', skipFn);
    wrap.appendChild(skip);
  }
  body.appendChild(wrap);
}
```

**Skip flag write pattern for axis steps** (RESEARCH.md Pattern 2; state.js patch() line 66):
```javascript
skipFn: () => {
  // Axis skip: write _skipped flag + midpoint default (0.5)
  State.patch('profile', p => {
    if (!p.flavor_profile) p.flavor_profile = {};
    if (!p.flavor_profile.axes) p.flavor_profile.axes = {};
    p.flavor_profile.axes[axisConfig.key] = { _skipped: true, position: 0.5 };
  });
  _step++; renderStep(container);
}

// Identity step skip (your_name, location, background, equipment):
skipFn: () => {
  _answers[`_skipped_${stepId}`] = true;
  _step++; renderStep(container);
}
```

**New slider axis step to replace renderAxisStep() option cards** (RESEARCH.md Pattern 6; css line 334 for .axis-slider):
```javascript
function renderAxisStep(axisConfig, body, container) {
  const current = _answers[`axis_${axisConfig.key}`]?.value ?? _answers[`axis_${axisConfig.key}`] ?? 0.5;
  body.innerHTML = `
    <div class="wizard-question">${Utils.escapeHtml(axisConfig.question)}</div>
    <div class="axis-slider-group">
      <div class="axis-slider-poles" style="display:flex;justify-content:space-between;font-size:0.8rem;color:var(--text-muted);margin-bottom:6px;">
        <span>${Utils.escapeHtml(axisConfig.labelLeft)}</span>
        <span>${Utils.escapeHtml(axisConfig.labelRight)}</span>
      </div>
      <input type="range" class="axis-slider" id="wiz-axis-${axisConfig.key}"
             min="0" max="1" step="0.01" value="${current}"
             style="width:100%;">
      <div style="text-align:center;font-size:0.78rem;color:var(--text-muted);margin-top:4px;">Middle</div>
    </div>`;
  navButtons(body, container, {
    nextFn: () => {
      const val = parseFloat(body.querySelector(`#wiz-axis-${axisConfig.key}`).value);
      _answers[`axis_${axisConfig.key}`] = val;   // always a float
      _step++; renderStep(container);
    },
    skipFn: () => {
      State.patch('profile', p => {
        if (!p.flavor_profile) p.flavor_profile = {};
        if (!p.flavor_profile.axes) p.flavor_profile.axes = {};
        p.flavor_profile.axes[axisConfig.key] = { _skipped: true, position: 0.5 };
      });
      _step++; renderStep(container);
    }
  });
}
```

**Bartender step renders (new — pattern from renderName/renderLocation)** (onboarding.js lines 162–184):
```javascript
function renderBartenderName(body, container) {
  body.innerHTML = `
    <div class="wizard-question">What should I call myself?</div>
    <p style="color:var(--text-dim);font-size:0.9rem;margin-bottom:20px;">
      This is the name I'll use when signing messages and talking with you.
    </p>
    <div class="form-group">
      <label>Bartender Name</label>
      <input type="text" id="wiz-bk-name" placeholder="Barkeeper Bjorn"
             value="${Utils.escapeHtml(_answers.bartender_name || '')}">
    </div>`;
  navButtons(body, container, {
    nextFn: () => {
      _answers.bartender_name = body.querySelector('#wiz-bk-name').value.trim() || 'Barkeeper Bjorn';
      _step++; renderStep(container);
    },
    skipFn: () => {
      _answers.bartender_name = 'Barkeeper Bjorn';  // apply default
      _step++; renderStep(container);
    }
  });
}
```

**inventory_paste step (new — chip preview pattern from inventory.js lines 125–153)**:
```javascript
function renderInventoryPaste(body, container) {
  body.innerHTML = `
    <div class="wizard-question">Do you want to add your current bar inventory?</div>
    <p style="color:var(--text-dim);font-size:0.9rem;margin-bottom:16px;">
      Paste a comma-separated list. You can add bitters, syrups, and other pantry items
      from the Inventory view later.
    </p>
    <div class="form-group">
      <label>Your bottles (comma-separated)</label>
      <textarea id="wiz-inv-paste" rows="3"
        placeholder="Bulleit Bourbon, Aperol, Angostura Bitters, Dry Vermouth"
        style="width:100%;resize:vertical;"></textarea>
    </div>
    <div id="wiz-inv-chips" class="bottle-grid" style="margin-bottom:16px;"></div>
    <p style="font-size:0.8rem;color:var(--text-muted);" id="wiz-inv-note"></p>`;

  const textarea = body.querySelector('#wiz-inv-paste');
  const chipsEl  = body.querySelector('#wiz-inv-chips');

  // Parse on blur — show chip preview
  textarea.addEventListener('blur', () => {
    const items = textarea.value.split(',').map(s => s.trim()).filter(Boolean);
    _answers.inventory_paste = items;
    chipsEl.innerHTML = '';
    items.forEach((item, idx) => {
      const chip = document.createElement('div');
      chip.className = 'bottle-chip';
      chip.innerHTML = `<span>${Utils.escapeHtml(item)}</span>
        <button class="chip-remove" data-idx="${idx}">×</button>`;
      chip.querySelector('.chip-remove').addEventListener('click', () => {
        _answers.inventory_paste.splice(idx, 1);
        textarea.value = _answers.inventory_paste.join(', ');
        textarea.dispatchEvent(new Event('blur'));
      });
      chipsEl.appendChild(chip);
    });
    body.querySelector('#wiz-inv-note').textContent =
      items.length ? `${items.length} item${items.length !== 1 ? 's' : ''} ready to add` : '';
  });

  navButtons(body, container, {
    nextLabel: 'Looks good →',
    nextFn: () => { _step++; renderStep(container); },
    skipFn: () => { _step++; renderStep(container); }
  });
}
```

**saveAnswers() pattern — extend to write onboarding_complete and bartender fields** (onboarding.js lines 398–440):
```javascript
async function saveAnswers() {
  const profile   = State.get('profile')   || {};
  const barkeeper = State.get('barkeeper') || {};

  // Bartender fields → barkeeper.json
  if (_answers.bartender_name) {
    if (!barkeeper.identity) barkeeper.identity = {};
    barkeeper.identity.name = _answers.bartender_name;
  }
  // ... voice_preset, specialty ...

  // Mark onboarding complete (D-06)
  profile.onboarding_complete = true;
  profile.last_updated = Utils.today();

  // Inventory paste → inventory.spirits (or inventory.unassigned_paste per open question A1)
  if (_answers.inventory_paste?.length) {
    const inv = State.get('inventory') || {};
    inv.spirits = (inv.spirits || []).concat(_answers.inventory_paste);
    State.set('inventory', inv);
    await State.save('inventory', 'Add inventory from onboarding via Barkeeper Bjorn');
  }

  State.set('profile',   profile);
  State.set('barkeeper', barkeeper);
  await State.save('profile',   'Complete onboarding via Barkeeper Bjorn web UI');
  await State.save('barkeeper', 'Complete onboarding via Barkeeper Bjorn web UI');
}
```

**renderStepBody() dispatch — extend with new step IDs** (onboarding.js lines 83–97):
```javascript
function renderStepBody(stepId, body, container) {
  if (stepId === 'welcome')            return renderWelcome(body, container);
  if (stepId === 'bartender_name')     return renderBartenderName(body, container);
  if (stepId === 'bartender_voice')    return renderBartenderVoice(body, container);
  if (stepId === 'bartender_specialty')return renderBartenderSpecialty(body, container);
  if (stepId === 'your_name')          return renderYourName(body, container);
  if (stepId === 'location')           return renderLocation(body, container);
  if (stepId === 'background')         return renderBackground(body, container);
  if (stepId === 'equipment')          return renderEquipment(body, container);
  if (stepId === 'inventory_paste')    return renderInventoryPaste(body, container);
  if (stepId === 'smoke')              return renderSmoke(body, container);
  if (stepId === 'done')               return renderDone(body, container);
  if (stepId.startsWith('axis_')) {
    const axisKey = stepId.replace('axis_', '');
    const axisConfig = AXES.find(a => a.key === axisKey);
    if (axisConfig) return renderAxisStep(axisConfig, body, container);
  }
}
```

**Bjorn avatar in welcome step** (new; css .header-logo pattern lines 51–63):
```javascript
function renderWelcome(body, container) {
  const cfg = GitHubAPI.cfg();
  const avatarUrl = cfg.owner && cfg.repo
    ? `https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/main/images/barkeeper_bjorn_001.png`
    : null;
  const barkeeper = State.get('barkeeper') || {};
  const bkName = barkeeper.identity?.name || 'Barkeeper Bjorn';

  body.innerHTML = `
    <div class="wizard-avatar-wrap" style="text-align:center;margin-bottom:20px;">
      ${avatarUrl ? `<img src="${avatarUrl}" alt="${Utils.escapeHtml(bkName)}"
        onerror="this.style.display='none'"
        style="width:120px;height:120px;border-radius:50%;border:2px solid var(--amber);object-fit:cover;">` : ''}
      <p style="font-size:0.82rem;color:var(--text-muted);margin-top:8px;">
        ${Utils.escapeHtml(bkName)}
      </p>
    </div>
    <h1 style="font-size:2rem;margin-bottom:12px;">Welcome.</h1>
    <p class="wizard-question">I'm ${Utils.escapeHtml(bkName)} — your personal mixologist and bar collaborator.</p>
    <p style="color:var(--text-dim);margin-bottom:28px;">
      Let's spend a few minutes setting up your profile. I'll ask you one question at a time.
    </p>`;
  navButtons(body, container, { nextLabel: 'Let\'s Begin →' });
}
```

---

### `app/js/views/dashboard.js` (modify, read-only view)

**Analog:** self — extend in-place. Patterns documented for the three additions.

**Progress banner insertion** (new; insert before statsEl — dashboard.js line 55; RESEARCH.md Pattern 7):
```javascript
// In the returning-user branch, after greetEl is appended, before statsEl:
const profile = State.get('profile') || {};
if (!profile.onboarding_complete) {
  const bannerEl = document.createElement('div');
  bannerEl.className = 'dash-progress-banner';
  bannerEl.innerHTML = `
    <span>Your profile is incomplete — </span>
    <a href="#onboarding" class="banner-cta">Finish setup →</a>`;
  container.appendChild(bannerEl);
}
```

**Dashboard hero image** (new .dash-hero div; onerror collapse pattern from RESEARCH.md Pitfall 4):
```javascript
// In returning-user branch, before greetEl:
const cfg = GitHubAPI.cfg();
if (cfg.owner && cfg.repo) {
  const heroEl = document.createElement('div');
  heroEl.className = 'dash-hero';
  const heroImg = document.createElement('img');
  heroImg.src = `https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/main/images/barkeeper_bjorn_002.png`;
  heroImg.alt = '';
  heroImg.onerror = () => { heroEl.style.display = 'none'; };
  heroEl.appendChild(heroImg);
  container.appendChild(heroEl);
}
```

**7-item menu grid with disabled cards** (extends dashboard.js lines 78–105; .menu-item--featured at css line 364):
```javascript
// Add to menuEl.innerHTML after the existing 5 items:
`<div class="menu-item menu-item--disabled" data-coming-soon>
  <svg>…chat icon…</svg>
  <span class="menu-item-title">Chat with Bjorn</span>
  <span class="menu-item-desc"><span class="badge badge-amber">Coming soon</span></span>
</div>
<div class="menu-item menu-item--disabled" data-coming-soon>
  <svg>…classroom icon…</svg>
  <span class="menu-item-title">Classroom</span>
  <span class="menu-item-desc"><span class="badge badge-amber">Coming soon</span></span>
</div>`

// Event delegation on grid for "coming soon" clicks:
menuEl.addEventListener('click', e => {
  if (e.target.closest('[data-coming-soon]')) {
    Utils.showToast('Unlock by adding your Anthropic API key in Settings.');
    e.preventDefault();
  }
});
```

**CSS class for grid change** — change `.menu-grid` in css from `repeat(auto-fill, minmax(220px, 1fr))` to explicit responsive columns in new CSS:
```css
/* New override for 7-item grid */
.menu-grid {
  grid-template-columns: repeat(3, 1fr);   /* desktop */
}
@media (max-width: 640px) {
  .menu-grid { grid-template-columns: repeat(2, 1fr); }
}
```

---

### `app/js/views/inventory.js` (modify, additive)

**Analog:** self — extend in-place.

**Search bar insertion before tabs** (inventory.js lines 257–284; RESEARCH.md Pattern 8):
```javascript
// Insert into sectionsEl before tabsEl:
const searchBar = document.createElement('div');
searchBar.className = 'inv-search-bar';
searchBar.innerHTML = `
  <input type="text" class="inv-search-input" placeholder="Search inventory…">
  <select class="inv-category-select">
    <option value="">Jump to category…</option>
    ${[...BOTTLE_SECTIONS, ...STRING_SECTIONS].map(s =>
      `<option value="${Utils.escapeHtml(s.key)}">${Utils.escapeHtml(s.label)}</option>`
    ).join('')}
  </select>`;
sectionsEl.appendChild(searchBar);

const searchInput  = searchBar.querySelector('.inv-search-input');
const categorySelect = searchBar.querySelector('.inv-category-select');
```

**Real-time chip filter — scoped to #tab-content** (RESEARCH.md Pitfall 3 — must scope to active tab):
```javascript
searchInput.addEventListener('input', () => {
  const query = searchInput.value.toLowerCase();
  const tabContent = document.querySelector('#tab-content');
  if (!tabContent) return;
  tabContent.querySelectorAll('.bottle-chip').forEach(chip => {
    const text = chip.textContent.toLowerCase();
    chip.style.display = text.includes(query) ? '' : 'none';
  });
  // Hide section title if no chips visible in that section
  tabContent.querySelectorAll('.inventory-section').forEach(sec => {
    const hasVisible = [...sec.querySelectorAll('.bottle-chip')]
      .some(c => c.style.display !== 'none');
    const title = sec.querySelector('.inventory-section-title');
    if (title) title.style.display = hasVisible ? '' : 'none';
  });
});
```

**Category select smooth-scroll** (inventory.js line 83 — data-sectionKey already set):
```javascript
categorySelect.addEventListener('change', () => {
  const key = categorySelect.value;
  if (!key) return;
  // data-sectionKey is already set on .inventory-section at renderBottleSection() line 83
  const section = document.querySelector(`.inventory-section[data-sectionKey="${key}"]`);
  if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  categorySelect.value = '';   // reset after jump
});
```

**Reset search on tab switch** — add to tab click handler (inventory.js line 270):
```javascript
tab.addEventListener('click', () => {
  tabsEl.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
  tab.classList.add('active');
  // Reset search so stale filter doesn't carry over to new tab content
  if (searchInput) searchInput.value = '';
  renderTabContent(t.id, inv, contentEl);
});
```

---

### `app/index.html` (modify)

**Analog:** self — targeted edits. Patterns documented.

**Script tag insertion order** (index.html lines 70–80; `settings.js` must load before `app.js`):
```html
<!-- Views -->
<script src="js/views/setup.js"></script>
<script src="js/views/settings.js"></script>   <!-- ADD HERE — before app.js -->
<script src="js/views/dashboard.js"></script>
<!-- ... other views ... -->
<script src="js/app.js"></script>               <!-- must remain last -->
```

**Nav link pattern** (index.html lines 22–49; data-route attribute is required for updateNav()):
```html
<!-- Keep existing Setup link; add Settings link with matching slot/class -->
<a href="#setup" data-route="setup" class="nav-setup-btn" id="nav-setup-link">
  <svg>…gear icon…</svg>
  <span>Setup</span>
</a>
<!-- New Settings link — hidden initially; app.js toggles display -->
<a href="#settings" data-route="settings" class="nav-setup-btn" id="nav-settings-link" style="display:none">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/>
  </svg>
  <span>Settings</span>
</a>
```

**Header avatar img tag** (new; replaces SVG inside .header-logo; index.html lines 12–18):
```html
<a href="#dashboard" class="header-logo">
  <!-- SVG remains as fallback inside onerror handler in app.js -->
  <img id="header-avatar" alt="Barkeeper Bjorn"
       style="width:28px;height:28px;border-radius:50%;object-fit:cover;display:none;">
  <svg id="header-logo-svg" viewBox="0 0 24 24" …>…</svg>
  <span>Barkeeper Bjorn</span>
</a>
```

---

### `app/css/app.css` (modify — append new classes)

**Analog:** self. All new classes append at bottom of file. Follow existing naming conventions.

**Design token reference** (app.css lines 4–23 — use only these, no hardcoded hex):
```
--bg, --bg2, --bg3, --bg4
--border, --border2
--amber, --amber-dim, --amber-glow
--text, --text-dim, --text-muted
--green, --red, --blue
--radius, --radius-sm, --shadow, --transition
```

**BEM-influenced modifier naming pattern** (css lines 364–365):
```css
/* Existing: */
.menu-item--featured { … }
/* New modifiers follow same pattern: */
.menu-item--disabled { … }
/* Not: .disabledMenuItem or .menu_item_disabled */
```

**New CSS blocks to add** (all use var() tokens only, no hardcoded hex):
```css
/* ─── Settings Page ─────────────────────────────────────── */
.settings-wrap { max-width: 640px; }
.settings-section {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
  margin-bottom: 20px;
}
.settings-section__heading {
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--amber-dim);
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
}
.settings-danger { border-color: var(--red); }

/* ─── Dashboard Progress Banner ──────────────────────────── */
.dash-progress-banner {
  background: rgba(212,148,58,0.08);
  border: 1px solid var(--amber-dim);
  border-radius: var(--radius-sm);
  padding: 10px 16px;
  margin-bottom: 20px;
  font-size: 0.9rem;
  color: var(--text-dim);
}
.banner-cta { color: var(--amber); font-weight: bold; }
.banner-cta:hover { color: var(--amber-glow); }

/* ─── Dashboard Hero Image ───────────────────────────────── */
.dash-hero {
  height: 180px;
  border-radius: var(--radius);
  overflow: hidden;
  margin-bottom: 24px;
  position: relative;
}
.dash-hero img {
  width: 100%; height: 100%;
  object-fit: cover;
  opacity: 0.6;
}

/* ─── Dashboard Coming-Soon Cards ────────────────────────── */
.menu-item--disabled {
  opacity: 0.45;
  cursor: default;
  pointer-events: auto;  /* keep for toast click */
}
.menu-item--disabled:hover { border-color: var(--border); background: var(--bg2); }

/* ─── Inventory Search Bar ───────────────────────────────── */
.inv-search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  align-items: center;
}
.inv-search-input { flex: 1; }
.inv-category-select { width: 200px; }

/* ─── Onboarding Axis Slider Additions ───────────────────── */
/* .axis-slider already exists at line 334; these supplement: */
.axis-slider-group { margin-bottom: 24px; }

/* ─── Header Avatar ──────────────────────────────────────── */
.header-avatar {
  width: 28px; height: 28px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid var(--amber-dim);
  flex-shrink: 0;
}

/* ─── Responsive additions for 7-item grid ───────────────── */
@media (min-width: 641px) {
  .menu-grid { grid-template-columns: repeat(3, 1fr); }
}
```

---

## Shared Patterns

### IIFE Module Pattern
**Source:** `app/js/views/setup.js` lines 3–7, 106–107; `app/js/views/dashboard.js` lines 3, 134–135
**Apply to:** `settings.js` (new file)
```javascript
const SettingsView = (() => {
  function render(container) { /* ... */ }
  return { render };
})();
```

### State.patch() + State.save() Write
**Source:** `app/js/state.js` lines 51–57, 66–68; `app/js/views/inventory.js` lines 208–219
**Apply to:** `settings.js` (barkeeper identity save), `onboarding.js` (axis skip flag + final saveAnswers)
```javascript
State.patch('barkeeper', bk => { bk.identity.name = newName; });
await State.save('barkeeper', 'message');
```

### Utils.escapeHtml() on All User Input
**Source:** `app/js/views/setup.js` lines 22, 35, 39, 47; used throughout all views
**Apply to:** All template literals that render user-supplied or data-sourced strings in `settings.js`, `onboarding.js`, `dashboard.js`
```javascript
// Every interpolated string from user data:
`<span>${Utils.escapeHtml(userValue)}</span>`
```

### Utils.showToast() for Feedback
**Source:** `app/js/views/inventory.js` lines 218–219
**Apply to:** All save confirmations, error states, "coming soon" clicks in `dashboard.js`, `settings.js`
```javascript
Utils.showToast('Saved ✓');
Utils.showToast(`Save failed: ${err.message}`, 'error');
Utils.showToast('Unlock by adding your Anthropic API key in Settings.');
```

### data-route Active State
**Source:** `app/js/app.js` lines 11–14; `app/index.html` lines 22–49
**Apply to:** New settings nav link in `index.html`; new `case 'settings'` in `app.js`
```javascript
// app.js updateNav() already handles this — just add data-route="settings" to the link
document.querySelectorAll('#main-nav a[data-route]').forEach(a => {
  a.classList.toggle('active', a.dataset.route === route);
});
```

### Image URL Construction (runtime)
**Source:** RESEARCH.md Pattern 5 / Pitfall 4; `app/js/github-api.js` lines 7–14
**Apply to:** Header avatar (`app.js`), dashboard hero (`dashboard.js`), onboarding welcome (`onboarding.js`)
```javascript
const cfg = GitHubAPI.cfg();
// Only build URL when owner + repo are available
if (cfg.owner && cfg.repo) {
  const url = `https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/main/images/${filename}`;
}
```

### Nav Gating (pre/post config) in app.js
**Source:** `app/js/app.js` lines 11–15, 26–28, 116–123
**Apply to:** `app/js/app.js` (modify `updateNav()` + boot block) and `app/index.html` (both nav links)
```javascript
// In updateNav(route):
const configured = GitHubAPI.isConfigured();
document.getElementById('nav-setup-link')?.style.setProperty('display', configured ? 'none' : '');
document.getElementById('nav-settings-link')?.style.setProperty('display', configured ? '' : 'none');

// In app.js switch — add:
case 'settings':
  SettingsView.render(content);
  break;
```

### confirm-dialog Classes (existing)
**Source:** `app/css/app.css` lines 575–591
**Apply to:** Logout confirmation in `settings.js` (prefer over window.confirm — see RESEARCH.md Pitfall 5)
```javascript
// Inject overlay into document.body:
const overlay = document.createElement('div');
overlay.className = 'confirm-dialog-overlay';
overlay.innerHTML = `
  <div class="confirm-dialog">
    <h3>Log out?</h3>
    <p>This will clear all stored credentials. You'll need to reconnect to GitHub.</p>
    <div class="dialog-btns">
      <button class="btn btn-ghost btn-sm" id="dlg-cancel">Cancel</button>
      <button class="btn btn-danger btn-sm" id="dlg-confirm">Log out</button>
    </div>
  </div>`;
document.body.appendChild(overlay);
overlay.querySelector('#dlg-cancel').addEventListener('click', () => overlay.remove());
overlay.querySelector('#dlg-confirm').addEventListener('click', () => {
  overlay.remove();
  // ... execute logout
});
```

---

## No Analog Found

All 6 files have analogs in the codebase. No file requires falling back to RESEARCH.md-only patterns.

---

## Metadata

**Analog search scope:** `app/js/views/`, `app/js/`, `app/css/`, `app/index.html`
**Files read:** onboarding.js (443 lines), dashboard.js (135 lines), inventory.js (398 lines), app.js (125 lines), index.html (82 lines), setup.js (107 lines), state.js (81 lines), app.css (603 lines, read in 3 passes), profile.js (first 80 lines)
**Pattern extraction date:** 2026-05-11
