# Phase 2: Web UI UX & Settings — Research

**Researched:** 2026-05-11
**Domain:** Vanilla ES6+ SPA — onboarding wizard, dashboard, settings page, inventory view, CSS theming
**Confidence:** HIGH (all findings verified directly from codebase source files)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01 to D-03 (Bjorn Avatar Images):**
- All images from `images/` — no new images needed
- `barkeeper_bjorn_icon.png` → header title bar (28×28px circle)
- `barkeeper_bjorn_001.png` → onboarding welcome (120×120px circle)
- `barkeeper_bjorn_002.png` → dashboard hero + AI contexts
- `bar_equipment_001.png` → setup/onboarding header (not Phase 2 scope per UI-SPEC)
- Image URL: `https://raw.githubusercontent.com/{owner}/{repo}/main/images/{filename}` — `GitHubAPI.cfg()` provides owner/repo at runtime; fallback to SVG icon on error

**D-04 (Step Order):** 17-step onboarding:
1. welcome, 2. bartender_name, 3. bartender_voice, 4. bartender_specialty, 5. your_name, 6. location, 7. background, 8. equipment, 9. inventory_paste, 10. axis_sweetness, 11. axis_acid, 12. axis_strength, 13. axis_complexity, 14. axis_season, 15. axis_risk, 16. smoke, 17. done

**D-05 (Skip Behavior):**
| Step | Skip behavior |
|---|---|
| Bartender name | Default: "Barkeeper Bjorn" |
| Bartender voice preset | Default: "Warm & playful" |
| Bartender specialty | Default: "No preference (broad and balanced)" |
| All 6 flavor axes + smoke | Store `_skipped: true` flag on the axis object; recommender uses midpoint default (0.5) |
| Your name, location, background, equipment | Store `_skipped: true` flag; no default value set |

**D-06:** `onboarding_complete: true` written to `profile` when `done` step renders.

**D-07:** Dashboard progress banner when `profile.onboarding_complete` absent/false: "Your profile is incomplete — [Finish setup →]". Above stats bar, removed when complete.

**D-08:** "Finish setup" navigates to `#onboarding` and resumes from first step with `_skipped: true`. Button hidden if no skipped steps.

**D-09 to D-12 (Sliders):** 0.0–1.0 float storage; left/right pole labels only; "Middle" center label; passive migration (float overwrites old string on save).

**D-13 to D-15 (Inventory Paste):** Comma-separated; preview chips before save; "Looks good →"; items go to `inventory.spirits` as strings; UI note about Inventory view.

**D-16 to D-19 (Settings):** Route `#settings`, new file `app/js/views/settings.js`; 4 sections: Bartender Identity, GitHub Connection, Account (Logout), Danger Zone; Reset preserves GitHub creds; Logout clears all `bb_*` keys; two-click reveal for Reset.

**D-20 to D-23 (Nav):** Pre-config: only "Setup" link visible; post-config: Setup replaced by gear icon to `#settings`; Setup remains accessible via Settings → "Change GitHub connection →".

**D-24 to D-25 (Dashboard Grid):** 7-item grid (3×2+1); items 6 (Chat with Bjorn) and 7 (Classroom) disabled with `menu-item--disabled`; click shows toast "Unlock by adding your Anthropic API key in Settings."

**D-26 to D-27 (Inventory Search):** Real-time text search filters chips by `includes` (case-insensitive); category `<select>` smooth-scrolls to section header.

### Claude's Discretion
- Exact wording of progress banner and "Coming soon" toast (resolved in UI-SPEC copywriting contract)
- Visual treatment of grayed-out dashboard cards (resolved in UI-SPEC: opacity 0.45, `.menu-item--disabled`)
- Layout of 6/7-item dashboard grid (resolved in UI-SPEC: 3-column desktop, 2-column mobile)
- Whether search + filter appear same row (resolved in UI-SPEC: same row)
- Avatar image sizing and styling (resolved in UI-SPEC: 28px header, 120px onboarding)

