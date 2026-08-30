# Spec Delta: worktree-sync

## Requirements

### + Requirement: Runtime Workspace Switching
The extension MUST switch the in-memory Node process working directory using `process.chdir()` and update context workspace paths upon switching tracks.

#### + Scenario: Process working directory updated on switch
- GIVEN a valid target worktree directory
- WHEN switchWorkspace is executed
- THEN process.cwd() is updated to the target path and success details are returned.

### + Requirement: Automated Trust Store Synchronization
The extension MUST idempotently register target worktree paths in the Pi trust store (`trust.json`).

#### + Scenario: Adding new worktree path to trust store
- GIVEN a new worktree path and a trust.json file
- WHEN syncTrustRegistry is executed
- THEN the path is added to trustedPaths array without duplicating existing entries.

#### + Scenario: Graceful handling of missing trust store directory
- GIVEN a trust store directory that does not yet exist
- WHEN syncTrustRegistry is executed
- THEN parent directories are created and trust.json is written with the target path.
