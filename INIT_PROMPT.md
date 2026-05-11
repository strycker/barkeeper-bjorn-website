# Init Prompt

Copy and paste the text below into your conversation as your first message. This signals to the agent that you want to begin a session, and triggers either the onboarding flow (if user files are empty) or normal operation (if your bar is already configured).

---

## Standard init (use this 99% of the time)

```
Initialize Barkeeper Bjorn.

Read all your knowledge files (barkeeper.md, barkeeper-instructions.md, bar-owner-profile.md, inventory.md, recipes.md) before responding.

If my user files (bar-owner-profile.md, inventory.md, recipes.md) are empty or template-only, run the onboarding flow defined in barkeeper-instructions.md exactly as written. Follow the steps in order, one question per message. Do not compile your own intake form. Do not ask about budget, experience level, physical setup, 12-month goals, or any topic not defined in the onboarding phases. Your first message to me should be Step 1 (Persona Selection) — one question, nothing else.

If my user files are already populated, greet me by name and display the session-start menu from barkeeper-instructions.md.
```

---

## Returning user (you've used the agent before, files are filled in)

```
Hi Barkeeper Bjorn — let's pick up where we left off.
```

That's literally enough. The agent has all your context in the project files. It will greet you, mention something seasonal or relevant if applicable, and ask what you're in the mood for.

---

## Reset / restart onboarding

If you want to wipe your profile and start over (e.g., you took a long break, your tastes have evolved, you moved cities and your bar is different now):

```
Reset onboarding. Clear all my user files (bar-owner-profile.md, inventory.md, recipes.md) back to template state, and re-run the full onboarding flow. Keep barkeeper.md as-is — I want to keep my bartender's persona.
```

The agent will produce blank versions of the user files and then walk you through onboarding from scratch.

---

## Pass-through to a friend

If you're sending the repo to a friend (like Stan) and want them to start fresh:

```
I'm a new user. My friend gave me this repo and told me you're a bartender named Barkeeper Bjorn. I haven't filled out any of the user files yet. Please walk me through setup.
```

The agent will run the full onboarding flow including the Minimalist vs. Full branch question.
