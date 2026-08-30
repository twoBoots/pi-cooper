# Capability Spec: lifecycle-hooks

## Overview
Defines event-driven SDD governance, pre-tool/pre-commit spec delta validation, automated Git Notes capture, and phase gatekeeping for `pi-cooper`.

---

## Requirements

### Requirement: Pre-Commit & Pre-Tool Spec Delta Interceptor
The extension MUST validate living spec deltas before staging or committing changes during track execution.

#### Scenario: Pre-commit hook executes on active track
- GIVEN an active track with modified code files
- WHEN git commit or pre-commit hook is triggered
- THEN it validates that `.cooper/active/<track_id>/spec-deltas/` contains valid GIVEN/WHEN/THEN specifications matching modified capabilities.

#### Scenario: Commit blocked on invalid spec delta
- GIVEN code changes without corresponding spec deltas or with invalid syntax
- WHEN commit is attempted
- THEN the hook halts the commit and outputs specific guidance on required spec updates.

#### Scenario: Bypass flag allows override
- GIVEN an explicit bypass option (`COOPER_BYPASS_SPEC_CHECK=1` or bypass option argument)
- WHEN pre-commit or pre-tool validation executes
- THEN validation warnings are logged but the operation is permitted to continue.

---

### Requirement: Automated Git Notes Task Summaries
The extension MUST listen for task completion events and automatically attach structured summaries to Git commits via `git notes`.

#### Scenario: Task marked complete in plan.md
- GIVEN a task completed during TDD execution
- WHEN task commit is recorded or plan.md task state changes
- THEN the extension formats a structured summary (Task ID, Changed Files, Rationale, Test Status) and executes `git notes add -m "<summary>" <commit_hash>`.

#### Scenario: Programmatic Git Note recording
- GIVEN a programmatic call to `recordGitNote()` with structured metadata
- WHEN the function executes
- THEN a formatted Git note is attached to the target commit without throwing unhandled exceptions on missing git binaries.

---

### Requirement: Phase Gatekeeper & Remote Synchronization
The extension MUST enforce phase completion criteria before allowing advancement to subsequent phases in `plan.md`.

#### Scenario: Phase checkpoint validation
- GIVEN all tasks in Phase N are marked complete
- WHEN phase checkpoint is reached
- THEN the gatekeeper verifies automated test suites, fetches origin main, creates checkpoint commit and note, and pushes to remote.

#### Scenario: Phase advancement blocked on incomplete tasks or failing tests
- GIVEN incomplete tasks in the current phase or failing test suites
- WHEN phase checkpoint is triggered
- THEN advancement is blocked with clear diagnostic failure reasons.
