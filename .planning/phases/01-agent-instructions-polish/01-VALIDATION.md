---
phase: 1
slug: agent-instructions-polish
status: validated
nyquist_compliant: false
wave_0_complete: true
created: 2026-05-12
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — markdown prompt-engineering project; no test runner |
| **Config file** | none |
| **Quick run command** | `bash app/tests/phase-01-checks.sh` |
| **Full suite command** | Manual checklist — see `01-HUMAN-UAT.md` |
| **Estimated runtime** | < 5 seconds (static analysis script); ~10–15 minutes (manual LLM session) |

---

## Sampling Rate

- **After every task commit:** Serve nothing — run `bash app/tests/phase-01-checks.sh` for static analysis
- **After every plan wave:** Manual walkthrough of ROADMAP Phase 1 success criteria
- **Before `/gsd-verify-work`:** All ROADMAP success criteria must pass
- **Max feedback latency:** One script run per task

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| AGENT-01 | 01 | 2 | AGENT-01 | — | WRONG/RIGHT block + numbered-list ban present in 3 agent files | smoke | `bash app/tests/phase-01-checks.sh 2>&1 \| grep AGENT-01` | ✅ | ✅ green |
| AGENT-02 | 02 | 1 | AGENT-02 | — | always-show-menu rule + Exception(named tasks only) in monolith + module | smoke | `bash app/tests/phase-01-checks.sh 2>&1 \| grep AGENT-02` | ✅ | ✅ green |
| AGENT-03 | 03 | 1 | AGENT-03 | — | Auto 3 image variants; 1920s Vintage ref; flavor axes excluded; offer-to-suggest ABSENT | smoke | `bash app/tests/phase-01-checks.sh 2>&1 \| grep AGENT-03` | ✅ | ✅ green |
| AGENT-04 | 04 | 1 | AGENT-04 | — | width=400 + [cocktailN]-image.png at all 3 sync points; old width=200 ABSENT | smoke | `bash app/tests/phase-01-checks.sh 2>&1 \| grep AGENT-04` | ✅ | ✅ green |
| AGENT-05 | 02 | 1 | AGENT-05 | — | INSTALL.md init blocks for ChatGPT, Gemini, Grok | smoke | `bash app/tests/phase-01-checks.sh 2>&1 \| grep AGENT-05` | ✅ | ✅ green |
| AGENT-06 | 05 | 2 | AGENT-06 | — | Bartender Personalization step 2; 5 voice presets; 5 specialty options; D-13 field order | smoke | `bash app/tests/phase-01-checks.sh 2>&1 \| grep AGENT-06` | ✅ | ✅ green |
| SC1 | 02 | 1 | ROADMAP SC1 | — | INIT_PROMPT suppresses options menu on fresh session | manual | — | — | ⬜ pending |
| SC2 | 01 | 2 | ROADMAP SC2 | — | One-question rule runtime compliance per agent turn | manual | — | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `app/tests/phase-01-checks.sh` — static analysis checks for AGENT-01 through AGENT-06
- [x] `01-HUMAN-UAT.md` — manual UAT steps for SC1 and SC2

*Wave 0 was not formally executed (no test script existed during phase execution). Script created retroactively via Nyquist audit 2026-05-12.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Starting a fresh ChatGPT/Claude/Gemini/Grok session with INIT_PROMPT produces onboarding immediately — NOT an options menu | SC1 | Platform-level behavior triggered by Conversation Starters / opening message config. Cannot observe whether the agent actually suppresses the options menu without a live session. | Paste the Standard init block from INSTALL.md as a Conversation Starter (ChatGPT), opening message (Gemini), or system prompt (Grok). Send any message. Agent should ask a single onboarding question immediately — no menu, no capability summary. |
| Agent asks exactly one question per turn during onboarding | SC2 | Runtime LLM behavioral constraint. WRONG/RIGHT block and numbered-list ban are statically verified present, but actual compliance requires observing agent output in a live session. | Start an onboarding session. Answer a question. Verify the agent's next reply contains exactly one question and no numbered list. Repeat for 5 consecutive turns. |
| 8-item session-start menu displayed for returning user | SC5 (intentional deviation) | SC5 roadmap says ≤7 items; D-09 (locked) sets 8 items. Roadmap wording was not updated when D-09 locked 8 items. Static check verifies "Chat about something else" (item 8) present; runtime compliance requires a returning-user session. | Start a session as a returning user (profile already set). Verify the menu appears with items 1–8, no preamble, single greeting line above. |

---

## Validation Sign-Off

- [x] All tasks have automated verify command or manual-only justification
- [x] Wave 0 script created (retroactively, 2026-05-12)
- [ ] All ROADMAP success criteria pass in live LLM session (manual — pending)
- [ ] No console errors during session walkthrough
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** partial — 6/6 code-level requirements have automated static analysis; 2 (SC1, SC2) are runtime-only manual

---

## Validation Audit 2026-05-12

| Metric | Count |
|--------|-------|
| Gaps found | 6 |
| Resolved (automated) | 6 |
| Escalated (manual-only) | 2 |
| Static analysis checks | TBD (see phase-01-checks.sh) |
| Checks passing | TBD |
