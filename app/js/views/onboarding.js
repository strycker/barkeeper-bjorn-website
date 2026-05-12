// Onboarding Wizard — step-by-step profile setup.
// Mirrors the agent's onboarding flow: one question per screen.

const OnboardingView = (() => {

  const AXES = [
    { key: 'sweetness',  question: 'How do you feel about sweetness?',                labelLeft: 'Dry / bone-dry',       labelRight: 'Sweet / balanced' },
    { key: 'acid',       question: 'How do you feel about acidity?',                  labelLeft: 'Smooth / low-acid',    labelRight: 'Bright / tart' },
    { key: 'strength',   question: 'How strong do you like your drinks?',             labelLeft: 'Light / low-ABV',      labelRight: 'Strong / high-proof' },
    { key: 'complexity', question: 'How complex do you want your cocktails?',         labelLeft: 'Simple / clean',       labelRight: 'Complex / layered' },
    { key: 'season',     question: 'What season best matches your usual mood?',       labelLeft: 'Bright / summery',     labelRight: 'Warm / wintry' },
    { key: 'risk',       question: 'How adventurous are you with flavors?',           labelLeft: 'Familiar / classic',   labelRight: 'Adventurous / unusual' },
  ];

  let _step = 0;
  let _answers = {};

  const STEPS = [
    'welcome',
    'bartender_name', 'bartender_voice', 'bartender_specialty',
    'your_name', 'location', 'background', 'equipment',
    'inventory_paste',
    ...AXES.map(a => `axis_${a.key}`),
    'smoke', 'done',
  ];

  function render(container) {
    _answers = {};
    const profile   = State.get('profile')   || {};
    const barkeeper = State.get('barkeeper') || {};
    const axes      = profile.flavor_profile?.axes    || {};
    const identity  = profile.identity                || {};
    const bkSkipped = barkeeper._skipped              || {};

    const skippedMap = {};
    Object.entries(axes).forEach(([key, val]) => {
      if (val && val._skipped) skippedMap[`axis_${key}`] = true;
    });
    ['your_name', 'location', 'background', 'equipment'].forEach(key => {
      if (identity[`_skipped_${key}`]) skippedMap[key] = true;
    });
    ['bartender_name', 'bartender_voice', 'bartender_specialty'].forEach(key => {
      if (bkSkipped[key]) skippedMap[key] = true;
    });

    const firstSkippedIdx = STEPS.findIndex(s => skippedMap[s]);
    _step = firstSkippedIdx >= 0 ? firstSkippedIdx : 0;
    renderStep(container);
  }

  function renderStep(container) {
    const stepId = STEPS[_step];
    const progress = (_step / (STEPS.length - 1)) * 100;

    container.innerHTML = `
      <div class="wizard-wrap">
        <div class="wizard-progress"><div class="wizard-progress-bar" style="width:${progress}%"></div></div>
        <div class="wizard-step-label">Step ${_step + 1} of ${STEPS.length}</div>
        <div id="wizard-body"></div>
      </div>`;

    const body = container.querySelector('#wizard-body');
    renderStepBody(stepId, body, container);
  }

  function renderStepBody(stepId, body, container) {
    if (stepId.startsWith('_')) { _step++; renderStep(container); return; }

    if (stepId === 'welcome')             return renderWelcome(body, container);
    if (stepId === 'bartender_name')      return renderBartenderName(body, container);
    if (stepId === 'bartender_voice')     return renderBartenderVoice(body, container);
    if (stepId === 'bartender_specialty') return renderBartenderSpecialty(body, container);
    if (stepId === 'your_name')           return renderYourName(body, container);
    if (stepId === 'location')            return renderLocation(body, container);
    if (stepId === 'background')          return renderBackground(body, container);
    if (stepId === 'equipment')           return renderEquipment(body, container);
    if (stepId === 'inventory_paste')     return renderInventoryPaste(body, container);
    if (stepId === 'smoke')               return renderSmoke(body, container);
    if (stepId === 'done')                return renderDone(body, container);
    if (stepId.startsWith('axis_')) {
      const axisKey = stepId.replace('axis_', '');
      const axisConfig = AXES.find(a => a.key === axisKey);
      if (axisConfig) return renderAxisStep(axisConfig, body, container);
    }
  }

  function navButtons(body, container, { nextLabel = 'Continue →', nextFn, skipFn } = {}) {
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

  function renderWelcome(body, container) {
    const cfg = GitHubAPI.cfg();
    const barkeeper = State.get('barkeeper') || {};
    const bkName = barkeeper.identity?.name || 'Barkeeper Bjorn';
    const avatarUrl = (cfg.owner && cfg.repo)
      ? `https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/main/images/barkeeper_bjorn_001.png`
      : null;
    body.innerHTML = `
      <div class="wizard-avatar-wrap">
        ${avatarUrl ? `<img class="wizard-avatar" src="${Utils.escapeHtml(avatarUrl)}"
          alt="${Utils.escapeHtml(bkName)}"
          onerror="this.style.display='none'">` : ''}
        <p class="wizard-avatar-caption">I'm ${Utils.escapeHtml(bkName)}. Let's make your bar legendary.</p>
      </div>
      <h2 class="wizard-question">Welcome.</h2>
      <p style="color:var(--text-dim);margin-bottom:28px;">
        I'm your personal mixologist and bar collaborator. Let's spend a few minutes setting up your profile — one question at a time.
      </p>`;
    navButtons(body, container, { nextLabel: "Let's begin →" });
  }

  function renderBartenderName(body, container) {
    body.innerHTML = `
      <h2 class="wizard-question">What should I call myself?</h2>
      <p style="color:var(--text-dim);font-size:0.9rem;margin-bottom:20px;">
        This is the name I'll use when signing messages and talking with you.
      </p>
      <div class="form-group">
        <label for="wiz-bk-name">Bartender Name</label>
        <input type="text" id="wiz-bk-name" placeholder="Barkeeper Bjorn"
               value="${Utils.escapeHtml(_answers.bartender_name || '')}">
      </div>`;
    navButtons(body, container, {
      nextFn: () => {
        _answers.bartender_name = body.querySelector('#wiz-bk-name').value.trim() || 'Barkeeper Bjorn';
        _step++; renderStep(container);
      },
      skipFn: () => {
        _answers.bartender_name = 'Barkeeper Bjorn';
        State.patch('barkeeper', b => {
          if (!b._skipped) b._skipped = {};
          b._skipped.bartender_name = true;
        });
        State.save('barkeeper', 'Skip onboarding step: bartender_name');
        _step++; renderStep(container);
      }
    });
  }

  function renderBartenderVoice(body, container) {
    const presets = [
      'Professional Mixologist', 'Warm & playful', 'Terse & direct',
      'Theatrical & poetic', 'Educational & nerdy'
    ];
    const current = _answers.bartender_voice || '';
    body.innerHTML = `
      <h2 class="wizard-question">What's my voice and personality?</h2>
      <p style="color:var(--text-dim);font-size:0.9rem;margin-bottom:20px;">
        Choose the style that feels right for our sessions together.
      </p>
      <div class="form-group">
        <label for="wiz-bk-voice">Voice Preset</label>
        <select id="wiz-bk-voice">
          ${presets.map(p => `<option value="${Utils.escapeHtml(p)}" ${p === current ? 'selected' : ''}>${Utils.escapeHtml(p)}</option>`).join('')}
        </select>
      </div>`;
    navButtons(body, container, {
      nextFn: () => {
        _answers.bartender_voice = body.querySelector('#wiz-bk-voice').value;
        _step++; renderStep(container);
      },
      skipFn: () => {
        _answers.bartender_voice = 'Professional Mixologist';
        State.patch('barkeeper', b => {
          if (!b._skipped) b._skipped = {};
          b._skipped.bartender_voice = true;
        });
        State.save('barkeeper', 'Skip onboarding step: bartender_voice');
        _step++; renderStep(container);
      }
    });
  }

  function renderBartenderSpecialty(body, container) {
    const specialties = [
      'No preference (broad and balanced)', 'Classic cocktails',
      'Craft & artisanal', 'Beer & cider', 'Wine & spirits education'
    ];
    const current = _answers.bartender_specialty || '';
    body.innerHTML = `
      <h2 class="wizard-question">What's my specialty focus?</h2>
      <p style="color:var(--text-dim);font-size:0.9rem;margin-bottom:20px;">
        I'll lean into this area when making suggestions.
      </p>
      <div class="form-group">
        <label for="wiz-bk-specialty">Specialty</label>
        <select id="wiz-bk-specialty">
          ${specialties.map(s => `<option value="${Utils.escapeHtml(s)}" ${s === current ? 'selected' : ''}>${Utils.escapeHtml(s)}</option>`).join('')}
        </select>
      </div>`;
    navButtons(body, container, {
      nextFn: () => {
        _answers.bartender_specialty = body.querySelector('#wiz-bk-specialty').value;
        _step++; renderStep(container);
      },
      skipFn: () => {
        _answers.bartender_specialty = 'No preference (broad and balanced)';
        State.patch('barkeeper', b => {
          if (!b._skipped) b._skipped = {};
          b._skipped.bartender_specialty = true;
        });
        State.save('barkeeper', 'Skip onboarding step: bartender_specialty');
        _step++; renderStep(container);
      }
    });
  }

  function renderYourName(body, container) {
    body.innerHTML = `
      <div class="wizard-question">What's your name?</div>
      <p style="color:var(--text-dim);font-size:0.9rem;margin-bottom:20px;">
        Used for cocktail attribution when you create an original. Your bartender will use your preferred name in conversation.
      </p>
      <div class="form-row">
        <div class="form-group">
          <label>Full Name (for attribution)</label>
          <input type="text" id="wiz-fullname" placeholder="Ernest Raymond Beaumont Gantt" value="${Utils.escapeHtml(_answers.full_name || '')}">
        </div>
        <div class="form-group">
          <label>Preferred Name</label>
          <input type="text" id="wiz-prefname" placeholder="Don the Beachcomber" value="${Utils.escapeHtml(_answers.preferred_name || '')}">
        </div>
      </div>`;
    navButtons(body, container, {
      nextFn: () => {
        _answers.full_name = body.querySelector('#wiz-fullname').value.trim();
        _answers.preferred_name = body.querySelector('#wiz-prefname').value.trim() || _answers.full_name;
        _step++; renderStep(container);
      },
      skipFn: () => {
        State.patch('profile', p => {
          if (!p.identity) p.identity = {};
          p.identity._skipped_your_name = true;
        });
        State.save('profile', 'Skip onboarding step: your_name');
        _step++; renderStep(container);
      }
    });
  }

  function renderLocation(body, container) {
    body.innerHTML = `
      <div class="wizard-question">Where are you?</div>
      <p style="color:var(--text-dim);font-size:0.9rem;margin-bottom:20px;">
        Used for seasonal references and ingredient availability.
      </p>
      <div class="form-row">
        <div class="form-group">
          <label>City / Region</label>
          <input type="text" id="wiz-location" placeholder="Austin, TX" value="${Utils.escapeHtml(_answers.location || '')}">
        </div>
        <div class="form-group">
          <label>Time Zone</label>
          <input type="text" id="wiz-tz" placeholder="CST/CDT" value="${Utils.escapeHtml(_answers.timezone || '')}">
        </div>
      </div>`;
    navButtons(body, container, {
      nextFn: () => {
        _answers.location = body.querySelector('#wiz-location').value.trim();
        _answers.timezone = body.querySelector('#wiz-tz').value.trim();
        _step++; renderStep(container);
      },
      skipFn: () => {
        State.patch('profile', p => {
          if (!p.identity) p.identity = {};
          p.identity._skipped_location = true;
        });
        State.save('profile', 'Skip onboarding step: location');
        _step++; renderStep(container);
      }
    });
  }

  function renderBackground(body, container) {
    body.innerHTML = `
      <div class="wizard-question">A little about yourself?</div>
      <p style="color:var(--text-dim);font-size:0.9rem;margin-bottom:20px;">
        This calibrates how your bartender talks to you — vocabulary, analogies, depth of explanation.
      </p>
      <div class="form-group">
        <label>Profession / Background</label>
        <input type="text" id="wiz-profession" placeholder="Data scientist, architect, chef…" value="${Utils.escapeHtml(_answers.profession || '')}">
      </div>
      <div class="form-group">
        <label>How often do you drink cocktails?</label>
        <select id="wiz-freq">
          <option value="">Select…</option>
          ${['occasional','weekly','regular','most evenings','other'].map(o =>
            `<option value="${o}" ${_answers.drinking_frequency === o ? 'selected' : ''}>${o}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Typical context</label>
        <input type="text" id="wiz-context" placeholder="Solo evenings, dinner parties, entertaining guests…" value="${Utils.escapeHtml(_answers.typical_context || '')}">
      </div>`;
    navButtons(body, container, {
      nextFn: () => {
        _answers.profession = body.querySelector('#wiz-profession').value.trim();
        _answers.drinking_frequency = body.querySelector('#wiz-freq').value;
        _answers.typical_context = body.querySelector('#wiz-context').value.trim();
        _step++; renderStep(container);
      },
      skipFn: () => {
        State.patch('profile', p => {
          if (!p.identity) p.identity = {};
          p.identity._skipped_background = true;
        });
        State.save('profile', 'Skip onboarding step: background');
        _step++; renderStep(container);
      }
    });
  }

  function renderEquipment(body, container) {
    body.innerHTML = `
      <div class="wizard-question">What bar tools do you have?</div>
      <p style="color:var(--text-dim);font-size:0.9rem;margin-bottom:20px;">
        Your bartender won't suggest techniques that require tools you don't own.
      </p>`;

    const checks = [
      { key: 'shaker',       label: 'Shaker', type: 'select', options: ['Boston two-piece','cobbler','none'] },
      { key: 'mixing_glass', label: 'Mixing Glass', type: 'checkbox' },
      { key: 'jigger',       label: 'Jigger', type: 'checkbox' },
      { key: 'bar_spoon',    label: 'Bar Spoon', type: 'checkbox' },
      { key: 'strainer',     label: 'Strainer', type: 'select', options: ['Hawthorne','Julep','fine mesh','multiple','none'] },
      { key: 'citrus_press', label: 'Citrus Press', type: 'checkbox' },
      { key: 'ice_setup',    label: 'Ice Setup', type: 'select', options: ['standard cubes','large format','crushed','combination','none'] },
    ];

    const equip = _answers.equipment || {};
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;margin-bottom:24px;';

    checks.forEach(c => {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;';
      if (c.type === 'checkbox') {
        const checked = equip[c.key] === true;
        wrap.innerHTML = `
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
            <input type="checkbox" id="eq-${c.key}" ${checked ? 'checked' : ''} style="width:16px;height:16px;accent-color:var(--amber);">
            ${Utils.escapeHtml(c.label)}
          </label>`;
      } else {
        wrap.innerHTML = `
          <label style="margin-bottom:6px;">${Utils.escapeHtml(c.label)}</label>
          <select id="eq-${c.key}" style="width:100%;">
            ${c.options.map(o => `<option value="${o}" ${equip[c.key] === o ? 'selected' : ''}>${o}</option>`).join('')}
          </select>`;
      }
      grid.appendChild(wrap);
    });

    body.appendChild(grid);

    navButtons(body, container, {
      nextFn: () => {
        _answers.equipment = {};
        checks.forEach(c => {
          const el = body.querySelector(`#eq-${c.key}`);
          _answers.equipment[c.key] = c.type === 'checkbox' ? el.checked : el.value;
        });
        _step++; renderStep(container);
      },
      skipFn: () => {
        State.patch('profile', p => {
          if (!p.identity) p.identity = {};
          p.identity._skipped_equipment = true;
        });
        State.save('profile', 'Skip onboarding step: equipment');
        _step++; renderStep(container);
      }
    });
  }

  function renderInventoryPaste(body, container) {
    body.innerHTML = `
      <h2 class="wizard-question">Do you want to add your current bar inventory?</h2>
      <div class="wizard-paste-wrap">
        <div class="form-group">
          <label for="wiz-inv-paste">Your bottles (comma-separated)</label>
          <textarea id="wiz-inv-paste" class="wizard-paste-input" rows="5"
            placeholder="e.g. Bulleit Bourbon, Aperol, Angostura Bitters, Dry Vermouth"
            style="width:100%;resize:vertical;"></textarea>
          <p class="wizard-paste-hint">You can add bitters, syrups, and other pantry items from the Inventory view.</p>
        </div>
        <div id="wiz-inv-chips" class="wizard-chip-preview bottle-grid"></div>
        <p id="wiz-inv-note" style="font-size:0.82rem;color:var(--text-muted);min-height:1.2em;"></p>
      </div>`;

    const textarea = body.querySelector('#wiz-inv-paste');
    const chipsEl  = body.querySelector('#wiz-inv-chips');
    const noteEl   = body.querySelector('#wiz-inv-note');

    function rebuildChips() {
      const items = textarea.value.split(',').map(s => s.trim()).filter(Boolean);
      _answers.inventory_paste = items;
      chipsEl.innerHTML = '';
      items.forEach((item, idx) => {
        const chip = document.createElement('div');
        chip.className = 'bottle-chip';
        chip.innerHTML = `<span>${Utils.escapeHtml(item)}</span><button class="chip-remove" data-idx="${idx}" aria-label="Remove ${Utils.escapeHtml(item)}">×</button>`;
        chip.querySelector('.chip-remove').addEventListener('click', () => {
          items.splice(idx, 1);
          textarea.value = items.join(', ');
          rebuildChips();
        });
        chipsEl.appendChild(chip);
      });
      noteEl.textContent = items.length ? `${items.length} item${items.length !== 1 ? 's' : ''} ready to add` : '';
    }

    textarea.addEventListener('blur', rebuildChips);

    navButtons(body, container, {
      nextLabel: 'Looks good →',
      nextFn: () => { _step++; renderStep(container); },
      skipFn: () => { _answers.inventory_paste = []; _step++; renderStep(container); }
    });
  }

  function renderAxisStep(axisConfig, body, container) {
    const saved = _answers[`axis_${axisConfig.key}`];
    const current = (typeof saved === 'number') ? saved : (saved?.value ?? 0.5);
    body.innerHTML = `
      <h2 class="wizard-question">${Utils.escapeHtml(axisConfig.question)}</h2>
      <div class="axis-slider-group">
        <div class="axis-slider-poles">
          <span class="axis-pole-label--left">${Utils.escapeHtml(axisConfig.labelLeft)}</span>
          <span class="axis-pole-label--right">${Utils.escapeHtml(axisConfig.labelRight)}</span>
        </div>
        <input type="range" class="axis-slider" id="wiz-axis-${Utils.escapeHtml(axisConfig.key)}"
               min="0" max="1" step="0.01" value="${current}"
               aria-label="${Utils.escapeHtml(axisConfig.key)} preference"
               aria-valuemin="0" aria-valuemax="1" aria-valuenow="${current}" style="width:100%;">
        <div class="axis-slider-center-label">Middle</div>
      </div>`;
    navButtons(body, container, {
      nextFn: () => {
        const val = parseFloat(body.querySelector(`#wiz-axis-${axisConfig.key}`).value);
        _answers[`axis_${axisConfig.key}`] = val;
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

  function renderSmoke(body, container) {
    body.innerHTML = `<div class="wizard-question">A few bonus preferences — what's your relationship with smoke in cocktails?</div>`;

    const smokeOpts = ['into it', 'neutral', 'avoids'];
    const current = _answers.smoke;
    const optWrap = document.createElement('div');
    optWrap.className = 'wizard-options';
    smokeOpts.forEach(opt => {
      const btn = document.createElement('div');
      btn.className = 'wizard-option' + (current === opt ? ' selected' : '');
      btn.innerHTML = Utils.escapeHtml(opt);
      btn.addEventListener('click', () => {
        optWrap.querySelectorAll('.wizard-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        _answers.smoke = opt;
      });
      optWrap.appendChild(btn);
    });
    body.appendChild(optWrap);
    navButtons(body, container, {
      nextFn: () => { _step++; renderStep(container); },
      skipFn: () => {
        State.patch('profile', p => {
          if (!p.flavor_profile) p.flavor_profile = {};
          if (!p.flavor_profile.axes) p.flavor_profile.axes = {};
          p.flavor_profile.axes.smoke = { _skipped: true, position: 0.5 };
        });
        _step++; renderStep(container);
      }
    });
  }

  async function renderDone(body, container) {
    body.innerHTML = `
      <div style="text-align:center;padding:20px 0;">
        <div style="font-size:3rem;margin-bottom:16px;">🍹</div>
        <h2 style="font-size:1.5rem;color:var(--amber);margin-bottom:10px;">You're all set.</h2>
        <p style="color:var(--text-dim);max-width:400px;margin:0 auto 28px;">
          Saving your profile to GitHub now…
        </p>
        <div id="save-status"></div>
      </div>`;

    const status = body.querySelector('#save-status');
    try {
      await saveAnswers();
      status.innerHTML = `
        <p style="color:var(--green);margin-bottom:20px;">✓ Profile saved to GitHub.</p>
        <a href="#dashboard" class="btn btn-primary" style="font-size:1rem;padding:12px 28px;">
          Go to My Bar →
        </a>`;
    } catch (err) {
      status.innerHTML = `
        <p style="color:var(--red);margin-bottom:16px;">Save failed: ${Utils.escapeHtml(err.message)}</p>
        <p style="color:var(--text-dim);font-size:0.88rem;margin-bottom:20px;">
          Your GitHub token may not have write access, or the branch may be protected.
          Check your settings and try again.
        </p>
        <div style="display:flex;gap:10px;justify-content:center;">
          <button class="btn btn-primary" id="retry-save-btn">Retry Save</button>
          <a href="#dashboard" class="btn btn-ghost">Skip (go to Dashboard)</a>
        </div>`;
      document.getElementById('retry-save-btn')?.addEventListener('click', async () => {
        status.innerHTML = '<div class="spinner" style="margin:0 auto;"></div>';
        await renderDone(body, container);
      });
    }
  }

  async function saveAnswers() {
    const profile = State.get('profile') || {};

    // Identity
    if (!profile.identity) profile.identity = {};
    if (_answers.full_name)      profile.identity.full_name      = _answers.full_name;
    if (_answers.preferred_name) profile.identity.preferred_name = _answers.preferred_name;
    if (_answers.location)       profile.identity.location       = _answers.location;
    if (_answers.timezone)       profile.identity.timezone       = _answers.timezone;

    // Background
    if (!profile.background) profile.background = {};
    if (_answers.profession)         profile.background.profession        = _answers.profession;
    if (_answers.drinking_frequency) profile.background.drinking_frequency = _answers.drinking_frequency;
    if (_answers.typical_context)    profile.background.typical_context   = _answers.typical_context;

    // Equipment
    if (_answers.equipment) profile.equipment = _answers.equipment;

    // Flavor axes
    if (!profile.flavor_profile) profile.flavor_profile = {};
    if (!profile.flavor_profile.axes) profile.flavor_profile.axes = {};
    AXES.forEach(a => {
      const val = _answers[`axis_${a.key}`];
      if (typeof val === 'number') {
        profile.flavor_profile.axes[a.key] = {
          position: val,
          confidence: 'Tentative',
          last_evaluated: Utils.today(),
        };
      }
    });

    // Supplemental smoke
    if (_answers.smoke) {
      if (!profile.flavor_profile.supplemental) profile.flavor_profile.supplemental = {};
      profile.flavor_profile.supplemental.smoke = { position: _answers.smoke };
    }

    // Onboarding complete
    profile.onboarding_complete = true;
    profile.last_updated = Utils.today();
    State.set('profile', profile);

    // Bartender fields
    const barkeeper = State.get('barkeeper') || {};
    if (_answers.bartender_name) {
      if (!barkeeper.identity) barkeeper.identity = {};
      barkeeper.identity.name = _answers.bartender_name;
    }
    if (_answers.bartender_voice) {
      barkeeper.active_preset = _answers.bartender_voice;
    }
    if (_answers.bartender_specialty) {
      if (!barkeeper.personality) barkeeper.personality = {};
      barkeeper.personality.specialty = _answers.bartender_specialty;
    }
    barkeeper.last_updated = Utils.today();
    State.set('barkeeper', barkeeper);

    // Sequential saves to avoid GitHub SHA conflicts
    await State.save('profile', 'Complete onboarding via Barkeeper Bjorn web UI');
    await State.save('barkeeper', 'Complete onboarding via Barkeeper Bjorn web UI');

    // Inventory paste — write to inventory.unassigned (NOT inventory.spirits)
    if (_answers.inventory_paste && _answers.inventory_paste.length > 0) {
      const inv = State.get('inventory') || {};
      inv.unassigned = (inv.unassigned || []).concat(_answers.inventory_paste);
      inv.last_updated = Utils.today();
      State.set('inventory', inv);
      await State.save('inventory', 'Add inventory from onboarding via Barkeeper Bjorn');
    }
  }

  return { render };
})();
