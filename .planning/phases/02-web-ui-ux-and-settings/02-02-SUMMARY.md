---
phase: 02-web-ui-ux-and-settings
plan: 02
subsystem: dashboard-nav
tags: [dashboard, nav, avatar, hero-image, progress-banner, grid]

# Dependency graph
requires:
  - phase: 02-web-ui-ux-and-settings
    provides: TEST-CHECKLIST.md (plan 00)
provides:
  - Header avatar (barkeeper_bjorn_icon.png, 28×28 circle) visible post-GitHub-config
  - Dashboard hero image (barkeeper_bjorn_002.png) above greeting in returning-user view
  - Dashboard progress banner when profile.onboarding_complete is absent/false
  - 7-item dashboard grid (5 active + 2 disabled with "Coming soon" badges)
  - Nav gating: Settings gear icon shown post-config; Setup link hidden post-config
  - Toast on disabled card click

key-files:
  created:
    - ".planning/phases/02-web-ui-ux-and-settings/02-02-SUMMARY.md"
  modified:
    - "app/js/views/dashboard.js"
    - "app/js/app.js"
    - "app/index.html"
    - "app/css/app.css"

requirements-completed: [NAV-01, NAV-02, NAV-04, NAV-05]
---

# Phase 02 Plan 02: Dashboard Hero + Avatar + Nav Gating

**Added Bjorn avatar to the header, dashboard hero image, progress banner, and 7-item quick-action grid. Wired nav gating (Setup vs. gear icon) in app.js. Added the Settings nav link and header avatar img to index.html.**

## Accomplishments

- Header avatar (NAV-01): `<img id="header-avatar" class="header-avatar">` added to index.html; app.js updateNav() sets src from GitHubAPI.cfg() at render time; onerror hides img; onload shows img
- Dashboard hero (NAV-02): `.dash-hero` div with barkeeper_bjorn_002.png inserted before greeting in returning-user branch; collapses on image error
- Progress banner: shown when `profile.onboarding_complete` is absent/false with "Your profile is incomplete — Finish setup →" link
- 7-item grid (NAV-04): 2 new disabled cards ("Chat with Bjorn", "Classroom") appended to existing 5-item grid; `.menu-item--disabled` + `.coming-soon-badge`; click fires toast
- Nav gating (NAV-05): updateNav() extended to toggle `#nav-setup-link` (hidden post-config) and `#nav-settings-link` (visible post-config); `<a href="#settings" id="nav-settings-link">` added to index.html; settings.js script tag and router case deferred to Plan 03
- New CSS: .dash-hero, .dash-hero-img, .dash-progress-banner, .banner-text, .banner-cta, .menu-item--disabled, .coming-soon-badge, .header-avatar, responsive .menu-grid media queries

## Key Decisions

- settings.js script tag and `case 'settings'` router entry intentionally omitted — added in Plan 03 after settings.js file is created (missing script tag would break all JS)
- Hero image URL built from GitHubAPI.cfg() at render time — never hardcoded
- Progress banner condition is `!profile.onboarding_complete` only; full skip-flag scanning deferred as out-of-scope

---

*Phase: 02-web-ui-ux-and-settings*
*Completed: 2026-05-12*
