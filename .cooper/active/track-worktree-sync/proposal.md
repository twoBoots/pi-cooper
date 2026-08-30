# Track Proposal: Implement Troop worktree switching, runtime context sync, and trust registry

- **Track ID**: `track-worktree-sync`
- **Type**: feature
- **Status**: Planning

## 1. Summary & Motivation
Pi Coding Agent and tool runners can encounter "subshell traps" when tool executions spawn subprocesses from an out-of-date working directory. Furthermore, spawning isolated worktrees under `.worktrees/<track_id>` can trigger repetitive permission/trust prompts unless the worktree path is registered in Pi's trust store. This track implements runtime in-process worktree switching (`process.chdir()`), workspace synchronization, and automated trust store registration (`~/.pi/agent/trust.json`).

## 2. Scope & Boundaries
- **In Scope**:
  - `src/utils/worktree.ts`: Worktree discovery, path resolution, `process.chdir()` workspace switching, and safe `~/.pi/agent/trust.json` registry updater.
  - Enhanced `src/commands/switch.ts`: Performing actual in-process directory switching and trust registration on `/cooper:switch <track_id>`.
  - Comprehensive unit test coverage (>80%) with colocated tests.
- **Out of Scope**:
  - Direct git worktree branching CLI logic (handled by `cooper track new` / `git agent-start`).
  - Terminal UI widget status display (handled by `track-tui-widget`).

## 3. Success Criteria
- In-process switching changes `process.cwd()` and returns the updated workspace path.
- Automated trust registry synchronization writes valid JSON to `~/.pi/agent/trust.json` with idempotency.
- Unit test suite covers all worktree and trust utilities with >80% coverage.
- `npm run lint`, `npm test`, `npm run build`, and `cooper validate` pass with 0 errors.
