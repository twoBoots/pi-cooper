import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { GitNotesManager, formatTaskGitNote, type TaskNotePayload } from "./git-notes.js";

const execFileAsync = promisify(execFile);

describe("GitNotesManager & Note Formatter", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cooper-git-notes-test-"));
    await execFileAsync("git", ["init"], { cwd: tmpDir });
    await execFileAsync("git", ["config", "user.name", "Cooper Agent"], { cwd: tmpDir });
    await execFileAsync("git", ["config", "user.email", "agent@cooper.dev"], { cwd: tmpDir });
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe("formatTaskGitNote", () => {
    it("should format task note payload into structured key-value lines", () => {
      const payload: TaskNotePayload = {
        trackId: "track-test",
        phaseIndex: 1,
        taskId: "task-01",
        taskTitle: "Implement parser",
        changedFiles: ["src/parser.ts", "src/parser.test.ts"],
        testStatus: "passed",
        timestamp: "2026-08-30T10:00:00Z",
      };

      const note = formatTaskGitNote(payload);

      expect(note).toContain("Task: Implement parser");
      expect(note).toContain("Track: track-test");
      expect(note).toContain("Phase: 1");
      expect(note).toContain("Files: src/parser.ts, src/parser.test.ts");
      expect(note).toContain("Test Status: passed");
      expect(note).toContain("Timestamp: 2026-08-30T10:00:00Z");
    });
  });

  describe("GitNotesManager", () => {
    it("should attach git note to a valid commit", async () => {
      const testFile = path.join(tmpDir, "file.txt");
      await fs.writeFile(testFile, "hello world");
      await execFileAsync("git", ["add", "file.txt"], { cwd: tmpDir });
      const { stdout: commitOut } = await execFileAsync("git", ["commit", "-m", "initial commit"], { cwd: tmpDir });
      const { stdout: hashOut } = await execFileAsync("git", ["rev-parse", "HEAD"], { cwd: tmpDir });
      const commitSha = hashOut.trim();

      const manager = new GitNotesManager({ workspacePath: tmpDir });
      const result = await manager.recordTaskNote({
        commitSha,
        payload: {
          trackId: "track-test",
          phaseIndex: 1,
          taskId: "task-01",
          taskTitle: "Initial Task",
          testStatus: "passed",
          timestamp: "2026-08-30T10:00:00Z",
        },
      });

      expect(result.success).toBe(true);

      const noteText = await manager.getNote(commitSha);
      expect(noteText).toContain("Task: Initial Task");
      expect(noteText).toContain("Track: track-test");
    });

    it("should return failure result gracefully when commit sha is invalid", async () => {
      const manager = new GitNotesManager({ workspacePath: tmpDir });
      const result = await manager.recordTaskNote({
        commitSha: "nonexistent_sha",
        payload: {
          trackId: "track-test",
          phaseIndex: 1,
          taskId: "task-01",
          taskTitle: "Failing Task",
          timestamp: "2026-08-30T10:00:00Z",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
