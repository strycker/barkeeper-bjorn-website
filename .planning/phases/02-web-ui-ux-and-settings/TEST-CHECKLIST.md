# Phase 2 — Manual Smoke-Test Checklist

**Phase:** 2 — Web UI UX & Settings
**Created:** 2026-05-12
**Status:** Ready to use

## How to Run

```bash
python3 -m http.server 8000
# then open http://localhost:8000/app/
```

Use Chrome/Firefox DevTools → Application → Local Storage to inspect `localStorage` keys.

---

## Section 1 — ROADMAP Success Criteria

### SC-1: Skip-and-return flow (ONB-01)

1. Clear all `bb_*` localStorage keys (DevTools → Application → Local Storage → select `localhost:8000` → right-click each `bb_*` key → delete).
2. Navigate to `#setup`, complete the GitHub connection (PAT, owner, repo, branch).
3. Navigate to `#onboarding`. Confirm you see the Welcome step (step 1).
4. Click "Continue →" to advance to step 2 (`bartender_name`).
5. Click "Skip for now →" on the bartender name step.
6. Verify: step counter advances to step 3; the step is skipped without an error.
7. Continue clicking "Continue →" (or "Skip for now →") through all remaining steps until you reach the `done` step.
8. Navigate to `#dashboard`.
9. Verify: a progress banner is visible above the stats bar with text containing "incomplete" or "Finish setup".
10. Click the "Finish setup →" link in the banner.
11. Verify: you land on the `bartender_name` step (the first skipped step), NOT the `welcome` step.

**Pass:** Banner visible; "Finish setup →" returns to first skipped step.

---

### SC-2: Flavor axis sliders (ONB-02)

1. Navigate to `#onboarding`, advance past steps 1–9 to step 10 (`axis_sweetness`).
2. Verify: an `<input type="range">` slider renders (not radio buttons, A/B/C cards, or text inputs).
3. Verify: left pole label is visible (e.g., "Dry / bone-dry").
4. Verify: right pole label is visible (e.g., "Sweet / balanced").
5. Verify: a "Middle" label or tick mark is visible at the center of the slider track.
6. Drag the slider to a non-center position (e.g., toward the right).
7. Click "Continue →". Repeat for the remaining axis steps (acid, strength, complexity, season, risk).
8. Complete onboarding through `done`.
9. Navigate to `#profile`.
10. Verify: the sweetness axis shows a float value (0.0–1.0), not the string "Middle".

**Pass:** Slider renders; float saved; no "Middle" string in profile.

---

### SC-3: Bjorn avatar in header and onboarding welcome (NAV-01, NAV-03)

1. With GitHub configured (owner + repo set in localStorage), navigate to `#onboarding`.
2. Verify: step 1 (`welcome`) shows a Bjorn avatar image (circular crop, amber border).
3. Verify: a caption below the avatar reads something like "I'm Barkeeper Bjorn. Let's make your bar legendary."
4. Navigate to `#dashboard` (complete onboarding or navigate directly).
5. Verify: the header title bar shows a small circular avatar image (barkeeper_bjorn_icon.png) beside the app name or bartender name text.
6. Verify: if the image fails to load (e.g., wrong repo), a fallback SVG icon is shown instead (no broken-image icon).

**Pass:** Avatar visible on welcome step with caption; small icon in header; fallback SVG on 404.

---

### SC-4: Settings page via nav gear icon (NAV-05, SETTINGS-01–04)

1. With GitHub configured, verify the top nav shows a gear icon (⚙) or "Settings" link. The "Setup" link should be hidden.
2. Click the gear icon. Verify the URL becomes `#settings`.
3. Verify the Settings page shows 4 sections:
   - **Bartender Identity** — with name and voice preset fields
   - **GitHub Connection** — with PAT, owner, repo, branch fields
   - **Account** — with a "Log out" button
   - **Danger Zone** — with a "Reset all data" button
4. In **Bartender Identity**, change the bartender name to "Test Bartender", click "Update bartender settings".
5. Verify: a success toast appears; navigate to `#dashboard` and verify the bartender name has updated.
6. Return to `#settings`. In **Account**, click "Log out".
7. Verify: a confirmation dialog appears with "Log out" and "Stay logged in" buttons.
8. Click "Stay logged in". Verify: nothing changes; you remain on `#settings`.
9. Click "Log out" again, then confirm with "Log out".
10. Verify: all `bb_*` localStorage keys are cleared (DevTools → Application → Local Storage).
11. Verify: you are redirected to `#setup`.
12. Re-configure GitHub connection, return to `#settings`.
13. In **Danger Zone**, click "Reset all data".
14. Verify: a warning and "Yes, delete everything" button appear (two-click reveal).
15. Click "Yes, delete everything".
16. Verify: profile/inventory/recipes/barkeeper data reverts to defaults.
17. Verify: `bb_token`, `bb_owner`, `bb_repo`, `bb_branch` localStorage keys are still present.

**Pass:** Gear icon present; Settings has 4 sections; logout clears bb_* keys; reset preserves credentials.

---

### SC-5: Inventory real-time search and category filter (INV-01, INV-02)

