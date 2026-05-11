# Phase 2: Web UI UX & Settings - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-11
**Phase:** 2-Web UI UX & Settings
**Areas discussed:** Bjorn avatar images, Onboarding skip/return flow, Slider axes + data migration, Settings vs. Setup relationship, Dashboard quick-action grid, Free-text inventory paste, Inventory category filter, Reset All Data, Nav state for unconfigured users, Full onboarding step order

---

## Bjorn Avatar Images

**Image source question:**

| Option | Description | Selected |
|--------|-------------|----------|
| Placeholder SVG/CSS only | Stand-in, real images swapped in later | |
| AI-generated images added now | Commit to app/images/ in this phase | |
| User supplies image URL | Avatar URL field in Settings | |
| Existing images/ directory | Use files already in the repo | ✓ |

**User's choice:** Images already exist in the `images/` directory of the repo.

**Image assignment question (user specified manually):**

**User's choice:** 
- `barkeeper_bjorn_001.png` → welcome/onboarding screen
- `bar_equipment_001.png` → header graphic on setup/install/onboarding pages
- `barkeeper_bjorn_002.png` → questions/AI interaction contexts
- `barkeeper_bjorn_icon.png` → (inferred) small icon in main header nav bar

**Notes:** User explicitly requested these assignments. Also noted a future need to generate diverse bartender images (different races, male/female) so users can choose or upload their own bartender avatar during personalization.

---

## Onboarding Skip/Return Flow

**What skip saves:**

| Option | Description | Selected |
|--------|-------------|----------|
| Save nothing, leave field null | Clean, honest, no defaults | |
| Save a neutral default | Midpoint for axes, placeholder for text | |
| Mark as explicitly skipped | _skipped flag per step | |
| Hybrid per step type | Defaults for bartender fields, midpoints+flag for axes, flag only for personal info | ✓ |

**User's choice:** Nuanced hybrid — defaults for bartender identity fields, midpoint + _skipped flag for preference axes, _skipped flag only for personal fields (name, location, etc.). User wants the behavior table in CONTEXT.md to be editable so they can change any row before planning.

**Resume banner:**

| Option | Description | Selected |
|--------|-------------|----------|
| Progress banner on Dashboard | Top of returning-user view, disappears when complete | ✓ |
| Card in quick-action grid | Replaces/supplements one action | |
| Nav badge + greeting hint | Badge on nav item + greeting line | |

**Onboarding complete trigger:**

| Option | Description | Selected |
|--------|-------------|----------|
| Reached the Done step | Complete regardless of skips | ✓ |
| All required fields filled | Banner persists until all answers given | |
| User explicitly dismisses | Manual dismiss of banner | |

**Resume destination:**

| Option | Description | Selected |
|--------|-------------|----------|
| Resume from first skipped step | Skip to first unanswered step | ✓ |
| Restart from step 1 | Full wizard re-navigation | |
| Skipped-steps summary page | Dedicated page for outstanding steps | |

---

## Slider Axes + Data Migration

**Slider display:**

| Option | Description | Selected |
|--------|-------------|----------|
| Labeled poles, no numbers | Left/right pole labels + Middle tick mark | ✓ |
| Numeric value shown | 0–100 or 1–10 displayed | |
| 5 snap points with labels | Strong A / Lean A / Middle / Lean B / Strong B drag | |

**Data migration:**

| Option | Description | Selected |
|--------|-------------|----------|
| Overwrite on next save | Float replaces string on next user save | ✓ |
| Convert + save on first open | Silent conversion on first render | |
| Keep string storage | Round-trip string conversion | |

**Notes:** Recommender's `_normalizeProfile()` already handles both string and float position values — no engine changes required. Migration is passive and transparent.

---

## Settings vs. Setup Relationship

**Setup role after configuration:**

| Option | Description | Selected |
|--------|-------------|----------|
| Setup = first-run only, Settings takes over | Settings becomes ongoing config hub | ✓ |
| Keep both accessible always | Some overlap accepted | |
| Settings replaces Setup entirely | First-time users go to Settings | |

**Settings page contents in Phase 2:**

