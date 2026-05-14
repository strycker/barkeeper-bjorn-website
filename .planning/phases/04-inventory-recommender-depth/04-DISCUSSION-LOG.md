# Phase 4: Inventory & Recommender Depth — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-14
**Phase:** 4-Inventory & Recommender Depth
**Areas discussed:** Bottle object fields, Edit popover UX, Recommender session state, Canonical name matching, Strainer field placement, Recommender engine ingredient matching, Two-away shopping list linking, Recommender page layout

---

## Bottle Object Fields

### Display name structure

| Option | Description | Selected |
|--------|-------------|----------|
| brand + style (two fields) | e.g. brand='Buffalo Trace', style='Bourbon' — chip shows 'Buffalo Trace' with style as subtitle or tooltip. Matches ROADMAP exactly. | ✓ |
| name stays, add type/style on top | Keep 'name' as full display string, add separate 'type' and 'style'. Backward-compatible. | |
| You decide | Claude picks the most backward-compatible approach. | |

**User's choice:** brand + style (two fields)

---

### Migration of existing entries

| Option | Description | Selected |
|--------|-------------|----------|
| Treat name as brand, style empty — silent migration | inventory.js maps old {name} → {brand: name, style: ''} at render time. No data write needed. | |
| One-time migration write on first save | On first State.save('inventory'), rewrite all old entries to new shape. Cleaner schema going forward. | ✓ |
| You decide | Claude picks the safest approach. | |

**User's choice:** One-time migration write on first save

---

### Type field design

| Option | Description | Selected |
|--------|-------------|----------|
| Derived from section | The section the bottle lives in is the type. No separate type field. | |
| Free-text field | User can type any spirit type. No enforcement. | |
| Enum dropdown | Dropdown with standard categories. Keeps data clean. | |
| Appendable enum (user selection) | Single input with dropdown enum of standard categories + "Add new category type" option. | ✓ |

**User's choice:** Appendable enum — dropdown of standard categories with "Add new category type" option for user-defined additions.

---

### `best_for` field

| Option | Description | Selected |
|--------|-------------|----------|
| Keep it | Stays in bottleEntry, shown in edit popover. Recommender can use it. | ✓ |
| Drop it | Remove from schema and UI. ROADMAP doesn't list it. | |

**User's choice:** Keep in schema and forms as an optional field — nulls/empty acceptable.

---

### Tier migration

| Option | Description | Selected |
|--------|-------------|----------|
| Silent remap on migration write | Map old 4 values to closest new equivalent. | |
| Clear old tier — user re-tags manually | Old tier values become null on migration. User re-tags via edit popover. | ✓ |

**User's choice:** Clear old tier and allow user to re-tag manually.
**Notes:** User also revised the tier list from the ROADMAP spec. New 6-tier system: **Well → Standard → Premium → Craft → Boutique → Rare/Exceptional** (not the 7-tier Dirt Cheap → … → Craft list in ROADMAP).

---

## Edit Popover UX

### Interaction pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Anchored popover over the chip | Small card above/below the clicked chip. Dismissed by clicking outside. | |
| Inline expand below chip grid | Section expands below the chip grid with a pre-filled mini-form. No overlay. Works on mobile. | ✓ |
| Modal dialog | Centered modal with all fields. Simpler but feels heavy. | |

**User's choice:** Inline expand below chip grid

---

### Fields in edit form

| Option | Description | Selected |
|--------|-------------|----------|
| All 6 fields | brand, style, type, tier, best_for, notes — full edit experience. | |
| brand + tier only, expand for more | Minimal first, 'More fields' toggle reveals rest. | |
| style + type only, expand for more | Minimum is style + type; expand reveals brand, tier, best_for, notes. | ✓ |

**User's choice:** style + type only (minimum) — expand to show brand, tier, best_for, notes.
**Notes:** Users should be able to add just "Bourbon" as a Whiskey with no brand or tier required.

---

### Save/discard behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Save button — writes to State immediately | Explicit Save + Revert buttons. Dirty-state bar handles GitHub write. | ✓ |
| Auto-save on blur/close | Collapsing the form auto-saves. No explicit Save button. | |

**User's choice:** Save button + Revert/Undo button.
**Notes:** User explicitly requested timestamps on all fields and JSON entries so that undo is possible. Add `created_at` and `updated_at` to every `bottleEntry`.

---

### Revert scope

| Option | Description | Selected |
|--------|-------------|----------|
| Revert to state when edit form was opened | Snapshot on open; Revert restores snapshot. | ✓ |
| Full undo history (multi-level) | Full undo stack tracking every change. | |

**User's choice:** Revert to state when edit form was opened (for Phase 4).
**Notes:** User requested full multi-level undo added to the roadmap as a Phase 5+ backlog item.

---

## Recommender Session State

### Mood slider re-ranking trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Live as slider drags (oninput) | Scores re-rank as slider moves. | |
| On release (onchange) | Scores re-rank when user lifts finger / releases slider. | ✓ |

**User's choice:** On release (onchange)

---

### Slider state on page load

| Option | Description | Selected |
|--------|-------------|----------|
| Reset to saved profile on every page load | Sliders start at saved profile values each time. | |
| Persist in sessionStorage | Slider positions kept in sessionStorage while tab is open. | |

