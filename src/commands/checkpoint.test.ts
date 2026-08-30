import { describe, it, expect } from "vitest";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import { handleCheckpointCommand } from "./checkpoint.js";

describe("handleCheckpointCommand (/cooper:checkpoint)", () => {
  it("informs user when not in a Cooper repository", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "non-cooper-"));
    try {
      const output = await handleCheckpointCommand(tmpDir);
      expect(output).toContain("Not in a Cooper SDD workspace");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("renders checkpoint guidance when active track exists", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cooper-chk-active-"));
    try {
      const activeDir = path.join(tmpDir, ".cooper", "active", "track-auth");
      await fs.mkdir(activeDir, { recursive: true });
      await fs.writeFile(path.join(tmpDir, ".cooper", "index.md"), "# Index");

      const meta = {
        track_id: "track-auth",
        title: "Auth",
        type: "feature",
        status: "in_progress",
        created_at: "2026-08-30T00:00:00Z",
      };
      await fs.writeFile(path.join(activeDir, "metadata.json"), JSON.stringify(meta));
      await fs.writeFile(path.join(activeDir, "plan.md"), "## Phase 1: Setup\n- [x] Task: Init (123)\n");

      const output = await handleCheckpointCommand(tmpDir);
      expect(output).toContain("Phase Checkpoint Protocol");
      expect(output).toContain("track-auth");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
