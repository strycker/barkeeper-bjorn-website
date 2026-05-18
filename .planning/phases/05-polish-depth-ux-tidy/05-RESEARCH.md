# Phase 5: Polish, Depth & UX Tidy — Research

**Researched:** 2026-05-18
**Domain:** Vanilla JS SPA polish — UX additions, schema migrations, view wiring
**Confidence:** HIGH (entire codebase verified via direct read; no external deps)

## Summary

Phase 5 is a polish/depth pass across four areas of an existing vanilla-JS SPA. Every requirement maps to an exact file and an existing pattern — no new libraries, no new architectural decisions. The CONTEXT.md already locks 32 decisions; this research verifies each integration point against current code and flags one place where CONTEXT.md disagrees with reality (DATA-02, D-22). The plan should be a faithful execution of CONTEXT.md with one correction noted below.

**Primary recommendation:** Execute CONTEXT.md as written, with one engine fix: DATA-02 (D-22) claims `_normalizeProfile` already handles numeric positions — code confirms it does. But `profile.js:253` still writes string labels back into state via `Utils.valueToAxisLabel(newVal)`. That write must change to write the raw float, otherwise the migration is one-way at load time but lost on every save. Add this to plan 05-03.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

(Copied verbatim from 05-CONTEXT.md `<decisions>` block — D-01 through D-32. See CONTEXT.md lines 20–83 for full text. Summary:)

- **D-01, D-02 (INV-10):** Quick-add bar shipped (commit 6955f51) is the accepted fast path. `QUICK_ADD_RULES` array in `inventory.js` is the parser. No REVIEW bucket, no chip editor.
- **D-03–D-06 (REC-07 Vetoes):** Sidebar placement below mood sliders + chips. Strikethrough + opacity for bypassed vetoes. Silent reset on navigation. Read from `inv.vetoes.disliked_ingredients[]`. Empty array → empty-state copy with no header.
- **D-07, D-08 (REC-05/06 Scope):** Cumulative highlight on buttons 0..N. Add 4th button "Unconstrained" (level 3) — mood+occasion scoring only, zero inventory gating, vetoes still respected.
- **D-09–D-11 (REC-08 Quick-actions):** ♥/☆ buttons top-right of recipe cards. Immediate save (no batch). Duplicate-guard via name check + toast.
- **D-12–D-14 (REC-09 Derivation):** New `_expandLookup(lookup)` pass after `_buildLookup`, before `_hasIngredient`. 7 pairs (limes→lime juice, etc.). Silent — no UI indicator this phase.
- **D-15 (INV-08):** Labels only, JSON keys unchanged. Placeholders specified.
- **D-16–D-18 (INV-09):** Free-text nationality field in expanded "More fields". Schema + normalize.js default `""`. Not on chip face.
- **D-19, D-20 (DATA-01):** `inventory.json → equipment` is sole source of truth. `normalize.js` strips equipment from profile + barkeeper silently.
- **D-21–D-23 (DATA-02):** Floats 0.0–1.0 at `profile.flavor_profile.axes[axis].position`. Migration map `Strong A→0, Lean A→0.25, Middle→0.5, Lean B→0.75, Strong B→1`. `_normalizeProfile` already compatible. Profile tab removes string label headings.
- **D-24–D-27 (DATA-03):** Onboarding Step 7 (optional, skip button) with drinking_frequency/household_context/vocabulary_preference/archetypes. Profile tab gets collapsible "Drinking Style" section. Archetype seed: 6 chips (Minimalist, Experimenter, Host, Purist, Adventurer, Classicist). All fields land in `bar-owner-profile.json` only.
- **D-28–D-32 (CUST-01/02):** New `#bartender-wizard` route — single-page scrollable form, dirty-state sticky save bar, writes to `barkeeper.json`. Avatar: URL + file-upload (both, URL takes precedence). Behavioral rules use `renderStringSection` pattern. Settings → Bartender adds "Full Customization →" link, no field duplication.

