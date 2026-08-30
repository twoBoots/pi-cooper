# Track Design: SDD Lifecycle Hooks & Governance Architecture

## Architecture Overview

The `lifecycle` subsystem coordinates SDD governance, interceptors, and automated Git metadata inside the Pi runtime.

```
┌────────────────────────────────────────────────────────┐
│                   Pi Agent Runtime                     │
│  (Tool Execution / Commit Hooks / Extension Lifecycle) │
└───────────────────────────┬────────────────────────────┘
                            │ events / triggers
                            ▼
┌────────────────────────────────────────────────────────┐
│                   CooperExtension                      │
│                  (src/index.ts)                        │
└───────────────────────────┬────────────────────────────┘
                            │ dispatches to
                            ▼
┌────────────────────────────────────────────────────────┐
│                 Lifecycle Subsystem                    │
│                  (src/lifecycle/)                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │ SpecDeltaInterceptor                             │  │
│  │ - Validates modified capability spec deltas      │  │
│  │ - Blocks non-compliant commits/tools             │  │
│  │ - Strict mode by default with bypass flag        │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ GitNotesManager                                  │  │
│  │ - Listens for plan.md task completion events     │  │
│  │ - Formats structured task metadata notes         │  │
│  │ - Executes `git notes add` on target commits     │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ PhaseGatekeeper                                  │  │
│  │ - Validates phase task completeness              │  │
│  │ - Verifies test suite execution & coverage       │  │
│  │ - Fetches origin/main & coordinates remote sync  │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

## Component Breakdown

### 1. `SpecDeltaInterceptor` (`src/lifecycle/spec-interceptor.ts`)
- **Responsibility:** Evaluates staged or modified files to determine if associated capabilities have valid living spec deltas in `.cooper/active/<track_id>/spec-deltas/<capability>/spec.md`.
- **Validation Rules:**
  - Ensures spec deltas follow GIVEN/WHEN/THEN syntax.
  - Ensures modified source files map to declared spec deltas.
  - Returns `ValidationResult { allowed: boolean; issues: ValidationIssue[]; bypassUsed?: boolean }`.

### 2. `GitNotesManager` (`src/lifecycle/git-notes.ts`)
- **Responsibility:** Manages Git Notes attachment for task completions and phase checkpoints.
- **Data Model:**
  ```typescript
  export interface TaskNotePayload {
    trackId: string;
    phaseIndex: number;
    taskId: string;
    taskTitle: string;
    changedFiles?: string[];
    testStatus?: "passed" | "failed" | "skipped";
    timestamp: string;
  }
  ```
- **Execution:** Invokes `git notes add -f -m "<structured_summary>" <commit_hash>` safely using Node's child process utilities.

### 3. `PhaseGatekeeper` (`src/lifecycle/phase-gatekeeper.ts`)
- **Responsibility:** Gates phase transitions by:
  - Checking that all tasks in current phase in `plan.md` are checked `[x]`.
  - Executing automated test suite check.
  - Running `git fetch origin main` to synchronize upstream specs.
  - Creating checkpoint metadata and pushing branch to remote.

### 4. Extension Integration (`src/index.ts`)
- Initializes lifecycle subsystem on extension activate.
- Connects file watcher / event listeners to `GitNotesManager` and `PhaseGatekeeper`.
