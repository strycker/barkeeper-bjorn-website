// GitHub Contents API wrapper — reads/writes JSON data files via PAT auth.
// All file ops go through this module; no direct fetch calls elsewhere.

const GitHubAPI = (() => {
  const BASE = 'https://api.github.com';

  function cfg() {
    return {
      token: localStorage.getItem('bb_token'),
      owner: localStorage.getItem('bb_owner'),
      repo:  localStorage.getItem('bb_repo'),
      branch: localStorage.getItem('bb_branch') || 'main',
    };
  }

  function headers() {
    const { token } = cfg();
    return {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }

  async function request(method, path, body = null) {
    const { owner, repo } = cfg();
    const url = `${BASE}/repos/${owner}/${repo}${path}`;
    const opts = { method, headers: headers() };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res.status === 204 ? null : res.json();
  }

  // Returns { data: parsed-object, sha: string }
  async function readJSON(filePath) {
    const { branch } = cfg();
    const resp = await request('GET', `/contents/${filePath}?ref=${encodeURIComponent(branch)}`);
    const text = atob(resp.content.replace(/\n/g, ''));
    return { data: JSON.parse(text), sha: resp.sha };
  }

  // Writes JSON back to repo. sha required for updates (null for new files).
  async function writeJSON(filePath, data, sha, message) {
    const { branch } = cfg();
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
    return request('PUT', `/contents/${filePath}`, {
      message: message || `Update ${filePath} via Barkeeper Bjorn web UI`,
      content,
      sha: sha || undefined,
      branch,
    });
  }

  // Validate token and repo access — returns repo info or throws
  async function validateConfig() {
    return request('GET', '');
  }

  // Returns { rateLimit: {limit, remaining, reset} }
  async function getRateLimit() {
    const res = await fetch(`${BASE}/rate_limit`, { headers: headers() });
    const json = await res.json();
    return json.rate;
  }

  function isConfigured() {
    const { token, owner, repo } = cfg();
    return !!(token && owner && repo);
  }

  return { readJSON, writeJSON, validateConfig, getRateLimit, isConfigured, cfg };
})();
