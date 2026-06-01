// RecipeChip — single canonical renderer for every recipe chip in the app.
//
// Part of the Chip Unification mini-phase (see .planning/chip-unification-plan.md).
// Commit 2 of 3 — ships the renderer + view rewrites. Click-to-render,
// AI-tweak input on every chip, and lock-seeded-core write enforcement are
// deferred to Commit 3.
//
// All chips share the same markup so visual / behavioral parity is enforced
// by construction rather than copy-paste discipline. Callers wire delegated
// click handlers off the rendered DOM via data-action attributes; this module
// does NOT bind events (commit 3 will introduce a shared bindActions helper).
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
    if (!seedId || typeof globalThis === 'undefined') return null;
    const db = globalThis.CLASSICS_DB;
    if (!Array.isArray(db)) return null;
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

  // Status badge HTML (color variant per status — see app.css additions).
  function _statusBadge(status) {
    const cls = status === 'classic'  ? 'badge--status-classic'
              : status === 'original' ? 'badge--status-original'
              : status === 'draft'    ? 'badge--status-draft'
              : '';
    if (!cls) return '';
    return `<span class="badge badge-status ${cls}">${_esc(status)}</span>`;
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
    if (actions.discard) {
      out.push('<button class="btn-icon" data-action="discard" title="Discard">&#10005;</button>');
    }
    return out.join('');
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

    return `<article class="recipe-chip rec-card" data-id="${_esc(id)}" data-status="${_esc(status)}">`
      + `<header class="recipe-chip-head">`
      +   `<div class="recipe-chip-title">`
      +     `<span class="recipe-chip-name">${_esc(core.name)}</span>`
      +     _statusBadge(status)
      +     _flagsHtml(core)
      +   `</div>`
      +   `<div class="recipe-chip-meta">${_metaHtml(core)}</div>`
      + `</header>`
      + `<div class="recipe-chip-body">`
      +   taglineHtml
      +   `<div class="rec-ingredients">${_ingredientsHtml(core)}</div>`
      + `</div>`
      + footerHtml
      + `</article>`;
  }

  return { render, resolveCore, filterPool };
})();

// Expose on globalThis for node tests (vm.runInThisContext picks up `const`
// bindings as locals, not properties — explicit attach keeps tests happy).
if (typeof globalThis !== 'undefined') globalThis.RecipeChip = RecipeChip;