### Deferred Ideas (OUT OF SCOPE)
- Diverse bartender avatars (additional images, race/gender options) — no stub code
- Anthropic API key field in Settings — Phase 5 only
- Profile view editable sliders — out of scope for Phase 2
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ONB-01 | Every onboarding step has a "Skip for now →" link | `navButtons()` helper at line 99 in onboarding.js already supports `skipFn` option — extend it; skip must write `_skipped: true` flag, not just advance step |
| ONB-02 | Flavor axes as sliders with explicit "Middle" center label | Current axis steps use A/B/C option cards; replace with `<input type="range" min="0" max="1" step="0.01">`; existing `.axis-slider` CSS class in profile view reusable; `Utils.axisToValue()` and `Utils.valueToAxisLabel()` helpers already exist |
| ONB-03 | Bartender personalization at step 2 in web UI wizard | Current step order starts with welcome, track, name, location — must be restructured to insert bartender_name/voice/specialty after welcome; voice presets and specialty options locked by Phase 1 D-11/D-12 |
| ONB-04 | Free-text inventory paste entry during onboarding | New step `inventory_paste` between equipment and axis steps; `<textarea>`, parse on blur or button; chip preview using existing `.bottle-chip` CSS; "Looks good →" saves to `inventory.spirits` as strings |
| NAV-01 | Bjorn avatar in header title bar | Replace SVG icon in `.header-logo` with `<img class="header-avatar">` 28×28px circle; `onerror` fallback shows existing SVG; URL from `GitHubAPI.cfg()` at render time |
| NAV-02 | Dashboard hero background image | New `.dash-hero` container above greeting in returning-user branch; `barkeeper_bjorn_002.png`; 180px height, object-fit cover, opacity 0.6; `onerror` collapses container |
| NAV-03 | Onboarding welcome shows Bjorn avatar with caption | New `.wizard-avatar-wrap` block in `renderWelcome()`; 120×120px circle with amber border; caption uses barkeeper name from `State.get('barkeeper')` |
| NAV-04 | Expanded dashboard quick-action grid (6/7 actions) | Current grid: 5 items; add Chat with Bjorn (disabled) + Classroom (disabled); change grid to `repeat(3, 1fr)` desktop / `repeat(2, 1fr)` mobile; disabled cards use event delegation on grid for toast |
| NAV-05 | Settings gear icon in nav bar | Conditional render in `app.js`: pre-config shows only Setup link; post-config replaces with `data-route="settings"` gear icon; `index.html` needs new link + new `case 'settings'` in switch |
| SETTINGS-01 | Bartender identity (rename + voice preset) in Settings | Reads from `State.get('barkeeper')`; saves via `State.patch('barkeeper', fn)` + `State.save('barkeeper', msg)`; voice preset is a `<select>` with Phase 1 D-11 options |
| SETTINGS-02 | GitHub connection re-exposed (partial — no Anthropic key) | Mirrors `SetupView` fields; writes to localStorage via same `localStorage.setItem('bb_*', ...)` pattern; calls `GitHubAPI.validateConfig()` to verify; dispatches `bb:reset-data` custom event to force data reload |
| SETTINGS-03 | Logout with confirmation | Clears all `bb_*` localStorage keys; browser `confirm()` acceptable in Phase 2; redirect to `#setup` after |
| SETTINGS-04 | "Reset all data" Danger Zone two-step | First click reveals warning + "Yes, delete everything" + "Never mind, keep my data"; second click executes reset — writes empty defaults to all 4 files; GitHub creds preserved; toast confirms |
| INV-01 | Real-time inventory search | `input` event listener on search field; iterate all `.bottle-chip` elements in active tab; toggle `display: none` based on case-insensitive text match; hide section header if 0 visible chips |
| INV-02 | Category filter dropdown with jump-scroll | `<select>` with options from `BOTTLE_SECTIONS` labels + `STRING_SECTIONS` labels; `change` handler calls `.inventory-section[data-sectionKey]` → `scrollIntoView({ behavior: 'smooth', block: 'start' })` |
</phase_requirements>

---

## Summary

Phase 2 is a pure frontend refactor within `app/` — no new dependencies, no build tooling, no schema changes beyond adding `onboarding_complete` to the profile. The codebase is a vanilla ES6+ IIFE-pattern SPA. All research was done by reading the actual source files; confidence is HIGH throughout.

The largest change is the onboarding wizard (`onboarding.js`, 443 lines). The current STEPS array has 14 items; the new one needs 17. The current step dispatcher uses `if/else` string matching, which is the correct pattern to extend. The current `navButtons()` helper already has a `skipFn` hook — the main work is wiring `_skipped: true` writes and a resume-from-first-skipped mechanism. The axis steps must be rewritten from option cards to `<input type="range">` sliders, reusing the existing `.axis-slider` CSS from the Profile view.

The Settings page is a new file (`settings.js`) following the identical IIFE `render(container)` pattern. It reads from `State.get('barkeeper')` and writes back via `State.patch()` / `State.save()`. The GitHub Connection section can be a near-copy of `SetupView` internals. Navigation gating (pre/post config) requires a small conditional in `app.js` — the nav active-state logic already walks `data-route` attributes, so this is a targeted change.

Dashboard and Inventory changes are additive — new DOM elements and CSS classes, not rewrites of existing logic.

**Primary recommendation:** Work in wave order: (1) onboarding wizard restructure + skip logic, (2) Settings page + nav gating, (3) dashboard additions, (4) inventory search/filter. Each wave is independently testable.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Onboarding step flow + skip | Browser (OnboardingView IIFE) | State (profile save on done) | Pure presentation state; only persisted at `done` step |
| Flavor axis slider values | Browser (UI) → State → GitHub | — | Float written to `profile.flavor_profile.axes[key].position` via `State.save('profile')` |
| Free-text inventory paste | Browser (parse + chip preview) | State → GitHub | Parsed strings written to `inventory.spirits` via `State.save('inventory')` |
| Settings — bartender identity | Browser (SettingsView) | State → GitHub (`barkeeper.json`) | `State.patch('barkeeper', fn)` + `State.save('barkeeper')` |
| Settings — GitHub config | Browser (SettingsView) | localStorage only | Same localStorage keys as SetupView; no GitHub API call until validate |
| Settings — logout | Browser | localStorage | Clear `bb_*` keys, redirect |
| Settings — reset all data | Browser → State → GitHub | — | Overwrite all 4 JSON files with empty defaults via `State.save()` |
| Dashboard hero image | Browser (DashboardView) | GitHubAPI.cfg() for URL | Image URL built at render time; no persistent state |
| Header avatar image | Browser (index.html / app.js) | GitHubAPI.cfg() for URL | Rendered on every route change; URL from cfg() |
| Nav gating (pre/post config) | Browser (app.js) | GitHubAPI.isConfigured() | Checked on every navigate() call |
| Inventory search/filter | Browser (InventoryView) | — | DOM-only filtering; no state mutation |
| Category scroll-jump | Browser (InventoryView) | — | `scrollIntoView()` on existing `.inventory-section` nodes |
| Image URLs | Browser (runtime) | GitHubAPI.cfg() | `raw.githubusercontent.com/{owner}/{repo}/main/images/` — constructed inline |

---

## Standard Stack

