# pi-cooper 🛢️🥧

> **Native [Pi Coding Agent](https://pi.dev) extension for the [Cooper](https://github.com/twoBoots/cooper) Spec-Driven Development (SDD) framework and [Troop](https://github.com/twoBoots/troop) worktree isolation.**

---

## 🎯 Intent & Overview

**Cooper** is an agent-agnostic Spec-Driven Development (SDD) framework combining **OpenSpec's Living Spec Deltas**, **Conductor's quality governance**, and **[Troop's](https://github.com/twoBoots/troop)** worktree isolation under `.cooper/`.

While Cooper provides a compiled Go CLI (`cooper`) and embedded MCP server (`cooper mcp`), the **[Pi Coding Agent](https://pi.dev)** has a unique minimalist architecture:
1. **4-Tool Minimal Core**: Ships intentionally with only `read`, `write`, `edit`, and `bash`.
2. **No Built-In MCP in Core**: Avoids heavy upfront JSON-schema prompt bloat by prioritizing TypeScript extensions over rigid protocol servers.
3. **Subshell Isolation**: Running `cd .worktrees/<track_id>` in Pi's `bash` tool changes directory in a subshell, leaving the parent Pi process stranded at the repo root.
4. **Terminal-First TUI**: Supports rich interactive terminal UI widgets, instant (0-token) slash commands, and lifecycle event hooks.

**`pi-cooper`** is the official Pi extension that bridges Cooper's SDD lifecycle directly into the Pi runtime, providing instant slash commands, real-time TUI status indicators, workspace-level worktree switching, and event-driven SDD governance.

---

## 🏗️ Core Architecture & Design

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Pi Terminal Session                           │
│                                                                        │
│  [Track: auth-jwt]  [Phase: 2/3 (TDD Red)]  [Tasks: 4/7]  [Specs: ✓]   │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  > /cooper:status                                                      │
│    🛢️ Active Track: auth-jwt (.worktrees/auth-jwt)                     │
│    • Progress: [=====>     ] 4/7 tasks completed                       │
│    • Living Spec Delta: +2 / -1 requirements                           │
│                                                                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                     ┌──────────────▼──────────────┐
                     │         pi-cooper           │
                     │   (Native Pi Extension)     │
                     └──────┬───────┬───────┬──────┘
                            │       │       │
       ┌────────────────────┘       │       └────────────────────┐
       ▼                            ▼                            ▼
┌──────────────┐             ┌──────────────┐             ┌──────────────┐
│  Workspace   │             │  Lifecycle   │             │ In-Process   │
│ & Worktrees  │             │ Event Hooks  │             │ Tool Registry│
│              │             │              │             │              │
│• process.chdir             │• Auto-Notes  │             │• Track ops   │
│• Auto-Trust  │             │• Gatekeeping │             │• Spec audit  │
│• Troop sync  │             │• Spec Linter │             │• JSON models │
└──────┬───────┘             └──────┬───────┘             └──────┬───────┘
       │                            │                            │
       └────────────────────┬───────┴────────────────────────────┘
                            ▼
     ┌─────────────────────────────────────────────┐
     │           Cooper SDD Engine / CLI           │
     │      (.cooper/ | .worktrees/ | AGENTS.md)   │
     └─────────────────────────────────────────────┘
```

---

## ⚡ Key Feature Scope

### 1. Zero-Cost Human Slash Commands (Instant In-Process Execution)
Slash commands execute in `<5ms` inside the Pi process with **0 LLM token consumption** and **0 API cost**:
* `/cooper:status` — Displays active tracks, task progress, and living spec health.
* `/cooper:tracks` — Interactive picker to view active, archived, or proposed tracks.
* `/cooper:switch <track_id>` — Switches the active Pi session directly into `.worktrees/<track_id>`.
* `/cooper:validate` — Runs fast SDD specification and link audits.
* `/cooper:checkpoint` — Triggers phase gatekeeping checks and remote synchronization.

### 2. Troop Worktree & Workspace Synchronization
* **Resolves Subshell Traps**: Uses Pi's internal runtime context and `process.chdir()` so that switching tracks updates Pi's actual root directory, ensuring `read`, `write`, and `edit` target the correct worktree.
* **Automated Project Trust**: Automatically registers new worktree paths (`.worktrees/*`) in Pi's trust registry (`~/.pi/agent/trust.json`).

### 3. Persistent Terminal UI (TUI Status Bar)
* Injects a real-time status component in Pi's terminal interface:
  ```text
  [Cooper: auth-flow] [Phase: 1/3] [Tasks: 3/5] [Spec Delta: Valid]
  ```
* Provides immediate visual feedback during long TDD coding sessions.

### 4. Lifecycle Event Hooks & SDD Governance (Guardrails)
* **Pre-Commit / Pre-Tool Interceptor**: Automatically validates living spec deltas (`.cooper/active/<track_id>/spec-deltas/`) before files are staged or committed.
* **Automated Git Notes**: Listens to completed task events and attaches structured task summaries directly to `git notes` without requiring the LLM to remember bash commands.
* **Phase Gatekeeper**: Enforces phase verification rules (fetch `origin/main`, automated test suites, manual verification approval) before allowing the agent to proceed to the next phase.

### 5. Pi Prompts & Skills Bridging
* Bundles standard Cooper prompt templates into `.pi/prompts/` (`/cooper-rfc`, `/cooper-new`, `/cooper-task`, `/cooper-review`).
* Symlinks/exposes project-local `.agents/skills/cooper-*` to `.pi/skills/` for seamless on-demand loading.

---

## 📦 Technical Stack & Distribution

* **Language**: TypeScript / Node.js
* **Target Runtime**: Pi Coding Agent extension ecosystem (`@earendil-works/pi-agent-core`)
* **Underlying Engine**: Cooper Go CLI (`cooper`) binary + `.cooper/` directory structure
* **Distribution Channels**:
  * Git: `pi install github:twoBoots/pi-cooper`
  * Project-Local: Scaffolded into `.pi/extensions/cooper.ts` by `cooper init`

## 🛠️ Development & Contributing

This project follows the **Cooper Spec-Driven Development (SDD)** lifecycle and **[Troop](https://github.com/twoBoots/troop)** worktree isolation:

- **Operational Rules & Skills**: See [`AGENTS.md`](./AGENTS.md) and [`.cooper/definition/workflow.md`](./.cooper/definition/workflow.md).
- **Living Capability Specs**: Baseline specifications are maintained under [`.cooper/specs/`](./.cooper/specs/).
- **Tracks & Worktrees**: Features, bug fixes, and chores are developed in isolated worktrees using Cooper tracks (`cooper track create <track_id>`).

