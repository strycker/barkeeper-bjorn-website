// Library view (#library) — user-curated external links (LIB-01, D-13).
// CRUD over State.get('library').links, persisted to data/library.json via
// State.patch('library', ...) + State.save('library') (the 6th State file).
//
// Security (T-07-17): URLs are sanitized through _safeHref — only http(s)
// becomes a clickable <a>; anything else (javascript:, data:, vbscript:, …)
// renders as escaped plain text, never as an href. All user-supplied fields
// (title, description, tags, and the displayed URL) are escaped via
// Utils.escapeHtml before innerHTML (Pitfall 3, XSS).
//
// Ask-Bjorn (AI-07): per-link button gated by ClaudeAPI.getKey(); when a key
// is present, ChatView.openDrawer({seed}) (07-03 shared drawer, D-01). This
// view contains NO direct streaming or messages-API calls — it only seeds
// the shared drawer (gate enforces zero direct API usage in this view).

const LibraryView = (() => {

  // Per-render UI state: which link index (if any) is being edited.
  let _editIndex = -1;

  // Track which container we've bound delegated click/submit listeners on.
  // render() is called many times per session (initial mount, after every
  // edit-toggle / cancel / add / remove / update); rebinding on every call
  // would stack listeners on the same container so each click fires N times
  // and `splice(idx, 1)` runs N times, deleting unrelated rows.
  let _boundContainer = null;

  // ── URL sanitization (T-07-17) ─────────────────────────────────────────
  // Returns the URL string when it is a safe http(s) link, otherwise null.
  // Callers MUST render the URL as escaped text (not an anchor) when null.
  function _safeHref(url) {
    const u = String(url || '').trim();
    return /^https?:\/\//i.test(u) ? u : null;
  }

  function _noKey() {
    return typeof ClaudeAPI === 'undefined' || ClaudeAPI.getKey() === '';
  }

  // Build a per-link seed for the drawer. The seed string goes to the model,
  // not innerHTML — but values are still kept plain (no markup).
  function _buildSeed(link) {
    const title = link.title || link.url || '(untitled)';
    const url   = link.url   || '';
    const desc  = link.description ? (': ' + link.description) : '';
    return 'Tell me about this resource I bookmarked: "' + title + '" (' + url + ')' + desc +
           '. How does it relate to my bar and tastes?';
  }

  // Split a comma-separated tag string into a clean array.
  function _parseTags(s) {
    return String(s || '')
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
  }

  // ── Renderers ──────────────────────────────────────────────────────────

  function _renderLinkCard(link, idx) {
    const safeUrl  = _safeHref(link.url);
    const titleEsc = Utils.escapeHtml(link.title || link.url || '(untitled)');
    const urlEsc   = Utils.escapeHtml(link.url || '');
    const descEsc  = Utils.escapeHtml(link.description || '');
    const tags     = Array.isArray(link.tags) ? link.tags : [];

    let titleHtml;
    if (safeUrl) {
      titleHtml = '<a class="library-link" href="' + Utils.escapeHtml(safeUrl) +
                  '" target="_blank" rel="noopener noreferrer">' + titleEsc + '</a>';
    } else {
      // Unsafe scheme (javascript:, data:, …) — render as escaped plain text,
      // NEVER as a clickable href (T-07-17).
      titleHtml = '<span class="library-link library-link--unsafe" title="non-http(s) link rendered as text">' +
                  titleEsc + '</span>';
    }

    let tagsHtml = '';
    if (tags.length) {
      tagsHtml = '<div class="library-tags">' +
        tags.map(t => '<span class="library-tag">' + Utils.escapeHtml(t) + '</span>').join('') +
        '</div>';
    }

    return '' +
      '<article class="library-card" data-index="' + idx + '">' +
        '<div class="library-card-head">' +
          '<h3 class="library-card-title">' + titleHtml + '</h3>' +
          '<div class="library-card-actions">' +
            '<button type="button" class="btn btn-ghost btn-sm library-ask" data-index="' + idx + '">Ask Bjorn about this</button>' +
            '<button type="button" class="btn btn-ghost btn-sm library-edit" data-index="' + idx + '">Edit</button>' +
            '<button type="button" class="btn btn-ghost btn-sm library-remove" data-index="' + idx + '">Remove</button>' +
          '</div>' +
        '</div>' +
        '<div class="library-card-url">' + urlEsc + '</div>' +
        (descEsc ? '<p class="library-card-desc">' + descEsc + '</p>' : '') +
        tagsHtml +
      '</article>';
  }

  function _renderEditForm(link, idx) {
    const titleEsc = Utils.escapeHtml(link.title || '');
    const urlEsc   = Utils.escapeHtml(link.url   || '');
    const descEsc  = Utils.escapeHtml(link.description || '');
    const tagsEsc  = Utils.escapeHtml((link.tags || []).join(', '));
    return '' +
      '<article class="library-card library-card--editing" data-index="' + idx + '">' +
        '<form class="library-form library-form--edit" data-index="' + idx + '">' +
          '<label>URL <input type="url" name="url" required value="' + urlEsc + '" placeholder="https://example.com"></label>' +
          '<label>Title <input type="text" name="title" value="' + titleEsc + '" placeholder="optional"></label>' +
          '<label>Description <textarea name="description" rows="2" placeholder="optional">' + descEsc + '</textarea></label>' +
          '<label>Tags <input type="text" name="tags" value="' + tagsEsc + '" placeholder="comma, separated"></label>' +
          '<div class="library-form-actions">' +
            '<button type="submit" class="btn btn-primary btn-sm">Save</button>' +
            '<button type="button" class="btn btn-ghost btn-sm library-edit-cancel">Cancel</button>' +
          '</div>' +
        '</form>' +
      '</article>';
  }

  function _renderAddForm() {
    return '' +
      '<form class="library-form library-form--add" id="library-add-form">' +
        '<h2>Add a link</h2>' +
        '<label>URL <input type="url" name="url" required placeholder="https://example.com"></label>' +
        '<label>Title <input type="text" name="title" placeholder="optional"></label>' +
        '<label>Description <textarea name="description" rows="2" placeholder="optional"></textarea></label>' +
        '<label>Tags <input type="text" name="tags" placeholder="comma, separated"></label>' +
        '<div class="library-form-actions">' +
          '<button type="submit" class="btn btn-primary">Add link</button>' +
        '</div>' +
      '</form>';
  }

  // ── Render ─────────────────────────────────────────────────────────────

  function render(container) {
    const lib   = (State.get('library') || { links: [] });
    const links = Array.isArray(lib.links) ? lib.links : [];

    let html = '<div class="library-page">';
    html += '<header class="library-header">';
    html += '<h1>Library</h1>';
    html += '<p class="library-sub">Bookmark external articles, recipe pages, videos — anything you want to come back to. Ask Bjorn how a saved link relates to your bar (requires API key).</p>';
    html += '</header>';

    html += _renderAddForm();

    html += '<div class="library-list">';
    if (!links.length) {
      html += '<p class="library-empty">No links saved yet. Add your first one above.</p>';
    } else {
      links.forEach((link, idx) => {
        html += (idx === _editIndex) ? _renderEditForm(link, idx) : _renderLinkCard(link, idx);
      });
    }
    html += '</div>';
    html += '</div>';
    container.innerHTML = html;

    // ── Add form submit ────────────────────────────────────────────────
    const addForm = container.querySelector('#library-add-form');
    if (addForm) {
      addForm.addEventListener('submit', e => {
        e.preventDefault();
        const fd = new FormData(addForm);
        const url = String(fd.get('url') || '').trim();
        if (!url) { Utils.showToast('URL is required.', 'error'); return; }
        const newLink = {
          url,
          title:       String(fd.get('title') || '').trim(),
          description: String(fd.get('description') || '').trim(),
          tags:        _parseTags(fd.get('tags')),
        };
        State.patch('library', l => {
          if (!Array.isArray(l.links)) l.links = [];
          l.links.push(newLink);
          l.last_updated = Utils.today();
        });
        State.save('library')
          .then(() => { Utils.showToast('Link added.'); render(container); })
          .catch(err => Utils.showToast('Save failed: ' + (err && err.message || err), 'error', 5000));
      });
    }

    // ── Delegated card actions (edit / cancel-edit / remove / ask) ─────
    // Bind ONCE per container — see _boundContainer note at top of module.
    if (_boundContainer === container) return;
    container.addEventListener('click', e => {
      const editBtn   = e.target.closest('.library-edit');
      const cancelBtn = e.target.closest('.library-edit-cancel');
      const removeBtn = e.target.closest('.library-remove');
      const askBtn    = e.target.closest('.library-ask');

      if (editBtn) {
        _editIndex = parseInt(editBtn.dataset.index, 10);
        render(container);
        return;
      }

      if (cancelBtn) {
        _editIndex = -1;
        render(container);
        return;
      }

      if (removeBtn) {
        const idx = parseInt(removeBtn.dataset.index, 10);
        const cur = (State.get('library') || {}).links || [];
        const target = cur[idx];
        if (!target) return;
        if (!confirm('Remove this link?\n\n' + (target.title || target.url))) return;
        State.patch('library', l => {
          if (Array.isArray(l.links)) l.links.splice(idx, 1);
          l.last_updated = Utils.today();
        });
        _editIndex = -1;
        State.save('library')
          .then(() => { Utils.showToast('Link removed.'); render(container); })
          .catch(err => Utils.showToast('Save failed: ' + (err && err.message || err), 'error', 5000));
        return;
      }

      if (askBtn) {
        const idx = parseInt(askBtn.dataset.index, 10);
        const cur = (State.get('library') || {}).links || [];
        const link = cur[idx];
        if (!link) return;
        if (_noKey()) {
          Utils.showToast('Unlock by adding your Anthropic API key in Settings.');
          return;
        }
        if (typeof ChatView === 'undefined' || typeof ChatView.openDrawer !== 'function') {
          Utils.showToast('Chat is not available right now.', 'error');
          return;
        }
        ChatView.openDrawer({ seed: _buildSeed(link) });
        return;
      }
    });

    // ── Edit form submit (delegated) ───────────────────────────────────
    container.addEventListener('submit', e => {
      const form = e.target.closest('.library-form--edit');
      if (!form) return;
      e.preventDefault();
      const idx = parseInt(form.dataset.index, 10);
      const fd = new FormData(form);
      const url = String(fd.get('url') || '').trim();
      if (!url) { Utils.showToast('URL is required.', 'error'); return; }
      const updated = {
        url,
        title:       String(fd.get('title') || '').trim(),
        description: String(fd.get('description') || '').trim(),
        tags:        _parseTags(fd.get('tags')),
      };
      State.patch('library', l => {
        if (!Array.isArray(l.links)) l.links = [];
        l.links[idx] = updated;
        l.last_updated = Utils.today();
      });
      _editIndex = -1;
      State.save('library')
        .then(() => { Utils.showToast('Link updated.'); render(container); })
        .catch(err => Utils.showToast('Save failed: ' + (err && err.message || err), 'error', 5000));
    });

    // Mark this container as bound so subsequent render() calls skip the
    // delegated-listener block above (see _boundContainer note at top).
    _boundContainer = container;
  }

  return { render };
})();
