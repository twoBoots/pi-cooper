import { describe, it, expect } from "vitest";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import { handleSwitchCommand } from "./switch.js";

describe("handleSwitchCommand (/cooper:switch)", () => {
  it("informs user when not in a Cooper repository", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "non-cooper-"));
    try {
      const output = await handleSwitchCommand("track-test", tmpDir);
      expect(output).toContain("Not in a Cooper SDD workspace");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("prompts for track ID when omitted", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cooper-switch-no-id-"));
    try {
      const cooperDir = path.join(tmpDir, ".cooper");
      await fs.mkdir(cooperDir, { recursive: true });
      await fs.writeFile(path.join(cooperDir, "index.md"), "# Index");

      const output = await handleSwitchCommand(undefined, tmpDir);
      expect(output).toContain("Usage: /cooper:switch <track_id>");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("validates existing worktree directory", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cooper-switch-valid-"));
    try {
      const cooperDir = path.join(tmpDir, ".cooper");
      const worktreeDir = path.join(tmpDir, ".worktrees", "track-auth");
      await fs.mkdir(cooperDir, { recursive: true });
      await fs.mkdir(worktreeDir, { recursive: true });
      await fs.writeFile(path.join(cooperDir, "index.md"), "# Index");

      const output = await handleSwitchCommand("track-auth", tmpDir);
      expect(output).toContain("Switching to track: track-auth");
      expect(output).toContain(".worktrees/track-auth");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("reports error when worktree directory does not exist", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cooper-switch-invalid-"));
    try {
      const cooperDir = path.join(tmpDir, ".cooper");
      await fs.mkdir(cooperDir, { recursive: true });
      await fs.writeFile(path.join(cooperDir, "index.md"), "# Index");

      const output = await handleSwitchCommand("nonexistent-track", tmpDir);
      expect(output).toContain("Worktree not found for track: nonexistent-track");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
