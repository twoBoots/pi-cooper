import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { SpecDeltaInterceptor } from "./spec-interceptor.js";

describe("SpecDeltaInterceptor", () => {
  let tmpDir: string;
  let cooperDir: string;
  let activeTrackDir: string;
  let specDeltasDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cooper-interceptor-test-"));
    cooperDir = path.join(tmpDir, ".cooper");
    await fs.mkdir(cooperDir, { recursive: true });
    await fs.writeFile(path.join(cooperDir, "index.md"), "# Project Context");

    const specsDir = path.join(cooperDir, "specs", "test-cap");
    await fs.mkdir(specsDir, { recursive: true });
    await fs.writeFile(path.join(specsDir, "spec.md"), "# Capability Spec: test-cap\n\n### Requirement: Core\n#### Scenario: Work\n- GIVEN a\n- WHEN b\n- THEN c\n");

    activeTrackDir = path.join(cooperDir, "active", "track-test");
    specDeltasDir = path.join(activeTrackDir, "spec-deltas", "test-cap");
    await fs.mkdir(specDeltasDir, { recursive: true });

    await fs.writeFile(
      path.join(activeTrackDir, "metadata.json"),
      JSON.stringify({
        track_id: "track-test",
        title: "Test Track",
        type: "feature",
        status: "in_progress",
        created_at: new Date().toISOString(),
      })
    );
  });

  afterEach(async () => {
    delete process.env.COOPER_BYPASS_SPEC_CHECK;
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("should allow changes when valid spec delta exists for modified capability", async () => {
    const validSpecDelta = `# Spec Delta: test-cap\n\n### Requirement: Core\n#### Scenario: Work\n- GIVEN initial state\n- WHEN action happens\n- THEN expected result\n`;
    await fs.writeFile(path.join(specDeltasDir, "spec.md"), validSpecDelta);

    const interceptor = new SpecDeltaInterceptor({ workspacePath: tmpDir });
    const result = await interceptor.validateTrackChanges({
      trackId: "track-test",
      modifiedFiles: ["src/test-cap/handler.ts"],
    });

    expect(result.allowed).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("should block changes when spec delta has invalid GIVEN/WHEN/THEN format", async () => {
    const invalidSpecDelta = `# Spec Delta: test-cap\n\n### Requirement: Core\n#### Scenario: Work\n- invalid step without keyword\n`;
    await fs.writeFile(path.join(specDeltasDir, "spec.md"), invalidSpecDelta);

    const interceptor = new SpecDeltaInterceptor({ workspacePath: tmpDir });
    const result = await interceptor.validateTrackChanges({
      trackId: "track-test",
      modifiedFiles: ["src/test-cap/handler.ts"],
    });

    expect(result.allowed).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues[0]?.message).toMatch(/GIVEN, WHEN, THEN/);
  });

  it("should block changes when spec delta is missing for active track", async () => {
    await fs.rm(path.join(specDeltasDir, "spec.md"), { force: true });

    const interceptor = new SpecDeltaInterceptor({ workspacePath: tmpDir });
    const result = await interceptor.validateTrackChanges({
      trackId: "track-test",
      modifiedFiles: ["src/test-cap/handler.ts"],
    });

    expect(result.allowed).toBe(false);
    expect(result.issues.some((i) => i.message.includes("No valid spec deltas found"))).toBe(true);
  });

  it("should allow override when bypass option is explicitly passed", async () => {
    await fs.rm(path.join(specDeltasDir, "spec.md"), { force: true });

    const interceptor = new SpecDeltaInterceptor({ workspacePath: tmpDir });
    const result = await interceptor.validateTrackChanges({
      trackId: "track-test",
      modifiedFiles: ["src/test-cap/handler.ts"],
      bypass: true,
    });

    expect(result.allowed).toBe(true);
    expect(result.bypassUsed).toBe(true);
  });

  it("should allow override when COOPER_BYPASS_SPEC_CHECK env var is set", async () => {
    process.env.COOPER_BYPASS_SPEC_CHECK = "1";
    await fs.rm(path.join(specDeltasDir, "spec.md"), { force: true });

    const interceptor = new SpecDeltaInterceptor({ workspacePath: tmpDir });
    const result = await interceptor.validateTrackChanges({
      trackId: "track-test",
      modifiedFiles: ["src/test-cap/handler.ts"],
    });

    expect(result.allowed).toBe(true);
    expect(result.bypassUsed).toBe(true);
  });
});