### Claude's Discretion

- Archetype chip grid layout (2- vs 3-column) — follow existing chip patterns
- CSS for collapsed/expanded "Drinking Style" section
- `_expandLookup` in-place vs return — prefer in-place (per CONTEXT.md hint)
- Cocktail naming style field: free-text vs select — implementer's call

### Deferred Ideas (OUT OF SCOPE)

- Full multi-level undo, page-level inventory import, custom type enum persistence to GitHub, "Custom…" archetype, "matched via derivation" indicator, wizard multi-step structure
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REC-05 | Cumulative scope highlight | `recommender.js:199–201` — single-button `.active` toggle today; change to `Number(btn.dataset.scope) <= _scopeLevel` |
| REC-06 | Unconstrained 4th button | `recommender.js:441–449` scope HTML; engine `recommend()` `recommender-engine.js:115–164` needs a `scope`/`ignoreInventory` flag |
| REC-07 | Vetoes filter panel | `recommender-engine.js:128–139` reads `inv.vetoes` already; `recommender.js` sidebar gets new panel + `_vetoOverrides` Set passed into engine |
| REC-08 | Favorites/Wishlist quick-actions | `recommender.js:_renderCard` (lines 57–94); `recipes.confirmed_favorites` + `recipes.wishlist` arrays (confirmed in `normalize.js:194–203`) |
| REC-09 | Ingredient derivation map | `recommender-engine.js:_buildLookup` at line 47; `_hasIngredient` at line 56. Insert `_expandLookup` between them |
| INV-08 | Field label renames | `inventory.js:306–307` — `<label>Style` and `<label>Type`. Pure label/placeholder change |
| INV-09 | Nationality field | `inventory.js:openEditForm` expanded fields block (lines 310–325). Schema + normalize default `""` |
| INV-10 | Paste-a-line parser | **SHIPPED** in commit 6955f51 — `inventory.js:renderQuickAddBar` (lines 428–514) + `QUICK_ADD_RULES` (lines 89–108). Plan 05-02 includes regression check only |
| DATA-01 | Equipment consolidation | `normalize.js:148–153` already writes inventory.equipment. Strip from `barkeeper()` (line 158) and `profile()` (line 173). Onboarding `_answers.equipment` write at `onboarding.js:564` must change |
| DATA-02 | Numeric axis migration | `normalize.js:profile()` line 173 — add axis coercion. `profile.js:253` write site needs fix (writes string today) |
| DATA-03 | Rich profile fields | `onboarding.js` STEPS array line 18–25 — append `'about_drinking_style'` step. `profile.js` after evolution log — add collapsible section |
| CUST-01 | Bartender Wizard | NEW file `app/js/views/bartender-wizard.js`. Route added to `app.js:71` switch. Script tag in `app/index.html` |
| CUST-02 | Settings link | `settings.js` Bartender Identity section (lines 84–103) — add nav link after preset dropdown |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Recommender UX (REC-05–09) | Browser (view + engine) | — | All client-side; engine is pure-fn, view is DOM |
| Inventory depth (INV-08–10) | Browser (view) | Schema | Form fields only; schema docs the field |
| Equipment consolidation (DATA-01) | Browser (normalize.js) | — | Strip-on-load runs in browser; no migration job |
| Axis migration (DATA-02) | Browser (normalize.js) | View (profile.js write site) | Idempotent on every load; new writes write floats |
| Rich profile + wizard (DATA-03/CUST) | Browser (view) | GitHub (storage) | Standard SPA + GitHub Contents API write |

## Standard Stack

No new dependencies. Phase 5 reuses 100% of existing stack:

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vanilla ES6 IIFE | — | All view modules | Project standard (CLAUDE.md mandates no build/framework) |
| GitHub Contents API | 2022-11-28 | Read/write JSON + image upload | Single I/O channel (`github-api.js`) |
| FileReader API | — | Avatar file upload base64 conversion | Pattern at `recipes.js:385–390` |

