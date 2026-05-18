# Phase 5: Polish, Depth & UX Tidy — Context

**Gathered:** 2026-05-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 5 polishes and deepens four areas of the existing app:

1. **Recommender UX** (REC-05–09) — cumulative scope highlight + 4th "Unconstrained" button, per-session vetoes toggle panel in sidebar, Favorites/Wishlist quick-action buttons on recipe cards, and a static ingredient derivation map in the engine (limes→lime juice, etc.).
2. **Inventory entry depth** (INV-08–10) — field label renames (style→"Category", type→"Specific Style/Type") with tooltips, nationality optional field in bottle edit form, quick-add bar already shipped (keyword auto-classify, INV-10 confirmed as fast path).
3. **Data model tidy** (DATA-01–03) — equipment consolidation to `inventory.json` only, numeric float migration for flavor axes, rich profile fields (drinking_frequency, household_context, vocabulary_preference, archetypes) surfaced in onboarding and Profile tab.
4. **Bartender Customization Wizard** (CUST-01–02) — new `#bartender-wizard` single-page scrollable form; Settings Bartender section adds "Full Customization →" link.

No new capabilities beyond what ROADMAP.md Phase 5 scopes. AI integration, portability, and backend are Phase 6+.

</domain>

<decisions>
## Implementation Decisions

### INV-10 — Paste-a-line Parser (already shipped)
- **D-01: Fast path confirmed.** The shipped quick-add bar (keyword classifier → instant add, inline section-picker for unknowns) is the accepted behavior. No REVIEW bucket. No pre-populated chip editor review step. Original spec language is superseded by this decision.
- **D-02: Keyword list.** The `QUICK_ADD_RULES` array in `inventory.js` is the parser. It stays in the same file — no separate module needed.

### REC-07 — Vetoes Filter Panel
- **D-03: Placement.** Vetoes panel lives in the Recommender sidebar, below mood sliders and base-spirit/occasion chips. Desktop: always visible. Mobile: collapses under the same "Adjust Mood" toggle button as the mood sliders.
- **D-04: Bypassed veto appearance.** When a veto is toggled off for the session, its chip shows strikethrough text + muted color (opacity reduced). No separate badge or icon needed.
- **D-05: Session reset.** Silent reset on navigation away — no warning toast, no banner. Vetoes default back to fully enforced on re-entry. This matches the spec exactly.
- **D-06: Veto data source.** Read from `inv.vetoes.disliked_ingredients[]`. If the array is empty, the panel shows "No vetoes configured — add them in Inventory → Vetoes." No panel section header when empty.

### REC-05, REC-06 — Scope Buttons
- **D-07: Cumulative highlight.** Scope level N highlights buttons 0…N simultaneously (not just the active button). Active state class applied to all buttons ≤ current scope. Existing `rec-scope-btn` + `.active` class pattern; add `_scopeLevel` comparison in the re-render loop.
- **D-08: Unconstrained button.** 4th button added at level 3: "Unconstrained." Mood + occasion scoring only; zero inventory gating; vetoes still respected by default (veto panel still usable). Level variable range expands from `0|1|2` to `0|1|2|3`.

### REC-08 — Favorites/Wishlist Quick-Actions
- **D-09: Button placement.** Small icon buttons (heart ♥ and bookmark ☆) on each recipe card in the Recommender results. Positioned in the card's top-right corner, consistent with the recipe-card pattern.
- **D-10: Save behavior.** Immediate save on click: `State.patch('recipes', …)` then `State.save('recipes')`. Show `Utils.showToast('Added to Favorites')` / `Utils.showToast('Added to Wishlist')`. No dirty-flag / batch pattern — each click is its own save operation.
- **D-11: Duplicate guard.** Before appending, check that the recipe name is not already in the target list. If already present, show `Utils.showToast('Already in Favorites', 'info')` instead. No visual toggle state needed on the card (stateless card, per existing recommender pattern).

### REC-09 — Ingredient Derivation Map
- **D-12: Location.** Derivation expansion happens in `recommender-engine.js` — a new `_expandLookup(lookup)` pass runs after `_buildLookup(inv)` and before `_hasIngredient`. It does not touch the inventory data itself, only the in-memory lookup.
- **D-13: Derivation pairs (exact from REQUIREMENTS.md).** limes→lime juice, lemons→lemon juice, sugar→simple syrup, eggs→egg white, mint→muddled mint, cream→heavy cream, honey→honey syrup. These are one-directional (having the base implies the derived product, not vice versa).
- **D-14: UI transparency.** No "matched via derivation" indicator in the UI for this phase. The engine match is silent.

