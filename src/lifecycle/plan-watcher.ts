import { EventEmitter } from "node:events";
import * as fs from "node:fs/promises";

export interface ParsedPlanTask {
  phaseIndex: number;
  phaseTitle: string;
  title: string;
  completed: boolean;
  inProgress: boolean;
  commitSha?: string;
}

export interface PhaseCompletedEvent {
  phaseIndex: number;
  phaseTitle: string;
}

export interface PlanWatcherOptions {
  planPath: string;
  pollIntervalMs?: number;
}

/**
 * Parses phase and task status items from plan.md markdown
 */
export function parsePlanTasks(content: string): ParsedPlanTask[] {
  const lines = content.split("\n");
  const tasks: ParsedPlanTask[] = [];

  let currentPhaseIndex = 0;
  let currentPhaseTitle = "";

  for (const line of lines) {
    const phaseMatch = line.match(/^##\s+Phase\s+(\d+):\s*(.+)$/i);
    if (phaseMatch) {
      currentPhaseIndex = parseInt(phaseMatch[1]!, 10);
      currentPhaseTitle = phaseMatch[2]!.trim();
      continue;
    }

    const taskMatch = line.match(/^\s*-\s*\[([ x~])\]\s+Task:\s*([^(]+)(?:\(([^)]+)\))?/i);
    if (taskMatch && currentPhaseIndex > 0) {
      const mark = taskMatch[1]!;
      const rawTitle = taskMatch[2]!.trim();
      const rawSha = taskMatch[3]?.trim();

      const completed = mark === "x";
      const inProgress = mark === "~";

      tasks.push({
        phaseIndex: currentPhaseIndex,
        phaseTitle: currentPhaseTitle,
        title: rawTitle,
        completed,
        inProgress,
        commitSha: rawSha,
      });
    }
  }

  return tasks;
}

/**
 * Watches a track's plan.md file and emits events when tasks or phases complete
 */
export class PlanWatcher extends EventEmitter {
  private readonly planPath: string;
  private readonly pollIntervalMs: number;
  private timer?: NodeJS.Timeout;
  private lastTasks: Map<string, ParsedPlanTask> = new Map();
  private completedPhases: Set<number> = new Set();
  private isRunning = false;

  constructor(options: PlanWatcherOptions) {
    super();
    this.planPath = options.planPath;
    this.pollIntervalMs = options.pollIntervalMs ?? 200;
  }

  /**
   * Starts watching plan.md for state transitions
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    await this.checkPlan();

    this.timer = setInterval(async () => {
      if (!this.isRunning) return;
      await this.checkPlan();
    }, this.pollIntervalMs);
  }

  /**
   * Stops the watcher
   */
  public stop(): void {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
    this.removeAllListeners();
  }

  private async checkPlan(): Promise<void> {
    try {
      const content = await fs.readFile(this.planPath, "utf8");
      const currentTasks = parsePlanTasks(content);

      for (const task of currentTasks) {
        const key = `${task.phaseIndex}:${task.title}`;
        const prev = this.lastTasks.get(key);

        if (task.completed && (!prev || !prev.completed)) {
          this.emit("taskCompleted", task);
        }

        this.lastTasks.set(key, task);
      }

      // Check for phase completions
      const phaseGroups = new Map<number, { title: string; tasks: ParsedPlanTask[] }>();
      for (const task of currentTasks) {
        const group = phaseGroups.get(task.phaseIndex) ?? {
          title: task.phaseTitle,
          tasks: [],
        };
        group.tasks.push(task);
        phaseGroups.set(task.phaseIndex, group);
      }

      for (const [phaseIdx, group] of phaseGroups.entries()) {
        const allCompleted = group.tasks.length > 0 && group.tasks.every((t) => t.completed);
        if (allCompleted && !this.completedPhases.has(phaseIdx)) {
          this.completedPhases.add(phaseIdx);
          this.emit("phaseCompleted", {
            phaseIndex: phaseIdx,
            phaseTitle: group.title,
          });
        }
      }
    } catch {
      // file may be momentarily absent or unreadable
    }
  }
}