| Option | Description | Selected |
|--------|-------------|----------|
| GitHub config + bartender + logout + danger zone | Full config hub, Anthropic key grayed/absent | ✓ |
| Bartender + logout + danger zone only | GitHub stays in Setup | |
| Include Anthropic key field now (non-functional) | Stored but unused until Phase 5 | |

**Nav bar change:**

| Option | Description | Selected |
|--------|-------------|----------|
| Replace Setup link with gear icon | Setup accessible via Settings link | ✓ |
| Keep both Setup + Settings in nav | Two nav items | |
| Remove Setup from nav entirely | All config through Settings | |

---

## Dashboard Quick-Action Grid

**Phase 5 placeholder behavior:**

| Option | Description | Selected |
|--------|-------------|----------|
| Grayed-out with "Coming soon" badge | Toast on click pointing to Settings for Anthropic key | ✓ |
| Only add working items now | Classroom/Chat added in Phase 5 | |
| Active links to placeholder pages | Route to stub pages | |

---

## Free-text Inventory Paste (ONB-04)

**Input format:**

| Option | Description | Selected |
|--------|-------------|----------|
| One item per line | Newline-delimited | |
| Comma-separated | "Bulleit Bourbon, Aperol, Angostura Bitters" | ✓ |
| Freeform paragraph | Best-effort extraction | |

**After parsing:**

| Option | Description | Selected |
|--------|-------------|----------|
| Parse + preview chips, confirm to save | Chip list, remove misparsed items, then save | ✓ |
| Parse and save immediately | Fix mistakes in Inventory view | |
| Parse + auto-categorize + grouped preview | Auto-category detection | |

**Target inventory section:**

| Option | Description | Selected |
|--------|-------------|----------|
| Add to spirits section only | Most common use case, note to user | ✓ |
| User picks a category for the batch | Section picker after chip preview | |
| No category choice — spirits only | No note needed | |

---

## Inventory Category Filter (INV-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Smooth scroll to section | scrollIntoView, all sections visible | ✓ |
| Filter to show only selected section | Hides other sections | |
| Jump + filter within section | Scroll + filter combined | |

---

## Reset All Data (SETTINGS-04)

**What gets reset:**

| Option | Description | Selected |
|--------|-------------|----------|
| Reset data files only, keep GitHub credentials | Profile/inventory/recipes/barkeeper reset; PAT preserved | ✓ |
| Full wipe including GitHub credentials | Factory reset | |
| User chooses scope in dialog | Two-option reset dialog | |

**Confirmation pattern:**

| Option | Description | Selected |
|--------|-------------|----------|
| Two-click reveal | First click reveals second "Yes, delete everything" button | ✓ |
| Type 'RESET' to confirm | Typed phrase gate | |
| Browser confirm() dialog | Native dialog | |

---

## Nav State for Unconfigured Users

| Option | Description | Selected |
|--------|-------------|----------|
| Setup-only nav before config | Only Setup visible until configured | ✓ |
| Full nav but disabled links | All links shown, grayed with tooltip | |
| No nav before config | Nav hidden entirely | |

---

## Full Onboarding Step Order

| Option | Description | Selected |
|--------|-------------|----------|
| Bartender-first (matches D-13) | welcome → bartender name/voice/specialty → your name → location → background → equipment → inventory paste → 6 axes → smoke → done | ✓ |
| Your name first, then bartender | welcome → your name → bartender → … | |
| User specifies exact order | Custom | |

---

## Claude's Discretion

- Exact wording of progress banner, "Coming soon" toast, and confirmation messages
- Visual treatment of grayed-out dashboard cards (opacity, badge style)
- Layout of 6/7-item dashboard grid (2×3 vs. 3+3 vs. other arrangement)
- Whether search input and category dropdown appear on the same row or stacked
- Avatar image sizing and CSS treatment in header vs. onboarding welcome
- Whether to show 6 or 7 dashboard grid items (include Classroom alongside Chat, or just Chat)

## Deferred Ideas

- **Diverse bartender avatars** — Different races, genders for personalization; user can choose or upload their own image. Future phase.
- **Anthropic API key in Settings** — Intentionally Phase 5; absent from Phase 2 Settings page.
- **Profile view slider editing** — Whether `#profile` view also gets editable sliders; out of scope for Phase 2.
