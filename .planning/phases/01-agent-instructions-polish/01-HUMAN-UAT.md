---
status: partial
phase: 01-agent-instructions-polish
source: [01-VERIFICATION.md]
started: 2026-05-11T00:00:00Z
updated: 2026-05-11T00:00:00Z
---

## Current Test

Awaiting human testing on live AI platform.

## Tests

### 1. Fresh Session INIT_PROMPT Flow (SC1 / AGENT-02)

expected: Agent immediately begins onboarding with a single question about bar-building goals (Full vs. Minimalist track). It does NOT say "What would you like to do?" or present an options menu or summarize capabilities.
result: pass
reported: "Initial response is the Phase F2 voice-preset question ('Welcome — I'm Barkeeper Bjorn. Before we get started: I come with a default style…'). After 'Keep', asks one bar-building goal question. No options menu. One question per reply."
observation: Onboarding stopped after 2 questions (voice preset + bar-building goal) rather than continuing through identity fields and flavor axes. May indicate premature onboarding termination in agent flow.

**How to test:** On ChatGPT, open the Barkeeper Bjorn Custom GPT configured per INSTALL.md. The Conversation Starter should auto-fire. Observe the first agent response.

### 2. One-Question-At-A-Time Rule in Live Session (SC2 / AGENT-01)

expected: Every agent reply during onboarding asks exactly one question. No numbered question lists. Session-start menu appears immediately after the single greeting line with no explanation of what the agent does.
result: [pending]

**How to test:** During onboarding on any platform, answer one question at a time and watch whether the agent asks only one question per reply. Also try sending a vague opener ("hi") after onboarding to see if the session-start menu appears without preamble.

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps

None pending — all other checks passed automatically (17/17 plan must-haves verified).
