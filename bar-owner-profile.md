# Bar Owner Profile

> *Your drinker profile. The agent reads this on every session and updates it through onboarding and periodic re-evaluation. Edit anything by hand if it doesn't ring true — your bartender will respect your corrections.*

---

## Identity

| Field | Value |
|---|---|
| **Full name** (used for cocktail attribution) | *(fill during onboarding)* |
| **Preferred name** (what the agent calls you) | *(fill during onboarding)* |
| **Location** (for time zone and seasonal references) | *(fill during onboarding)* |
| **Time zone abbreviation** | *(fill during onboarding — e.g., CST/CDT, PST/PDT, ET, GMT)* |

---

## Background and Context

*Free-form notes about who you are. The agent uses this to calibrate vocabulary and conversational depth.*

- **Profession / academic background:** *(fill during onboarding)*
- **Vocabulary preference:** *(domains where technical language is welcome — e.g., physics, finance, medicine, engineering)*
- **Drinking frequency:** *(occasional / weekly / regular / etc.)*
- **Typical drinking context:** *(solo evenings / dinner parties / entertaining / weekend social / etc.)*
- **Household context:** *(partner's background, dietary considerations, kids in the house, anything that affects ingredient access)*
- **Other notes:** *(anything else worth knowing)*

---

## Equipment

*Bar tools on hand. The agent uses this to scope execution complexity — don't suggest techniques that require tools the user doesn't have.*

| Tool | Status | Notes |
|---|---|---|
| **Shaker** | *(unset)* | Boston two-piece / cobbler / none |
| **Mixing glass** | *(unset)* | |
| **Jigger** | *(unset)* | |
| **Bar spoon** | *(unset)* | |
| **Strainer** | *(unset)* | Hawthorne / Julep / fine mesh / none |
| **Citrus press** | *(unset)* | |
| **Ice setup** | *(unset)* | Standard cubes / large format / crushed / combination |
| **Other** | *(unset)* | Muddler, channel knife, smoker, etc. |

**Gaps flagged:** *(any missing tools worth upgrading)*

---

## Constraints

*Practical limits the agent should factor into all recommendations.*

| Field | Value |
|---|---|
| **Bar budget** | *(unset — e.g., "selective, $50–75 per bottle max," "open," "tight right now")* |
| **Space** | *(unset — e.g., "dedicated bar cart," "one cabinet shelf," "full bar setup")* |
| **Cocktail frequency** | *(unset — e.g., "a few times a year," "weekly," "most evenings")* |

---

## Personal Context

*Interests and lifestyle signals that inform drink design and recommendation style. Optional — only populated if the user engages.*

- *(unset — examples: "cooks seriously, ingredient-first thinking"; "well-traveled, interested in Japanese and Mexican traditions"; "data/systems background, responds well to structural explanations"; "cares about presentation and visual design")*

---

## Flavor Profile — The 6 Axes

The agent calibrates suggestions against these six axes. Confidence reflects how well-established each position is — early in the relationship, most will be Tentative. After enough cocktails together, most should be High.

| # | Axis | Position | Confidence | Last Evaluated |
|---|---|---|---|---|
| 1 | Sweetness register (dry ⟷ rounded/dessert) | *(unset)* | — | — |
| 2 | Acid preference (sharp citrus ⟷ soft/barely-there) | *(unset)* | — | — |
| 3 | Strength (spirit-forward ⟷ refreshment-forward) | *(unset)* | — | — |
| 4 | Aromatic complexity (clean and direct ⟷ layered and brooding) | *(unset)* | — | — |
| 5 | Temperature/season preference (year-round bright ⟷ seasonal shifts) | *(unset)* | — | — |
| 6 | Risk tolerance (classics-only ⟷ surprise me) | *(unset)* | — | — |

> **How to read positions:** Use language like "Strong A," "Lean A," "Middle," "Lean B," "Strong B," or describe nuance ("Lean A, but enjoys spirit-forward when the weather turns cold").

### Supplemental Calibration

*Dimensions not covered by the 6 axes. Captured during onboarding and updated as patterns emerge.*

| Dimension | Position | Notes |
|---|---|---|
| **Smoke** (mezcal, peated Scotch) | *(unset — into it / neutral / avoids)* | |
| **Funk** (high-ester rum, overripe/fermented notes) | *(unset — into it / neutral / turnoff)* | |
| **Savory / saline** (olive brine, miso, sea salt in drinks) | *(unset — interesting / neutral / hard no)* | |

---

## Drinker Archetypes

> *The agent assigns 2–4 playful descriptors that capture your drinking style. These are meant in good fun and may include flattering, neutral, and cheeky labels. They evolve over time as the agent learns more. If any feel wrong, tell the agent and it will revise.*

### Current archetypes
*(unset until first onboarding complete)*

### Available archetypes (the agent picks from these and may invent new ones)

**Aspirational / refined**
- Sophisticated — well-developed palate, knows what they want
- Serious — treats cocktails as a craft, not an indulgence
- Well-traveled — knows what a real Negroni in Milan tastes like
- Curious — wants to know *why* a drink works, not just that it does
- Studious — reads cocktail books for fun
- Classicist — pre-Prohibition purist, suspicious of anything invented after 1930
- Modernist — Death & Co. era and forward
- Bartender's bartender — drinks like a fellow professional

**Style-specific**
- Spirit-forward / Old-school — Manhattan, Old Fashioned, Sazerac territory
- Tiki enthusiast / Beachgoer — rum, tropical, the long history of escapism
- Mezcal evangelist / Smoke chaser — agave is religion
- Aperitif aficionado — bittersweet, low-ABV, before-dinner ritual
- Bourbon dad / Whisky librarian — collects bottles, pours small, savors
- Hedonist / Indulgent — go big or go home
- Minimalist / Functional — wants 5 great drinks, not 50 mediocre ones

**Cheeky (in good fun, applied sparingly and only when fitting)**
- Frou-frou / Fancy-pants — every drink needs a garnish flag
- Sweet-tooth — orders piña coladas without irony
- Frat-boy / Beer-and-shot — direct, unsubtle, knows what they like
- Theatrical / Showy — drinks should impress, ideally on fire
- Reserved / Quiet sipper — same drink every time, no fuss
- Beverage tourist — orders whatever the bartender suggests
- Substack mixologist — has Strong Opinions about ice
- Reluctant guest — ordered a vodka soda and would prefer to be elsewhere

> **Guardrail:** Descriptors should fit observable patterns. The agent should never apply a descriptor to insult; if it picks a cheeky one, it should be willing to laugh at itself in the same breath. Push back on any that don't fit — they'll be removed.

---

## Vetoes

These should also appear in `inventory.md` (which is the canonical source for cocktail-suggestion logic). This section is a quick-reference summary.

### Permanently disliked ingredients
*(Never suggest. Examples: Chartreuse, egg, anise, etc.)*

- *(unset)*

### Substitute for now
*(Don't have, will buy eventually. Use a documented sub until purchased.)*

- *(unset)*

---

## Documented Originals

Quick reference. Full recipes live in `recipes.md`.

| ID | Name | Creator | Style |
|---|---|---|---|
| *(unset)* | | | |

---

## Periodic Review Counter

| Field | Value |
|---|---|
| **Cocktails since last profile review** | 0 |
| **Last review date** | — |
| **Next review threshold** | 5 cocktails |

The agent will pause for a check-in after the threshold is hit. To override, just say *"skip the review"* or *"let's do a profile check-in now"* at any time.

---

## Profile Evolution Log

> *Append-only log of meaningful shifts in the user's profile. Helps the agent (and the user) see how preferences evolve.*

| Date | Change | Reason |
|---|---|---|
| *(unset)* | | |

---

## Guests and Frequent Drinking Companions

> *Optional. If you regularly serve cocktails to specific people, the agent can track their preferences too — useful for entertaining and gift-cocktail design.*

### Guest 1
- **Name:** *(unset)*
- **Relationship:** *(spouse / friend / sibling / etc.)*
- **Preferences:** *(brief notes — e.g., "loves habanero in cocktails, hates cilantro in drinks")*
- **Vetoes:** *(unset)*

*(Add additional guests as needed.)*

---

## Versioning

| Version | Date | Notes |
|---|---|---|
| 1.0 | 2026-05-01 | Initial profile template — split out from the legacy "Bar Owner" section in barkeeper.md. Includes 6 flavor axes, drinker archetypes, evolution log, guest tracking. |
| 1.1 | 2026-05-03 | Added Equipment section (tools + ice setup + gaps). Added Constraints section (budget, space, frequency). Added Personal Context section (interests and lifestyle signals). Added Supplemental Calibration table to Flavor Profile (smoke, funk, savory/saline). |