### INV-08 — Field Label Renames
- **D-15: Labels only, keys unchanged.** The JSON keys `style` and `type` stay unchanged in `barkeeper.json`, `inventory.json`, and schemas. Only the `<label>` text in the bottle edit form changes: "Style" → "Category", "Type" → "Specific Style/Type". Tooltip/placeholder copy: Category placeholder `e.g. Bourbon, Gin, Mezcal`; Specific Style/Type placeholder `e.g. Single Barrel, Cask Strength, Espadin`.

### INV-09 — Nationality Field
- **D-16: Free-text input.** Nationality is a plain text input in the bottle edit form — no dropdown. Placeholder: `e.g. Scotland, Mexico, Kentucky USA`. Added to the "More fields" expanded section alongside Brand and Tier.
- **D-17: Schema update.** Add `nationality: { type: "string", default: "" }` to `schema/inventory.schema.json` `bottleEntry`. Add to `normalize.js` bottle coercion (default `""`).
- **D-18: Display.** Not shown on the chip face (chip already shows style + brand). Only visible inside the edit form.

### DATA-01 — Equipment Consolidation
- **D-19: Sole source of truth.** `inventory.json → equipment` is the only place equipment data lives. `normalize.js` strips `equipment` (or any equipment-looking keys) from `bar-owner-profile.json` and `barkeeper.json` on load — silently drops them, no error.
- **D-20: Onboarding.** Any equipment step in the onboarding wizard writes to `inventory` only. Profile + barkeeper writes during onboarding must not include equipment fields.

### DATA-02 — Numeric Axis Migration
- **D-21: Storage format.** Flavor axes stored as `0.0–1.0` float at `profile.flavor_profile.axes[axis]` (replacing the `{position: "Strong A"}` object). The `normalize.js` migration maps `Strong A→0.0, Lean A→0.25, Middle→0.5, Lean B→0.75, Strong B→1.0`. On load, any string-position axis is migrated in place and the normalized float is written back.
- **D-22: Engine compatibility.** `recommender-engine.js` `_normalizeProfile` already handles both string and numeric positions (existing map + `typeof pos === 'number'` check). No engine changes needed for DATA-02.
- **D-23: Profile tab UI.** Remove the "Lean A / Strong A / Lean B / Strong B / Middle" heading labels from the Profile tab flavor section. Show only numeric slider bars (0.0–1.0 range) with descriptive end-labels per axis (e.g., "Sweet ← → Dry"). No migration banner in the UI.

### DATA-03 — Rich Profile Fields
- **D-24: Onboarding placement.** New optional Step 7 appended at the end of the onboarding wizard. Step title: "About Your Drinking Style — optional." Step has a visible "Skip" button. The step collects: `drinking_frequency` (select: daily/several times a week/weekly/occasionally/rarely), `household_context` (free-text, placeholder: `e.g. Couple, hosting often`), `vocabulary_preference` (select: casual/balanced/technical), and archetype selection.
- **D-25: Archetypes UI.** Pre-defined chip grid — user picks 1–3. Chips show archetype name + one-line description on hover/tooltip. Stored as matching `{name, description}` objects from a fixed archetype set. Archetype set (seed): The Minimalist, The Experimenter, The Host, The Purist, The Adventurer, The Classicist. Stored at `bar-owner-profile.json → archetypes[]`.
- **D-26: Profile tab placement.** A collapsible "Drinking Style" section at the bottom of the Profile tab view. Collapsed by default (shows the section header with a ▾ toggle). Expanding reveals the four rich fields as read/edit items. Fields are editable inline (no separate edit mode); changes call `State.patch('profile', …)` + `markDirty()` + sticky save bar.
- **D-27: Schema location.** All four fields belong in `bar-owner-profile.json` only — not `barkeeper.json` or `inventory.json`. `normalize.js` must ensure `background.drinking_frequency`, `background.household_context`, `background.vocabulary_preference`, and `archetypes[]` exist on load (default `""` / `[]`).

