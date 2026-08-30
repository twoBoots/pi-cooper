# Implementation Plan: Implement zero-cost in-process human slash commands

- **Track ID**: `track-slash-commands`

## Phase 1: Cooper Filesystem & Terminal Formatting Utilities (TDD)

- [~] Task: Cooper Filesystem Utilities
  - [ ] Sub-task: Write unit tests for discovering `.cooper/` workspace, reading `tracks.md`, `metadata.json`, and `plan.md` task counts (Red)
  - [ ] Sub-task: Implement `src/utils/cooper-fs.ts` (Green)
  - [ ] Sub-task: Refactor & maintain >80% coverage (Refactor)
- [ ] Task: Terminal Formatting Utilities
  - [ ] Sub-task: Write unit tests for progress bars, status badges, and formatting (Red)
  - [ ] Sub-task: Implement `src/utils/format.ts` (Green)
  - [ ] Sub-task: Refactor & maintain >80% coverage (Refactor)
- [ ] Task: Phase 1 Verification & Checkpoint

## Phase 2: Slash Command Handlers & Extension Integration (TDD)

- [ ] Task: Command Handlers: Status & Tracks
  - [ ] Sub-task: Write unit tests for `/cooper:status` and `/cooper:tracks` (Red)
  - [ ] Sub-task: Implement `src/commands/status.ts` and `src/commands/tracks.ts` (Green)
  - [ ] Sub-task: Refactor & maintain >80% coverage (Refactor)
- [ ] Task: Command Handlers: Switch, Validate & Checkpoint
  - [ ] Sub-task: Write unit tests for `/cooper:switch`, `/cooper:validate`, `/cooper:checkpoint` (Red)
  - [ ] Sub-task: Implement `src/commands/switch.ts`, `src/commands/validate.ts`, `src/commands/checkpoint.ts` (Green)
  - [ ] Sub-task: Wire all handlers into `src/index.ts` CooperExtension registration (Refactor)
- [ ] Task: Phase 2 Verification & Checkpoint
