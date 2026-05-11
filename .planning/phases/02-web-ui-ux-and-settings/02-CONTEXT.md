# Phase 2: Web UI UX & Settings - Context

**Gathered:** 2026-05-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Transform the first-run and returning-user web UI experience. All changes are in `app/` only — no agent markdown files, no backend, no new data schemas beyond float axis values. Specifically:

1. **Onboarding overhaul** — new step order (bartender-first), slider axes replacing A/B cards, skip-and-return from Dashboard, free-text inventory paste, resume from first skipped step.
2. **Visual identity** — Bjorn avatar images in header, onboarding welcome, and dashboard hero using existing `images/` files.
3. **Dashboard** — expanded 6-item quick-action grid including grayed-out Classroom and Chat placeholders; progress banner for incomplete onboarding.
4. **Settings page** (new) — bartender identity, GitHub config (re-exposed), logout, danger zone.
5. **Inventory search + filter** — real-time search input and category dropdown with smooth-scroll jump.

Scope: how the web app looks and behaves for the user. Not: new data capabilities (Phase 4), AI integration (Phase 5), or agent file changes (Phase 1).

</domain>

<decisions>
## Implementation Decisions

### Bjorn Avatar Images (NAV-01, NAV-02, NAV-03)

- **D-01:** All avatar images come from the existing `images/` directory — no new images need to be generated for this phase.
- **D-02:** Image assignments:
  - `images/barkeeper_bjorn_icon.png` → small icon in the main header title bar (NAV-01, always visible when configured)
  - `images/barkeeper_bjorn_001.png` → onboarding welcome step (NAV-03, with caption)
  - `images/barkeeper_bjorn_002.png` → dashboard hero background and AI/questions contexts (NAV-02)
  - `images/bar_equipment_001.png` → header graphic on Setup / install / onboarding pages (contextual header image)
- **D-03:** Images are served via raw GitHub URL: `https://raw.githubusercontent.com/{owner}/{repo}/main/images/{filename}`. The `GitHubAPI.cfg()` values provide `owner` and `repo` at runtime. Fallback: show the existing SVG cocktail icon if the image fails to load.

### Onboarding Step Order (ONB-03 + D-13 from Phase 1)

- **D-04:** Full revised step order:
  1. `welcome` — Bjorn avatar with caption
  2. `bartender_name` — "What should I call myself?" (default: "Barkeeper Bjorn")
  3. `bartender_voice` — voice preset selection (5 options)
  4. `bartender_specialty` — specialty focus (5 options)
  5. `your_name` — user's preferred name
  6. `location` — user's location
  7. `background` — bartender experience level
  8. `equipment` — bar tools on hand
  9. `inventory_paste` — free-text comma-separated inventory entry (ONB-04)
  10. `axis_sweetness` — slider
  11. `axis_acid` — slider
  12. `axis_strength` — slider
  13. `axis_complexity` — slider
  14. `axis_season` — slider
  15. `axis_risk` — slider
  16. `smoke` — supplemental smoke preference
  17. `done`

  This step order MUST match the bartender personalization step order from Phase 1 CONTEXT.md D-13 (name → voice preset → specialty focus, one question at a time).

### Skip-and-Return Behavior (ONB-01)

- **D-05:** Skip behavior per step category:

  | Step | Skip behavior |
  |---|---|
  | Bartender name | Default: `"Barkeeper Bjorn"` |
  | Bartender voice preset | Default: `"Warm & playful"` |
  | Bartender specialty | Default: `"No preference (broad and balanced)"` |
  | All 6 flavor axes + smoke | Store `_skipped: true` flag on the axis object; recommender uses midpoint default (0.5) for skipped axes |
  | Your name, location, background, equipment | Store `_skipped: true` flag; no default value set |

  **Note to planner:** The skip behavior per step is editable — this table is the decision anchor. If the user edits CONTEXT.md to change any row, honor the updated value.

- **D-06:** "Onboarding complete" = the user has reached the `done` step (regardless of how many steps were skipped). This is tracked via a flag (e.g., `profile.onboarding_complete: true`) written when the `done` step renders.

- **D-07:** The Dashboard shows a progress banner when `profile.onboarding_complete` is absent or false:
  ```
  "Your profile is incomplete — [Finish setup →]"
  ```
  The banner appears at the top of the returning-user dashboard, above the stats bar. It disappears once `onboarding_complete` is true.

- **D-08:** Clicking "Finish setup" in the banner navigates to `#onboarding` and resumes from the first step that has a `_skipped: true` flag. If no skipped steps remain, the button is hidden.

### Flavor Axis Sliders (ONB-02)

- **D-09:** Sliders store values as `0.0–1.0` float (same scale the recommender already normalizes to). "Middle" = 0.5.

- **D-10:** Slider UI shows only left and right pole labels (e.g., "Dry / bone-dry" ← → "Balanced / sweet") with a visible tick mark or label at the center labeled "Middle". No raw number is shown to the user.

- **D-11:** The recommender's `_normalizeProfile()` already handles both string and numeric `position` values (line ~88 in `recommender-engine.js`). No engine changes needed.