## Architecture Patterns

### Verified existing patterns (all reusable)

**Sticky save bar + dirty flag** — `inventory.js:516–534`, `profile.js:421–438`. Copy exactly for bartender-wizard.js.

**IIFE view module** — every view in `app/js/views/` follows `const FooView = (() => { ... return { render }; })();`. New `BartenderWizardView` mirrors this.

**Hash router switch** — `app.js:71–101`. Add `case 'bartender-wizard': BartenderWizardView.render(content); break;`.

**Image upload** — `recipes.js:374–415`:
```js
const base64 = await new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result.split(',')[1]);
  reader.onerror = reject;
  reader.readAsDataURL(selectedFile);
});
const sha = await GitHubAPI.getFileSHA(`images/${filename}`);
await GitHubAPI.writeFile(`images/${filename}`, base64, sha, `Upload …`);
```
Reuse verbatim for avatar (D-30). Note: there is no `GitHubAPI.uploadImage` method — CONTEXT.md line 124 misnames it. The real API is `GitHubAPI.writeFile(path, base64, sha, message)` + `GitHubAPI.getFileSHA(path)`. Filename pattern for avatar: `images/barkeeper_avatar_{timestamp}.{ext}`.

**State write flow** — `State.patch('key', fn)` mutates → `markDirty()` shows save bar → user clicks Save → `State.save('key', commitMessage)` writes to GitHub.

**String-list section** — `inventory.js:renderStringSection` (lines 381–412) + `renderStringItems` (lines 414–426). Direct copy for behavioral rules.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sticky save bar | Custom dirty-tracker | `inv-save-bar` pattern from inventory.js | Already styled in app.css |
| Image base64 conversion | Re-roll FileReader logic | Copy from `recipes.js:385–390` | Verified working in production |
| String list add/remove | Custom array UI | `renderStringSection` from inventory.js | Existing pattern, exact match for behavioral rules |
| Axis numeric coercion | Custom helper | `Utils.axisToValue` at `utils.js:88–101` | Already handles both number + string positions |

## Code Insights — Specific Findings

### 1. REC-09 Derivation Map — Exact Placement

**File:** `app/js/recommender-engine.js`

`_buildLookup(inv)` is at lines 47–53. `_hasIngredient(lookup, ingredient)` is at lines 56–77. Insert `_expandLookup(lookup)` between them. In `recommend()` (line 115), the lookup is built at line 121 — call `_expandLookup(lookup)` immediately after.

Recommended shape (in-place mutation):
```js
const DERIVATIONS = [
  // [sourceKeyword, derivedKeyword, sectionToAugment]
  ['lime',  'lime juice',     'produce',     'perishables'],
  ['lemon', 'lemon juice',    'produce',     'perishables'],
  ['sugar', 'simple syrup',   'pantry',      'syrups'],
  ['egg',   'egg white',      'perishables'],
  ['mint',  'muddled mint',   'produce'],
  ['cream', 'heavy cream',    'perishables'],
  ['honey', 'honey syrup',    'pantry',      'syrups'],
];
function _expandLookup(lookup) {
  for (const [src, derived, ...targetSections] of DERIVATIONS) {
    // If any section in lookup contains src, add derived to target sections
    const present = Object.values(lookup).some(arr => arr.some(item => item.includes(src)));
    if (present) {
      for (const sec of targetSections) {
        if (!lookup[sec]) lookup[sec] = [];
        if (!lookup[sec].some(i => i.includes(derived))) lookup[sec].push(derived);
      }
    }
  }
  return lookup;
}
```
Planner: confirm target sections by checking which section keys recipes use to look up `lime juice`, `simple syrup` etc. in `classics-db.js` `searchIn` arrays.

### 2. REC-07 Vetoes Data Shape — Verified