**User's choice:** Reset to saved profile when user navigates away and returns.
**Notes:** User also requested a "Save changes to profile" button on the Recommender page to persist mood overrides to the actual profile.

---

### Scope toggle behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Cumulative — each level adds a section | "Allow 1 missing" adds one-away below buildable; "Allow 2 missing" adds two-away below that. | ✓ |
| Exclusive — toggle swaps the view | Toggle controls which section is active; mutually exclusive. | |

**User's choice:** Cumulative — each level adds a section

---

### Occasion filter UX

| Option | Description | Selected |
|--------|-------------|----------|
| Multi-select chip bar (like base-spirit filter) | Chip bar above results; multi-select. Consistent with existing filter. | ✓ |
| Single-select dropdown | Simpler but limits narrowing to one occasion. | |

**User's choice:** Multi-select chip bar (like base-spirit filter)

---

## Canonical Name Matching

### Matching strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Curated lookup table | Static JS object mapping variants to canonical names. Fast, deterministic. | |
| Fuzzy match (edit distance) | Levenshtein ≤ 2 edits. More forgiving of typos. | |
| Curated list + fuzzy fallback | Starts with curated lookup, edit-distance fallback for unrecognized inputs. | ✓ |

**User's choice:** Curated list + fuzzy fallback

---

### Suggestion UX

| Option | Description | Selected |
|--------|-------------|----------|
| Inline tooltip under the input | Appears below input while typing, dismissed when user stops editing. | |
| Inline suggestion banner with 'Use it' link | Banner replaces input hint: "Did you mean: X? [Use it]". Clicking fills input. | ✓ |

**User's choice:** Inline suggestion banner with "Use it" link

---

### Canonical name seed

| Option | Description | Selected |
|--------|-------------|----------|
| Seeded from classics DB ingredients | Covers what the recommender actually needs to match. | |
| Separate hand-curated master list | Broader coverage but needs maintenance. | |
| DB ingredients + curated additions | Both — DB as base, curated entries on top. | ✓ |

**User's choice:** DB ingredients + curated additions

---

## Strainer Field Placement

### Data model location

| Option | Description | Selected |
|--------|-------------|----------|
| Top-level in inventory.json (new equipment section) | `inventory.json` gets `equipment: { strainers: [] }`. | ✓ |
| In barkeeper.json | Bartender "tools of the trade". | |
| In bar-owner-profile.json | Bar equipment as a profile preference. | |

**User's choice:** Top-level in inventory.json (new equipment section)

---

### UI location

| Option | Description | Selected |
|--------|-------------|----------|
| New Equipment tab in Inventory view | New tab alongside Spirits, Pantry, Vetoes. Extensible for future tools. | ✓ |
| Bottom of Spirits tab | Simpler but mixes equipment with bottles. | |
| Settings page | Configuration-like feel. | |

**User's choice:** New Equipment tab in Inventory view

---

## Recommender Engine Ingredient Matching

| Option | Description | Selected |
|--------|-------------|----------|
| Concatenate brand+style+type | Join all fields into one search string. | |
| Style is primary match, brand is secondary | Engine tries style first ('bourbon'), then brand ('buffalo trace'). | ✓ |
| You decide | Claude designs matching approach. | |

**User's choice:** Style is primary match, brand is secondary

---

## Two-Away Shopping List Linking

| Option | Description | Selected |
|--------|-------------|----------|
| Both missing items get shopping list links | Two-away banner shows both with individual "Add to shopping list" links. | ✓ |
| Only the first missing item links | Simpler card, links only highest-priority missing ingredient. | |
| You decide | Claude decides. | |

**User's choice:** Both missing items get shopping list links

---

## Recommender Page Layout

### Overall layout

| Option | Description | Selected |
|--------|-------------|----------|
| Stacked controls above results, sliders collapsible | Controls panel above results; mood sliders in collapsible panel. | |
| Sidebar layout (controls left, cards right) | Sidebar with all controls; recipe cards fill right column. | |
| Responsive (user selection) | Device-dependent via CSS — sidebar on desktop, stacked on mobile. | ✓ |

**User's choice:** CSS-responsive — sidebar layout when space permits (desktop), stacked controls when space does not permit (mobile).

---

### Mood slider visibility

| Option | Description | Selected |
|--------|-------------|----------|
| Sliders always visible (compact row) | Sliders always visible above filter chips. | |
| Sliders collapsed by default (toggle to expand) | Hidden behind "Adjust Mood" toggle. | |
| Device-dependent (user selection) | Desktop: always visible in sidebar. Mobile: collapsed behind toggle. | ✓ |

**User's choice:** Device-dependent — always visible on desktop sidebar, collapsed behind toggle on mobile.

---

## Claude's Discretion

- Exact Levenshtein edit-distance threshold for fuzzy canonical matching
- CSS breakpoint for desktop/mobile layout switch (follow existing app.css patterns)
- Type enum seed list composition (standard spirits + common liqueur categories)
- Animation/transition on inline edit form expand/collapse

---

## Deferred Ideas

- **Full multi-level undo history** — User requested as a Phase 5+ feature. Timestamp fields in D-04 lay groundwork but full undo requires a change stack.
- **Type enum persistence to GitHub** — Custom-added types live in localStorage only for Phase 4. Persisting to GitHub is a future consideration.
- **Page-level inventory import** — Inventory page with its own targeted JSON import (from Phase 3 UAT backlog).
