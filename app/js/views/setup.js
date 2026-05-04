// Setup / GitHub config view — PAT, owner, repo, branch entry.

const SetupView = (() => {

  function render(container) {
    const cfg = GitHubAPI.cfg();

    container.innerHTML = `
      <div class="setup-card">
        <div class="setup-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 2l-1 7H5a1 1 0 0 0-1 1v1a5 5 0 0 0 5 5h6a5 5 0 0 0 5-5v-1a1 1 0 0 0-1-1h-2L16 2z"/>
            <path d="M12 15v7"/><path d="M8 22h8"/>
          </svg>
          <h1>Barkeeper Bjorn</h1>
          <p>Connect your GitHub repository to get started.</p>
        </div>

        <div class="form-group">
          <label for="cfg-token">GitHub Personal Access Token</label>
          <input type="password" id="cfg-token" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                 value="${Utils.escapeHtml(cfg.token || '')}" autocomplete="off">
          <p class="setup-help">
            Needs <strong>repo</strong> scope.
            <a href="https://github.com/settings/tokens/new?scopes=repo&description=Barkeeper+Bjorn" target="_blank" rel="noopener">
              Generate one here →
            </a>
          </p>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="cfg-owner">Repository Owner</label>
            <input type="text" id="cfg-owner" placeholder="your-username"
                   value="${Utils.escapeHtml(cfg.owner || '')}">
          </div>
          <div class="form-group">
            <label for="cfg-repo">Repository Name</label>
            <input type="text" id="cfg-repo" placeholder="barkeeper-bjorn-website"
                   value="${Utils.escapeHtml(cfg.repo || '')}">
          </div>
        </div>

        <div class="form-group">
          <label for="cfg-branch">Branch</label>
          <input type="text" id="cfg-branch" placeholder="main"
                 value="${Utils.escapeHtml(cfg.branch || 'main')}">
        </div>

        <div class="setup-divider"></div>

        <button class="btn btn-primary" id="cfg-save-btn" style="width:100%;justify-content:center;">
          Connect Repository
        </button>

        <div id="cfg-status" style="margin-top:14px;font-size:0.85rem;text-align:center;color:var(--text-dim);"></div>

        <div class="setup-divider"></div>

        <div style="font-size:0.82rem;color:var(--text-muted);">
          <strong style="color:var(--text-dim);">What this does:</strong><br>
          Your PAT is stored only in this browser's localStorage and is never sent anywhere except
          directly to the GitHub API. The app reads and writes the <code>data/*.json</code> files
          in your repository on the configured branch.
        </div>
      </div>`;

    const saveBtn = container.querySelector('#cfg-save-btn');
    const status  = container.querySelector('#cfg-status');

    saveBtn.addEventListener('click', async () => {
      const token  = container.querySelector('#cfg-token').value.trim();
      const owner  = container.querySelector('#cfg-owner').value.trim();
      const repo   = container.querySelector('#cfg-repo').value.trim();
      const branch = container.querySelector('#cfg-branch').value.trim() || 'main';

      if (!token || !owner || !repo) {
        status.textContent = 'Please fill in all required fields.';
        status.style.color = 'var(--red)';
        return;
      }

      localStorage.setItem('bb_token',  token);
      localStorage.setItem('bb_owner',  owner);
      localStorage.setItem('bb_repo',   repo);
      localStorage.setItem('bb_branch', branch);

      saveBtn.disabled = true;
      saveBtn.textContent = 'Connecting…';
      status.textContent = '';

      try {
        await GitHubAPI.validateConfig();
        status.textContent = '✓ Connected! Loading your bar…';
        status.style.color = 'var(--green)';
        setTimeout(() => { window.location.hash = '#dashboard'; }, 800);
      } catch (err) {
        status.textContent = `Connection failed: ${err.message}`;
        status.style.color = 'var(--red)';
        saveBtn.disabled = false;
        saveBtn.textContent = 'Connect Repository';
      }
    });
  }

  return { render };
})();
