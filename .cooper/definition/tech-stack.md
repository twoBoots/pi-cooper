# Technology Stack Definition

## Primary Languages & Runtime
- **Language**: TypeScript (ES2022+ / ESM)
- **Runtime / Engine**: Node.js (v20+ LTS)
- **Target Platform**: Pi Coding Agent extension ecosystem (`@earendil-works/pi-agent-core`)

## Architecture & Frameworks
- **Application Architecture**: Modular In-Process Extension Architecture
- **Core Dependencies**:
  - `@earendil-works/pi-agent-core` (Extension SDK & Lifecycle APIs)
  - Cooper CLI binary & `.cooper/` directory structures
  - Troop Git Worktree management

## Testing & Quality Control
- **Test Runner / Framework**: Vitest
- **Coverage Target**: >80% code coverage across all modules
- **Linter & Formatter**: ESLint + Prettier / TypeScript compiler (`tsc --noEmit`)

## Build & CI/CD
- **Package Manager**: pnpm / npm
- **Build Tool**: `tsup` / `tsc` (Bundle to standard ESM entrypoint)
- **CI System**: GitHub Actions

