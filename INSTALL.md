# Installation Guide

Barkeeper Bjorn works on any modern LLM platform that supports persistent context (uploaded files, system prompts, or custom instructions). This guide covers the two most common setups in detail, plus brief notes for other platforms.

---

## Platform 1: Claude Projects (Primary Recommended Path)

**Why Claude Projects:** Best long-context handling, native support for project files visible across all conversations in the project, and Claude has a memory tool that persists user preferences between sessions.

### Setup

1. Go to [claude.ai](https://claude.ai) and create a new **Project** (Pro or Team plan required).
2. In the Project, scroll to "Project knowledge" and upload all of these files:
   - `barkeeper.md`
   - `barkeeper-instructions.md`
   - `bar-owner-profile.md`
   - `inventory.md`
   - `recipes.md`
3. (Optional) Set custom instructions for the project: paste a one-line description like *"You are Barkeeper Bjorn. Read all project files before responding. Follow `barkeeper-instructions.md` strictly."*
4. Start a new chat in the project. Paste the contents of `INIT_PROMPT.md` as your first message.

### Updating user files

After onboarding, the agent will produce filled-in versions of `bar-owner-profile.md`, `inventory.md`, and `recipes.md`. **Save these to your local fork of the repo** and re-upload them to replace the empty templates in your Project. Repeat after major inventory changes.

> **Important:** Claude cannot directly write to your Project's knowledge base. It produces updated file contents in the conversation; you copy them into your local files and re-upload.

### Memory behavior

Claude has a memory tool that persists short notes across all conversations in your Project. The agent will use this for high-value reminders ("user prefers Cocchi over Carpano in citrus drinks") that complement the file-based long-term memory.

---

## Platform 2: ChatGPT Custom GPT (Secondary Recommended)

**Why ChatGPT:** Custom GPTs give you a persistent, shareable agent that anyone can use without setup.

### Setup

1. Go to [chatgpt.com](https://chatgpt.com), click "Explore GPTs" → "Create."
2. In the **Configure** tab:
   - **Name:** `Barkeeper Bjorn` (or your custom name)
   - **Description:** `Configurable AI bartender, mixologist, and cocktail librarian.`
   - **Instructions:** Paste the entire contents of `barkeeper-instructions.md` here. Then append:
     ```
     Always read the contents of barkeeper.md, bar-owner-profile.md, inventory.md, and recipes.md from your knowledge files before responding to any cocktail-related question.
     ```
3. Under **Knowledge**, upload:
   - `barkeeper.md`
   - `bar-owner-profile.md`
   - `inventory.md`
   - `recipes.md`
4. Under **Capabilities**, enable: Web Browsing, Code Interpreter (for math on recipe scaling).
5. Under **Conversation starters**, paste the contents of `INIT_PROMPT.md` as the first starter (or the short one-liner: *"Initialize Barkeeper Bjorn."*). This makes the init prompt fire automatically when a user opens the GPT for the first time, without them having to paste it manually.

   **Paste this into the Conversation starters field:**

   ```
   Initialize Barkeeper Bjorn.

   Read all your knowledge files (barkeeper.md, barkeeper-instructions.md, bar-owner-profile.md, inventory.md, recipes.md) before responding.

   If my user files (bar-owner-profile.md, inventory.md, recipes.md) are empty or template-only, run the onboarding flow described in barkeeper-instructions.md. Start by asking whether I'm building a serious home bar or just looking to make a few favorite cocktails well (Minimalist track vs. Full track).

   If my user files are already populated, greet me by name and ask what I'd like to do tonight: build a drink, design an original, get a gap analysis on my bar, or something else.
   ```
6. Save and start a conversation. The init prompt should run automatically.

### Updating user files

ChatGPT cannot directly modify Custom GPT knowledge files either. After onboarding or major changes:
1. Have the agent output the updated file content in chat.
2. Copy it into your local repo file.
3. Edit the Custom GPT and re-upload the updated file under Knowledge.

### Caveats

- Custom GPTs have a smaller knowledge file size limit than Claude Projects. If your `inventory.md` and `recipes.md` get very large, you may need to consolidate.
- ChatGPT does not have a persistent memory tool inside Custom GPTs. All long-term state must live in the uploaded files.

---

## Platform 3: Gemini Gems (Beta)

Gemini supports Gems with custom instructions and uploaded files, similar to Custom GPTs.

1. In Gemini, create a new Gem.
2. Paste `barkeeper-instructions.md` into the instructions field.
3. Upload the four user files (`barkeeper.md`, `bar-owner-profile.md`, `inventory.md`, `recipes.md`).
4. In the Gem's **opening message** field (if available), paste: *"Initialize Barkeeper Bjorn."* This triggers the onboarding flow automatically on first open.

   **Paste this into the opening message field:**

   ```
   Initialize Barkeeper Bjorn.

   Read all your knowledge files (barkeeper.md, barkeeper-instructions.md, bar-owner-profile.md, inventory.md, recipes.md) before responding.

   If my user files (bar-owner-profile.md, inventory.md, recipes.md) are empty or template-only, run the onboarding flow described in barkeeper-instructions.md. Start by asking whether I'm building a serious home bar or just looking to make a few favorite cocktails well (Minimalist track vs. Full track).

   If my user files are already populated, greet me by name and ask what I'd like to do tonight: build a drink, design an original, get a gap analysis on my bar, or something else.
   ```
5. If no opening message field exists, start the first conversation by pasting the contents of `INIT_PROMPT.md`.

Gemini's context limits and file handling differ from Claude/ChatGPT. The agent files should still work, but expect occasional "I don't see that file" issues — re-uploading or re-pasting may be needed.

---

## Platform 4: Grok and other LLMs

If your platform supports a single long system prompt and no file uploads:

1. Concatenate all files in this order:
   ```
   barkeeper-instructions.md
   barkeeper.md
   bar-owner-profile.md
   inventory.md
   recipes.md
   ```
2. Paste the concatenated text as the system prompt.
3. Set the first user message (or "conversation starter" if the platform supports it) to: *"Initialize Barkeeper Bjorn."* This triggers the onboarding or session-start menu automatically.

   **Paste this into the system prompt field:**

   ```
   Initialize Barkeeper Bjorn.

   Read all your knowledge files (barkeeper.md, barkeeper-instructions.md, bar-owner-profile.md, inventory.md, recipes.md) before responding.

   If my user files (bar-owner-profile.md, inventory.md, recipes.md) are empty or template-only, run the onboarding flow described in barkeeper-instructions.md. Start by asking whether I'm building a serious home bar or just looking to make a few favorite cocktails well (Minimalist track vs. Full track).

   If my user files are already populated, greet me by name and ask what I'd like to do tonight: build a drink, design an original, get a gap analysis on my bar, or something else.
   ```
4. If there is no opening-message field, paste `INIT_PROMPT.md` manually as your first message.

This works but is less elegant — updating files means rebuilding the entire system prompt.

---

## Platform 5: Local LLMs (Ollama, LM Studio, etc.)

For local Llama / Mistral / Qwen models with sufficient context:

1. Use the concatenation approach above.
2. Be aware: smaller open models may struggle with the structured onboarding flow and the attribution / formatting rules. Models below ~13B parameters tend to drift from the persona quickly.
3. The cocktail attribution string in `barkeeper.md` should reflect the actual model: e.g., *"Created by Barkeeper Bjorn (Bartender AI Agent using Llama 3.3 70B)"*.

---

## Updating Barkeeper Bjorn from Upstream

Barkeeper Bjorn is versioned. When the upstream repo updates (new behavioral rules, refined onboarding, additional features), you'll typically want to:

1. **Pull** the new versions of `barkeeper-instructions.md`, `INIT_PROMPT.md`, and the templates in `README.md`.
2. **Keep your own** `bar-owner-profile.md`, `inventory.md`, and `recipes.md` — these are personal.
3. **Diff** your `barkeeper.md` against the new template — if the upstream added new persona fields (e.g., a new specialty bias option), merge those in manually.

This is why `barkeeper-instructions.md` (mostly static, upgrades-from-upstream) is intentionally separated from `barkeeper.md` (your personal persona configuration).

---

## Troubleshooting

**"The agent doesn't seem to remember my inventory between conversations."**
On Claude: confirm all files are uploaded to **Project knowledge** (not just attached to a single conversation). On ChatGPT: confirm files are in the Custom GPT's **Knowledge** section, not just an attachment.

**"The agent is suggesting Chartreuse / egg / [vetoed ingredient]."**
Open `inventory.md` and confirm the **Disliked Ingredients** list is populated correctly. The agent reads this before making any suggestion. If it's still happening, paste the relevant veto into the conversation and ask the agent to update the file.

**"The agent forgot it's named Barkeeper Bjorn (or my custom name)."**
This is a persona-drift issue common in long conversations. Open `barkeeper.md` and remind it: *"Refer back to barkeeper.md and resume your assigned persona."*

**"I'm getting impatient with onboarding questions."**
Just say *"skip ahead"* or *"just give me a drink."* The agent is instructed to honor impatience signals and circle back to questions later.

---

## Privacy Note

All four user files (`barkeeper.md`, `bar-owner-profile.md`, `inventory.md`, `recipes.md`) live on your platform of choice. The maintainers of this repo do not receive any user data. If you fork the repo on GitHub and commit your personalized files, those files become public — keep your fork private if you'd rather not share your bar inventory and drinking preferences with the world.
