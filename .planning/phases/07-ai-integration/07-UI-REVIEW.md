---
phase: 7
slug: ai-integration
audited_at: 2026-06-13
audited_files_count: 11
baseline: abstract 6-pillar standards (no UI-SPEC.md — user skipped UI-SPEC at planning time)
screenshots: not captured (no dev server running on :8000 / :3000 / :5173 — code-only audit)
score_total: 18
pillar_scores:
  copywriting: 3
  visuals: 3
  color: 4
  typography: 2
  spacing: 2
  experience_design: 4
---

# Phase 7 — UI Review

**Audited:** 2026-06-13
**Baseline:** abstract 6-pillar standards (project ui-brand.md is a CLI/orchestrator pattern reference, not a webapp design contract)
**Screenshots:** not captured — no dev server was running on the three probed ports. Audit is therefore a static code review against the abstract pillars + project conventions in CLAUDE.md (vanilla ES6 IIFE, single stylesheet, dark amber/bourbon theme, CSS custom properties).

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | CTAs are mostly specific and verb-led ("Generate Tweaked Draft", "Save and Promote to Original", "Ask Bjorn about this"); empty states are present everywhere but a few generic strings linger ("Nothing here yet", "Send"). |
| 2. Visuals | 3/4 | Status badges + flag glyphs give the chip system real visual identity and resolve BL-2 visual parity. Hierarchy is clear. Streaming bot bubble has no in-flight indicator (relies on tokens arriving) and no visible Stop/Abort affordance even though the controller exists. |
| 3. Color | 4/4 | Strict token discipline: 12 named custom properties, accent-amber is reserved for headings/links/primary actions/badges, status badges use the three semantic hues (blue=classic, green=original, amber=draft) consistently. No hardcoded hex in any Phase 7 JS view; the 63 rgb/rgba in CSS are all derived from the same token palette via alpha-channel scaling. |
| 4. Typography | 2/4 | 33+ distinct font-size values in a single stylesheet; no scale. Phase 7 contributes nine more in the 0.68–1.4rem range alone (.68, .74, .78, .8, .85, .86, .92, .95, 1.05, 1.15, 1.4). Mixed units (px and rem coexist in the same file). No defined type scale variables. |
| 5. Spacing | 2/4 | 163 ad-hoc pixel spacing decisions in CSS plus 87 inline `style=` attributes in recipes.js and 38 in settings.js. There is no spacing token (no `--space-1` / `--space-2` etc.). Phase 7 work doubled down on inline `style="margin-top:24px"` / `style="display:flex;gap:8px;..."` rather than promoting reusable utility classes. |
| 6. Experience Design | 4/4 | Strong: streaming + abort-on-navigate, persisted vs ephemeral chat surfaces, no-key affordances on every AI entry, URL sanitization in Library (LIB-01), optimistic UI + 3-retry save backoff on chip toggles, near-duplicate guard on AI generation, WeakMap delegated-listener pattern fixes the bug class that bit the team mid-UAT. The chip behavior matrix is tight (classic core-locked, original/draft fully editable). |

**Overall: 18/24**

---

## Top 3 Priority Fixes

1. **Introduce a type-scale token set and migrate Phase 7 styles onto it.** Today there are 30+ unique `font-size` values across the stylesheet with no documented scale; the chip system alone uses `1.05rem` (name), `0.95rem` (flag), `0.85rem` (tagline), `0.8rem` (meta), `0.68rem` (status badge). Add `--fs-xs` through `--fs-2xl` (six steps) to `:root` and replace the Phase 7 selectors (`.recipe-chip-name`, `.recipe-chip-meta`, `.badge-status`, `.lesson-tile-title`, `.library-form label`, `.chat-bubble`) so the entire vertical rhythm becomes auditable. Impact: chip header text and lesson tile titles will share a size; status badge can stop being the smallest single font in the app (0.68rem); accessibility floor lifts.

2. **Move inline `style="..."` blocks in recipes.js and settings.js into named utility/section classes.** `recipes.js` has 87 inline style attributes and `settings.js` has 38, almost all setting one of: `margin-top:24px`, `display:flex;gap:8px;flex-wrap:wrap`, `font-size:0.82rem;color:var(--text-dim)`. The recipe edit form (lines 1539–1650) uses inline `style` to communicate disabled state (`opacity:0.5;cursor:not-allowed;`) and "section card" framing (`padding:12px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius-sm)`). Promote these to `.form-section-card`, `.form-actions-row`, `.muted-help`, `.input-disabled` so the form looks consistent across views and so future audits can grep one selector. Impact: removes the largest source of styling drift; settings.js AI Import/Repair panel currently looks bespoke because every spacing decision is hand-wired.

