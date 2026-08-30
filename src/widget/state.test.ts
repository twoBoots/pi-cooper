import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { extractWidgetState } from "./state.js";

describe("TUI Status Widget State Extractor", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cooper-widget-state-test-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("returns uninitialized state when not a cooper project", async () => {
    const state = await extractWidgetState(tmpDir);
    expect(state.mode).toBe("uninitialized");
  });

  it("returns idle state when cooper initialized but no active tracks", async () => {
    await fs.mkdir(path.join(tmpDir, ".cooper"), { recursive: true });
    await fs.writeFile(path.join(tmpDir, ".cooper", "index.md"), "# Cooper Root\n");
    await fs.writeFile(
      path.join(tmpDir, ".cooper", "tracks.md"),
      `# Tracks\n- [x] **Track: Old** (\`track-old\`)\n  - Worktree: \`.worktrees/track-old\`\n`
    );

    const state = await extractWidgetState(tmpDir);
    expect(state.mode).toBe("idle");
    expect(state.availableTracksCount).toBe(0);
  });

  it("returns active track state with progress and valid specs", async () => {
    const cooperDir = path.join(tmpDir, ".cooper");
    const activeDir = path.join(cooperDir, "active", "track-auth");
    const deltasDir = path.join(activeDir, "spec-deltas", "auth");
    await fs.mkdir(deltasDir, { recursive: true });

    await fs.writeFile(path.join(cooperDir, "index.md"), "# Cooper Root\n");
    await fs.writeFile(
      path.join(cooperDir, "tracks.md"),
      `# Tracks\n- [ ] **Track: Auth** (\`track-auth\`)\n  - Worktree: \`.worktrees/track-auth\`\n`
    );
    await fs.writeFile(
      path.join(activeDir, "metadata.json"),
      JSON.stringify({
        track_id: "track-auth",
        title: "Auth Feature",
        type: "feature",
        status: "in_progress",
        created_at: "2026-08-30",
      })
    );
    await fs.writeFile(
      path.join(activeDir, "plan.md"),
      `# Plan\n\n## Phase 1: Core\n- [x] Task: Database Schema\n- [ ] Task: Token Validation\n\n## Phase 2: UI\n- [ ] Task: Login Form\n`
    );
    await fs.writeFile(
      path.join(deltasDir, "spec.md"),
      `# Spec Delta: Auth\n\n### Requirement: Login\n#### Scenario: Valid Login\n- GIVEN valid credentials\n- WHEN user submits\n- THEN return 200\n`
    );

    const state = await extractWidgetState(tmpDir);
    expect(state.mode).toBe("active");
    expect(state.trackId).toBe("track-auth");
    expect(state.totalPhases).toBe(2);
    expect(state.currentPhaseIndex).toBe(1);
    expect(state.totalTasks).toBe(3);
    expect(state.completedTasks).toBe(1);
    expect(state.specValid).toBe(true);
  });

  it("detects invalid spec deltas in active track", async () => {
    const cooperDir = path.join(tmpDir, ".cooper");
    const activeDir = path.join(cooperDir, "active", "track-auth");
    const deltasDir = path.join(activeDir, "spec-deltas", "auth");
    await fs.mkdir(deltasDir, { recursive: true });

    await fs.writeFile(path.join(cooperDir, "index.md"), "# Cooper Root\n");
    await fs.writeFile(
      path.join(cooperDir, "tracks.md"),
      `# Tracks\n- [ ] **Track: Auth** (\`track-auth\`)\n  - Worktree: \`.worktrees/track-auth\`\n`
    );
    await fs.writeFile(
      path.join(activeDir, "metadata.json"),
      JSON.stringify({
        track_id: "track-auth",
        title: "Auth Feature",
        type: "feature",
        status: "in_progress",
        created_at: "2026-08-30",
      })
    );
    await fs.writeFile(
      path.join(activeDir, "plan.md"),
      `# Plan\n\n## Phase 1: Core\n- [ ] Task: Token Validation\n`
    );
    // Malformed scenario step without GIVEN/WHEN/THEN
    await fs.writeFile(
      path.join(deltasDir, "spec.md"),
      `# Spec Delta: Auth\n\n### Requirement: Login\n#### Scenario: Bad Scenario\n- invalid step without keyword\n`
    );

    const state = await extractWidgetState(tmpDir);
    expect(state.mode).toBe("active");
    expect(state.specValid).toBe(false);
  });
});
