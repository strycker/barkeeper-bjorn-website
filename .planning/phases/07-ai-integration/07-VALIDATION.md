---
phase: 7
slug: ai-integration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-21
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Source: `07-RESEARCH.md` → `## Validation Architecture` and `07-AI-SPEC.md` → `## 5. Evaluation Strategy`.
> The Per-Task Verification Map below is populated after planning (planner emits validation refs; run `/gsd-validate-phase 7` to fully reconcile against the final plans).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | `node:test` + `node:assert/strict` (zero-install, matches Phase 6) |
| **Config file** | none — vanilla, no npm/build |
| **Quick run command** | `node tests/phase-07-ai.test.js` |
| **Full suite command** | `for f in tests/*.test.js; do node "$f" || exit 1; done` |
| **Estimated runtime** | ~1 second (no live Anthropic calls — fixtures only) |

> Browser, no-backend, BYOK app: CI runs **only** deterministic offline assertions over recorded fixtures. The Anthropic key never lives in CI; subjective AI behavior is gated by user UAT (`07-UAT.md`) before `/gsd-verify-work`.

---

## Sampling Rate

- **After every task commit:** Run `node tests/phase-07-ai.test.js`
- **After every plan wave:** Run the full suite
- **Before `/gsd-verify-work`:** Full suite green + `07-UAT.md` executed
- **Max feedback latency:** ~2 seconds

---

## Per-Task Verification Map

> Populated post-planning. Each task that produces deterministically-checkable output (schema validity, inventory fidelity, parse success, write-gate presence) gets a `node:test` row; subjective AI behavior rows point to the Manual-Only table.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| _TBD post-planning_ | | | | | | | | | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/phase-07-ai.test.js` — deterministic stubs: schema-shape validation of generated/parsed JSON (recipes/drafts/inventory/profile/barkeeper), inventory-fidelity / no-phantom-ingredient check, JSON parse-success over fixtures, write-gate-present assertion
- [ ] Recorded fixtures: a malformed-JSON-repair input (AI-10), a legacy-markdown-import blob (AI-08), an ambiguous paste-a-line entry (AI-11), a recipe-design output against a known inventory
- [ ] No framework install required (`node:test` is built in)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Streaming chat renders token-by-token in Bjorn's voice with full bar context | AI-02, CHAT-04, CHAT-05 | Requires a live BYOK key + human judgement of voice/context fidelity | Enter key in Settings → open #chat → ask "what should I make tonight?"; confirm streamed response uses real inventory/profile |
| Cocktail balance & technique correctness of AI-designed drinks | AI-03, AI-04 | Subjective domain rubric (LLM-judge/human) | Generate a recipe; confirm balance + correct shake/stir + buildable from inventory |
| Lesson-scoped Classroom Q&A | AI-07 | Live key + judgement | Open #classroom lesson → ask a question → confirm answer is scoped to the lesson |
| Drawer/abort/rate-limit UX | CHAT-06, CHAT-08, CHAT-09 | Live network conditions | Navigate away mid-stream (abort); trigger a 429 to see retry-after surfaced |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 2s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
