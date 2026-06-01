# Chip Unification — Mini-Phase Plan

> Non-GSD mini-phase surfaced during Phase 7 UAT Test 12. Three atomic commits, single session.

**Status:** SHIPPED 2026-05-27 — commits `946e3c9` (1/3) + `9527dce` (2/3) + the commit landing this update (3/3). All 57 deterministic tests green. The legacy `State.get('recipes')` compat shim is retained as a TRANSITIONAL bridge because non-recipes-view callers (recommender.js / export.js / claude-api.js / profile.js) still read `.originals` / `.confirmed_favorites` / `.wishlist` / `.made_log` directly; those callers are queued for a follow-up cleanup commit. The chip behavior layer — pool-aware writes inside recipes.js, RecipeChip.bindActions, click-to-render via the `body` handler, the embedded "Tweak with AI" panel on every chip, seeded-core lock enforcement in renderForm — is in place.
**Trigger:** UAT 9 noted Originals chips render differently from other chips; UAT 12 surfaced architectural friction (two Generate-with-AI entry points, draft Edit affordance missing, save-storm bugs under rapid CRUD all stemming from per-array storage with stale indices and no unified renderer).
**Outcome:** Single canonical recipe pool, single chip renderer, locked-core seeded classics, AI-tweak input on every chip.

---

## Design contract (locked, per user 2026-05-27)

**Storage:**
- `data/recipes.json` becomes the canonical pool: `{ pool: [Recipe…], last_updated, _schema_version: 2 }`.
- `data/drafts.json` deprecated — drafts fold into the pool as `status: 'draft'`.
- `classics-db*.js` stays as a read-only seed file (169 entries). Seeded chips are **overlay-only references** to seeds, not copies (C-2 decision: live overlay, future seed updates auto-apply).

**Recipe superset:**
- Core fields (name / ingredients / method / etc.) — locked when `seed_id` is set (per C-1: uneditable but not visually grayed out).
- Overlay fields (is_favorite / is_wishlist / made_log / ratings / user_notes / images) — editable on every chip, including seeded classics.
- Draft-only fields (draft_id / source_prompt / parent_id / created_at / updated_at) — present iff `status === 'draft'`.

**Tabs become filter views, not arrays:**
- Originals → `pool.filter(r => r.status === 'original')`
- Drafts → `r.status === 'draft'`
- Favorites → `r.is_favorite`
- Wishlist → `r.is_wishlist`
- Made → `r.made_log.length > 0`
- Recommender → `r.status === 'classic' || r.status === 'original'`

**Behavior matrix:**

| status | Click body | Core editable | Overlay editable | ♥ ☆ ✓ | AI tweak | Promote | Discard |
|---|---|---|---|---|---|---|---|
| `classic` (seed_id set) | Render (view core + edit overlay) | NO | YES | YES | YES → new draft | — | hide (soft) |
| `original` | Render (full edit) | YES | YES | YES | YES → new draft | — | hard delete |
| `draft` | Render (full edit) | YES | YES | YES | YES → another draft (fork) | YES → original | YES |

---

## Commit plan

### Commit 1 — Schema + Normalize + State migration
**Files:** `schema/recipes.schema.json` (rewrite for pool), `schema/drafts.schema.json` (deprecate marker), `app/js/normalize.js` (add `Normalize.recipe()`, rewrite `Normalize.recipes()` to coerce old shape → pool), `app/js/state.js` (post-load migration that detects legacy `data/drafts.json` content and folds it into the pool on first load), `tests/phase-07-ai.test.js` (add migration coverage).

Old shape transparently migrates to pool on first `State.loadAll`. Reads via a thin compat shim (`State.get('recipes')` returns derived `originals` / `confirmed_favorites` / `wishlist` / `made_log` getters that filter the pool) so commit 1 leaves the app readable even before commit 2 ships the new renderer.

Writes via legacy patches (`State.patch('recipes', r => r.originals.push(...))`) **will be broken** between commits 1 and 2 — acceptable because we ship all three together.

### Commit 2 — RecipeChip renderer + view rewrites
**Files:** `app/js/recipe-chip.js` (new — single `RecipeChip.render(recipe, opts)` function), `app/js/views/recipes.js` (gut tabs into filter views, all chip rendering through RecipeChip), `app/js/views/recommender.js` (read pool with status filter), `app/js/views/dashboard.js` (counts), `app/js/recommender-engine.js` (pool-aware), `app/index.html` (load recipe-chip.js).

Click-to-render on chip body. Tabs become filter views. Old-shape getters from commit 1's shim become unused after this commit; can be removed in commit 3.

### Commit 3 — Behavior layer
**Files:** `app/js/recipe-chip.js` (AI tweak input on every chip + lock-seeded-core write enforcement), `app/js/views/recipes.js` (Save-and-Promote flow now operates on pool entries), `app/js/normalize.js` (drop the compat shim now that no caller uses it).

AI tweak forks any chip → new draft with `parent_id` = source chip's id. Seeded classics' core fields are visibly locked (no input, just rendered text); attempting to write to a seeded core via State.patch is rejected at the normalize layer.

---

## Acceptance / verification at end

- `node tests/*.test.js` all green; new migration tests pass.
- Hard-reload in browser → existing data renders via the pool (originals visible, drafts visible, favorites/wishlist/made counts correct).
- All chips rendered by a single function call site (`grep -c "RecipeChip.render" app/js/` ≥ 4 across views).
- Click any chip body → opens render view (edit for user-owned, view+overlay for classics).
- AI-tweak input present on every chip; submitting creates a new draft with `parent_id` linking back to the source.
- Save-and-Promote on a draft → pool entry status flips `draft → original`, draft fields cleared, single State.save.
- `recipes.confirmed_favorites` legacy array no longer present in `data/recipes.json` after first save.

---

## Resume protocol

After all 3 commits land + verification: update STATE.md status back to `phase_executed_awaiting_uat`, rewrite `07-UAT.md` Tests 12-15 to exercise the unified flow, resume the UAT walkthrough at the rewritten Test 12.

If any commit fails mid-way, revert all 3 and surface the failure to the user with diagnosis.