1. Navigate to `#inventory` (ensure you have at least some inventory items saved).
2. Verify: a search input ("Search inventory…" placeholder) is visible above the inventory content.
3. Verify: a category dropdown ("All categories" default) is visible beside or below the search input.
4. Type "bourbon" in the search input (without pressing Enter).
5. Verify: only chips containing "bourbon" (case-insensitive) remain visible; other chips are hidden.
6. Verify: section headers whose entire section has 0 visible chips are also hidden.
7. Verify: no page reload occurred (check browser's network tab — no full document request).
8. Clear the search field.
9. Verify: all chips reappear.
10. Open the category dropdown and select a category (e.g., "Whiskey" or first available option).
11. Verify: the page smooth-scrolls to that section header (not an instant jump).
12. Verify: all sections remain visible after the scroll (no sections hidden).

**Pass:** Real-time search filters chips; empty search restores all; dropdown smooth-scrolls to section.

---

## Section 2 — Per-Requirement Detail Tests

| Req ID | Test action | Expected result |
|--------|-------------|-----------------|
| ONB-01 | On every step in the onboarding wizard, verify a "Skip for now →" link is present | Link visible on every step except `welcome` and `done`; clicking it advances the wizard and stores `_skipped: true` |
| ONB-02 | Navigate to steps 10–15 (axis_sweetness through axis_risk) | Each step renders `<input type="range">` with left label, right label, and "Middle" center label; no radio buttons or option cards |
| ONB-03 | Start onboarding from welcome step; step 2 must be bartender name | Step 2 heading reads "What should I call myself?" or similar; bartender-name input visible |
| ONB-04 | Navigate to step 9 (`inventory_paste`) | Textarea for comma-separated input visible; typing "Bourbon, Rum" and tabbing away shows chip preview; "Looks good →" saves chips |
| NAV-01 | After GitHub config, navigate to any view | Header shows `img.header-avatar` or similar circular image; `src` contains `raw.githubusercontent.com`; on image error, SVG fallback shown |
| NAV-02 | Navigate to `#dashboard` as a returning user | `.dash-hero` section with a Bjorn hero image (barkeeper_bjorn_002.png) visible above the greeting/stats bar |
| NAV-03 | Navigate to `#onboarding`, observe step 1 | Avatar image renders in `.wizard-avatar-wrap`; caption text visible below image |
| NAV-04 | Navigate to `#dashboard`, observe quick-action grid | Exactly 7 cards in the grid; 2 cards have `.menu-item--disabled` or equivalent; clicking a disabled card shows a toast about Anthropic API key |
| NAV-05 | Without GitHub config: nav shows "Setup" link; after config: nav shows gear icon | `#nav-setup-link` hidden post-config; `#nav-settings-link` (or gear icon `<a>`) links to `#settings` |
| SETTINGS-01 | In Settings → Bartender Identity, rename and change voice preset → save | Toast confirms save; `barkeeper.json` `identity.name` updated; header reflects new name |
| SETTINGS-02 | In Settings → GitHub Connection, verify fields pre-filled from localStorage | PAT masked with asterisks; owner/repo/branch pre-filled; saving updates `bb_*` localStorage keys |
| SETTINGS-03 | In Settings → Account, click "Log out" and confirm | All `bb_*` keys removed from localStorage; redirect to `#setup` |
| SETTINGS-04 | In Settings → Danger Zone, click "Reset all data" | Warning + "Yes, delete everything" appears on first click; second click resets profile/inventory/recipes/barkeeper; `bb_token`/`bb_owner`/`bb_repo`/`bb_branch` preserved |
| INV-01 | With inventory items present, type in search input | Chips filter in real-time (no reload); irrelevant chips hidden; clearing restores all |
| INV-02 | Select a category from the dropdown | `scrollIntoView({ behavior: 'smooth' })` fires; page scrolls to section header; no navigation occurs |

---

## Section 3 — Regression Guard

1. Navigate to each route and verify no JS console errors:
   - `#dashboard`
   - `#inventory`
   - `#recipes`
   - `#profile`
   - `#recommender`
   - `#shopping`
   - `#settings`
   - `#onboarding`

2. Verify `#setup` is still accessible via Settings → "Change GitHub connection →" link.

3. After completing inventory paste in onboarding, check `data/inventory.json` in the GitHub repo (or DevTools network tab):
   - Verify parsed items appear in the `unassigned` array at the top level of `inventory.json`.
   - Verify no `inventory.spirits` flat array was created.

4. Verify the recommender still works after onboarding with slider values:
   - Navigate to `#recommender` and trigger a recommendation.
   - Verify it returns results without JS errors.

---

## Checklist Sign-Off

- [ ] SC-1 pass (skip-and-return)
- [ ] SC-2 pass (flavor axis sliders)
- [ ] SC-3 pass (Bjorn avatar header + welcome)
- [ ] SC-4 pass (Settings page + logout + reset)
- [ ] SC-5 pass (inventory search + category filter)
- [ ] All regression routes load without console errors
- [ ] Inventory paste writes to `unassigned`, not `spirits`
- [ ] Recommender still works after onboarding

**Tested by:** _______________  **Date:** _______________
