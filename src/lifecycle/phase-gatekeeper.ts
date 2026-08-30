import * as path from "node:path";
import * as fs from "node:fs/promises";
import { findCooperRoot } from "../utils/cooper-fs.js";
import { parsePlanTasks, type ParsedPlanTask } from "./plan-watcher.js";

export interface TestRunnerResult {
  success: boolean;
  error?: string;
}

export type TestRunnerFn = () => Promise<TestRunnerResult>;

export interface PhaseVerificationOptions {
  trackId: string;
  phaseIndex: number;
  testRunner?: TestRunnerFn;
}

export interface PhaseVerificationResult {
  canAdvance: boolean;
  reason?: string;
  pendingTasks: string[];
}

export interface PhaseGatekeeperOptions {
  workspacePath?: string;
}

/**
 * Gatekeeper enforcing phase completion criteria and automated test verification
 */
export class PhaseGatekeeper {
  private readonly workspacePath?: string;

  constructor(options: PhaseGatekeeperOptions = {}) {
    this.workspacePath = options.workspacePath;
  }

  /**
   * Verifies that all functional tasks in a phase are complete and automated tests pass
   */
  public async verifyPhaseCompletion(
    options: PhaseVerificationOptions
  ): Promise<PhaseVerificationResult> {
    const currentDir = this.workspacePath ?? process.cwd();
    const cooperRoot = await findCooperRoot(currentDir);

    if (!cooperRoot) {
      return {
        canAdvance: false,
        reason: "Not inside a valid Cooper workspace (no .cooper/ directory found)",
        pendingTasks: [],
      };
    }

    const planPath = path.join(
      cooperRoot,
      ".cooper",
      "active",
      options.trackId,
      "plan.md"
    );

    let planContent: string;
    try {
      planContent = await fs.readFile(planPath, "utf8");
    } catch {
      return {
        canAdvance: false,
        reason: `Could not read plan.md for track '${options.trackId}'`,
        pendingTasks: [],
      };
    }

    const tasks = parsePlanTasks(planContent);
    const phaseTasks = tasks.filter((t) => t.phaseIndex === options.phaseIndex);

    // Filter out meta checkpoint tasks
    const functionalTasks = phaseTasks.filter(
      (t) => !/verification\s*&\s*checkpoint|checkpoint/i.test(t.title)
    );

    const incompleteTasks: ParsedPlanTask[] = functionalTasks.filter((t) => !t.completed);

    if (incompleteTasks.length > 0) {
      return {
        canAdvance: false,
        reason: `Phase ${options.phaseIndex} has ${incompleteTasks.length} incomplete tasks`,
        pendingTasks: incompleteTasks.map((t) => t.title),
      };
    }

    if (options.testRunner) {
      const testResult = await options.testRunner();
      if (!testResult.success) {
        return {
          canAdvance: false,
          reason: `Automated tests failed: ${testResult.error ?? "Test failure"}`,
          pendingTasks: [],
        };
      }
    }

    return {
      canAdvance: true,
      pendingTasks: [],
    };
  }
}
