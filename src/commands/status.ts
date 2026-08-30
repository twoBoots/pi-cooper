import * as path from "node:path";
import {
  findCooperRoot,
  listActiveTracks,
  readTrackPlan,
  readTracksRegistry,
} from "../utils/cooper-fs.js";
import {
  formatStatusBadge,
  renderProgressBar,
  formatTracksList,
} from "../utils/format.js";

/**
 * Executes /cooper:status in-process in <5ms
 */
export async function handleStatusCommand(workspacePath?: string): Promise<string> {
  const currentDir = workspacePath ?? process.cwd();
  const cooperRoot = await findCooperRoot(currentDir);

  if (!cooperRoot) {
    return "⚠️ [Cooper SDD] Not in a Cooper SDD workspace (no .cooper/ directory found).\nRun 'cooper init' to initialize Cooper in this project.";
  }

  const activeTracks = await listActiveTracks(cooperRoot);

  if (activeTracks.length === 0) {
    const registered = await readTracksRegistry(cooperRoot);
    const tracksList = formatTracksList(registered);
    return `🛢️ [Cooper SDD] Status: Idle (No active track in current workspace)\n\n${tracksList}`;
  }

  const outputLines: string[] = ["🛢️ [Cooper SDD] Active Track Status:", ""];

  for (const track of activeTracks) {
    const trackDir = path.join(cooperRoot, ".cooper", "active", track.track_id);
    const planPath = path.join(trackDir, "plan.md");
    const plan = await readTrackPlan(planPath);
    const progressBar = renderProgressBar(plan.completedTasks, plan.totalTasks);
    const badge = formatStatusBadge(track.status);

    outputLines.push(`• Track: ${track.title} (${track.track_id}) ${badge}`);
    outputLines.push(`  Phase: ${plan.currentPhase}`);
    outputLines.push(`  Progress: ${progressBar}`);
    outputLines.push(`  Worktree: .worktrees/${track.track_id}`);
    outputLines.push("");
  }

  return outputLines.join("\n").trimEnd();
}
