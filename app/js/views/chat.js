// Chat view — persisted #chat page + ephemeral shared quick-ask drawer.
// Wave 2 of Phase 7. Two surfaces (D-02): the long-running #chat thread
// (persisted to localStorage.bb_chat_history, manual GitHub save, D-03) and
// the openDrawer({seed}) ephemeral overlay (in-memory only, never persisted —
// Pitfall 5). Both stream via ClaudeAPI.streamMessage with buildContext() (D-04),
// abort on lifecycle (CHAT-06), and gate on CHAT-03 when no key is present.
//
// Pitfall 3 (XSS): every streamed token, user message, and error string MUST
// be inserted via createTextNode or Utils.escapeHtml before innerHTML.

const ChatView = (() => {

  // ── Windowing constants (D-07, Claude's discretion) ─────────────────────
  const RECENT_N    = 8;   // last N turns sent verbatim
  const SUMMARIZE_T = 12;  // summarize when total turns exceed this

  // ── Page-only AbortController (drawer manages its own per-overlay) ──────
  let _pageController = null;

  // ── Gate helpers (CHAT-03) ──────────────────────────────────────────────
  function _noKey() {
    return ClaudeAPI.getKey() === '';
  }

  function _noKeyHtml() {
    return '<div class="chat-nokey">No API key. <a href="#settings">Add your Anthropic key in Settings</a> to chat with Bjorn.</div>';
  }

  // ── Persistence helpers (page only; drawer is in-memory) ────────────────
  function _loadHistory() {
    try {
      return JSON.parse(localStorage.getItem('bb_chat_history')) || { turns: [], summary: '' };
    } catch {
      return { turns: [], summary: '' };
    }
  }

  function _saveHistory(h) {
    try {
      localStorage.setItem('bb_chat_history', JSON.stringify(h));
    } catch { /* storage full — ignore */ }
  }

  // ── Windowing (D-07) ────────────────────────────────────────────────────
  // Build the messages array sent to the model: optional summary prefix +
  // last RECENT_N turns verbatim. Older turns are condensed via summary.
  function _buildMessages(turns, summary) {
    const msgs = [];
    if (summary) {
      msgs.push({ role: 'user', content: 'Conversation so far (summary): ' + summary });
    }
    const recent = turns.slice(-RECENT_N);
    for (const t of recent) {
      msgs.push({ role: t.role, content: t.content });
    }
    return msgs;
  }

  // ── One-shot summarization of older turns (D-07) ────────────────────────
  // Drawer never calls this — it's ephemeral. Page calls after each persist.
  async function _maybeSummarize(history) {
    if (!history || !Array.isArray(history.turns)) return;
    if (history.turns.length <= SUMMARIZE_T) return;
    const olderEnd = history.turns.length - RECENT_N;
    if (olderEnd <= 0) return;
    const older = history.turns.slice(0, olderEnd);
    const joined = older
      .map(t => (t.role === 'user' ? 'User: ' : 'Bartender: ') + t.content)
      .join('\n');
    try {
      const summary = await ClaudeAPI.callMessages({
        model: 'claude-haiku-4-5',
        max_tokens: 512,
        system: [{ type: 'text', text: 'Summarize this bartender conversation compactly.' }],
        messages: [{ role: 'user', content: joined }],
      });
      // Merge with any prior summary so we don't lose context across rounds.
      history.summary = history.summary
        ? (history.summary + '\n' + summary).trim()
        : summary.trim();
      _saveHistory(history);
    } catch {
      // Summarization failures are non-fatal — older turns simply stay in window.
    }
  }

  // ── Render the transcript bubbles (escaped) ─────────────────────────────
  function _renderTranscript(el, turns) {
    el.innerHTML = '';
    for (const t of turns) {
      const bubble = document.createElement('div');
      const role = t.role === 'assistant' ? 'bot' : (t.role === 'error' ? 'error' : 'user');
      bubble.className = 'chat-bubble chat-bubble--' + role;
      // Escape the persisted content before innerHTML (Pitfall 3).
      bubble.innerHTML = Utils.escapeHtml(t.content || '');
      el.appendChild(bubble);
    }
    el.scrollTop = el.scrollHeight;
  }

  // ── Shared send path used by both page (persist:true) and drawer (false) ─
  async function _send({ text, turns, summary, transcriptEl, persist, history }) {
    const userText = (text || '').trim();
    if (!userText) return;

    // 1. Append the user turn and render (escaped).
    turns.push({ role: 'user', content: userText });
    _renderTranscript(transcriptEl, turns);
    if (persist) {
      history.turns = turns;
      _saveHistory(history);
    }

    // 2. AbortController per request; the page tracks the latest in module scope.
    const controller = new AbortController();
    if (persist) _pageController = controller;

    // 3. Build the empty assistant bubble (streamed tokens append as text nodes).
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble chat-bubble--bot';
    transcriptEl.appendChild(bubble);
    transcriptEl.scrollTop = transcriptEl.scrollHeight;

    // 4. Stream via the 07-01 primitive with the cached system context.
    const body = {
      model: ClaudeAPI.getModel(),
      max_tokens: 1024,
      system: ClaudeAPI.buildContext(),
      messages: _buildMessages(turns, summary),
    };

    let assistantText = '';
    try {
      await ClaudeAPI.streamMessage(body, {
        onText: t => {
          assistantText += t;
          // Append as a text node — never raw innerHTML (Pitfall 3).
          bubble.appendChild(document.createTextNode(t));
          transcriptEl.scrollTop = transcriptEl.scrollHeight;
        },
        signal: controller.signal,
      });
      turns.push({ role: 'assistant', content: assistantText });
      if (persist) {
        history.turns = turns;
        _saveHistory(history);
        // After persist, condense older turns if we crossed the threshold.
        _maybeSummarize(history);
      }
    } catch (err) {
      // AbortError on cleanup/drawer-close — silently drop the partial bubble.
      if (err && (err.name === 'AbortError' || /aborted/i.test(err.message || ''))) {
        bubble.remove();
        return;
      }
      // 429 / SSE error / network — surface as an error bubble (CHAT-08/09).
      bubble.remove();
      const errMsg = (err && err.message) || String(err);
      turns.push({ role: 'error', content: errMsg });
      _renderTranscript(transcriptEl, turns);
      if (persist) {
        history.turns = turns;
        _saveHistory(history);
      }
      Utils.showToast(errMsg, 'error', 5000);
    } finally {
      if (persist && _pageController === controller) _pageController = null;
    }
  }

  // ── Save the persisted thread to GitHub (D-03) ──────────────────────────
  async function _saveToGitHub() {
    const history = _loadHistory();
    if (!history.turns || !history.turns.length) {
      Utils.showToast('Nothing to save yet.', 'error');
      return;
    }
    // L-4 polish: append a 4-char random suffix so two same-ms saves do not collide.
    const path = 'data/conversations/chat-' + Date.now() + '-' +
                 Math.random().toString(36).slice(2, 6) + '.json';
    try {
      await GitHubAPI.writeJSON(path, history, null, 'chat: save conversation');
      Utils.showToast('Conversation saved to GitHub.');
    } catch (err) {
      Utils.showToast('Save failed: ' + (err && err.message || err), 'error', 5000);
    }
  }

  // ── Page render (persisted #chat) ───────────────────────────────────────
  function render(container) {
    // Cancel any in-flight stream from a previous render before re-binding.
    if (_pageController) { try { _pageController.abort(); } catch {} _pageController = null; }

    if (_noKey()) {
      container.innerHTML = _noKeyHtml();
      return;
    }

    const bk = (typeof State !== 'undefined' && State.get && State.get('barkeeper')) || {};
    const bkName = (bk.identity && bk.identity.name) || bk.name || 'Bjorn';

    container.innerHTML = `
      <div class="chat-page">
        <header class="chat-header">
          <h1>Chat with ${Utils.escapeHtml(bkName)}</h1>
          <div class="chat-actions">
            <button class="btn btn-ghost btn-sm" id="chat-save">Save conversation to GitHub</button>
            <button class="btn btn-ghost btn-sm" id="chat-clear">Clear conversation</button>
          </div>
        </header>
        <div class="chat-transcript" id="chat-transcript" aria-live="polite"></div>
        <div class="chat-composer">
          <textarea id="chat-input" rows="2" placeholder="Ask ${Utils.escapeHtml(bkName)} for a drink, a tweak, a story…"></textarea>
          <button class="btn btn-primary" id="chat-send">Send</button>
        </div>
      </div>
    `;

    const transcriptEl = container.querySelector('#chat-transcript');
    const inputEl      = container.querySelector('#chat-input');
    const sendBtn      = container.querySelector('#chat-send');
    const clearBtn     = container.querySelector('#chat-clear');
    const saveBtn      = container.querySelector('#chat-save');

    // Resume the prior thread.
    const history = _loadHistory();
    _renderTranscript(transcriptEl, history.turns);

    sendBtn.addEventListener('click', () => {
      const text = inputEl.value;
      inputEl.value = '';
      _send({
        text,
        turns: history.turns,
        summary: history.summary,
        transcriptEl,
        persist: true,
        history,
      });
    });

    // Enter to send, Shift+Enter for newline.
    inputEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendBtn.click();
      }
    });

    clearBtn.addEventListener('click', () => {
      if (!confirm('Clear the conversation? This cannot be undone.')) return;
      localStorage.removeItem('bb_chat_history');
      history.turns = [];
      history.summary = '';
      _renderTranscript(transcriptEl, []);
    });

    saveBtn.addEventListener('click', _saveToGitHub);
  }

  // ── Ephemeral drawer (shared quick-ask, D-01/D-02) ──────────────────────
  // openDrawer({seed}) builds an overlay with an in-memory conversation that
  // is NEVER persisted to bb_chat_history (Pitfall 5). Closing aborts any
  // in-flight stream.
  function openDrawer({ seed } = {}) {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-dialog-overlay';

    if (_noKey()) {
      overlay.innerHTML = `
        <div class="confirm-dialog chat-drawer">
          <h3>Quick ask</h3>
          ${_noKeyHtml()}
          <div class="dialog-btns">
            <button class="btn btn-ghost btn-sm" id="dlg-cancel">Close</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      overlay.querySelector('#dlg-cancel').addEventListener('click', () => overlay.remove());
      overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
      return;
    }

    overlay.innerHTML = `
      <div class="confirm-dialog chat-drawer">
        <h3>Quick ask Bjorn</h3>
        <div class="chat-transcript chat-transcript--drawer" id="drawer-transcript" aria-live="polite"></div>
        <div class="chat-composer">
          <textarea id="drawer-input" rows="2" placeholder="Ask anything — this won't be saved."></textarea>
          <div class="dialog-btns">
            <button class="btn btn-ghost btn-sm" id="dlg-cancel">Close</button>
            <button class="btn btn-primary btn-sm" id="drawer-send">Send</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    // In-memory conversation only — drawer is ephemeral (D-01/Pitfall 5).
    const turns = [];
    let drawerController = null;
    const transcriptEl = overlay.querySelector('#drawer-transcript');
    const inputEl      = overlay.querySelector('#drawer-input');
    const sendBtn      = overlay.querySelector('#drawer-send');
    const cancelBtn    = overlay.querySelector('#dlg-cancel');

    function closeOverlay() {
      if (drawerController) { try { drawerController.abort(); } catch {} drawerController = null; }
      overlay.remove();
    }

    async function send(text) {
      const t = (text || '').trim();
      if (!t) return;
      // Wrap _send so we can track this overlay's controller for close-abort.
      // The shared _send already creates its own controller; we shadow it here
      // by intercepting via a small inline sender that mirrors _send semantics
      // but stays attached to this overlay's lifecycle.
      turns.push({ role: 'user', content: t });
      _renderTranscript(transcriptEl, turns);

      const controller = new AbortController();
      drawerController = controller;

      const bubble = document.createElement('div');
      bubble.className = 'chat-bubble chat-bubble--bot';
      transcriptEl.appendChild(bubble);
      transcriptEl.scrollTop = transcriptEl.scrollHeight;

      const body = {
        model: ClaudeAPI.getModel(),
        max_tokens: 1024,
        system: ClaudeAPI.buildContext(),
        messages: _buildMessages(turns, ''),
      };

      let assistantText = '';
      try {
        await ClaudeAPI.streamMessage(body, {
          onText: tok => {
            assistantText += tok;
            bubble.appendChild(document.createTextNode(tok));
            transcriptEl.scrollTop = transcriptEl.scrollHeight;
          },
          signal: controller.signal,
        });
        turns.push({ role: 'assistant', content: assistantText });
      } catch (err) {
        if (err && (err.name === 'AbortError' || /aborted/i.test(err.message || ''))) {
          bubble.remove();
          return;
        }
        bubble.remove();
        const errMsg = (err && err.message) || String(err);
        turns.push({ role: 'error', content: errMsg });
        _renderTranscript(transcriptEl, turns);
        Utils.showToast(errMsg, 'error', 5000);
      } finally {
        if (drawerController === controller) drawerController = null;
      }
    }

    sendBtn.addEventListener('click', () => {
      const text = inputEl.value;
      inputEl.value = '';
      send(text);
    });

    inputEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendBtn.click();
      }
    });

    cancelBtn.addEventListener('click', closeOverlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeOverlay(); });

    // Auto-send the seed prompt (no persistence).
    if (seed) {
      inputEl.value = seed;
      send(seed);
      inputEl.value = '';
    }
  }

  // ── cleanup() — called by the router when leaving #chat (CHAT-06) ───────
  // Aborts the in-flight page stream. MUST NOT mutate bb_chat_history.
  function cleanup() {
    if (_pageController) {
      try { _pageController.abort(); } catch {}
      _pageController = null;
    }
  }

  return { render, openDrawer, cleanup };
})();
