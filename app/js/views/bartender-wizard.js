// Bartender Customization Wizard — full persona editor at #bartender-wizard.
// Accessible via Settings → Bartender section "Full Customization →" link (D-32).
// Saves to barkeeper.json via State (key: barkeeper).
// Avatar upload: FileReader → base64 → getFileSHA → writeFile via GitHubAPI (NOT uploadImage).

const BartenderWizardView = (() => {

  let _dirty = false;
  let _selectedAvatarFile = null;
  let _containerRef = null;

  // Voice presets — re-declared for IIFE isolation. KEEP IN SYNC with settings.js VOICE_PRESETS.
  const VOICE_PRESETS = [
    'Professional Mixologist',
    'Terse & direct',
    'Warm & playful',
    'Theatrical & poetic',
    'Educational & nerdy',
  ];

  const NAMING_STYLES = ['', 'Classic', 'Playful', 'Inventive'];

  // ─── Dirty tracking + save bar ───────────────────────────────────────────

  function markDirty() {
    _dirty = true;
    const bar = document.getElementById('bw-save-bar');
    if (bar) bar.style.display = 'flex';
  }

  async function save() {
    try {
      State.patch('barkeeper', bk => {
        bk.last_updated = Utils.today();
      });
      await State.save('barkeeper', 'Update bartender via wizard');
      _dirty = false;
      const bar = document.getElementById('bw-save-bar');
      if (bar) bar.style.display = 'none';
      Utils.showToast('Bartender saved to GitHub ✓');
    } catch (err) {
      Utils.showToast('Save failed: ' + err.message, 'error');
    }
  }

  function discard() {
    _dirty = false;
    Utils.showToast('Changes discarded', 'info');
    render(_containerRef);  // re-render from State (still holds last loaded values)
  }

  // ─── Behavioral rules section ────────────────────────────────────────────

  function renderBehavioralRules(bk) {
    const rules = Array.isArray(bk.behavioral_rules) ? bk.behavioral_rules : [];
    return `
      <div class="settings-section">
        <div class="settings-section__heading">Behavioral Rules</div>
        <p style="color:var(--text-dim);font-size:0.9rem;margin-bottom:12px;">
          Examples: "Always suggest a garnish", "Prefer classic recipes over modern twists", "Keep explanations brief".
        </p>
        <div class="form-group" style="display:flex;gap:8px;">
          <input type="text" id="bw-rule-input" placeholder="Add a behavioral rule…" style="flex:1;">
          <button class="btn btn-secondary btn-sm" id="bw-rule-add">+ Add</button>
        </div>
        <ul id="bw-rules-list" style="list-style:none;padding:0;margin:8px 0 0;">
          ${rules.map((r, i) => `
            <li style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);">
              <span style="flex:1;">${Utils.escapeHtml(r)}</span>
              <button class="btn btn-ghost btn-sm bw-rule-remove" data-idx="${i}" title="Remove">×</button>
            </li>`).join('')}
        </ul>
      </div>`;
  }

  function wireBehavioralRules() {
    const input = document.getElementById('bw-rule-input');
    const addBtn = document.getElementById('bw-rule-add');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const v = (input ? input.value : '').trim();
        if (!v) return;
        State.patch('barkeeper', bk => {
          if (!Array.isArray(bk.behavioral_rules)) bk.behavioral_rules = [];
          bk.behavioral_rules.push(v);
        });
        markDirty();
        render(_containerRef);
      });
    }
    document.querySelectorAll('.bw-rule-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.idx);
        State.patch('barkeeper', bk => {
          if (Array.isArray(bk.behavioral_rules)) bk.behavioral_rules.splice(idx, 1);
        });
        markDirty();
        render(_containerRef);
      });
    });
  }

  // ─── Avatar file upload ───────────────────────────────────────────────────
  // Uses getFileSHA + writeFile from GitHubAPI — NOT the non-existent uploadImage method.

  async function handleAvatarUpload() {
    if (!_selectedAvatarFile) {
      Utils.showToast('Choose a file first', 'info');
      return;
    }
    const uploadBtn = document.getElementById('bw-avatar-upload');
    if (uploadBtn) uploadBtn.disabled = true;
    try {
      const ext = _selectedAvatarFile.name.split('.').pop().toLowerCase();
      const filename = 'barkeeper_avatar_' + Date.now() + '.' + ext;
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(_selectedAvatarFile);
      });
      const path = 'images/' + filename;
      const sha = await GitHubAPI.getFileSHA(path);
      await GitHubAPI.writeFile(path, base64, sha, 'Upload bartender avatar');
      const cfg = GitHubAPI.cfg();
      const url = 'https://raw.githubusercontent.com/' + cfg.owner + '/' + cfg.repo + '/' + cfg.branch + '/' + path;
      const urlInput = document.getElementById('bw-avatar-url');
      if (urlInput) urlInput.value = url;
      State.patch('barkeeper', bk => { bk.avatar_url = url; });
      markDirty();
      Utils.showToast('Avatar uploaded ✓');
    } catch (err) {
      Utils.showToast('Upload failed: ' + err.message, 'error');
    } finally {
      if (uploadBtn) uploadBtn.disabled = false;
    }
  }

  // ─── Main render ──────────────────────────────────────────────────────────

  function render(container) {
    _containerRef = container;
    const bk = State.get('barkeeper') || {};
    const id = bk.identity || {};
    const bkName    = id.name || '';
    const bkPreset  = bk.active_preset || '';

    container.innerHTML = `
      <div class="view-bartender-wizard">
        <div class="page-header">
          <h1>Bartender Customization</h1>
          <p>Full persona configuration for ${Utils.escapeHtml(bkName || 'your bartender')}. Saves to barkeeper.json.</p>
        </div>

        <div id="bw-save-bar" style="display:none;position:sticky;top:60px;z-index:50;
             background:var(--bg);border-bottom:1px solid var(--amber-dim);padding:10px 16px;
             align-items:center;gap:12px;margin-bottom:16px;">
          <span style="color:var(--amber);font-size:0.88rem;">Unsaved changes</span>
          <button class="btn btn-primary btn-sm" id="bw-save-btn">Save to GitHub</button>
          <button class="btn btn-ghost btn-sm" id="bw-discard-btn">Discard</button>
        </div>

        <div class="settings-wrap">

          <!-- ── Identity ──────────────────────────────────────────────── -->
          <div class="settings-section" id="bw-sect-identity">
            <div class="settings-section__heading">Identity</div>
            <div class="form-group">
              <label for="bw-name">Bartender Name</label>
              <input type="text" id="bw-name" value="${Utils.escapeHtml(bkName)}"
                     placeholder="Barkeeper Bjorn">
            </div>
          </div>

          <!-- ── Avatar ────────────────────────────────────────────────── -->
          <div class="settings-section" id="bw-sect-avatar">
            <div class="settings-section__heading">Avatar</div>
            <div class="form-group">
              <label for="bw-avatar-url">Avatar URL</label>
              <input type="text" id="bw-avatar-url" placeholder="https://…"
                value="${Utils.escapeHtml(bk.avatar_url || '')}">
              <p style="font-size:0.82rem;color:var(--text-dim);margin-top:4px;">
                Paste a direct image URL, or upload a file below (last write wins).
              </p>
            </div>
            <div class="form-group" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
              <input type="file" id="bw-avatar-file" accept="image/*" style="flex:1;min-width:0;">
              <button class="btn btn-secondary btn-sm" id="bw-avatar-upload">Upload from file</button>
            </div>
            ${bk.avatar_url
              ? `<img src="${Utils.escapeHtml(bk.avatar_url)}" alt="Avatar preview"
                      style="max-height:120px;border-radius:8px;margin-top:8px;display:block;">`
              : ''}
          </div>

          <!-- ── Voice preset ──────────────────────────────────────────── -->
          <div class="settings-section" id="bw-sect-voice">
            <div class="settings-section__heading">Voice Preset</div>
            <div class="form-group">
              <label for="bw-voice">Preset</label>
              <select id="bw-voice">
                <option value="">— Select a preset —</option>
                ${VOICE_PRESETS.map(v =>
                  `<option value="${Utils.escapeHtml(v)}"${bkPreset === v ? ' selected' : ''}>${Utils.escapeHtml(v)}</option>`
                ).join('')}
              </select>
            </div>
          </div>

          <!-- ── Specialty ────────────────────────────────────────────── -->
          <div class="settings-section" id="bw-sect-specialty">
            <div class="settings-section__heading">Specialty Focus</div>
            <div class="form-group">
              <label for="bw-specialty">Bartender specialty</label>
              <select id="bw-specialty">
                ${[
                  'No preference (broad and balanced)',
                  'Classic cocktails',
                  'Craft & artisanal',
                  'Tropical & tiki drinks',
                  'Avant-garde / experimental',
                  'Contemporary & trendy',
                  'Low-ABV & wellness',
                  'Whiskey & brown spirits',
                  'Brandy & cognac',
                  'Wine & spirits education',
                ].map(s => `<option value="${Utils.escapeHtml(s)}"${(bk.personality?.specialty === s) ? ' selected' : ''}>${Utils.escapeHtml(s)}</option>`).join('')}
              </select>
              <p style="font-size:0.82rem;color:var(--text-dim);margin-top:4px;">
                Boosts matching recipes in the Recommender by up to 18%.
              </p>
            </div>
          </div>

          <!-- ── Personality ───────────────────────────────────────────── -->
          <div class="settings-section" id="bw-sect-personality">
            <div class="settings-section__heading">Personality</div>
            <div class="form-group">
              <label for="bw-personality">Long-form personality description</label>
              <textarea id="bw-personality" rows="5"
                placeholder="A few sentences about how this bartender thinks, jokes, and reacts.">${Utils.escapeHtml(bk.personality_description || '')}</textarea>
            </div>
          </div>

          <!-- ── Behavioral Rules ──────────────────────────────────────── -->
          ${renderBehavioralRules(bk)}

          <!-- ── Style ────────────────────────────────────────────────── -->
          <div class="settings-section" id="bw-sect-style">
            <div class="settings-section__heading">Style</div>
            <div class="form-group">
              <label for="bw-naming">Cocktail naming style</label>
              <select id="bw-naming">
                ${NAMING_STYLES.map(s =>
                  `<option value="${Utils.escapeHtml(s)}"${bk.cocktail_naming_style === s ? ' selected' : ''}>${s || '—'}</option>`
                ).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="bw-imgstyle">Image generation style preferences</label>
              <textarea id="bw-imgstyle" rows="3"
                placeholder="e.g. photorealistic, warm amber lighting, dark backdrop">${Utils.escapeHtml(bk.image_gen_style || '')}</textarea>
            </div>
            <div class="form-group">
              <label for="bw-signoff">Signature signoff</label>
              <input type="text" id="bw-signoff" placeholder="Slainte!"
                     value="${Utils.escapeHtml(bk.signoff || '')}">
            </div>
          </div>

        </div>
      </div>`;

    // ── Wire field handlers ─────────────────────────────────────────────────

    document.getElementById('bw-name')?.addEventListener('input', e => {
      State.patch('barkeeper', bk2 => {
        if (!bk2.identity) bk2.identity = {};
        bk2.identity.name = e.target.value;
      });
      markDirty();
    });

    document.getElementById('bw-avatar-url')?.addEventListener('input', e => {
      State.patch('barkeeper', bk2 => { bk2.avatar_url = e.target.value; });
      markDirty();
    });

    document.getElementById('bw-avatar-file')?.addEventListener('change', e => {
      _selectedAvatarFile = e.target.files[0] || null;
    });

    document.getElementById('bw-avatar-upload')?.addEventListener('click', handleAvatarUpload);

    document.getElementById('bw-voice')?.addEventListener('change', e => {
      State.patch('barkeeper', bk2 => { bk2.active_preset = e.target.value; });
      markDirty();
    });

    document.getElementById('bw-personality')?.addEventListener('input', e => {
      State.patch('barkeeper', bk2 => { bk2.personality_description = e.target.value; });
      markDirty();
    });

    document.getElementById('bw-naming')?.addEventListener('change', e => {
      State.patch('barkeeper', bk2 => { bk2.cocktail_naming_style = e.target.value; });
      markDirty();
    });

    document.getElementById('bw-imgstyle')?.addEventListener('input', e => {
      State.patch('barkeeper', bk2 => { bk2.image_gen_style = e.target.value; });
      markDirty();
    });

    document.getElementById('bw-specialty')?.addEventListener('change', e => {
      State.patch('barkeeper', bk2 => {
        if (!bk2.personality) bk2.personality = {};
        bk2.personality.specialty = e.target.value;
      });
      markDirty();
    });

    document.getElementById('bw-signoff')?.addEventListener('input', e => {
      State.patch('barkeeper', bk2 => { bk2.signoff = e.target.value; });
      markDirty();
    });

    // ── Save bar ────────────────────────────────────────────────────────────
    document.getElementById('bw-save-btn')?.addEventListener('click', save);
    document.getElementById('bw-discard-btn')?.addEventListener('click', discard);

    // ── Behavioral rules add/remove ─────────────────────────────────────────
    wireBehavioralRules();
  }

  return { render };

})();