### Core (no changes — verified from codebase)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vanilla ES6+ | Browser native | All UI logic | Project constraint — no npm, no build step |
| CSS Custom Properties | Browser native | Theming | Single `app/css/app.css`; all tokens in `:root` |
| GitHub Contents API | v2022-11-28 | Persistent storage | Only external dependency; already wired in `github-api.js` |

**Installation:** None required. No npm packages. Serve `app/` directly.

### Reusable Existing CSS Classes (verified from `app/css/app.css`)

| Class | Current Location | Reuse In |
|-------|-----------------|---------|
| `.axis-slider` | Profile view (radar section) | Onboarding axis steps |
| `.bottle-chip` + `.chip-remove` | Inventory view | Inventory paste chip preview |
| `.wizard-option`, `.wizard-nav`, `.wizard-wrap` | Onboarding | Extended, not replaced |
| `.menu-item`, `.menu-item--featured` | Dashboard | New `.menu-item--disabled` modifier |
| `.settings-section`, `.settings-section__heading` | New | Settings page |
| `.page-header` | Multiple views | Settings page header |
| `.btn-primary`, `.btn-ghost`, `.btn-danger`, `.btn-sm` | Global | All new buttons |
| `.form-group`, `.form-row` | Setup, Onboarding | Settings identity form |
| `.badge` | Multiple | "Coming soon" badge (new `.coming-soon-badge`) |
| `.tabs`, `.tab` | Inventory | No change |
| `confirm-dialog`, `confirm-dialog-overlay` | CSS exists | Logout confirmation |

[VERIFIED: app/css/app.css read directly]

---

## Architecture Patterns

### System Architecture Diagram

```
Browser (Hash Router in app.js)
  │
  ├── #setup         → SetupView.render()       [no data load]
  ├── #onboarding    → OnboardingView.render()   [reads State.get('barkeeper')]
  ├── #dashboard     → DashboardView.render()    [reads all 4 state keys]
  ├── #inventory     → InventoryView.render()    [reads State.get('inventory')]
  ├── #settings      → SettingsView.render()     [NEW — reads barkeeper + GitHubAPI.cfg()]
  └── (other routes unchanged)
         │
         ▼
       State (in-memory)
         │ State.get() / State.patch() / State.set()
         ▼
       State.save(key, message)
         │
         ▼
       GitHubAPI.writeJSON(path, data, sha, message)
         │
         ▼
       GitHub Contents API (PUT /repos/{owner}/{repo}/contents/{path})
         │
         ▼
       data/barkeeper.json
       data/bar-owner-profile.json
       data/inventory.json
       data/recipes.json
```

**Nav gating data flow (D-20/D-21):**
```
app.js boot
  → GitHubAPI.isConfigured()
      → true  → render full nav (gear icon replaces Setup)
      → false → render Setup-only nav
```

### Recommended Project Structure (changes only)

```
app/
├── css/
│   └── app.css               (extend: new CSS classes for Phase 2 components)
├── js/
│   ├── app.js                (modify: add 'settings' case; update nav gating)
│   ├── views/
│   │   ├── onboarding.js     (modify: new STEPS array, new step renders, skip logic)
│   │   ├── dashboard.js      (modify: hero image, progress banner, 7-item grid)
│   │   ├── inventory.js      (modify: search bar, category filter)
│   │   └── settings.js       (NEW: IIFE module, 4 sections)
│   └── state.js              (no change — existing API sufficient)
└── index.html                (modify: nav link for settings, new script tag)
```

### Pattern 1: Extending the Onboarding STEPS Array

**What:** Current STEPS is a module-level `const` array. New step order inserts bartender personalization steps after `welcome` and adds `inventory_paste` before axis steps.

**Current STEPS (14 items):**
```javascript
// Source: app/js/views/onboarding.js line 50
const STEPS = [
  'welcome', 'track', 'name', 'location', 'background', 'equipment',
  ...AXES.map(a => `axis_${a.key}`),
  'smoke', 'done',
];
```

**New STEPS (17 items — replaces `track` with 3 bartender steps; renames `name` → `your_name`; adds `inventory_paste`):**
```javascript
const STEPS = [
  'welcome',
  'bartender_name', 'bartender_voice', 'bartender_specialty',
  'your_name', 'location', 'background', 'equipment',
  'inventory_paste',
  ...AXES.map(a => `axis_${a.key}`),
  'smoke', 'done',
];
```

Note: `track` step (bar type: full vs minimalist) is removed. The 3 bartender steps replace it. `name` is renamed `your_name` for clarity (step ID only; the render function is renamed `renderYourName`).

[VERIFIED: onboarding.js read directly]

### Pattern 2: Skip Flag Storage

**What:** Current skip advances step without writing data. New skip must write a `_skipped: true` flag.

**Implementation pattern:**
```javascript
// For axis steps — write to profile flavor_profile
skipFn: () => {
  // Example for axis_sweetness
  State.patch('profile', p => {
    if (!p.flavor_profile) p.flavor_profile = {};
    if (!p.flavor_profile.axes) p.flavor_profile.axes = {};
    p.flavor_profile.axes.sweetness = { _skipped: true, position: 0.5 };
  });
  _step++;
  renderStep(container);
}

// For identity steps — write _skipped flag to a tracking structure
skipFn: () => {
  _answers._skipped_your_name = true;
  _step++;
  renderStep(container);
}
```

The resume-from-first-skipped logic (D-08) reads `_skipped: true` from the saved profile when navigating to `#onboarding`. This requires the render() function to NOT reset `_step = 0` unconditionally — instead check if any skipped steps exist and resume from the first one.

[VERIFIED: onboarding.js saveAnswers() at line 398; state.js patch() at line 66]

