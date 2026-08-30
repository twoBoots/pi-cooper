import { describe, it, expect } from "vitest";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import { handleStatusCommand } from "./status.js";

describe("handleStatusCommand (/cooper:status)", () => {
  it("informs user when not in a Cooper repository", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "non-cooper-"));
    try {
      const output = await handleStatusCommand(tmpDir);
      expect(output).toContain("Not in a Cooper SDD workspace");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("renders active track status when active track exists", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cooper-active-status-"));
    try {
      const activeDir = path.join(tmpDir, ".cooper", "active", "track-auth");
      await fs.mkdir(activeDir, { recursive: true });
      await fs.writeFile(path.join(tmpDir, ".cooper", "index.md"), "# Index");

      const meta = {
        track_id: "track-auth",
        title: "Authentication Flow",
        type: "feature",
        status: "in_progress",
        created_at: "2026-08-30T00:00:00Z",
      };
      await fs.writeFile(path.join(activeDir, "metadata.json"), JSON.stringify(meta));

      const planContent = `# Plan
## Phase 1: Core
- [x] Task: Token Gen (1234567)
- [~] Task: Refresh Tokens
- [ ] Task: Phase 1 Checkpoint
`;
      await fs.writeFile(path.join(activeDir, "plan.md"), planContent);

      const output = await handleStatusCommand(tmpDir);
      expect(output).toContain("Authentication Flow");
      expect(output).toContain("track-auth");
      expect(output).toContain("Phase 1: Core");
      expect(output).toContain("1/3");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("renders registered tracks when in root with no active track", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cooper-idle-status-"));
    try {
      const cooperDir = path.join(tmpDir, ".cooper");
      await fs.mkdir(cooperDir, { recursive: true });
      await fs.writeFile(path.join(cooperDir, "index.md"), "# Index");
      await fs.writeFile(
        path.join(cooperDir, "tracks.md"),
        `# Tracks Registry\n- [x] **Track: Scaffold** (\`track-scaffold\`)\n`
      );

      const output = await handleStatusCommand(tmpDir);
      expect(output).toContain("No active track in current workspace");
      expect(output).toContain("Scaffold");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
