# Implementation Plan: Implement Troop worktree switching, runtime context sync, and trust registry

- **Track ID**: `track-worktree-sync`

## Phase 1: Worktree & Trust Registry Utilities (TDD)

- [x] Task: Worktree & Trust Registry Utilities (f611f14)
  - [x] Sub-task: Write unit tests for worktree path resolution, `process.chdir()` switching, and `trust.json` synchronization (Red)
  - [x] Sub-task: Implement `src/utils/worktree.ts` (Green)
  - [x] Sub-task: Refactor & maintain >80% coverage (Refactor)
- [x] Task: Phase 1 Verification & Checkpoint (64fbbc9)

## Phase 2: Switch Command Enhancement & Extension Integration (TDD)

- [x] Task: Enhanced Switch Command & Context Sync (05a3d4b)
  - [x] Sub-task: Write unit tests for enhanced `/cooper:switch` with live directory changing & trust sync (Red)
  - [x] Sub-task: Implement enhanced `src/commands/switch.ts` and integrate with `CooperExtension` (Green)
  - [x] Sub-task: Refactor & maintain >80% coverage (Refactor)
- [x] Task: Phase 2 Verification & Checkpoint (139a4c9)
