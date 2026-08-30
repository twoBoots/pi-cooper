# Track Proposal: Scaffold TypeScript extension package, build pipeline, and test harness

- **Track ID**: `track-scaffold-extension`
- **Type**: chore
- **Status**: Planning

## 1. Summary & Motivation
Currently, the repository contains the Cooper SDD specification and workflow structure, but no TypeScript package setup, build pipeline, or testing harness. This track establishes the foundational Node/TypeScript workspace for `pi-cooper`, enabling strict TDD development, type checking against `@earendil-works/pi-agent-core`, and automated testing with Vitest.

## 2. Scope & Boundaries
- **In Scope**:
  - `package.json` with scripts, metadata, dependencies, and devDependencies.
  - `tsconfig.json` configured for Node 20+, ESM, and strict type checking.
  - Build pipeline (`tsup.config.ts`) configured to emit ESM distribution files in `dist/`.
  - Vitest test runner setup (`vitest.config.ts`) enforcing >80% coverage threshold.
  - Extension entrypoint skeleton (`src/index.ts`), core typings (`src/types.ts`), and constants (`src/constants.ts`).
  - Unit test suite verifying extension export and mock lifecycle registration.
- **Out of Scope**:
  - Full slash command implementations (handled in `track-slash-commands`).
  - Full Troop worktree process management and TUI widget (handled in subsequent tracks).

## 3. Success Criteria
- `npm run build` compiles clean ESM bundle with `.d.ts` types to `dist/`.
- `npm test` runs with Vitest and passes.
- `npm run test:coverage` reports >80% code coverage across all created modules.
- `cooper validate` confirms clean SDD project health.
