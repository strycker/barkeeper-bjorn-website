---
phase: 02-web-ui-ux-and-settings
plan: 03
subsystem: settings
tags: [settings, iife, logout, reset, github-config]

# Dependency graph
requires:
  - phase: 02-web-ui-ux-and-settings
    provides: nav gear icon + header avatar (plan 02); onboarding skip flags (plan 01)
provides:
  - SettingsView IIFE module with 4 sections (Bartender Identity, GitHub Connection, Account, Danger Zone)
  - Bartender identity save via State.patch + State.save to barkeeper.json
  - GitHub connection save writes localStorage + dispatches bb:reset-data
  - Logout using .confirm-dialog CSS (not window.confirm()); dynamic bb_* key enumeration; redirect to #setup
  - Reset all data: two-click reveal; 4 sequential State.save() calls; GitHub credentials preserved
  - settings.js script tag in index.html; case 'settings' router in app.js

key-files:
  created:
    - "app/js/views/settings.js"
    - ".planning/phases/02-web-ui-ux-and-settings/02-03-SUMMARY.md"
  modified:
    - "app/index.html"
    - "app/js/app.js"

requirements-completed: [SETTINGS-01, SETTINGS-02, SETTINGS-03, SETTINGS-04, NAV-05]
---

# Phase 02 Plan 03: Settings Page

**Created `app/js/views/settings.js` as an IIFE module with four sections, wired it into index.html (script tag) and app.js (router case).**

## Accomplishments

- SettingsView IIFE module created with 4 sections matching UI-SPEC copywriting contract
- Bartender Identity (SETTINGS-01): name + voice preset fields; save via State.patch('barkeeper') + State.save; toast on success
- GitHub Connection (SETTINGS-02): token/owner/repo/branch fields pre-filled from localStorage; save validates via GitHubAPI.validateConfig(); dispatches bb:reset-data on success
- Account / Logout (SETTINGS-03): CSS-based confirm dialog (.confirm-dialog-overlay / .confirm-dialog); dynamic `Object.keys(localStorage).filter(k => k.startsWith('bb_'))` enumeration; redirect to #setup
- Danger Zone / Reset (SETTINGS-04): two-click reveal (#st-reset-state-1 → #st-reset-state-2); 4 sequential `await State.save()` calls; GitHub credentials preserved; toast + redirect to #dashboard
- index.html: `<script src="js/views/settings.js">` inserted before app.js
- app.js: `case 'settings': SettingsView.render(content); break;` added to router

## Key Decisions

- Sequential saves in reset: each `await State.save()` completes before the next — prevents 409 SHA conflicts on GitHub API
- Dynamic logout key enumeration: never hard-coded list — catches any future bb_* keys automatically
- window.confirm() explicitly prohibited — .confirm-dialog CSS used throughout (matches existing UX pattern)
- settings.js created before script tag added — prevents "missing file breaks all JS" failure

---

*Phase: 02-web-ui-ux-and-settings*
*Completed: 2026-05-12*
