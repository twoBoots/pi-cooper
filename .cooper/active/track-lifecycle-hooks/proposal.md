# Track Proposal: Implement SDD Lifecycle Hooks & Automated Governance

## Metadata
- **Track ID:** `track-lifecycle-hooks`
- **Capability:** `lifecycle-hooks`
- **Type:** Feature
- **Status:** Planned

## Executive Summary
This track implements the event-driven Spec-Driven Development (SDD) governance lifecycle for the `pi-cooper` extension. It establishes automated spec delta validation interceptors (pre-commit & pre-tool execution), real-time Git Notes capture on task completion, and phase boundary gatekeeping with remote branch synchronization.

## Problem Statement
While slash commands and TUI widgets provide visibility, development workflows require automated guardrails to prevent specification drift:
1. **Unchecked Code Edits:** Developers or agents can modify codebase files without updating corresponding living spec deltas.
2. **Manual Git Notes Overhead:** Recording structured task summaries with test and context metadata manually is error-prone and often skipped.
3. **Phase Advancement Without Verification:** Transitioning between phases without verifying test suites, synchronizing with upstream trunk, and pushing remote checkpoints risks merge divergence.

## Proposed Solution
Introduce a dedicated lifecycle subsystem (`src/lifecycle/`) providing:
1. **Spec Delta Interceptor (`SpecDeltaInterceptor`):** Validates modified source files against `.cooper/active/<track_id>/spec-deltas/` before commits or tool operations, blocking invalid or missing deltas by default with optional override capability.
2. **Automated Git Notes Manager (`GitNotesManager`):** Listens for task completion events (via `plan.md` state watcher or direct API invocation) and attaches structured metadata notes to Git commits.
3. **Phase Gatekeeper (`PhaseGatekeeper`):** Validates phase completion criteria, runs test suites, coordinates `git fetch origin main`, generates phase checkpoint notes, and synchronizes with remote branches.
4. **Pi Extension Runtime Hooks Integration:** Registers lifecycle event listeners and hook handlers inside `CooperExtension.initialize()`.

## Scope & Non-Goals
- **In Scope:**
  - Pre-commit and pre-tool spec validation engine.
  - Reactive and programmatic Git Notes task summary recording.
  - Phase gatekeeping, automated test verification, and remote sync orchestration.
  - Unit and integration test coverage >80% adhering to TDD.
- **Out of Scope:**
  - External CI/CD server plugins (focused on local Pi agent runtime).