### Pattern 3: Adding the Settings Route

**Three changes required:**

1. **`app/index.html`** — Add `<script src="js/views/settings.js">` before `app.js`; add nav link:
```html
<!-- Replaces the current Setup <a> when configured — controlled by JS -->
<a href="#settings" data-route="settings" class="nav-setup-btn" id="nav-settings-link" style="display:none">
  <svg ...gear icon...></svg>
  <span>Settings</span>
</a>
```

2. **`app/js/app.js`** — Add case in switch:
```javascript
case 'settings':
  SettingsView.render(content);
  break;
```

3. **`app/js/app.js`** — Update `updateNav()` to handle pre/post config state:
```javascript
function updateNav(route) {
  const configured = GitHubAPI.isConfigured();
  // Show/hide setup vs settings link
  document.getElementById('nav-setup-link')?.style.display = configured ? 'none' : '';
  document.getElementById('nav-settings-link')?.style.display = configured ? '' : 'none';
  // Active state
  document.querySelectorAll('#main-nav a[data-route]').forEach(a => {
    a.classList.toggle('active', a.dataset.route === route);
  });
}
```

[VERIFIED: app.js navigate() and updateNav() at lines 11-16, 25-82; index.html nav structure at lines 21-50]

### Pattern 4: Settings Page IIFE Module

**New file: `app/js/views/settings.js`**

```javascript
// Settings page — bartender identity, GitHub config, logout, danger zone.
const SettingsView = (() => {
  function render(container) {
    const barkeeper = State.get('barkeeper') || {};
    const cfg = GitHubAPI.cfg();
    // Build 4 sections in .settings-wrap
    container.innerHTML = `
      <div class="settings-wrap">
        <div class="page-header">
          <h1>Settings</h1>
          <p>Configure Barkeeper Bjorn</p>
        </div>
        <!-- Section 1: Bartender Identity -->
        <!-- Section 2: GitHub Connection -->
        <!-- Section 3: Account (Logout) -->
        <!-- Section 4: Danger Zone -->
      </div>`;
    // Attach event listeners
  }
  return { render };
})();
```

[VERIFIED: IIFE pattern from CONVENTIONS.md; SetupView as reference at app/js/views/setup.js]

### Pattern 5: Nav Gating (Pre/Post Config)

**Current behavior:** `index.html` line 46 has a static `<a href="#setup" data-route="setup" class="nav-setup-btn">`. All other nav links are always rendered.

**New behavior:** Post-config, the Setup link must not appear and a Settings gear icon must appear instead. Two implementation options:

- **Option A (recommended):** Keep both links in `index.html` with IDs (`nav-setup-link`, `nav-settings-link`); toggle `display` via `updateNav()` in `app.js`. Simple, no DOM manipulation overhead.
- **Option B:** Dynamically rewrite nav HTML in `app.js`. More work, same result.

Option A is consistent with how the codebase already works (static HTML shell, JS activates).

[VERIFIED: app.js updateNav() at line 11; index.html nav at lines 21-50]

### Pattern 6: Slider Axis Steps

**Current renderAxisStep()** renders A/B/C option cards. The new version renders a range slider using the existing `.axis-slider` CSS.

```javascript
function renderAxisStep(axisConfig, body, container) {
  const current = _answers[`axis_${axisConfig.key}`] ?? 0.5;
  body.innerHTML = `
    <div class="wizard-question">${Utils.escapeHtml(axisConfig.question)}</div>
    <div class="axis-slider-group">
      <div class="axis-slider-poles">
        <span class="axis-pole-label--left">${Utils.escapeHtml(axisConfig.labelLeft)}</span>
        <span class="axis-pole-label--right">${Utils.escapeHtml(axisConfig.labelRight)}</span>
      </div>
      <input type="range" class="axis-slider" id="wiz-axis-${axisConfig.key}"
             min="0" max="1" step="0.01" value="${current}"
             aria-label="${Utils.escapeHtml(axisConfig.key)} preference"
             aria-valuemin="0" aria-valuemax="1" aria-valuenow="${current}">
      <div class="axis-slider-center-label">Middle</div>
    </div>`;
  navButtons(body, container, {
    nextFn: () => {
      const val = parseFloat(body.querySelector(`#wiz-axis-${axisConfig.key}`).value);
      _answers[`axis_${axisConfig.key}`] = val;
      _step++; renderStep(container);
    },
    skipFn: () => {
      _answers[`axis_${axisConfig.key}`] = { value: 0.5, _skipped: true };
      _step++; renderStep(container);
    }
  });
}
```

The AXES config array needs new fields: `labelLeft`, `labelRight`, `question`. Pole label pairs are locked by CONTEXT.md D-10 and documented in the UI-SPEC.

[VERIFIED: app/css/app.css `.axis-slider` at line 334; profile.js axis rendering; utils.js `axisToValue()` at line 87]

### Pattern 7: Dashboard Progress Banner

```javascript
// In DashboardView.render() — returning user branch, before statsEl
if (!profile.onboarding_complete) {
  const bannerEl = document.createElement('div');
  bannerEl.className = 'dash-progress-banner';
  bannerEl.innerHTML = `
    <span class="banner-text">Your profile is incomplete — </span>
    <a href="#onboarding" class="banner-cta">Finish setup →</a>`;
  container.appendChild(bannerEl);
}
```

CSS for `.dash-progress-banner` is new (see Architecture Patterns — CSS section).

[VERIFIED: dashboard.js structure at lines 44-75; CONTEXT.md D-07]

### Pattern 8: Inventory Search + Filter

```javascript
// In InventoryView.render() — insert .inv-search-bar before tabs
const searchBar = document.createElement('div');
searchBar.className = 'inv-search-bar';
searchBar.innerHTML = `
  <input type="text" class="inv-search-input" placeholder="Search inventory…">
  <select class="inv-category-select">
    <option value="">All categories</option>
    ${[...BOTTLE_SECTIONS, ...STRING_SECTIONS].map(s =>
      `<option value="${s.key}">${Utils.escapeHtml(s.label)}</option>`
    ).join('')}
  </select>`;