Current state (verified):
- `inv.vetoes.disliked_ingredients` is `string[]` (normalize.js:135)
- `inv.vetoes.substitute_for_now` is `{missing, substitute, ratio?}[]` (normalize.js:136)
- Engine currently treats `disliked_ingredients` as flat strings (recommender-engine.js:130–134) — matches CONTEXT.md D-06

**Note for DATA-03 / profile.js:357** — profile.js currently reads `profile.vetoes.disliked_ingredients` (note the `profile.` prefix, not `inv.`), and the live `data/bar-owner-profile.json:107–110` actually has `vetoes.disliked_ingredients[]` as objects `{name, ...}`. This is a pre-existing inconsistency: vetoes live in BOTH `inventory.json` AND `bar-owner-profile.json`, with different shapes. CONTEXT.md (D-06) locks the Recommender source as `inv.vetoes.disliked_ingredients[]` (string[]) — that's correct, but planner should add a regression check that the Profile tab veto display still works (or note it as a separate small cleanup).

Session-bypass wiring (per D-04, D-05): module-level `let _vetoOverrides = new Set();` in recommender.js, cleared in `render()` at the top (already follows the existing reset-on-render pattern, e.g. `_sliderValues` at line 389). Pass through to engine: extend `RecommenderEngine.recommend(inventory, profile, opts)` signature to accept `{ ignoreVetoes: Set<string>, scope: 0|1|2|3 }` so engine can filter the veto list before checking. Currently engine has no opts param — adding one cleanly handles both REC-06 (`scope: 3` skips inventory gating) and REC-07.

### 3. DATA-02 — Numeric Axis Migration — Current State Verified

`data/bar-owner-profile.json:11,18,25,32,39,46` already stores `position` as **floats** (0.2, 0.75, 0.85, 1, 0.75, 1). So the data file is already partially migrated.

`recommender-engine.js:97–110` `_normalizeProfile` correctly handles both via `typeof pos === 'number'` check. **D-22 is correct: no engine change needed.**

**BUT:** `profile.js:253` does:
```js
p.flavor_profile.axes[a.key].position = Utils.valueToAxisLabel(newVal);  // ← writes STRING
```
This converts the user's slider input (float) back to a string label on every drag — defeating the migration. Must change to:
```js
p.flavor_profile.axes[a.key].position = newVal;  // raw float
```
Recommender view at `recommender.js:333` already writes the raw value — that's the canonical pattern. Profile.js should match it.

Plan 05-03 must include this profile.js fix in addition to:
- `normalize.js:profile()` (line 173) — add per-axis coercion using the string→float map (idempotent: if already a number, no-op).
- `profile.js:renderAxisControls` — remove "Strong A / Lean B" heading labels (D-23), keep slider + pole labels only.

### 4. DATA-01 — Equipment Consolidation Surface Area

Current writes/reads of equipment:

| File | Line | Operation |
|------|------|-----------|
| `data/inventory.json` | 211 | Has `equipment: {strainers:[...]}` (canonical) |
| `data/bar-owner-profile.json` | 78–87 | Has legacy `equipment: {shaker, mixing_glass, jigger, ...}` — strip |
| `data/barkeeper.json` | — | No equipment field present; defensive strip still valid |
| `normalize.js:148–153` | — | Currently writes inventory.equipment.strainers (keeps it) |
| `normalize.js:158–171 barkeeper()` | — | No equipment handling — add explicit `delete out.equipment;` |
| `normalize.js:173 profile()` | — | No equipment handling — add explicit `delete out.equipment;` |
| `onboarding.js:381–393` | — | Writes `_answers.equipment` |
| `onboarding.js:564` | — | `if (_answers.equipment) profile.equipment = _answers.equipment` — **REWRITE to write to inventory** |
| `inventory.js:677` | — | renderEquipmentSection (reads inv.equipment.strainers — correct) |

**Strip logic in `normalize.js`:** both `barkeeper()` and `profile()` should do `delete out.equipment;` after spreading source. Silent — no error per D-19. The legacy profile equipment object (shaker/jigger/etc.) gets dropped on first normalize pass.

