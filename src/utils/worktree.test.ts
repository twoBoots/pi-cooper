import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import {
  resolveWorktreePath,
  listWorktrees,
  switchWorkspace,
  syncTrustRegistry,
} from "./worktree.js";
import type { ExtensionContext } from "../types.js";

describe("Worktree & Trust Registry Utilities", () => {
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

  describe("resolveWorktreePath & listWorktrees", () => {
    it("resolves worktree path correctly and reports existence", async () => {
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cooper-wt-resolve-"));
      try {
        const wtDir = path.join(tmpDir, ".worktrees", "track-auth");
        await fs.mkdir(wtDir, { recursive: true });

        const resolved = await resolveWorktreePath(tmpDir, "track-auth");
        expect(resolved.exists).toBe(true);
        expect(resolved.path).toBe(wtDir);
        expect(resolved.trackId).toBe("track-auth");

        const nonExistent = await resolveWorktreePath(tmpDir, "track-missing");
        expect(nonExistent.exists).toBe(false);
        expect(nonExistent.path).toBe(path.join(tmpDir, ".worktrees", "track-missing"));
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });

    it("lists all valid worktrees in .worktrees directory", async () => {
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cooper-wt-list-"));
      try {
        const wt1 = path.join(tmpDir, ".worktrees", "track-1");
        const wt2 = path.join(tmpDir, ".worktrees", "track-2");
        await fs.mkdir(wt1, { recursive: true });
        await fs.mkdir(wt2, { recursive: true });

        const list = await listWorktrees(tmpDir);
        expect(list).toHaveLength(2);
        expect(list.map((w) => w.trackId).sort()).toEqual(["track-1", "track-2"]);
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });
  });

  describe("switchWorkspace", () => {
    it("switches process.cwd() and updates context workspacePath", async () => {
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cooper-wt-switch-"));
      try {
        const targetDir = path.join(tmpDir, ".worktrees", "track-feature");
        await fs.mkdir(targetDir, { recursive: true });

        const mockContext: ExtensionContext = {
          workspacePath: tmpDir,
          registerCommand: vi.fn(),
        };

        const realTargetDir = await fs.realpath(targetDir);
        const result = await switchWorkspace(targetDir, mockContext);
        expect(result.success).toBe(true);
        expect(result.previousPath).toBe(originalCwd);
        expect(result.currentPath).toBe(realTargetDir);
        expect(process.cwd()).toBe(realTargetDir);
        expect(mockContext.workspacePath).toBe(realTargetDir);
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });

    it("fails gracefully if target directory does not exist", async () => {
      const nonExistent = path.join(os.tmpdir(), "cooper-nonexistent-" + Date.now());
      const result = await switchWorkspace(nonExistent);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("syncTrustRegistry", () => {
    it("creates trust.json and adds trusted path idempotently", async () => {
      const tmpHome = await fs.mkdtemp(path.join(os.tmpdir(), "cooper-trust-home-"));
      try {
        const targetPath = "/workspace/project/.worktrees/track-1";
        const trustFile = path.join(tmpHome, ".pi", "agent", "trust.json");

        const firstSync = await syncTrustRegistry(targetPath, { trustFilePath: trustFile });
        expect(firstSync.added).toBe(true);
        expect(firstSync.trustedPaths).toContain(targetPath);

        const content = JSON.parse(await fs.readFile(trustFile, "utf8"));
        expect(content.trustedPaths).toContain(targetPath);

        // Run second time (idempotent)
        const secondSync = await syncTrustRegistry(targetPath, { trustFilePath: trustFile });
        expect(secondSync.added).toBe(false);
        expect(secondSync.trustedPaths).toHaveLength(1);
      } finally {
        await fs.rm(tmpHome, { recursive: true, force: true });
      }
    });

    it("preserves existing entries in trust.json", async () => {
      const tmpHome = await fs.mkdtemp(path.join(os.tmpdir(), "cooper-trust-preserve-"));
      try {
        const trustFile = path.join(tmpHome, "trust.json");
        await fs.writeFile(
          trustFile,
          JSON.stringify({ trustedPaths: ["/existing/path"], autoApprove: true })
        );

        const newPath = "/new/worktree/path";
        const syncRes = await syncTrustRegistry(newPath, { trustFilePath: trustFile });
        expect(syncRes.added).toBe(true);
        expect(syncRes.trustedPaths).toEqual(["/existing/path", newPath]);

        const saved = JSON.parse(await fs.readFile(trustFile, "utf8"));
        expect(saved.autoApprove).toBe(true);
        expect(saved.trustedPaths).toEqual(["/existing/path", newPath]);
      } finally {
        await fs.rm(tmpHome, { recursive: true, force: true });
      }
    });
  });
});
