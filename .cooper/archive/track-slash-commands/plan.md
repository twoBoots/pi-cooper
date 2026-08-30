# Implementation Plan: Implement zero-cost in-process human slash commands

- **Track ID**: `track-slash-commands`

## Phase 1: Cooper Filesystem & Terminal Formatting Utilities (TDD)

- [x] Task: Cooper Filesystem Utilities (6acebef)
  - [x] Sub-task: Write unit tests for discovering `.cooper/` workspace, reading `tracks.md`, `metadata.json`, and `plan.md` task counts (Red)
  - [x] Sub-task: Implement `src/utils/cooper-fs.ts` (Green)
  - [x] Sub-task: Refactor & maintain >80% coverage (Refactor)
- [x] Task: Terminal Formatting Utilities (3c12752)
  - [x] Sub-task: Write unit tests for progress bars, status badges, and formatting (Red)
  - [x] Sub-task: Implement `src/utils/format.ts` (Green)
  - [x] Sub-task: Refactor & maintain >80% coverage (Refactor)
- [x] Task: Phase 1 Verification & Checkpoint (f67ceb5)

## Phase 2: Slash Command Handlers & Extension Integration (TDD)

- [x] Task: Command Handlers: Status & Tracks (fcab4b1)
  - [x] Sub-task: Write unit tests for `/cooper:status` and `/cooper:tracks` (Red)
  - [x] Sub-task: Implement `src/commands/status.ts` and `src/commands/tracks.ts` (Green)
  - [x] Sub-task: Refactor & maintain >80% coverage (Refactor)
- [x] Task: Command Handlers: Switch, Validate & Checkpoint (7fabe34)
  - [x] Sub-task: Write unit tests for `/cooper:switch`, `/cooper:validate`, `/cooper:checkpoint` (Red)
  - [x] Sub-task: Implement `src/commands/switch.ts`, `src/commands/validate.ts`, `src/commands/checkpoint.ts` (Green)
  - [x] Sub-task: Wire all handlers into `src/index.ts` CooperExtension registration (Refactor)
- [x] Task: Phase 2 Verification & Checkpoint (a8af9e4)
