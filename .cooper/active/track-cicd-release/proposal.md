# Track Proposal: CI Pipeline & GitHub Release Automation

## Metadata
- **Track ID:** `track-cicd-release`
- **Capability:** `cicd-release`
- **Type:** Feature
- **Status:** Planned

## Executive Summary
This track establishes automated continuous integration (CI) and GitHub release automation using GitHub Actions for `pi-cooper`. It enforces code quality gatekeeping (linting, typechecking, build verification, and test coverage) on all pull requests and pushes to `main`, and automates GitHub Release creation with release notes and built distribution bundles when version tags (`v*.*.*`) are pushed or triggered manually.

## Problem Statement
While `pi-cooper` maintains strict local SDD discipline, remote repository automation is missing:
1. **No Automated PR Gatekeeping**: Pull requests currently do not execute automated CI checks on GitHub Actions to verify linting, typing, build artifacts, and test suites.
2. **Manual GitHub Release Overhead**: Creating release tags, generating release notes, and attaching compiled distribution assets on GitHub manually is tedious and error-prone.

## Proposed Solution
1. **Continuous Integration Workflow (`.github/workflows/ci.yml`)**:
   - Executes on `pull_request` (targeting `main`) and `push` to `main`.
   - Runs on `ubuntu-latest` with the latest Node.js LTS.
   - Steps: Checkout, Setup Node with dependency caching, `npm ci`, `npm run lint` (Oxlint + tsc), `npm run typecheck`, `npm run build` (Rolldown + declaration emit), `npm run test:coverage` (Vitest with v8 coverage).
2. **GitHub Release Workflow (`.github/workflows/release.yml`)**:
   - Executes on Git tag pushes matching `v*.*.*` and via manual `workflow_dispatch`.
   - Runs on `ubuntu-latest` with Node.js LTS.
   - Verifies tests and build output, creates a tarball of compiled distribution assets (`dist/`), and publishes a GitHub Release with auto-generated release notes.

## Scope & Non-Goals
- **In Scope:**
  - GitHub Actions CI workflow (`.github/workflows/ci.yml`).
  - GitHub Actions Release workflow (`.github/workflows/release.yml`) targeting GitHub Releases.
  - Living capability specification for `cicd-release` (`.cooper/specs/cicd-release/spec.md`).
  - Workflow validation tests.
- **Out of Scope:**
  - Publishing packages to external registries like npm.
