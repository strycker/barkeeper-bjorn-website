---
phase: 02-web-ui-ux-and-settings
plan: 04
subsystem: inventory
tags: [inventory, search, filter, category-scroll]

# Dependency graph
requires:
  - phase: 02-web-ui-ux-and-settings
    provides: nav gear icon + header avatar (plan 02); onboarding (plan 01)
provides:
  - Real-time inventory search input filtering bottle chips scoped to #tab-content
  - Section headers hidden when zero chips match search
  - Category dropdown smooth-scrolling to matching .inventory-section
  - Search reset on tab switch
  - CSS: .inv-search-bar, .inv-search-input, .inv-category-select with mobile breakpoint

key-files:
  created:
    - ".planning/phases/02-web-ui-ux-and-settings/02-04-SUMMARY.md"
  modified:
    - "app/js/views/inventory.js"
    - "app/css/app.css"

requirements-completed: [INV-01, INV-02]
---

# Phase 02 Plan 04: Inventory Search + Category Filter

**Added real-time inventory search and category jump-scroll to the Inventory view. Search bar (text input + category dropdown) inserted above tabs; chips filter on every keystroke; category select smooth-scrolls to matching section.**

## Accomplishments

- Search bar (INV-01): `.inv-search-bar` div inserted before tabsEl in sectionsEl; `input` event fires on every keystroke; `.bottle-chip` visibility toggled scoped to `#tab-content` (not document); `.inventory-section-title` hidden when all chips in section are hidden
- Category scroll (INV-02): category `<select>` lists all BOTTLE_SECTIONS + STRING_SECTIONS; `change` event smooth-scrolls to `.inventory-section[data-sectionKey]`; select resets to "" after jump
- Tab switch reset: `searchInput.value = ''` + re-trigger `input` event in tab click handler prevents stale filter across tabs
- New CSS: .inv-search-bar (flex row, gap 8px), .inv-search-input (flex: 1), .inv-category-select (width 180px); mobile breakpoint stacks to column at 480px

## Key Decisions

- Search scoped to `document.querySelector('#tab-content')` — never `document.querySelectorAll('.bottle-chip')` (Pitfall 3: cross-tab contamination)
- Section header hidden (not entire section) — chips remain in DOM for instant re-show on clear
- Utils.escapeHtml on s.key and s.label when building category option elements

---

*Phase: 02-web-ui-ux-and-settings*
*Completed: 2026-05-12*
