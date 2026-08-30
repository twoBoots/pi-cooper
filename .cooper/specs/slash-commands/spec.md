# Capability Spec: slash-commands

## Overview
Defines zero-cost, in-process human slash commands that execute within `<5ms` in the Pi runtime with 0 LLM token consumption and 0 API cost.

---

## Requirements

### Requirement: Zero-Token Status Command (`/cooper:status`)
The extension MUST provide `/cooper:status` to inspect current track progress, living spec health, and active phase details instantly.

#### Scenario: Active track exists
- GIVEN an active track (e.g. `auth-jwt`) in `.cooper/active/`
- WHEN user invokes `/cooper:status`
- THEN it renders the active track ID, worktree path, task progress summary (e.g. `4/7 completed`), and living spec delta validation status in `<5ms`.

#### Scenario: No active track selected
- GIVEN no track currently active in the session
- WHEN user invokes `/cooper:status`
- THEN it outputs repository-wide Cooper status, listing registered tracks from `.cooper/tracks.md`.

---

### Requirement: Track Selection Command (`/cooper:tracks`)
The extension MUST provide `/cooper:tracks` displaying an interactive picker or formatted list of active, proposed, and archived tracks.

#### Scenario: Listing tracks
- GIVEN registered tracks in `.cooper/tracks.md`
- WHEN user invokes `/cooper:tracks`
- THEN it presents active worktrees, completion progress, and options to switch or inspect tracks.

---

### Requirement: Workspace Switching Command (`/cooper:switch <track_id>`)
The extension MUST provide `/cooper:switch` to change the active session workspace to a target worktree.

#### Scenario: Switching to an existing track worktree
- GIVEN an existing worktree at `.worktrees/<track_id>`
- WHEN user invokes `/cooper:switch <track_id>`
- THEN the session root is updated to `.worktrees/<track_id>`, the trust registry is verified, and the TUI widget updates to reflect the active track.

#### Scenario: Switching to a non-existent track
- GIVEN `<track_id>` does not exist in `.worktrees/` or `.cooper/active/`
- WHEN user invokes `/cooper:switch <track_id>`
- THEN an error message is returned with available track IDs and prompt to create a new track.

---

### Requirement: Spec Validation Command (`/cooper:validate`)
The extension MUST provide `/cooper:validate` to run fast in-process SDD capability spec and link audits.

#### Scenario: All living specs and deltas are valid
- GIVEN valid markdown files and cross-links in `.cooper/specs/` and `.cooper/active/`
- WHEN user invokes `/cooper:validate`
- THEN it outputs a green success summary confirming all capability specs and spec deltas are valid.

#### Scenario: Spec delta format error detected
- GIVEN invalid GIVEN/WHEN/THEN format or broken spec link in an active track
- WHEN user invokes `/cooper:validate`
- THEN it outputs the file path, line numbers, and actionable remediation steps.

---

### Requirement: Checkpoint Command (`/cooper:checkpoint`)
The extension MUST provide `/cooper:checkpoint` to trigger phase verification, git note generation, and remote synchronization.

#### Scenario: Phase checkpoint invoked
- GIVEN current phase tasks in `plan.md` are marked complete
- WHEN user invokes `/cooper:checkpoint`
- THEN it triggers test suite validation, generates Git Notes verification record, and syncs with `origin/main`.