**Onboarding rewrite:** the equipment step currently writes 7 boolean-ish fields (shaker, mixing_glass, jigger, bar_spoon, citrus_press, ice_setup, glassware) plus strainer text. Only `strainers` belongs in inventory schema today. Planner decision: either (a) drop the other 6 fields entirely (matches CONTEXT.md spirit), or (b) extend inventory.equipment schema to hold them. CONTEXT.md doesn't specify — recommend (a) for now, deferred (b) as a future enhancement, OR (b) if planner wants symmetry with shipped equipment editor. Flag for plan-phase discussion.

### 5. Bartender Wizard Route Wiring — Confirmed Pattern

`app.js:36–40` `parseHash()` does `hash.split('/')[0]`. So `#bartender-wizard` resolves to `route = 'bartender-wizard'`. Add at line 99 (before default):
```js
case 'bartender-wizard':
  BartenderWizardView.render(content);
  break;
```

`app/index.html` — add `<script src="js/views/bartender-wizard.js"></script>` (location: after other view scripts). **Per D-32, no nav link** — accessible only via Settings → Bartender → "Full Customization →".

### 6. Avatar Upload — Exact Call Signature

The pattern (from recipes.js verified):
```js
const ext = file.name.split('.').pop().toLowerCase();
const filename = `barkeeper_avatar_${Date.now()}.${ext}`;
const base64 = await new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result.split(',')[1]);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});
const path = `images/${filename}`;
const sha = await GitHubAPI.getFileSHA(path);
await GitHubAPI.writeFile(path, base64, sha, `Upload bartender avatar`);
// Construct raw URL — same pattern as app.js:23
const cfg = GitHubAPI.cfg();
const url = `https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/${cfg.branch}/${path}`;
// Write URL into barkeeper.avatar_url
State.patch('barkeeper', bk => { bk.avatar_url = url; });
```
**Field name:** CONTEXT.md (D-30) calls it `barkeeper.avatar_url`. Verified `data/barkeeper.json` has NO such field today. New field — add to schema. Also note `app.js:22–26` currently hardcodes `images/barkeeper_bjorn_icon.png` for the header avatar — once `avatar_url` exists in barkeeper.json, app.js should prefer it. Optional plan item or defer; flag for planner.

### 7. INV-10 Shipped State — Confirmed

`git log --oneline 6955f51 -1`: `feat(inventory): always-visible quick-add bar with keyword parser`. Code verified at `inventory.js:88–108` (QUICK_ADD_RULES) and lines 428–514 (renderQuickAddBar). Behavior:
- Always-visible bar at top of inventory page (above tabs).
- Type bottle name + Enter → classifier matches against QUICK_ADD_RULES → instant add + toast.
- No match → inline picker (`<select>` of all BOTTLE_SECTIONS) → Confirm → add.
- Auto-switches to Spirits tab if not active.

**Follow-up for plan 05-02:** treat INV-10 as done. Include a one-line regression test in TEST-CHECKLIST.md: "Quick-add bar parses 'Bulleit Bourbon' to base_spirits.whiskey" and "Quick-add bar shows section picker for 'Mystery liquid'". No code edits.

### 8. Quick-Action Buttons (REC-08) — Card Layout Constraint

Current `_renderCard` template (recommender.js:57–94) uses a `.rec-card-header` with two children: `.rec-card-name`-block and `.rec-score`-block. Top-right is occupied by `.rec-score`. Per D-09, ♥/☆ go top-right — needs CSS adjustment (move score block, or stack icons above it). Recommend a new `<div class="rec-card-actions">` above `.rec-score`, absolute-positioned, or restructure header into 3 cells. Planner: small CSS task; choose between (a) absolute-positioned overlay or (b) flex restructure.

Duplicate guard logic (D-11) — check `recipes.confirmed_favorites[].name` and `recipes.wishlist[].name`. Recipe added is a shallow copy of `item.recipe` (the CLASSICS_DB entry).

