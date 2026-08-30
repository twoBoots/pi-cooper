# Technical Design: Persistent TUI Status Widget & Reactive Indicators

## Architecture Overview
The `tui-widget` subsystem provides real-time terminal UI rendering and reactive state observation for `pi-cooper`.

```
┌─────────────────────────────────────────────────────────────┐
│                       Pi Agent Runtime                      │
└───────────────┬─────────────────────────────▲───────────────┘
                │                             │ Status Updates
                │ ExtensionContext            │ (registerStatusBarItem)
                ▼                             │
┌─────────────────────────────────────────────────────────────┐
│                    CooperExtension Core                     │
└───────────────┬─────────────────────────────▲───────────────┘
                │                             │
                ▼                             │ OnStateChange
┌─────────────────────────────────────────────────────────────┐
│                      TuiWidget Engine                       │
│  ┌────────────────────────┐     ┌────────────────────────┐  │
│  │   TrackStateWatcher    │     │   StatusFormatter      │  │
│  │  (fs.watch + polling)  │     │  (ANSI / Compact / CI) │  │
│  └────────────────────────┘     └────────────────────────┘  │
└───────────────┬─────────────────────────────────────────────┘
                │ Inspects
                ▼
┌─────────────────────────────────────────────────────────────┐
│                     .cooper/ Workspace                      │
│   active/<track_id>/plan.md, spec-deltas/, tracks.md        │
└─────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. `TuiWidget` (`src/widget/tui-widget.ts`)
- Manages the lifecycle of the status bar item.
- Exposes `start()`, `stop()`, `refresh()`, and `getState()`.
- Updates `context.registerStatusBarItem` or emits TUI state updates.
- Guards against multiple watchers and handles resource disposal cleanly.

### 2. `TrackStateWatcher` (`src/widget/watcher.ts`)
- Observes changes to `.cooper/active/`, `.cooper/tracks.md`, and active track `plan.md` / `spec-deltas/`.
- Debounces file change events (e.g. 50ms) to avoid CPU spikes during rapid disk writes.
- Computes `WidgetState`:
  ```typescript
  export interface WidgetState {
    mode: "active" | "idle" | "uninitialized";
    trackId?: string;
    trackTitle?: string;
    currentPhaseIndex?: number;
    totalPhases?: number;
    completedTasks?: number;
    totalTasks?: number;
    specValid?: boolean;
    specIssues?: string[];
    availableTracksCount?: number;
  }
  ```

### 3. `StatusFormatter` (`src/widget/formatter.ts`)
- Formats `WidgetState` into terminal text strings based on terminal capabilities:
  - **Standard ANSI**:
    `[Cooper: track-name] [Phase: 1/3] [Tasks: 4/10] [Specs: \x1b[32mValid\x1b[0m]`
  - **Compact (<80 columns)**:
    `[Cooper: track-name] [4/10] [\x1b[32mValid\x1b[0m]`
  - **Idle**:
    `[Cooper: Idle (3 tracks available)]`
  - **Non-TTY / CI**:
    Suppress interactive ANSI sequences; return plain ASCII.

### 4. Integration with `CooperExtension` (`src/index.ts`)
- In `CooperExtension.initialize()`, instantiate and start `TuiWidget`.
- Commands (`/cooper:switch`, `/cooper:checkpoint`, etc.) trigger immediate `tuiWidget.refresh()`.

## Data Contracts & Type Definitions
```typescript
export interface WidgetRenderOptions {
  isTTY?: boolean;
  columns?: number;
  useColor?: boolean;
}

export interface StatusWidgetController {
  refresh(): Promise<void>;
  getState(): WidgetState;
  dispose(): void;
}
```

## Error Handling & Edge Cases
- **Missing or Corrupted `plan.md`**: Defaults task counters to `0/0` without throwing unhandled exceptions.
- **File System Permission Errors**: Silently logs warning and falls back to polling / manual refreshes.
- **Rapid Track Switching**: Cancels previous file watchers and binds to new track directory deterministically.