- **D-12:** Data migration is passive: when a user saves their profile through the new slider UI, the float value overwrites the old string. No migration script or forced conversion on load. During the transition period, the recommender reads both formats correctly.

### Free-text Inventory Paste (ONB-04)

- **D-13:** Input format: comma-separated list. Example: `"Bulleit Bourbon, Aperol, Angostura Bitters, Dry Vermouth"`. Parsing: split on comma, trim whitespace, drop empty strings.

- **D-14:** After parsing, show a chip-preview of the items before saving. User can remove any misparse from the chip list. "Looks good →" button saves all chips to `inventory.spirits` as string entries (existing format; Phase 4 upgrades to objects).

- **D-15:** Parsed items always go into `inventory.spirits`. A note in the UI: "You can add bitters, syrups, and other pantry items from the Inventory view."

### Settings Page (SETTINGS-01 to SETTINGS-04)

- **D-16:** Settings page route: `#settings`. New file: `app/js/views/settings.js`.

- **D-17:** Settings page contents in Phase 2:
  1. **Bartender identity** — rename bartender, change voice preset (SETTINGS-01)
  2. **GitHub connection** — PAT, owner, repo, branch re-exposed (mirrors Setup; SETTINGS-02 partial)
  3. **Logout** — clears all `bb_*` localStorage keys, redirects to `#setup` (SETTINGS-03)
  4. **Danger Zone** — "Reset all data" (SETTINGS-04)
  - Note: Anthropic API key section is intentionally absent in Phase 2; added in Phase 5.

- **D-18:** "Reset all data" resets only the 4 data files (profile, inventory, recipes, barkeeper). GitHub credentials (`bb_token`, `bb_owner`, `bb_repo`, `bb_branch`) are preserved. Two-click reveal pattern: first click reveals a red "Yes, delete everything" button and warning text; second click executes.

- **D-19:** "Logout" = clears all `bb_*` localStorage (including GitHub credentials), redirects to `#setup`. Requires a single confirmation toast or dialog before executing.

### Nav Bar Changes (NAV-05, Setup/Settings relationship)

- **D-20:** Before configuration (no `bb_token`): nav shows only "Setup". All other nav items are hidden.

- **D-21:** After configuration: the Setup nav link is replaced by a gear icon linking to `#settings`. All other nav items appear normally.

- **D-22:** Setup view (`#setup`) remains accessible via `#settings` → "Change GitHub connection" link. The Setup view itself is unchanged.

- **D-23:** Nav gear icon position: rightmost item, replacing the current Setup cog icon. Same visual slot, different target (`#settings` instead of `#setup`).

### Dashboard Quick-Action Grid (NAV-04)

- **D-24:** 6-item grid layout. The two Phase 5 items are included as grayed-out cards with a "Coming soon" badge:
  1. Update My Inventory → `#inventory`
  2. My Recipe List → `#recipes`
  3. Review Flavor Profile → `#profile`
  4. What Can I Make Right Now? → `#recommender` (featured)
  5. What Should I Buy Next? → `#shopping`
  6. **Chat with Bjorn** → grayed-out, badge: "Coming soon — add your Anthropic key in Settings"
  7. *Optional 7th:* **Classroom** → grayed-out, badge: "Coming soon"
  - Note to planner: NAV-04 says 6 actions. If both Chat and Classroom are added the grid becomes 7 items. Decide whether to include both or just Chat based on grid aesthetics (6 or 7 works; keep layout balanced).

- **D-25:** Clicking a grayed-out "Coming soon" card shows a toast: "Unlock by adding your Anthropic API key in Settings."

### Inventory Search + Filter (INV-01, INV-02)

- **D-26:** Real-time search: a text input at the top of the inventory view filters bottle chips across all sections simultaneously as the user types. No page reload.

- **D-27:** Category filter: a dropdown (`<select>`) above or beside the search input. Selecting a category smooth-scrolls to that section's header (`scrollIntoView({ behavior: 'smooth' })`). All sections remain visible.

### Claude's Discretion

- Exact wording of the progress banner and "Coming soon" toast messages
- Visual treatment of grayed-out dashboard cards (opacity, badge style)
- Layout of the 6/7-item dashboard grid (2×3 vs 3+3 vs other)
- Whether search input and category dropdown appear on the same row or stacked
- Avatar image sizing and styling in header vs. onboarding welcome

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase requirements
- `.planning/ROADMAP.md` §Phase 2 — 15 requirements (ONB-01–04, NAV-01–05, SETTINGS-01–04, INV-01–02), success criteria, and files touched
- `.planning/REQUIREMENTS.md` — full requirement specs if present

### Phase 1 decisions that carry forward
- `.planning/phases/01-agent-instructions-polish/01-CONTEXT.md` — D-13 locks bartender personalization step order and the 5 voice presets + 5 specialty focus options. The web UI wizard step 2 (ONB-03) MUST use the same options.

