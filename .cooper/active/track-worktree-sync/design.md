# Technical Design: Implement Troop worktree switching, runtime context sync, and trust registry

- **Track ID**: `track-worktree-sync`

## 1. Architecture & Module Structure
```
src/
├── utils/
│   ├── worktree.ts       # Worktree path resolution, process.chdir, trust registry sync
│   ├── worktree.test.ts  # Colocated worktree & trust unit tests
│   ├── cooper-fs.ts
│   ├── format.ts
├── commands/
│   ├── switch.ts         # Enhanced /cooper:switch with runtime switching & trust sync
│   ├── switch.test.ts
│   └── ...
├── index.ts
└── ...
```

## 2. Component Design

### 2.1 Workspace Switching (`switchWorkspace`)
- Validates the target worktree path.
- Invokes `process.chdir(targetPath)` to change the Node.js process working directory in-place.
- Updates the Pi `ExtensionContext.workspacePath` property if mutable.
- Resolves subshell traps for subsequent tool executions.

### 2.2 Trust Registry Synchronization (`syncTrustRegistry`)
- Resolves the trust configuration path (defaults to `~/.pi/agent/trust.json` and fallback `~/.pi/trust.json`).
- Safely reads existing JSON or initializes `{ "trustedPaths": [] }`.
- Appends `targetPath` if not already present (idempotent).
- Performs an atomic write to prevent corruption.

## 3. Performance & Quality Standards
- Sub-5ms execution time for workspace switches.
- Strict error handling with non-destructive fallback if trust path is read-only.
- Strict TypeScript typing with >80% test coverage threshold.
