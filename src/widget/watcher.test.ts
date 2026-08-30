import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { TrackStateWatcher } from "./watcher.js";
import type { WidgetState } from "./formatter.js";

describe("Reactive Track State Watcher", () => {
  let tmpDir: string;
  let cooperDir: string;
  let activeDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cooper-watcher-test-"));
    cooperDir = path.join(tmpDir, ".cooper");
    activeDir = path.join(cooperDir, "active", "track-test");
    await fs.mkdir(path.join(activeDir, "spec-deltas", "test"), { recursive: true });

    await fs.writeFile(path.join(cooperDir, "index.md"), "# Cooper Root\n");
    await fs.writeFile(
      path.join(cooperDir, "tracks.md"),
      `# Tracks\n- [ ] **Track: Test** (\`track-test\`)\n  - Worktree: \`.worktrees/track-test\`\n`
    );
    await fs.writeFile(
      path.join(activeDir, "metadata.json"),
      JSON.stringify({
        track_id: "track-test",
        title: "Test Track",
        type: "feature",
        status: "in_progress",
        created_at: "2026-08-30",
      })
    );
    await fs.writeFile(
      path.join(activeDir, "plan.md"),
      `# Plan\n\n## Phase 1: Setup\n- [ ] Task: Initial Setup\n`
    );
    await fs.writeFile(
      path.join(activeDir, "spec-deltas", "test", "spec.md"),
      `# Spec Delta\n\n### Requirement: Test\n#### Scenario: Case\n- GIVEN something\n- WHEN action\n- THEN result\n`
    );
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("evaluates initial state on startup", async () => {
    const watcher = new TrackStateWatcher(tmpDir, { debounceMs: 20 });
    const initialState = await watcher.getCurrentState();

    expect(initialState.mode).toBe("active");
    expect(initialState.trackId).toBe("track-test");
    expect(initialState.completedTasks).toBe(0);
    expect(initialState.totalTasks).toBe(1);

    watcher.dispose();
  });

  it("emits change event when plan.md is updated", async () => {
    const watcher = new TrackStateWatcher(tmpDir, { debounceMs: 20 });
    await watcher.start();

    const changePromise = new Promise<WidgetState>((resolve) => {
      watcher.once("change", (state) => {
        resolve(state);
      });
    });

    // Update plan.md to complete task
    await fs.writeFile(
      path.join(activeDir, "plan.md"),
      `# Plan\n\n## Phase 1: Setup\n- [x] Task: Initial Setup\n`
    );

    const updatedState = await changePromise;
    expect(updatedState.completedTasks).toBe(1);

    watcher.dispose();
  });

  it("emits change on forceRefresh", async () => {
    const watcher = new TrackStateWatcher(tmpDir, { debounceMs: 20 });
    const changeSpy = vi.fn();
    watcher.on("change", changeSpy);

    const state = await watcher.forceRefresh();
    expect(state.mode).toBe("active");
    expect(changeSpy).toHaveBeenCalledWith(state);

    watcher.dispose();
  });

  it("disposes cleanly and stops emitting events", async () => {
    const watcher = new TrackStateWatcher(tmpDir, { debounceMs: 20 });
    await watcher.start();
    watcher.dispose();

    expect(watcher.isWatching()).toBe(false);
  });
});
