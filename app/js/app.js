// App entry point — bootstrapping, routing, and state lifecycle.

(async function App() {

  const content = document.getElementById('main-content');
  let _currentRoute = null;
  let _dataLoaded = false;

  // ─── Nav active state ─────────────────────────────────────────────

  function updateNav(route) {
    document.querySelectorAll('#main-nav a[data-route]').forEach(a => {
      a.classList.toggle('active', a.dataset.route === route);
    });
  }

  // ─── Router ───────────────────────────────────────────────────────

  function parseHash() {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    const [route, ...rest] = hash.split('/');
    return { route, params: rest.join('/') };
  }

  async function navigate(route, params = '') {
    if (!GitHubAPI.isConfigured() && route !== 'setup') {
      window.location.hash = '#setup';
      return;
    }

    if (route !== 'setup' && !_dataLoaded) {
      Utils.showLoading(content, 'Loading your bar…');
      try {
        await State.loadAll();
        _dataLoaded = true;
      } catch (err) {
        // If 404 on data files — might be fresh repo
        if (err.message.includes('Not Found') || err.message.includes('404')) {
          Utils.showError(content,
            'Could not find data files in your repository. ' +
            'Make sure the repo has a data/ directory with inventory.json, recipes.json, ' +
            'bar-owner-profile.json, and barkeeper.json.');
        } else {
          Utils.showError(content, `Failed to load data: ${err.message}`);
        }
        return;
      }
    }

    _currentRoute = route;
    updateNav(route);
    content.scrollTop = 0;

    switch (route) {
      case 'setup':
        SetupView.render(content);
        break;
      case 'dashboard':
        DashboardView.render(content);
        break;
      case 'onboarding':
        OnboardingView.render(content);
        break;
      case 'inventory':
        InventoryView.render(content);
        break;
      case 'recipes':
        RecipesView.render(content, params ? { id: params } : {});
        break;
      case 'profile':
        ProfileView.render(content);
        break;
      case 'recommender':
        RecommenderView.render(content);
        break;
      case 'shopping':
        ShoppingView.render(content);
        break;
      default:
        DashboardView.render(content);
    }
  }

  // ─── Hash change handler ─────────────────────────────────────────

  window.addEventListener('hashchange', () => {
    const { route, params } = parseHash();
    navigate(route, params);
  });

  // ─── State change listener ───────────────────────────────────────

  State.subscribe(event => {
    if (event.type === 'error') {
      Utils.showToast(`Error: ${event.error.message}`, 'error', 5000);
    }
  });

  // ─── Boot ─────────────────────────────────────────────────────────

  // Intercept all nav clicks to use hash routing cleanly
  document.getElementById('main-nav').addEventListener('click', e => {
    const link = e.target.closest('a[data-route]');
    if (!link) return;
    // Allow default hash navigation — hashchange handles the rest
  });

  // When data reloads are needed (e.g. after setup), reset flag
  document.addEventListener('bb:reset-data', () => {
    _dataLoaded = false;
  });

  // Initial route
  const { route, params } = parseHash();

  if (!GitHubAPI.isConfigured()) {
    // First time — send to setup
    window.location.hash = '#setup';
    SetupView.render(content);
    updateNav('setup');
  } else {
    navigate(route, params);
  }

})();
