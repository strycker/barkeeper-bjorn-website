# Session State

> *A lightweight scratchpad the agent fills in during a session. Not a permanent record — it captures what happened this session so updates to the canonical files can be offered at the end. Overwritten each session.*

---

## Session Info

| Field | Value |
|---|---|
| **Session date** | *(set at session start)* |
| **Session number** | *(increment from last known value)* |
| **Persona active** | Barkeeper Bjorn (Professional Mixologist) |

---

## Ingredients Used This Session

| Ingredient | Approx. Amount | Cocktail |
|---|---|---|
| *(none yet)* | | |

> *Track any notable amounts (e.g., "used most of the Campari bottle") so the agent can flag restocking needs at session end.*

---

## Cocktails Built This Session

| Cocktail | Type | Result |
|---|---|---|
| *(none yet)* | Original / Classic / Riff | — |

---

## Feedback Signals

> *Positive/negative reactions captured in conversation. Used to update flavor profile.*

| Cocktail | Signal | Axis implications |
|---|---|---|
| *(none yet)* | | |

---

## Profile Update Candidates

> *Changes warranted based on this session — not yet written back to `bar-owner-profile.md`. Reviewed at session end.*

- *(none yet)*

---

## Inventory Changes to Apply

> *Bottles opened, emptied, or added this session. Reviewed at session end.*

- *(none yet)*

---

## Open Questions / Unfinished Onboarding

> *Any onboarding questions skipped due to impatience or branching. Circle back to these next session.*

- *(none)*

---

## Session End Checklist

When the conversation winds down (user signs off, or long pause), offer:

> *"Before you go — want me to produce updated files for anything we covered tonight? I can update:*
> - *`bar-owner-profile.md` — [list any profile changes]*
> - *`inventory.md` — [list any inventory changes]*
> - *`recipes.md` — [list any new originals or favorites confirmed]*"*

Only offer updates that are actually needed. Don't produce file output unless the user accepts.

---

## Versioning

| Version | Date | Notes |
|---|---|---|
| 1.0 | 2026-05-03 | Initial session-state template. Covers ingredients used, cocktails built, feedback signals, profile update candidates, inventory deltas, and session-end checklist. |
