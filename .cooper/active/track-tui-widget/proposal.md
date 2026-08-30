# Proposal: Persistent TUI Status Widget & Reactive Indicators

## Motivation & Problem Statement
When running autonomous coding agents or working interactively in the Pi runtime, developers need immediate visual awareness of the current Cooper SDD state—including the active track, current phase, task completion progress, and living spec health—without manually invoking slash commands or cluttering terminal logs.

Currently, `pi-cooper` registers a static status bar placeholder (`"[Cooper: Idle]"`), but does not dynamically reflect active track changes, task increments in `plan.md`, or spec delta validation status in real time.

## Proposed Solution
Introduce a high-performance, non-intrusive TUI status widget component (`TuiWidget` / `StatusWidget`) for `pi-cooper`:
1. **Dynamic SDD Status Rendering**: Displays structured status bar segments in Pi's terminal runtime:
   - Active Track: `[Cooper: <track_id>] [Phase: <X>/<Y>] [Tasks: <N>/<M>] [Specs: Valid]` (or `[Specs: ⚠️ Invalid]`)
   - Idle State: `[Cooper: Idle (N tracks available)]`
2. **Hybrid Dual-Trigger Reactive Engine**: Monitors track state changes through `fs.watch` file triggers on `.cooper/active/` combined with direct Pi runtime command / lifecycle event emissions.
3. **Adaptive ANSI Styling & Fallbacks**: Provides formatted ANSI styling with color-coded health indicators, responsive column truncation (<80 columns), and graceful suppression in non-interactive/CI environments.

## User & Agent Benefits
- **Zero Token Overhead**: Status updates are computed and rendered in-process with 0 LLM token consumption.
- **Continuous SDD Visibility**: Real-time feedback on task completion and spec validity keeps agents and developers aligned with SDD guardrails.
- **Graceful Terminal Degradation**: Operates reliably in standard terminals, narrow splits, headless runners, and CI pipelines.

## Scope & Boundaries
- **In Scope**:
  - TUI Status Widget state engine, parser, and formatter.
  - File watching mechanism for `.cooper/active/<track_id>/plan.md` and spec deltas.
  - Extension registration and lifecycle event hooks in `CooperExtension`.
  - Comprehensive unit test suite with >80% code coverage.
- **Out of Scope**:
  - Multi-panel fullscreen interactive TUIs (handled in future extension tracks).
  - Git pre-commit enforcement hooks (covered in `track-lifecycle-hooks`).
