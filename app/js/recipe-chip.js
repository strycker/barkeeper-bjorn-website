// RecipeChip — single canonical renderer for every recipe chip in the app.
//
// Part of the Chip Unification mini-phase (see .planning/chip-unification-plan.md).
// Commit 3 of 3 — adds the BEHAVIOR layer on top of the C2 renderer:
//   • bindActions(container, handlers) — single delegated click listener per
//     container (uses the _boundContainer pattern shared with library.js /
//     classroom.js to avoid handler stacking on re-render).
//   • Per-chip "Tweak with AI" panel rendered in the footer; tweak-submit
//     fires handlers.tweak(recipe, prompt).
//   • Click on the chip BODY (away from any [data-action]) dispatches to
//     handlers.body(recipe) — the "open the chip" path.
// Seeded-core lock enforcement is implemented in the callers' renderForm +
// save handlers (and in Normalize.recipe which drops core fields when
// seed_id is set — defense in depth).
//
// All chips share the same markup so visual / behavioral parity is enforced
// by construction rather than copy-paste discipline.
//
// IMPORTANT — security: every model/user-derived string is run through
// Utils.escapeHtml() before being interpolated into innerHTML. The renderer
// must work even when Utils is not yet on globalThis (e.g. very early renders
// during test bootstrap), so we fall back to an inline escape function.