### Primary source files to modify
- `app/js/views/onboarding.js` — current wizard (443 lines); A/B card axis steps become sliders; step order restructured; skip logic + _skipped flag added; inventory paste step added
- `app/js/views/dashboard.js` — current dashboard (135 lines); add progress banner, expand grid to 6+ items, add hero image
- `app/js/views/inventory.js` — current inventory (398 lines); add search input + category dropdown
- `app/index.html` — nav bar changes (gear icon, conditional Setup link), new script tags
- `app/css/app.css` — all new styles; dark amber/bourbon theme; CSS custom properties only

### New files to create
- `app/js/views/settings.js` — Settings view (new); follow IIFE module pattern from existing views

### Architecture reference
- `.planning/codebase/ARCHITECTURE.md` — IIFE module pattern, State pub/sub, hash routing, view render contract
- `.planning/codebase/CONVENTIONS.md` — naming conventions, CSS class patterns, module pattern

### Images
- `images/barkeeper_bjorn_icon.png` — header nav icon
- `images/barkeeper_bjorn_001.png` — onboarding welcome
- `images/barkeeper_bjorn_002.png` — dashboard hero + AI contexts
- `images/bar_equipment_001.png` — setup/onboarding page header graphic

### Recommender engine (read-only, no changes)
- `app/js/recommender-engine.js` lines 79–95 — `_normalizeProfile()` already handles both string and float axis values; no changes needed for D-12

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Utils.showToast(msg)` — toast notification system; use for "Coming soon" click feedback and save confirmations
- `Utils.escapeHtml(str)` — XSS-safe HTML insertion; use in all new template strings
- `Utils.countInventoryItems(inv)` — already used in Dashboard; can be reused
- `State.patch(key, fn)` / `State.save(key, msg)` — standard write pattern; use for saving onboarding steps incrementally
- `State.isNewUser()` — checks `profile.identity.full_name`; may need to be updated or supplemented with `profile.onboarding_complete` check for the banner logic
- Existing `navButtons(body, container, opts)` helper in `onboarding.js` — add Skip button via the `skipFn` option (already wired in the helper)

### Established Patterns
- All views follow `render(container)` IIFE export — `settings.js` must follow this pattern
- Nav active-class highlighting uses `data-route` attribute on `<a>` tags — new Settings link needs `data-route="settings"`
- Hash-based routing in `app.js` switch — add `case 'settings': SettingsView.render(content); break;`
- Flavor axis float values: recommender's `_normalizeProfile()` handles `typeof pos === 'number'` directly — no conversion layer needed
- CSS custom properties for theming (`--amber`, `--bg2`, `--text-dim`, etc.) — use these in all new styles; no hardcoded colors
- BEM-influenced class naming with `--` modifiers (e.g., `.menu-item--featured`, `.rec-card--oneaway`) — follow for new component variants

### Integration Points
- `app.js` router switch: add `case 'settings'` and update nav-state logic for pre/post-configuration
- `app.js` nav rendering: current Setup link in `index.html` line 46–49 needs conditional replacement with gear/settings link once `GitHubAPI.isConfigured()` is true
- `state.js` `isNewUser()`: Dashboard currently uses this for new vs. returning user branch; the progress banner needs `profile.onboarding_complete` (a new field) — add to `State` or check inline in DashboardView
- `data/bar-owner-profile.json` — add `onboarding_complete` boolean field at top level; schema may need updating

</code_context>

<specifics>
## Specific Ideas

- The onboarding skip behavior table in D-05 is intentionally editable in this file. The planner should treat each row as a locked decision and implement exactly what the table says. If the user changes any row before planning, honor the updated value.
- "Coming soon" toast for grayed-out dashboard cards: clicking them shows a toast message pointing to Settings for the Anthropic API key. This is a forward-reference to Phase 5 — the toast message should mention Settings specifically so users know where to go.
- The progress banner (D-07) should show rough completion state. A simple "Your profile is incomplete" is fine — no need to calculate a percentage unless it's trivial to do so.
- The `barkeeper_bjorn_icon.png` is likely a square/circle icon crop. If it's a portrait/rectangular image, the planner should decide on appropriate CSS sizing/clipping for the header nav context.
- The deferred diverse-avatars idea (see Deferred section) should NOT be pre-wired — no placeholder fields, no stub code. It's purely a future consideration.

</specifics>

<deferred>
## Deferred Ideas

- **Diverse bartender avatars** — Generate additional Bjorn avatar images representing different races and genders (female, non-binary, etc.) so users can choose or upload their own bartender image during personalization (ONB-03 / SETTINGS-01 extension). Noted for a future enhancement to Phase 2 or Phase 4. No stub code in this phase.
- **Anthropic API key in Settings** — SETTINGS-02 mentions an Anthropic key field. This is intentionally omitted from Phase 2 and added in Phase 5 when the Claude API integration is built.
- **Profile view slider editing** — The Profile view (`#profile`) shows the hexagonal radar chart + flavor axes. The axes there are currently display-only with live sliders. Whether the Profile view also gets editable sliders (vs. only editing via Onboarding) is not decided in this phase. Phase 2 focuses on the Onboarding wizard sliders; Profile view editing is out of scope.

</deferred>

---

*Phase: 2-Web UI UX & Settings*
*Context gathered: 2026-05-11*
