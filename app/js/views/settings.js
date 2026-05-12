// Settings page — bartender identity, GitHub config, logout, danger zone.
// Pattern: IIFE module matching setup.js, dashboard.js, inventory.js.

const SettingsView = (() => {

  // ─── Default empty data shapes used by "Reset all data" ──────────────────
  const DEFAULT_PROFILE = {
    identity: {},
    flavor_profile: { axes: {} },
    onboarding_complete: false,
    last_updated: null,
  };
  const DEFAULT_INVENTORY = {
    last_updated: null,
    base_spirits: {},
    pantry: {},
    barware: {},
    unassigned: [],
  };
  const DEFAULT_RECIPES = {
    originals: [],
    favorites: [],
    last_updated: null,
  };
  const DEFAULT_BARKEEPER = {
    identity: { name: 'Barkeeper Bjorn' },
    active_preset: 'Professional Mixologist',
    last_updated: null,
  };

  // ─── Voice preset options (locked by Phase 1 D-11) ───────────────────────
  const VOICE_PRESETS = [
    'Professional Mixologist',
    'Terse & direct',
    'Warm & playful',
    'Theatrical & poetic',
    'Educational & nerdy',
  ];

  // ─── Logout confirmation dialog ───────────────────────────────────────────
  function showLogoutDialog(onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-dialog-overlay';
    overlay.innerHTML = `
      <div class="confirm-dialog">
        <h3>Log out?</h3>
        <p>This will clear all saved credentials and return you to setup. Continue?</p>
        <div class="dialog-btns">
          <button class="btn btn-ghost btn-sm" id="dlg-cancel">Stay logged in</button>
          <button class="btn btn-danger btn-sm" id="dlg-confirm">Log out</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#dlg-cancel').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#dlg-confirm').addEventListener('click', () => {
      overlay.remove();
      onConfirm();
    });
  }

  // ─── Logout action ────────────────────────────────────────────────────────
  function doLogout() {
    // Enumerate all bb_* keys dynamically — never hard-code the list
    Object.keys(localStorage)
      .filter(k => k.startsWith('bb_'))
      .forEach(k => localStorage.removeItem(k));
    window.location.hash = '#setup';
  }

  // ─── Main render ──────────────────────────────────────────────────────────
  function render(container) {
    const barkeeper = State.get('barkeeper') || {};
    const cfg       = GitHubAPI.cfg();
    const bkName    = barkeeper.identity?.name || 'Barkeeper Bjorn';
    const bkPreset  = barkeeper.active_preset  || 'Professional Mixologist';

    container.innerHTML = `
      <div class="page-header">
        <h1>Settings</h1>
        <p>Configure Barkeeper Bjorn and your GitHub connection.</p>
      </div>
      <div class="settings-wrap">

        <!-- ── Section 1: Bartender Identity (SETTINGS-01) ──────────────── -->
        <div class="settings-section" id="sect-identity">
          <div class="settings-section__heading">Bartender Identity</div>
          <div class="form-group">
            <label for="st-bk-name">Bartender Name</label>
            <input type="text" id="st-bk-name"
                   value="${Utils.escapeHtml(bkName)}"
                   placeholder="Barkeeper Bjorn">
          </div>
          <div class="form-group">
            <label for="st-bk-voice">Voice Preset</label>
            <select id="st-bk-voice">
              ${VOICE_PRESETS.map(p =>
                `<option value="${Utils.escapeHtml(p)}"${p === bkPreset ? ' selected' : ''}>${Utils.escapeHtml(p)}</option>`
              ).join('')}
            </select>
          </div>
          <button class="btn btn-primary btn-sm" id="st-save-identity">Update bartender settings</button>
          <p id="st-identity-status" style="min-height:1.2em;margin-top:8px;font-size:0.82rem;"></p>
        </div>

        <!-- ── Section 2: GitHub Connection (SETTINGS-02) ───────────────── -->
        <div class="settings-section" id="sect-github">
          <div class="settings-section__heading">GitHub Connection</div>
          <div class="form-group">
            <label for="st-gh-token">Personal Access Token</label>
            <input type="password" id="st-gh-token"
                   value="${Utils.escapeHtml(cfg.token || '')}"
                   placeholder="ghp_…" autocomplete="off">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="st-gh-owner">Repository Owner</label>
              <input type="text" id="st-gh-owner"
                     value="${Utils.escapeHtml(cfg.owner || '')}"
                     placeholder="your-username">
            </div>
            <div class="form-group">
              <label for="st-gh-repo">Repository Name</label>
              <input type="text" id="st-gh-repo"
                     value="${Utils.escapeHtml(cfg.repo || '')}"
                     placeholder="barkeeper-bjorn-website">
            </div>
          </div>
          <div class="form-group">
            <label for="st-gh-branch">Branch</label>
            <input type="text" id="st-gh-branch"
                   value="${Utils.escapeHtml(cfg.branch || 'main')}"
                   placeholder="main">
          </div>
          <button class="btn btn-primary btn-sm" id="st-save-github">Update GitHub connection</button>
          <p id="st-github-status" style="min-height:1.2em;margin-top:8px;font-size:0.82rem;"></p>
        </div>

        <!-- ── Section 3: Account / Logout (SETTINGS-03) ────────────────── -->
        <div class="settings-section" id="sect-account">
          <div class="settings-section__heading">Account</div>
          <p style="color:var(--text-dim);font-size:0.9rem;margin-bottom:16px;">
            Logging out clears your GitHub credentials from this browser. Your data in GitHub remains intact.
          </p>
          <button class="btn btn-ghost btn-sm" id="st-logout">Log out</button>
        </div>

        <!-- ── Section 4: Danger Zone (SETTINGS-04) ─────────────────────── -->
        <div class="settings-section settings-section--danger" id="sect-danger"
             role="region" aria-label="Danger Zone">
          <div class="settings-section__heading">Danger Zone</div>
          <p style="color:var(--text-dim);font-size:0.9rem;margin-bottom:16px;">
            Destructive actions. These cannot be undone.
          </p>
          <div id="st-reset-state-1">
            <button class="btn btn-ghost btn-sm" id="st-reset-btn">Reset all data</button>
          </div>
          <div id="st-reset-state-2" style="display:none;">
            <p style="color:var(--red);font-size:0.88rem;margin-bottom:12px;">
              This will overwrite your inventory, recipes, profile, and bartender settings with empty defaults.
              Your GitHub credentials are preserved.
            </p>
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
              <button class="btn btn-danger btn-sm" id="st-reset-confirm">Yes, delete everything</button>
              <button class="btn btn-ghost btn-sm" id="st-reset-cancel">Never mind, keep my data</button>
            </div>
          </div>
          <p id="st-reset-status" style="min-height:1.2em;margin-top:8px;font-size:0.82rem;"></p>
        </div>

      </div>`;

    // ── Event: Save bartender identity (SETTINGS-01) ──────────────────────
    container.querySelector('#st-save-identity').addEventListener('click', async () => {
      const name   = container.querySelector('#st-bk-name').value.trim() || 'Barkeeper Bjorn';
      const preset = container.querySelector('#st-bk-voice').value;
      const statusEl = container.querySelector('#st-identity-status');
      statusEl.textContent = 'Saving…';
      statusEl.style.color = 'var(--text-muted)';
      try {
        State.patch('barkeeper', bk => {
          if (!bk.identity) bk.identity = {};
          bk.identity.name = name;
          bk.active_preset = preset;
          bk.last_updated  = Utils.today();
        });
        await State.save('barkeeper', 'Update bartender identity via Settings');
        statusEl.textContent = 'Saved ✓';
        statusEl.style.color = 'var(--green)';
        Utils.showToast('Bartender settings updated.');
      } catch (err) {
        statusEl.textContent = `Save failed: ${Utils.escapeHtml(err.message)}`;
        statusEl.style.color = 'var(--red)';
        Utils.showToast(`Save failed: ${err.message}`, 'error');
      }
    });

    // ── Event: Save GitHub connection (SETTINGS-02) ───────────────────────
    container.querySelector('#st-save-github').addEventListener('click', async () => {
      const token  = container.querySelector('#st-gh-token').value.trim();
      const owner  = container.querySelector('#st-gh-owner').value.trim();
      const repo   = container.querySelector('#st-gh-repo').value.trim();
      const branch = container.querySelector('#st-gh-branch').value.trim() || 'main';
      const statusEl = container.querySelector('#st-github-status');

      if (!token || !owner || !repo) {
        statusEl.textContent = 'Token, owner, and repo are required.';
        statusEl.style.color = 'var(--red)';
        return;
      }

      localStorage.setItem('bb_token',  token);
      localStorage.setItem('bb_owner',  owner);
      localStorage.setItem('bb_repo',   repo);
      localStorage.setItem('bb_branch', branch);

      statusEl.textContent = 'Connecting…';
      statusEl.style.color = 'var(--text-muted)';
      const saveBtn = container.querySelector('#st-save-github');
      saveBtn.disabled = true;

      try {
        await GitHubAPI.validateConfig();
        statusEl.textContent = '✓ Connected';
        statusEl.style.color = 'var(--green)';
        Utils.showToast('GitHub connection updated.');
        // Signal app.js to reset _dataLoaded so data reloads on next navigate
        document.dispatchEvent(new CustomEvent('bb:reset-data'));
      } catch (err) {
        statusEl.textContent = `Connection failed: ${Utils.escapeHtml(err.message)}`;
        statusEl.style.color = 'var(--red)';
        Utils.showToast(`Connection failed: ${err.message}`, 'error');
      } finally {
        saveBtn.disabled = false;
      }
    });

    // ── Event: Logout (SETTINGS-03) ───────────────────────────────────────
    container.querySelector('#st-logout').addEventListener('click', () => {
      showLogoutDialog(doLogout);
    });

    // ── Event: Reset all data — two-click reveal (SETTINGS-04) ───────────
    const state1 = container.querySelector('#st-reset-state-1');
    const state2 = container.querySelector('#st-reset-state-2');
    const resetStatus = container.querySelector('#st-reset-status');

    container.querySelector('#st-reset-btn').addEventListener('click', () => {
      state1.style.display = 'none';
      state2.style.display = '';
    });

    container.querySelector('#st-reset-cancel').addEventListener('click', () => {
      state2.style.display = 'none';
      state1.style.display = '';
      resetStatus.textContent = '';
    });

    container.querySelector('#st-reset-confirm').addEventListener('click', async () => {
      const confirmBtn = container.querySelector('#st-reset-confirm');
      const cancelBtn  = container.querySelector('#st-reset-cancel');
      confirmBtn.disabled = true;
      cancelBtn.disabled  = true;
      resetStatus.textContent = 'Resetting…';
      resetStatus.style.color = 'var(--text-muted)';

      try {
        // Sequential saves — each await completes before the next starts.
        // This preserves SHA tracking in State and avoids 409 conflicts.
        State.set('profile',   Object.assign({}, DEFAULT_PROFILE,   { last_updated: Utils.today() }));
        await State.save('profile',   'Reset all data via Settings');

        State.set('inventory', Object.assign({}, DEFAULT_INVENTORY, { last_updated: Utils.today() }));
        await State.save('inventory', 'Reset all data via Settings');

        State.set('recipes',   Object.assign({}, DEFAULT_RECIPES,   { last_updated: Utils.today() }));
        await State.save('recipes',   'Reset all data via Settings');

        State.set('barkeeper', Object.assign({}, DEFAULT_BARKEEPER, { last_updated: Utils.today() }));
        await State.save('barkeeper', 'Reset all data via Settings');

        resetStatus.textContent = 'All data has been reset.';
        resetStatus.style.color = 'var(--green)';
        Utils.showToast('All data has been reset.');
        setTimeout(() => { window.location.hash = '#dashboard'; }, 1200);
      } catch (err) {
        resetStatus.textContent = `Reset failed: ${Utils.escapeHtml(err.message)}`;
        resetStatus.style.color = 'var(--red)';
        Utils.showToast(`Reset failed: ${err.message}`, 'error');
        confirmBtn.disabled = false;
        cancelBtn.disabled  = false;
      }
    });
  }

  return { render };
})();
