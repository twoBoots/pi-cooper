# Technical Design: Scaffold TypeScript extension package, build pipeline, and test harness

- **Track ID**: `track-scaffold-extension`

## 1. Architecture Overview
`pi-cooper` is a lightweight, in-process extension for the Pi Coding Agent. The package is structured as a modern ES Module (ESM) targeting Node.js 20+ LTS.

```
pi-cooper/
├── src/
│   ├── index.ts          # Extension entrypoint conforming to Pi extension contract
│   ├── types.ts          # Extension context types and Cooper domain interfaces
│   └── constants.ts      # Extension metadata, versioning, command constants
├── tests/
│   ├── index.test.ts     # Extension entrypoint and mock activation tests
│   └── types.test.ts     # Domain types & schema validation tests
├── package.json          # Package manifest, dependencies, test/build scripts
├── tsconfig.json         # Strict TypeScript configuration
├── tsup.config.ts        # Fast bundling toolchain (ESM + dts)
└── vitest.config.ts      # Test harness with v8 code coverage
```

## 2. Extension Lifecycle Contract
The extension exports a default activation function accepting the Pi runtime's `ExtensionContext`:

```typescript
export interface ExtensionContext {
  registerCommand(name: string, handler: CommandHandler): void;
  registerStatusBarItem(item: StatusBarItem): void;
  on(event: string, listener: (...args: any[]) => void): void;
  workspacePath: string;
}

export default function activate(context: ExtensionContext): void;
```

## 3. Toolchain & Dependencies
- **Runtime Target**: Node.js 20+ (ESM)
- **Compiler**: TypeScript 5.x (`tsc --noEmit` for validation)
- **Bundler**: `tsup` (esbuild-powered ESM bundle generator)
- **Testing**: `vitest` with `@vitest/coverage-v8` (>80% threshold enforcement)
- **Core Dependencies**: `@earendil-works/pi-agent-core` (or mock interface during early bootstrapping)
