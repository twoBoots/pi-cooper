import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface TaskNotePayload {
  trackId: string;
  phaseIndex: number;
  taskId: string;
  taskTitle: string;
  changedFiles?: string[];
  testStatus?: "passed" | "failed" | "skipped";
  timestamp: string;
}

export interface RecordTaskNoteOptions {
  commitSha: string;
  payload: TaskNotePayload;
}

export interface GitNoteResult {
  success: boolean;
  error?: string;
}

export interface GitNotesManagerOptions {
  workspacePath?: string;
}

/**
 * Formats a structured Git Note string from task metadata
 */
export function formatTaskGitNote(payload: TaskNotePayload): string {
  const lines: string[] = [
    `Task: ${payload.taskTitle}`,
    `Track: ${payload.trackId}`,
    `Phase: ${payload.phaseIndex}`,
    `Task ID: ${payload.taskId}`,
  ];

  if (payload.changedFiles && payload.changedFiles.length > 0) {
    lines.push(`Files: ${payload.changedFiles.join(", ")}`);
  }

  if (payload.testStatus) {
    lines.push(`Test Status: ${payload.testStatus}`);
  }

  lines.push(`Timestamp: ${payload.timestamp}`);
  return lines.join("\n");
}

/**
 * Manages reading and writing Git Notes for task completions and phase checkpoints
 */
export class GitNotesManager {
  private readonly workspacePath: string;

  constructor(options: GitNotesManagerOptions = {}) {
    this.workspacePath = options.workspacePath ?? process.cwd();
  }

  /**
   * Records a task note onto a specific git commit
   */
  public async recordTaskNote(options: RecordTaskNoteOptions): Promise<GitNoteResult> {
    const noteContent = formatTaskGitNote(options.payload);
    return this.addRawNote(options.commitSha, noteContent);
  }

  /**
   * Records an arbitrary note onto a specific git commit
   */
  public async addRawNote(commitSha: string, noteContent: string): Promise<GitNoteResult> {
    try {
      await execFileAsync("git", ["notes", "add", "-f", "-m", noteContent, commitSha], {
        cwd: this.workspacePath,
      });
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * Retrieves git note content for a given commit SHA
   */
  public async getNote(commitSha: string): Promise<string | null> {
    try {
      const { stdout } = await execFileAsync("git", ["notes", "show", commitSha], {
        cwd: this.workspacePath,
      });
      return stdout.trim();
    } catch {
      return null;
    }
  }
}