const RecipeChip = (() => {

  function _esc(s) {
    if (typeof Utils !== 'undefined' && typeof Utils.escapeHtml === 'function') {
      return Utils.escapeHtml(s == null ? '' : String(s));
    }
    // Minimal fallback escape (matches Utils.escapeHtml semantics) — used by
    // node tests that load this file without utils.js on the page.
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Resolve a CLASSICS_DB seed by id. Combined db across all extra-N files
  // is concatenated into a single global CLASSICS_DB array at script load.
  function _seedById(seedId) {
    if (!seedId) return null;
    // Browser top-level `const CLASSICS_DB` does NOT attach to globalThis;
    // it lives in the global lexical scope. Reach it by bare name first,
    // fall back to globalThis for node tests that explicitly stub via
    // `globalThis.CLASSICS_DB = [...]`.
    const db = (typeof CLASSICS_DB !== 'undefined' && Array.isArray(CLASSICS_DB)) ? CLASSICS_DB
             : (typeof globalThis !== 'undefined' && Array.isArray(globalThis.CLASSICS_DB)) ? globalThis.CLASSICS_DB
             : null;
    if (!db) return null;
    return db.find(c => c && c.id === seedId) || null;
  }

  // For seeded chips, overlay the live CLASSICS_DB record under the pool
  // entry so the renderer can read core fields (name / ingredients / method
  // / etc.) without storing them in the pool. Non-seeded entries are
  // returned unchanged. This is the "overlay-only" design from C-2.
  function resolveCore(recipe) {
    if (!recipe || typeof recipe !== 'object') return recipe;
    if (!recipe.seed_id) return recipe;
    const seed = _seedById(recipe.seed_id);
    if (!seed) return recipe;
    // Pool entry wins for overlay scalars; seed wins for core fields it
    // defines. Spread order: seed first, then recipe overrides.
    return { ...seed, ...recipe };
  }

  // Named filter views used by the Recipes tabs + recommender. Excludes
  // is_hidden:true from every view except 'classics' (where hidden seeds
  // may still appear grayed-out — deferred to Commit 3).
  function filterPool(pool, view) {
    if (!Array.isArray(pool)) return [];
    const hiddenOk = (view === 'classics');
    const base = hiddenOk ? pool : pool.filter(r => r && !r.is_hidden);
    switch (view) {
      case 'originals':      return base.filter(r => r.status === 'original');
      case 'drafts':         return base.filter(r => r.status === 'draft');
      case 'classics':       return base.filter(r => r.status === 'classic');
      case 'favorites':      return base.filter(r => !!r.is_favorite);
      case 'wishlist':       return base.filter(r => !!r.is_wishlist);
      case 'made':           return base.filter(r => Array.isArray(r.made_log) && r.made_log.length > 0);
      case 'all-buildable':  return base.filter(r => r.status === 'classic' || r.status === 'original');
      default:               return base.slice();
    }
  }

  // Resolve which action buttons to render based on status + context + opts.
  // Defaults derived from the behavior matrix in the design doc.
  function _resolveActions(recipe, opts) {
    const status = recipe.status || 'original';
    // Per-status defaults.
    const defaults = (status === 'classic')
      ? { edit: false, promote: false, discard: false, askBjorn: true }
      : (status === 'draft')
        ? { edit: true, promote: true, discard: true, askBjorn: true }
        : { edit: true, promote: false, discard: true, askBjorn: true }; // original
    return Object.assign({}, defaults, opts.actions || {});
  }

  // Status badge HTML. Defense in depth: a `seed_id` on the entry always
  // means it's a classic regardless of the stored `status` field — covers
  // the case where a stale migration left a `status:'original'` on what is
  // really a seeded classic (cleaned up by Normalize.reclassifyExistingPool
  // on next load, but the badge stays correct in the meantime).
  function _statusBadge(status, recipe) {
    const effective = (recipe && recipe.seed_id) ? 'classic' : status;
    const cls = effective === 'classic'  ? 'badge--status-classic'
              : effective === 'original' ? 'badge--status-original'
              : effective === 'draft'    ? 'badge--status-draft'
              : '';
    if (!cls) return '';
    return `<span class="badge badge-status ${cls}">${_esc(effective)}</span>`;
  }

  // Overlay flags (favorite / wishlist / made-count).
  function _flagsHtml(r) {
    const parts = [];
    if (r.is_favorite) parts.push('<span class="recipe-chip-flag" title="Favorite">&#9829;</span>');
    if (r.is_wishlist) parts.push('<span class="recipe-chip-flag" title="Wishlist">&#9734;</span>');
    const madeCount = Array.isArray(r.made_log) ? r.made_log.length : 0;
    if (madeCount > 0) {
      parts.push(`<span class="recipe-chip-flag" title="Made ${_esc(madeCount)} time(s)">&#10003;</span>`);
    }
    return parts.join('');
  }

  // Meta line: base · method · glassware (each only if present).
  function _metaHtml(r) {
    const parts = [];
    if (r.base)      parts.push(_esc(r.base));
    if (r.method)    parts.push(_esc(r.method));
    if (r.glassware) parts.push(_esc(r.glassware));
    return parts.join(' &middot; ');
  }

  // Ingredient row: first 5 as small chips, then "+N more" overflow.
  function _ingredientsHtml(r) {
    const ings = Array.isArray(r.ingredients) ? r.ingredients : [];
    const chips = ings.slice(0, 5).map(i =>
      `<span class="rec-ing-chip">${_esc(i && i.amount)} ${_esc(i && i.name)}</span>`
    ).join('');
    const overflow = ings.length > 5
      ? `<span class="rec-ing-chip" style="color:var(--text-muted);">+${ings.length - 5} more</span>`
      : '';
    return chips + overflow;
  }

  // Footer action buttons. Each carries data-action; callers wire handlers.
  function _actionsHtml(actions) {
    const out = [];
    if (actions.edit) {
      out.push('<button class="btn btn-ghost btn-sm" data-action="edit">Edit</button>');
    }
    if (actions.promote) {
      out.push('<button class="btn btn-primary btn-sm" data-action="promote">Promote to Original</button>');
    }
    if (actions.askBjorn) {
      out.push('<button class="btn btn-ghost btn-sm ai-ask-btn" data-action="ask-bjorn">Ask Bjorn about this</button>');
    }
    if (actions.favorite) {
      out.push('<button class="btn-icon" data-action="favorite" title="Toggle Favorite">&#9825;</button>');
    }
    if (actions.wishlist) {
      out.push('<button class="btn-icon" data-action="wishlist" title="Toggle Wishlist">&#9734;</button>');
    }
    if (actions.made) {
      out.push('<button class="btn-icon" data-action="made" title="Mark Made">&#9675;</button>');
    }
    if (actions.discard) {
      out.push('<button class="btn-icon" data-action="discard" title="Discard">&#10005;</button>');
    }
    return out.join('');
  }

  // Collapsible "Tweak with AI" panel — present on every chip per the
  // chip-unification design contract (C-3: AI tweak input on every chip;
  // submitting forks the chip into a new draft with parent_id = source.id).
  // The renderer always emits the panel; the disabled state (no API key)
  // is handled in the caller's handlers.tweak by toasting and not calling.
  function _tweakPanelHtml(showActions, opts) {
    if (!showActions) return '';
    if (opts.tweak === false) return ''; // opt-out for special contexts
    return `<details class="recipe-chip-tweak" data-tweak-panel>
      <summary>Tweak with AI</summary>
      <textarea class="recipe-chip-tweak-input" data-tweak-input rows="2"
        placeholder="e.g. make it less sweet, sub mezcal..."></textarea>
      <button class="btn btn-primary btn-sm" data-action="tweak-submit">Generate Tweaked Draft</button>
    </details>`;
  }

  // Render a single chip. Returns an HTML string; intended use is inside
  // `container.innerHTML = list.map(r => RecipeChip.render(r, opts)).join('')`.
  function render(recipe, opts) {
    if (!recipe || typeof recipe !== 'object') return '';
    opts = opts || {};
    const core = resolveCore(recipe);
    const status = core.status || 'original';
    const id = core.id || core.draft_id || core.seed_id || '';
    const showActions = (opts.showActions !== false);
    const actions = showActions ? _resolveActions(core, opts) : null;

    const taglineHtml = core.tagline
      ? `<p class="recipe-chip-tagline" style="font-style:italic;">${_esc(core.tagline)}</p>`
      : '';

    const footerHtml = showActions
      ? `<footer class="recipe-chip-actions">${_actionsHtml(actions)}</footer>`
      : '';

    const tweakHtml = _tweakPanelHtml(showActions, opts);

    return `<article class="recipe-chip rec-card" data-id="${_esc(id)}" data-status="${_esc(status)}">`
      + `<header class="recipe-chip-head">`
      +   `<div class="recipe-chip-title">`
      +     `<span class="recipe-chip-name">${_esc(core.name)}</span>`
      +     _statusBadge(status, recipe)
      +     _flagsHtml(core)
      +   `</div>`
      +   `<div class="recipe-chip-meta">${_metaHtml(core)}</div>`
      + `</header>`
      + `<div class="recipe-chip-body">`
      +   taglineHtml
      +   `<div class="rec-ingredients">${_ingredientsHtml(core)}</div>`
      + `</div>`
      + footerHtml
      + tweakHtml
      + `</article>`;
  }

  // ── Delegated action wiring (Commit 3) ──────────────────────────────────
  // bindActions(container, handlers, options) — wires a SINGLE delegated
  // click listener on `container` that dispatches to handlers[action] when
  // the click originates inside a [data-action] element, or to handlers.body
  // when the click is on the chip body away from any button.
  //
  // `handlers` is a partial map: { edit, promote, discard, askBjorn, tweak,
  // favorite, wishlist, made, body }. Missing handlers are no-ops.
  //
  // Each handler is invoked as `handler(recipe, event)` where `recipe` is
  // looked up by the chip's data-id via `options.recipeById(id)` — callers
  // pass in their current pool / filtered list as a Map-like lookup so the
  // dispatcher does not have to know storage layout.
  //
  // Listener lifecycle: bind ONE delegated click listener per container,
  // store the latest handlers + lookup in a WeakMap. Each bindActions call
  // overwrites the map slot — listeners never stack (the original library.js
  // / classroom.js bug stays fixed) AND tab switches that reuse the same
  // container correctly swap handlers (without this the FIRST tab's
  // closure-captured handlers would keep firing for every later tab —
  // "Removed from Favorites" on a Wishlist click, etc.).
  const _BOUND = new WeakMap();   // container -> { handlers, options }

  // Map data-action attribute -> handlers key. Keeps the rendered DOM
  // (data-action="ask-bjorn") decoupled from the JS handler name (askBjorn).
  const _ACTION_TO_HANDLER = {
    'edit':          'edit',
    'promote':       'promote',
    'discard':       'discard',
    'ask-bjorn':     'askBjorn',
    'favorite':      'favorite',
    'wishlist':      'wishlist',
    'made':          'made',
    'tweak-submit':  '__tweakSubmit',
  };

  function bindActions(container, handlers, options) {
    if (!container || typeof container.addEventListener !== 'function') return;
    handlers = handlers || {};
    options  = options  || {};
    // Always overwrite the active handlers for this container (the delegated
    // listener below reads from the WeakMap at click time, so this swap is
    // immediately effective for the next click).
    const wasBound = _BOUND.has(container);
    _BOUND.set(container, { handlers, options });
    if (wasBound) return;

    container.addEventListener('click', (event) => {
      const slot = _BOUND.get(container);
      if (!slot) return;
      const h = slot.handlers;
      const lookup = typeof slot.options.recipeById === 'function' ? slot.options.recipeById : null;

      const chipEl = event.target.closest && event.target.closest('.recipe-chip');
      if (!chipEl || !container.contains(chipEl)) return;
      const recipeId = chipEl.getAttribute('data-id') || '';
      const recipe = lookup ? lookup(recipeId, chipEl) : { id: recipeId };
      if (!recipe) return;

      const actionEl = event.target.closest && event.target.closest('[data-action]');
      if (actionEl && chipEl.contains(actionEl)) {
        const action = actionEl.getAttribute('data-action');
        const handlerName = _ACTION_TO_HANDLER[action];
        if (handlerName === '__tweakSubmit') {
          const panel = actionEl.closest('[data-tweak-panel]');
          const input = panel && panel.querySelector('[data-tweak-input]');
          const prompt = input ? String(input.value || '').trim() : '';
          if (typeof h.tweak === 'function') {
            event.stopPropagation();
            h.tweak(recipe, prompt, event);
          }
          return;
        }
        if (handlerName && typeof h[handlerName] === 'function') {
          event.stopPropagation();
          h[handlerName](recipe, event);
        }
        return;
      }

      if (event.target.closest && event.target.closest('[data-tweak-panel]')) return;
      if (typeof h.body === 'function') {
        h.body(recipe, event);
      }
    });
  }

  return { render, resolveCore, filterPool, bindActions };
})();

// Expose on globalThis for node tests (vm.runInThisContext picks up `const`
// bindings as locals, not properties — explicit attach keeps tests happy).
if (typeof globalThis !== 'undefined') globalThis.RecipeChip = RecipeChip;
