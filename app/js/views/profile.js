// Profile Dashboard — flavor axes (with interactive radar chart) + identity + archetypes.

const ProfileView = (() => {

  const AXES = [
    { key: 'sweetness',  labelA: 'Dry',             labelB: 'Sweet / Rounded' },
    { key: 'acid',       labelA: 'Soft / Low Acid',  labelB: 'Sharp Citrus' },
    { key: 'strength',   labelA: 'Spirit-Forward',   labelB: 'Refreshment-Forward' },
    { key: 'complexity', labelA: 'Clean & Direct',   labelB: 'Layered & Brooding' },
    { key: 'season',     labelA: 'Year-Round Bright',labelB: 'Seasonal / Cozy' },
    { key: 'risk',       labelA: 'Classic / Reliable',labelB: 'Adventurous' },
  ];

  // Axis values for radar: array of 0..1 indexed same as AXES
  let _values = AXES.map(() => null);
  let _dirty = false;
  let _inventoryDirty = false;

  function render(container) {
    const profile  = State.get('profile') || {};
    const axes     = profile.flavor_profile?.axes || {};
    const identity = profile.identity || {};
    const archetypes = profile.archetypes || [];

    _dirty = false;

    // Read current axis values
    _values = AXES.map(a => {
      const axisData = axes[a.key];
      return Utils.axisToValue(axisData?.position);
    });

    container.innerHTML = `
      <div class="page-header">
        <h1>Flavor Profile</h1>
        <p>Your six-axis taste map — updated by your bartender after each session.</p>
      </div>

      <div id="profile-save-bar" style="display:none;position:sticky;top:60px;z-index:50;
           background:var(--bg);border-bottom:1px solid var(--amber-dim);padding:10px 0;
           align-items:center;gap:12px;margin-bottom:16px;">
        <span style="color:var(--amber);font-size:0.88rem;">Unsaved changes</span>
        <button class="btn btn-primary btn-sm" id="profile-save-btn">Save to GitHub</button>
        <button class="btn btn-ghost btn-sm" id="profile-discard-btn">Discard</button>
      </div>

      <div class="profile-flavor-grid">
        <!-- Left/Top: Radar chart -->
        <div>
          <h2>Flavor Radar</h2>
          <div class="radar-container">
            <div id="radar-svg-wrap"></div>
          </div>
        </div>

        <!-- Right/Bottom: Axis sliders -->
        <div>
          <h2>Adjust Axes</h2>
          <div id="axis-controls"></div>
        </div>
      </div>

      <div class="divider"></div>

      <div class="profile-flavor-grid">
        <!-- Supplemental -->
        <div>
          <h2>Supplemental Preferences</h2>
          <div id="supplemental-controls"></div>
        </div>

        <!-- Archetypes & identity -->
        <div>
          <h2>Profile at a Glance</h2>
          <div id="profile-summary"></div>
        </div>
      </div>

      <div class="divider"></div>

      <h2>Identity & Background</h2>
      <div id="identity-section"></div>

      ${profile.evolution_log?.length ? `
        <div class="divider"></div>
        <h2>Evolution Log</h2>
        <div id="evo-log"></div>` : ''}

      <div class="divider"></div>
      <div id="drinking-style-section"></div>`;

    document.getElementById('profile-save-btn')?.addEventListener('click', saveProfile);
    document.getElementById('profile-discard-btn')?.addEventListener('click', () => {
      _dirty = false;
      render(container);
    });

    drawRadar();
    renderAxisControls(axes, profile, container);
    renderSupplemental(profile, container);
    renderProfileSummary(identity, archetypes, profile, container);
    renderIdentitySection(identity, profile, container);
    if (profile.evolution_log?.length) renderEvoLog(profile.evolution_log, container);
    renderDrinkingStyle(profile, container);
  }

  const ARCHETYPES = [
    { name: 'The Minimalist',   description: 'Clean, simple, essential' },
    { name: 'The Experimenter', description: 'Loves to try new things' },
    { name: 'The Host',        description: 'Drinks for the crowd' },
    { name: 'The Purist',      description: 'Respects tradition and craft' },
    { name: 'The Adventurer',  description: 'Bold, unexpected combinations' },
    { name: 'The Classicist',  description: 'Sticks to the canon' },
  ];

  // ─── Radar Chart (SVG hexagon) ───────────────────────────────────

  function drawRadar() {
    const wrap = document.getElementById('radar-svg-wrap');
    if (!wrap) return;

    const CX = 160, CY = 160, R = 120;
    const n = AXES.length;
    const step = (2 * Math.PI) / n;
    const startAngle = -Math.PI / 2;

    // Generate polygon points for a value 0..1
    function points(values, radius) {
      return values.map((v, i) => {
        const angle = startAngle + i * step;
        const r = radius * (v ?? 0.5);
        return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)];
      });
    }

    function ptStr(pts) {
      return pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ');
    }

    // Background grid rings
    const rings = [0.25, 0.5, 0.75, 1.0];
    const gridLines = rings.map(r => {
      const pts = AXES.map((_, i) => {
        const angle = startAngle + i * step;
        return [CX + R * r * Math.cos(angle), CY + R * r * Math.sin(angle)];
      });
      return `<polygon points="${ptStr(pts)}" fill="none" stroke="var(--border)" stroke-width="1"/>`;
    }).join('\n');

    // Axis lines from center
    const axisLines = AXES.map((_, i) => {
      const angle = startAngle + i * step;
      const x2 = CX + R * Math.cos(angle);
      const y2 = CY + R * Math.sin(angle);
      return `<line x1="${CX}" y1="${CY}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="var(--border)" stroke-width="1"/>`;
    }).join('\n');

    // Axis labels
    const labelOffset = 20;
    const axisLabels = AXES.map((a, i) => {
      const angle = startAngle + i * step;
      const lx = CX + (R + labelOffset) * Math.cos(angle);
      const ly = CY + (R + labelOffset) * Math.sin(angle);
      const anchor = Math.cos(angle) > 0.1 ? 'start' : Math.cos(angle) < -0.1 ? 'end' : 'middle';
      const shortLabel = a.key.charAt(0).toUpperCase() + a.key.slice(1);
      return `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anchor}"
                    fill="var(--text-dim)" font-size="11" font-family="Georgia, serif"
                    dominant-baseline="middle">${shortLabel}</text>`;
    }).join('\n');

    // Data polygon
    const dataPts = points(_values.map(v => v ?? 0.5), R);
    const dataPolygon = `
      <polygon points="${ptStr(dataPts)}"
               fill="rgba(212,148,58,0.15)" stroke="var(--amber)" stroke-width="2"
               id="radar-data-polygon"/>`;

    // Data point dots
    const dots = dataPts.map((p, i) => {
      const hasData = _values[i] !== null;
      return `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="5"
                      fill="${hasData ? 'var(--amber)' : 'var(--border2)'}"
                      stroke="var(--bg)" stroke-width="2"/>`;
    }).join('\n');

    const svg = `
      <svg width="${CX * 2}" height="${CY * 2}" class="radar-svg" viewBox="0 0 ${CX*2} ${CY*2}">
        ${gridLines}
        ${axisLines}
        ${dataPolygon}
        ${dots}
        ${axisLabels}
      </svg>`;

    wrap.innerHTML = svg;
  }

  function updateRadarPolygon() {
    const CX = 160, CY = 160, R = 120;
    const n = AXES.length;
    const step = (2 * Math.PI) / n;
    const startAngle = -Math.PI / 2;

    const pts = _values.map((v, i) => {
      const angle = startAngle + i * step;
      const r = R * (v ?? 0.5);
      return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)];
    });

    const ptStr = pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ');
    const poly = document.getElementById('radar-data-polygon');
    if (poly) poly.setAttribute('points', ptStr);

    // Update dots
    const dots = document.querySelectorAll('.radar-dot');
    dots.forEach((dot, i) => {
      dot.setAttribute('cx', pts[i][0].toFixed(1));
      dot.setAttribute('cy', pts[i][1].toFixed(1));
      dot.setAttribute('fill', _values[i] !== null ? 'var(--amber)' : 'var(--border2)');
    });
  }

  // ─── Axis Controls ───────────────────────────────────────────────

  function renderAxisControls(axes, profile, container) {
    const ctrl = container.querySelector('#axis-controls');
    if (!ctrl) return;
    ctrl.innerHTML = '';

    AXES.forEach((a, i) => {
      const axisData = axes[a.key] || {};
      const val = _values[i] ?? 0.5;
      const confidence = axisData.confidence || '—';
      const lastEval   = axisData.last_evaluated || null;

      const row = document.createElement('div');
      row.style.marginBottom = '20px';
      row.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px;">
          <strong style="font-size:0.9rem;">${a.key.charAt(0).toUpperCase() + a.key.slice(1)}</strong>
        </div>
        <div class="flavor-slider-wrap">
          <input type="range" class="axis-slider" id="slider-${a.key}"
                 min="0" max="100" value="${Math.round(val * 100)}" style="width:100%;">
          <div class="flavor-slider-labels">
            <span>${Utils.escapeHtml(a.labelA)}</span>
            <span>${Utils.escapeHtml(a.labelB)}</span>
          </div>
        </div>
        <div style="display:flex;gap:12px;margin-top:4px;font-size:0.78rem;color:var(--text-muted);">
          <span>Confidence: <span style="color:${confidence === 'High' ? 'var(--green)' : 'var(--text-muted)'};">${confidence}</span></span>
          ${lastEval ? `<span>Last evaluated: ${Utils.formatDate(lastEval)}</span>` : ''}
        </div>`;

      const slider = row.querySelector(`#slider-${a.key}`);

      slider.addEventListener('input', () => {
        const newVal = parseInt(slider.value) / 100;
        _values[i] = newVal;
        updateRadarPolygon();
        // Update state
        const p = State.get('profile');
        if (!p.flavor_profile) p.flavor_profile = {};
        if (!p.flavor_profile.axes) p.flavor_profile.axes = {};
        if (!p.flavor_profile.axes[a.key]) p.flavor_profile.axes[a.key] = {};
        p.flavor_profile.axes[a.key].position = newVal;  // raw float — matches recommender.js:333
        p.flavor_profile.axes[a.key].last_evaluated = Utils.today();
        markDirty();
      });

      ctrl.appendChild(row);
    });
  }

  // ─── Supplemental (smoke, funk, savory) ─────────────────────────

  function renderSupplemental(profile, container) {
    const supp = profile.flavor_profile?.supplemental || {};
    const ctrl = container.querySelector('#supplemental-controls');
    if (!ctrl) return;

    const supplementals = [
      { key: 'smoke',         label: 'Smoke',          options: ['into it', 'neutral', 'avoids'] },
      { key: 'funk',          label: 'Funk',            options: ['into it', 'neutral', 'turnoff'] },
      { key: 'savory_saline', label: 'Savory / Saline', options: ['interesting', 'neutral', 'hard no'] },
    ];

    supplementals.forEach(s => {
      const current = supp[s.key]?.position || null;
      const notes   = supp[s.key]?.notes || '';

      const row = document.createElement('div');
      row.style.marginBottom = '18px';
      row.innerHTML = `
        <div style="font-size:0.9rem;font-weight:bold;margin-bottom:8px;">${Utils.escapeHtml(s.label)}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${s.options.map(opt => `
            <button class="supp-btn ${current === opt ? 'btn-primary' : 'btn-ghost'} btn-sm"
                    data-key="${s.key}" data-opt="${opt}"
                    style="font-size:0.82rem;">
              ${Utils.escapeHtml(opt)}
            </button>`).join('')}
        </div>
        ${notes ? `<div style="margin-top:6px;font-size:0.82rem;color:var(--text-muted);font-style:italic;">${Utils.escapeHtml(notes)}</div>` : ''}`;

      row.querySelectorAll('.supp-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          row.querySelectorAll('.supp-btn').forEach(b => {
            b.classList.remove('btn-primary');
            b.classList.add('btn-ghost');
          });
          btn.classList.remove('btn-ghost');
          btn.classList.add('btn-primary');

          const p = State.get('profile');
          if (!p.flavor_profile) p.flavor_profile = {};
          if (!p.flavor_profile.supplemental) p.flavor_profile.supplemental = {};
          if (!p.flavor_profile.supplemental[s.key]) p.flavor_profile.supplemental[s.key] = {};
          p.flavor_profile.supplemental[s.key].position = btn.dataset.opt;
          markDirty();
        });
      });

      ctrl.appendChild(row);
    });
  }

  // ─── Profile Summary ─────────────────────────────────────────────

  function renderProfileSummary(identity, archetypes, profile, container) {
    const sumEl = container.querySelector('#profile-summary');
    if (!sumEl) return;

    const name = identity.preferred_name || identity.full_name || '—';
    const total = (State.get('recipes')?.originals || []).length;
    const since = profile.review_counter?.last_review_date;
    const sinceCount = profile.review_counter?.cocktails_since_last_review ?? 0;

    sumEl.innerHTML = `
      <div class="card" style="margin-bottom:12px;">
        <div style="font-size:1.1rem;color:var(--amber);margin-bottom:4px;">${Utils.escapeHtml(name)}</div>
        ${identity.location ? `<div style="font-size:0.85rem;color:var(--text-muted);">${Utils.escapeHtml(identity.location)}</div>` : ''}
      </div>

      ${archetypes.length ? `
        <div style="margin-bottom:14px;">
          <div style="font-size:0.78rem;color:var(--text-muted);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px;">Archetypes</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            ${archetypes.map(a => `<span class="badge badge-amber">${Utils.escapeHtml(a.name || a)}</span>`).join('')}
          </div>
        </div>` : ''}

      <div class="card" style="margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;">
          <div>
            <div class="stat-value" style="font-size:1.2rem;">${total}</div>
            <div class="stat-label">Total Originals</div>
          </div>
          <div>
            <div class="stat-value" style="font-size:1.2rem;">${sinceCount}</div>
            <div class="stat-label">Since Last Review</div>
          </div>
          ${since ? `<div>
            <div class="stat-value" style="font-size:1.2rem;"></div>
            <div class="stat-label">Last Review: ${Utils.formatDate(since)}</div>
          </div>` : ''}
        </div>
      </div>

      <div id="profile-vetoes-section"></div>`;

    renderVetoesSection(container);
  }

  function renderVetoesSection(container) {
    const el = container.querySelector('#profile-vetoes-section');
    if (!el) return;
    const vetoes = State.get('inventory')?.vetoes?.disliked_ingredients || [];
    el.innerHTML = `
      <div style="margin-top:2px;">
        <div style="font-size:0.78rem;color:var(--text-muted);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px;">Vetoes</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;" id="veto-chips">
          ${vetoes.map((v, i) => `
            <span style="display:inline-flex;align-items:center;gap:4px;font-size:0.82rem;background:rgba(224,85,85,0.1);border:1px solid rgba(224,85,85,0.2);color:var(--red);padding:2px 6px 2px 8px;border-radius:3px;">
              ${Utils.escapeHtml(v)}
              <button data-veto-index="${i}" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:1rem;line-height:1;padding:0;" aria-label="Remove ${Utils.escapeHtml(v)}">×</button>
            </span>`).join('')}
          ${vetoes.length === 0 ? '<span style="font-size:0.82rem;color:var(--text-muted);font-style:italic;">None</span>' : ''}
        </div>
        <div style="display:flex;gap:6px;">
          <input type="text" id="veto-input" placeholder="Add veto (e.g. Blue Curaçao, Milk)" style="flex:1;font-size:0.85rem;">
          <button class="btn btn-secondary btn-sm" id="veto-add-btn">+ Add</button>
        </div>
      </div>`;

    el.querySelectorAll('[data-veto-index]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.vetoIndex, 10);
        State.patch('inventory', inv => {
          inv.vetoes = inv.vetoes || {};
          inv.vetoes.disliked_ingredients = (inv.vetoes.disliked_ingredients || []).filter((_, i) => i !== idx);
        });
        _inventoryDirty = true;
        markDirty();
        renderVetoesSection(container);
      });
    });

    const input = el.querySelector('#veto-input');
    const addVeto = () => {
      const val = input.value.trim();
      if (!val) return;
      State.patch('inventory', inv => {
        inv.vetoes = inv.vetoes || {};
        inv.vetoes.disliked_ingredients = inv.vetoes.disliked_ingredients || [];
        if (!inv.vetoes.disliked_ingredients.includes(val)) inv.vetoes.disliked_ingredients.push(val);
      });
      _inventoryDirty = true;
      input.value = '';
      renderVetoesSection(container);
    };
    el.querySelector('#veto-add-btn').addEventListener('click', addVeto);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addVeto(); } });
  }

  // ─── Identity Section ────────────────────────────────────────────

  function renderIdentitySection(identity, profile, container) {
    const el = container.querySelector('#identity-section');
    if (!el) return;

    const fields = [
      { key: 'full_name',      label: 'Full Name',       placeholder: 'Ernest Raymond Beaumont Gantt' },
      { key: 'preferred_name', label: 'Preferred Name',  placeholder: 'Don the Beachcomber' },
      { key: 'location',       label: 'Location',        placeholder: 'Hollywood, CA' },
      { key: 'timezone',       label: 'Time Zone',       placeholder: 'PST' },
    ];

    el.innerHTML = `
      <div class="card">
        <div class="form-row" style="flex-wrap:wrap;">
          ${fields.map(f => `
            <div class="form-group" style="flex:1;min-width:200px;">
              <label>${Utils.escapeHtml(f.label)}</label>
              <input type="text" id="ident-${f.key}" value="${Utils.escapeHtml(identity[f.key] || '')}"
                     placeholder="${Utils.escapeHtml(f.placeholder)}">
            </div>`).join('')}
        </div>
      </div>`;

    fields.forEach(f => {
      el.querySelector(`#ident-${f.key}`).addEventListener('input', (e) => {
        const p = State.get('profile');
        if (!p.identity) p.identity = {};
        p.identity[f.key] = e.target.value;
        markDirty();
      });
    });
  }

  // ─── Evolution Log ───────────────────────────────────────────────

  function renderEvoLog(log, container) {
    const el = container.querySelector('#evo-log');
    if (!el || !log.length) return;
    el.innerHTML = log.slice().reverse().map(entry => `
      <div style="display:flex;gap:14px;margin-bottom:10px;padding:10px 14px;background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius-sm);">
        <span style="color:var(--text-muted);font-size:0.82rem;white-space:nowrap;">${Utils.formatDate(entry.date)}</span>
        <div>
          <div style="font-size:0.9rem;">${Utils.escapeHtml(entry.change)}</div>
          ${entry.reason ? `<div style="font-size:0.82rem;color:var(--text-dim);margin-top:3px;">${Utils.escapeHtml(entry.reason)}</div>` : ''}
        </div>
      </div>`).join('');
  }

  // ─── Drinking Style ──────────────────────────────────────────────

  function renderDsArchetypes(container) {
    const grid = container.querySelector('#ds-archetypes');
    if (!grid) return;
    const selected = (State.get('profile').archetypes || []).map(a => a.name);
    grid.innerHTML = ARCHETYPES.map(a => `
      <button class="archetype-chip${selected.includes(a.name) ? ' active' : ''}"
              data-name="${Utils.escapeHtml(a.name)}" title="${Utils.escapeHtml(a.description)}">${Utils.escapeHtml(a.name)}</button>
    `).join('');
    grid.querySelectorAll('.archetype-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        State.patch('profile', p => {
          const cur = (p.archetypes || []).map(a => a.name);
          const arch = ARCHETYPES.find(a => a.name === btn.dataset.name);
          if (!arch) return;
          if (cur.includes(arch.name)) {
            p.archetypes = (p.archetypes || []).filter(a => a.name !== arch.name);
          } else if (cur.length < 3) {
            p.archetypes = [...(p.archetypes || []), arch];
          }
        });
        markDirty();
        renderDsArchetypes(container);
      });
    });
  }

  function renderDrinkingStyle(profile, container) {
    const el = container.querySelector('#drinking-style-section');
    if (!el) return;
    const bg = profile.background || {};
    const freq = bg.drinking_frequency || '';
    const household = bg.household_context || '';
    const vocab = bg.vocabulary_preference || '';

    el.innerHTML = `
      <details class="profile-drinking-style">
        <summary>Drinking Style</summary>
        <div class="form-group" style="margin-top:14px;">
          <label for="ds-freq">Drinking frequency</label>
          <select id="ds-freq">
            <option value="">—</option>
            ${['daily','several times a week','weekly','occasionally','rarely'].map(o =>
              `<option value="${Utils.escapeHtml(o)}" ${freq === o ? 'selected' : ''}>${Utils.escapeHtml(o)}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="ds-household">Household context</label>
          <input type="text" id="ds-household" placeholder="e.g. Couple, hosting often"
            value="${Utils.escapeHtml(household)}">
        </div>
        <div class="form-group">
          <label for="ds-vocab">Vocabulary preference</label>
          <select id="ds-vocab">
            <option value="">—</option>
            ${['casual','balanced','technical'].map(o =>
              `<option value="${Utils.escapeHtml(o)}" ${vocab === o ? 'selected' : ''}>${Utils.escapeHtml(o)}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Archetypes (pick 1–3)</label>
          <div id="ds-archetypes" class="archetype-grid"></div>
        </div>
      </details>`;

    renderDsArchetypes(container);

    el.querySelector('#ds-freq')?.addEventListener('change', e => {
      State.patch('profile', p => { p.background = p.background || {}; p.background.drinking_frequency = e.target.value; });
      markDirty();
    });
    el.querySelector('#ds-household')?.addEventListener('input', e => {
      State.patch('profile', p => { p.background = p.background || {}; p.background.household_context = e.target.value; });
      markDirty();
    });
    el.querySelector('#ds-vocab')?.addEventListener('change', e => {
      State.patch('profile', p => { p.background = p.background || {}; p.background.vocabulary_preference = e.target.value; });
      markDirty();
    });
  }

  // ─── Save ────────────────────────────────────────────────────────

  function markDirty() {
    _dirty = true;
    const bar = document.getElementById('profile-save-bar');
    if (bar) bar.style.display = 'flex';
  }

  async function saveProfile() {
    const p = State.get('profile');
    p.last_updated = Utils.today();
    try {
      const saves = [State.save('profile', 'Update flavor profile via Barkeeper Bjorn web UI')];
      if (_inventoryDirty) saves.push(State.save('inventory', 'Update vetoes via Barkeeper Bjorn profile'));
      await Promise.all(saves);
      _dirty = false;
      _inventoryDirty = false;
      const bar = document.getElementById('profile-save-bar');
      if (bar) bar.style.display = 'none';
      Utils.showToast('Profile saved to GitHub ✓');
    } catch (err) {
      Utils.showToast(`Save failed: ${err.message}`, 'error');
    }
  }

  return { render };
})();
