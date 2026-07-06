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
  // v2 pool shape (post chip-unification). The _reclassified_v2_2 +
  // _autosaved_v2_2 flags are pre-set so a fresh-reset file does not
  // re-trigger Normalize.reclassifyExistingPool or the autosave on the
  // next load (there's nothing to migrate from). Drafts no longer live
  // in a separate file — they're status:'draft' entries inside the
  // recipes pool, so resetting recipes also clears drafts.
  const DEFAULT_RECIPES = {
    _schema_version: 2,
    pool: [],
    last_updated: null,
    _reclassified_v2_2: true,
    _autosaved_v2_2: true,
  };
  const DEFAULT_LIBRARY = {
    links: [],
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

  // ─── Chat model options (D-12, AI-SPEC §4 — bare aliases only) ───────────
  const CHAT_MODELS = [
    ['claude-haiku-4-5',  'Haiku (fast/cheap)'],
    ['claude-sonnet-4-6', 'Sonnet (recommended)'],
    ['claude-opus-4-7',   'Opus (max quality)'],
  ];
  const DEFAULT_CHAT_MODEL = 'claude-sonnet-4-6';
  function currentChatModel() {
    const stored = localStorage.getItem('bb_chat_model');
    // L-2 polish: clear stale/unknown IDs (e.g. a date-suffixed pre-Phase-7 alias) and fall back to default
    if (!stored || !CHAT_MODELS.some(([v]) => v === stored)) {
      if (stored) localStorage.removeItem('bb_chat_model');
      return DEFAULT_CHAT_MODEL;
    }
    return stored;
  }

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
          <a href="#bartender-wizard" class="btn btn-secondary btn-sm" style="margin-left:8px;">Full Customization →</a>
          <a href="#onboarding" class="btn btn-ghost btn-sm" style="margin-left:8px;">Review Setup →</a>
          <p id="st-identity-status" class="form-status"></p>
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
          <p id="st-github-status" class="form-status"></p>
        </div>

        <!-- ── Section 3: Account / Logout (SETTINGS-03) ────────────────── -->
        <div class="settings-section" id="sect-account">
          <div class="settings-section__heading">Account</div>
          <p class="section-desc">
            Logging out clears your GitHub credentials from this browser. Your data in GitHub remains intact.
          </p>
          <button class="btn btn-ghost btn-sm" id="st-logout">Log out</button>
        </div>

        <!-- ── Section: AI Integration (D-14) ───────────────────────────── -->
        <div class="settings-section" id="sect-ai-key">
          <div class="settings-section__heading">AI Integration</div>
          <div class="form-group">
            <label for="st-anthropic-key">Anthropic API Key</label>
            <div style="display:flex;gap:8px;align-items:center;">
              <input type="password" id="st-anthropic-key"
                     value="${Utils.escapeHtml(localStorage.getItem('bb_anthropic_key') || '')}"
                     placeholder="sk-ant-…" autocomplete="off" style="flex:1;">
              <button class="btn-icon" id="st-ai-key-toggle" type="button" title="Show/hide key">Show</button>
            </div>
          </div>
          <p class="muted-help mb-3">
            Your Anthropic API key enables the Generate with AI feature on new recipes. Stored only in this browser.
          </p>
          <button class="btn btn-primary btn-sm" id="st-save-ai-key" type="button">Save API key</button>
          <p id="st-ai-key-status" class="form-status"></p>

          <!-- ── SET-05: Model selector (D-12) ───────────────────────────── -->
          <div class="form-group mt-5">
            <label for="st-chat-model">Model</label>
            <select id="st-chat-model">
              ${CHAT_MODELS.map(([value, label]) =>
                `<option value="${Utils.escapeHtml(value)}"${value === currentChatModel() ? ' selected' : ''}>${Utils.escapeHtml(label)}</option>`
              ).join('')}
            </select>
          </div>
          <p class="muted-help">
            Sonnet is the recommended balance of speed, quality, and cost on your key. (per D-12)
          </p>
          <p id="st-chat-model-status" class="form-status"></p>

          <!-- ── AI-09: Call Log panel ──────────────────────────────────── -->
          <div class="settings-section__heading mt-6">AI Call Log</div>
          <p class="muted-help mb-2">
            Most-recent API calls (timestamp, type, model, token usage). Your API key is never logged.
          </p>
          <div id="st-ai-log" style="font-size:0.85rem;margin-bottom:12px;"></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-secondary btn-sm" id="st-ai-log-copy" type="button">Copy raw JSON</button>
            <button class="btn btn-ghost btn-sm" id="st-ai-log-clear" type="button">Clear log</button>
          </div>
        </div>

        <!-- ── Section 5: Export & Import (EXPORT-01–04) ───────────────── -->
        <div class="settings-section" id="sect-export">
          <div class="settings-section__heading">Export & Import</div>
          <p class="section-desc">
            Download your bar data as a portable ZIP bundle or as an AI-context text file,
            or restore from a previous export.
          </p>
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;">
            <button class="btn btn-secondary btn-sm" id="st-export-json">Export All Data (ZIP)</button>
            <button class="btn btn-secondary btn-sm" id="st-export-ai">Export for AI (text)</button>
          </div>
          <div id="st-import-area"></div>

          <!-- ── AI-08 / AI-10: AI Import / Repair sub-panel (D-14) ──────── -->
          <div id="sect-ai-import" style="margin-top:24px;padding-top:16px;border-top:1px solid var(--amber-dim);">
            <div class="settings-section__heading">AI Import / Repair</div>
            <p class="muted-help mb-3">
              Paste legacy bartender notes (markdown) or upload an <code>.md</code> file.
              Claude extracts inventory / profile / recipes / barkeeper sections; each is
              schema-validated and previewed as a diff before any write. Invalid sections
              fail closed — nothing is written until you confirm.
            </p>
            <textarea id="st-ai-import-text" rows="6"
                      placeholder="# My old bar notes&#10;## Inventory&#10;- Bulleit Bourbon&#10;- Plymouth Gin&#10;..."
                      style="width:100%;font-family:monospace;font-size:0.85rem;margin-bottom:8px;"></textarea>
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px;">
              <input type="file" id="st-ai-import-file" accept=".md,.markdown,.txt" style="font-size:0.85rem;">
              <button class="btn btn-primary btn-sm" id="st-ai-import-btn" type="button">Import with Claude</button>
            </div>
            <p id="st-ai-import-status" style="min-height:1.2em;font-size:0.82rem;"></p>
            <div id="st-ai-import-errors" style="font-size:0.85rem;"></div>
          </div>
        </div>

        <!-- ── Section 4: Danger Zone (SETTINGS-04) ─────────────────────── -->
        <div class="settings-section settings-section--danger" id="sect-danger"
             role="region" aria-label="Danger Zone">
          <div class="settings-section__heading">Danger Zone</div>
          <p class="section-desc">
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
          <p id="st-reset-status" class="form-status"></p>
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

    // ── Event: AI Integration section (D-14) ─────────────────────────────
    container.querySelector('#st-ai-key-toggle').addEventListener('click', () => {
      const inp = container.querySelector('#st-anthropic-key');
      const btn = container.querySelector('#st-ai-key-toggle');
      if (inp.type === 'password') {
        inp.type = 'text';
        btn.textContent = 'Hide';
      } else {
        inp.type = 'password';
        btn.textContent = 'Show';
      }
    });

    container.querySelector('#st-save-ai-key').addEventListener('click', () => {
      const key = container.querySelector('#st-anthropic-key').value.trim();
      const statusEl = container.querySelector('#st-ai-key-status');
      if (key) {
        localStorage.setItem('bb_anthropic_key', key);
        statusEl.textContent = 'Saved ✓';
        statusEl.style.color = 'var(--green)';
        Utils.showToast('Anthropic API key saved.');
      } else {
        localStorage.removeItem('bb_anthropic_key');
        statusEl.textContent = 'Cleared';
        statusEl.style.color = 'var(--text-muted)';
        Utils.showToast('Anthropic API key cleared.');
      }
    });

    // ── Event: SET-05 Model selector (D-12) ──────────────────────────────
    container.querySelector('#st-chat-model').addEventListener('change', (e) => {
      const value = e.target.value;
      const statusEl = container.querySelector('#st-chat-model-status');
      localStorage.setItem('bb_chat_model', value);
      statusEl.textContent = 'Model saved ✓';
      statusEl.style.color = 'var(--green)';
      Utils.showToast('Chat model updated.');
    });

    // ── AI-09: Call Log panel render + handlers ──────────────────────────
    function renderAiLog(panel) {
      let log = [];
      try {
        const raw = localStorage.getItem('bb_api_log');
        log = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(log)) log = [];
      } catch (_err) {
        log = [];
      }
      if (log.length === 0) {
        panel.innerHTML = `<p style="color:var(--text-dim);font-style:italic;">No API calls logged yet.</p>`;
        return;
      }
      // Newest-first; escape EVERY interpolated value before innerHTML (T-07-08 / Security V10).
      const rows = [...log].reverse().map(entry => {
        const tsRaw = entry && entry.ts;
        let tsStr = '';
        try { tsStr = tsRaw ? new Date(tsRaw).toLocaleString() : '—'; }
        catch (_e) { tsStr = String(tsRaw || '—'); }
        const type  = entry && entry.type  ? String(entry.type)  : '—';
        const model = entry && entry.model ? String(entry.model) : '—';
        const u = (entry && entry.usage) || {};
        const inTok    = u.input_tokens ?? 0;
        const outTok   = u.output_tokens ?? 0;
        const cacheRd  = u.cache_read_input_tokens ?? 0;
        const cacheCr  = u.cache_creation_input_tokens ?? 0;
        const usageStr = `in ${inTok} / out ${outTok} / cache_read ${cacheRd} / cache_create ${cacheCr}`;
        return `<div style="padding:6px 0;border-bottom:1px solid var(--border,#333);">
          <div style="color:var(--text-dim);font-size:0.78rem;">${Utils.escapeHtml(tsStr)}</div>
          <div><strong>${Utils.escapeHtml(type)}</strong> · ${Utils.escapeHtml(model)}</div>
          <div style="color:var(--text-muted);font-size:0.8rem;">${Utils.escapeHtml(usageStr)}</div>
        </div>`;
      }).join('');
      panel.innerHTML = rows;
    }

    const aiLogPanel = container.querySelector('#st-ai-log');
    renderAiLog(aiLogPanel);

    container.querySelector('#st-ai-log-copy').addEventListener('click', async () => {
      const raw = localStorage.getItem('bb_api_log') || '[]';
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(raw);
          Utils.showToast('Call log copied.');
        } else {
          Utils.showToast('Clipboard unavailable — copy manually from devtools.', 'error');
        }
      } catch (err) {
        Utils.showToast(`Copy failed: ${err.message}`, 'error');
      }
    });

    container.querySelector('#st-ai-log-clear').addEventListener('click', () => {
      localStorage.removeItem('bb_api_log');
      renderAiLog(aiLogPanel);
      Utils.showToast('Call log cleared.');
    });

    // ── Event: Export / Import (EXPORT-01–04) ────────────────────────────
    container.querySelector('#st-export-json').addEventListener('click', () => {
      DataExport.exportJSON().catch(err => Utils.showToast(err.message, 'error'));
    });
    container.querySelector('#st-export-ai').addEventListener('click', () => {
      DataExport.exportAIContext();
    });
    DataExport.renderImportUI(container.querySelector('#st-import-area'));

    // ── AI-08 / AI-10: Import-legacy-markdown + repair handlers ──────────
    // Schema keys this importer recognizes (mirrors Normalize.byKey dispatch).
    const AI_IMPORT_KEYS = ['inventory', 'profile', 'recipes', 'barkeeper'];

    // Friendly labels used in the diff dialog and status messages.
    const AI_IMPORT_LABELS = {
      inventory: 'inventory',
      profile:   'profile',
      recipes:   'recipes',
      barkeeper: 'barkeeper',
    };

    // AI-10: repair a single broken section, then route through WriteGate.
    // Fail-closed: if requestJSON still cannot produce a valid payload after
    // its single retry it throws — we surface the error and write nothing.
    async function repairSection(schemaKey, brokenObj, errors) {
      const statusEl  = container.querySelector('#st-ai-import-status');
      const errorsEl  = container.querySelector('#st-ai-import-errors');
      try {
        if (statusEl) {
          statusEl.textContent = `Asking Claude to repair ${AI_IMPORT_LABELS[schemaKey] || schemaKey}…`;
          statusEl.style.color = 'var(--text-muted)';
        }
        const fixed = await ClaudeAPI.requestJSON({
          system:    `Repair this JSON so it matches the ${schemaKey} schema. JSON only — no prose.`,
          userPrompt: JSON.stringify(brokenObj) + '\nErrors: ' + (errors || []).join('; '),
          schemaKey,
          model:     ClaudeAPI.getModel(),
          maxTokens: 4096,
        });
        const result = await WriteGate.gate({
          schemaKey,
          oldData:    State.get(schemaKey),
          newPayload: fixed,
          message:    `Repair ${schemaKey} (AI)`,
          onConfirm:  async () => {
            State.set(schemaKey, fixed);
            await State.save(schemaKey, `AI repair: ${schemaKey} via Settings`);
          },
        });
        if (statusEl) {
          if (result.status === 'confirmed') {
            statusEl.textContent = `Repaired ${schemaKey} ✓`;
            statusEl.style.color = 'var(--green)';
          } else if (result.status === 'invalid') {
            // requestJSON validated already — only possible if WriteGate disagreed.
            statusEl.textContent = `Repair still invalid for ${schemaKey} — fail-closed, nothing written.`;
            statusEl.style.color = 'var(--red)';
          } else {
            statusEl.textContent = `Repair cancelled for ${schemaKey}.`;
            statusEl.style.color = 'var(--text-muted)';
          }
        }
      } catch (err) {
        // Fail-closed: surface the error, write nothing. Escape model-derived text.
        if (statusEl) {
          statusEl.textContent = `Repair failed for ${schemaKey} — fail-closed, nothing written.`;
          statusEl.style.color = 'var(--red)';
        }
        if (errorsEl) {
          errorsEl.innerHTML +=
            `<div style="color:var(--red);margin-top:6px;">Repair error (${Utils.escapeHtml(schemaKey)}): ${Utils.escapeHtml(err && err.message ? err.message : String(err))}</div>`;
        }
      }
    }

    // AI-08: ONE Claude call extracts whatever sections are present in the
    // legacy markdown blob (NOT a per-schema loop — Pitfall 6 cost trap).
    // Each present section is then Normalized + validated + diff-confirmed
    // (sequential — Pitfall 4). Invalid sections offer AI-10 repair; the
    // schema-validate / WriteGate pipeline is the only path to a write.
    async function importLegacy(mdText) {
      const statusEl = container.querySelector('#st-ai-import-status');
      const errorsEl = container.querySelector('#st-ai-import-errors');
      if (errorsEl) errorsEl.innerHTML = '';
      if (!mdText || !mdText.trim()) {
        if (statusEl) {
          statusEl.textContent = 'Paste some markdown notes or upload a file first.';
          statusEl.style.color = 'var(--red)';
        }
        return;
      }
      if (!ClaudeAPI.getKey()) {
        if (statusEl) {
          statusEl.textContent = 'No Anthropic API key configured. Add one above first.';
          statusEl.style.color = 'var(--red)';
        }
        return;
      }
      if (statusEl) {
        statusEl.textContent = 'Asking Claude to extract sections…';
        statusEl.style.color = 'var(--text-muted)';
      }
      let bundle;
      try {
        const text = await ClaudeAPI.callMessages({
          model:      ClaudeAPI.getModel(),
          max_tokens: 4096,
          system: 'Extract any of the four sections present in legacy bartender notes: inventory, profile, recipes, barkeeper. Return ONE JSON object whose keys are ONLY the sections present (omit keys whose sections are absent). JSON only — no prose.',
          messages: [{ role: 'user', content: mdText }],
        });
        bundle = ClaudeAPI.extractJSON(text);
      } catch (err) {
        if (statusEl) {
          statusEl.textContent = `Import failed — fail-closed, nothing written.`;
          statusEl.style.color = 'var(--red)';
        }
        if (errorsEl) {
          errorsEl.innerHTML =
            `<div style="color:var(--red);">Extract error: ${Utils.escapeHtml(err && err.message ? err.message : String(err))}</div>`;
        }
        return;
      }
      if (!bundle || typeof bundle !== 'object' || Array.isArray(bundle)) {
        if (statusEl) {
          statusEl.textContent = 'Claude did not return a JSON object — fail-closed, nothing written.';
          statusEl.style.color = 'var(--red)';
        }
        return;
      }
      const present = Object.keys(bundle).filter(k => AI_IMPORT_KEYS.includes(k));
      if (present.length === 0) {
        if (statusEl) {
          statusEl.textContent = 'No recognized sections found in the notes.';
          statusEl.style.color = 'var(--text-muted)';
        }
        return;
      }
      if (statusEl) {
        statusEl.textContent = `Found sections: ${present.join(', ')}. Validating…`;
        statusEl.style.color = 'var(--text-muted)';
      }
      // Sequential per-section processing — Pitfall 4 (no parallel State.save).
      let writtenCount = 0;
      for (const key of present) {
        const raw  = bundle[key];
        const norm = Normalize.byKey(key, raw);
        const errs = await WriteGate.validate(key, norm);
        if (errs && errs.length) {
          // Fail-closed — never write. Offer AI-10 repair.
          if (errorsEl) {
            const wrap = document.createElement('div');
            wrap.style.cssText = 'margin-top:8px;padding:8px;border:1px solid var(--red);border-radius:4px;';
            // Show up to 3 error strings to keep the panel readable.
            const errPreview = errs.slice(0, 3).map(e => Utils.escapeHtml(e)).join('<br>');
            wrap.innerHTML = `
              <div style="color:var(--red);font-weight:600;margin-bottom:4px;">${Utils.escapeHtml(key)} — validation failed (not written)</div>
              <div style="color:var(--text-dim);font-size:0.82rem;margin-bottom:6px;">${errPreview}</div>
              <button type="button" class="btn btn-secondary btn-sm" data-repair="${Utils.escapeHtml(key)}">Ask Claude to repair this</button>`;
            wrap.querySelector('button[data-repair]').addEventListener('click', () => {
              repairSection(key, raw, errs);
            });
            errorsEl.appendChild(wrap);
          }
          continue;
        }
        // Valid → diff/confirm/write through the gate.
        const result = await WriteGate.gate({
          schemaKey:  key,
          oldData:    State.get(key),
          newPayload: norm,
          message:    `Import ${key} from notes`,
          onConfirm:  async () => {
            State.set(key, norm);
            await State.save(key, `AI import: ${key} from legacy notes`);
          },
        });
        if (result.status === 'confirmed') writtenCount++;
      }
      if (statusEl) {
        if (writtenCount > 0) {
          statusEl.textContent = `Imported ${writtenCount} section(s) ✓`;
          statusEl.style.color = 'var(--green)';
        } else {
          statusEl.textContent = 'Import complete — nothing written (cancelled or invalid).';
          statusEl.style.color = 'var(--text-muted)';
        }
      }
    }

    // File picker: read uploaded .md/.txt into the textarea.
    const importFileEl = container.querySelector('#st-ai-import-file');
    if (importFileEl) {
      importFileEl.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const textareaEl = container.querySelector('#st-ai-import-text');
          if (textareaEl) textareaEl.value = String(reader.result || '');
        };
        reader.onerror = () => Utils.showToast('Failed to read file: ' + (reader.error && reader.error.message), 'error');
        reader.readAsText(file);
      });
    }

    const importBtn = container.querySelector('#st-ai-import-btn');
    if (importBtn) {
      importBtn.addEventListener('click', async () => {
        importBtn.disabled = true;
        try {
          const textareaEl = container.querySelector('#st-ai-import-text');
          await importLegacy(textareaEl ? textareaEl.value : '');
        } finally {
          importBtn.disabled = false;
        }
      });
    }

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

        // Reset library (6th State file added in Phase 7). Sequential save
        // per Pitfall 4. Drafts no longer have their own file post chip-
        // unification — they live as status:'draft' entries in recipes.pool,
        // which we already reset above.
        State.set('library', Object.assign({}, DEFAULT_LIBRARY, { last_updated: Utils.today() }));
        await State.save('library', 'Reset all data via Settings');

        // Phase-7 AI-side localStorage sweep — Test 1 UAT correction:
        //   * bb_chat_model is a UI PREFERENCE (which model the user picked),
        //     NOT data. Preserve it across Reset, same as dark-mode would be
        //     preserved. (Previously cleared; user flagged this as wrong.)
        //   * bb_chat_history IS user data (the persisted chat thread).
        //     CLEAR it. (Previously NOT cleared; user flagged this as a
        //     gap — chat thread survived a "reset all data".)
        //   * bb_api_log is audit/debug data — clear (unchanged).
        // GitHub credentials (bb_token / bb_owner / bb_repo / bb_branch) and
        // bb_anthropic_key remain preserved.
        localStorage.removeItem('bb_chat_history');
        localStorage.removeItem('bb_api_log');
        localStorage.removeItem('bb_parse_cache');
        localStorage.removeItem('bb_derivation_cache');

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
