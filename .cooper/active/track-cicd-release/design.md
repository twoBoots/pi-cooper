# Track Design: CI Pipeline & GitHub Release Architecture

## Overview

The `cicd-release` capability provides declarative GitHub Actions workflows for continuous integration and automated GitHub releases.

```
                  ┌─────────────────────────────────────┐
                  │           GitHub Event              │
                  │  (Push to main / PR / Version Tag)  │
                  └──────────────────┬──────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 │                                       │
                 ▼ (PR / Push main)                      ▼ (Tag: v*.*.* / Dispatch)
   ┌───────────────────────────┐           ┌───────────────────────────┐
   │        CI Workflow        │           │  GitHub Release Workflow  │
   │  (.github/workflows/ci)   │           │ (.github/workflows/release│
   │  - Node LTS on Ubuntu     │           │  - Full Build & Test Pass │
   │  - npm run lint (Oxlint)  │           │  - Create dist/ tarball   │
   │  - npm run typecheck      │           │  - Create GitHub Release  │
   │  - npm run build          │           │  - Auto-generate notes    │
   │  - npm run test:coverage  │           └───────────────────────────┘
   └───────────────────────────┘
```

## Workflow Specifications

### 1. `ci.yml` (Continuous Integration)
- **File:** `.github/workflows/ci.yml`
- **Triggers:**
  - `push` to `main`
  - `pull_request` to `main`
- **Runner:** `ubuntu-latest`
- **Node Version:** `lts/*`
- **Job Sequence:**
  1. `actions/checkout@v4`
  2. `actions/setup-node@v4` with `node-version: lts/*` and `cache: 'npm'`
  3. `npm ci`
  4. `npm run lint` (Oxlint + tsc)
  5. `npm run typecheck`
  6. `npm run build`
  7. `npm run test:coverage`

### 2. `release.yml` (GitHub Release Automation)
- **File:** `.github/workflows/release.yml`
- **Triggers:**
  - `push` on tags matching `v[0-9]+.[0-9]+.[0-9]+*`
  - `workflow_dispatch` with optional version tag input
- **Permissions:**
  - `contents: write`
- **Runner:** `ubuntu-latest`
- **Job Sequence:**
  1. `actions/checkout@v4`
  2. `actions/setup-node@v4` with `node-version: lts/*` and `cache: 'npm'`
  3. `npm ci`
  4. `npm run build && npm test`
  5. Pack distribution bundle: `tar -czvf pi-cooper-dist.tar.gz dist/ package.json README.md LICENSE`
  6. `softprops/action-gh-release@v2` with `generate_release_notes: true` and `files: pi-cooper-dist.tar.gz`
