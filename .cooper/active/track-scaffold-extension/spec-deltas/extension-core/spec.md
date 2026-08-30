# Spec Delta: extension-core

## Requirements

### + Requirement: Package Build & Entrypoint Distribution
The extension package MUST provide a compiled ESM distribution bundle with TypeScript declarations and automated test coverage.

#### + Scenario: Extension entrypoint loaded by Pi Agent Core
- GIVEN a valid Pi ExtensionContext instance
- WHEN the default extension activate function is invoked
- THEN it executes without errors and registers the pi-cooper extension instance.

#### + Scenario: Building extension bundle
- GIVEN source files in `src/`
- WHEN `npm run build` is executed
- THEN it generates a bundled ESM artifact in `dist/index.js` with type definitions in `dist/index.d.ts`.

#### + Scenario: Running unit test suite with coverage
- GIVEN unit tests in `tests/`
- WHEN `npm run test:coverage` is executed
- THEN all test suites pass with code coverage meeting or exceeding the 80% threshold.
