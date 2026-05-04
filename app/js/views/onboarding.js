// Onboarding Wizard — step-by-step profile setup.
// Mirrors the agent's onboarding flow: one question per screen.

const OnboardingView = (() => {

  const AXES = [
    {
      key: 'sweetness',
      question: 'How do you feel about sweetness in cocktails?',
      optA: { label: 'Dry or bone-dry', sub: 'Minimal sweetness — spirit should speak for itself.' },
      optB: { label: 'Balanced or slightly sweet', sub: 'Some sweetness is welcome when it rounds the drink.' },
      optC: { label: 'Sweet / dessert-forward', sub: 'Sweeter cocktails are my thing.' },
    },
    {
      key: 'acid',
      question: 'How about acid — citrus and tartness?',
      optA: { label: 'Bright and tart', sub: 'I like a sharp citrus edge. Sours, daiquiris, that world.' },
      optB: { label: 'Soft or barely-there', sub: 'I prefer low-acid drinks — stirred, spirit-forward, minimal citrus.' },
    },
    {
      key: 'strength',
      question: 'Strength preference?',
      optA: { label: 'Spirit-forward / strong', sub: 'Manhattan, Negroni, Old Fashioned territory.' },
      optB: { label: 'Refreshment-forward / lower ABV', sub: 'Spritz, highball, diluted, sessionable.' },
    },
    {
      key: 'complexity',
      question: 'Aromatic complexity — what appeals to you?',
      optA: { label: 'Clean and direct', sub: 'Two or three ingredients. Precision over layering.' },
      optB: { label: 'Layered and brooding', sub: 'Many ingredients, herbal, mysterious, long finish.' },
    },
    {
      key: 'season',
      question: 'Do your drink preferences shift with the seasons?',
      optA: { label: 'Year-round bright', sub: 'I drink the same way regardless of season.' },
      optB: { label: 'Yes — warm/cozy in winter, bright in summer', sub: 'My palate tracks the calendar.' },
    },
    {
      key: 'risk',
      question: 'Risk tolerance in a cocktail — classic or adventurous?',
      optA: { label: 'Classic / reliable', sub: 'Proven recipes, known ingredients, consistent results.' },
      optB: { label: 'Adventurous / experimental', sub: 'Unusual ingredients, novel combinations, surprise me.' },
    },
  ];

  // Steps: identity questions + 6 axis questions + equipment + done
  let _step = 0;
  let _answers = {};

  const STEPS = [
    'welcome',
    'track',
    'name',
    'location',
    'background',
    'equipment',
    ...AXES.map(a => `axis_${a.key}`),
    'smoke',
    'done',
  ];

  function render(container) {
    _step = 0;
    _answers = {};
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
    if (stepId === 'welcome')    return renderWelcome(body, container);
    if (stepId === 'track')      return renderTrack(body, container);
    if (stepId === 'name')       return renderName(body, container);
    if (stepId === 'location')   return renderLocation(body, container);
    if (stepId === 'background') return renderBackground(body, container);
    if (stepId === 'equipment')  return renderEquipment(body, container);
    if (stepId === 'smoke')      return renderSmoke(body, container);
    if (stepId === 'done')       return renderDone(body, container);
    if (stepId.startsWith('axis_')) {
      const axisKey = stepId.replace('axis_', '');
      const axisConfig = AXES.find(a => a.key === axisKey);
      if (axisConfig) return renderAxisStep(axisConfig, body, container);
    }
  }

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
      skip.textContent = 'Skip';
      skip.style.marginLeft = 'auto';
      skip.addEventListener('click', skipFn);
      wrap.appendChild(skip);
    }
    body.appendChild(wrap);
  }

  function renderWelcome(body, container) {
    body.innerHTML = `
      <h1 style="font-size:2rem;margin-bottom:12px;">Welcome.</h1>
      <p class="wizard-question">I'm Barkeeper Bjorn — your personal mixologist and bar collaborator.</p>
      <p style="color:var(--text-dim);margin-bottom:28px;">
        Let's spend a few minutes setting up your profile. I'll ask you one question at a time.
        The more I know about your palate, the better I can recommend and design drinks for you.
      </p>`;
    navButtons(body, container, { nextLabel: 'Let\'s Begin →' });
  }

  function renderTrack(body, container) {
    body.innerHTML = `
      <div class="wizard-question">What kind of bar are we building?</div>`;
    const opts = [
      { val: 'full', label: 'Serious home bar', sub: 'I want to explore widely, build originals, and treat this as an ongoing collaboration.' },
      { val: 'minimalist', label: 'Minimalist / occasional', sub: 'I drink occasionally. I just want to make a few favorite drinks well without a 30-bottle setup.' },
    ];
    const optWrap = document.createElement('div');
    optWrap.className = 'wizard-options';
    opts.forEach(o => {
      const btn = document.createElement('div');
      btn.className = 'wizard-option' + (_answers.track === o.val ? ' selected' : '');
      btn.innerHTML = `${o.label}<div class="opt-sub">${o.sub}</div>`;
      btn.addEventListener('click', () => {
        optWrap.querySelectorAll('.wizard-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        _answers.track = o.val;
      });
      optWrap.appendChild(btn);
    });
    body.appendChild(optWrap);
    navButtons(body, container, {
      nextFn: () => { if (!_answers.track) _answers.track = 'full'; _step++; renderStep(container); }
    });
  }

  function renderName(body, container) {
    body.innerHTML = `
      <div class="wizard-question">What's your name?</div>
      <p style="color:var(--text-dim);font-size:0.9rem;margin-bottom:20px;">
        Used for cocktail attribution when you create an original. Your AI bartender will use your preferred name in conversation.
      </p>
      <div class="form-row">
        <div class="form-group">
          <label>Full Name (for attribution)</label>
          <input type="text" id="wiz-fullname" placeholder="Glenn Strycker" value="${Utils.escapeHtml(_answers.full_name || '')}">
        </div>
        <div class="form-group">
          <label>Preferred Name</label>
          <input type="text" id="wiz-prefname" placeholder="Glenn" value="${Utils.escapeHtml(_answers.preferred_name || '')}">
        </div>
      </div>`;
    navButtons(body, container, {
      nextFn: () => {
        _answers.full_name = body.querySelector('#wiz-fullname').value.trim();
        _answers.preferred_name = body.querySelector('#wiz-prefname').value.trim() || _answers.full_name;
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
      skipFn: () => { _step++; renderStep(container); }
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
      skipFn: () => { _step++; renderStep(container); }
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
      skipFn: () => { _step++; renderStep(container); }
    });
  }

  function renderAxisStep(axisConfig, body, container) {
    body.innerHTML = `<div class="wizard-question">${Utils.escapeHtml(axisConfig.question)}</div>`;
    const opts = [
      axisConfig.optA,
      axisConfig.optB || null,
      axisConfig.optC || null,
    ].filter(Boolean);

    const optValues = opts.length === 2
      ? ['Strong A', 'Strong B']
      : ['Strong A', 'Middle', 'Strong B'];

    const current = _answers[`axis_${axisConfig.key}`];
    const optWrap = document.createElement('div');
    optWrap.className = 'wizard-options';
    opts.forEach((opt, i) => {
      const btn = document.createElement('div');
      btn.className = 'wizard-option' + (current === optValues[i] ? ' selected' : '');
      btn.innerHTML = `${Utils.escapeHtml(opt.label)}<div class="opt-sub">${Utils.escapeHtml(opt.sub)}</div>`;
      btn.addEventListener('click', () => {
        optWrap.querySelectorAll('.wizard-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        _answers[`axis_${axisConfig.key}`] = optValues[i];
      });
      optWrap.appendChild(btn);
    });
    body.appendChild(optWrap);

    navButtons(body, container, {
      nextFn: () => { _step++; renderStep(container); },
      skipFn: () => { _step++; renderStep(container); }
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
      skipFn: () => { _step++; renderStep(container); }
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
      if (val) {
        profile.flavor_profile.axes[a.key] = {
          position: val,
          confidence: 'Tentative',
          last_evaluated: Utils.today(),
        };
      }
    });

    // Supplemental
    if (_answers.smoke) {
      if (!profile.flavor_profile.supplemental) profile.flavor_profile.supplemental = {};
      profile.flavor_profile.supplemental.smoke = { position: _answers.smoke };
    }

    profile.last_updated = Utils.today();
    State.set('profile', profile);
    await State.save('profile', 'Complete onboarding via Barkeeper Bjorn web UI');
  }

  return { render };
})();