const searchInput = searchBar.querySelector('.inv-search-input');
const categorySelect = searchBar.querySelector('.inv-category-select');

searchInput.addEventListener('input', () => {
  const query = searchInput.value.toLowerCase();
  document.querySelectorAll('.bottle-chip').forEach(chip => {
    const text = chip.textContent.toLowerCase();
    chip.style.display = text.includes(query) ? '' : 'none';
  });
  // Hide section headers with 0 visible chips
  document.querySelectorAll('.inventory-section').forEach(sec => {
    const hasVisible = [...sec.querySelectorAll('.bottle-chip')]
      .some(c => c.style.display !== 'none');
    sec.querySelector('.inventory-section-title').style.display = hasVisible ? '' : 'none';
  });
});

categorySelect.addEventListener('change', () => {
  const key = categorySelect.value;
  if (!key) return;
  const section = document.querySelector(`.inventory-section[data-sectionKey="${key}"]`);
  if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
```

Note: The search must apply only to the active tab's visible chips. The `input` event should filter within the current `#tab-content` only. The `data-sectionKey` attribute is already written on inventory sections at line 86 of `inventory.js`.

[VERIFIED: inventory.js renderBottleSection() at line 78; BOTTLE_SECTIONS at line 6; STRING_SECTIONS at line 28]

### Anti-Patterns to Avoid

- **Resetting `_step = 0` unconditionally in `render()`:** The resume-from-skipped feature requires checking for existing skipped steps before defaulting to step 0.
- **Writing axis float values as strings:** `_answers[key] = parseFloat(...)` — always ensure the value is a number, not a string, before storing.
- **Hardcoding `owner`/`repo` for image URLs:** Must call `GitHubAPI.cfg()` at render time — the values change per user.
- **Adding inline style colors:** All colors must use `var(--token-name)`. No raw hex values in JS or CSS.
- **Using ES module syntax (`import`/`export`):** Script loading order in `index.html` replaces module resolution. `settings.js` must be a plain IIFE.
- **Querying outside `#tab-content` for inventory search:** The inventory view uses tabs; searching `.bottle-chip` globally would hit chips not in the current view if DOM retained past tab renders. Scope queries to the active container.
- **Forgetting to dispatch `bb:reset-data`** after settings changes that modify GitHub credentials — `app.js` listens for this event to reset `_dataLoaded = false`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toast notifications | Custom notification system | `Utils.showToast(msg, type, duration)` | Already exists; handles animation, stacking, container |
| HTML escaping | Custom escape function | `Utils.escapeHtml(str)` | Already exists; covers &, <, >, " |
| Date formatting | Custom date logic | `Utils.today()` and `Utils.formatDate(str)` | Already exists |
| Axis value conversion | Custom string/float mapper | `Utils.axisToValue(pos)` and `Utils.valueToAxisLabel(val)` | Already exists; handles all legacy string formats |
| Inventory item counting | Custom counter | `Utils.countInventoryItems(inv)` | Already exists; walks nested structure correctly |
| DOM element creation | Custom helpers | `Utils.el(tag, attrs, ...children)` | Already exists |
| Loading / error states | Custom empty states | `Utils.showLoading(container, msg)` and `Utils.showError(container, msg)` | Already exists |
| GitHub API calls | Direct fetch calls | `GitHubAPI.readJSON(path)` and `GitHubAPI.writeJSON(path, data, sha, msg)` | SHA management is critical — missing or stale SHA causes 409 conflicts |
| Inventory item scroll | Custom scroll implementation | `element.scrollIntoView({ behavior: 'smooth', block: 'start' })` | Browser native; no polyfill needed |

**Key insight:** The Utils and GitHubAPI modules cover all common operations. The SHA requirement in `writeJSON` is the most critical constraint — always use `State.save(key)` rather than calling `GitHubAPI.writeJSON` directly, because `State` tracks SHAs per key.

---

## Common Pitfalls

### Pitfall 1: Stale SHA on Settings Reset

**What goes wrong:** "Reset all data" writes empty defaults to all 4 JSON files. If done sequentially with `State.save()`, each save updates the SHA. If done with direct `GitHubAPI.writeJSON()` calls using the original SHAs, the second write will get a 409 conflict.

**Why it happens:** GitHub Contents API requires the current SHA for updates. Writing file A updates the SHA; subsequent writes must use the new SHA.

**How to avoid:** Use `State.save(key)` for each file — `State` updates `_shas[key]` after every successful write (verified at state.js line 55). Reset all 4 keys sequentially using `await` between each.

**Warning signs:** GitHub API 409 error; "sha doesn't match" in the error message.

[VERIFIED: github-api.js writeJSON() at line 48; state.js save() at line 51-56]

### Pitfall 2: Onboarding Resume Logic Breaks on Re-Render

**What goes wrong:** `render(container)` currently resets `_step = 0` and `_answers = {}` unconditionally (onboarding.js line 63-64). This means navigating away and back always restarts from step 1.

**Why it happens:** The current design has no persistence across navigations. Phase 2 adds resume from first skipped step (D-08).

**How to avoid:** Replace the unconditional reset with a check:
1. Read `profile.flavor_profile.axes` from State for skipped flags.
2. If any axis has `_skipped: true`, find the first one and set `_step` to its position in STEPS.
3. If no skipped steps, start at step 0 (welcome).
4. CONTEXT.md D-08: navigate to `#onboarding` from "Finish setup →"; the view's `render()` handles the resume logic.

**Warning signs:** User clicks "Finish setup →" and sees the welcome step instead of their first skipped step.

### Pitfall 3: Inventory Search Targets Wrong Tab

**What goes wrong:** The search `input` event queries `document.querySelectorAll('.bottle-chip')` — but only the active tab's content is in the DOM at any time (InventoryView re-renders `#tab-content` on tab click). The bug manifests only if the DOM retains hidden tab content.

**Why it happens:** `renderTabContent()` does `container.innerHTML = ''` on tab switch, so all previous chips are removed. The search input is outside the tabs, so it persists across tab switches.

**How to avoid:** Scope the chip query to `document.querySelector('#tab-content').querySelectorAll('.bottle-chip')`. Reset search input value when tab switches (so stale filter doesn't persist on new tab content).

**Warning signs:** Search works on Spirits tab but shows wrong results on Pantry tab.

[VERIFIED: inventory.js renderTabContent() at line 287; tabs at line 257-285]

### Pitfall 4: Image URL Requires Runtime Config

**What goes wrong:** Image URL `https://raw.githubusercontent.com/{owner}/{repo}/main/images/barkeeper_bjorn_icon.png` is constructed inline. If `GitHubAPI.cfg()` is called before config is set (during Setup), `owner` and `repo` are `null`, producing a broken URL.

**Why it happens:** The header is always visible, even on the Setup page. If the header avatar is added to `index.html` statically (not conditionally), it will try to load with null values.

**How to avoid:** Build avatar URL in `app.js` after `GitHubAPI.isConfigured()` is confirmed true. For the header specifically, update the `<img src>` after the user completes Setup (after `bb:reset-data` event fires). Or: render header avatar only when `isConfigured()` is true.

**Warning signs:** Broken image request to `https://raw.githubusercontent.com/null/null/main/images/...`.

### Pitfall 5: `confirm()` Dialog Blocked in Iframes

**What goes wrong:** Logout confirmation uses `window.confirm()` (UI-SPEC copywriting contract; GitHub Pages may serve in an iframe context in some browsers).

**Why it happens:** Some browser security policies block `confirm()` in embedded contexts.

**How to avoid:** The existing `confirm-dialog` / `confirm-dialog-overlay` CSS classes are already in `app.css` (lines 575-591). Use these for the logout confirmation instead of `window.confirm()`. The UI-SPEC explicitly allows `confirm()` for Phase 2, but the custom dialog classes are already there and more robust.

**Warning signs:** Logout confirmation never appears; logout executes immediately.

[VERIFIED: app.css confirm-dialog at line 575]

### Pitfall 6: `navButtons()` Skip Button Layout

**What goes wrong:** The existing `navButtons()` helper appends the Skip button with `marginLeft: 'auto'` — this pushes it to the right edge of the flex container. If the Back button is absent (step 0), the Next button and Skip button may not align as intended.

**Why it happens:** The `wizard-nav` flex container with `gap: 10px` and `marginLeft: auto` on Skip creates a left-group (Back + Next) and a right-group (Skip). At step 0, only Next + Skip appear. This may look acceptable or may need adjustment depending on desired layout.

**How to avoid:** Test at step 0 (welcome) and step 1 (bartender_name) — both have no Back button. The Skip should be styled as a text link per UI-SPEC (`.btn-ghost.btn-sm`) not a standalone button. The copywriting contract specifies "Skip for now →" as a link-style element.

[VERIFIED: onboarding.js navButtons() at line 99-123]

---

## Code Examples

### Verified Pattern: State.patch() + State.save()
```javascript
// Source: app/js/views/inventory.js saveInventory()
async function saveInventory() {
  const inv = State.get('inventory');
  inv.last_updated = Utils.today();
  try {
    await State.save('inventory', 'Update inventory via Barkeeper Bjorn web UI');
    Utils.showToast('Inventory saved to GitHub ✓');
  } catch (err) {
    Utils.showToast(`Save failed: ${err.message}`, 'error');
  }
}
```

### Verified Pattern: state.js patch()
```javascript
// Source: app/js/state.js lines 66-69
function patch(key, fn) {
  fn(_data[key]);
  notify({ type: 'updated', key });
}
```

### Verified Pattern: GitHubAPI.cfg() for runtime config
```javascript
// Source: app/js/github-api.js lines 7-14
function cfg() {
  return {
    token: localStorage.getItem('bb_token'),
    owner: localStorage.getItem('bb_owner'),
    repo:  localStorage.getItem('bb_repo'),
    branch: localStorage.getItem('bb_branch') || 'main',
  };
}
```

### Verified Pattern: Utils.axisToValue() — legacy string → float
```javascript
// Source: app/js/utils.js lines 87-100
function axisToValue(pos) {
  if (!pos || pos === '—' || pos === null) return null;
  const p = pos.toLowerCase();
  if (p.includes('strong a')) return 0.05;
  if (p.includes('lean a'))   return 0.25;
  if (p.includes('middle'))   return 0.5;
  if (p.includes('lean b'))   return 0.75;
  if (p.includes('strong b')) return 0.95;
  const n = parseFloat(pos);
  if (!isNaN(n)) return Math.max(0, Math.min(1, n));
  return null;
}
```

This means existing `bar-owner-profile.json` values ("Middle", "Strong A", "Strong B") are handled by `axisToValue()` for display in Profile view. The onboarding slider saves floats directly. No migration script needed (D-12 confirmed).

### Verified Pattern: data-route nav active state
```javascript
// Source: app/js/app.js lines 11-15
function updateNav(route) {
  document.querySelectorAll('#main-nav a[data-route]').forEach(a => {
    a.classList.toggle('active', a.dataset.route === route);
  });
}
```

New Settings link needs `data-route="settings"` in `index.html` for this to work.

### Verified Pattern: bb:reset-data custom event
```javascript
// Source: app/js/app.js lines 109-111
document.addEventListener('bb:reset-data', () => {
  _dataLoaded = false;
});
```

The Settings view must dispatch this event after successfully updating GitHub credentials, so `app.js` reloads data on next navigation.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|-----------------|--------------|--------|
| A/B/C option cards for flavor axes | Range sliders (0.0–1.0) | Phase 2 (this phase) | Profile view already uses sliders; onboarding aligns |
| Skip = silent advance (no data written) | Skip writes `_skipped: true` flag | Phase 2 (this phase) | Enables resume-from-first-skipped |
| `track` step (bar type) in wizard | Removed; replaced by bartender personalization steps | Phase 2 (this phase) | Aligns with agent onboarding order |
| No Settings page | `#settings` route with SettingsView | Phase 2 (this phase) | Consolidates config access |
| Setup link always visible in nav | Conditional: Setup (pre-config) / gear → Settings (post-config) | Phase 2 (this phase) | Nav reflects app state |
| No onboarding resume | Resume from first skipped step | Phase 2 (this phase) | Users can defer profile completion |
| `isNewUser()` checks `identity.full_name` | Supplemented by `profile.onboarding_complete` boolean | Phase 2 (this phase) | More reliable completion signal |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `inventory.spirits` is the correct target for inventory paste items (D-15 says `inventory.spirits`) | Architecture Patterns — Pattern 6 | If `inventory.spirits` doesn't exist in the current schema, write will create a new top-level key; check `data/inventory.json` schema before implementing |
| A2 | The `track` step (bar type: full vs minimalist) can be safely removed without breaking any downstream logic | Architecture Patterns — Pattern 1 | If `profile.track` is read anywhere (recommender, profile view), removing the step leaves that field empty; scan codebase for `track` reads before removing |
| A3 | Resume-from-skipped reads from the live State profile, not from a sessionStorage draft | Common Pitfalls — Pitfall 2 | If future phases implement ONB-03 (sessionStorage draft), the resume logic may conflict with the State-based approach used here |

[VERIFIED: All other claims verified from direct codebase reads]

---

## Open Questions

1. **Does `inventory.spirits` exist in the current data schema?**
   - What we know: CONTEXT.md D-15 says parsed inventory paste items go to `inventory.spirits` as strings.
   - What's unclear: The current `inventory.json` structure uses `base_spirits.whiskey`, `base_spirits.rum`, etc. (BOTTLE_SECTIONS in inventory.js). There is no `inventory.spirits` flat array in the current schema. This may be an intentional simplification for the paste step — a flat staging area — or a mismatch with the existing structure.
   - Recommendation: Clarify with user, OR default to writing to `base_spirits.other` or a new `inventory.spirits_paste` key, OR add a review step that lets users assign to categories (the UI-SPEC says chip preview only; no category assignment in Phase 2). The safest approach: write to a new `inventory.unassigned_paste` array and note in the UI that users should move items to the correct category from the Inventory view.

2. **How does `barkeeper.json` store voice preset and bartender name?**
   - What we know: Settings SETTINGS-01 reads from `State.get('barkeeper')`. The file is `data/barkeeper.json`.
   - What's unclear: The exact schema of `barkeeper.json` was not read in this research session.
   - Recommendation: Read `data/barkeeper.json` at planning time to confirm field names (`identity.name`, `personality.voice_preset`, etc.) before writing the Settings save logic.

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — this phase is pure browser JS/CSS changes with no CLI tools, runtimes, or external services beyond GitHub API which is already integrated).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None — no test framework detected in `app/` |
| Config file | None |
| Quick run command | `python3 -m http.server 8000` then open `http://localhost:8000/app/` — manual browser testing |
| Full suite command | Manual checklist against success criteria |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ONB-01 | Skip link on every step saves `_skipped: true` and advances | manual | — | ❌ no test framework |
| ONB-02 | Slider saves float; preloads existing value; "Middle" label visible | manual | — | ❌ |
| ONB-03 | Bartender steps at position 2–4 in wizard | manual | — | ❌ |
| ONB-04 | Comma-parse → chip preview → save to inventory | manual | — | ❌ |
| NAV-01 | Avatar appears in header after config; fallback on error | manual | — | ❌ |
| NAV-02 | Hero image above greeting; collapses on error | manual | — | ❌ |
| NAV-03 | Bjorn avatar in onboarding welcome with caption | manual | — | ❌ |
| NAV-04 | 7-item grid; disabled cards show toast on click | manual | — | ❌ |
| NAV-05 | Gear icon replaces Setup in nav post-config | manual | — | ❌ |
| SETTINGS-01 | Bartender rename + voice preset save to `barkeeper.json` | manual | — | ❌ |
| SETTINGS-02 | GitHub fields save to localStorage; validate on submit | manual | — | ❌ |
| SETTINGS-03 | Logout clears all `bb_*` localStorage keys, redirects to `#setup` | manual | — | ❌ |
| SETTINGS-04 | Two-click reveal; reset writes empty defaults; creds preserved | manual | — | ❌ |
| INV-01 | Search filters chips in real-time, no reload | manual | — | ❌ |
| INV-02 | Category select smooth-scrolls to matching section | manual | — | ❌ |

### Sampling Rate
- **Per task commit:** Serve `app/` locally and smoke-test the specific changed view
- **Per wave merge:** Manual walkthrough of all Phase 2 success criteria
- **Phase gate:** All 5 success criteria from ROADMAP.md Phase 2 pass before `/gsd-verify-work`

### Wave 0 Gaps

No automated test framework exists in this project (`nyquist_validation` is enabled in config but there is no test runner). All validation is manual browser testing.

The planner should include a Wave 0 task to define a manual testing checklist document (`.planning/phases/02-web-ui-ux-and-settings/TEST-CHECKLIST.md`) covering the 5 ROADMAP success criteria, so verification is structured. No framework install is warranted for a vanilla JS SPA with no npm.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | GitHub PAT auth unchanged; no new auth flows |
| V3 Session Management | Partial | Logout clears all `bb_*` localStorage — correct pattern |
| V4 Access Control | No | Single-user app; no role separation |
| V5 Input Validation | Yes | `Utils.escapeHtml()` on all user input inserted via `innerHTML` |
| V6 Cryptography | No | PAT stored in localStorage (existing pattern; no new crypto) |

### Known Threat Patterns for Vanilla JS SPA

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via inventory paste / settings text input | Tampering | `Utils.escapeHtml()` on all values before `innerHTML` insertion — already the pattern throughout the codebase |
| Credential exposure in avatar URL | Information Disclosure | `GitHubAPI.cfg()` returns localStorage values — the PAT is not in the raw GitHub URL (raw.githubusercontent.com URLs are public); no exposure risk |
| CSRF | Not applicable | No server-side session; GitHub PAT in Authorization header; browser fetch only |
| Logout bypass (partial clear) | Elevation of Privilege | Must clear ALL `bb_*` keys, not just known ones; use `Object.keys(localStorage).filter(k => k.startsWith('bb_'))` to enumerate dynamically |

[VERIFIED: github-api.js headers() uses Bearer token in Authorization header; utils.js escapeHtml() verified]

---

## Project Constraints (from CLAUDE.md)

These directives apply to all Phase 2 implementation:

1. **No build step, no npm, no bundler** — serve `app/` directly; no package.json additions
2. **Vanilla ES6+** — no framework, no dependencies
3. **All JS is IIFE modules** — no ES module `import`/`export` syntax
4. **Script order in `index.html` matters** — `settings.js` must be added before `app.js`; core modules (github-api, state, utils) must remain first
5. **Single stylesheet `app/css/app.css`** — all new styles go there; no per-view CSS files
6. **CSS custom properties only** — no hardcoded color values; use `var(--token-name)`
7. **`Utils.escapeHtml()` on all user-supplied values** before `innerHTML` insertion
8. **All reads/writes via `readJSON()`/`writeJSON()`** — no direct fetch calls in views; use `State.save(key)` for writes
9. **Dark amber/bourbon theme** — no light mode, no color scheme changes
10. **Mobile-first** — new styles follow existing responsive patterns; nav text hides at ≤640px

[VERIFIED: CLAUDE.md + CONVENTIONS.md]

---

## Sources

### Primary (HIGH confidence)
- `app/js/views/onboarding.js` — STEPS array, navButtons(), renderAxisStep(), saveAnswers(), render()
- `app/js/views/dashboard.js` — DashboardView structure, isNewUser() usage, menu grid HTML
- `app/js/views/inventory.js` — BOTTLE_SECTIONS, STRING_SECTIONS, renderBottleSection(), data-sectionKey attribute, markDirty()
- `app/js/app.js` — navigate(), updateNav(), hash router switch, bb:reset-data event
- `app/index.html` — nav structure, script order, data-route attributes
- `app/css/app.css` — all design tokens, .axis-slider, .bottle-chip, .menu-item, .wizard-*, .settings-section (new), confirm-dialog
- `app/js/state.js` — get(), patch(), set(), save(), isNewUser(), SHA management
- `app/js/github-api.js` — cfg(), writeJSON() SHA requirement, isConfigured()
- `app/js/utils.js` — escapeHtml(), showToast(), axisToValue(), valueToAxisLabel(), countInventoryItems()
- `app/js/views/setup.js` — SetupView pattern for Settings GitHub section
- `data/bar-owner-profile.json` — current flavor_profile.axes shape (string positions)
- `.planning/phases/02-web-ui-ux-and-settings/02-CONTEXT.md` — 27 locked decisions
- `.planning/phases/02-web-ui-ux-and-settings/02-UI-SPEC.md` — component specs, copywriting contract, design tokens
- `.planning/phases/01-agent-instructions-polish/01-CONTEXT.md` — D-11/D-12 voice presets + specialty focus options
- `.planning/codebase/CONVENTIONS.md` — IIFE pattern, CSS naming, file naming rules
- `images/` directory listing — confirmed all 4 images exist

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` — requirement IDs for this phase (ONB, NAV, SETTINGS, INV)
- `.planning/ROADMAP.md` — Phase 2 success criteria

### Tertiary (LOW confidence)
- `data/barkeeper.json` — not read; schema structure inferred from CONTEXT.md references [A2]

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified from direct file reads; no external dependencies
- Architecture: HIGH — all patterns verified from actual source lines with line references
- Pitfalls: HIGH — all based on verified code paths; SHA pitfall is confirmed by state.js line 55
- CSS tokens: HIGH — read from app/css/app.css `:root` block directly
- Data shapes: HIGH for profile/inventory (files read); MEDIUM for barkeeper.json (not read)

**Research date:** 2026-05-11
**Valid until:** 2026-08-11 (stable vanilla JS codebase; no dependency churn risk)
