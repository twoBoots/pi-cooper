import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { PlanWatcher, parsePlanTasks, type ParsedPlanTask } from "./plan-watcher.js";

describe("PlanWatcher & Plan Parser", () => {
  let tmpDir: string;
  let planPath: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cooper-plan-watcher-test-"));
    planPath = path.join(tmpDir, "plan.md");
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe("parsePlanTasks", () => {
    it("should parse phases and tasks with completion status", () => {
      const planContent = `# Implementation Plan

## Phase 1: Foundation
- [x] Task: Initial Setup (abc1234)
- [ ] Task: Second Task

## Phase 2: Implementation
- [~] Task: In Progress Task
- [ ] Task: Fourth Task
`;

      const tasks: ParsedPlanTask[] = parsePlanTasks(planContent);

      expect(tasks).toHaveLength(4);
      expect(tasks[0]).toEqual({
        phaseIndex: 1,
        phaseTitle: "Foundation",
        title: "Initial Setup",
        completed: true,
        inProgress: false,
        commitSha: "abc1234",
      });
      expect(tasks[1]?.completed).toBe(false);
      expect(tasks[2]?.inProgress).toBe(true);
      expect(tasks[2]?.completed).toBe(false);
    });
  });

  describe("PlanWatcher", () => {
    it("should emit taskCompleted when a task is checked off in plan.md", async () => {
      const initialPlan = `# Implementation Plan

## Phase 1: Foundation
- [ ] Task: Setup Config
`;
      await fs.writeFile(planPath, initialPlan);

      const watcher = new PlanWatcher({ planPath, pollIntervalMs: 50 });
      const taskCompletedSpy = vi.fn();
      watcher.on("taskCompleted", taskCompletedSpy);

      await watcher.start();

      const updatedPlan = `# Implementation Plan

## Phase 1: Foundation
- [x] Task: Setup Config (def5678)
`;
      await fs.writeFile(planPath, updatedPlan);

      // wait for watcher poll
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(taskCompletedSpy).toHaveBeenCalledTimes(1);
      expect(taskCompletedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Setup Config",
          completed: true,
          commitSha: "def5678",
        })
      );

      watcher.stop();
    });

    it("should emit phaseCompleted when all tasks in a phase are complete", async () => {
      const initialPlan = `# Implementation Plan

## Phase 1: Foundation
- [x] Task: Setup Config
- [ ] Task: Setup Lint
`;
      await fs.writeFile(planPath, initialPlan);

      const watcher = new PlanWatcher({ planPath, pollIntervalMs: 50 });
      const phaseCompletedSpy = vi.fn();
      watcher.on("phaseCompleted", phaseCompletedSpy);

      await watcher.start();

      const updatedPlan = `# Implementation Plan

## Phase 1: Foundation
- [x] Task: Setup Config
- [x] Task: Setup Lint
`;
      await fs.writeFile(planPath, updatedPlan);

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(phaseCompletedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          phaseIndex: 1,
          phaseTitle: "Foundation",
        })
      );

      watcher.stop();
    });
  });
});