## Common Pitfalls

### Pitfall 1: DATA-02 Write Site Forgotten
**What:** Migration in normalize.js only runs at load; if profile.js still writes strings, every save corrupts the float back to a string.
**Avoid:** Fix `profile.js:253` in the SAME plan as the normalize.js migration (plan 05-03).
**Warning sign:** After saving from Profile tab, axes become strings again.

### Pitfall 2: 409 SHA Conflict on Multi-File Equipment Migration
**What:** First normalize pass strips equipment from profile + barkeeper. If only one is saved, the other's stale equipment field is dropped only on next load.
**Avoid:** Strip-on-load is idempotent — fine. But if onboarding writes equipment to profile post-Phase-5, that defeats the strip. Plan must change onboarding write site (D-20).
**Warning sign:** Equipment reappears in bar-owner-profile.json after re-running onboarding.

### Pitfall 3: Bartender Wizard Avatar URL Field Mismatch
**What:** CONTEXT.md says "URL takes precedence" (D-30) but file upload writes a URL into the same `avatar_url` field. Both inputs end up writing the same key — not really "precedence" but "last-write-wins."
**Avoid:** Display: show one field (URL text), with "Upload from file…" button that fills the URL field with the GitHub raw URL after upload completes. Single source of truth: `barkeeper.avatar_url`.
**Warning sign:** UI shows both URL and file-upload state out of sync.

### Pitfall 4: Recommender Engine Signature Change Cascade
**What:** Adding `opts` (or `scope`, `ignoreVetoes`) param to `RecommenderEngine.recommend()` ripples to all call sites.
**Avoid:** Call sites today: `recommender.js:316`, `recommender.js:354`, `recommender.js:396`. All 3 update simultaneously.

### Pitfall 5: CONTEXT.md GitHubAPI Method Name Wrong
**What:** CONTEXT.md line 124 says `GitHubAPI.uploadImage`. No such method exists. Real API: `GitHubAPI.writeFile` + `GitHubAPI.getFileSHA`.
**Avoid:** Plan task descriptions should reference the correct method names.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None — manual TEST-CHECKLIST.md per phase (project convention) |
| Config file | none |
| Quick run command | `python3 -m http.server 8000` then exercise UI |
| Full suite command | Manual checklist walkthrough |
| Phase gate | `.planning/phases/05-polish-depth-ux-tidy/TEST-CHECKLIST.md` all items checked |

### Phase Requirements → Test Map (manual)

| REQ | Test |
|-----|------|
| REC-05 | Click scope 2 → buttons 0, 1, 2 all show `.active` |
| REC-06 | Click "Unconstrained" → all recipes shown regardless of inventory; vetoed bases still hidden |
| REC-07 | Toggle a veto off in sidebar → matching recipes appear; navigate away + back → veto re-enforced |
| REC-08 | Click ♥ on a card → toast "Added to Favorites"; click again → toast "Already in Favorites" |
| REC-09 | With limes in inventory but no lime juice → recipe needing lime juice appears in buildable |
| INV-08 | Edit a bottle → labels show "Category" + "Specific Style/Type" with placeholders |
| INV-09 | Edit bottle → expand "More fields" → Nationality input present; save persists |
| INV-10 | Type "Bulleit Bourbon" + Enter in quick-add → lands in Whiskey section (regression) |
| DATA-01 | Reload app → bar-owner-profile.json no longer has `equipment` field after save |
| DATA-02 | Drag axis slider, save profile → JSON shows numeric position (e.g. 0.75, not "Lean B") |
| DATA-03 | Run onboarding to Step 7 → fill drinking_frequency etc → profile JSON has fields |
| CUST-01 | Navigate to `#bartender-wizard` → form renders, edit + save persists to barkeeper.json |
| CUST-02 | Settings → Bartender → "Full Customization →" link navigates to wizard |

