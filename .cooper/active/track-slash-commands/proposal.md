# Track Proposal: Implement zero-cost in-process human slash commands

- **Track ID**: `track-slash-commands`
- **Type**: feature
- **Status**: Planning

## 1. Summary & Motivation
Pi Coding Agent is designed around high-speed interactive terminal sessions. While MCP servers introduce token latency and JSON-schema overhead, Pi extension slash commands execute in `<5ms` inside the Node.js runtime with 0 LLM token cost. This track implements the five core Cooper slash commands (`/cooper:status`, `/cooper:tracks`, `/cooper:switch`, `/cooper:validate`, `/cooper:checkpoint`) to give developers instant terminal control over the SDD lifecycle.

## 2. Scope & Boundaries
- **In Scope**:
  - `src/utils/cooper-fs.ts`: Fast in-process reading of `.cooper/` metadata, active track status, task counts in `plan.md`, and registered tracks.
  - `src/utils/format.ts`: Clean terminal output formatters (progress bars, status indicators, badges).
  - `src/commands/status.ts`: `/cooper:status` command handler.
  - `src/commands/tracks.ts`: `/cooper:tracks` command handler.
  - `src/commands/switch.ts`: `/cooper:switch <track_id>` command handler with target validation.
  - `src/commands/validate.ts`: `/cooper:validate` fast in-process SDD spec and link linter.
  - `src/commands/checkpoint.ts`: `/cooper:checkpoint` phase checkpoint runner.
  - Integration with `CooperExtension` in `src/index.ts`.
  - Comprehensive unit test coverage (>80%) with colocated tests.
- **Out of Scope**:
  - TUI bottom status bar widget rendering (handled in `track-tui-widget`).
  - Pre-commit/pre-tool interceptor hooks (handled in `track-lifecycle-hooks`).

## 3. Success Criteria
- All 5 slash commands registered and functional in the extension context.
- Unit test suite covers all command handlers and utility modules with >80% coverage.
- `npm run lint`, `npm test`, `npm run build`, and `cooper validate` pass with 0 errors.
