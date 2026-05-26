// Classroom view (#classroom) — static reference lessons (D-13, AI-06).
// Renders fully without an API key. With a key present, each lesson exposes
// an "Ask Bjorn about this" button that seeds the shared quick-ask drawer
// (ChatView.openDrawer from 07-03 — D-01, no bespoke chat panel). AI-07.
//
// Pitfall 3 (XSS): every lesson title and body is escaped via Utils.escapeHtml
// before innerHTML. Lessons are static but defended defensively anyway.

const ClassroomView = (() => {

  // Build a compact lesson-scoped seed for the drawer (cap body at first
  // sentence, ≤200 chars). The seed text goes to the model, not innerHTML.
  function _buildSeed(lesson) {
    const body = String(lesson.body || '');
    const firstSentence = (body.split(/(?<=[.!?])\s/)[0] || body).slice(0, 200);
    return 'In the context of this lesson — "' + lesson.title + '": ' + firstSentence + ' ';
  }

  function _noKey() {
    return typeof ClaudeAPI === 'undefined' || ClaudeAPI.getKey() === '';
  }

  function render(container) {
    const topics = (typeof CLASSROOM_CONTENT !== 'undefined' && Array.isArray(CLASSROOM_CONTENT))
      ? CLASSROOM_CONTENT
      : [];

    let html = '<div class="classroom-page">';
    html += '<header class="classroom-header">';
    html += '<h1>Classroom</h1>';
    html += '<p class="classroom-sub">Reference lessons on technique, glassware, ratios, and ingredients. Open without an API key; ask Bjorn about a specific lesson once your key is set in Settings.</p>';
    html += '</header>';

    if (!topics.length) {
      html += '<p class="classroom-empty">No lessons available.</p>';
      html += '</div>';
      container.innerHTML = html;
      return;
    }

    topics.forEach((topic, ti) => {
      const topicName = Utils.escapeHtml(topic.topic || '');
      html += '<section class="classroom-topic">';
      html += '<h2>' + topicName + '</h2>';
      html += '<div class="classroom-grid">';
      (topic.lessons || []).forEach((lesson, li) => {
        const title = Utils.escapeHtml(lesson.title || '');
        const body  = Utils.escapeHtml(lesson.body  || '');
        html += '<article class="lesson-tile" data-topic="' + ti + '" data-lesson="' + li + '">';
        html += '<h3 class="lesson-tile-title">' + title + '</h3>';
        html += '<p class="lesson-tile-body">' + body + '</p>';
        html += '<button type="button" class="btn btn-ghost btn-sm lesson-ask"' +
                ' data-topic="' + ti + '" data-lesson="' + li + '">' +
                'Ask Bjorn about this</button>';
        html += '</article>';
      });
      html += '</div>';
      html += '</section>';
    });

    html += '</div>';
    container.innerHTML = html;

    // Wire Ask-Bjorn buttons (delegate via container).
    container.addEventListener('click', e => {
      const btn = e.target.closest('.lesson-ask');
      if (!btn) return;
      const ti = parseInt(btn.dataset.topic, 10);
      const li = parseInt(btn.dataset.lesson, 10);
      const topic  = topics[ti];
      const lesson = topic && topic.lessons ? topic.lessons[li] : null;
      if (!lesson) return;

      // Key-gate: if no key, surface the same affordance the dashboard uses
      // (D-25) and do not call the drawer. The drawer self-gates too, but we
      // surface the toast here so the user is not silently dropped into a
      // "no key" overlay.
      if (_noKey()) {
        Utils.showToast('Unlock by adding your Anthropic API key in Settings.');
        return;
      }

      if (typeof ChatView === 'undefined' || typeof ChatView.openDrawer !== 'function') {
        Utils.showToast('Chat is not available right now.', 'error');
        return;
      }

      ChatView.openDrawer({ seed: _buildSeed(lesson) });
    });
  }

  return { render };
})();