### Wave 0 Gaps

- [ ] `.planning/phases/05-polish-depth-ux-tidy/TEST-CHECKLIST.md` — create with above tests
- [ ] Plan 05-00 should produce this checklist (Wave 0)

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | DERIVATIONS section targets (e.g., simple syrup → `syrups`, egg white → `perishables`) match classics-db.js `searchIn` keys | REC-09 finding | Derivation pass adds to wrong section, recipes still appear "missing" — planner verifies by sampling 2-3 recipes |
| A2 | Equipment fields beyond `strainers` should be dropped (not extended) per DATA-01 | DATA-01 finding | If user wants shaker/jigger/etc. preserved, plan needs schema extension. CONTEXT.md is silent — flag in plan |
| A3 | `barkeeper.avatar_url` is a new field (not present today) | Avatar upload | Verified absent in data/barkeeper.json — LOW risk |

## Open Questions

1. **DATA-01 onboarding equipment scope** — Currently onboarding writes 7 equipment fields to profile. Phase 5 strips this from profile. Do we (a) drop those 6 non-strainer fields entirely, or (b) extend inventory.equipment schema to hold them? CONTEXT.md doesn't specify. Recommend (a) for minimal scope; resurface as future enhancement.

2. **REC-09 derivation target sections** — Need to confirm by scanning `classics-db.js` which `searchIn` keys are used for lime juice, simple syrup, etc. Quick grep during planning.

3. **Avatar URL precedence** — Per D-30, "URL takes precedence" but both write the same field. Recommend single-field design (upload populates URL field). Confirm with planner.

4. **Quick-action button placement vs. score block** — Top-right is occupied. CSS restructure choice deferred to implementer.

## Environment Availability

(N/A — Phase 5 is code/config only. No external tool dependencies beyond existing Vanilla JS + GitHub PAT.)

## Sources

### Primary (HIGH confidence — verified by direct file read)
- `/home/user/barkeeper-bjorn-website/app/js/recommender-engine.js` (lines 1–168)
- `/home/user/barkeeper-bjorn-website/app/js/views/recommender.js` (lines 1–489)
- `/home/user/barkeeper-bjorn-website/app/js/views/inventory.js` (lines 1–812)
- `/home/user/barkeeper-bjorn-website/app/js/normalize.js` (lines 1–215)
- `/home/user/barkeeper-bjorn-website/app/js/views/profile.js` (lines 1–442)
- `/home/user/barkeeper-bjorn-website/app/js/views/onboarding.js` (lines 1–120, plus grep around equipment)
- `/home/user/barkeeper-bjorn-website/app/js/views/settings.js` (lines 70–180)
- `/home/user/barkeeper-bjorn-website/app/js/views/recipes.js` (lines 370–420 — image upload pattern)
- `/home/user/barkeeper-bjorn-website/app/js/github-api.js` (lines 1–101)
- `/home/user/barkeeper-bjorn-website/app/js/app.js` (lines 1–145)
- `/home/user/barkeeper-bjorn-website/app/js/utils.js` (lines 85–113)
- `/home/user/barkeeper-bjorn-website/data/bar-owner-profile.json` (lines 1–110)
- `/home/user/barkeeper-bjorn-website/data/barkeeper.json` (lines 1–50)
- `/home/user/barkeeper-bjorn-website/schema/inventory.schema.json` (lines 1–179)
- `git log --oneline 6955f51 -1` — INV-10 ship confirmed

## Metadata

**Confidence breakdown:**
- Integration points: HIGH — every file line referenced is verified from direct read
- DATA-02 fix-site discovery: HIGH — profile.js:253 string-write confirmed
- DERIVATIONS target keys: MEDIUM — needs one quick verification against classics-db.js during planning
- Avatar field semantics: HIGH — verified absent today

**Research date:** 2026-05-18
**Valid until:** 2026-06-17 (30 days — stable vanilla-JS codebase, no fast-moving deps)