### CUST-01, CUST-02 — Bartender Customization Wizard
- **D-28: Structure.** Single-page scrollable form at route `#bartender-wizard`. Not a stepped wizard. Dirty-state tracked; sticky save bar at bottom (same `inv-save-bar` pattern). Writes to `barkeeper.json` via `State.save('barkeeper')`.
- **D-29: Fields.** Name, avatar image (see D-30), voice preset (dropdown, reuse existing presets from Settings), long-form personality description (textarea, ~5 rows), behavioral rules (add/remove list, string array), cocktail naming style (free-text or short select: "Classic", "Playful", "Inventive"), image generation style preferences (free-text textarea, e.g. "photorealistic, warm amber lighting"), signature signoff text (single-line input).
- **D-30: Avatar source — both options.** URL paste field + file-upload button. File upload uses the existing `GitHubAPI.uploadImage` / recipe-image upload helper; stores in `images/` folder. URL takes precedence if both are filled (URL field is the canonical `barkeeper.avatar_url` field; upload writes a path to the same field).
- **D-31: Behavioral rules entry.** Freeform add/remove list: text input + "Add Rule" button appends to array; each rule row has an × remove button. Stored as `barkeeper.behavioral_rules[]` (string array). Same UI pattern as Inventory string sections (`renderStringSection`).
- **D-32: CUST-02 Settings link.** Settings → Bartender section keeps existing Name + preset dropdown, adds a "Full Customization →" button/link that navigates to `#bartender-wizard`. No duplication of wizard fields in Settings.

### Claude's Discretion
- Exact archetype chip grid layout (2-column vs 3-column, card height) — follow existing chip/card patterns in app.css.
- CSS for collapsed/expanded "Drinking Style" section toggle (use existing pattern from any collapsible in the app, or match the onboarding step toggle).
- Whether `_expandLookup` modifies the lookup object in place or returns a new one — either is fine; prefer in-place for minimal allocation.
- Cocktail naming style field: free-text or select — implementer chooses based on what feels right at build time.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Phase Scope
- `.planning/REQUIREMENTS.md` — REC-05–09, INV-08–10, DATA-01–03, CUST-01–02 requirement definitions
- `.planning/ROADMAP.md` — Phase 5 goal, plan index (05-00 through 05-04), wave structure
- `.planning/STATE.md` — Current phase status and shipped capabilities list

### Prior Phase Decisions (carry-forward)
- `.planning/phases/04-inventory-recommender-depth/04-CONTEXT.md` — D-13–D-25 (mood sliders, scope toggle, canonical names, normalize.js mandate, BUG-02 subtype guard); all still apply

### Core Application Files (must read before touching)
- `app/js/views/recommender.js` — Current scope toggle, sidebar layout, `_scopeLevel` state, occasion chips
- `app/js/recommender-engine.js` — `_buildLookup`, `_hasIngredient`, `_normalizeProfile`, subtype guard
- `app/js/views/inventory.js` — `renderBottleSection`, `openEditForm`, `BOTTLE_SECTIONS`, quick-add bar (D-01); `renderStringSection` pattern (D-31)
- `app/js/normalize.js` — Current migration/normalization logic; all DATA-01–03 changes land here
- `app/js/views/settings.js` — Existing Bartender section (Name + preset); CUST-02 adds link here
- `app/js/views/profile.js` — Current Profile tab structure; DATA-03 collapsible section appended here
- `app/js/views/onboarding.js` — Current wizard step structure; DATA-03 Step 7 appended here

### Schema
- `schema/inventory.schema.json` — `bottleEntry` definition; add `nationality` field (D-17)
- `schema/bar-owner-profile.schema.json` — add `background.drinking_frequency`, `background.household_context`, `background.vocabulary_preference`, `archetypes[]` (D-27)
- `schema/barkeeper.schema.json` — add `behavioral_rules[]`, `personality_description`, `cocktail_naming_style`, `image_gen_style`, `signoff` (D-29)