3. **Add a streaming "thinking…" indicator and a visible Stop button in `chat.js` page + drawer.** The transcript scrolls only when tokens arrive; if the first token is slow (network warmup, large cached context cold-hit), the user sees an empty assistant bubble with no signal that work is happening. The `AbortController` (`_pageController`, `drawerController`) exists and `cleanup()` aborts on navigation, but there is no in-UI Stop affordance — the only way for a user to abort is to navigate away. Add a small "▍" or "…" placeholder text-node prepended to the bubble until the first token arrives, and swap the `Send` button into a `Stop` button (calling `controller.abort()`) while a stream is in flight. Impact: closes the most common chat UX complaint pattern (perceived hang) and makes the existing abort plumbing user-reachable.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)

CTAs and labels are well-targeted in the Phase 7 surfaces:
- `app/js/views/chat.js:207` "Save conversation to GitHub" / `:208` "Clear conversation" — both specific, no "Save"/"OK".
- `app/js/views/library.js:114` "Save" / `:115` "Cancel" within the edit form — these are the rare generic labels (acceptable in modal context but could be "Save link" / "Discard edit").
- `app/js/recipe-chip.js:156` "Promote to Original" and `:159` "Ask Bjorn about this" are exemplary.
- `app/js/views/recipes.js:1646` dynamically swaps to "Save Draft Changes" / "Save Overlay (ratings / notes)" / "Create Recipe" — verb matches the user-visible outcome.

Empty states are present in every Phase 7 view:
- `library.js:151` "No links saved yet. Add your first one above." — directs the user.
- `classroom.js:42` "No lessons available." — terse but accurate.
- `settings.js:396` "No API calls logged yet." — fine.
- `recipes.js:840` "Nothing marked as made yet." — fine.

Generic strings that could be tightened (WARNING):
- `inventory.js:411` `empty.textContent = 'Nothing here yet'` — generic, could name the section.
- `chat.js:214` "Send" — fine for chat, but is the only single-verb CTA in the audit.
- `chat.js:175` `'Nothing to save yet.'` — could be "No conversation to save yet."

Error messages route through `Utils.showToast` and pass the underlying error string verbatim (e.g. `chat.js:185` "Save failed: " + err.message). This is honest and debuggable but can surface raw 429 / SSE text to end users; consider a friendly wrapper that still attaches the raw message as a tooltip/expand.

### Pillar 2: Visuals (3/4)

**Hierarchy** is clear: amber-glow headings, dimmed meta, status badges as colored pills. The `.recipe-chip-name` uses `--amber-glow` (lighter amber) which gives the strongest single visual anchor on every chip. Flag glyphs (♥ ☆ ✓) inherit `--amber` and sit immediately after the name + status badge, forming a clean title row (`recipe-chip.js:214-218`).

**Icon-only buttons:** Both icon-only chip actions (`favorite`, `wishlist`, `made`, `discard` at `recipe-chip.js:161-172`) carry `title=` attributes, which is the right minimum, but no `aria-label` (only chat-transcript carries `aria-live`). For screen-reader parity these should add `aria-label` matching the title text.

**Missing in-flight visual cue (WARNING):** the assistant bubble in `chat.js:119-122` is created empty and stays empty until the first stream token arrives. There is no pulsing cursor, "…", or any visual "thinking" element. The AbortController exists internally but is invisible to the user — see top fix 3.

**Drawer overlay vs persisted page** share styles (`.chat-drawer` extends `.confirm-dialog`) which is good consistency, but the drawer has no visible header indicator distinguishing "this conversation is ephemeral" from the persisted page beyond the title "Quick ask Bjorn" vs "Chat with Bjorn" and the placeholder text "Ask anything — this won't be saved." That placeholder is hidden once the user types; a small persistent badge like "ephemeral" would reinforce the design contract.

**Library URL sanitization** is well-visualized: `library-link--unsafe` renders the title in red italics (`app.css:1716-1719`) with a `title="non-http(s) link rendered as text"` tooltip. Good defense-in-depth, visible to the user.

### Pillar 3: Color (4/4)

Token discipline is strong. `:root` defines 12 named colors (`--bg`, `--bg2`, `--bg3`, `--bg4`, `--border`, `--border2`, `--amber`, `--amber-dim`, `--amber-glow`, `--text`, `--text-dim`, `--text-muted`, plus three semantic accents `--green` / `--red` / `--blue`). Every Phase 7 selector references these — there is not a single hardcoded `#hex` value in chat.js, classroom.js, library.js, recipe-chip.js, or in the Phase 7 CSS blocks.

The 63 `rgba(...)` occurrences I counted in app.css are all alpha-channel derivations of the same palette: e.g. `rgba(212,148,58,0.08)` is `--amber` at 8% used as bot-bubble background (`app.css:1542`), and `rgba(91,155,213,0.15)` is `--blue` at 15% used as classic badge background (`app.css:1856`). This is the right pattern — the only nit is that the RGB values are repeated literally rather than living in a tinting helper, which means a future `--amber` change requires hand-touching the rgba decimals.

