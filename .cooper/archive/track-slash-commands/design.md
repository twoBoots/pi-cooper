# Technical Design: Implement zero-cost in-process human slash commands

- **Track ID**: `track-slash-commands`

## 1. Architecture & Module Structure
The command handlers and filesystem inspection utilities are organized modularly under `src/`:

```
src/
├── commands/
│   ├── status.ts         # /cooper:status handler
│   ├── status.test.ts
│   ├── tracks.ts         # /cooper:tracks handler
│   ├── tracks.test.ts
│   ├── switch.ts         # /cooper:switch handler
│   ├── switch.test.ts
│   ├── validate.ts       # /cooper:validate handler
│   ├── validate.test.ts
│   ├── checkpoint.ts     # /cooper:checkpoint handler
│   └── checkpoint.test.ts
├── utils/
│   ├── cooper-fs.ts      # Fast .cooper filesystem inspection utilities
│   ├── cooper-fs.test.ts
│   ├── format.ts         # Terminal ANSI formatters and progress bars
│   └── format.test.ts
├── constants.ts
├── types.ts
├── types.test.ts
├── index.ts              # Command dispatcher & lifecycle registry
└── index.test.ts
```

## 2. Command Handlers Specification
1. **`/cooper:status`**:
   - Inspects active worktree or workspace root.
   - Extracts active track metadata, phase counts, and completed/total tasks from `plan.md`.
   - Returns ANSI-formatted progress summary.
2. **`/cooper:tracks`**:
   - Parses `.cooper/tracks.md` and active/archive directories.
   - Formats a clean list of all registered tracks, statuses, and worktree locations.
3. **`/cooper:switch <track_id>`**:
   - Validates existence of `.worktrees/<track_id>`.
   - Returns switch instruction and status summary.
4. **`/cooper:validate`**:
   - Fast in-process parser for `.cooper/specs/**/*.spec.md` and `.cooper/active/**/*.spec.md`.
   - Validates GIVEN/WHEN/THEN keywords and relative links.
5. **`/cooper:checkpoint`**:
   - Inspects current phase status in active track `plan.md`.
   - Outputs checkpoint instructions and status.

## 3. Performance & Quality Standards
- Sub-5ms execution for all read commands.
- Zero external network dependencies.
- Strict TypeScript typing with >80% test coverage threshold.