### Existing Helpers to Reuse
- `app/js/github-api.js` — `uploadImage` method (D-30 avatar upload)
- `app/css/app.css` — `.inv-save-bar` sticky pattern (D-28); `.bottle-chip`, `.rec-scope-btn`, `.rec-filter-chip` classes

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `renderStringSection` in `inventory.js` — Exact pattern for CUST-01 behavioral rules list (D-31): text input + add button + × per item.
- `inv-save-bar` sticky div — Copy for bartender wizard dirty-state tracking (D-28). Defined in `inventory.js render()` and styled in `app.css`.
- `GitHubAPI.uploadImage` in `github-api.js` — Avatar file upload (D-30); already used by recipe image upload in `recipes.js`.
- `Utils.showToast` — All save confirmations, duplicate-guard feedback (D-11).
- Existing `.rec-scope-btn` + `.active` CSS — Extend for cumulative highlight (D-07); do not add new classes if existing ones cover it.
- `_normalizeProfile` in `recommender-engine.js` — Already handles both string and numeric axes (D-22); no change needed.

### Established Patterns
- **IIFE module pattern** — All new view files (`bartender-wizard.js`) must follow `const WizardView = (() => { … return { render }; })();`
- **`State.patch()` → `markDirty()` → sticky save bar → `State.save()`** — Every form in the app follows this. Bartender wizard is no exception (D-28).
- **`normalize.js` is the migration choke point** — Any new schema field (D-17, D-27, D-29) must have a corresponding default/coercion in `normalize.js`. Nothing else touches raw JSON structure.
- **Scope of `_openEdit`** — One inline edit form open at a time in inventory; wizard is a full-page form so no such constraint applies.

### Integration Points
- `recommender.js` sidebar → veto panel: reads `State.get('inventory').vetoes.disliked_ingredients[]`; renders per-session toggle state in local `_vetoOverrides` Set (session-only, no State write).
- `recommender-engine.js recommend()` → new `_expandLookup` pass: adds derived ingredients to lookup before `_hasIngredient` runs. Engine receives an already-expanded lookup; `_hasIngredient` itself is unchanged.
- `onboarding.js` → Step 7: writes `drinking_frequency`, `household_context`, `vocabulary_preference`, `archetypes` to `State.patch('profile', …)` then `State.save('profile')` on step completion (or skip).
- `profile.js` → collapsible Drinking Style section: reads same fields from `State.get('profile').background` + `.archetypes`; edits patch profile state + dirty flag.
- `settings.js` Bartender section → adds nav link to `#bartender-wizard` (D-32). No field duplication.
- `app.js` router → add `case '#bartender-wizard': BartenderWizardView.render(container); break;`
- `app/index.html` → add nav link for Bartender Wizard (or leave out of nav — accessible via Settings link only per CUST-02).

</code_context>

<specifics>
## Specific Ideas

- Vetoes panel header in sidebar: "Vetoes" with a small "(session overrides reset on exit)" note — wait, D-05 says silent reset. Omit the note entirely.
- Archetype seed set: The Minimalist, The Experimenter, The Host, The Purist, The Adventurer, The Classicist. These are `{name, description}` objects — planner should define one-line descriptions for each in the implementation.
- INV-10 quick-add bar already committed to `claude/phase-5-gsd-oH6cX` (commit `6955f51`). Plan 05-02 should treat INV-10 as done and include a regression note (check that keyword parser covers the QUICK_ADD_RULES set).
- Scope button "Unconstrained" (level 3): visually distinguish it from the other three — consider a subtle dashed border or a lighter fill to signal it disables inventory gating entirely.
- Behavioral rules placeholder examples: "Always suggest a garnish", "Prefer classic recipes over modern twists", "Keep explanations brief".

</specifics>

<deferred>
## Deferred Ideas

- **Full multi-level undo history** — Requires in-memory or localStorage change stack. Phase 6+ item.
- **Page-level inventory import** — Targeted JSON import for Inventory only. Phase 7 (Portability).
- **Custom type enum persistence to GitHub** — Currently localStorage only. Future consideration.
- **Archetype "Custom…" option** — Pre-defined chips only for now; freeform custom archetypes are a future enhancement.
- **"Matched via derivation" indicator in Recommender** — REC-09 derivation is silent this phase. A future phase could surface which ingredients were derived.
- **Bartender Wizard multi-step/tab structure** — User chose single-page scrollable for now. If the form grows unwieldy, tabs/steps are a natural next iteration.

</deferred>

---

*Phase: 5-Polish, Depth & UX Tidy*
*Context gathered: 2026-05-18*
