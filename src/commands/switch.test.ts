import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import { handleSwitchCommand } from "./switch.js";
import type { ExtensionContext } from "../types.js";

describe("handleSwitchCommand (/cooper:switch)", () => {
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
  });

  afterEach(() => {
    try {
      process.chdir(originalCwd);
    } catch {
      // ignore
    }
  });

  it("informs user when not in a Cooper repository", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "non-cooper-"));
    try {
      const output = await handleSwitchCommand("track-test", { workspacePath: tmpDir, registerCommand: vi.fn() });
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

      const output = await handleSwitchCommand(undefined, { workspacePath: tmpDir, registerCommand: vi.fn() });
      expect(output).toContain("Usage: /cooper:switch <track_id>");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  it("switches in-process workspace, updates trust store, and returns status", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cooper-switch-valid-"));
    try {
      const cooperDir = path.join(tmpDir, ".cooper");
      const worktreeDir = path.join(tmpDir, ".worktrees", "track-auth");
      await fs.mkdir(cooperDir, { recursive: true });
      await fs.mkdir(worktreeDir, { recursive: true });
      await fs.writeFile(path.join(cooperDir, "index.md"), "# Index");

      const realWtDir = await fs.realpath(worktreeDir);
      const mockContext: ExtensionContext = {
        workspacePath: tmpDir,
        registerCommand: vi.fn(),
      };

      const output = await handleSwitchCommand("track-auth", mockContext);
      expect(output).toContain("Switched workspace to track: track-auth");
      expect(output).toContain(realWtDir);
      expect(process.cwd()).toBe(realWtDir);
      expect(mockContext.workspacePath).toBe(realWtDir);
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

      const output = await handleSwitchCommand("nonexistent-track", { workspacePath: tmpDir, registerCommand: vi.fn() });
      expect(output).toContain("Worktree not found for track: nonexistent-track");
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });
});
