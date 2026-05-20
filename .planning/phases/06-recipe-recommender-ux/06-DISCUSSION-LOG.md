# Phase 6: Recipe & Recommender UX - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-20
**Phase:** 06-recipe-recommender-ux
**Areas discussed:** Originals in universal modal, Duplicate guard, Phase completion & handoff

---

## Originals in universal modal

### Q1: Behavior when clicking a Favorite/Wishlist/Made chip with _source:'originals'

| Option | Description | Selected |
|--------|-------------|----------|
| Modal + link to Originals | Modal + small 'Edit in Originals →' link at bottom | |
| Modal only | Universal modal for all sources, no edit link | |
| Navigate directly | Skip modal, go straight to Originals detail view | |
| Full recipe editable in modal | Modal detects _source and unlocks all recipe fields | ✓ |

**User's choice:** Full recipe editable in modal (Phase 6)
**Notes:** User articulated a clear design principle: "Pages are simply ways of organizing chips. Being on the 'Originals' tab of 'Recipes' is one way to edit original recipes, but if an original recipe is accessed elsewhere (Favorites, Wishlist, or even Recommendations), then all editable fields should be editable." Non-originals have ingredient/instruction fields locked to prevent editing.

---

### Q2: Where does the save write when editing an Original via modal?

| Option | Description | Selected |
|--------|-------------|----------|
| Dual-write | Writes to recipes.originals AND patches inline copy in the list | ✓ |
| Originals only | Writes to recipes.originals only; inline copy stays stale | |

**User's choice:** Dual-write (Recommended)
**Notes:** Keeps data consistent across all views without requiring the user to remove and re-add the chip.

---

### Q3: Originals in Recommender — when and how?

| Option | Description | Selected |
|--------|-------------|----------|
| Originals in Recommender — Phase 6 | Add to scoring pool, RecommenderEngine gets Originals as second input | ✓ |
| Static section | Originals as a 'Your Originals' section, not mood-scored | |
| Defer to Phase 7 | Engine change deferred | |

**User's choice:** Originals in Recommender — Phase 6
**Notes:** User explicitly requested Originals be discoverable in Recommender with personalized, mood-based scoring.

---

### Q4: How should Originals appear in Recommender results?

| Option | Description | Selected |
|--------|-------------|----------|
| Score same, badge them | Mixed into regular results with 'Your original' badge | ✓ |
| Score same, separate section | Mood-scored but visually separated | |

**User's choice:** Score Originals same as classics, badge them (Recommended)
**Notes:** Originals with missing `base` or `ingredients` are excluded from scoring.

---

## Duplicate guard

### Q1: Tapping ♥ on a recipe already in Favorites

| Option | Description | Selected |
|--------|-------------|----------|
| Toggle removes — no duplicates | Add is blocked when present; filled button removes | ✓ |
| Allow duplicates | Each tap adds a new entry | |

**User's choice:** Toggle removes — no duplicates possible (Recommended)

---

### Q2: Can the same recipe be in both Favorites and Wishlist?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — independent | Same recipe can be in both simultaneously | ✓ |
| Mutually exclusive | Auto-move between lists | |

**User's choice:** Yes — Favorites and Wishlist are independent
**Notes:** Different intents: Favorites = loved it; Wishlist = want to try it.

---

### Q3: Duplicate check key

| Option | Description | Selected |
|--------|-------------|----------|
| By name | Case-insensitive name match | |
| By name + base spirit | Handles recipes with same name but different bases | ✓ |
| You decide | Claude's discretion | |

**User's choice:** By name + base spirit

---

## Phase completion & handoff

### Q1: How to formally verify Phase 6?

| Option | Description | Selected |
|--------|-------------|----------|
| Full UAT + validation | TEST-CHECKLIST.md + UAT.md like Phases 3–5 | ✓ |
| Light checklist | Quick smoke-test in PLAN.md only | |
| Auto-verify | Skip formal verification, use /gsd:verify-work | |

**User's choice:** Full UAT + validation (like prior phases)

---

### Q2: UAT scope

| Option | Description | Selected |
|--------|-------------|----------|
| All 8 reqs + gap tasks + new additions | Full coverage including editable modal, Originals in Recommender, dedup | ✓ |
| Original 8 ROADMAP requirements only | New additions get their own UAT when planned | |

**User's choice:** All 8 reqs + gap tasks + new additions
**Notes:** User explicitly stated "do NOT start planning or executing until I give the proper GSD commands myself."

---

## Claude's Discretion

- 'Your original' badge styling: amber-colored, consistent with existing badge patterns in the codebase
- Mood axis weights for Originals that don't have them: default to 0.5 (neutral)
- Originals lacking `base` or `ingredients` excluded from Recommender scoring

## Deferred Ideas

- AI-generated recipe chips from chat sessions landing in made_log / favorites — Phase 7
- `_source: 'ai-generated'` routing beyond the _source field — Phase 7
- 'Your original' badge hover tooltip showing creation date / creator — Phase 7 polish
- Tally reset confirmation dialog — skipped for simplicity