Accent (`--amber` / `--amber-glow`) is reserved for: H1s, nav active state, primary CTAs, focus rings, recipe chip name, lesson tile title, library link, amber-dim borders. This is a clean 60/30/10: 60% bg neutrals (`--bg`, `--bg2`, `--bg3`), 30% text neutrals (`--text`, `--text-dim`), 10% accent — verified by spot-grep of `var(--amber` (96 hits across the whole stylesheet, the vast majority on borders/focus/headings).

Status badge triad (classic=blue, original=green, draft=amber) reuses the existing semantic tokens rather than inventing new ones — exemplary token reuse.

### Pillar 4: Typography (2/4)

This is the weakest pillar.

**Sprawl evidence:** `grep -o "font-size: [0-9.]+(rem|px)"` returns ~125 occurrences with 30+ distinct values. Phase 7 lines alone introduce:
- `.chat-page .chat-header h1` 1.4rem (`app.css:1514`)
- `.chat-bubble` 0.95rem (`:1533`)
- `.chat-bubble--error` 0.85rem (`:1551`)
- `.chat-composer textarea` 0.95rem (`:1562`)
- `.classroom-sub` 0.92rem (`:1591`)
- `.classroom-topic h2` 1.15rem (`:1595`)
- `.lesson-tile-title` 1rem (`:1621`)
- `.lesson-tile-body` 0.9rem (`:1626`)
- `.library-form label` 0.86rem (`:1665`)
- `.library-form input/textarea` 0.92rem (`:1675`)
- `.library-card-url` 0.78rem (`:1722`)
- `.library-card-desc` 0.9rem (`:1729`)
- `.library-tag` 0.74rem (`:1748`)
- `.recipe-chip-name` 1.05rem (`:1813`)
- `.recipe-chip-flag` 0.95rem (`:1819`)
- `.recipe-chip-meta` 0.8rem (`:1823`)
- `.recipe-chip-tagline` 0.85rem (`:1832`)
- `.badge-status` 0.68rem (`:1849`)

That's 18 unique sizes added by one phase, in a file where the rest of the app already uses another 15+. The 0.68rem badge size is the smallest in the app and is below conventional accessibility minimums for body-adjacent text (target ≥ 12px ≈ 0.75rem at 16px root).

**Unit drift:** Earlier sections of the stylesheet (e.g. flow-chart styles ~lines 1062–1409) use `px`-based font sizes (12px, 13px, 14px), while Phase 7 uses exclusively `rem`. The mixed-units convention isn't itself wrong but it makes the stylesheet harder to reason about and complicates a future global type-scale migration.

**Font-weight discipline is better:** the audit grep showed only `font-weight: normal` (h1/h2), `bold` (h3/h4), `600` (header-logo, chip name). That's a 3-weight scale, which is healthy.

**Family:** single `'Georgia', serif` body family, monospace only in error bubbles and AI textareas. Consistent.

**Fix:** introduce `--fs-2xs: 0.72rem; --fs-xs: 0.8rem; --fs-sm: 0.875rem; --fs-base: 0.95rem; --fs-md: 1.05rem; --fs-lg: 1.2rem; --fs-xl: 1.4rem;` and snap every Phase 7 selector onto the nearest step.

### Pillar 5: Spacing (2/4)

**No spacing scale.** `:root` defines `--radius`, `--radius-sm`, `--shadow`, `--transition`, but no `--space-*`. Spacing is expressed in raw pixels.

**Ad-hoc pixel density:** 163 occurrences of `(padding|margin|gap):\s*[0-9]+px` in the stylesheet. Phase 7 sections add at least 30 unique values: 2/4/6/7/8/9/10/12/14/16/18/20/22/24/28… etc. Pattern: every new component picks its own padding (`.chat-bubble` 10px 14px, `.library-form` 16px 18px, `.library-card` 14px 18px, `.recipe-chip-actions` margin-top:10px;padding-top:8px). No two are coincident.

**Inline-style scourge:** the worst offender is `recipes.js` with 87 inline `style=` attributes and `settings.js` with 38. Sampled examples from `recipes.js`:
- `:1539` `style="margin-bottom:20px;padding:12px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius-sm);"` — this is a "section card" shape that should be a class.
- `:1633` `style="display:flex;align-items:center;gap:10px;"` — repeated 4× in the same form for checkbox rows.
- `:1645` `style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap;"` — form-actions footer, also repeated.
- `:1641` `style="width:auto;margin:0;${r?.seed_id ? 'opacity:0.5;cursor:not-allowed;' : ''}"` — disabled state communicated via inline style, not a `.input-disabled` class.

