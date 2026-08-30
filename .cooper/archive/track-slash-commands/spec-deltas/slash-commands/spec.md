# Spec Delta: slash-commands

## Requirements

### + Requirement: In-Process Slash Command Handlers
The extension MUST provide dedicated command handlers for all registered Cooper slash commands executing in `<5ms` in-process.

#### + Scenario: Status command returns formatted active track summary
- GIVEN an active track with plan.md and metadata.json
- WHEN /cooper:status is executed
- THEN it returns a formatted terminal output with track ID, phase, task completion progress, and spec health.

#### + Scenario: Tracks command returns registered tracks list
- GIVEN tracks registered in .cooper/tracks.md
- WHEN /cooper:tracks is executed
- THEN it lists active and completed tracks with their worktree paths and statuses.

#### + Scenario: Switch command resolves valid worktree directory
- GIVEN a valid track ID corresponding to an existing worktree
- WHEN /cooper:switch <track_id> is executed
- THEN it validates the target path and returns confirmation with path details.

#### + Scenario: Fast in-process spec and link validation
- GIVEN living specs in .cooper/specs/ and active tracks in .cooper/active/
- WHEN /cooper:validate is executed
- THEN it audits spec file headers, GIVEN/WHEN/THEN scenarios, and relative links, returning a formatted validation report.
