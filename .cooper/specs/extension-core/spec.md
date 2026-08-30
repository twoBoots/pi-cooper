# Capability Spec: extension-core

## Overview
Defines the core extension lifecycle, environment discovery, runtime initialization, and Pi Agent Core API bindings for `pi-cooper`.

---

## Requirements

### Requirement: Extension Lifecycle Registration
The extension MUST export a standard entrypoint function conforming to `@earendil-works/pi-agent-core` extension standards.

#### Scenario: Extension initialized in Cooper-enabled repository
- GIVEN a Pi session starting in a repository with `.cooper/` present
- WHEN Pi loads the `pi-cooper` extension entrypoint
- THEN the extension registers slash commands, status bar widgets, and event hooks without blocking agent startup.

#### Scenario: Extension loaded in non-Cooper repository
- GIVEN a Pi session starting in a repository without `.cooper/`
- WHEN the extension loads
- THEN it degrades gracefully, registering `/cooper:init` while suppressing active tracking hooks until initialized.

---

### Requirement: Environment & Binary Discovery
The extension MUST detect and validate the availability of the `cooper` CLI, `git`, and Troop integration in the host environment.

#### Scenario: Host has Cooper CLI installed
- GIVEN `cooper` CLI is available in the user's `$PATH` or standard binary paths
- WHEN environment discovery executes
- THEN `pi-cooper` sets the execution engine to use native CLI capabilities and cached state.

#### Scenario: Host missing Cooper CLI
- GIVEN `cooper` CLI is not found in `$PATH`
- WHEN extension initialization runs
- THEN fallback in-process TypeScript file-parsers handle basic `.cooper/` reads and present a notification to install the CLI.

---

### Requirement: Configuration & Workspace Context State
The extension MUST maintain an in-memory session context reflecting active track ID, workspace path, and living spec health.

#### Scenario: Workspace context updated
- GIVEN an active Pi session
- WHEN track switching or workspace updates occur
- THEN the extension context broadcasts state change events to dependent components (TUI widget, slash commands, lifecycle hooks).
