import { findCooperRoot, readTracksRegistry } from "../utils/cooper-fs.js";
import {
  resolveWorktreePath,
  switchWorkspace,
  syncTrustRegistry,
} from "../utils/worktree.js";
import type { ExtensionContext } from "../types.js";

/**
 * Executes /cooper:switch <track_id> in-process, switching process.cwd() and updating trust store
 */
export async function handleSwitchCommand(
  trackId?: string,
  contextOrPath?: ExtensionContext | string
): Promise<string> {
  const context = typeof contextOrPath === "object" && contextOrPath !== null
    ? contextOrPath
    : undefined;

  const currentDir = typeof contextOrPath === "string"
    ? contextOrPath
    : context?.workspacePath ?? process.cwd();

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

  const resolved = await resolveWorktreePath(cooperRoot, trackId);

  if (!resolved.exists) {
    return `✗ [Cooper SDD] Worktree not found for track: ${resolved.trackId}\n  Expected path: .worktrees/${resolved.trackId}\n  Run 'cooper track new ${resolved.trackId}' to spawn a new worktree.`;
  }

  const switchResult = await switchWorkspace(resolved.path, context);
  if (!switchResult.success) {
    return `✗ [Cooper SDD] Failed to switch workspace to ${resolved.path}: ${switchResult.error ?? "Unknown error"}`;
  }

  const trustResult = await syncTrustRegistry(switchResult.currentPath);
  const trustMsg = trustResult.added
    ? "Added to Pi trust store"
    : "Verified in Pi trust store";

  return `✓ [Cooper SDD] Switched workspace to track: ${resolved.trackId}\n  Current working directory: ${switchResult.currentPath}\n  Trust: ${trustMsg}`;
}
