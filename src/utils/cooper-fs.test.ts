import { describe, it, expect } from "vitest";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import {
  findCooperRoot,
  readTracksRegistry,
  readTrackPlan,
  readTrackMetadata,
  listActiveTracks,
} from "./cooper-fs.js";

describe("Cooper Filesystem Utilities", () => {
  it("finds Cooper root directory by walking up directory tree", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cooper-fs-test-"));
    try {
      const cooperDir = path.join(tmpDir, ".cooper");
      await fs.mkdir(cooperDir, { recursive: true });
      await fs.writeFile(path.join(cooperDir, "index.md"), "# Index");

      const nestedSubdir = path.join(tmpDir, "src", "sub", "deep");
      await fs.mkdir(nestedSubdir, { recursive: true });

      const found = await findCooperRoot(nestedSubdir);
      expect(found).toBe(tmpDir);

      const notFound = await findCooperRoot(os.tmpdir());
      expect(notFound).toBeNull();
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("reads and parses tracks registry from tracks.md", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cooper-tracks-test-"));
    try {
      const cooperDir = path.join(tmpDir, ".cooper");
      await fs.mkdir(cooperDir, { recursive: true });
      const tracksContent = `# Tracks Registry
- [x] **Track: Scaffold TypeScript extension** (\`track-scaffold-extension\`)
  - Worktree: \`.worktrees/track-scaffold-extension\`
  - Link: [.cooper/archive/track-scaffold-extension/index.md](.cooper/archive/track-scaffold-extension/index.md)
- [ ] **Track: Slash Commands** (\`track-slash-commands\`)
  - Worktree: \`.worktrees/track-slash-commands\`
  - Link: [.cooper/active/track-slash-commands/index.md](.cooper/active/track-slash-commands/index.md)
`;
      await fs.writeFile(path.join(cooperDir, "tracks.md"), tracksContent);

      const tracks = await readTracksRegistry(tmpDir);
      expect(tracks).toHaveLength(2);

      expect(tracks[0]).toEqual({
        id: "track-scaffold-extension",
        title: "Scaffold TypeScript extension",
        completed: true,
        worktree: ".worktrees/track-scaffold-extension",
        link: ".cooper/archive/track-scaffold-extension/index.md",
      });

      expect(tracks[1]).toEqual({
        id: "track-slash-commands",
        title: "Slash Commands",
        completed: false,
        worktree: ".worktrees/track-slash-commands",
        link: ".cooper/active/track-slash-commands/index.md",
      });
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("reads and computes task statistics from plan.md", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cooper-plan-test-"));
    try {
      const planContent = `# Plan: Test Track
## Phase 1: Foundation
- [x] Task: Initial Setup (abc1234)
  - [x] Sub-task: A
  - [x] Sub-task: B
- [x] Task: Config Setup (def5678)
- [x] Task: Phase 1 Verification & Checkpoint (789abcd)

## Phase 2: Implementation
- [~] Task: Core Feature
  - [ ] Sub-task: Feature logic
- [ ] Task: Second Feature
- [ ] Task: Phase 2 Verification & Checkpoint
`;
      const planPath = path.join(tmpDir, "plan.md");
      await fs.writeFile(planPath, planContent);

      const summary = await readTrackPlan(planPath);
      expect(summary.totalTasks).toBe(6);
      expect(summary.completedTasks).toBe(3);
      expect(summary.inProgressTasks).toBe(1);
      expect(summary.pendingTasks).toBe(2);
      expect(summary.totalPhases).toBe(2);
      expect(summary.currentPhase).toBe("Phase 2: Implementation");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("reads track metadata.json safely", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cooper-meta-test-"));
    try {
      const metaObj = {
        track_id: "track-test",
        title: "Test Track",
        type: "feature",
        status: "new",
        created_at: "2026-08-30T00:00:00Z",
      };
      await fs.writeFile(path.join(tmpDir, "metadata.json"), JSON.stringify(metaObj));

      const meta = await readTrackMetadata(tmpDir);
      expect(meta).toEqual(metaObj);

      const emptyMeta = await readTrackMetadata(path.join(tmpDir, "nonexistent"));
      expect(emptyMeta).toBeNull();
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("lists all active tracks under .cooper/active", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cooper-active-test-"));
    try {
      const activeDir = path.join(tmpDir, ".cooper", "active");
      const track1 = path.join(activeDir, "track-1");
      const track2 = path.join(activeDir, "track-2");
      await fs.mkdir(track1, { recursive: true });
      await fs.mkdir(track2, { recursive: true });

      await fs.writeFile(
        path.join(track1, "metadata.json"),
        JSON.stringify({
          track_id: "track-1",
          title: "Track 1",
          type: "feature",
          status: "in_progress",
          created_at: "2026-08-30T00:00:00Z",
        })
      );

      await fs.writeFile(
        path.join(track2, "metadata.json"),
        JSON.stringify({
          track_id: "track-2",
          title: "Track 2",
          type: "chore",
          status: "new",
          created_at: "2026-08-30T00:00:00Z",
        })
      );

      const activeList = await listActiveTracks(tmpDir);
      expect(activeList).toHaveLength(2);
      expect(activeList.map((t) => t.track_id).sort()).toEqual(["track-1", "track-2"]);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
