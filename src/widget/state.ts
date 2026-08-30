import * as path from "node:path";
import * as fs from "node:fs/promises";
import type { WidgetState } from "./formatter.js";
import {
  findCooperRoot,
  readTracksRegistry,
  readTrackPlan,
  listActiveTracks,
} from "../utils/cooper-fs.js";

/**
 * Inspects the workspace and extracts the current SDD status for the TUI widget
 */
export async function extractWidgetState(workspacePath?: string): Promise<WidgetState> {
  const currentDir = workspacePath ?? process.cwd();
  const cooperRoot = await findCooperRoot(currentDir);

  if (!cooperRoot) {
    return { mode: "uninitialized" };
  }

  const registryTracks = await readTracksRegistry(cooperRoot);
  const activeTracks = await listActiveTracks(cooperRoot);

  if (activeTracks.length === 0) {
    const availableTracksCount = registryTracks.filter((t) => !t.completed).length;
    return {
      mode: "idle",
      availableTracksCount,
    };
  }

  // Use the first active track
  const activeTrack = activeTracks[0]!;
  const trackId = activeTrack.track_id;
  const trackTitle = activeTrack.title;
  const trackDir = path.join(cooperRoot, ".cooper", "active", trackId);
  const planPath = path.join(trackDir, "plan.md");
  const deltasDir = path.join(trackDir, "spec-deltas");

  const planSummary = await readTrackPlan(planPath);
  const { isValid, issues } = await checkSpecDeltasValidity(deltasDir);

  // Extract current phase 1-based index
  let currentPhaseIndex = 1;
  if (planSummary.currentPhase) {
    const match = planSummary.currentPhase.match(/Phase\s*(\d+)/i);
    if (match && match[1]) {
      currentPhaseIndex = parseInt(match[1], 10);
    }
  }

  return {
    mode: "active",
    trackId,
    trackTitle,
    currentPhaseIndex,
    totalPhases: Math.max(1, planSummary.totalPhases),
    completedTasks: planSummary.completedTasks,
    totalTasks: planSummary.totalTasks,
    specValid: isValid,
    specIssues: issues,
    availableTracksCount: registryTracks.filter((t) => !t.completed).length,
  };
}

/**
 * Validates GIVEN/WHEN/THEN format of all markdown specs within a spec-deltas directory
 */
async function checkSpecDeltasValidity(
  deltasDir: string
): Promise<{ isValid: boolean; issues: string[] }> {
  const issues: string[] = [];

  try {
    const entries = await fs.readdir(deltasDir, { withFileTypes: true, recursive: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".md")) {
        const fullPath = path.join(entry.parentPath ?? deltasDir, entry.name);
        await auditSpecFile(fullPath, issues);
      }
    }
  } catch {
    // deltasDir may not exist or be empty
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

async function auditSpecFile(filePath: string, issues: string[]): Promise<void> {
  try {
    const content = await fs.readFile(filePath, "utf8");
    const lines = content.split("\n");

    let inScenario = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const lineNum = i + 1;

      if (line.includes("Scenario:")) {
        inScenario = true;
        continue;
      }

      if (line.startsWith("### ") || line.startsWith("## ") || line.startsWith("---")) {
        inScenario = false;
      }

      if (inScenario && line.trim().startsWith("- ")) {
        const step = line.replace(/^\s*-\s*/, "");
        const validKeyword = /^(GIVEN|WHEN|THEN|AND)\b/i.test(step);
        if (!validKeyword) {
          issues.push(`${path.basename(filePath)}:${lineNum} - Step must start with GIVEN/WHEN/THEN/AND`);
        }
      }
    }
  } catch (err) {
    issues.push(`Failed to read ${path.basename(filePath)}: ${err instanceof Error ? err.message : String(err)}`);
  }
}
