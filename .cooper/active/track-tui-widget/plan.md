# Implementation Plan: Persistent TUI Status Widget & Reactive Indicators

## Phase 1: Status Formatter & State Parser (Domain Logic)
- [x] Task: TUI Status Widget State Types & Formatter (bacdd76)
  - [x] Sub-task: Write unit tests for `StatusFormatter` (ANSI, Compact, Idle, Uninitialized, Non-TTY) (Red)
  - [x] Sub-task: Implement `StatusFormatter` and format helpers in `src/widget/formatter.ts` (Green)
  - [x] Sub-task: Refactor formatter logic and verify test coverage >80% (Refactor)
- [x] Task: Plan and Spec State Inspector (e613b2a)
  - [x] Sub-task: Write unit tests for reading active track plan progress and spec validity (Red)
  - [x] Sub-task: Implement state extraction functions in `src/widget/state.ts` (Green)
  - [x] Sub-task: Refactor state extraction and verify coverage >80% (Refactor)
- [x] Task: Phase 1 Verification & Checkpoint (d9ab4bf)

## Phase 2: Reactive Watcher & Widget Controller (Integration)
- [x] Task: Reactive Track State Watcher (e17cd0a)
  - [x] Sub-task: Write unit tests for `TrackStateWatcher` debouncing and change detection (Red)
  - [x] Sub-task: Implement `TrackStateWatcher` using fs watching & event emitters in `src/widget/watcher.ts` (Green)
  - [x] Sub-task: Refactor watcher cleanup / resource disposal and verify coverage >80% (Refactor)
- [ ] Task: TuiWidget Component Controller
  - [ ] Sub-task: Write unit tests for `TuiWidget` lifecycle (start, stop, refresh, status bar registration) (Red)
  - [ ] Sub-task: Implement `TuiWidget` in `src/widget/tui-widget.ts` (Green)
  - [ ] Sub-task: Refactor widget controller and verify coverage >80% (Refactor)
- [ ] Task: Phase 2 Verification & Checkpoint (Tests, sync, checkpoint commit)

## Phase 3: Extension Integration & End-to-End Verification
- [ ] Task: CooperExtension Runtime Integration
  - [ ] Sub-task: Update `CooperExtension` unit tests in `src/index.test.ts` for dynamic status bar updates (Red)
  - [ ] Sub-task: Integrate `TuiWidget` into `CooperExtension` and hook slash commands to trigger refresh (Green)
  - [ ] Sub-task: Refactor extension exports and ensure seamless Pi Agent Core compatibility (Refactor)
- [ ] Task: End-to-End Build & Validation
  - [ ] Sub-task: Run full test suite with coverage (`npm run test:coverage`)
  - [ ] Sub-task: Run typecheck and linter (`npm run lint && npm run typecheck`)
  - [ ] Sub-task: Build production bundle (`npm run build`)
- [ ] Task: Phase 3 Verification & Checkpoint (Final manual verification, sync, PR readiness)
