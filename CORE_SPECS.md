# TokenWallet Core Specs

An ultra-minimalist developer tool account quota and recovery countdown wallet dashboard for AI tools (GitHub Copilot/Codex, Claude Code, Google DeepMind/AntiGravity).

---

## 1. Core Ideas & Design Philosophy

- **Extreme Simplification**: Remove redundant labels, sub-labels, separate countdown timers, and confirmation buttons.
- **Vibrant Branded Aesthetics**: Use exact, high-fidelity official brand vector SVG icons and gradients (Copilot violet gradient, Claude terracotta peach, Gemini rainbow-blue gradient) on a sleek, premium dark-mode theme.
- **Automatic Rollover Recovery**: Accounts automatically recover and cycle their countdowns in the background, keeping track of exact absolute reset clocks at all times.

---

## 2. Core Rules & Logic

### Rule 1: Reset Time Independence
- An account's `resetTime` is a persistent timestamp that does not depend on the account's active/exhausted status. Every account has an active countdown running.

### Rule 2: Expiration & Rollover Cycle
- When the countdown reaches `0` (`resetTime <= now`):
  1. If the account status is **run out** (exhausted), it transitions to **remain** (active). If it is already **remain** (active), it stays active.
  2. The `resetTime` is rolled over by adding `5 hours` (`+5h`) recursively until the target time is in the future (this safely handles cases where the app was closed for a long time).

### Rule 3: Modal Pre-fill & Confirmations
- When opening the manage-account modal:
  - If the account has a future `resetTime` in state, the **Time to reset** text box auto-fills with the remaining duration formatted compactly (e.g. `3h 18m` or `25m`).
  - Otherwise, it auto-fills with a default value of `5h`.
- The status buttons (**Remain** and **Run Out**) are styled as fully colored active buttons (green and red-orange) rather than toggle switches. Clicking them confirms the input and updates the status immediately:
  - **Remain**: Makes the account active, saving the entered reset time (or keeping the current one).
  - **Run Out**: Makes the account exhausted, saving the entered reset time.

---

## 3. UI Layout Specs

### Dashboard Grid & Headers
- **Header Plus Buttons**: A small `+` icon is placed directly next to the tool titles (e.g. `ClaudeCode +`) to add accounts. The bottom "+ Add Account" dashed rows are removed.
- **Alphabetical Sorting**: Accounts are automatically sorted alphabetically by name within each tool category list.
- **Inline Resets Time**: For all accounts, the absolute reset time is displayed inline next to the name in small, muted text: `- Resets Today at 3:01 PM` or `Resets Tomorrow at 1:00 AM`.

### Visual Progress Bar (Reset Time Bar)
- Aligned on the absolute right side of each account card is a thin (`4px` height), wide (`270px` width) visual progress bar.
- Both day and hour values use the same scaling unit (1 day = 1 unit, 1 hour = 1 unit). The total bar width is divided into `8 units` (max 3 days + max 5 hours = 8 units total), making each unit exactly `12.5%` of the total bar width.
- The color blocks meet seamlessly at all times, right-aligned to the far right, leaving the empty space on the left:
  - **Hours Segment (Yellow)**: Capped at `5 hours` max, colored **Yellow** (`#facc15`), aligned to the far right (`right: 0`), growing leftwards.
  - **Days Segment (Orange)**: Capped at `3 days` max, colored **Orange** (`#f97316`), positioned immediately to the left of the Hours segment (`right: ${hoursPercent}%`), growing leftwards.

### Global Status Banner
- Replaced header lists with a single sentence:
  - If any account is active: `Currently, you have X of Y accounts ready for work.`
  - If all accounts are exhausted: `ready for work at latest X days Y hours Z minutes (Date Time)` (taking the latest reset timestamp among all accounts).

### Manage Account Modal
- Simplified title (e.g., `AntiGravity` or `Codex`).
- **Time to reset** input box at the absolute top, followed by a dynamically parsed preview (e.g., `✓ Understood: Resets Today at 3:01 PM`). No duplicate countdown block.
- **Remain** (green) and **Run Out** (red-orange) confirmation status buttons below the input.
- **Account Name** update text box and button.
- **Delete Account** button (colored gray) positioned at the absolute bottom.
