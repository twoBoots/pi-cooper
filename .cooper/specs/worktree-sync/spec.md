# Capability Spec: worktree-sync

## Overview
Defines Troop worktree isolation and workspace synchronization for Pi Coding Agent sessions, resolving subshell traps and automating agent trust management.

---

## Requirements

### Requirement: Subshell Trap Resolution & Workspace Chdir
The extension MUST switch the parent Pi process workspace to target worktrees using internal runtime APIs and `process.chdir()` rather than running shell `cd`.

#### Scenario: Switching track worktree in active Pi session
- GIVEN a Pi session running at repository root `/path/to/repo`
- WHEN track switching occurs to `track-auth` (`.worktrees/track-auth`)
- THEN `process.chdir()` and Pi workspace context update to `/path/to/repo/.worktrees/track-auth`, ensuring subsequent `read`, `write`, `edit`, and `bash` tool invocations operate within the worktree root.

---

### Requirement: Automated Project Trust Registration
The extension MUST automatically register newly created or switched worktree paths in Pi's trust registry.

#### Scenario: New worktree spawned
- GIVEN a new worktree created at `.worktrees/<track_id>`
- WHEN the worktree is initialized or switched to
- THEN `pi-cooper` ensures the path is added to `~/.pi/agent/trust.json` (or equivalent Pi trust configuration) to prevent trust prompts during agent execution.

---

### Requirement: Troop Worktree Lifecycle Management
The extension MUST interface with Troop git commands (`git agent-start`, `git agent-stop`, `git troop`) to manage worktree creation and cleanup.

#### Scenario: Worktree creation via extension
- GIVEN user or agent initiating a new track `<track_id>`
- WHEN worktree spawning is requested
- THEN the extension executes the Troop isolation sequence, creates the branch, checks out `.worktrees/<track_id>`, and updates workspace pointers.

#### Scenario: Worktree teardown on completion
- GIVEN a track has completed, merged, and archived
- WHEN teardown is invoked
- THEN the extension switches back to the repository root before invoking `git agent-stop <track_id>` to delete the worktree.
