# Product Definition

## Vision
**pi-cooper** is the official, native [Pi Coding Agent](https://pi.dev) extension for the [Cooper](https://github.com/twoBoots/cooper) Spec-Driven Development (SDD) framework and [Troop](https://github.com/twoBoots/troop) worktree isolation. It bridges Cooper's SDD lifecycle directly into the Pi runtime to deliver zero-token slash commands, real-time TUI status indicators, workspace-level worktree switching, and event-driven SDD governance.

## Target Audience
- **Developers & Engineers**: Building software using the Pi Coding Agent and seeking structured, spec-driven quality workflows with isolated git worktrees.
- **Autonomous Coding Agents**: Operating in Pi environments that need seamless worktree context switching, SDD lifecycle guardrails, and automated git notes.

## Core Capabilities & Scope
- **`extension-core`**: Core extension entrypoint, lifecycle initialization, configuration loading, and Pi Agent Core runtime bindings.
- **`slash-commands`**: Zero-cost, in-process human slash commands (`/cooper:status`, `/cooper:tracks`, `/cooper:switch`, `/cooper:validate`, `/cooper:checkpoint`) executing in `<5ms` with zero token consumption.
- **`worktree-sync`**: Troop worktree and workspace synchronization utilizing Pi internal runtime context and `process.chdir()` to avoid subshell traps, along with automated project trust registry management.
- **`tui-widget`**: Persistent terminal UI status bar displaying active track, phase, task progress, and living spec health.
- **`lifecycle-hooks`**: Event-driven SDD governance, pre-tool/pre-commit spec delta validation, automated Git Notes task summaries, and phase gatekeeping.
- **`cicd-release`**: Continuous integration quality gatekeeping and automated GitHub release packaging.

## Quality & Non-Functional Goals
- **Instant Slash Commands**: Sub-5ms execution time for in-process commands with 0 LLM token overhead.
- **Robust Isolation**: Deterministic worktree switching preventing subshell isolation issues in Pi.
- **Code Coverage**: Strict TDD methodology maintaining >80% test coverage.
- **Type Safety**: Strictly typed TypeScript codebase adhering to `@earendil-works/pi-agent-core` extension standards.
