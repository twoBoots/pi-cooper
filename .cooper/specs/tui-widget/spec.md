# Capability Spec: tui-widget

## Overview
Defines the persistent terminal user interface (TUI) status bar component rendered in the Pi Coding Agent session.

---

## Requirements

### Requirement: Persistent SDD Status Bar Rendering
The extension MUST render a dynamic, non-intrusive status widget in Pi's terminal interface reflecting current SDD state.

#### Scenario: Status bar display during active track
- GIVEN an active track with tasks and validated spec deltas
- WHEN the terminal renders or updates the status bar
- THEN it displays: `[Cooper: <track_id>] [Phase: <X>/<Y>] [Tasks: <N>/<M>] [Specs: Valid]`.

#### Scenario: Status bar display in idle state
- GIVEN no active track selected in the current repository
- WHEN the terminal renders
- THEN it displays: `[Cooper: Idle (N tracks available)]`.

---

### Requirement: Reactive Status Updates
The widget MUST reactively update when track state, task completion, or spec delta validity changes.

#### Scenario: Task completed in plan.md
- GIVEN an agent marks a task complete in `plan.md`
- WHEN file watcher or lifecycle event triggers
- THEN the task progress counter increment is immediately reflected in the TUI status bar.

#### Scenario: Spec delta becomes invalid
- GIVEN a malformed edit is made to a living spec delta
- WHEN spec validation runs
- THEN the status bar indicator transitions from `[Specs: Valid]` to `[Specs: ⚠️ Invalid]`.

---

### Requirement: TTY and Minimalist Fallback
The widget MUST adapt gracefully to minimal, non-TTY, or piped terminal output environments.

#### Scenario: Session running in non-interactive or CI mode
- GIVEN `process.stdout.isTTY` is false or CI environment is detected
- WHEN status widget initializes
- THEN interactive rendering is suppressed while remaining accessible to programmatic queries.
