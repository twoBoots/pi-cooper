import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { PhaseGatekeeper } from "./phase-gatekeeper.js";

describe("PhaseGatekeeper", () => {
  let tmpDir: string;
  let cooperDir: string;
  let trackDir: string;
  let planPath: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cooper-gatekeeper-test-"));
    cooperDir = path.join(tmpDir, ".cooper");
    await fs.mkdir(cooperDir, { recursive: true });
    await fs.writeFile(path.join(cooperDir, "index.md"), "# Project Context");
    trackDir = path.join(cooperDir, "active", "track-gate");
    await fs.mkdir(trackDir, { recursive: true });
    planPath = path.join(trackDir, "plan.md");
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("should block advancement when phase has incomplete tasks", async () => {
    const planContent = `# Implementation Plan

## Phase 1: Core
- [x] Task: Done Task (1234567)
- [ ] Task: Incomplete Task
- [ ] Task: Phase 1 Verification & Checkpoint
`;
    await fs.writeFile(planPath, planContent);

    const gatekeeper = new PhaseGatekeeper({ workspacePath: tmpDir });
    const result = await gatekeeper.verifyPhaseCompletion({
      trackId: "track-gate",
      phaseIndex: 1,
      testRunner: async () => ({ success: true }),
    });

    expect(result.canAdvance).toBe(false);
    expect(result.reason).toContain("incomplete tasks");
    expect(result.pendingTasks).toContain("Incomplete Task");
  });

  it("should block advancement when automated test runner fails", async () => {
    const planContent = `# Implementation Plan

## Phase 1: Core
- [x] Task: Done Task 1 (1234567)
- [x] Task: Done Task 2 (2345678)
- [ ] Task: Phase 1 Verification & Checkpoint
`;
    await fs.writeFile(planPath, planContent);

    const gatekeeper = new PhaseGatekeeper({ workspacePath: tmpDir });
    const result = await gatekeeper.verifyPhaseCompletion({
      trackId: "track-gate",
      phaseIndex: 1,
      testRunner: async () => ({ success: false, error: "Assertion failure" }),
    });

    expect(result.canAdvance).toBe(false);
    expect(result.reason).toContain("Automated tests failed");
  });

  it("should allow phase advancement when all functional tasks complete and tests pass", async () => {
    const planContent = `# Implementation Plan

## Phase 1: Core
- [x] Task: Done Task 1 (1234567)
- [x] Task: Done Task 2 (2345678)
- [ ] Task: Phase 1 Verification & Checkpoint
`;
    await fs.writeFile(planPath, planContent);

    const gatekeeper = new PhaseGatekeeper({ workspacePath: tmpDir });
    const result = await gatekeeper.verifyPhaseCompletion({
      trackId: "track-gate",
      phaseIndex: 1,
      testRunner: async () => ({ success: true }),
    });

    expect(result.canAdvance).toBe(true);
    expect(result.pendingTasks).toHaveLength(0);
  });
});
