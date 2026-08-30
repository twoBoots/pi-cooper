import * as path from "node:path";
import * as fs from "node:fs/promises";
import { isTrackMetadata, type TrackMetadata } from "../types.js";

export interface RegistryTrackEntry {
  id: string;
  title: string;
  completed: boolean;
  worktree: string;
  link: string;
}

export interface PlanSummary {
  totalPhases: number;
  currentPhase: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
}

/**
 * Searches upwards from startDir to locate the directory containing `.cooper/index.md`
 */
export async function findCooperRoot(startDir: string): Promise<string | null> {
  let current = path.resolve(startDir);
  while (true) {
    try {
      const cooperIndex = path.join(current, ".cooper", "index.md");
      const stat = await fs.stat(cooperIndex);
      if (stat.isFile()) {
        return current;
      }
    } catch {
      // not found in current directory, continue up
    }

    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }
  return null;
}

/**
 * Parses .cooper/tracks.md into structured track entries
 */
export async function readTracksRegistry(rootDir: string): Promise<RegistryTrackEntry[]> {
  const tracksMdPath = path.join(rootDir, ".cooper", "tracks.md");
  try {
    const content = await fs.readFile(tracksMdPath, "utf8");
    const tracks: RegistryTrackEntry[] = [];
    const lines = content.split("\n");

    let currentTrack: Partial<RegistryTrackEntry> | null = null;

    for (const line of lines) {
      const trackMatch = line.match(/^-\s*\[([ xX])\]\s*\*\*Track:\s*([^*]+)\*\*\s*\(`([^`]+)`\)/);
      if (trackMatch) {
        if (currentTrack?.id && currentTrack.title) {
          tracks.push(currentTrack as RegistryTrackEntry);
        }
        currentTrack = {
          completed: trackMatch[1]?.toLowerCase() === "x",
          title: trackMatch[2]?.trim() ?? "",
          id: trackMatch[3]?.trim() ?? "",
          worktree: "",
          link: "",
        };
        continue;
      }

      if (currentTrack) {
        const worktreeMatch = line.match(/^\s*-\s*Worktree:\s*`([^`]+)`/);
        if (worktreeMatch) {
          currentTrack.worktree = worktreeMatch[1]?.trim() ?? "";
        }

        const linkMatch = line.match(/^\s*-\s*Link:\s*\[[^\]]+\]\(([^)]+)\)/);
        if (linkMatch) {
          currentTrack.link = linkMatch[1]?.trim() ?? "";
        }
      }
    }

    if (currentTrack?.id && currentTrack.title) {
      tracks.push(currentTrack as RegistryTrackEntry);
    }

    return tracks;
  } catch {
    return [];
  }
}

/**
 * Parses a track's plan.md to compute phase and task statistics
 */
export async function readTrackPlan(planFilePath: string): Promise<PlanSummary> {
  const defaultSummary: PlanSummary = {
    totalPhases: 0,
    currentPhase: "None",
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    pendingTasks: 0,
  };

  try {
    const content = await fs.readFile(planFilePath, "utf8");
    const lines = content.split("\n");

    let phasesCount = 0;
    let currentPhase = "";
    let totalTasks = 0;
    let completedTasks = 0;
    let inProgressTasks = 0;
    let pendingTasks = 0;

    for (const line of lines) {
      if (line.startsWith("## Phase")) {
        phasesCount++;
        if (!currentPhase) {
          currentPhase = line.replace(/^##\s*/, "").trim();
        }
        continue;
      }

      const taskMatch = line.match(/^-\s*\[([ xX~])\]\s*Task:\s*(.+)/);
      if (taskMatch) {
        totalTasks++;
        const state = taskMatch[1];
        if (state === "x" || state === "X") {
          completedTasks++;
        } else if (state === "~") {
          inProgressTasks++;
        } else {
          pendingTasks++;
        }
      }
    }

    // Find the latest phase with pending or in-progress tasks
    let lastActivePhase = "";
    let activePhaseCandidate = "";
    for (const line of lines) {
      if (line.startsWith("## Phase")) {
        activePhaseCandidate = line.replace(/^##\s*/, "").trim();
      }
      const taskMatch = line.match(/^-\s*\[([ ~])\]\s*Task:\s*(.+)/);
      if (taskMatch && activePhaseCandidate) {
        lastActivePhase = activePhaseCandidate;
        break;
      }
    }

    return {
      totalPhases: phasesCount,
      currentPhase: lastActivePhase || currentPhase || "Phase 1",
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
    };
  } catch {
    return defaultSummary;
  }
}

/**
 * Safely reads metadata.json from a track directory
 */
export async function readTrackMetadata(trackDir: string): Promise<TrackMetadata | null> {
  const metaPath = path.join(trackDir, "metadata.json");
  try {
    const content = await fs.readFile(metaPath, "utf8");
    const parsed: unknown = JSON.parse(content);
    if (isTrackMetadata(parsed)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Lists all active track metadata in .cooper/active/
 */
export async function listActiveTracks(rootDir: string): Promise<TrackMetadata[]> {
  const activeDir = path.join(rootDir, ".cooper", "active");
  const tracks: TrackMetadata[] = [];

  try {
    const entries = await fs.readdir(activeDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const meta = await readTrackMetadata(path.join(activeDir, entry.name));
        if (meta) {
          tracks.push(meta);
        }
      }
    }
  } catch {
    // active dir may not exist
  }

  return tracks;
}
