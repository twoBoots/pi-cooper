import * as path from "node:path";
import * as fs from "node:fs/promises";
import { findCooperRoot, readTracksRegistry } from "../utils/cooper-fs.js";

/**
 * Executes /cooper:switch <track_id> in-process
 */
export async function handleSwitchCommand(
  trackId?: string,
  workspacePath?: string
): Promise<string> {
  const currentDir = workspacePath ?? process.cwd();
  const cooperRoot = await findCooperRoot(currentDir);

  if (!cooperRoot) {
    return "⚠️ [Cooper SDD] Not in a Cooper SDD workspace (no .cooper/ directory found).\nRun 'cooper init' to initialize Cooper in this project.";
  }

  if (!trackId || trackId.trim() === "") {
    const tracks = await readTracksRegistry(cooperRoot);
    const available = tracks
      .filter((t) => !t.completed)
      .map((t) => `  - ${t.id} (${t.title})`)
      .join("\n");
    return `⚠️ [Cooper SDD] Usage: /cooper:switch <track_id>\n\nAvailable active tracks:\n${available || "  (None)"}`;
  }

  const cleanTrackId = trackId.trim();
  const worktreePath = path.join(cooperRoot, ".worktrees", cleanTrackId);

  try {
    const stat = await fs.stat(worktreePath);
    if (stat.isDirectory()) {
      return `✓ [Cooper SDD] Switching to track: ${cleanTrackId}\n  Target: .worktrees/${cleanTrackId}\n  Worktree path: ${worktreePath}`;
    }
  } catch {
    // worktree directory not found
  }

  return `✗ [Cooper SDD] Worktree not found for track: ${cleanTrackId}\n  Expected path: .worktrees/${cleanTrackId}\n  Run 'cooper track new ${cleanTrackId}' to spawn a new worktree.`;
}
