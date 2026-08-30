import * as path from "node:path";
import { findCooperRoot, listActiveTracks, readTrackPlan } from "../utils/cooper-fs.js";
import { renderProgressBar } from "../utils/format.js";

/**
 * Executes /cooper:checkpoint in-process
 */
export async function handleCheckpointCommand(workspacePath?: string): Promise<string> {
  const currentDir = workspacePath ?? process.cwd();
  const cooperRoot = await findCooperRoot(currentDir);

  if (!cooperRoot) {
    return "⚠️ [Cooper SDD] Not in a Cooper SDD workspace (no .cooper/ directory found).\nRun 'cooper init' to initialize Cooper in this project.";
  }

  const activeTracks = await listActiveTracks(cooperRoot);

  if (activeTracks.length === 0) {
    return "🛢️ [Cooper SDD] No active track in current workspace to checkpoint.";
  }

  const lines: string[] = ["🛢️ [Cooper SDD] Phase Checkpoint Protocol:", ""];

  for (const track of activeTracks) {
    const trackDir = path.join(cooperRoot, ".cooper", "active", track.track_id);
    const planPath = path.join(trackDir, "plan.md");
    const plan = await readTrackPlan(planPath);
    const progress = renderProgressBar(plan.completedTasks, plan.totalTasks);

    lines.push(`• Track: ${track.title} (${track.track_id})`);
    lines.push(`  Current Phase: ${plan.currentPhase}`);
    lines.push(`  Progress: ${progress}`);
    lines.push("");
    lines.push("  Checkpoint Steps:");
    lines.push("  1. Run automated test suite (`npm run test:coverage`)");
    lines.push("  2. Perform phase verification with user");
    lines.push(`  3. Record checkpoint: 'cooper track checkpoint ${track.track_id}'`);
    lines.push(`  4. Push remote sync: 'git push origin ${track.track_id}'`);
  }

  return lines.join("\n");
}