`settings.js` sample:
- `:205` `style="font-size:0.82rem;color:var(--text-dim);"` — repeated 6+ times across the file.
- `:236` `style="margin-top:24px;padding-top:16px;border-top:1px solid var(--amber-dim);"` — sub-panel framing.

**Effect:** future redesigns require touching JS files, not just CSS. This violates the "all visual decisions live in `app/css/app.css`" project convention stated in CLAUDE.md.

**Healthier patches:** the chip system itself (`recipe-chip.js`) is markup-only with NO inline styles, and the classroom + library views use almost none. The regression is concentrated in the legacy recipes.js (carried over from earlier phases and extended in Phase 7) and the settings.js AI section.

### Pillar 6: Experience Design (4/4)

The state-handling and interaction story is the strongest pillar.

**Loading states:** streaming token-by-token in chat (no spinner needed — text arrives live). Recipe AI generate has `#rf-generate-status` text status (`recipes.js:1553`). Settings status `<p>` elements throughout.

**Error boundaries:** `chat.js:150-165` catches `AbortError` (silent), then 429/SSE/network and surfaces a dedicated `.chat-bubble--error` red-bordered monospaced bubble AND a 5-second toast. `library.js` and Settings handlers wrap saves in `.catch(err => Utils.showToast(...))` with the raw message. AI generation in `recipes.js` has the `_isNearDuplicateOfPool` near-duplicate guard that throws with a user-friendly toast referencing where the duplicate lives.

**Empty states:** every Phase 7 view has one (see Copywriting findings).

**Disabled states:** AI generate button correctly disables when no key (`recipes.js:1547-1551`), with a `title=` explaining why. Original-checkbox disables for seeded classics with a tooltip explaining the lock (`:1637-1642`). The CSS `.ai-ask-btn:disabled { opacity:0.5; cursor:not-allowed; }` (`app.css:1780`) gives the affordance globally.

**Confirmation for destructive:** `chat.js:251` `confirm('Clear the conversation? This cannot be undone.')`, `library.js:216` `confirm('Remove this link?\n\n' + ...)`. Native `confirm()` is jarring vs the app's custom `.confirm-dialog` overlay (used elsewhere in settings.js logout) — minor inconsistency.

**Optimistic UI + retries:** the chip-unification follow-up (5646147, 2754c2b, 506854d) added optimistic rerender + 3-retry save backoff (300/600/1000ms) + WeakMap-based per-tab handler swap. This is sophisticated; it directly addresses the user-perceived "save flakiness" failure mode that surfaced during UAT 8 (Library) and UAT 12 (Recipes).

**Security as UX:** `library.js:_safeHref` renders `javascript:` URLs as escaped red-italic text with a tooltip explaining why — the user understands what happened. Same for the `library-link--unsafe` class.

**Key gate consistency:** every AI entry point (chat page, drawer, classroom Ask, library Ask, AI generate, AI tweak) checks `ClaudeAPI.getKey()` and shows the same affordance: either an inline "No API key" panel linking to Settings, or a toast "Unlock by adding your Anthropic API key in Settings." Two patterns coexist (panel vs toast); could be unified, but both work.

**Single gap (WARNING but not breaking):** no visible Stop button during chat streams — see top fix 3.

---

## Files Audited

- `/home/user/barkeeper-bjorn-website/.planning/phases/07-ai-integration/07-CONTEXT.md`
- `/home/user/barkeeper-bjorn-website/.planning/phases/07-ai-integration/07-UAT.md`
- `/home/user/barkeeper-bjorn-website/.planning/chip-unification-plan.md`
- `/home/user/barkeeper-bjorn-website/app/css/app.css` (lines 1500–1874 in depth; spot-checked tokens + grep sweeps across full file)
- `/home/user/barkeeper-bjorn-website/app/js/recipe-chip.js` (full read)
- `/home/user/barkeeper-bjorn-website/app/js/views/chat.js` (full read)
- `/home/user/barkeeper-bjorn-website/app/js/views/classroom.js` (full read)
- `/home/user/barkeeper-bjorn-website/app/js/views/library.js` (full read)
- `/home/user/barkeeper-bjorn-website/app/js/views/settings.js` (lines 1–400 in depth; grep sweeps for inline styles)
- `/home/user/barkeeper-bjorn-website/app/js/views/recipes.js` (lines 1450–1650 in depth — edit form; grep sweeps)
- `/home/user/barkeeper-bjorn-website/.claude/get-shit-done/references/ui-brand.md` (confirmed: CLI patterns, not webapp design contract)

Registry audit: skipped — no `components.json` (vanilla ES6 IIFE project, no shadcn).

## UI REVIEW COMPLETE
